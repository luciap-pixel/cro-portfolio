import { chromium } from 'playwright';
const url = process.argv[2] || 'http://localhost:5173/';
const width = parseInt(process.argv[3] || '1440', 10);
const height = parseInt(process.argv[4] || '900', 10);
const out = process.argv[5] || 'fold.png';
const b = await chromium.launch();
const ctx = await b.newContext({ viewport: { width, height }, deviceScaleFactor: 1 });
const page = await ctx.newPage();
await page.goto(url, { waitUntil: 'domcontentloaded' });
await page.evaluate(async () => {
  document.querySelectorAll('img').forEach(i => { i.loading = 'eager'; i.decoding = 'sync'; });
  await Promise.all([...document.images].map(i => i.complete ? Promise.resolve() : new Promise(r => {
    i.addEventListener('load', r, { once: true });
    i.addEventListener('error', r, { once: true });
  })));
  document.querySelectorAll('.reveal,.stagger').forEach(el => el.classList.add('in'));
});
await page.addStyleTag({ content: '*,*::before,*::after{animation-play-state:paused!important;transition:none!important}.reveal,.stagger>*{opacity:1!important;transform:none!important}' });
await page.waitForTimeout(400);
await page.screenshot({ path: out, fullPage: false });
await b.close();
console.log('shot', out);
