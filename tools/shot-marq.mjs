import { chromium } from 'playwright';
const url = 'http://localhost:5173/';
const width = parseInt(process.argv[2] || '1440', 10);
const outBase = process.argv[3] || 'marq';
const waitBefore = parseInt(process.argv[4] || '6000', 10); // ms into the loop
const reduce = process.argv[5] === 'reduce';

const b = await chromium.launch();
const ctx = await b.newContext({
  viewport: { width, height: 900 },
  deviceScaleFactor: 1,
  reducedMotion: reduce ? 'reduce' : 'no-preference',
});
const page = await ctx.newPage();
const errs = [];
page.on('console', m => { if (m.type() === 'error') errs.push(m.text()); });
page.on('pageerror', e => errs.push('pageerror: ' + e.message));

await page.goto(url, { waitUntil: 'domcontentloaded' });
await page.evaluate(async () => {
  document.querySelectorAll('img').forEach(i => { i.loading = 'eager'; i.decoding = 'sync'; });
  await Promise.all([...document.images].map(i => i.complete ? Promise.resolve() : new Promise(r => {
    i.addEventListener('load', r, { once: true });
    i.addEventListener('error', r, { once: true });
  })));
  document.querySelectorAll('.reveal,.stagger').forEach(el => el.classList.add('in'));
  document.getElementById('collage')?.classList.add('in');
  const hc = document.getElementById('heroContent');
  if (hc) hc.classList.add('in');
});

// Wait waitBefore ms into the animation, without pausing it
await page.waitForTimeout(waitBefore);

// Scroll marquee to top of viewport for a clean crop
const box = await page.evaluate(() => {
  document.documentElement.style.scrollBehavior = 'auto';
  const el = document.querySelector('.marq');
  const y = el.getBoundingClientRect().top + window.scrollY;
  window.scrollTo({ top: Math.max(0, y - 20), behavior: 'auto' });
  const r = el.getBoundingClientRect();
  return { top: Math.round(r.top), height: Math.round(r.height) };
});
await page.waitForTimeout(200);

// Read the actual mask width being computed
const maskInfo = await page.evaluate(() => {
  const el = document.querySelector('.marq-track-wrap');
  const cs = getComputedStyle(el);
  return {
    maskImage: cs.maskImage || cs.webkitMaskImage,
    width: el.getBoundingClientRect().width,
    overflow: cs.overflow,
    trackDuration: getComputedStyle(document.querySelector('.marq .track')).animationDuration,
  };
});

const clipY = Math.max(0, box.top);
const clipH = Math.min(900 - clipY, box.height + 4);
await page.screenshot({ path: outBase + '.png', clip: { x: 0, y: clipY, width: width, height: clipH } });

console.log(JSON.stringify({ outBase, width, top: box.top, height: box.height, maskInfo, errors: errs }, null, 2));
await b.close();
