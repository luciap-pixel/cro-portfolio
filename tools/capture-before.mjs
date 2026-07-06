/**
 * Konar Studio — capture the REAL live brand sites for the
 * before/after comparison. Full-page @ 1440 wide → optimised JPG.
 * Each capture is best-effort; the caller can gracefully hide any
 * slider whose "before" file is missing.
 *
 * Run: node tools/capture-before.mjs
 */
import { chromium } from 'playwright';
import sharp from 'sharp';
import path from 'node:path';
import fs from 'node:fs/promises';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');
const OUT_DIR = path.join(ROOT, 'assets', 'before');
await fs.mkdir(OUT_DIR, { recursive: true });

// Ordered candidate URLs — we try each until one resolves.
const TARGETS = [
  { slug: 'konk',        out: 'konk.jpg',        urls: [
    'https://konkfurniture.com/',
    'https://konk.co.uk/',
    'https://www.konk.co.uk/',
    'https://konk.com/',
  ]},
  { slug: 'sandgrain',   out: 'sandgrain.jpg',   urls: [
    'https://sandandgrain.co.uk/',
    'https://www.sandandgrain.co.uk/',
    'https://sandandgrain.com/',
  ]},
  { slug: 'woodchester', out: 'woodchester.jpg', urls: [
    'https://woodchestercabinetmakers.co.uk/',
    'https://www.woodchestercabinetmakers.co.uk/',
    'https://woodchestercabinetmakers.com/',
  ]},
  { slug: 'ruci',        out: 'ruci.jpg',        urls: [
    'https://ruci.co.uk/',
    'https://www.ruci.co.uk/',
    'https://ruci.com/',
    'https://www.ruci.com/',
  ]},
];

const browser = await chromium.launch();

async function captureOne(t) {
  const context = await browser.newContext({
    viewport: { width: 1440, height: 900 },
    deviceScaleFactor: 1,
    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0 Safari/537.36',
    ignoreHTTPSErrors: true,
  });
  const page = await context.newPage();

  let picked = null;
  for (const url of t.urls) {
    try {
      const resp = await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 45_000 });
      if (resp && resp.ok()) { picked = url; break; }
      // Some CDNs return 200 without ok flag — check status < 500
      if (resp && resp.status() < 500) { picked = url; break; }
    } catch (err) {
      // try next
    }
  }

  if (!picked) {
    console.warn(`   ${t.slug}: no candidate URL loaded`);
    await context.close();
    return false;
  }

  try {
    try { await page.waitForLoadState('networkidle', { timeout: 25_000 }); } catch {}
    try { await page.evaluate(() => document.fonts && document.fonts.ready); } catch {}

    // Dismiss common cookie banners best-effort
    try {
      await page.evaluate(() => {
        const texts = ['accept', 'accept all', 'agree', 'got it', 'allow all', 'ok', 'accept cookies'];
        const cands = Array.from(document.querySelectorAll('button, a, div[role="button"]'));
        const btn = cands.find((el) => {
          const t = (el.textContent || '').trim().toLowerCase();
          return texts.some((x) => t === x || t.startsWith(x));
        });
        if (btn && btn.offsetParent !== null) btn.click();
      });
    } catch {}
    await page.waitForTimeout(1400);

    // Scroll to hydrate lazy images
    await page.evaluate(async () => {
      await new Promise((res) => {
        let y = 0; const step = 900;
        const timer = setInterval(() => {
          window.scrollBy(0, step);
          y += step;
          if (y >= document.body.scrollHeight + 400) { clearInterval(timer); res(); }
        }, 120);
      });
    });
    await page.waitForTimeout(1200);
    await page.evaluate(() => window.scrollTo(0, 0));
    await page.waitForTimeout(600);

    const rawPath = path.join(OUT_DIR, `_raw_${t.slug}.png`);
    await page.screenshot({ path: rawPath, fullPage: true, type: 'png' });

    const outPath = path.join(OUT_DIR, t.out);
    await sharp(rawPath)
      .resize({ width: 1400, withoutEnlargement: true })
      .jpeg({ quality: 82, mozjpeg: true, progressive: true })
      .toFile(outPath);

    const meta = await sharp(outPath).metadata();
    const bytes = (await fs.stat(outPath)).size;
    console.log(`   ${t.slug}  ← ${picked}   ${meta.width}×${meta.height}  ${(bytes/1024).toFixed(0)}kb`);

    await fs.unlink(rawPath).catch(() => {});
    await context.close();
    return true;
  } catch (err) {
    console.warn(`   ${t.slug} shot failed: ${err.message}`);
    await context.close();
    return false;
  }
}

for (const t of TARGETS) {
  console.log(`→ ${t.slug}`);
  await captureOne(t);
}

await browser.close();
console.log('done.');
