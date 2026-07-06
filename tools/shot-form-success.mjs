import { chromium } from 'playwright';
const url = 'http://localhost:5173/';
const out = process.argv[2] || 'form-success.png';
const b = await chromium.launch();
const ctx = await b.newContext({ viewport: { width: 1440, height: 900 }, deviceScaleFactor: 1 });
const page = await ctx.newPage();
await page.goto(url, { waitUntil: 'domcontentloaded' });
await page.evaluate(async () => {
  document.querySelectorAll('img').forEach(i => { i.loading = 'eager'; });
  await Promise.all([...document.images].map(i => i.complete ? Promise.resolve() : new Promise(r => {
    i.addEventListener('load', r, { once: true }); i.addEventListener('error', r, { once: true });
  })));
  document.querySelectorAll('.reveal,.stagger').forEach(el => el.classList.add('in'));
  const s = document.getElementById('formStatus');
  s.className = 'form-status show success';
  s.querySelector('.ttl').textContent = 'Message sent — thank you.';
  s.querySelector('.msg').textContent = 'I usually reply within one working day. Keep an eye on your inbox for a note from lucia@konar.studio.';
});
await page.addStyleTag({ content: '*,*::before,*::after{animation-play-state:paused!important;transition:none!important}' });
await page.evaluate(() => {
  document.documentElement.style.scrollBehavior = 'auto';
  const el = document.getElementById('contact');
  const y = el.getBoundingClientRect().top + window.scrollY;
  window.scrollTo({ top: y, behavior: 'instant' });
});
await page.waitForTimeout(600);
await page.screenshot({ path: out, fullPage: false });
await b.close();
console.log('shot', out);
