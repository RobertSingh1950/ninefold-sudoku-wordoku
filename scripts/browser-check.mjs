import assert from 'node:assert/strict';
import { mkdir } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { chromium, webkit } from 'playwright-core';

const appUrl = process.env.APP_URL ?? 'http://127.0.0.1:4173';
const executablePath = process.env.CHROME_PATH ?? 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const artifactsPath = new URL('../artifacts/', import.meta.url);
const browserErrors = [];
const engine = process.argv.includes('--webkit') ? 'webkit' : 'chromium';
const canonicalUrl = 'https://robertsingh1950.github.io/ninefold-sudoku-wordoku/';

const tabletSizes = [
  { name: 'ipad-mini-portrait', width: 768, height: 1024 },
  { name: 'ipad-mini-landscape', width: 1024, height: 768 },
  { name: 'ipad-air-portrait', width: 820, height: 1180 },
  { name: 'ipad-air-landscape', width: 1180, height: 820 },
  { name: 'ipad-pro-11-portrait', width: 834, height: 1194 },
  { name: 'ipad-pro-11-landscape', width: 1194, height: 834 },
  { name: 'ipad-pro-13-portrait', width: 1024, height: 1366 },
  { name: 'ipad-pro-13-landscape', width: 1366, height: 1024 },
];

await mkdir(artifactsPath, { recursive: true });

function watchBrowser(page) {
  page.on('pageerror', (error) => browserErrors.push(error.message));
  page.on('console', (message) => {
    if (['error', 'warning'].includes(message.type())) browserErrors.push(message.text());
  });
}

async function notedCellCount(page) {
  return page.locator('.notes-grid').evaluateAll((grids) => (
    grids.filter((grid) => grid.textContent.trim()).length
  ));
}

async function findWordSearchTarget(page, requestedWord = null) {
  return page.evaluate((wordToFind) => {
    const cells = [...document.querySelectorAll('.word-search-cell')];
    const size = Math.sqrt(cells.length);
    const letters = cells.map((cell) => cell.textContent.trim());
    const listedWords = [...document.querySelectorAll('.word-search-list li:not(.found) span:last-child')]
      .map((label) => label.textContent.trim());
    const words = wordToFind ? [wordToFind] : listedWords;
    const directions = [-1, 0, 1]
      .flatMap((rowStep) => [-1, 0, 1].map((columnStep) => [rowStep, columnStep]))
      .filter(([rowStep, columnStep]) => rowStep || columnStep);

    for (const word of words) {
      for (let start = 0; start < cells.length; start += 1) {
        const startRow = Math.floor(start / size);
        const startColumn = start % size;
        for (const [rowStep, columnStep] of directions) {
          const path = [...word].map((_, offset) => {
            const row = startRow + rowStep * offset;
            const column = startColumn + columnStep * offset;
            return row < 0 || column < 0 || row >= size || column >= size ? null : row * size + column;
          });
          if (path.includes(null)) continue;
          if (path.map((index) => letters[index]).join('') === word) {
            return { word, start: path[0], end: path.at(-1), path };
          }
        }
      }
    }
    return null;
  }, requestedWord);
}

async function dragWordSearchPath(page, target) {
  const start = await page.locator('.word-search-cell').nth(target.start).boundingBox();
  const end = await page.locator('.word-search-cell').nth(target.end).boundingBox();
  assert.ok(start && end, `word path for ${target.word} should be visible`);
  await page.mouse.move(start.x + start.width / 2, start.y + start.height / 2);
  await page.mouse.down();
  await page.mouse.move(end.x + end.width / 2, end.y + end.height / 2, { steps: target.path.length });
  await page.mouse.up();
}

async function layoutMetrics(page) {
  return page.evaluate(() => {
    const visible = (element) => {
      const style = getComputedStyle(element);
      const rect = element.getBoundingClientRect();
      return style.display !== 'none' && style.visibility !== 'hidden' && rect.width > 0 && rect.height > 0;
    };
    const rectFor = (selector) => {
      const rect = document.querySelector(selector).getBoundingClientRect();
      return { left: rect.left, right: rect.right, top: rect.top, bottom: rect.bottom, width: rect.width, height: rect.height };
    };
    const playArea = rectFor('.play-area');
    const controlPanel = rectFor('.control-panel');
    const regionsOverlap = !(
      playArea.right <= controlPanel.left
      || controlPanel.right <= playArea.left
      || playArea.bottom <= controlPanel.top
      || controlPanel.bottom <= playArea.top
    );
    const controls = [...document.querySelectorAll(
      '.app-header button, .mode-button, .number-pad button, .tool-button, .panel-action, .word-search-cell, select, .check-button, .faq-list summary, .app-footer a',
    )].filter(visible);

    return {
      documentWidth: document.documentElement.scrollWidth,
      viewportWidth: window.innerWidth,
      board: rectFor('#sudokuBoard'),
      regionsOverlap,
      overflowingControls: controls
        .filter((element) => element.scrollWidth > element.clientWidth + 1)
        .map((element) => element.getAttribute('aria-label') || element.textContent.trim()),
      undersizedTouchTargets: controls
        .filter((element) => {
          const rect = element.getBoundingClientRect();
          return rect.width < 43.5 || rect.height < 43.5;
        })
        .map((element) => element.getAttribute('aria-label') || element.textContent.trim()),
      panelColumns: getComputedStyle(document.querySelector('.control-panel')).gridTemplateColumns,
    };
  });
}

