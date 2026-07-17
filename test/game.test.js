import test from 'node:test';
import assert from 'node:assert/strict';
import {
  createPuzzle,
  displayValue,
  formatTime,
  getCandidates,
  getDuplicateConflicts,
  getPeers,
  isSolved,
  isValidSavedGame,
} from '../src/game.js';

test('creates a complete playable puzzle at the requested difficulty', () => {
  const game = createPuzzle('hard');
  assert.equal(game.difficulty, 'hard');
  assert.equal(game.puzzle.length, 81);
  assert.equal(game.solution.length, 81);
  assert.ok(game.puzzle.some((value) => value === 0));
  assert.ok(game.solution.every((value) => value >= 1 && value <= 9));
});

test('maps digits to Wordoku letters', () => {
  assert.equal(displayValue(1, 'sudoku'), '1');
  assert.equal(displayValue(1, 'wordoku', 'DISCOVERY'), 'D');
  assert.equal(displayValue(9, 'wordoku', 'DISCOVERY'), 'Y');
  assert.equal(displayValue(0, 'wordoku', 'DISCOVERY'), '');
});

test('finds all twenty peers for a center cell', () => {
  const peers = getPeers(40);
  assert.equal(peers.size, 20);
  assert.ok(peers.has(4));
  assert.ok(peers.has(36));
  assert.ok(peers.has(30));
  assert.ok(!peers.has(40));
});

test('calculates candidate notes from row, column, and block peers', () => {
  const values = Array(81).fill(0);
  values[0] = 1;
  values[10] = 2;
  values[22] = 3;
  values[76] = 4;
  assert.deepEqual(getCandidates(values, 4), [2, 5, 6, 7, 8, 9]);
  assert.deepEqual(getCandidates(values, 0), []);
});

test('detects duplicate entries in a row, column, or block', () => {
  const values = Array(81).fill(0);
  values[0] = 5;
  values[1] = 5;
  values[9] = 5;
  const conflicts = getDuplicateConflicts(values);
  assert.deepEqual([...conflicts].sort((a, b) => a - b), [0, 1, 9]);
});

test('checks solved grids and formats timers', () => {
  const solution = Array.from({ length: 81 }, (_, index) => (index % 9) + 1);
  assert.equal(isSolved([...solution], solution), true);
  const unfinished = [...solution];
  unfinished[10] = 0;
  assert.equal(isSolved(unfinished, solution), false);
  assert.equal(formatTime(65), '01:05');
  assert.equal(formatTime(3661), '01:01:01');
});

test('rejects malformed saved games', () => {
  assert.equal(isValidSavedGame(null), false);
  assert.equal(isValidSavedGame({ mode: 'sudoku' }), false);
  assert.equal(
    isValidSavedGame({
      mode: 'sudoku',
      difficulty: 'easy',
      puzzle: Array(81).fill(0),
      solution: Array(81).fill(1),
      values: Array(81).fill(0),
    }),
    true,
  );
});
