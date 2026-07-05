import { chromium } from '@playwright/test';
import { mkdir } from 'node:fs/promises';
import path from 'node:path';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';

const execFileAsync = promisify(execFile);

const BASE_URL = process.env.CAPTURE_BASE_URL ?? 'http://127.0.0.1:4322/lego-train-layout-planner/';
const INVENTORY_KEY = 'lego-train-planner/inventory';
const ARTIFACTS = '/opt/cursor/artifacts';
const SCREENSHOTS = path.join(ARTIFACTS, 'screenshots');
const VIDEOS = path.join(ARTIFACTS, 'videos');

const richInventory = {
  schemaVersion: 1,
  counts: {
    'straight-16': 6,
    'curve-r40': 16,
    'switch-left': 0,
    'switch-right': 0,
  },
  updatedAt: '2026-07-05T00:00:00.000Z',
};

const emptyResultInventory = {
  schemaVersion: 1,
  counts: {
    'straight-16': 1,
    'curve-r40': 0,
    'switch-left': 0,
    'switch-right': 0,
  },
  updatedAt: '2026-07-05T00:00:00.000Z',
};

async function screenshot(page, filename) {
  await page.screenshot({
    path: path.join(SCREENSHOTS, filename),
    fullPage: true,
  });
}

async function main() {
  await mkdir(SCREENSHOTS, { recursive: true });
  await mkdir(VIDEOS, { recursive: true });

  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    viewport: { width: 1280, height: 900 },
    recordVideo: {
      dir: VIDEOS,
      size: { width: 1280, height: 900 },
    },
  });

  const page = await context.newPage();

  await page.addInitScript(
    ({ key, value }) => {
      localStorage.setItem(key, value);
    },
    { key: INVENTORY_KEY, value: JSON.stringify(richInventory) },
  );

  await page.goto(`${BASE_URL}generate/`);
  await page.waitForLoadState('networkidle');
  await page.waitForSelector('layout-generator-panel', { timeout: 10000 });
  await page.waitForTimeout(500);

  await screenshot(page, 'generator-01-page-initial.png');

  await page.getByRole('button', { name: 'Generate', exact: true }).click();
  await page.waitForTimeout(400);
  await screenshot(page, 'generator-02-searching.png');

  await page.getByRole('button', { name: 'Open in editor' }).first().waitFor({
    timeout: 30000,
  });
  await page.waitForTimeout(600);
  await screenshot(page, 'generator-03-candidate-carousel.png');

  await page.getByRole('button', { name: 'Open in editor' }).first().click();
  await page.waitForURL(/editor\//);
  await page.waitForLoadState('networkidle');
  await page.waitForSelector('[data-testid="editor-canvas"]', { timeout: 10000 });
  await page.waitForTimeout(800);
  await screenshot(page, 'generator-04-editor-handoff.png');

  await page.goto(`${BASE_URL}editor/`);
  await page.waitForSelector('[data-testid="editor-canvas"]');
  await page.waitForTimeout(400);
  await screenshot(page, 'generator-05-editor-header-cta.png');

  await page.waitForTimeout(500);

  const video = page.video();
  await context.close();

  const emptyContext = await browser.newContext({
    viewport: { width: 1280, height: 900 },
  });
  const emptyPage = await emptyContext.newPage();
  await emptyPage.addInitScript(
    ({ key, value }) => {
      localStorage.setItem(key, value);
    },
    { key: INVENTORY_KEY, value: JSON.stringify(emptyResultInventory) },
  );
  await emptyPage.goto(`${BASE_URL}generate/`);
  await emptyPage.waitForLoadState('networkidle');
  await emptyPage.waitForSelector('layout-generator-panel');
  await emptyPage.getByRole('button', { name: 'Generate', exact: true }).click();
  await emptyPage.getByRole('heading', { name: 'No layouts found' }).waitFor({
    timeout: 15000,
  });
  await emptyPage.waitForTimeout(400);
  await emptyPage.screenshot({
    path: path.join(SCREENSHOTS, 'generator-06-empty-state.png'),
    fullPage: true,
  });
  await emptyContext.close();
  await browser.close();

  if (video) {
    const webmPath = await video.path();
    const mp4Path = path.join(ARTIFACTS, 'generator-demo.mp4');
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
