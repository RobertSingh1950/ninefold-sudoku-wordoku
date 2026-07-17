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

export const WORD_SEARCH_LANGUAGES = ['english', 'hindi'];

const ENGLISH_WORD_THEMES = [
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

const HINDI_WORD_THEMES = [
  {
    name: 'प्रकृति',
    words: [
      'आकाश', 'बादल', 'बारिश', 'नदी', 'पर्वत', 'जंगल', 'कमल', 'हवा',
      'सागर', 'झरना', 'धरती', 'सूरज', 'चाँद', 'तारा', 'पत्ता', 'फूल',
      'कली', 'घास', 'बीज', 'मिट्टी', 'लहर', 'वन', 'पेड़', 'धूप',
    ],
  },
  {
    name: 'यात्रा',
    words: [
      'शहर', 'गाँव', 'सड़क', 'सफर', 'रेल', 'बस', 'होटल', 'टिकट',
      'नक्शा', 'यात्रा', 'पुल', 'बाजार', 'मंदिर', 'महल', 'किला', 'विमान',
      'नाव', 'पहाड़', 'रास्ता', 'मंजिल', 'चौराहा', 'स्टेशन', 'मेला', 'यात्री',
    ],
  },
  {
    name: 'घर और रसोई',
    words: [
      'रोटी', 'दाल', 'चावल', 'मसाला', 'नमक', 'चीनी', 'चाय', 'दूध',
      'कप', 'थाली', 'कटोरी', 'चम्मच', 'रसोई', 'पानी', 'फल', 'सब्जी',
      'आटा', 'तेल', 'स्वाद', 'भोजन', 'पकवान', 'बर्तन', 'गैस', 'मेज',
    ],
  },
  {
    name: 'खेल',
    words: [
      'खेल', 'गेंद', 'बल्ला', 'दौड़', 'योग', 'कसरत', 'जीत', 'टीम',
      'लक्ष्य', 'मैदान', 'तैराकी', 'शतरंज', 'कबड्डी', 'फुटबॉल', 'हॉकी', 'पदक',
      'कप्तान', 'खिलाड़ी', 'कुश्ती', 'तीर', 'धनुष', 'रेस', 'स्कोर', 'दंगल',
    ],
  },
  {
    name: 'ज्ञान',
    words: [
      'किताब', 'कलम', 'शब्द', 'भाषा', 'कविता', 'कहानी', 'गणित', 'विज्ञान',
      'इतिहास', 'कला', 'संगीत', 'चित्र', 'अक्षर', 'पाठ', 'कक्षा', 'स्कूल',
      'शिक्षक', 'छात्र', 'विचार', 'सवाल', 'जवाब', 'लेखन', 'सपना', 'कल्पना',
    ],
  },
];

const WORD_THEMES = {
  english: ENGLISH_WORD_THEMES,
  hindi: HINDI_WORD_THEMES,
};

const HINDI_FILLER_GRAPHEMES = [
  'अ', 'आ', 'इ', 'ई', 'उ', 'ए', 'क', 'ख', 'ग', 'घ', 'च', 'ज', 'ट', 'ठ',
  'ड', 'त', 'थ', 'द', 'ध', 'न', 'प', 'फ', 'ब', 'भ', 'म', 'य', 'र', 'ल',
  'व', 'श', 'स', 'ह',
];

const hindiSegmenter = typeof Intl.Segmenter === 'function'
  ? new Intl.Segmenter('hi', { granularity: 'grapheme' })
  : null;

export function splitWordSearchGraphemes(value) {
  const normalized = String(value ?? '').normalize('NFC');
  if (hindiSegmenter) {
    return [...hindiSegmenter.segment(normalized)].map(({ segment }) => segment);
  }

  return [...normalized].reduce((graphemes, character) => {
    const previous = graphemes.at(-1) ?? '';
    const continuesCluster = /\p{Mark}/u.test(character)
      || character === '\u200c'
      || character === '\u200d'
      || /[\u094d\u200c\u200d]$/u.test(previous);
    if (graphemes.length && continuesCluster) graphemes[graphemes.length - 1] += character;
    else graphemes.push(character);
    return graphemes;
  }, []);
}

function shuffled(values) {
  const copy = [...values];
  for (let index = copy.length - 1; index > 0; index -= 1) {
    const swapIndex = Math.floor(Math.random() * (index + 1));
    [copy[index], copy[swapIndex]] = [copy[swapIndex], copy[index]];
  }
  return copy;
}

function encodeHindiWords(words) {
  const graphemes = [...new Set(words.flatMap(splitWordSearchGraphemes))];
  const graphemeToToken = new Map(
    graphemes.map((grapheme, index) => [grapheme, String.fromCharCode(0xe000 + index)]),
  );
  const tokenToGrapheme = new Map([...graphemeToToken].map(([grapheme, token]) => [token, grapheme]));
  const encodedToWord = new Map();
  const dictionary = words.map((word) => {
    const encoded = splitWordSearchGraphemes(word).map((grapheme) => graphemeToToken.get(grapheme)).join('');
    encodedToWord.set(encoded, word);
    return encoded;
  });
  return { dictionary, encodedToWord, tokenToGrapheme };
}

export function createWordSearch(difficulty = 'medium', language = 'english') {
  const safeDifficulty = DIFFICULTIES.includes(difficulty) ? difficulty : 'medium';
  const safeLanguage = WORD_SEARCH_LANGUAGES.includes(language) ? language : 'english';
  const config = WORD_SEARCH_CONFIG[safeDifficulty];
  const themes = WORD_THEMES[safeLanguage];

  for (let attempt = 0; attempt < 30; attempt += 1) {
    const theme = themes[Math.floor(Math.random() * themes.length)];
    const selectedWords = shuffled(theme.words)
      .map((word) => word.normalize('NFC'))
      .filter((word) => splitWordSearchGraphemes(word).length <= config.size)
      .slice(0, config.wordCount);
    if (selectedWords.length !== config.wordCount) continue;

    const encoded = safeLanguage === 'hindi' ? encodeHindiWords(selectedWords) : null;
    const dictionary = encoded?.dictionary ?? selectedWords;
    const generated = new WordSearch({
      rows: config.size,
      cols: config.size,
      dictionary,
      maxWords: config.wordCount,
      disabledDirections: config.disabledDirections,
      backwardsProbability: config.backwardsProbability,
      upperCase: true,
      diacritics: safeLanguage === 'hindi',
    });

    if (generated.words.length !== config.wordCount) continue;

    const placements = generated.words.map(({ clean, path }) => ({
      word: encoded?.encodedToWord.get(clean) ?? clean,
      cells: path.map(({ x, y }) => y * config.size + x),
    }));
    if (placements.some(({ word }) => !word)) continue;

    let grid = generated.grid.flat();
    if (safeLanguage === 'hindi') {
      const occupiedCells = new Set(placements.flatMap(({ cells }) => cells));
      const fillerGraphemes = [
        ...new Set([...HINDI_FILLER_GRAPHEMES, ...selectedWords.flatMap(splitWordSearchGraphemes)]),
      ];
      grid = grid.map((token, index) => (
        occupiedCells.has(index)
          ? encoded.tokenToGrapheme.get(token)
          : fillerGraphemes[Math.floor(Math.random() * fillerGraphemes.length)]
      ));
      if (grid.some((grapheme) => !grapheme)) continue;
    }

    return {
      difficulty: safeDifficulty,
      wordSearchLanguage: safeLanguage,
      theme: theme.name,
      size: config.size,
      grid,
      words: placements
        .map(({ word }) => word)
        .sort((left, right) => left.localeCompare(right, safeLanguage === 'hindi' ? 'hi' : 'en')),
      placements,
    };
  }

  throw new Error(`Unable to generate a ${safeDifficulty} ${safeLanguage} word search puzzle.`);
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
  const reversed = getSelectedWord(grid, [...cells].reverse());
  const found = foundWords instanceof Set ? foundWords : new Set(foundWords);
  return words.find((word) => !found.has(word) && (word === selected || word === reversed)) ?? null;
}

export function isValidWordSearchSavedGame(candidate) {
  if (!candidate || typeof candidate !== 'object' || candidate.mode !== 'wordsearch') return false;
  if (!DIFFICULTIES.includes(candidate.difficulty)) return false;
  const language = candidate.wordSearchLanguage ?? 'english';
  if (!WORD_SEARCH_LANGUAGES.includes(language)) return false;
  if (!Number.isInteger(candidate.size) || candidate.size < 9 || candidate.size > 14) return false;
  if (!Array.isArray(candidate.grid) || candidate.grid.length !== candidate.size ** 2) return false;
  const isValidCell = language === 'hindi'
    ? (letter) => (
      typeof letter === 'string'
      && /^[\u0900-\u097f]+$/u.test(letter)
      && splitWordSearchGraphemes(letter).length === 1
    )
    : (letter) => typeof letter === 'string' && /^[A-Z]$/.test(letter);
  if (!candidate.grid.every(isValidCell)) return false;
  if (!Array.isArray(candidate.words) || candidate.words.length < 1) return false;
  const isValidWord = language === 'hindi'
    ? (word) => typeof word === 'string' && /^[\u0900-\u097f]+$/u.test(word)
    : (word) => typeof word === 'string' && /^[A-Z]+$/.test(word);
  if (!candidate.words.every(isValidWord)) return false;
  if (!Array.isArray(candidate.placements) || candidate.placements.length !== candidate.words.length) return false;

  return candidate.placements.every(({ word, cells }) => {
    if (!candidate.words.includes(word) || !Array.isArray(cells)) return false;
    if (cells.length !== splitWordSearchGraphemes(word).length) return false;
    if (!cells.every((index) => Number.isInteger(index) && index >= 0 && index < candidate.grid.length)) {
      return false;
    }
    const selected = getSelectedWord(candidate.grid, cells);
    const reversed = getSelectedWord(candidate.grid, [...cells].reverse());
    return selected === word || reversed === word;
  });
}
