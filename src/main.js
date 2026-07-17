import {
  ChartNoAxesColumnIncreasing,
  CircleCheck,
  Eraser,
  Grid3X3,
  Lightbulb,
  Moon,
  Pause,
  Pencil,
  Play,
  Plus,
  RefreshCw,
  RotateCcw,
  Settings2,
  Share2,
  SlidersHorizontal,
  Sparkles,
  Square,
  Sun,
  Timer,
  Trophy,
  Undo2,
  WandSparkles,
  X,
  createIcons,
} from 'lucide';
import './styles.css';
import {
  DIFFICULTIES,
  LETTER_SETS,
  createPuzzle,
  displayValue,
  formatTime,
  getCandidates,
  getDuplicateConflicts,
  getPeers,
  isSolved,
  isValidSavedGame,
} from './game.js';
import {
  WORD_SEARCH_LANGUAGES,
  createWordSearch,
  findWordSearchMatch,
  getSnappedWordSearchSelection,
  getWordSearchSelection,
  isValidWordSearchSavedGame,
} from './word-search.js';
import {
  createNonogram,
  getNonogramProgress,
  isNonogramLineComplete,
  isNonogramSolved,
  isValidNonogramSavedGame,
} from './nonogram.js';

const ICONS = {
  ChartNoAxesColumnIncreasing,
  CircleCheck,
  Eraser,
  Grid3X3,
  Lightbulb,
  Moon,
  Pause,
  Pencil,
  Play,
  Plus,
  RefreshCw,
  RotateCcw,
  Settings2,
  Share2,
  SlidersHorizontal,
  Sparkles,
  Square,
  Sun,
  Timer,
  Trophy,
  Undo2,
  WandSparkles,
  X,
  Grid3x3: Grid3X3,
};

const STORAGE_KEY = 'ninefold-active-game-v1';
const SETTINGS_KEY = 'ninefold-settings-v1';
const BEST_TIMES_KEY = 'ninefold-best-times-v1';

const refs = {
  board: document.querySelector('#sudokuBoard'),
  numberPad: document.querySelector('#numberPad'),
  timer: document.querySelector('#timerDisplay'),
  pauseButton: document.querySelector('#pauseButton'),
  pauseScreen: document.querySelector('#pauseScreen'),
  resumeButton: document.querySelector('#resumeButton'),
  sudokuMode: document.querySelector('#sudokuMode'),
  wordokuMode: document.querySelector('#wordokuMode'),
  wordSearchMode: document.querySelector('#wordSearchMode'),
  nonogramMode: document.querySelector('#nonogramMode'),
  modeEyebrow: document.querySelector('#modeEyebrow'),
  gameHeading: document.querySelector('#gameHeading'),
  gameStatusText: document.querySelector('#gameStatusText'),
  themeColorMeta: document.querySelector('#themeColorMeta'),
  themeToggle: document.querySelector('#themeToggle'),
  difficulty: document.querySelector('#difficultySelect'),
  letterSet: document.querySelector('#letterSetSelect'),
  wordokuOptions: document.querySelector('#wordokuOptions'),
  wordSearchOptions: document.querySelector('#wordSearchOptions'),
  wordSearchLanguage: document.querySelector('#wordSearchLanguageSelect'),
  wordSearchPanel: document.querySelector('#wordSearchPanel'),
  wordSearchWords: document.querySelector('#wordSearchWords'),
  wordSearchFoundCount: document.querySelector('#wordSearchFoundCount'),
  wordSearchListEyebrow: document.querySelector('#wordSearchListEyebrow'),
  wordSearchListHeading: document.querySelector('#wordSearchListHeading'),
  nonogramControls: document.querySelector('#nonogramControls'),
  nonogramFillButton: document.querySelector('#nonogramFillButton'),
  nonogramCrossButton: document.querySelector('#nonogramCrossButton'),
  autoCheck: document.querySelector('#autoCheckToggle'),
  mistakeCount: document.querySelector('#mistakeCount'),
  hintsLeft: document.querySelector('#hintsLeft'),
  bestTime: document.querySelector('#bestTime'),
  progressText: document.querySelector('#progressText'),
  progressLabel: document.querySelector('#progressLabel'),
  mistakeLabel: document.querySelector('#mistakeLabel'),
  progressTrack: document.querySelector('.progress-track'),
  progressFill: document.querySelector('#progressFill'),
  undoButton: document.querySelector('#undoButton'),
  eraseButton: document.querySelector('#eraseButton'),
  notesButton: document.querySelector('#notesButton'),
  hintButton: document.querySelector('#hintButton'),
  hintBadge: document.querySelector('#hintBadge'),
  checkButton: document.querySelector('#checkButton'),
  autoNotesButton: document.querySelector('#autoNotesButton'),
  restartButton: document.querySelector('#restartButton'),
  puzzleToolsSection: document.querySelector('#puzzleToolsSection'),
  preferencesSection: document.querySelector('#preferencesSection'),
  newGameButton: document.querySelector('#newGameButton'),
  newGameDialog: document.querySelector('#newGameDialog'),
  confirmNewGame: document.querySelector('#confirmNewGame'),
  restartDialog: document.querySelector('#restartDialog'),
  restartDialogCopy: document.querySelector('#restartDialogCopy'),
  confirmRestart: document.querySelector('#confirmRestart'),
  successDialog: document.querySelector('#successDialog'),
  playAgainButton: document.querySelector('#playAgainButton'),
  shareResultButton: document.querySelector('#shareResultButton'),
  finalTime: document.querySelector('#finalTime'),
  finalMistakes: document.querySelector('#finalMistakes'),
  finalMistakeLabel: document.querySelector('#finalMistakeLabel'),
  finalDifficulty: document.querySelector('#finalDifficulty'),
  celebration: document.querySelector('#celebration'),
  toast: document.querySelector('#toast'),
};

let state;
let pendingGameOptions = null;
let timerBase = Date.now();
let toastTimer;
let wordSearchPointer = null;
let wordSearchKeyboardAnchor = null;
let suppressWordSearchClick = false;
let nonogramPointer = null;
let suppressNonogramClick = false;

function refreshIcons() {
  createIcons({ icons: ICONS, attrs: { 'stroke-width': 1.9 } });
}

function loadJson(key, fallback) {
  try {
    return JSON.parse(localStorage.getItem(key)) ?? fallback;
  } catch {
    return fallback;
  }
}

function loadSettings() {
  const settings = loadJson(SETTINGS_KEY, {});
  const systemTheme = window.matchMedia?.('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  return {
    autoCheck: settings.autoCheck !== false,
    letterSet: LETTER_SETS.includes(settings.letterSet) ? settings.letterSet : LETTER_SETS[0],
    wordSearchLanguage: WORD_SEARCH_LANGUAGES.includes(settings.wordSearchLanguage)
      ? settings.wordSearchLanguage
      : 'english',
    theme: ['light', 'dark'].includes(settings.theme) ? settings.theme : systemTheme,
  };
}

