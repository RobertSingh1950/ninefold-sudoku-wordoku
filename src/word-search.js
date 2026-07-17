import WordSearch from '@blex41/word-search';
import { DIFFICULTIES } from './game.js';

export const WORD_SEARCH_CONFIG = {
  easy: {
    size: 9,
    wordCount: 6,
    disabledDirections: ['N', 'W', 'NE', 'NW', 'SE', 'SW'],
    backwardsProbability: 0,
  },
  medium: {
    size: 10,
    wordCount: 8,
    disabledDirections: ['N', 'W', 'NE', 'NW', 'SW'],
    backwardsProbability: 0.2,
  },
  hard: {
    size: 12,
    wordCount: 10,
    disabledDirections: [],
    backwardsProbability: 0.35,
  },
  expert: {
    size: 14,
    wordCount: 12,
    disabledDirections: [],
    backwardsProbability: 0.55,
  },
};

const WORD_THEMES = [
  {
    name: 'Nature',
    words: [
      'BLOOM', 'BREEZE', 'CLOUD', 'CORAL', 'EARTH', 'FIELD', 'FLAME', 'FOREST',
      'GARDEN', 'GROVE', 'LEAF', 'MAPLE', 'MEADOW', 'OCEAN', 'PEBBLE', 'PINE',
      'RIVER', 'SHORE', 'STONE', 'STORM', 'TRAIL', 'WAVE', 'WILLOW', 'WIND',
    ],
  },
  {
    name: 'Space',
    words: [
      'ASTEROID', 'COMET', 'COSMOS', 'CRATER', 'EARTH', 'ECLIPSE', 'GALAXY', 'GRAVITY',
      'JUPITER', 'LUNAR', 'METEOR', 'MOON', 'NEBULA', 'ORBIT', 'PLANET', 'ROCKET',
      'SATURN', 'SOLAR', 'SPACE', 'STAR', 'TELESCOPE', 'VENUS', 'VOYAGE', 'WORLD',
    ],
  },
  {
    name: 'Travel',
    words: [
      'ADVENTURE', 'BEACH', 'BRIDGE', 'CABIN', 'CAMERA', 'COMPASS', 'FLIGHT', 'HARBOR',
      'HOTEL', 'ISLAND', 'JOURNEY', 'LAGOON', 'MAP', 'MARKET', 'PASSPORT', 'RESORT',
      'ROUTE', 'SAIL', 'STATION', 'SUITCASE', 'TICKET', 'TRAIL', 'TRAIN', 'VOYAGE',
    ],
  },
  {
    name: 'Kitchen',
    words: [
      'APRON', 'BAKE', 'BASIL', 'BOWL', 'BREAD', 'CHEF', 'COCOA', 'DINNER',
      'FLAVOR', 'GARLIC', 'GINGER', 'HERB', 'KETTLE', 'LEMON', 'OLIVE', 'PASTA',
      'PLATE', 'RECIPE', 'SKILLET', 'SPICE', 'SPOON', 'TASTE', 'TOAST', 'WHISK',
    ],
  },
  {
    name: 'Creative',
    words: [
      'CANVAS', 'COLOR', 'CRAFT', 'DESIGN', 'DETAIL', 'DRAWING', 'IDEA', 'INK',
      'MAKER', 'MELODY', 'MOTION', 'MUSEUM', 'PAINT', 'PAPER', 'PATTERN', 'POETRY',
      'RHYTHM', 'SHAPE', 'SKETCH', 'STORY', 'STUDIO', 'TEXTURE', 'VISION', 'WORDS',
    ],
  },
];

function shuffled(values) {
  const copy = [...values];
  for (let index = copy.length - 1; index > 0; index -= 1) {
    const swapIndex = Math.floor(Math.random() * (index + 1));
    [copy[index], copy[swapIndex]] = [copy[swapIndex], copy[index]];
  }
  return copy;
}

export function createWordSearch(difficulty = 'medium') {
  const safeDifficulty = DIFFICULTIES.includes(difficulty) ? difficulty : 'medium';
  const config = WORD_SEARCH_CONFIG[safeDifficulty];

  for (let attempt = 0; attempt < 30; attempt += 1) {
    const theme = WORD_THEMES[Math.floor(Math.random() * WORD_THEMES.length)];
    const dictionary = shuffled(theme.words)
      .filter((word) => word.length <= config.size)
      .slice(0, config.wordCount);
    const generated = new WordSearch({
      rows: config.size,
      cols: config.size,
      dictionary,
      maxWords: config.wordCount,
      disabledDirections: config.disabledDirections,
      backwardsProbability: config.backwardsProbability,
      upperCase: true,
    });

    if (generated.words.length !== config.wordCount) continue;

    return {
      difficulty: safeDifficulty,
      theme: theme.name,
      size: config.size,
      grid: generated.grid.flat(),
      words: generated.words.map(({ clean }) => clean).sort((left, right) => left.localeCompare(right)),
      placements: generated.words.map(({ clean, path }) => ({
        word: clean,
        cells: path.map(({ x, y }) => y * config.size + x),
      })),
    };
  }

  throw new Error(`Unable to generate a ${safeDifficulty} word search puzzle.`);
}

