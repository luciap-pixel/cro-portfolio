/**
 * Konar Studio — screenshot capture
 * -----------------------------------------
 * Opens each mockup at 1440-wide, waits for network idle + fonts,
 * takes a FULL-PAGE screenshot, and writes an optimized JPG (~q82,
 * max width 1400px) to assets/work/.
 *
 * Falls back to a local static server rooted at the repo if the
 * live URLs are unreachable.
 *
 * Run: node tools/capture.mjs
 */

import { chromium } from 'playwright';
import sharp from 'sharp';
import path from 'node:path';
import fs from 'node:fs/promises';
import http from 'node:http';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');
const OUT_DIR = path.join(ROOT, 'assets', 'work');
await fs.mkdir(OUT_DIR, { recursive: true });

const LIVE_BASE = 'https://luciap-pixel.github.io/cro-portfolio';

const TARGETS = [
  { slug: 'konk',        live: `${LIVE_BASE}/konk-furniture/`,            local: '/konk-furniture/',            out: 'konk.jpg' },
  { slug: 'sandgrain',   live: `${LIVE_BASE}/sandgrain/`,                 local: '/sandgrain/',                 out: 'sandgrain.jpg' },
  { slug: 'woodchester', live: `${LIVE_BASE}/WoodchesterCabinetMakers/`,  local: '/WoodchesterCabinetMakers/',  out: 'woodchester.jpg' },
  { slug: 'ruci',        live: `${LIVE_BASE}/RUCIUK/`,                    local: '/RUCIUK/',                    out: 'ruci.jpg' },
];

// ---------- Tiny static server for local fallback ----------
const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js':  'text/javascript; charset=utf-8',
  '.mjs': 'text/javascript; charset=utf-8',
  '.json':'application/json; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg':'image/jpeg',
  '.webp':'image/webp',
  '.gif': 'image/gif',
  '.ico': 'image/x-icon',
  '.woff':'font/woff',
  '.woff2':'font/woff2',
  '.ttf': 'font/ttf',
  '.otf': 'font/otf',
  '.txt': 'text/plain; charset=utf-8',
};
function startServer(rootDir, port = 4321) {
  return new Promise((resolve) => {
    const server = http.createServer(async (req, res) => {
      try {
        const url = new URL(req.url, `http://localhost:${port}`);
        let p = decodeURIComponent(url.pathname);
        if (p.endsWith('/')) p += 'index.html';
        const filePath = path.join(rootDir, p);
        if (!filePath.startsWith(rootDir)) { res.writeHead(403).end('Forbidden'); return; }
        const buf = await fs.readFile(filePath);
        const type = MIME[path.extname(filePath).toLowerCase()] || 'application/octet-stream';
        res.writeHead(200, { 'Content-Type': type, 'Cache-Control': 'no-store' });
        res.end(buf);
      } catch {
        res.writeHead(404).end('Not found');
      }
    });
    server.listen(port, '127.0.0.1', () => resolve(server));
  });
}

async function urlIsReachable(url) {
  try {
    const c = await fetch(url, { method: 'HEAD' });
    if (c.ok) return true;
    // Some CDNs 403 HEAD but 200 GET
    const g = await fetch(url, { method: 'GET' });
    return g.ok;
  } catch {
    return false;
  }
}

// ---------- Main ----------
const useLive = await urlIsReachable(TARGETS[0].live);
let server = null;
let baseFn;
if (useLive) {
  console.log('Using LIVE URLs.');
  baseFn = (t) => t.live;
} else {
  console.log('Live URLs unreachable — starting local server at http://127.0.0.1:4321');
  server = await startServer(ROOT, 4321);
  baseFn = (t) => `http://127.0.0.1:4321${t.local}`;
}

const browser = await chromium.launch();
const context = await browser.newContext({
  viewport: { width: 1440, height: 900 },
  deviceScaleFactor: 1,
});
const page = await context.newPage();

for (const t of TARGETS) {
  const url = baseFn(t);
  console.log(`→ ${t.slug}  ${url}`);
  try {
    await page.goto(url, { waitUntil: 'networkidle', timeout: 60_000 });
  } catch (err) {
    console.warn(`  goto warning (${t.slug}): ${err.message}`);
  }
  // give fonts + lazy images a moment
  try { await page.evaluate(() => document.fonts && document.fonts.ready); } catch {}
  await page.waitForTimeout(1600);

  const rawPath = path.join(OUT_DIR, `_raw_${t.slug}.png`);
  await page.screenshot({ path: rawPath, fullPage: true, type: 'png' });

  const outPath = path.join(OUT_DIR, t.out);
  await sharp(rawPath)
    .resize({ width: 1400, withoutEnlargement: true })
    .jpeg({ quality: 82, mozjpeg: true, progressive: true })
    .toFile(outPath);

  const meta = await sharp(outPath).metadata();
  const bytes = (await fs.stat(outPath)).size;
  console.log(`  saved ${t.out}  ${meta.width}×${meta.height}  ${(bytes/1024).toFixed(0)}kb`);

  await fs.unlink(rawPath).catch(() => {});
}

await browser.close();
if (server) server.close();
console.log('Done.');
