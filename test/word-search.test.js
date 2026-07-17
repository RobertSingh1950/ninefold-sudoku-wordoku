import test from 'node:test';
import assert from 'node:assert/strict';
import {
  WORD_SEARCH_CONFIG,
  createWordSearch,
  findWordSearchMatch,
  getSelectedWord,
  getSnappedWordSearchSelection,
  getWordSearchSelection,
  isValidWordSearchSavedGame,
} from '../src/word-search.js';

test('generates complete Word Search puzzles at every difficulty', () => {
  Object.entries(WORD_SEARCH_CONFIG).forEach(([difficulty, config]) => {
    const puzzle = createWordSearch(difficulty);
    assert.equal(puzzle.difficulty, difficulty);
    assert.equal(puzzle.size, config.size);
    assert.equal(puzzle.grid.length, config.size ** 2);
    assert.equal(puzzle.words.length, config.wordCount);
    assert.equal(puzzle.placements.length, config.wordCount);
    assert.ok(puzzle.grid.every((letter) => /^[A-Z]$/.test(letter)));
    puzzle.placements.forEach(({ word, cells }) => {
      const selected = getSelectedWord(puzzle.grid, cells);
      assert.ok(selected === word || [...selected].reverse().join('') === word);
    });
  });
});

test('builds horizontal, vertical, diagonal, and reverse selections', () => {
  assert.deepEqual(getWordSearchSelection(0, 3, 5), [0, 1, 2, 3]);
  assert.deepEqual(getWordSearchSelection(0, 15, 5), [0, 5, 10, 15]);
  assert.deepEqual(getWordSearchSelection(0, 18, 5), [0, 6, 12, 18]);
  assert.deepEqual(getWordSearchSelection(18, 0, 5), [18, 12, 6, 0]);
  assert.deepEqual(getWordSearchSelection(0, 7, 5), []);
});

test('snaps approximate drags to one of eight valid directions', () => {
  assert.deepEqual(getSnappedWordSearchSelection(12, 23, 5), [12, 17, 22]);
  assert.deepEqual(getSnappedWordSearchSelection(12, 19, 5), [12, 13, 14]);
  assert.deepEqual(getSnappedWordSearchSelection(6, 23, 5), [6, 12, 18, 24]);
});

test('matches selected words in either direction and ignores found words', () => {
  const grid = [...'PUZZLEABC'];
  const cells = [0, 1, 2, 3, 4, 5];
  assert.equal(findWordSearchMatch(grid, ['PUZZLE'], new Set(), cells), 'PUZZLE');
  assert.equal(findWordSearchMatch(grid, ['PUZZLE'], new Set(), [...cells].reverse()), 'PUZZLE');
  assert.equal(findWordSearchMatch(grid, ['PUZZLE'], new Set(['PUZZLE']), cells), null);
});

test('validates persisted Word Search puzzles', () => {
  const puzzle = createWordSearch('easy');
  const saved = { mode: 'wordsearch', ...puzzle };
  assert.equal(isValidWordSearchSavedGame(saved), true);
  assert.equal(isValidWordSearchSavedGame({ ...saved, grid: ['A'] }), false);
  assert.equal(isValidWordSearchSavedGame({ ...saved, mode: 'sudoku' }), false);
});