const browser = engine === 'webkit'
  ? await webkit.launch({ headless: true })
  : await chromium.launch({ headless: true, executablePath });

function artifactPath(name) {
  return fileURLToPath(new URL(`${engine}-${name}`, artifactsPath));
}

try {
  const context = await browser.newContext({ viewport: { width: 1440, height: 1000 } });
  const page = await context.newPage();
  watchBrowser(page);

  await page.goto(appUrl, { waitUntil: 'networkidle' });

  const seo = await page.evaluate(() => {
    const content = (selector) => document.querySelector(selector)?.getAttribute('content') ?? '';
    const schemas = [...document.querySelectorAll('script[type="application/ld+json"]')]
      .map((script) => JSON.parse(script.textContent));
    return {
      title: document.title,
      description: content('meta[name="description"]'),
      robots: content('meta[name="robots"]'),
      canonical: document.querySelector('link[rel="canonical"]')?.href ?? '',
      manifest: document.querySelector('link[rel="manifest"]')?.href ?? '',
      openGraphTitle: content('meta[property="og:title"]'),
      openGraphDescription: content('meta[property="og:description"]'),
      openGraphImage: content('meta[property="og:image"]'),
      openGraphImageAlt: content('meta[property="og:image:alt"]'),
      twitterCard: content('meta[name="twitter:card"]'),
      h1Count: document.querySelectorAll('h1').length,
      faqCount: document.querySelectorAll('.faq-list details').length,
      schemas,
    };
  });

  assert.ok(seo.title.length >= 30 && seo.title.length <= 60, 'SEO title should use a useful search-result length');
  assert.ok(
    seo.title.includes('Sudoku') && seo.title.includes('Wordoku') && seo.title.includes('Word Search'),
    'SEO title should name all three game modes',
  );
  assert.ok(seo.description.length >= 120 && seo.description.length <= 160, 'meta description should use a useful search-result length');
  assert.ok(seo.robots.includes('index') && seo.robots.includes('max-image-preview:large'), 'robots metadata should permit rich indexing');
  assert.equal(seo.canonical, canonicalUrl, 'canonical URL should point to the live product page');
  assert.equal(seo.openGraphImage, `${canonicalUrl}ninefold-social-preview.png`, 'Open Graph image should use an absolute production URL');
  assert.equal(seo.twitterCard, 'summary_large_image', 'Twitter should use the large image card');
  assert.ok(seo.openGraphTitle && seo.openGraphDescription && seo.openGraphImageAlt, 'Open Graph metadata should be complete');
  assert.equal(seo.h1Count, 1, 'page should have one primary heading');
  assert.equal(seo.faqCount, 6, 'visible FAQ should contain all structured questions');

  const schemaGraph = seo.schemas.flatMap((schema) => schema['@graph'] ?? [schema]);
  const schemaHasType = (type) => schemaGraph.some((node) => {
    const types = Array.isArray(node['@type']) ? node['@type'] : [node['@type']];
    return types.includes(type);
  });
  assert.ok(schemaHasType('WebSite'), 'structured data should describe the website');
  assert.ok(schemaHasType('WebApplication'), 'structured data should describe the playable web app');
  assert.ok(schemaHasType('VideoGame'), 'structured data should describe the puzzle game');
  assert.ok(schemaHasType('FAQPage'), 'structured data should match the visible FAQ');

  const siteRoot = appUrl.endsWith('/') ? appUrl : `${appUrl}/`;
  const isLocalApp = ['127.0.0.1', 'localhost'].includes(new URL(siteRoot).hostname);
  const socialImageUrl = isLocalApp
    ? new URL('ninefold-social-preview.png', siteRoot).href
    : seo.openGraphImage;
  const robotsResponse = await context.request.get(new URL('robots.txt', siteRoot).href);
  const sitemapResponse = await context.request.get(new URL('sitemap.xml', siteRoot).href);
  const manifestResponse = await context.request.get(seo.manifest);
  const socialImageResponse = await context.request.get(socialImageUrl);
  assert.ok(robotsResponse.ok(), 'robots.txt should be available');
  assert.ok((await robotsResponse.text()).includes(`${canonicalUrl}sitemap.xml`), 'robots.txt should advertise the sitemap');
  assert.ok(sitemapResponse.ok(), 'sitemap.xml should be available');
  assert.ok((await sitemapResponse.text()).includes(`<loc>${canonicalUrl}</loc>`), 'sitemap should include the canonical page');
  assert.ok(manifestResponse.ok(), 'web app manifest should be available');
  const manifest = await manifestResponse.json();
  assert.equal(manifest.name, 'Ninefold Sudoku, Wordoku & Word Search', 'manifest should use the complete product name');
  assert.equal(manifest.icons.length, 2, 'manifest should include both required icon sizes');
  assert.ok(socialImageResponse.ok(), 'social preview image should be available');
  assert.match(socialImageResponse.headers()['content-type'] ?? '', /^image\/png/, 'social preview should be a PNG');
  const socialImageSize = await page.evaluate((imageUrl) => new Promise((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve({ width: image.naturalWidth, height: image.naturalHeight });
    image.onerror = reject;
    image.src = imageUrl;
  }), socialImageUrl);
  assert.deepEqual(socialImageSize, { width: 1200, height: 630 }, 'social preview should use the recommended 1200x630 dimensions');

  assert.equal(await page.locator('.cell').count(), 81, 'board should contain 81 cells');
  assert.equal(await page.locator('#numberPad button').count(), 9, 'entry pad should contain 9 buttons');

  const boardBounds = await page.locator('#sudokuBoard').boundingBox();
  assert.ok(boardBounds, 'board should be visible');
  assert.ok(Math.abs(boardBounds.width - boardBounds.height) < 2, 'board should remain square');
  assert.ok(boardBounds.width <= 620, 'desktop board should respect its maximum width');

  const initialTheme = await page.locator('html').getAttribute('data-theme');
  await page.locator('#themeToggle').click();
  const toggledTheme = initialTheme === 'dark' ? 'light' : 'dark';
  assert.equal(await page.locator('html').getAttribute('data-theme'), toggledTheme, 'theme button should switch themes');
  await page.screenshot({ path: artifactPath('ninefold-dark.png'), fullPage: true });
  await page.reload({ waitUntil: 'networkidle' });
  assert.equal(await page.locator('html').getAttribute('data-theme'), toggledTheme, 'theme should persist after reload');
  await page.locator('#themeToggle').click();

  const wrongMove = await page.evaluate(() => {
    const cells = [...document.querySelectorAll('.cell')];
    for (let row = 0; row < 9; row += 1) {
      const rowCells = cells.slice(row * 9, row * 9 + 9);
      const empty = rowCells.find((cell) => !cell.classList.contains('given'));
      const given = rowCells.find((cell) => cell.classList.contains('given'));
      if (empty && given) return { index: cells.indexOf(empty), value: Number(given.textContent.trim()) };
    }
    return null;
  });
  assert.ok(wrongMove, 'test puzzle should have an editable square in a row with a given');
  await page.locator('.cell').nth(wrongMove.index).click();
  await page.locator('#numberPad button').nth(wrongMove.value - 1).click();
  assert.ok(await page.locator('.cell').nth(wrongMove.index).evaluate((cell) => cell.classList.contains('error')), 'wrong entry should be highlighted');
  assert.equal(await page.locator('#mistakeCount').innerText(), '1', 'wrong entry should increment mistakes');

  const hintsBefore = Number(await page.locator('#hintsLeft').innerText());
  await page.locator('#hintButton').click();
  assert.equal(Number(await page.locator('#hintsLeft').innerText()), hintsBefore - 1, 'hint count should decrease');
  assert.ok(Number(await page.locator('.progress-track').getAttribute('aria-valuenow')) > 0, 'correct entries should advance progress');

  await page.locator('#notesButton').click();
  const emptyEditableCell = page.locator('.cell:not(.given):not(:has(.cell-value))').first();
  await emptyEditableCell.click();
  await page.locator('#numberPad button').nth(1).click();
  const manualNotes = await notedCellCount(page);
  assert.equal(manualNotes, 1, 'notes mode should add a note');

  await page.locator('#autoNotesButton').click();
  const automaticNotes = await notedCellCount(page);
  assert.ok(automaticNotes > manualNotes, 'auto notes should fill candidate notes across the board');
  await page.locator('#undoButton').click();
  assert.equal(await notedCellCount(page), manualNotes, 'undo should restore notes before the bulk action');
  await page.locator('#autoNotesButton').click();

  await page.locator('#restartButton').click();
  assert.ok(await page.locator('#restartDialog').isVisible(), 'restart should require confirmation');
  await page.locator('#confirmRestart').click();
  await page.locator('#restartDialog').waitFor({ state: 'hidden' });
  assert.equal(await notedCellCount(page), 0, 'restart should clear all notes');
  assert.equal(await page.locator('#mistakeCount').innerText(), '0', 'restart should clear mistakes');
  assert.equal(await page.locator('#hintsLeft').innerText(), '3', 'restart should restore hints');
  assert.ok((await page.locator('#progressText').innerText()).startsWith('0 of '), 'restart should reset progress');

  await page.locator('#wordokuMode').click();
  if (await page.locator('#newGameDialog').isVisible()) await page.locator('#confirmNewGame').click();
  await page.locator('#wordokuMode.active').waitFor();
  assert.ok(await page.locator('#wordokuOptions').isVisible(), 'Wordoku letter options should be visible');

  const wordokuValues = await page.locator('.cell.given .cell-value').allInnerTexts();
  assert.ok(wordokuValues.length > 0, 'Wordoku should render given letters');
  assert.ok(wordokuValues.every((value) => 'DISCOVERY'.includes(value)), 'Wordoku should use the selected letter set');

  await page.locator('#wordSearchMode').click();
  if (await page.locator('#newGameDialog').isVisible()) await page.locator('#confirmNewGame').click();
  await page.locator('#wordSearchMode.active').waitFor();
  const wordSearchCellCount = await page.locator('.word-search-cell').count();
  assert.equal(wordSearchCellCount, 100, 'medium Word Search should render a 10x10 grid');
  assert.equal(await page.locator('.word-search-list li').count(), 8, 'medium Word Search should list eight words');
  assert.ok(await page.locator('#wordSearchPanel').isVisible(), 'Word Search list should be visible');
  assert.ok(await page.locator('#numberPad').isHidden(), 'Sudoku entry pad should be hidden in Word Search');
  assert.ok(await page.locator('#preferencesSection').isHidden(), 'Sudoku preferences should be hidden in Word Search');

  const firstWord = await findWordSearchTarget(page);
  assert.ok(firstWord, 'a listed Word Search word should exist in the grid');
  await dragWordSearchPath(page, firstWord);
  assert.equal(await page.locator('.word-search-list li.found').count(), 1, 'dragging across a listed word should mark it found');
  assert.equal(await page.locator('#progressText').innerText(), '1 of 8', 'finding a word should update progress');

  const wordSearchHints = Number(await page.locator('#hintsLeft').innerText());
  await page.locator('#hintButton').click();
  assert.equal(Number(await page.locator('#hintsLeft').innerText()), wordSearchHints - 1, 'Word Search hint count should decrease');
  assert.ok(await page.locator('.word-search-cell.hinted').count() >= 3, 'Word Search hint should highlight a remaining path');
  await page.screenshot({ path: artifactPath('ninefold-word-search-active.png'), fullPage: true });

  await page.reload({ waitUntil: 'networkidle' });
  assert.ok(await page.locator('#wordSearchMode.active').isVisible(), 'Word Search mode should persist after reload');
  assert.equal(await page.locator('.word-search-list li.found').count(), 1, 'found words should persist after reload');
  assert.equal(await page.locator('#hintsLeft').innerText(), '2', 'used Word Search hints should persist after reload');

  await dragWordSearchPath(page, { word: 'invalid line', start: 0, end: 1, path: [0, 1] });
  assert.equal(await page.locator('#mistakeCount').innerText(), '1', 'an invalid Word Search line should count as an attempt');

  await page.locator('#restartButton').click();
  assert.ok(await page.locator('#restartDialog').isVisible(), 'Word Search restart should require confirmation');
  await page.locator('#confirmRestart').click();
  await page.locator('#restartDialog').waitFor({ state: 'hidden' });
  assert.equal(await page.locator('.word-search-list li.found').count(), 0, 'Word Search restart should clear found words');
  assert.equal(await page.locator('#mistakeCount').innerText(), '0', 'Word Search restart should clear attempts');
  assert.equal(await page.locator('#hintsLeft').innerText(), '3', 'Word Search restart should restore hints');

  const totalWordSearchWords = await page.locator('.word-search-list li').count();
  for (let foundCount = 0; foundCount < totalWordSearchWords; foundCount += 1) {
    const target = await findWordSearchTarget(page);
    assert.ok(target, `Word Search should expose remaining word ${foundCount + 1}`);
    await dragWordSearchPath(page, target);
    assert.equal(
      await page.locator('.word-search-list li.found').count(),
      foundCount + 1,
      `Word Search should record solved word ${foundCount + 1}`,
    );
  }
  await page.locator('#successDialog').waitFor({ state: 'visible' });
  assert.equal(await page.locator('#finalMistakeLabel').innerText(), 'ATTEMPTS', 'completion dialog should use the Word Search result label');
  await page.locator('#playAgainButton').click();
  await page.locator('#successDialog').waitFor({ state: 'hidden' });
  assert.equal(await page.locator('.word-search-list li.found').count(), 0, 'play again should create a fresh Word Search');

  await page.locator('#pauseButton').click();
  assert.ok(await page.locator('#pauseScreen').isVisible(), 'pause overlay should be visible');
  await page.locator('#resumeButton').click();
  assert.ok(await page.locator('#pauseScreen').isHidden(), 'resume should hide the pause overlay');

  await page.screenshot({ path: artifactPath('ninefold-desktop.png'), fullPage: true });

  await page.setViewportSize({ width: 390, height: 844 });
  await page.reload({ waitUntil: 'networkidle' });
  const mobileLayout = await layoutMetrics(page);
  assert.ok(mobileLayout.board.width <= 370, 'mobile board should fit the viewport');
  assert.ok(Math.abs(mobileLayout.board.width - mobileLayout.board.height) < 2, 'mobile board should remain square');
  assert.ok(mobileLayout.documentWidth <= mobileLayout.viewportWidth, 'mobile page should not scroll horizontally');
  assert.deepEqual(mobileLayout.overflowingControls, [], 'mobile controls should not clip their labels');
  assert.equal(mobileLayout.regionsOverlap, false, 'mobile play and control regions should not overlap');
  await page.screenshot({ path: artifactPath('ninefold-mobile.png'), fullPage: true });
  await context.close();

  const tabletResults = {};
  const tabletContext = await browser.newContext({
    viewport: { width: tabletSizes[0].width, height: tabletSizes[0].height },
    hasTouch: true,
    isMobile: false,
  });
  const tabletPage = await tabletContext.newPage();
  watchBrowser(tabletPage);
  await tabletPage.goto(appUrl, { waitUntil: 'networkidle' });
  await tabletPage.locator('#wordSearchMode').click();
  await tabletPage.locator('#wordSearchMode.active').waitFor();

  for (const size of tabletSizes) {
    await tabletPage.setViewportSize({ width: size.width, height: size.height });
    await tabletPage.waitForTimeout(80);
    const metrics = await layoutMetrics(tabletPage);
    const compactLandscape = size.width > 900 && size.height <= 850;

    assert.ok(metrics.documentWidth <= metrics.viewportWidth, `${size.name} should not scroll horizontally`);
    assert.ok(Math.abs(metrics.board.width - metrics.board.height) < 2, `${size.name} board should remain square`);
    assert.ok(metrics.board.width <= (compactLandscape ? 500 : 620), `${size.name} board should fit its layout`);
    assert.equal(metrics.regionsOverlap, false, `${size.name} play and control regions should not overlap`);
    assert.deepEqual(metrics.overflowingControls, [], `${size.name} controls should not clip labels`);
    assert.deepEqual(metrics.undersizedTouchTargets, [], `${size.name} controls should meet 44px touch targets`);

    tabletResults[size.name] = {
      board: `${Math.round(metrics.board.width)}x${Math.round(metrics.board.height)}`,
      panelColumns: metrics.panelColumns,
    };

    if (['ipad-mini-portrait', 'ipad-mini-landscape', 'ipad-pro-13-portrait', 'ipad-pro-13-landscape'].includes(size.name)) {
      await tabletPage.screenshot({
        path: artifactPath(`ninefold-${size.name}.png`),
        fullPage: true,
      });
    }
  }

  await tabletContext.close();
  assert.deepEqual(browserErrors, [], `browser console should be clean: ${browserErrors.join('; ')}`);

  console.log(JSON.stringify({
    engine,
    desktopBoard: `${Math.round(boardBounds.width)}x${Math.round(boardBounds.height)}`,
    mobileBoard: `${Math.round(mobileLayout.board.width)}x${Math.round(mobileLayout.board.height)}`,
    wordSearchGrid: `${Math.sqrt(wordSearchCellCount)}x${Math.sqrt(wordSearchCellCount)}`,
    tabletResults,
    browserErrors: browserErrors.length,
  }, null, 2));
} finally {
  await browser.close();
}