function newState(options = {}) {
  const settings = loadSettings();
  const difficulty = DIFFICULTIES.includes(options.difficulty) ? options.difficulty : 'medium';
  const mode = ['wordoku', 'wordsearch', 'nonogram'].includes(options.mode) ? options.mode : 'sudoku';
  const wordSearchLanguage = WORD_SEARCH_LANGUAGES.includes(options.wordSearchLanguage)
    ? options.wordSearchLanguage
    : settings.wordSearchLanguage;

  if (mode === 'nonogram') {
    const generated = createNonogram(difficulty);
    return {
      mode,
      difficulty: generated.difficulty,
      wordSearchLanguage,
      letterSet: LETTER_SETS.includes(options.letterSet) ? options.letterSet : settings.letterSet,
      autoCheck: settings.autoCheck,
      theme: settings.theme,
      size: generated.size,
      solution: generated.solution,
      rowClues: generated.rowClues,
      columnClues: generated.columnClues,
      values: Array(generated.solution.length).fill(null),
      wrongIndices: new Set(),
      hintedIndices: new Set(),
      selected: null,
      mistakes: 0,
      hints: 3,
      elapsed: 0,
      running: true,
      completed: false,
      nonogramTool: 'fill',
      history: [],
    };
  }

  if (mode === 'wordsearch') {
    const generated = createWordSearch(difficulty, wordSearchLanguage);
    return {
      mode,
      difficulty: generated.difficulty,
      wordSearchLanguage: generated.wordSearchLanguage,
      letterSet: LETTER_SETS.includes(options.letterSet) ? options.letterSet : settings.letterSet,
      autoCheck: settings.autoCheck,
      theme: settings.theme,
      themeName: generated.theme,
      size: generated.size,
      grid: generated.grid,
      words: generated.words,
      placements: generated.placements,
      foundWords: new Set(),
      foundSelections: [],
      wordSelection: [],
      wordHintCells: new Set(),
      selected: null,
      mistakes: 0,
      hints: 3,
      elapsed: 0,
      running: true,
      completed: false,
      history: [],
    };
  }

  const generated = createPuzzle(difficulty);

  return {
    mode,
    difficulty: generated.difficulty,
    wordSearchLanguage,
    letterSet: LETTER_SETS.includes(options.letterSet) ? options.letterSet : settings.letterSet,
    autoCheck: settings.autoCheck,
    theme: settings.theme,
    puzzle: generated.puzzle,
    solution: generated.solution,
    values: [...generated.puzzle],
    notes: Array.from({ length: 81 }, () => new Set()),
    wrongIndices: new Set(),
    hintedIndices: new Set(),
    selected: null,
    mistakes: 0,
    hints: 3,
    elapsed: 0,
    running: true,
    completed: false,
    notesMode: false,
    history: [],
  };
}

function restoreState() {
  const saved = loadJson(STORAGE_KEY, null);
  const settings = loadSettings();

  if (isValidNonogramSavedGame(saved)) {
    return {
      ...saved,
      autoCheck: settings.autoCheck,
      theme: settings.theme,
      letterSet: LETTER_SETS.includes(saved.letterSet) ? saved.letterSet : settings.letterSet,
      wordSearchLanguage: WORD_SEARCH_LANGUAGES.includes(saved.wordSearchLanguage)
        ? saved.wordSearchLanguage
        : settings.wordSearchLanguage,
      wrongIndices: new Set(saved.wrongIndices ?? []),
      hintedIndices: new Set(saved.hintedIndices ?? []),
      selected: Number.isInteger(saved.selected) ? saved.selected : null,
      mistakes: Number.isInteger(saved.mistakes) ? saved.mistakes : 0,
      hints: Number.isInteger(saved.hints) ? saved.hints : 3,
      elapsed: Number.isFinite(saved.elapsed) ? saved.elapsed : 0,
      running: saved.completed ? false : saved.running !== false,
      completed: Boolean(saved.completed),
      nonogramTool: ['fill', 'cross'].includes(saved.nonogramTool) ? saved.nonogramTool : 'fill',
      history: [],
    };
  }

  if (isValidWordSearchSavedGame(saved)) {
    const foundWords = new Set((saved.foundWords ?? []).filter((word) => saved.words.includes(word)));
    return {
      ...saved,
      autoCheck: settings.autoCheck,
      theme: settings.theme,
      letterSet: LETTER_SETS.includes(saved.letterSet) ? saved.letterSet : settings.letterSet,
      wordSearchLanguage: WORD_SEARCH_LANGUAGES.includes(saved.wordSearchLanguage)
        ? saved.wordSearchLanguage
        : 'english',
      foundWords,
      foundSelections: (saved.foundSelections ?? []).filter(({ word, cells }) => (
        foundWords.has(word)
        && Array.isArray(cells)
        && cells.every((index) => Number.isInteger(index) && index >= 0 && index < saved.grid.length)
      )),
      wordSelection: [],
      wordHintCells: new Set(saved.wordHintCells ?? []),
      selected: Number.isInteger(saved.selected) ? saved.selected : null,
      mistakes: Number.isInteger(saved.mistakes) ? saved.mistakes : 0,
      hints: Number.isInteger(saved.hints) ? saved.hints : 3,
      elapsed: Number.isFinite(saved.elapsed) ? saved.elapsed : 0,
      running: saved.completed ? false : saved.running !== false,
      completed: Boolean(saved.completed),
      history: [],
    };
  }

  if (!isValidSavedGame(saved)) return null;

  return {
    ...saved,
    autoCheck: settings.autoCheck,
    theme: settings.theme,
    letterSet: LETTER_SETS.includes(saved.letterSet) ? saved.letterSet : settings.letterSet,
    wordSearchLanguage: WORD_SEARCH_LANGUAGES.includes(saved.wordSearchLanguage)
      ? saved.wordSearchLanguage
      : settings.wordSearchLanguage,
    notes: Array.from({ length: 81 }, (_, index) => new Set(saved.notes?.[index] ?? [])),
    wrongIndices: new Set(saved.wrongIndices ?? []),
    hintedIndices: new Set(saved.hintedIndices ?? []),
    selected: Number.isInteger(saved.selected) ? saved.selected : null,
    mistakes: Number.isInteger(saved.mistakes) ? saved.mistakes : 0,
    hints: Number.isInteger(saved.hints) ? saved.hints : 3,
    elapsed: Number.isFinite(saved.elapsed) ? saved.elapsed : 0,
    running: saved.completed ? false : saved.running !== false,
    completed: Boolean(saved.completed),
    notesMode: false,
    history: [],
  };
}

function serializableState() {
  if (state.mode === 'nonogram') {
    return {
      ...state,
      wrongIndices: [...state.wrongIndices],
      hintedIndices: [...state.hintedIndices],
      history: undefined,
      savedAt: Date.now(),
    };
  }

  if (state.mode === 'wordsearch') {
    return {
      ...state,
      foundWords: [...state.foundWords],
      wordSelection: [],
      wordHintCells: [...state.wordHintCells],
      history: undefined,
      savedAt: Date.now(),
    };
  }

  return {
    ...state,
    notes: state.notes.map((notes) => [...notes]),
    wrongIndices: [...state.wrongIndices],
    hintedIndices: [...state.hintedIndices],
    history: undefined,
    savedAt: Date.now(),
  };
}

function saveState() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(serializableState()));
}

function saveSettings() {
  localStorage.setItem(
    SETTINGS_KEY,
    JSON.stringify({
      autoCheck: state.autoCheck,
      letterSet: state.letterSet,
      wordSearchLanguage: state.wordSearchLanguage,
      theme: state.theme,
    }),
  );
}

function bestTimeKey() {
  const languageSuffix = state.mode === 'wordsearch' && state.wordSearchLanguage === 'hindi' ? '-hindi' : '';
  return `${state.mode}${languageSuffix}-${state.difficulty}`;
}

function getBestTime() {
  return loadJson(BEST_TIMES_KEY, {})[bestTimeKey()] ?? null;
}

function saveBestTime() {
  const bestTimes = loadJson(BEST_TIMES_KEY, {});
  const key = bestTimeKey();
  if (!bestTimes[key] || state.elapsed < bestTimes[key]) {
    bestTimes[key] = state.elapsed;
    localStorage.setItem(BEST_TIMES_KEY, JSON.stringify(bestTimes));
  }
}

