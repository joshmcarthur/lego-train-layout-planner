import { chromium } from '@playwright/test';
import { mkdir, rename } from 'node:fs/promises';
import path from 'node:path';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';

const execFileAsync = promisify(execFile);

const BASE_URL = 'http://127.0.0.1:4321/lego-train-layout-planner/';
const INVENTORY_KEY = 'lego-train-planner/inventory';
const ARTIFACTS = '/opt/cursor/artifacts';
const SCREENSHOTS = path.join(ARTIFACTS, 'screenshots');
const VIDEOS = path.join(ARTIFACTS, 'videos');

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

async function hoverStud(page, canvasBox, studX, studY) {
  const offset = studToPageOffset(studX, studY);
  await page.mouse.move(canvasBox.x + offset.x, canvasBox.y + offset.y);
}

async function screenshotCanvas(page, canvas, filename) {
  await page.screenshot({ path: path.join(SCREENSHOTS, filename), fullPage: true });
  await canvas.screenshot({ path: path.join(SCREENSHOTS, filename.replace('.png', '-canvas.png')) });
}

async function main() {
  await mkdir(SCREENSHOTS, { recursive: true });
  await mkdir(VIDEOS, { recursive: true });

  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    viewport: { width: 1280, height: 800 },
    recordVideo: {
      dir: VIDEOS,
      size: { width: 1280, height: 800 },
    },
  });

  const page = await context.newPage();

  await page.addInitScript(
    ({ key, value }) => {
      localStorage.setItem(key, value);
    },
    { key: INVENTORY_KEY, value: JSON.stringify(inventoryFixture) },
  );

  await page.goto(`${BASE_URL}editor/`);
  await page.waitForLoadState('networkidle');
  await page.waitForSelector('[data-testid="editor-canvas"]', { timeout: 10000 });
  await page.waitForTimeout(800);

  const canvas = page.getByTestId('editor-canvas');
  const box = await canvas.boundingBox();
  if (!box) {
    throw new Error('Canvas bounding box not found');
  }

  await screenshotCanvas(page, canvas, '01-editor-initial.png');

  await page.getByTestId('palette-straight-16').click();
  await clickStud(page, box, 0, 0);
  await page.waitForTimeout(700);
  await screenshotCanvas(page, canvas, '02-one-straight-placed.png');

  await clickStud(page, box, 17, 0);
  await page.waitForTimeout(700);
  await screenshotCanvas(page, canvas, '03-two-straights-connected.png');

  await hoverStud(page, box, 8, 0);
  await page.waitForTimeout(500);
  await screenshotCanvas(page, canvas, '04-invalid-overlap-feedback.png');

  await page.getByTestId('palette-curve-r40').click();
  await clickStud(page, box, 33, 0);
  await page.waitForTimeout(700);
  await screenshotCanvas(page, canvas, '05-curve-placed.png');

  await page.keyboard.press('Control+Z');
  await page.waitForTimeout(700);
  await screenshotCanvas(page, canvas, '06-after-undo.png');

  await page.getByRole('button', { name: 'Zoom in' }).click();
  await page.getByRole('button', { name: 'Zoom in' }).click();
  await page.waitForTimeout(500);
  await screenshotCanvas(page, canvas, '07-zoomed-view.png');

  await page.waitForTimeout(800);

  const video = page.video();
  await context.close();
  await browser.close();

  if (video) {
    const webmPath = await video.path();
    const mp4Path = path.join(ARTIFACTS, 'editor-demo.mp4');
    await execFileAsync('ffmpeg', [
      '-y',
      '-i',
      webmPath,
      '-c:v',
      'libx264',
      '-pix_fmt',
      'yuv420p',
      '-movflags',
      '+faststart',
      mp4Path,
    ]);
    console.log(`Video saved: ${mp4Path}`);
  }

  console.log(`Screenshots saved to: ${SCREENSHOTS}`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
