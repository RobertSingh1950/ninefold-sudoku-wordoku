# Ninefold

A responsive, browser-based Sudoku and Wordoku game with four difficulty levels, a pauseable timer, manual and automatic candidate notes, bulk undo, hints, mistake checking, puzzle restart, dark mode, saved progress, shareable results, and best times.

The layout is tested at iPad Mini, iPad Air, 11-inch iPad Pro, and 13-inch iPad Pro viewport sizes in portrait and landscape using both Chromium and WebKit.

**Play it live:** [robertsingh1950.github.io/ninefold-sudoku-wordoku](https://robertsingh1950.github.io/ninefold-sudoku-wordoku/)

## Local development

```bash
npm install
npm run dev
```

## Checks

```bash
npm test
npm run build
npm run test:browser
```

For the WebKit/Safari compatibility pass, install Playwright's WebKit browser once with `npx playwright-core install webkit`, then run `npm run test:webkit`.

The included GitHub Actions workflow builds and publishes the site to GitHub Pages whenever `main` is pushed.

Puzzle generation is powered by [`sudoku-gen`](https://www.npmjs.com/package/sudoku-gen), licensed under MIT. Interface icons are provided by [Lucide](https://lucide.dev/).
