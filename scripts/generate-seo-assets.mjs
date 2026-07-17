import { readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { chromium } from 'playwright-core';

const appUrl = process.env.APP_URL ?? 'http://127.0.0.1:4173';
const executablePath = process.env.CHROME_PATH ?? 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const publicPath = new URL('../public/', import.meta.url);
const faviconPath = new URL('favicon.svg', publicPath);
const favicon = await readFile(faviconPath, 'utf8');
const faviconDataUrl = `data:image/svg+xml;base64,${Buffer.from(favicon).toString('base64')}`;

const browser = await chromium.launch({ headless: true, executablePath });

async function createIcon(size, filename) {
  const context = await browser.newContext({ viewport: { width: size, height: size } });
  const page = await context.newPage();
  await page.setContent(`
    <!doctype html>
    <html>
      <body style="margin:0;width:${size}px;height:${size}px;overflow:hidden">
        <img src="${faviconDataUrl}" width="${size}" height="${size}" alt="" style="display:block" />
      </body>
    </html>
  `);
  await page.screenshot({ path: fileURLToPath(new URL(filename, publicPath)) });
  await context.close();
}

try {
  await createIcon(180, 'apple-touch-icon.png');
  await createIcon(192, 'icon-192.png');
  await createIcon(512, 'icon-512.png');

  const context = await browser.newContext({ viewport: { width: 1200, height: 630 } });
  const page = await context.newPage();
  await page.goto(appUrl, { waitUntil: 'networkidle' });
  await page.locator('.cell').first().waitFor();
  await page.addStyleTag({
    content: `
      .game-layout {
        grid-template-columns: minmax(0, 560px) minmax(250px, 300px) !important;
        gap: 42px !important;
        padding-top: 12px !important;
      }
      .game-topbar { width: 500px !important; min-height: 54px !important; }
      .game-title-block h1 { font-size: 28px !important; white-space: nowrap !important; }
      .board-frame, .number-pad, .tool-row { width: min(100%, 400px) !important; }
      .control-panel { margin-top: 54px !important; }
    `,
  });
  await page.locator('.cell:not(.given)').first().click();
  await page.screenshot({
    path: fileURLToPath(new URL('ninefold-social-preview.png', publicPath)),
    animations: 'disabled',
  });
  await context.close();

  console.log('Generated Apple icons and 1200x630 social preview in public/.');
} finally {
  await browser.close();
}
