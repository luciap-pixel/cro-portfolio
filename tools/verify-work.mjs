/* Acceptance suite for the Work page, implementing the section 6 table.
   verify.py was not supplied with the bundle, so this is an equivalent. */
import { chromium } from 'playwright';
import fs from 'fs';

const URL = process.argv[2];
const REPO = process.argv[3];
const results = [];
const pass = (n, d = '') => results.push({ ok: true, n, d });
const fail = (n, d = '') => results.push({ ok: false, n, d });

const browser = await chromium.launch();

/* ---------- 1 + 2: overflow at every scroll position, console errors ---------- */
const WIDTHS = [360, 768, 1024, 1440, 1920];
let allErrors = [];
let overflowBad = [];
for (const w of WIDTHS) {
  const p = await browser.newPage({ viewport: { width: w, height: 900 } });
  const errs = [];
  p.on('console', m => { if (m.type() === 'error') errs.push(`${w}px: ${m.text()}`); });
  p.on('pageerror', e => errs.push(`${w}px: ${e.message}`));
  await p.goto(URL, { waitUntil: 'networkidle' });
  await p.evaluate(() => document.fonts.ready);
  await p.waitForTimeout(1200);

  const bad = await p.evaluate(async () => {
    const de = document.documentElement;
    const out = [];
    const max = de.scrollHeight - window.innerHeight;
    for (let y = 0; y <= max; y += Math.max(200, Math.round(window.innerHeight / 2))) {
      window.scrollTo(0, y);
      await new Promise(r => requestAnimationFrame(() => requestAnimationFrame(r)));
      if (de.scrollWidth !== de.clientWidth) out.push({ y, sw: de.scrollWidth, cw: de.clientWidth });
    }
    return out;
  });
  if (bad.length) overflowBad.push(`${w}px: ${bad.length} position(s), e.g. y=${bad[0].y} scrollWidth=${bad[0].sw} clientWidth=${bad[0].cw}`);
  allErrors = allErrors.concat(errs);

  /* ---------- 4: headline lines silently clipped ---------- */
  const clipped = await p.evaluate(() => [...document.querySelectorAll('.htitle .ln')]
    .filter(el => el.scrollWidth > el.clientWidth + 1)
    .map(el => ({ text: el.textContent.trim().slice(0, 40), sw: el.scrollWidth, cw: el.clientWidth })));
  if (clipped.length) fail(`Headline clipped @${w}`, JSON.stringify(clipped));

  /* ---------- 3: broken images ---------- */
  const broken = await p.evaluate(() => [...document.images]
    .filter(i => i.complete && i.naturalWidth === 0).map(i => i.getAttribute('src')));
  if (broken.length) fail(`Broken images @${w}`, broken.join(', '));

  await p.close();
}
overflowBad.length
  ? fail('Horizontal overflow (360/768/1024/1440/1920, every scroll pos)', overflowBad.join(' | '))
  : pass('Horizontal overflow (360/768/1024/1440/1920, every scroll pos)', 'scrollWidth == clientWidth throughout');
allErrors.length ? fail('Console errors', allErrors.join(' | ')) : pass('Console errors', 'zero at every width');
if (!results.some(r => r.n.startsWith('Broken images'))) pass('Broken images', 'zero');
if (!results.some(r => r.n.startsWith('Headline clipped'))) pass('Headline lines clipped', 'zero');

/* ---------- 5 + 6 + 7 + 8 at 1440x900 ---------- */
const p = await browser.newPage({ viewport: { width: 1440, height: 900 } });
await p.goto(URL, { waitUntil: 'networkidle' });
await p.evaluate(() => document.fonts.ready);
await p.waitForTimeout(2000);

const cards = await p.evaluate(() => {
  const els = [...document.querySelectorAll('.pcard, .wcard, [class*="card"]')]
    .filter(e => e.querySelector('h3, h2'));
  const uniq = els.filter(e => !els.some(o => o !== e && o.contains(e)));
  return uniq.map(c => {
    const b = c.getBoundingClientRect();
    const cta = c.querySelector('a.btn, .cta, a[class*="arrow"], a');
    const cb = cta ? cta.getBoundingClientRect() : null;
    return {
      h: Math.round(b.height), w: Math.round(b.width),
      ctaInside: cb ? (cb.bottom <= b.bottom + 1 && cb.top >= b.top - 1 && cb.right <= b.right + 1) : null,
      ctaText: cta ? cta.textContent.trim().slice(0, 24) : null,
      title: (c.querySelector('h3, h2') || {}).textContent?.trim().slice(0, 30)
    };
  });
});
const heights = [...new Set(cards.map(c => c.h))];
cards.length === 6
  ? pass('Project cards count', '6')
  : fail('Project cards count', `found ${cards.length}: ${cards.map(c => c.title).join(', ')}`);
heights.length === 1
  ? pass('Cards uniform height', `all ${heights[0]}px`)
  : fail('Cards uniform height', `heights: ${heights.join(', ')}`);
const ctaOut = cards.filter(c => c.ctaInside === false);
ctaOut.length ? fail('CTA inside card bounds', JSON.stringify(ctaOut)) : pass('CTA inside card bounds', 'all 6 contained');

