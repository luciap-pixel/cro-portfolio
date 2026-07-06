import { chromium } from 'playwright';
import fs from 'fs';

const url = process.argv[2] || 'http://localhost:5173/';
const width = parseInt(process.argv[3] || '1440', 10);
const height = parseInt(process.argv[4] || '900', 10);
const out = process.argv[5] || 'shot.png';
const reduce = process.argv[6] === 'reduce';

const b = await chromium.launch();
const ctx = await b.newContext({
  viewport: { width, height },
  reducedMotion: reduce ? 'reduce' : 'no-preference',
  deviceScaleFactor: 1,
});
const page = await ctx.newPage();
const consoleMsgs = [];
page.on('console', m => consoleMsgs.push(`[${m.type()}] ${m.text()}`));
page.on('pageerror', e => consoleMsgs.push(`[pageerror] ${e.message}`));

await page.goto(url, { waitUntil: 'domcontentloaded' });
// force-eager images and wait for them
await page.evaluate(async () => {
  document.querySelectorAll('img').forEach(i => { i.loading = 'eager'; i.decoding = 'sync'; });
  await Promise.all([...document.images].map(i => i.complete ? Promise.resolve() : new Promise(r => {
    i.addEventListener('load', r, { once: true });
    i.addEventListener('error', r, { once: true });
  })));
});
// Force-reveal every scroll-reveal element (IntersectionObserver never fires during fullPage screenshot)
await page.evaluate(() => {
  document.querySelectorAll('.reveal,.stagger').forEach(el => el.classList.add('in'));
});
// Pause CSS animations for clean screenshot
await page.addStyleTag({ content: '*,*::before,*::after{animation-play-state:paused!important;transition:none!important}.reveal,.stagger>*{opacity:1!important;transform:none!important}' });
await page.waitForTimeout(500);

const images = await page.evaluate(() => ({
  count: document.images.length,
  broken: [...document.images].filter(i => !i.complete || i.naturalWidth === 0).map(i => i.src),
}));

const anchors = await page.evaluate(() => {
  const links = [...document.querySelectorAll('a[href]')];
  return {
    tiktok: links.filter(a => /tiktok/i.test(a.href)).map(a => a.href),
    navHash: [...document.querySelectorAll('.nav-links a')].map(a => ({ text: a.textContent.trim(), href: a.getAttribute('href') })),
    ctas: [...document.querySelectorAll('a.btn')].map(a => ({ text: a.textContent.trim(), href: a.getAttribute('href') })),
    mailto: links.filter(a => a.href.startsWith('mailto:')).map(a => a.href),
  };
});

await page.screenshot({ path: out, fullPage: true });
fs.writeFileSync(out + '.json', JSON.stringify({ images, anchors, consoleMsgs }, null, 2));
await b.close();
console.log(JSON.stringify({ shot: out, ...images, anchors, consoleMsgs }, null, 2));
