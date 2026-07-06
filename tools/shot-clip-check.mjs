import { chromium } from 'playwright';
const widths = [1920, 1440, 1280, 1024];
const b = await chromium.launch();
const ctx = await b.newContext({ viewport: { width: 1440, height: 900 }, deviceScaleFactor: 1 });
const page = await ctx.newPage();
const errs = [];
page.on('pageerror', e => errs.push(e.message));
page.on('console', m => { if (m.type() === 'error') errs.push('con: ' + m.text()); });
await page.goto('http://localhost:5173/', { waitUntil: 'domcontentloaded' });
await page.evaluate(async () => {
  document.querySelectorAll('img').forEach(i => { i.loading = 'eager'; i.decoding = 'sync'; });
  await Promise.all([...document.images].map(i => i.complete ? Promise.resolve() : new Promise(r => {
    i.addEventListener('load', r, { once: true });
    i.addEventListener('error', r, { once: true });
  })));
  document.getElementById('collage')?.classList.add('in');
});
const results = {};
for (const w of widths) {
  await page.setViewportSize({ width: w, height: 900 });
  await page.waitForTimeout(150);
  results[w] = await page.evaluate(() => {
    const container = document.querySelector('.hero .container');
    const csPad = parseFloat(getComputedStyle(container).paddingLeft);
    const cRect = container.getBoundingClientRect();
    const gutterRight = cRect.right - csPad;
    const heroText = document.querySelector('.hero-content');
    const trect = heroText.getBoundingClientRect();
    const drifts = [...document.querySelectorAll('.ccard-drift')];
    return {
      viewport: innerWidth,
      gutterRight: Math.round(gutterRight),
      textRight: Math.round(trect.right),
      cards: drifts.map((d, i) => {
        const r = d.getBoundingClientRect();
        return { i: i + 1, right: Math.round(r.right), left: Math.round(r.left),
          bleedsGutter: r.right > gutterRight + 1,
          clipsText: r.left < trect.right - 2 };
      }),
    };
  });
}
console.log(JSON.stringify({ results, errs }, null, 2));
await b.close();
