import { chromium } from 'playwright';
const url = 'http://localhost:5173/';
const outDir = process.argv[2] || 'motion';
const b = await chromium.launch();
const ctx = await b.newContext({ viewport: { width: 1440, height: 900 }, deviceScaleFactor: 1 });
const page = await ctx.newPage();
await page.goto(url, { waitUntil: 'domcontentloaded' });
await page.evaluate(async () => {
  document.querySelectorAll('img').forEach(i => { i.loading = 'eager'; i.decoding = 'sync'; });
  await Promise.all([...document.images].map(i => i.complete ? Promise.resolve() : new Promise(r => {
    i.addEventListener('load', r, { once: true });
    i.addEventListener('error', r, { once: true });
  })));
  document.getElementById('collage')?.classList.add('in');
});
await page.waitForTimeout(800);
// Sample computed transform at 3 moments 300ms apart
const samples = [];
for (let i = 0; i < 3; i++) {
  const t = await page.evaluate(() => {
    const drifts = [...document.querySelectorAll('.ccard-drift')].map(d => getComputedStyle(d).transform);
    return drifts;
  });
  samples.push(t);
  await page.screenshot({ path: `${outDir}-${i}.png`, clip: { x: 720, y: 60, width: 720, height: 840 } });
  await page.waitForTimeout(300);
}
console.log(JSON.stringify({
  samples: samples.map(s => s.map(t => t.slice(0, 60))),
  driftDelta: samples.map((s, i) => i === 0 ? null : s.map((v, j) => v !== samples[i-1][j])),
}, null, 2));
await b.close();