function buildBoard() {
  refs.board.replaceChildren();
  wordSearchPointer = null;
  wordSearchKeyboardAnchor = null;
  nonogramPointer = null;
  refs.board.className = state.mode === 'wordsearch'
    ? 'sudoku-board word-search-board'
    : state.mode === 'nonogram' ? 'sudoku-board nonogram-board' : 'sudoku-board';
  refs.board.style.removeProperty('--word-search-size');
  refs.board.style.removeProperty('--nonogram-size');
  delete refs.board.dataset.size;
  delete refs.board.dataset.language;
  refs.board.removeAttribute('lang');

  const fragment = document.createDocumentFragment();
  if (state.mode === 'nonogram') {
    refs.board.style.setProperty('--nonogram-size', String(state.size));
    refs.board.dataset.size = String(state.size);
    refs.board.setAttribute('aria-label', `${capitalize(state.difficulty)} Nonogram puzzle`);
    refs.board.setAttribute('aria-rowcount', String(state.size));
    refs.board.setAttribute('aria-colcount', String(state.size));

    const corner = document.createElement('span');
    corner.className = 'nonogram-corner';
    corner.setAttribute('aria-hidden', 'true');
    fragment.append(corner);

    state.columnClues.forEach((clues, column) => {
      const clue = document.createElement('span');
      clue.className = 'nonogram-clue nonogram-column-clue';
      clue.dataset.column = String(column);
      clue.setAttribute('role', 'columnheader');
      clue.setAttribute('aria-label', `Column ${column + 1}: ${clues.length ? clues.join(', ') : 'zero'}`);
      (clues.length ? clues : [0]).forEach((value) => {
        const number = document.createElement('span');
        number.textContent = String(value);
        clue.append(number);
      });
      fragment.append(clue);
    });

    for (let row = 0; row < state.size; row += 1) {
      const clues = state.rowClues[row];
      const clue = document.createElement('span');
      clue.className = 'nonogram-clue nonogram-row-clue';
      clue.dataset.row = String(row);
      clue.setAttribute('role', 'rowheader');
      clue.setAttribute('aria-label', `Row ${row + 1}: ${clues.length ? clues.join(', ') : 'zero'}`);
      (clues.length ? clues : [0]).forEach((value) => {
        const number = document.createElement('span');
        number.textContent = String(value);
        clue.append(number);
      });
      fragment.append(clue);

      for (let column = 0; column < state.size; column += 1) {
        const index = row * state.size + column;
        const cell = document.createElement('button');
        cell.className = 'nonogram-cell';
        cell.type = 'button';
        cell.dataset.index = String(index);
        cell.dataset.row = String(row);
        cell.dataset.column = String(column);
        cell.setAttribute('role', 'gridcell');
        cell.addEventListener('click', (event) => handleNonogramCellClick(event, index));
        cell.addEventListener('contextmenu', (event) => markNonogramCross(event, index));
        fragment.append(cell);
      }
    }
    refs.board.append(fragment);
    return;
  }

  if (state.mode === 'wordsearch') {
    refs.board.style.setProperty('--word-search-size', String(state.size));
    refs.board.dataset.size = String(state.size);
    refs.board.dataset.language = state.wordSearchLanguage;
    refs.board.lang = state.wordSearchLanguage === 'hindi' ? 'hi' : 'en';
    const languageLabel = state.wordSearchLanguage === 'hindi' ? 'Hindi ' : '';
    refs.board.setAttribute(
      'aria-label',
      `${capitalize(state.difficulty)} ${state.themeName} ${languageLabel}word search`,
    );
    refs.board.setAttribute('aria-rowcount', String(state.size));
    refs.board.setAttribute('aria-colcount', String(state.size));
    for (let index = 0; index < state.grid.length; index += 1) {
      const cell = document.createElement('button');
      cell.className = 'word-search-cell';
      cell.type = 'button';
      cell.dataset.index = String(index);
      cell.setAttribute('role', 'gridcell');
      cell.addEventListener('click', (event) => handleWordSearchCellClick(event, index));
      fragment.append(cell);
    }
    refs.board.append(fragment);
    return;
  }

  refs.board.setAttribute('aria-label', `${state.mode === 'wordoku' ? 'Wordoku' : 'Sudoku'} board`);
  refs.board.setAttribute('aria-rowcount', '9');
  refs.board.setAttribute('aria-colcount', '9');
  for (let index = 0; index < 81; index += 1) {
    const cell = document.createElement('button');
    cell.className = 'cell';
    cell.type = 'button';
    cell.dataset.index = String(index);
    cell.setAttribute('role', 'gridcell');
    cell.addEventListener('click', () => selectCell(index));
    fragment.append(cell);
  }
  refs.board.append(fragment);
}

function buildNumberPad() {
  refs.numberPad.replaceChildren();
  const fragment = document.createDocumentFragment();
  for (let value = 1; value <= 9; value += 1) {
    const button = document.createElement('button');
    const valueLabel = document.createElement('strong');
    const remainingLabel = document.createElement('small');
    button.type = 'button';
    button.dataset.value = String(value);
    remainingLabel.className = 'remaining-count';
    button.append(valueLabel, remainingLabel);
    button.addEventListener('click', () => enterValue(value));
    fragment.append(button);
  }
  refs.numberPad.append(fragment);
}

function cellLabel(index, value) {
  const row = Math.floor(index / 9) + 1;
  const column = (index % 9) + 1;
  const display = displayValue(value, state.mode, state.letterSet) || 'empty';
  const given = state.puzzle[index] ? ', given' : '';
  return `Row ${row}, column ${column}, ${display}${given}`;
}

function renderCell(cell, index, duplicateConflicts) {
  const value = state.values[index];
  const selectedValue = state.selected === null ? 0 : state.values[state.selected];
  const peers = state.selected === null ? new Set() : getPeers(state.selected);
  const isWrong = state.wrongIndices.has(index) || duplicateConflicts.has(index);

  cell.className = 'cell';
  cell.replaceChildren();
  cell.setAttribute('aria-label', cellLabel(index, value));
  cell.setAttribute('aria-selected', String(state.selected === index));
  cell.tabIndex = state.selected === index || (state.selected === null && index === 0) ? 0 : -1;

  if (state.puzzle[index]) cell.classList.add('given');
  if (state.hintedIndices.has(index)) cell.classList.add('hinted');
  if (state.selected === index) cell.classList.add('selected');
  else if (peers.has(index)) cell.classList.add('peer');
  if (selectedValue && value === selectedValue) cell.classList.add('same-value');
  if (isWrong) cell.classList.add('error');

  if (value) {
    const valueElement = document.createElement('span');
    valueElement.className = 'cell-value';
    valueElement.textContent = displayValue(value, state.mode, state.letterSet);
    cell.append(valueElement);
    return;
  }

  const notesGrid = document.createElement('span');
  notesGrid.className = 'notes-grid';
  for (let note = 1; note <= 9; note += 1) {
    const noteElement = document.createElement('span');
    if (state.notes[index].has(note)) {
      noteElement.textContent = displayValue(note, state.mode, state.letterSet);
    }
    notesGrid.append(noteElement);
  }
  cell.append(notesGrid);
}

function renderWordSearchBoard() {
  const selectedCells = new Set(state.wordSelection);
  const foundCells = new Set(state.foundSelections.flatMap(({ cells }) => cells));
  const foundWordsByCell = new Map();
  state.foundSelections.forEach(({ word, cells }) => {
    cells.forEach((index) => {
      const words = foundWordsByCell.get(index) ?? [];
      words.push(word);
      foundWordsByCell.set(index, words);
    });
  });

  [...refs.board.children].forEach((cell, index) => {
    const row = Math.floor(index / state.size) + 1;
    const column = (index % state.size) + 1;
    const foundLabel = foundWordsByCell.has(index) ? `, found in ${foundWordsByCell.get(index).join(' and ')}` : '';
    cell.className = 'word-search-cell';
    cell.textContent = state.grid[index];
    cell.setAttribute('aria-label', `Row ${row}, column ${column}, ${state.grid[index]}${foundLabel}`);
    cell.setAttribute('aria-selected', String(selectedCells.has(index)));
    cell.tabIndex = state.selected === index || (state.selected === null && index === 0) ? 0 : -1;
    if (foundCells.has(index)) cell.classList.add('found');
    if (state.wordHintCells.has(index)) cell.classList.add('hinted');
    if (selectedCells.has(index)) cell.classList.add('selecting');
    if (state.selected === index) cell.classList.add('selected');
  });
}

function renderWordSearchList() {
  const isHindi = state.wordSearchLanguage === 'hindi';
  refs.wordSearchWords.replaceChildren();
  const fragment = document.createDocumentFragment();
  state.words.forEach((word) => {
    const item = document.createElement('li');
    const marker = document.createElement('span');
    const label = document.createElement('span');
    const found = state.foundWords.has(word);
    item.classList.toggle('found', found);
    item.setAttribute(
      'aria-label',
      isHindi ? `${word}, ${found ? 'मिल गया' : 'नहीं मिला'}` : `${word}, ${found ? 'found' : 'not found'}`,
    );
    marker.className = 'word-search-marker';
    marker.setAttribute('aria-hidden', 'true');
    label.textContent = word;
    item.append(marker, label);
    fragment.append(item);
  });
  refs.wordSearchWords.append(fragment);
  refs.wordSearchFoundCount.textContent = `${state.foundWords.size} of ${state.words.length}`;
}

