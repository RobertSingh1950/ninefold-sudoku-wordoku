import { DIFFICULTIES } from './game.js';

if (typeof globalThis.window === 'undefined') globalThis.window = globalThis;
const { default: Nonogram } = await import('monkey-nonogram');

export const NONOGRAM_CONFIG = {
  easy: { size: 5, density: 0.56 },
  medium: { size: 8, density: 0.52 },
  hard: { size: 10, density: 0.5 },
  expert: { size: 12, density: 0.48 },
};

export function getNonogramLineClues(values) {
  const clues = [];
  let run = 0;

  values.forEach((value) => {
    if (value === 1) {
      run += 1;
    } else if (run) {
      clues.push(run);
      run = 0;
    }
  });
  if (run) clues.push(run);
  return clues;
}

export function createNonogram(difficulty = 'medium') {
  const safeDifficulty = DIFFICULTIES.includes(difficulty) ? difficulty : 'medium';
  const config = NONOGRAM_CONFIG[safeDifficulty];
  const puzzle = new Nonogram.Creator().createRandom(config.size, config.size, config.density);

  return {
    difficulty: safeDifficulty,
    size: config.size,
    solution: puzzle.cells.map(({ solution }) => solution),
    rowClues: puzzle.rowHints.map((clues) => [...clues]),
    columnClues: puzzle.columnHints.map((clues) => [...clues]),
  };
}

export function isNonogramLineComplete(values, clues) {
  const actual = getNonogramLineClues(values);
  return actual.length === clues.length && actual.every((clue, index) => clue === clues[index]);
}

export function getNonogramProgress(values, solution) {
  const total = solution.reduce((count, value) => count + Number(value === 1), 0);
  const solved = solution.reduce(
    (count, value, index) => count + Number(value === 1 && values[index] === 1),
    0,
  );
  return { solved, total, percentage: total ? Math.round((solved / total) * 100) : 100 };
}

export function isNonogramSolved(values, solution) {
  return solution.every((value, index) => (value === 1 ? values[index] === 1 : values[index] !== 1));
}

function hasValidClues(clues, size) {
  return Array.isArray(clues)
    && clues.every((line) => (
      Array.isArray(line)
      && line.every((value) => Number.isInteger(value) && value > 0)
      && line.reduce((sum, value) => sum + value, 0) + Math.max(0, line.length - 1) <= size
    ));
}

function cluesMatchSolution(candidate) {
  const rowsMatch = candidate.rowClues.every((clues, row) => {
    const start = row * candidate.size;
    return isNonogramLineComplete(candidate.solution.slice(start, start + candidate.size), clues);
  });
  const columnsMatch = candidate.columnClues.every((clues, column) => {
    const values = Array.from(
      { length: candidate.size },
      (_, row) => candidate.solution[row * candidate.size + column],
    );
    return isNonogramLineComplete(values, clues);
  });
  return rowsMatch && columnsMatch;
}

export function isValidNonogramSavedGame(candidate) {
  if (!candidate || typeof candidate !== 'object' || candidate.mode !== 'nonogram') return false;
  if (!DIFFICULTIES.includes(candidate.difficulty)) return false;
  if (candidate.size !== NONOGRAM_CONFIG[candidate.difficulty].size) return false;
  if (!Array.isArray(candidate.solution) || candidate.solution.length !== candidate.size ** 2) return false;
  if (!candidate.solution.every((value) => value === 0 || value === 1)) return false;
  if (!Array.isArray(candidate.values) || candidate.values.length !== candidate.solution.length) return false;
  if (!candidate.values.every((value) => value === null || value === 0 || value === 1)) return false;
  if (!hasValidClues(candidate.rowClues, candidate.size) || candidate.rowClues.length !== candidate.size) return false;
  if (!hasValidClues(candidate.columnClues, candidate.size) || candidate.columnClues.length !== candidate.size) return false;
  return cluesMatchSolution(candidate);
}