export function getWordSearchSelection(start, end, size) {
  if (![start, end, size].every(Number.isInteger) || size < 2) return [];
  if (start < 0 || end < 0 || start >= size * size || end >= size * size) return [];

  const startRow = Math.floor(start / size);
  const startColumn = start % size;
  const endRow = Math.floor(end / size);
  const endColumn = end % size;
  const rowDelta = endRow - startRow;
  const columnDelta = endColumn - startColumn;
  const isStraight = rowDelta === 0 || columnDelta === 0 || Math.abs(rowDelta) === Math.abs(columnDelta);
  if (!isStraight) return [];

  const rowStep = Math.sign(rowDelta);
  const columnStep = Math.sign(columnDelta);
  const steps = Math.max(Math.abs(rowDelta), Math.abs(columnDelta));
  return Array.from(
    { length: steps + 1 },
    (_, offset) => (startRow + rowStep * offset) * size + startColumn + columnStep * offset,
  );
}

export function getSnappedWordSearchSelection(start, end, size) {
  if (![start, end, size].every(Number.isInteger) || start < 0 || end < 0) return [];
  if (start >= size * size || end >= size * size) return [];

  const startRow = Math.floor(start / size);
  const startColumn = start % size;
  const endRow = Math.floor(end / size);
  const endColumn = end % size;
  const rowDelta = endRow - startRow;
  const columnDelta = endColumn - startColumn;
  const rowDistance = Math.abs(rowDelta);
  const columnDistance = Math.abs(columnDelta);
  if (!rowDistance && !columnDistance) return [start];

  let rowStep = Math.sign(rowDelta);
  let columnStep = Math.sign(columnDelta);
  if (rowDistance > columnDistance * 1.6) columnStep = 0;
  else if (columnDistance > rowDistance * 1.6) rowStep = 0;

  const rowCapacity = rowStep > 0 ? size - 1 - startRow : rowStep < 0 ? startRow : size;
  const columnCapacity = columnStep > 0 ? size - 1 - startColumn : columnStep < 0 ? startColumn : size;
  const capacity = Math.min(rowCapacity, columnCapacity);
  const steps = Math.min(Math.max(rowDistance, columnDistance), capacity);
  const snappedEnd = (startRow + rowStep * steps) * size + startColumn + columnStep * steps;
  return getWordSearchSelection(start, snappedEnd, size);
}

export function getSelectedWord(grid, cells) {
  return cells.map((index) => grid[index] ?? '').join('');
}

export function findWordSearchMatch(grid, words, foundWords, cells) {
  if (!Array.isArray(cells) || cells.length < 2) return null;
  const selected = getSelectedWord(grid, cells);
  const reversed = [...selected].reverse().join('');
  const found = foundWords instanceof Set ? foundWords : new Set(foundWords);
  return words.find((word) => !found.has(word) && (word === selected || word === reversed)) ?? null;
}

export function isValidWordSearchSavedGame(candidate) {
  if (!candidate || typeof candidate !== 'object' || candidate.mode !== 'wordsearch') return false;
  if (!DIFFICULTIES.includes(candidate.difficulty)) return false;
  if (!Number.isInteger(candidate.size) || candidate.size < 9 || candidate.size > 14) return false;
  if (!Array.isArray(candidate.grid) || candidate.grid.length !== candidate.size ** 2) return false;
  if (!candidate.grid.every((letter) => typeof letter === 'string' && /^[A-Z]$/.test(letter))) return false;
  if (!Array.isArray(candidate.words) || candidate.words.length < 1) return false;
  if (!candidate.words.every((word) => typeof word === 'string' && /^[A-Z]+$/.test(word))) return false;
  if (!Array.isArray(candidate.placements) || candidate.placements.length !== candidate.words.length) return false;

  return candidate.placements.every(({ word, cells }) => (
    candidate.words.includes(word)
    && Array.isArray(cells)
    && cells.length === word.length
    && cells.every((index) => Number.isInteger(index) && index >= 0 && index < candidate.grid.length)
  ));
}
