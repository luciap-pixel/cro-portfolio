import { chromium } from 'playwright';
const b = await chromium.launch();
const results = {};
for (const w of [1920, 1440, 1280, 1024, 390]) {
  const ctx = await b.newContext({ viewport: { width: w, height: 900 }, deviceScaleFactor: 1 });
  const page = await ctx.newPage();
  await page.goto('http://localhost:5173/', { waitUntil: 'domcontentloaded' });
  await page.evaluate(async () => {
    document.querySelectorAll('img').forEach(i => { i.loading = 'eager'; i.decoding = 'sync'; });
    await Promise.all([...document.images].map(i => i.complete ? Promise.resolve() : new Promise(r => {
      i.addEventListener('load', r, { once: true });
      i.addEventListener('error', r, { once: true });
    })));
    document.getElementById('collage')?.classList.add('in');
    // Freeze drift so overlap measurement is stable
    document.querySelectorAll('.ccard-drift').forEach(d => d.style.animationPlayState = 'paused');
  });
  await page.addStyleTag({ content: '*,*::before,*::after{animation-play-state:paused!important;transition:none!important}' });
  await page.waitForTimeout(300);

  results[w] = await page.evaluate(() => {
    const drifts = [...document.querySelectorAll('.ccard-drift')];
    const boxes = drifts.map(d => {
      const r = d.getBoundingClientRect();
      return { left: r.left, right: r.right, top: r.top, bottom: r.bottom, w: r.width, h: r.height, area: r.width * r.height };
    });
    // For each card, compute % occluded by other cards (union of pairwise intersections)
    const occlusion = boxes.map((b, i) => {
      let obscured = 0;
      for (let j = 0; j < boxes.length; j++) {
        if (i === j) continue;
        const o = boxes[j];
        const ox = Math.max(0, Math.min(b.right, o.right) - Math.max(b.left, o.left));
        const oy = Math.max(0, Math.min(b.bottom, o.bottom) - Math.max(b.top, o.top));
        obscured += ox * oy;
      }
      // clamp obscured to card area (in case of triple overlap double-counting)
      obscured = Math.min(obscured, b.area);
      return {
        card: 'c' + (i + 1),
        widthPx: Math.round(b.w),
        heightPx: Math.round(b.h),
        obscuredPx: Math.round(obscured),
        obscuredPct: Math.round((obscured / b.area) * 100),
        visiblePct: Math.round(((b.area - obscured) / b.area) * 100),
      };
    });
    return occlusion;
  });
  await ctx.close();
}
console.log(JSON.stringify(results, null, 2));
await b.close();
