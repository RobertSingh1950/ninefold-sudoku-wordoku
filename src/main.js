import {
  ChartNoAxesColumnIncreasing,
  CircleCheck,
  Eraser,
  Grid3X3,
  Lightbulb,
  Pause,
  Pencil,
  Play,
  Plus,
  RotateCcw,
  Settings2,
  SlidersHorizontal,
  Sparkles,
  Timer,
  Trophy,
  Undo2,
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
  getDuplicateConflicts,
  getPeers,
  isSolved,
  isValidSavedGame,
} from './game.js';

const ICONS = {
  ChartNoAxesColumnIncreasing,
  CircleCheck,
  Eraser,
  Grid3X3,
  Lightbulb,
  Pause,
  Pencil,
  Play,
  Plus,
  RotateCcw,
  Settings2,
  SlidersHorizontal,
  Sparkles,
  Timer,
  Trophy,
  Undo2,
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
  modeEyebrow: document.querySelector('#modeEyebrow'),
  gameHeading: document.querySelector('#gameHeading'),
  difficulty: document.querySelector('#difficultySelect'),
  letterSet: document.querySelector('#letterSetSelect'),
  wordokuOptions: document.querySelector('#wordokuOptions'),
  autoCheck: document.querySelector('#autoCheckToggle'),
  mistakeCount: document.querySelector('#mistakeCount'),
  hintsLeft: document.querySelector('#hintsLeft'),
  bestTime: document.querySelector('#bestTime'),
  undoButton: document.querySelector('#undoButton'),
  eraseButton: document.querySelector('#eraseButton'),
  notesButton: document.querySelector('#notesButton'),
  hintButton: document.querySelector('#hintButton'),
  hintBadge: document.querySelector('#hintBadge'),
  checkButton: document.querySelector('#checkButton'),
  newGameButton: document.querySelector('#newGameButton'),
  newGameDialog: document.querySelector('#newGameDialog'),
  confirmNewGame: document.querySelector('#confirmNewGame'),
  successDialog: document.querySelector('#successDialog'),
  playAgainButton: document.querySelector('#playAgainButton'),
  finalTime: document.querySelector('#finalTime'),
  finalMistakes: document.querySelector('#finalMistakes'),
  finalDifficulty: document.querySelector('#finalDifficulty'),
  celebration: document.querySelector('#celebration'),
  toast: document.querySelector('#toast'),
};

let state;
let pendingGameOptions = null;
let timerBase = Date.now();
let toastTimer;

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
  return {
    autoCheck: settings.autoCheck !== false,
    letterSet: LETTER_SETS.includes(settings.letterSet) ? settings.letterSet : LETTER_SETS[0],
  };
}

