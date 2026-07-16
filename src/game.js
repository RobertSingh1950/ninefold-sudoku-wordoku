import { getSudoku } from 'sudoku-gen';

export const DIFFICULTIES = ['easy', 'medium', 'hard', 'expert'];
export const LETTER_SETS = ['DISCOVERY', 'ALGORITHM', 'BLUEPRINT'];

export function createPuzzle(difficulty = 'medium') {
  const safeDifficulty = DIFFICULTIES.includes(difficulty) ? difficulty : 'medium';
  const generated = getSudoku(safeDifficulty);

  return {
    difficulty: generated.difficulty,
    puzzle: parseGrid(generated.puzzle),
    solution: parseGrid(generated.solution),
  };
}

export function parseGrid(grid) {
  return [...grid].map((character) => (character === '-' ? 0 : Number(character)));
}

export function displayValue(value, mode = 'sudoku', letterSet = LETTER_SETS[0]) {
  if (!value) return '';
  if (mode === 'wordoku') return letterSet[value - 1] ?? '';
  return String(value);
}

export function getPeers(index) {
  const row = Math.floor(index / 9);
  const column = index % 9;
  const blockRow = Math.floor(row / 3) * 3;
  const blockColumn = Math.floor(column / 3) * 3;
  const peers = new Set();

  for (let position = 0; position < 9; position += 1) {
    peers.add(row * 9 + position);
    peers.add(position * 9 + column);
  }

  for (let rowOffset = 0; rowOffset < 3; rowOffset += 1) {
    for (let columnOffset = 0; columnOffset < 3; columnOffset += 1) {
      peers.add((blockRow + rowOffset) * 9 + blockColumn + columnOffset);
    }
  }

  peers.delete(index);
  return peers;
}

export function getDuplicateConflicts(values) {
  const conflicts = new Set();
  const units = [];

  for (let index = 0; index < 9; index += 1) {
    units.push(Array.from({ length: 9 }, (_, column) => index * 9 + column));
    units.push(Array.from({ length: 9 }, (_, row) => row * 9 + index));
  }

  for (let blockRow = 0; blockRow < 3; blockRow += 1) {
    for (let blockColumn = 0; blockColumn < 3; blockColumn += 1) {
      const unit = [];
      for (let rowOffset = 0; rowOffset < 3; rowOffset += 1) {
        for (let columnOffset = 0; columnOffset < 3; columnOffset += 1) {
          unit.push((blockRow * 3 + rowOffset) * 9 + blockColumn * 3 + columnOffset);
        }
      }
      units.push(unit);
    }
  }

  units.forEach((unit) => {
    const positionsByValue = new Map();
    unit.forEach((position) => {
      const value = values[position];
      if (!value) return;
      const positions = positionsByValue.get(value) ?? [];
      positions.push(position);
      positionsByValue.set(value, positions);
    });

    positionsByValue.forEach((positions) => {
      if (positions.length > 1) positions.forEach((position) => conflicts.add(position));
    });
  });

  return conflicts;
}

export function isSolved(values, solution) {
  return values.length === 81 && values.every((value, index) => value === solution[index]);
}

export function formatTime(totalSeconds) {
  const seconds = Math.max(0, Math.floor(totalSeconds));
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const remainder = seconds % 60;
  const base = `${String(minutes).padStart(2, '0')}:${String(remainder).padStart(2, '0')}`;
  return hours ? `${String(hours).padStart(2, '0')}:${base}` : base;
}

export function isValidSavedGame(candidate) {
  if (!candidate || typeof candidate !== 'object') return false;
  if (!DIFFICULTIES.includes(candidate.difficulty)) return false;
  if (!['sudoku', 'wordoku'].includes(candidate.mode)) return false;

  return [candidate.puzzle, candidate.solution, candidate.values].every(
    (grid) => Array.isArray(grid) && grid.length === 81 && grid.every((value) => Number.isInteger(value) && value >= 0 && value <= 9),
  );
}
