import { chromium } from 'playwright';
const url = 'http://localhost:5173/';
const width = parseInt(process.argv[2] || '1440', 10);
const selector = process.argv[3] || '#services';
const out = process.argv[4] || 'section.png';
const reduce = process.argv[5] === 'reduce';
const b = await chromium.launch();
const ctx = await b.newContext({ viewport: { width, height: 900 }, deviceScaleFactor: 1, reducedMotion: reduce ? 'reduce' : 'no-preference' });
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
  document.getElementById('heroContent')?.classList.add('in');
});
await page.addStyleTag({ content: '*,*::before,*::after{animation-play-state:paused!important;transition:none!important}.reveal,.stagger>*,.hero-content .anim{opacity:1!important;transform:none!important}.proc-line-inner{width:100%!important}.proc-dot{transform:translate(-50%,0) scale(1)!important}.who-checks li{opacity:1!important;transform:none!important}' });
await page.evaluate(sel => {
  document.documentElement.style.scrollBehavior = 'auto';
  const el = document.querySelector(sel);
  const y = el.getBoundingClientRect().top + window.scrollY - 40;
  window.scrollTo({ top: Math.max(0, y), behavior: 'instant' });
}, selector);
await page.waitForTimeout(300);
const box = await page.evaluate(sel => {
  const el = document.querySelector(sel);
  const r = el.getBoundingClientRect();
  return { top: Math.round(r.top), height: Math.round(r.height) };
}, selector);
const clipY = Math.max(0, box.top);
const clipH = Math.min(900 - clipY, box.height + 20);
await page.screenshot({ path: out, clip: { x: 0, y: clipY, width, height: clipH } });
console.log(JSON.stringify({ selector, width, box, errs }, null, 2));
await b.close();
