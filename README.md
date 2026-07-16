# Ninefold

A responsive, browser-based Sudoku and Wordoku game with four difficulty levels, a pauseable timer, notes, undo, hints, mistake checking, saved progress, and best times.

## Local development

```bash
npm install
npm run dev
```

## Checks

```bash
npm test
npm run build
```

The included GitHub Actions workflow builds and publishes the site to GitHub Pages whenever `main` is pushed.

Puzzle generation is powered by [`sudoku-gen`](https://www.npmjs.com/package/sudoku-gen), licensed under MIT. Interface icons are provided by [Lucide](https://lucide.dev/).