function renderNonogramBoard() {
  const cells = [...refs.board.querySelectorAll('.nonogram-cell')];
  cells.forEach((cell) => {
    const index = Number(cell.dataset.index);
    const row = Math.floor(index / state.size) + 1;
    const column = (index % state.size) + 1;
    const value = state.values[index];
    const valueLabel = value === 1 ? 'filled' : value === 0 ? 'marked empty' : 'unknown';
    cell.className = 'nonogram-cell';
    cell.textContent = value === 0 ? '×' : '';
    cell.setAttribute('aria-label', `Row ${row}, column ${column}, ${valueLabel}`);
    cell.setAttribute('aria-selected', String(state.selected === index));
    cell.tabIndex = state.selected === index || (state.selected === null && index === 0) ? 0 : -1;
    if (value === 1) cell.classList.add('filled');
    if (value === 0) cell.classList.add('crossed');
    if (state.wrongIndices.has(index)) cell.classList.add('error');
    if (state.hintedIndices.has(index)) cell.classList.add('hinted');
    if (state.selected === index) cell.classList.add('selected');
  });

  refs.board.querySelectorAll('.nonogram-row-clue').forEach((clue) => {
    const row = Number(clue.dataset.row);
    const start = row * state.size;
    clue.classList.toggle(
      'complete',
      isNonogramLineComplete(state.values.slice(start, start + state.size), state.rowClues[row]),
    );
  });
  refs.board.querySelectorAll('.nonogram-column-clue').forEach((clue) => {
    const column = Number(clue.dataset.column);
    const values = Array.from({ length: state.size }, (_, row) => state.values[row * state.size + column]);
    clue.classList.toggle('complete', isNonogramLineComplete(values, state.columnClues[column]));
  });
}

function renderBoard() {
  if (state.mode === 'nonogram') {
    renderNonogramBoard();
    return;
  }
  if (state.mode === 'wordsearch') {
    renderWordSearchBoard();
    return;
  }
  const duplicateConflicts = getDuplicateConflicts(state.values);
  [...refs.board.children].forEach((cell, index) => renderCell(cell, index, duplicateConflicts));
}

function renderNumberPad() {
  [...refs.numberPad.children].forEach((button, index) => {
    const value = index + 1;
    const solvedCount = state.values.reduce(
      (count, entry, position) => count + Number(entry === value && entry === state.solution[position]),
      0,
    );
    const display = displayValue(value, state.mode, state.letterSet);
    button.querySelector('strong').textContent = display;
    button.querySelector('small').textContent = solvedCount === 9 ? 'Done' : `${9 - solvedCount} left`;
    button.disabled = solvedCount === 9 || state.completed || !state.running;
    button.classList.toggle('complete', solvedCount === 9);
    button.setAttribute('aria-label', `Enter ${display}, ${9 - solvedCount} remaining`);
  });
}

function renderTimer() {
  refs.timer.textContent = formatTime(state.elapsed);
  refs.timer.dateTime = `PT${state.elapsed}S`;
}

function render() {
  const isWordSearch = state.mode === 'wordsearch';
  const isNonogram = state.mode === 'nonogram';
  const isHindiWordSearch = isWordSearch && state.wordSearchLanguage === 'hindi';
  document.documentElement.dataset.mode = state.mode;
  document.documentElement.dataset.theme = state.theme;
  refs.themeColorMeta.content = state.theme === 'dark' ? '#151c18' : '#167455';
  refs.themeToggle.innerHTML = state.theme === 'dark'
    ? '<i data-lucide="sun" aria-hidden="true"></i>'
    : '<i data-lucide="moon" aria-hidden="true"></i>';
  refs.themeToggle.title = state.theme === 'dark' ? 'Use light theme' : 'Use dark theme';
  refs.themeToggle.setAttribute('aria-label', refs.themeToggle.title);
  refs.sudokuMode.setAttribute('aria-selected', String(state.mode === 'sudoku'));
  refs.wordokuMode.setAttribute('aria-selected', String(state.mode === 'wordoku'));
  refs.wordSearchMode.setAttribute('aria-selected', String(isWordSearch));
  refs.nonogramMode.setAttribute('aria-selected', String(isNonogram));
  refs.sudokuMode.classList.toggle('active', state.mode === 'sudoku');
  refs.wordokuMode.classList.toggle('active', state.mode === 'wordoku');
  refs.wordSearchMode.classList.toggle('active', isWordSearch);
  refs.nonogramMode.classList.toggle('active', isNonogram);
  refs.difficulty.value = state.difficulty;
  refs.letterSet.value = state.letterSet;
  refs.wordokuOptions.hidden = state.mode !== 'wordoku';
  refs.wordSearchOptions.hidden = !isWordSearch;
  refs.wordSearchLanguage.value = state.wordSearchLanguage;
  refs.wordSearchPanel.hidden = !isWordSearch;
  refs.wordSearchPanel.lang = isHindiWordSearch ? 'hi' : 'en';
  refs.wordSearchPanel.dataset.language = isHindiWordSearch ? 'hindi' : 'english';
  refs.nonogramControls.hidden = !isNonogram;
  refs.numberPad.hidden = isWordSearch || isNonogram;
  refs.undoButton.hidden = isWordSearch;
  refs.eraseButton.hidden = isWordSearch;
  refs.notesButton.hidden = isWordSearch || isNonogram;
  refs.autoNotesButton.hidden = isWordSearch || isNonogram;
  refs.preferencesSection.hidden = isWordSearch;
  refs.autoCheck.checked = state.autoCheck;
  refs.modeEyebrow.textContent = state.mode === 'wordoku'
    ? state.letterSet
    : isNonogram ? 'Picture logic puzzle'
    : isHindiWordSearch
      ? `${state.themeName} | हिंदी शब्द खोज`
      : isWordSearch ? `${state.themeName} word search` : 'Classic Sudoku';
  const gameLabel = state.mode === 'wordoku'
    ? 'Wordoku'
    : isNonogram ? 'Nonogram'
    : isHindiWordSearch ? 'Hindi Word Search' : isWordSearch ? 'Word Search' : 'Sudoku';
  refs.gameHeading.textContent = `${capitalize(state.difficulty)} ${gameLabel} puzzle`;
  refs.gameStatusText.textContent = state.completed ? 'Completed' : state.running ? 'In progress' : 'Paused';
  refs.mistakeCount.textContent = String(state.mistakes);
  refs.hintsLeft.textContent = String(state.hints);
  refs.hintBadge.textContent = String(state.hints);
  refs.bestTime.textContent = getBestTime() === null ? '--:--' : formatTime(getBestTime());
  refs.nonogramFillButton.classList.toggle('active', isNonogram && state.nonogramTool === 'fill');
  refs.nonogramCrossButton.classList.toggle('active', isNonogram && state.nonogramTool === 'cross');
  refs.nonogramFillButton.setAttribute('aria-pressed', String(isNonogram && state.nonogramTool === 'fill'));
  refs.nonogramCrossButton.setAttribute('aria-pressed', String(isNonogram && state.nonogramTool === 'cross'));
  let progress;

  if (isNonogram) {
    const nonogramProgress = getNonogramProgress(state.values, state.solution);
    progress = nonogramProgress.percentage;
    refs.progressLabel.textContent = 'Pixels revealed';
    refs.mistakeLabel.textContent = 'Mistakes';
    refs.progressText.textContent = `${nonogramProgress.solved} of ${nonogramProgress.total}`;
    refs.progressTrack.setAttribute('aria-label', 'Nonogram progress');
    refs.undoButton.disabled = state.history.length === 0 || state.completed || !state.running;
    refs.eraseButton.disabled = state.selected === null
      || state.values[state.selected] === null
      || state.completed
      || !state.running;
    refs.checkButton.disabled = state.completed || !state.running;
  } else if (isWordSearch) {
    progress = Math.round((state.foundWords.size / state.words.length) * 100);
    refs.wordSearchListEyebrow.textContent = isHindiWordSearch ? 'शब्द सूची' : 'Word list';
    refs.wordSearchListHeading.textContent = isHindiWordSearch ? 'छिपे हुए शब्द खोजें' : 'Find the hidden words';
    refs.progressLabel.textContent = isHindiWordSearch ? 'शब्द मिले' : 'Words found';
    refs.mistakeLabel.textContent = 'Attempts';
    refs.progressText.textContent = `${state.foundWords.size} of ${state.words.length}`;
    refs.progressTrack.setAttribute('aria-label', 'Words found');
    renderWordSearchList();
  } else {
    const totalSquares = state.puzzle.filter((value) => value === 0).length;
    const solvedSquares = state.values.reduce(
      (count, value, index) => count + Number(!state.puzzle[index] && value === state.solution[index]),
      0,
    );
    progress = totalSquares ? Math.round((solvedSquares / totalSquares) * 100) : 100;
    refs.progressLabel.textContent = 'Squares solved';
    refs.mistakeLabel.textContent = 'Mistakes';
    refs.progressText.textContent = `${solvedSquares} of ${totalSquares}`;
    refs.progressTrack.setAttribute('aria-label', 'Puzzle progress');
    refs.notesButton.classList.toggle('active', state.notesMode);
    refs.notesButton.setAttribute('aria-pressed', String(state.notesMode));
    refs.undoButton.disabled = state.history.length === 0 || state.completed || !state.running;
    refs.eraseButton.disabled = !canEditSelectedCell() || state.completed || !state.running;
    refs.notesButton.disabled = state.completed || !state.running;
    refs.checkButton.disabled = state.completed || !state.running;
    refs.autoNotesButton.disabled = state.completed || !state.running || solvedSquares === totalSquares;
  }

  refs.progressFill.style.width = `${progress}%`;
  refs.progressTrack.setAttribute('aria-valuenow', String(progress));
  refs.hintButton.disabled = state.hints === 0 || state.completed || !state.running;
  refs.restartButton.disabled = state.completed;
  refs.restartDialogCopy.textContent = isWordSearch
    ? 'This keeps the same letter grid and resets found words, attempts, hints, and the timer.'
    : isNonogram
      ? 'This keeps the same picture clues and clears every filled and crossed cell, hint, mistake, and timer.'
      : 'This keeps the same board and returns the timer, hints, notes, and mistakes to their starting state.';
  refs.pauseButton.disabled = state.completed;
  refs.pauseScreen.hidden = state.running || state.completed;
  refs.pauseButton.innerHTML = state.running
    ? '<i data-lucide="pause" aria-hidden="true"></i>'
    : '<i data-lucide="play" aria-hidden="true"></i>';
  refs.pauseButton.title = state.running ? 'Pause game' : 'Resume game';
  refs.pauseButton.setAttribute('aria-label', refs.pauseButton.title);
  renderTimer();
  renderBoard();
  if (!isWordSearch && !isNonogram) renderNumberPad();
  refreshIcons();
}

