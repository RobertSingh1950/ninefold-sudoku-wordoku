import assert from 'node:assert/strict';
import { fileURLToPath } from 'node:url';
import { mkdir } from 'node:fs/promises';
import { chromium } from 'playwright-core';

const appUrl = process.env.APP_URL ?? 'http://127.0.0.1:4173';
const executablePath = process.env.CHROME_PATH ?? 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const artifactsPath = new URL('../artifacts/', import.meta.url);
const browserErrors = [];

await mkdir(artifactsPath, { recursive: true });

const browser = await chromium.launch({ headless: true, executablePath });

try {
  const context = await browser.newContext({ viewport: { width: 1440, height: 1000 } });
  const page = await context.newPage();
  page.on('pageerror', (error) => browserErrors.push(error.message));
  page.on('console', (message) => {
    if (['error', 'warning'].includes(message.type())) browserErrors.push(message.text());
  });

  await page.goto(appUrl, { waitUntil: 'networkidle' });
  assert.equal(await page.locator('.cell').count(), 81, 'board should contain 81 cells');
  assert.equal(await page.locator('#numberPad button').count(), 9, 'entry pad should contain 9 buttons');

  const boardBounds = await page.locator('#sudokuBoard').boundingBox();
  assert.ok(boardBounds, 'board should be visible');
  assert.ok(Math.abs(boardBounds.width - boardBounds.height) < 2, 'board should remain square');
  assert.ok(boardBounds.width <= 620, 'desktop board should respect its maximum width');

  const wrongMove = await page.evaluate(() => {
    const cells = [...document.querySelectorAll('.cell')];
    for (let row = 0; row < 9; row += 1) {
      const rowCells = cells.slice(row * 9, row * 9 + 9);
      const empty = rowCells.find((cell) => !cell.classList.contains('given'));
      const given = rowCells.find((cell) => cell.classList.contains('given'));
      if (empty && given) {
        return { index: cells.indexOf(empty), value: Number(given.textContent.trim()) };
      }
    }
    return null;
  });
  assert.ok(wrongMove, 'test puzzle should have an editable square in a row with a given');
  await page.locator('.cell').nth(wrongMove.index).click();
  await page.locator('#numberPad button').nth(wrongMove.value - 1).click();
  assert.ok(await page.locator('.cell').nth(wrongMove.index).evaluate((cell) => cell.classList.contains('error')), 'wrong entry should be highlighted');
  assert.equal(await page.locator('#mistakeCount').innerText(), '1', 'wrong entry should increment mistakes');

  await page.locator('#notesButton').click();
  const emptyEditableCell = page.locator('.cell:not(.given):not(:has(.cell-value))').first();
  await emptyEditableCell.click();
  await page.locator('#numberPad button').nth(1).click();
  assert.ok((await emptyEditableCell.locator('.notes-grid').innerText()).trim(), 'notes mode should add a note');

  const hintsBefore = Number(await page.locator('#hintsLeft').innerText());
  await page.locator('#hintButton').click();
  assert.equal(Number(await page.locator('#hintsLeft').innerText()), hintsBefore - 1, 'hint count should decrease');

  await page.locator('#wordokuMode').click();
  await page.locator('#confirmNewGame').click();
  await page.locator('#wordokuMode.active').waitFor();
  assert.ok(await page.locator('#wordokuOptions').isVisible(), 'Wordoku letter options should be visible');

  const wordokuValues = await page.locator('.cell.given .cell-value').allInnerTexts();
  assert.ok(wordokuValues.length > 0, 'Wordoku should render given letters');
  assert.ok(wordokuValues.every((value) => 'DISCOVERY'.includes(value)), 'Wordoku should use the selected letter set');

  await page.locator('#pauseButton').click();
  assert.ok(await page.locator('#pauseScreen').isVisible(), 'pause overlay should be visible');
  await page.locator('#resumeButton').click();
  assert.ok(await page.locator('#pauseScreen').isHidden(), 'resume should hide the pause overlay');

  await page.screenshot({ path: fileURLToPath(new URL('ninefold-desktop.png', artifactsPath)), fullPage: true });

  await page.setViewportSize({ width: 390, height: 844 });
  await page.reload({ waitUntil: 'networkidle' });
  const mobileBoard = await page.locator('#sudokuBoard').boundingBox();
  assert.ok(mobileBoard && mobileBoard.width <= 370, 'mobile board should fit the viewport');

  const layout = await page.evaluate(() => ({
    documentWidth: document.documentElement.scrollWidth,
    viewportWidth: window.innerWidth,
    overflowingControls: [...document.querySelectorAll('.tool-button, .mode-button')]
      .filter((element) => element.scrollWidth > element.clientWidth + 1)
      .map((element) => element.textContent.trim()),
  }));
  assert.ok(layout.documentWidth <= layout.viewportWidth, 'page should not scroll horizontally');
  assert.deepEqual(layout.overflowingControls, [], 'controls should not clip their labels');

  await page.screenshot({ path: fileURLToPath(new URL('ninefold-mobile.png', artifactsPath)), fullPage: true });
  assert.deepEqual(browserErrors, [], `browser console should be clean: ${browserErrors.join('; ')}`);

  console.log(JSON.stringify({
    desktopBoard: `${Math.round(boardBounds.width)}x${Math.round(boardBounds.height)}`,
    mobileBoard: `${Math.round(mobileBoard.width)}x${Math.round(mobileBoard.height)}`,
    mode: 'wordoku',
    browserErrors: browserErrors.length,
  }, null, 2));

  await context.close();
} finally {
  await browser.close();
}
