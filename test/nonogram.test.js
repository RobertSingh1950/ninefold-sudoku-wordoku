import test from 'node:test';
import assert from 'node:assert/strict';
import {
  NONOGRAM_CONFIG,
  createNonogram,
  getNonogramLineClues,
  getNonogramProgress,
  isNonogramLineComplete,
  isNonogramSolved,
  isValidNonogramSavedGame,
} from '../src/nonogram.js';

test('generates logically solvable Nonograms at every difficulty', () => {
  Object.entries(NONOGRAM_CONFIG).forEach(([difficulty, config]) => {
    const puzzle = createNonogram(difficulty);
    assert.equal(puzzle.difficulty, difficulty);
    assert.equal(puzzle.size, config.size);
    assert.equal(puzzle.solution.length, config.size ** 2);
    assert.equal(puzzle.rowClues.length, config.size);
    assert.equal(puzzle.columnClues.length, config.size);
    assert.ok(puzzle.solution.every((value) => value === 0 || value === 1));

    puzzle.rowClues.forEach((clues, row) => {
      const start = row * config.size;
      assert.deepEqual(getNonogramLineClues(puzzle.solution.slice(start, start + config.size)), clues);
    });
    puzzle.columnClues.forEach((clues, column) => {
      const values = Array.from(
        { length: config.size },
        (_, row) => puzzle.solution[row * config.size + column],
      );
      assert.deepEqual(getNonogramLineClues(values), clues);
    });
  });
});

test('calculates clues and completed lines', () => {
  const values = [1, 1, 0, 1, 0, 1, 1, 1];
  assert.deepEqual(getNonogramLineClues(values), [2, 1, 3]);
  assert.equal(isNonogramLineComplete(values, [2, 1, 3]), true);
  assert.equal(isNonogramLineComplete(values, [2, 4]), false);
  assert.deepEqual(getNonogramLineClues([0, 0, 0]), []);
});

test('tracks progress and accepts optional X marks when solved', () => {
  const solution = [1, 0, 1, 0];
  assert.deepEqual(getNonogramProgress([1, null, null, null], solution), {
    solved: 1,
    total: 2,
    percentage: 50,
  });
  assert.equal(isNonogramSolved([1, null, 1, null], solution), true);
  assert.equal(isNonogramSolved([1, 0, null, 0], solution), false);
  assert.equal(isNonogramSolved([1, 1, 1, null], solution), false);
});

test('validates persisted Nonogram games and rejects corrupted clues', () => {
  const puzzle = createNonogram('medium');
  const saved = {
    mode: 'nonogram',
    ...puzzle,
    values: Array(puzzle.solution.length).fill(null),
  };
  assert.equal(isValidNonogramSavedGame(saved), true);
  assert.equal(isValidNonogramSavedGame({ ...saved, values: [null] }), false);
  assert.equal(isValidNonogramSavedGame({ ...saved, solution: [...saved.solution, 1] }), false);
  assert.equal(isValidNonogramSavedGame({ ...saved, rowClues: saved.rowClues.slice(1) }), false);
  assert.equal(isValidNonogramSavedGame({ ...saved, mode: 'sudoku' }), false);
});