function newState(options = {}) {
  const settings = loadSettings();
  const difficulty = DIFFICULTIES.includes(options.difficulty) ? options.difficulty : 'medium';
  const generated = createPuzzle(difficulty);

  return {
    mode: options.mode === 'wordoku' ? 'wordoku' : 'sudoku',
    difficulty: generated.difficulty,
    letterSet: LETTER_SETS.includes(options.letterSet) ? options.letterSet : settings.letterSet,
    autoCheck: settings.autoCheck,
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
  if (!isValidSavedGame(saved)) return null;

  const settings = loadSettings();
  return {
    ...saved,
    autoCheck: settings.autoCheck,
    letterSet: LETTER_SETS.includes(saved.letterSet) ? saved.letterSet : settings.letterSet,
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
    JSON.stringify({ autoCheck: state.autoCheck, letterSet: state.letterSet }),
  );
}

function bestTimeKey() {
  return `${state.mode}-${state.difficulty}`;
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
  const fragment = document.createDocumentFragment();
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
  const fragment = document.createDocumentFragment();
  for (let value = 1; value <= 9; value += 1) {
    const button = document.createElement('button');
    button.type = 'button';
    button.dataset.value = String(value);
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

function renderBoard() {
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
    button.textContent = displayValue(value, state.mode, state.letterSet);
    button.disabled = solvedCount === 9 || state.completed || !state.running;
    button.setAttribute('aria-label', `Enter ${button.textContent}`);
  });
}

function renderTimer() {
  refs.timer.textContent = formatTime(state.elapsed);
  refs.timer.dateTime = `PT${state.elapsed}S`;
}

function render() {
  document.documentElement.dataset.mode = state.mode;
  refs.sudokuMode.setAttribute('aria-selected', String(state.mode === 'sudoku'));
  refs.wordokuMode.setAttribute('aria-selected', String(state.mode === 'wordoku'));
  refs.sudokuMode.classList.toggle('active', state.mode === 'sudoku');
  refs.wordokuMode.classList.toggle('active', state.mode === 'wordoku');
  refs.difficulty.value = state.difficulty;
  refs.letterSet.value = state.letterSet;
  refs.wordokuOptions.hidden = state.mode !== 'wordoku';
  refs.autoCheck.checked = state.autoCheck;
  refs.modeEyebrow.textContent = state.mode === 'wordoku' ? state.letterSet : 'Classic Sudoku';
  refs.gameHeading.textContent = `${capitalize(state.difficulty)} puzzle`;
  refs.mistakeCount.textContent = String(state.mistakes);
  refs.hintsLeft.textContent = String(state.hints);
  refs.hintBadge.textContent = String(state.hints);
  refs.bestTime.textContent = getBestTime() === null ? '--:--' : formatTime(getBestTime());
  refs.notesButton.classList.toggle('active', state.notesMode);
  refs.notesButton.setAttribute('aria-pressed', String(state.notesMode));
  refs.undoButton.disabled = state.history.length === 0 || state.completed || !state.running;
  refs.eraseButton.disabled = !canEditSelectedCell() || state.completed || !state.running;
  refs.notesButton.disabled = state.completed || !state.running;
  refs.hintButton.disabled = state.hints === 0 || state.completed || !state.running;
  refs.checkButton.disabled = state.completed || !state.running;
  refs.pauseButton.disabled = state.completed;
  refs.pauseScreen.hidden = state.running || state.completed;
  refs.pauseButton.innerHTML = state.running
    ? '<i data-lucide="pause" aria-hidden="true"></i>'
    : '<i data-lucide="play" aria-hidden="true"></i>';
  refs.pauseButton.title = state.running ? 'Pause game' : 'Resume game';
  refs.pauseButton.setAttribute('aria-label', refs.pauseButton.title);
  renderTimer();
  renderBoard();
  renderNumberPad();
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

function canEditSelectedCell() {
  return state.selected !== null && !state.puzzle[state.selected];
}

function rememberCell(index) {
  state.history.push({
    index,
    value: state.values[index],
    notes: [...state.notes[index]],
    wasWrong: state.wrongIndices.has(index),
    wasHinted: state.hintedIndices.has(index),
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
  state.values[previous.index] = previous.value;
  state.notes[previous.index] = new Set(previous.notes);
  if (previous.wasWrong) state.wrongIndices.add(previous.index);
  else state.wrongIndices.delete(previous.index);
  if (previous.wasHinted) state.hintedIndices.add(previous.index);
  else state.hintedIndices.delete(previous.index);
  state.selected = previous.index;
  commitChange(false);
}

function useHint() {
  if (!state.hints || !state.running || state.completed) return;
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
  if (checkForCompletion && isSolved(state.values, state.solution)) completeGame();
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
  return state.values.some((value, index) => value !== state.puzzle[index]) || state.elapsed > 15;
}

function requestNewGame(options = {}, skipConfirmation = false) {
  pendingGameOptions = {
    mode: options.mode ?? state.mode,
    difficulty: options.difficulty ?? state.difficulty,
    letterSet: options.letterSet ?? state.letterSet,
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
  render();
  saveState();
}

function showToast(message) {
  window.clearTimeout(toastTimer);
  refs.toast.textContent = message;
  refs.toast.classList.add('visible');
  toastTimer = window.setTimeout(() => refs.toast.classList.remove('visible'), 2600);
}

function moveSelection(key) {
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
  refs.difficulty.addEventListener('change', (event) => requestNewGame({ difficulty: event.target.value }));
  refs.letterSet.addEventListener('change', (event) => {
    state.letterSet = event.target.value;
    saveSettings();
    render();
    saveState();
  });
  refs.autoCheck.addEventListener('change', (event) => {
    state.autoCheck = event.target.checked;
    if (state.autoCheck) {
      state.values.forEach((value, index) => {
        if (value && value !== state.solution[index]) state.wrongIndices.add(index);
      });
    } else {
      state.wrongIndices.clear();
    }
    saveSettings();
    render();
    saveState();
  });
  refs.newGameButton.addEventListener('click', () => requestNewGame());
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
  refs.playAgainButton.addEventListener('click', () => requestNewGame({}, true));
  refs.newGameDialog.addEventListener('close', () => {
    if (refs.newGameDialog.returnValue !== 'confirm') {
      pendingGameOptions = null;
      render();
    }
  });
  document.addEventListener('keydown', handleKeyboard);
}

function initialize() {
  buildBoard();
  buildNumberPad();
  state = restoreState() ?? newState();
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
