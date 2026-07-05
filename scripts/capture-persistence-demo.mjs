import { chromium } from '@playwright/test';
import LZString from 'lz-string';
import { mkdir } from 'node:fs/promises';
import path from 'node:path';

const INVENTORY_STORAGE_KEY = 'lego-train-planner/inventory';

const BASE_URL = 'http://127.0.0.1:4321/lego-train-layout-planner/';
const ARTIFACTS = '/opt/cursor/artifacts';
const SCREENSHOTS = path.join(ARTIFACTS, 'screenshots');

const inventoryFixture = {
  schemaVersion: 1,
  counts: {
    'straight-16': 10,
    'curve-r40': 8,
    'switch-left': 2,
    'switch-right': 2,
  },
  updatedAt: '2026-07-05T00:00:00.000Z',
};

const VIEWPORT = { panX: 48, panY: 48, zoom: 6 };

function studToPageOffset(studX, studY) {
  return {
    x: VIEWPORT.panX + studX * VIEWPORT.zoom,
    y: VIEWPORT.panY + studY * VIEWPORT.zoom,
  };
}

async function clickStud(page, canvasBox, studX, studY) {
  const offset = studToPageOffset(studX, studY);
  await page.mouse.click(canvasBox.x + offset.x, canvasBox.y + offset.y);
}

async function screenshot(page, filename) {
  await page.screenshot({
    path: path.join(SCREENSHOTS, filename),
    fullPage: true,
  });
}

async function main() {
  await mkdir(SCREENSHOTS, { recursive: true });

  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    viewport: { width: 1280, height: 900 },
  });
  const page = await context.newPage();

  await page.addInitScript(
    ({ key, value }) => {
      localStorage.setItem(key, value);
    },
    { key: INVENTORY_STORAGE_KEY, value: JSON.stringify(inventoryFixture) },
  );

  await page.goto(`${BASE_URL}editor/`);
  await page.waitForLoadState('networkidle');
  await page.waitForSelector('[data-testid="editor-canvas"]');
  await page.waitForTimeout(600);

  await screenshot(page, 'persistence-01-editor-header.png');

  const canvas = page.getByTestId('editor-canvas');
  const box = await canvas.boundingBox();
  if (!box) {
    throw new Error('Canvas bounding box not found');
  }

  await page.getByTestId('palette-straight-16').click();
  await clickStud(page, box, 0, 0);
  await clickStud(page, box, 16, 0);
  await page.getByTestId('palette-curve-r40').click();
  await clickStud(page, box, 32, 0);
  await page.waitForTimeout(500);

  await screenshot(page, 'persistence-02-layout-with-pieces.png');

  await page.getByRole('button', { name: 'Save layout' }).click();
  await page.waitForTimeout(300);
  await screenshot(page, 'persistence-03-save-dialog.png');

  await page.getByRole('button', { name: 'Save', exact: true }).click();
  await page.waitForTimeout(400);

  await page.getByRole('button', { name: 'Library' }).click();
  await page.waitForTimeout(300);
  await screenshot(page, 'persistence-04-library-panel.png');

  await page.getByRole('button', { name: 'Close' }).click();
  await page.waitForTimeout(200);
  await page.getByRole('button', { name: 'Share link' }).click();
  await page.waitForTimeout(300);
  await screenshot(page, 'persistence-05-share-copied.png');

  const shareState = {
    schemaVersion: 1,
    catalogueVersion: 1,
    inventory: {
      ...inventoryFixture,
      counts: { ...inventoryFixture.counts, 'straight-16': 1 },
    },
    layout: {
      schemaVersion: 1,
      catalogueVersion: 1,
      placements: [
        { instanceId: 'a', pieceId: 'straight-16', x: 0, y: 0, rotation: 0 },
        { instanceId: 'b', pieceId: 'straight-16', x: 16, y: 0, rotation: 0 },
        { instanceId: 'c', pieceId: 'curve-r40', x: 32, y: 0, rotation: 0 },
      ],
    },
  };

  const payload = LZString.compressToEncodedURIComponent(JSON.stringify(shareState));
  const shareUrl = `${BASE_URL}editor/#s=${payload}`;

  const forkPage = await context.newPage();
  await forkPage.addInitScript(
    ({ key, value }) => {
      localStorage.setItem(key, value);
    },
    { key: INVENTORY_STORAGE_KEY, value: JSON.stringify(inventoryFixture) },
  );

  await forkPage.goto(shareUrl);
  await forkPage.waitForLoadState('networkidle');
  await forkPage.waitForSelector('[data-testid="editor-canvas"]');
  await forkPage.waitForTimeout(600);
  await forkPage.screenshot({
    path: path.join(SCREENSHOTS, 'persistence-06-fork-banner.png'),
    fullPage: true,
  });

  await context.close();
  await browser.close();

  console.log(`Screenshots saved to: ${SCREENSHOTS}`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
