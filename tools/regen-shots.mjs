/**
 * Regenerate the 4 preview screenshots (assets/work/*.jpg) with proper
 * lazy-load handling: slow-scroll each page top→bottom to trigger IO,
 * wait networkidle, then fullPage screenshot at DPR 2, resize + JPG.
 *
 * Run: node tools/regen-shots.mjs
 * Requires the local dev server on http://localhost:5173 (or pass BASE=...).
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

const TARGETS = [
  { slug: 'konk',        url: `${BASE}/konk-furniture/`,           out: 'konk.jpg' },
  { slug: 'sandgrain',   url: `${BASE}/sandgrain/`,                out: 'sandgrain.jpg' },
  { slug: 'woodchester', url: `${BASE}/WoodchesterCabinetMakers/`, out: 'woodchester.jpg' },
  { slug: 'ruci',        url: `${BASE}/RUCIUK/`,                   out: 'ruci.jpg' },
];

const browser = await chromium.launch();
const context = await browser.newContext({
  viewport: { width: 1440, height: 900 },
  deviceScaleFactor: 2,
  reducedMotion: 'reduce', // disable animations so they don't distort the screenshot
});
const page = await context.newPage();
page.on('pageerror', e => console.warn('  pageerror:', e.message));

for (const t of TARGETS) {
  console.log(`→ ${t.slug}  ${t.url}`);
  try {
    await page.goto(t.url, { waitUntil: 'domcontentloaded', timeout: 60_000 });
  } catch (err) {
    console.warn(`  goto warning (${t.slug}): ${err.message}`);
    continue;
  }

  // Force every image out of lazy mode so scrolling isn't required at all.
  await page.evaluate(() => {
    document.querySelectorAll('img').forEach(i => { i.loading = 'eager'; i.decoding = 'sync'; });
    document.querySelectorAll('[loading="lazy"]').forEach(el => el.setAttribute('loading','eager'));
  });

  try { await page.evaluate(() => document.fonts && document.fonts.ready); } catch {}

  // Slow-scroll top→bottom to trigger IntersectionObservers, scroll-linked lazy, etc.
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
  } catch (err) {
    console.warn(`  networkidle timeout (${t.slug}) — continuing`);
  }

  // Wait for every <img> to actually resolve.
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

  const rawPath = path.join(OUT_DIR, `_raw_${t.slug}.png`);
  await page.screenshot({ path: rawPath, fullPage: true, type: 'png' });

  const outPath = path.join(OUT_DIR, t.out);
  await sharp(rawPath)
    .resize({ width: 1600, withoutEnlargement: true })
    .jpeg({ quality: 84, mozjpeg: true, progressive: true })
    .toFile(outPath);

  // Sanity check: reject if the image is mostly one flat colour (indicates blank capture).
  const stats = await sharp(outPath).stats();
  const stdev = Math.max(...stats.channels.map(c => c.stdev));
  const meta = await sharp(outPath).metadata();
  const bytes = (await fs.stat(outPath)).size;
  const flag = stdev < 6 ? '  ⚠ LOW VARIANCE (likely blank)' : '';
  console.log(`  saved ${t.out}  ${meta.width}×${meta.height}  ${(bytes/1024).toFixed(0)}kb  stdev=${stdev.toFixed(1)}${flag}`);

  await fs.unlink(rawPath).catch(() => {});
}

await browser.close();
console.log('Done.');
