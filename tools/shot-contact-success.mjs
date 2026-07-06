import { chromium } from 'playwright';
const width = parseInt(process.argv[2] || '1440', 10);
const out = process.argv[3] || 'contact-success.png';
const b = await chromium.launch();
const ctx = await b.newContext({ viewport: { width, height: 900 }, deviceScaleFactor: 1 });
const page = await ctx.newPage();
await page.goto('http://localhost:5173/', { waitUntil: 'domcontentloaded' });
await page.evaluate(async () => {
  document.querySelectorAll('img').forEach(i => { i.loading = 'eager'; i.decoding = 'sync'; });
  await Promise.all([...document.images].map(i => i.complete ? Promise.resolve() : new Promise(r => {
    i.addEventListener('load', r, { once: true });
    i.addEventListener('error', r, { once: true });
  })));
  document.querySelectorAll('.reveal').forEach(el => el.classList.add('in'));
  // Simulate mailto-fallback success
  const form = document.getElementById('contactForm');
  const success = document.getElementById('formSuccess');
  success.querySelector('.succ-title').textContent = 'Thanks — landed in my inbox.';
  success.querySelector('.succ-sub').innerHTML = 'I\'ll reply within one working day. Meanwhile, I post store teardowns on <a href="https://www.tiktok.com/@luuciiaap" target="_blank" rel="noopener noreferrer">TikTok @luuciiaap →</a>';
  form.style.display = 'none';
  success.classList.add('show', 'in');
});
await page.addStyleTag({ content: '*,*::before,*::after{animation-play-state:paused!important;transition:none!important}.reveal{opacity:1!important;transform:none!important}' });
await page.evaluate(() => {
  document.documentElement.style.scrollBehavior = 'auto';
  const el = document.querySelector('#contact');
  const y = el.getBoundingClientRect().top + window.scrollY - 20;
  window.scrollTo({ top: Math.max(0, y), behavior: 'instant' });
});
await page.waitForTimeout(300);
const box = await page.evaluate(() => {
  const r = document.querySelector('#contact').getBoundingClientRect();
  return { top: Math.round(r.top), height: Math.round(r.height) };
});
const clipY = Math.max(0, box.top);
const clipH = Math.min(900 - clipY, box.height + 20);
await page.screenshot({ path: out, clip: { x: 0, y: clipY, width, height: clipH } });
console.log('shot', out);
await b.close();