function capitalize(value) {
  return value.charAt(0).toUpperCase() + value.slice(1);
}

function selectCell(index, shouldFocus = false) {
  if (!state.running || state.completed) return;
  state.selected = index;
  render();
  if (shouldFocus) refs.board.children[index]?.focus({ preventScroll: true });
  saveState();
}

function wordSearchIndexFromPoint(clientX, clientY) {
  const bounds = refs.board.getBoundingClientRect();
  if (clientX < bounds.left || clientX > bounds.right || clientY < bounds.top || clientY > bounds.bottom) return null;
  const column = Math.min(state.size - 1, Math.floor(((clientX - bounds.left) / bounds.width) * state.size));
  const row = Math.min(state.size - 1, Math.floor(((clientY - bounds.top) / bounds.height) * state.size));
  return row * state.size + column;
}

function beginWordSearchSelection(event) {
  if (state.mode !== 'wordsearch' || !state.running || state.completed) return;
  if (event.pointerType === 'mouse' && event.button !== 0) return;
  const cell = event.target.closest('.word-search-cell');
  if (!cell) return;

  event.preventDefault();
  const index = Number(cell.dataset.index);
  wordSearchPointer = { pointerId: event.pointerId, start: index };
  wordSearchKeyboardAnchor = null;
  state.wordSelection = [index];
  state.wordHintCells.clear();
  state.selected = index;
  refs.board.setPointerCapture?.(event.pointerId);
  renderWordSearchBoard();
}

function moveWordSearchSelection(event) {
  if (!wordSearchPointer || event.pointerId !== wordSearchPointer.pointerId) return;
  event.preventDefault();
  const index = wordSearchIndexFromPoint(event.clientX, event.clientY);
  if (index === null) return;
  const selection = getSnappedWordSearchSelection(wordSearchPointer.start, index, state.size);
  if (!selection.length || selection.join(',') === state.wordSelection.join(',')) return;
  state.wordSelection = selection;
  state.selected = selection.at(-1);
  renderWordSearchBoard();
}

function finishWordSearchSelection(event) {
  if (!wordSearchPointer || event.pointerId !== wordSearchPointer.pointerId) return;
  moveWordSearchSelection(event);
  const selection = [...state.wordSelection];
  wordSearchPointer = null;
  suppressWordSearchClick = true;
  window.setTimeout(() => {
    suppressWordSearchClick = false;
  }, 0);
  submitWordSearchSelection(selection);
}

function cancelWordSearchSelection(event) {
  if (!wordSearchPointer || event.pointerId !== wordSearchPointer.pointerId) return;
  wordSearchPointer = null;
  state.wordSelection = [];
  renderWordSearchBoard();
}

function handleWordSearchCellClick(event, index) {
  if (state.mode !== 'wordsearch' || !state.running || state.completed) return;
  if (suppressWordSearchClick || event.detail !== 0) return;

  if (wordSearchKeyboardAnchor === null) {
    wordSearchKeyboardAnchor = index;
    state.selected = index;
    state.wordSelection = [index];
    state.wordHintCells.clear();
    renderWordSearchBoard();
    return;
  }

  const selection = getWordSearchSelection(wordSearchKeyboardAnchor, index, state.size);
  if (selection.length < 2) {
    wordSearchKeyboardAnchor = index;
    state.selected = index;
    state.wordSelection = [index];
    renderWordSearchBoard();
    return;
  }

  wordSearchKeyboardAnchor = null;
  submitWordSearchSelection(selection);
}

function submitWordSearchSelection(selection) {
  const match = findWordSearchMatch(state.grid, state.words, state.foundWords, selection);
  const anyMatch = match ?? findWordSearchMatch(state.grid, state.words, new Set(), selection);
  state.wordSelection = [];
  state.wordHintCells.clear();
  state.selected = selection.at(-1) ?? state.selected;

  if (match) {
    state.foundWords.add(match);
    state.foundSelections.push({ word: match, cells: [...selection] });
    showToast(state.wordSearchLanguage === 'hindi' ? `मिला: ${match}` : `Found ${match}.`);
  } else if (anyMatch) {
    showToast(
      state.wordSearchLanguage === 'hindi'
        ? `${anyMatch} पहले मिल चुका है।`
        : `${anyMatch} is already found.`,
    );
  } else if (selection.length > 1) {
    state.mistakes += 1;
    showToast(
      state.wordSearchLanguage === 'hindi'
        ? 'यह शब्द सूची में नहीं है।'
        : 'That line is not in the word list.',
    );
  }

  commitChange();
}

function rememberNonogram() {
  state.history.push({
    kind: 'nonogram',
    values: [...state.values],
    wrongIndices: [...state.wrongIndices],
    hintedIndices: [...state.hintedIndices],
    selected: state.selected,
    mistakes: state.mistakes,
    hints: state.hints,
  });
  if (state.history.length > 100) state.history.shift();
}

function applyNonogramValue(index, value) {
  if (state.values[index] === value) return false;
  state.values[index] = value;
  state.selected = index;
  state.hintedIndices.delete(index);

  const isWrong = value !== null && value !== state.solution[index];
  if (state.autoCheck && isWrong) {
    if (!state.wrongIndices.has(index)) state.mistakes += 1;
    state.wrongIndices.add(index);
  } else {
    state.wrongIndices.delete(index);
  }
  return true;
}

function nonogramToolValue() {
  return state.nonogramTool === 'cross' ? 0 : 1;
}

