/**
 * Local review capture — spin up a static server at the repo root,
 * open the homepage in headless Chromium at 1440 wide, and save a
 * full-page screenshot for self-review.
 *
 * Run: node tools/review.mjs
 */
import { chromium } from 'playwright';
import http from 'node:http';
import path from 'node:path';
import fs from 'node:fs/promises';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');
const OUT = path.join(ROOT, 'tools', 'review');
await fs.mkdir(OUT, { recursive: true });

const MIME = {
  '.html':'text/html; charset=utf-8', '.css':'text/css; charset=utf-8',
  '.js':'text/javascript; charset=utf-8', '.mjs':'text/javascript; charset=utf-8',
  '.json':'application/json; charset=utf-8', '.svg':'image/svg+xml',
  '.png':'image/png', '.jpg':'image/jpeg', '.jpeg':'image/jpeg',
  '.webp':'image/webp', '.woff':'font/woff', '.woff2':'font/woff2',
};

function startServer(rootDir, port = 4322) {
  return new Promise((resolve) => {
    const server = http.createServer(async (req, res) => {
      try {
        const url = new URL(req.url, `http://localhost:${port}`);
        let p = decodeURIComponent(url.pathname);
        if (p.endsWith('/')) p += 'index.html';
        const filePath = path.join(rootDir, p);
        if (!filePath.startsWith(rootDir)) return res.writeHead(403).end('Forbidden');
        const buf = await fs.readFile(filePath);
        const type = MIME[path.extname(filePath).toLowerCase()] || 'application/octet-stream';
        res.writeHead(200, { 'Content-Type': type, 'Cache-Control':'no-store' });
        res.end(buf);
      } catch { res.writeHead(404).end('Not found'); }
    });
    server.listen(port, '127.0.0.1', () => resolve(server));
  });
}

const server = await startServer(ROOT, 4322);
const browser = await chromium.launch();
const context = await browser.newContext({
  viewport: { width: 1440, height: 900 },
  deviceScaleFactor: 1,
});
const page = await context.newPage();

await page.goto('http://127.0.0.1:4322/index.html', { waitUntil: 'networkidle', timeout: 60_000 });
try { await page.evaluate(() => document.fonts && document.fonts.ready); } catch {}
await page.waitForTimeout(2500);

// Force all reveals in for the full-page shot so we can see the whole layout
await page.evaluate(() => {
  document.querySelectorAll('.reveal, [data-lm]').forEach((el) => el.classList.add('is-in'));
});
await page.waitForTimeout(1400);

// Full page
await page.screenshot({ path: path.join(OUT, 'home-full.png'), fullPage: true });

// Above-the-fold
await page.setViewportSize({ width: 1440, height: 900 });
await page.screenshot({ path: path.join(OUT, 'home-fold.png'), fullPage: false });

// Mobile view
const mobile = await browser.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2 });
const mpage = await mobile.newPage();
await mpage.goto('http://127.0.0.1:4322/index.html', { waitUntil: 'networkidle' });
try { await mpage.evaluate(() => document.fonts && document.fonts.ready); } catch {}
await mpage.waitForTimeout(1500);
await mpage.evaluate(() => {
  document.querySelectorAll('.reveal, [data-lm]').forEach((el) => el.classList.add('is-in'));
});
await mpage.waitForTimeout(1000);
await mpage.screenshot({ path: path.join(OUT, 'home-mobile.png'), fullPage: true });
await mobile.close();

await browser.close();
server.close();
console.log('review saved to tools/review/');
