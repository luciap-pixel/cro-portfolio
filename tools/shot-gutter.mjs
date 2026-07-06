import { chromium } from 'playwright';
const url = process.argv[2] || 'http://localhost:5173/';
const width = parseInt(process.argv[3] || '1440', 10);
const height = parseInt(process.argv[4] || '900', 10);
const out = process.argv[5] || 'gutter.png';
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
  const hc = document.getElementById('heroContent');
  if (hc) hc.classList.add('in');
});
// Read the computed --gutter-x from :root and overlay two vertical guides + a container-max frame.
await page.addStyleTag({ content: `
  *,*::before,*::after{animation-play-state:paused!important;transition:none!important}
  .reveal,.stagger>*,.hero-content .anim{opacity:1!important;transform:none!important}
  html::before,html::after,body::before,body::after{content:"";position:fixed;top:0;bottom:0;width:2px;background:#FF00E0;opacity:.55;z-index:9999;pointer-events:none}
  html::before{left:var(--gutter-x)}
  html::after{right:var(--gutter-x)}
  body::before{left:50%;transform:translateX(calc(-1 * var(--container-max) / 2));background:rgba(0,220,120,.5)}
  body::after{left:50%;transform:translateX(calc(var(--container-max) / 2));background:rgba(0,220,120,.5)}
`});
await page.waitForTimeout(400);
await page.screenshot({ path: out, fullPage: true });
await b.close();
console.log('shot', out);