function setNonogramTool(tool) {
  if (state.mode !== 'nonogram' || !['fill', 'cross'].includes(tool)) return;
  state.nonogramTool = tool;
  render();
  saveState();
}

function beginNonogramStroke(event) {
  if (state.mode !== 'nonogram' || !state.running || state.completed) return;
  if (event.pointerType === 'mouse' && event.button !== 0) return;
  const cell = event.target.closest('.nonogram-cell');
  if (!cell) return;

  event.preventDefault();
  const index = Number(cell.dataset.index);
  const toolValue = nonogramToolValue();
  const paintValue = state.values[index] === toolValue ? null : toolValue;
  rememberNonogram();
  nonogramPointer = { pointerId: event.pointerId, paintValue, changed: new Set([index]) };
  applyNonogramValue(index, paintValue);
  refs.board.setPointerCapture?.(event.pointerId);
  renderNonogramBoard();
}

function moveNonogramStroke(event) {
  if (!nonogramPointer || event.pointerId !== nonogramPointer.pointerId) return;
  event.preventDefault();
  const cell = document.elementFromPoint(event.clientX, event.clientY)?.closest('.nonogram-cell');
  if (!cell || !refs.board.contains(cell)) return;
  const index = Number(cell.dataset.index);
  if (nonogramPointer.changed.has(index)) return;
  nonogramPointer.changed.add(index);
  applyNonogramValue(index, nonogramPointer.paintValue);
  renderNonogramBoard();
}

function finishNonogramStroke(event) {
  if (!nonogramPointer || event.pointerId !== nonogramPointer.pointerId) return;
  moveNonogramStroke(event);
  nonogramPointer = null;
  suppressNonogramClick = true;
  window.setTimeout(() => {
    suppressNonogramClick = false;
  }, 0);
  commitChange();
}

function cancelNonogramStroke(event) {
  if (!nonogramPointer || event.pointerId !== nonogramPointer.pointerId) return;
  nonogramPointer = null;
  commitChange();
}

function handleNonogramCellClick(event, index) {
  if (state.mode !== 'nonogram' || !state.running || state.completed) return;
  if (suppressNonogramClick || event.detail !== 0) return;
  const toolValue = nonogramToolValue();
  rememberNonogram();
  applyNonogramValue(index, state.values[index] === toolValue ? null : toolValue);
  commitChange();
}

function markNonogramCross(event, index) {
  if (state.mode !== 'nonogram' || !state.running || state.completed) return;
  event.preventDefault();
  rememberNonogram();
  applyNonogramValue(index, state.values[index] === 0 ? null : 0);
  commitChange();
}

function canEditSelectedCell() {
  return ['sudoku', 'wordoku'].includes(state.mode)
    && state.selected !== null
    && !state.puzzle[state.selected];
}

function rememberCell(index) {
  state.history.push({
    kind: 'cell',
    index,
    value: state.values[index],
    notes: [...state.notes[index]],
    wasWrong: state.wrongIndices.has(index),
    wasHinted: state.hintedIndices.has(index),
  });
  if (state.history.length > 100) state.history.shift();
}

function rememberBoard() {
  state.history.push({
    kind: 'board',
    values: [...state.values],
    notes: state.notes.map((notes) => [...notes]),
    wrongIndices: [...state.wrongIndices],
    hintedIndices: [...state.hintedIndices],
    selected: state.selected,
    mistakes: state.mistakes,
    hints: state.hints,
  });
  if (state.history.length > 100) state.history.shift();
}

function enterValue(value) {
  if (!canEditSelectedCell() || !state.running || state.completed) return;
  const index = state.selected;

  if (state.notesMode) {
    if (state.values[index]) return;
    rememberCell(index);
    if (state.notes[index].has(value)) state.notes[index].delete(value);
    else state.notes[index].add(value);
    state.wrongIndices.delete(index);
    commitChange();
    return;
  }

  if (state.values[index] === value && !state.wrongIndices.has(index)) return;
  rememberCell(index);
  state.values[index] = value;
  state.notes[index].clear();
  state.hintedIndices.delete(index);

  if (value === state.solution[index]) {
    state.wrongIndices.delete(index);
    getPeers(index).forEach((peer) => state.notes[peer].delete(value));
  } else if (state.autoCheck) {
    state.wrongIndices.add(index);
    state.mistakes += 1;
  } else {
    state.wrongIndices.delete(index);
  }

  commitChange();
}

function eraseSelected() {
  if (state.mode === 'nonogram') {
    if (state.selected === null || state.values[state.selected] === null || !state.running || state.completed) return;
    rememberNonogram();
    applyNonogramValue(state.selected, null);
    commitChange();
    return;
  }
  if (!canEditSelectedCell() || !state.running || state.completed) return;
  const index = state.selected;
  if (!state.values[index] && state.notes[index].size === 0) return;
  rememberCell(index);
  state.values[index] = 0;
  state.notes[index].clear();
  state.wrongIndices.delete(index);
  state.hintedIndices.delete(index);
  commitChange();
}

function undo() {
  const previous = state.history.pop();
  if (!previous || !state.running || state.completed) return;

  if (previous.kind === 'nonogram') {
    state.values = [...previous.values];
    state.wrongIndices = new Set(previous.wrongIndices);
    state.hintedIndices = new Set(previous.hintedIndices);
    state.selected = previous.selected;
    state.mistakes = previous.mistakes;
    state.hints = previous.hints;
    commitChange(false);
    return;
  }

  if (previous.kind === 'board') {
    state.values = [...previous.values];
    state.notes = previous.notes.map((notes) => new Set(notes));
    state.wrongIndices = new Set(previous.wrongIndices);
    state.hintedIndices = new Set(previous.hintedIndices);
    state.selected = previous.selected;
    state.mistakes = previous.mistakes;
    state.hints = previous.hints;
    commitChange(false);
    return;
  }

  state.values[previous.index] = previous.value;
  state.notes[previous.index] = new Set(previous.notes);
  if (previous.wasWrong) state.wrongIndices.add(previous.index);
  else state.wrongIndices.delete(previous.index);
  if (previous.wasHinted) state.hintedIndices.add(previous.index);
  else state.hintedIndices.delete(previous.index);
  state.selected = previous.index;
  commitChange(false);
}

function fillCandidates() {
  if (!state.running || state.completed) return;
  const candidateNotes = state.values.map((value, index) => (
    value || state.puzzle[index] ? new Set() : new Set(getCandidates(state.values, index))
  ));
  const changed = candidateNotes.some((notes, index) => (
    notes.size !== state.notes[index].size || [...notes].some((value) => !state.notes[index].has(value))
  ));

  if (!changed) {
    showToast('Candidate notes are already up to date.');
    return;
  }

  rememberBoard();
  state.notes = candidateNotes;
  state.notesMode = true;
  const notedSquares = candidateNotes.filter((notes) => notes.size > 0).length;
  showToast(`Candidates added to ${notedSquares} squares.`);
  commitChange(false);
}

function useWordSearchHint() {
  const available = state.placements.filter(({ word }) => !state.foundWords.has(word));
  const placement = available.find(({ cells }) => cells.includes(state.selected))
    ?? available[Math.floor(Math.random() * available.length)];
  if (!placement) return;

  state.wordHintCells = new Set(placement.cells);
  state.wordSelection = [];
  state.selected = placement.cells[0];
  state.hints -= 1;
  showToast(
    state.wordSearchLanguage === 'hindi'
      ? `${placement.word} हाइलाइट किया गया है।`
      : `${placement.word} is highlighted.`,
  );
  render();
  saveState();
}

function useNonogramHint() {
  const available = state.values
    .map((value, index) => (value !== state.solution[index] ? index : null))
    .filter((index) => index !== null);
  const index = available.includes(state.selected)
    ? state.selected
    : available[Math.floor(Math.random() * available.length)] ?? null;
  if (index === null) return;

  rememberNonogram();
  applyNonogramValue(index, state.solution[index]);
  state.wrongIndices.delete(index);
  state.hintedIndices.add(index);
  state.hints -= 1;
  showToast(state.solution[index] === 1 ? 'A filled pixel has been revealed.' : 'An empty pixel has been marked.');
  commitChange();
}