const nav = await p.evaluate(() => {
  const n = document.querySelector('nav');
  const b = n.getBoundingClientRect();
  return { h: Math.round(b.height * 10) / 10, top: Math.round(b.top * 10) / 10, blur: getComputedStyle(n).backdropFilter };
});
(Math.abs(nav.h - 71) <= 1 && Math.abs(nav.top - 20) <= 1)
  ? pass('Nav height / top @1440', `${nav.h}px / ${nav.top}px  (${nav.blur})`)
  : fail('Nav height / top @1440', `got ${nav.h}px / ${nav.top}px, want 71 / 20`);

/* frame timing during a scripted scroll */
const perf = await p.evaluate(async () => {
  const deltas = [];
  let last = performance.now(), stop = false;
  const tick = t => { deltas.push(t - last); last = t; if (!stop) requestAnimationFrame(tick); };
  requestAnimationFrame(tick);
  const max = document.documentElement.scrollHeight - innerHeight;
  for (let y = 0; y <= max; y += 60) {
    window.scrollTo(0, y);
    await new Promise(r => requestAnimationFrame(r));
  }
  stop = true;
  await new Promise(r => setTimeout(r, 60));
  const s = deltas.slice(3).sort((a, b) => a - b);
  return { median: s[Math.floor(s.length / 2)], p95: s[Math.floor(s.length * 0.95)], n: s.length };
});
(perf.median <= 20 && perf.p95 <= 35)
  ? pass('Scroll frame time @1440x900', `median ${perf.median.toFixed(1)}ms, p95 ${perf.p95.toFixed(1)}ms (${perf.n} frames)`)
  : fail('Scroll frame time @1440x900', `median ${perf.median.toFixed(1)}ms, p95 ${perf.p95.toFixed(1)}ms — want <=20 / <=35`);

/* reveal replay: .in counts must match going down and coming back up */
const replay = await p.evaluate(async () => {
  const stops = [];
  const max = document.documentElement.scrollHeight - innerHeight;
  const step = Math.round(max / 8);
  const count = async y => {                 // wait until the .in count stops changing
    window.scrollTo(0, y);
    let prev = -1, stable = 0;
    for (let t = 0; t < 25; t++) {
      await new Promise(r => setTimeout(r, 100));
      const n = document.querySelectorAll('.in').length;
      if (n === prev) { if (++stable >= 3) break; } else { stable = 0; prev = n; }
    }
    return document.querySelectorAll('.in').length;
  };
  const down = [], up = [];
  for (let y = 0; y <= max; y += step) { stops.push(y); down.push(await count(y)); }
  for (let i = stops.length - 1; i >= 0; i--) up[i] = await count(stops[i]);
  return { stops, down, up, same: down.every((v, i) => v === up[i]) };
});
replay.same
  ? pass('Reveal replay', `.in counts identical both directions (${replay.down.join(',')})`)
  : fail('Reveal replay', `down ${replay.down.join(',')} vs up ${replay.up.join(',')}`);

await p.close();
await browser.close();

/* ---------- 9 + 10: static checks on the file ---------- */
const html = fs.readFileSync(REPO + '/work/index.html', 'utf8');
const css = html.slice(html.indexOf('<style>') + 7, html.indexOf('</style>'));
/* A duplicate block is the same full prelude declared twice in the same
   at-rule context. Keyframe bodies are skipped; a selector appearing in
   both a grouped base rule and its own rule is normal layering, not a dupe. */
const seen = new Map();
{
  let i = 0, ctx = [];
  while (i < css.length) {
    if (css.startsWith('/*', i)) { i = css.indexOf('*/', i) + 2; continue; }
    if (css[i] === '}') { ctx.pop(); i++; continue; }
    const brace = css.indexOf('{', i);
    if (brace < 0) break;
    const close = css.indexOf('}', i);
    if (close >= 0 && close < brace) { i = close + 1; continue; }
    const prelude = css.slice(i, brace).replace(/\s+/g, ' ').trim();
    i = brace + 1;
    if (prelude.startsWith('@')) {
      ctx.push(prelude);
      if (/^@keyframes/i.test(prelude)) {
        let d = 1;
        while (i < css.length && d > 0) { if (css[i] === '{') d++; else if (css[i] === '}') d--; i++; }
        ctx.pop();
      }
      continue;
    }
    let d = 1;
    while (i < css.length && d > 0) { if (css[i] === '{') d++; else if (css[i] === '}') d--; i++; }
    const key = (ctx.join(' >> ') || 'top-level') + ' :: ' + prelude;
    seen.set(key, (seen.get(key) || 0) + 1);
  }
}
const dupes = [...seen].filter(([, c]) => c > 1);
dupes.length
  ? fail('Duplicate CSS selector blocks', dupes.map(([s, c]) => `${s} x${c}`).slice(0, 6).join(' | '))
  : pass('Duplicate CSS selector blocks', 'zero');

const em = (html.match(/—/g) || []).length;
em === 0 ? pass('Em-dashes in markup', 'zero U+2014') : fail('Em-dashes in markup', `${em} found`);

/* ---------- report ---------- */
console.log('\n' + '='.repeat(72));
for (const r of results) {
  console.log(`${r.ok ? 'PASS' : 'FAIL'}  ${r.n.padEnd(46)} ${r.d}`);
}
const failed = results.filter(r => !r.ok);
console.log('='.repeat(72));
console.log(failed.length ? `${failed.length} CHECK(S) FAILED` : `ALL ${results.length} CHECKS PASSED`);
process.exit(failed.length ? 1 : 0);
