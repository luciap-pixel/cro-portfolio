/**
 * Capture full-page screenshot of bespoke-carpentry/ and save it as
 * assets/work/bespoke-carpentry.jpg — matches the pattern used for the
 * other four thumbnails (1600px wide, DPR 2, mozjpeg q84).
 *
 * Run: node tools/shot-bespoke.mjs
 * Requires the local dev server on http://localhost:5173.
 */

import { chromium } from 'playwright';
import sharp from 'sharp';
import path from 'node:path';
import fs from 'node:fs/promises';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');
const OUT_DIR = path.join(ROOT, 'assets', 'work');
await fs.mkdir(OUT_DIR, { recursive: true });

const BASE = process.env.BASE || 'http://localhost:5173';
const URL = `${BASE}/bespoke-carpentry/`;
const OUT = path.join(OUT_DIR, 'bespoke-carpentry.jpg');

const browser = await chromium.launch();
const context = await browser.newContext({
  viewport: { width: 1440, height: 900 },
  deviceScaleFactor: 2,
  reducedMotion: 'reduce',
});
const page = await context.newPage();
page.on('pageerror', e => console.warn('  pageerror:', e.message));

console.log(`→ bespoke-carpentry  ${URL}`);
await page.goto(URL, { waitUntil: 'domcontentloaded', timeout: 60_000 });

await page.evaluate(() => {
  document.querySelectorAll('img').forEach(i => { i.loading = 'eager'; i.decoding = 'sync'; });
  document.querySelectorAll('[loading="lazy"]').forEach(el => el.setAttribute('loading','eager'));
});

try { await page.evaluate(() => document.fonts && document.fonts.ready); } catch {}

await page.evaluate(async () => {
  const step = 240;
  const wait = ms => new Promise(r => setTimeout(r, ms));
  const max = document.documentElement.scrollHeight;
  for (let y = 0; y < max; y += step) {
    window.scrollTo(0, y);
    await wait(60);
  }
  window.scrollTo(0, max);
  await wait(300);
});

try {
  await page.waitForLoadState('networkidle', { timeout: 20_000 });
} catch {
  console.warn('  networkidle timeout — continuing');
}

await page.evaluate(async () => {
  await Promise.all([...document.images].map(i => i.complete
    ? Promise.resolve()
    : new Promise(r => {
        i.addEventListener('load', r, { once: true });
        i.addEventListener('error', r, { once: true });
      })));
});

await page.waitForTimeout(600);
await page.evaluate(() => window.scrollTo(0, 0));
await page.waitForTimeout(300);

const raw = path.join(OUT_DIR, '_raw_bespoke-carpentry.png');
await page.screenshot({ path: raw, fullPage: true, type: 'png' });

await sharp(raw)
  .resize({ width: 1600, withoutEnlargement: true })
  .jpeg({ quality: 84, mozjpeg: true, progressive: true })
  .toFile(OUT);

const stats = await sharp(OUT).stats();
const stdev = Math.max(...stats.channels.map(c => c.stdev));
const meta = await sharp(OUT).metadata();
const bytes = (await fs.stat(OUT)).size;
const flag = stdev < 6 ? '  ⚠ LOW VARIANCE (likely blank)' : '';
console.log(`  saved ${path.basename(OUT)}  ${meta.width}×${meta.height}  ${(bytes/1024).toFixed(0)}kb  stdev=${stdev.toFixed(1)}${flag}`);

await fs.unlink(raw).catch(() => {});
await browser.close();
console.log('Done.');