function useHint() {
  if (!state.hints || !state.running || state.completed) return;
  if (state.mode === 'nonogram') {
    useNonogramHint();
    return;
  }
  if (state.mode === 'wordsearch') {
    useWordSearchHint();
    return;
  }
  let index = canEditSelectedCell() && state.values[state.selected] !== state.solution[state.selected]
    ? state.selected
    : null;

  if (index === null) {
    const openCells = state.values
      .map((value, position) => (value !== state.solution[position] && !state.puzzle[position] ? position : null))
      .filter((position) => position !== null);
    index = openCells[Math.floor(Math.random() * openCells.length)] ?? null;
  }
  if (index === null) return;

  rememberCell(index);
  const value = state.solution[index];
  state.values[index] = value;
  state.notes[index].clear();
  state.wrongIndices.delete(index);
  state.hintedIndices.add(index);
  state.hints -= 1;
  state.selected = index;
  getPeers(index).forEach((peer) => state.notes[peer].delete(value));
  showToast('A square has been revealed.');
  commitChange();
}

function checkBoard() {
  if (!state.running || state.completed) return;
  if (state.mode === 'nonogram') {
    const errors = state.values
      .map((value, index) => (value !== null && value !== state.solution[index] ? index : null))
      .filter((index) => index !== null);
    const newErrors = errors.filter((index) => !state.wrongIndices.has(index));
    newErrors.forEach((index) => state.wrongIndices.add(index));
    state.mistakes += newErrors.length;
    if (errors.length) {
      state.selected = errors[0];
      showToast(`${errors.length} ${errors.length === 1 ? 'pixel needs' : 'pixels need'} another look.`);
    } else {
      showToast('Every marked pixel looks right so far.');
    }
    commitChange();
    return;
  }
  const errors = [];
  state.values.forEach((value, index) => {
    if (value && value !== state.solution[index]) errors.push(index);
  });

  const newErrors = errors.filter((index) => !state.wrongIndices.has(index));
  newErrors.forEach((index) => state.wrongIndices.add(index));
  state.mistakes += newErrors.length;

  if (errors.length) {
    state.selected = errors[0];
    showToast(`${errors.length} ${errors.length === 1 ? 'square needs' : 'squares need'} another look.`);
  } else {
    showToast('Everything looks right so far.');
  }
  commitChange();
}

function commitChange(checkForCompletion = true) {
  if (checkForCompletion) {
    const solved = state.mode === 'wordsearch'
      ? state.foundWords.size === state.words.length
      : state.mode === 'nonogram'
        ? isNonogramSolved(state.values, state.solution)
      : isSolved(state.values, state.solution);
    if (solved) completeGame();
  }
  render();
  saveState();
}

function updateElapsed() {
  if (!state.running || state.completed) return;
  state.elapsed = Math.max(state.elapsed, Math.floor((Date.now() - timerBase) / 1000));
}

function togglePause(forceRunning) {
  if (state.completed) return;
  const shouldRun = typeof forceRunning === 'boolean' ? forceRunning : !state.running;
  if (shouldRun === state.running) return;

  if (shouldRun) {
    state.running = true;
    timerBase = Date.now() - state.elapsed * 1000;
  } else {
    updateElapsed();
    state.running = false;
  }
  render();
  saveState();
}

function completeGame() {
  updateElapsed();
  state.completed = true;
  state.running = false;
  saveBestTime();
  refs.finalTime.textContent = formatTime(state.elapsed);
  refs.finalMistakes.textContent = String(state.mistakes);
  refs.finalMistakeLabel.textContent = state.mode === 'wordsearch' ? 'Attempts' : 'Mistakes';
  refs.finalDifficulty.textContent = capitalize(state.difficulty);
  launchCelebration();
  window.setTimeout(() => refs.successDialog.showModal(), 250);
}

function launchCelebration() {
  refs.celebration.replaceChildren();
  const colors = ['#167455', '#ef6a5b', '#f2b84b', '#2766b0'];
  for (let index = 0; index < 24; index += 1) {
    const piece = document.createElement('span');
    piece.style.setProperty('--x', `${(index * 37) % 100}%`);
    piece.style.setProperty('--delay', `${(index % 8) * 55}ms`);
    piece.style.setProperty('--color', colors[index % colors.length]);
    refs.celebration.append(piece);
  }
}

function hasProgress() {
  if (state.mode === 'nonogram') {
    return state.values.some((value) => value !== null) || state.elapsed > 15;
  }
  if (state.mode === 'wordsearch') {
    return state.foundWords.size > 0 || state.mistakes > 0 || state.elapsed > 15;
  }
  return state.values.some((value, index) => value !== state.puzzle[index]) || state.elapsed > 15;
}

function requestNewGame(options = {}, skipConfirmation = false) {
  pendingGameOptions = {
    mode: options.mode ?? state.mode,
    difficulty: options.difficulty ?? state.difficulty,
    letterSet: options.letterSet ?? state.letterSet,
    wordSearchLanguage: options.wordSearchLanguage ?? state.wordSearchLanguage,
  };

  if (!skipConfirmation && hasProgress() && !state.completed) {
    refs.newGameDialog.showModal();
    return;
  }
  startNewGame(pendingGameOptions);
}

function startNewGame(options) {
  state = newState(options);
  pendingGameOptions = null;
  timerBase = Date.now();
  window.clearTimeout(toastTimer);
  refs.toast.classList.remove('visible');
  refs.toast.textContent = '';
  refs.successDialog.close();
  buildBoard();
  buildNumberPad();
  render();
  saveSettings();
  saveState();
}

function restartCurrentGame() {
  if (state.mode === 'nonogram') {
    state.values = Array(state.solution.length).fill(null);
    state.wrongIndices.clear();
    state.hintedIndices.clear();
    state.selected = null;
    state.nonogramTool = 'fill';
    nonogramPointer = null;
  } else if (state.mode === 'wordsearch') {
    state.foundWords.clear();
    state.foundSelections = [];
    state.wordSelection = [];
    state.wordHintCells.clear();
    state.selected = null;
    wordSearchPointer = null;
    wordSearchKeyboardAnchor = null;
  } else {
    state.values = [...state.puzzle];
    state.notes = Array.from({ length: 81 }, () => new Set());
    state.wrongIndices.clear();
    state.hintedIndices.clear();
    state.selected = null;
    state.notesMode = false;
  }
  state.mistakes = 0;
  state.hints = 3;
  state.elapsed = 0;
  state.running = true;
  state.completed = false;
  state.history = [];
  timerBase = Date.now();
  render();
  saveState();
  showToast('Puzzle restarted.');
}

function toggleTheme() {
  state.theme = state.theme === 'dark' ? 'light' : 'dark';
  saveSettings();
  render();
  saveState();
}

async function shareResult() {
  const label = state.mode === 'wordoku'
    ? 'Wordoku'
    : state.mode === 'nonogram'
      ? 'Nonogram'
    : state.mode === 'wordsearch' && state.wordSearchLanguage === 'hindi'
      ? 'Hindi Word Search'
      : state.mode === 'wordsearch' ? 'Word Search' : 'Sudoku';
  const resultLabel = state.mode === 'wordsearch'
    ? `${state.mistakes} ${state.mistakes === 1 ? 'missed attempt' : 'missed attempts'}`
    : `${state.mistakes} ${state.mistakes === 1 ? 'mistake' : 'mistakes'}`;
  const text = `Ninefold ${label} - ${capitalize(state.difficulty)}\nSolved in ${formatTime(state.elapsed)} with ${resultLabel}.`;
  const shareData = { title: 'Ninefold puzzle result', text, url: window.location.href };

  try {
    if (navigator.share) {
      await navigator.share(shareData);
      return;
    }
    await navigator.clipboard.writeText(`${text}\n${window.location.href}`);
    showToast('Result copied to your clipboard.');
  } catch (error) {
    if (error?.name !== 'AbortError') showToast('Sharing is not available in this browser.');
  }
}

function showToast(message) {
  window.clearTimeout(toastTimer);
  refs.toast.textContent = message;
  refs.toast.classList.add('visible');
  toastTimer = window.setTimeout(() => refs.toast.classList.remove('visible'), 2600);
}

function moveSelection(key) {
  if (state.mode === 'nonogram') {
    const current = state.selected ?? 0;
    const row = Math.floor(current / state.size);
    const column = current % state.size;
    const moves = {
      ArrowUp: [Math.max(0, row - 1), column],
      ArrowDown: [Math.min(state.size - 1, row + 1), column],
      ArrowLeft: [row, Math.max(0, column - 1)],
      ArrowRight: [row, Math.min(state.size - 1, column + 1)],
    };
    const [nextRow, nextColumn] = moves[key];
    const next = nextRow * state.size + nextColumn;
    state.selected = next;
    renderNonogramBoard();
    refs.board.querySelector(`.nonogram-cell[data-index="${next}"]`)?.focus({ preventScroll: true });
    return;
  }

  if (state.mode === 'wordsearch') {
    const current = state.selected ?? 0;
    const row = Math.floor(current / state.size);
    const column = current % state.size;
    const moves = {
      ArrowUp: [Math.max(0, row - 1), column],
      ArrowDown: [Math.min(state.size - 1, row + 1), column],
      ArrowLeft: [row, Math.max(0, column - 1)],
      ArrowRight: [row, Math.min(state.size - 1, column + 1)],
    };
    const [nextRow, nextColumn] = moves[key];
    const next = nextRow * state.size + nextColumn;
    state.selected = next;
    state.wordSelection = wordSearchKeyboardAnchor === null
      ? []
      : getWordSearchSelection(wordSearchKeyboardAnchor, next, state.size);
    renderWordSearchBoard();
    refs.board.children[next]?.focus({ preventScroll: true });
    return;
  }

  const current = state.selected ?? state.values.findIndex((value, index) => !value && !state.puzzle[index]);
  if (current < 0) return;
  const row = Math.floor(current / 9);
  const column = current % 9;
  const moves = {
    ArrowUp: [Math.max(0, row - 1), column],
    ArrowDown: [Math.min(8, row + 1), column],
    ArrowLeft: [row, Math.max(0, column - 1)],
    ArrowRight: [row, Math.min(8, column + 1)],
  };
  const [nextRow, nextColumn] = moves[key];
  selectCell(nextRow * 9 + nextColumn, true);
}

function handleKeyboard(event) {
  if (['SELECT', 'INPUT', 'TEXTAREA'].includes(document.activeElement?.tagName)) return;
  if (refs.newGameDialog.open || refs.successDialog.open) return;

  if (event.key.startsWith('Arrow')) {
    event.preventDefault();
    moveSelection(event.key);
    return;
  }

  if (state.mode === 'nonogram') {
    const key = event.key.toLowerCase();
    if (key === 'f') setNonogramTool('fill');
    if (key === 'x') setNonogramTool('cross');
    if (key === '1' || key === '0') {
      const index = state.selected ?? 0;
      const value = key === '1' ? 1 : 0;
      rememberNonogram();
      applyNonogramValue(index, state.values[index] === value ? null : value);
      commitChange();
    }
    if (event.key === 'Backspace' || event.key === 'Delete') eraseSelected();
    if (key === 'h') useHint();
    if (event.key === ' ') {
      event.preventDefault();
      togglePause();
    }
    return;
  }

  if (state.mode === 'wordsearch') {
    if (event.key.toLowerCase() === 'h') useHint();
    if (event.key === ' ' && !document.activeElement?.classList.contains('word-search-cell')) {
      event.preventDefault();
      togglePause();
    }
    return;
  }

  const numericValue = Number(event.key);
  if (numericValue >= 1 && numericValue <= 9) {
    enterValue(numericValue);
    return;
  }

  if (state.mode === 'wordoku') {
    const letterValue = state.letterSet.indexOf(event.key.toUpperCase()) + 1;
    if (letterValue > 0) {
      enterValue(letterValue);
      return;
    }
  }

  if (event.key === 'Backspace' || event.key === 'Delete' || event.key === '0') eraseSelected();
  if (event.key.toLowerCase() === 'n') {
    state.notesMode = !state.notesMode;
    render();
  }
  if (event.key.toLowerCase() === 'h') useHint();
  if (event.key === ' ') {
    event.preventDefault();
    togglePause();
  }
}

function bindEvents() {
  refs.sudokuMode.addEventListener('click', () => {
    if (state.mode !== 'sudoku') requestNewGame({ mode: 'sudoku' });
  });
  refs.wordokuMode.addEventListener('click', () => {
    if (state.mode !== 'wordoku') requestNewGame({ mode: 'wordoku' });
  });
  refs.wordSearchMode.addEventListener('click', () => {
    if (state.mode !== 'wordsearch') requestNewGame({ mode: 'wordsearch' });
  });
  refs.nonogramMode.addEventListener('click', () => {
    if (state.mode !== 'nonogram') requestNewGame({ mode: 'nonogram' });
  });
  refs.difficulty.addEventListener('change', (event) => requestNewGame({ difficulty: event.target.value }));
  refs.letterSet.addEventListener('change', (event) => {
    state.letterSet = event.target.value;
    saveSettings();
    render();
    saveState();
  });
  refs.wordSearchLanguage.addEventListener('change', (event) => {
    requestNewGame({ wordSearchLanguage: event.target.value });
  });
  refs.nonogramFillButton.addEventListener('click', () => setNonogramTool('fill'));
  refs.nonogramCrossButton.addEventListener('click', () => setNonogramTool('cross'));
  refs.autoCheck.addEventListener('change', (event) => {
    if (state.mode === 'wordsearch') return;
    state.autoCheck = event.target.checked;
    if (state.autoCheck) {
      state.values.forEach((value, index) => {
        const hasWrongValue = state.mode === 'nonogram'
          ? value !== null && value !== state.solution[index]
          : value && value !== state.solution[index];
        if (hasWrongValue) state.wrongIndices.add(index);
      });
    } else {
      state.wrongIndices.clear();
    }
    saveSettings();
    render();
    saveState();
  });
  refs.newGameButton.addEventListener('click', () => requestNewGame());
  refs.themeToggle.addEventListener('click', toggleTheme);
  refs.confirmNewGame.addEventListener('click', () => startNewGame(pendingGameOptions));
  refs.pauseButton.addEventListener('click', () => togglePause());
  refs.resumeButton.addEventListener('click', () => togglePause(true));
  refs.undoButton.addEventListener('click', undo);
  refs.eraseButton.addEventListener('click', eraseSelected);
  refs.notesButton.addEventListener('click', () => {
    state.notesMode = !state.notesMode;
    render();
  });
  refs.hintButton.addEventListener('click', useHint);
  refs.checkButton.addEventListener('click', checkBoard);
  refs.autoNotesButton.addEventListener('click', fillCandidates);
  refs.restartButton.addEventListener('click', () => refs.restartDialog.showModal());
  refs.confirmRestart.addEventListener('click', restartCurrentGame);
  refs.shareResultButton.addEventListener('click', shareResult);
  refs.playAgainButton.addEventListener('click', () => requestNewGame({}, true));
  refs.board.addEventListener('pointerdown', beginWordSearchSelection);
  refs.board.addEventListener('pointermove', moveWordSearchSelection);
  refs.board.addEventListener('pointerup', finishWordSearchSelection);
  refs.board.addEventListener('pointercancel', cancelWordSearchSelection);
  refs.board.addEventListener('pointerdown', beginNonogramStroke);
  refs.board.addEventListener('pointermove', moveNonogramStroke);
  refs.board.addEventListener('pointerup', finishNonogramStroke);
  refs.board.addEventListener('pointercancel', cancelNonogramStroke);
  refs.newGameDialog.addEventListener('close', () => {
    if (refs.newGameDialog.returnValue !== 'confirm') {
      pendingGameOptions = null;
      render();
    }
  });
  document.addEventListener('keydown', handleKeyboard);
}

function initialize() {
  state = restoreState() ?? newState();
  buildBoard();
  buildNumberPad();
  timerBase = Date.now() - state.elapsed * 1000;
  bindEvents();
  render();
  saveState();

  window.setInterval(() => {
    if (!state.running || state.completed) return;
    updateElapsed();
    renderTimer();
    if (state.elapsed % 5 === 0) saveState();
  }, 1000);
}

initialize();
