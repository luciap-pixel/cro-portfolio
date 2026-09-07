/* Acceptance suite for the standalone Work and Services pages,
   implementing the section 7 table of MASTER-PROMPT (1).md.
   verify.py was not supplied with the bundle, so this is an equivalent.

   usage: node tools/verify-pages.mjs <url> <path-to-html> */
import { chromium } from 'playwright';
import fs from 'fs';

const URL = process.argv[2];
const FILE = process.argv[3];
const results = [];
const pass = (n, d = '') => results.push({ ok: true, n, d });
const fail = (n, d = '') => results.push({ ok: false, n, d });
const skip = (n, d = '') => results.push({ ok: true, n: n + ' (n/a)', d });

const browser = await chromium.launch();
const WIDTHS = [360, 768, 1024, 1440, 1920];
let allErrors = [], overflowBad = [], brokenAll = [], clippedAll = [];

for (const w of WIDTHS) {
  const p = await browser.newPage({ viewport: { width: w, height: 900 } });
  const errs = [];
  p.on('console', m => { if (m.type() === 'error') errs.push(`${w}px: ${m.text()}`); });
  p.on('pageerror', e => errs.push(`${w}px: ${e.message}`));
  await p.goto(URL, { waitUntil: 'networkidle' });
  await p.evaluate(() => document.fonts.ready);
  await p.waitForTimeout(1200);

  const bad = await p.evaluate(async () => {
    const de = document.documentElement, out = [];
    const max = de.scrollHeight - window.innerHeight;
    for (let y = 0; y <= max; y += Math.max(200, Math.round(window.innerHeight / 2))) {
      window.scrollTo(0, y);
      await new Promise(r => requestAnimationFrame(() => requestAnimationFrame(r)));
      if (de.scrollWidth !== de.clientWidth) out.push({ y, sw: de.scrollWidth, cw: de.clientWidth });
    }
    return out;
  });
  if (bad.length) overflowBad.push(`${w}px: y=${bad[0].y} sw=${bad[0].sw} cw=${bad[0].cw} (+${bad.length - 1} more)`);
  allErrors = allErrors.concat(errs);

  const broken = await p.evaluate(() => [...document.images]
    .filter(i => i.complete && i.naturalWidth === 0).map(i => i.getAttribute('src')));
  if (broken.length) brokenAll.push(`${w}px: ${broken.join(', ')}`);

  const clipped = await p.evaluate(() => [...document.querySelectorAll('.htitle .ln')]
    .filter(el => el.scrollWidth > el.clientWidth + 1)
    .map(el => `${el.textContent.trim().slice(0, 30)} (${el.scrollWidth}>${el.clientWidth})`));
  if (clipped.length) clippedAll.push(`${w}px: ${clipped.join('; ')}`);

  await p.close();
}
overflowBad.length
  ? fail('Horizontal overflow (5 widths, every scroll pos)', overflowBad.join(' | '))
  : pass('Horizontal overflow (5 widths, every scroll pos)', 'scrollWidth == clientWidth throughout');
allErrors.length ? fail('Console errors', allErrors.join(' | ')) : pass('Console errors', 'zero at every width');
brokenAll.length ? fail('Broken images', brokenAll.join(' | ')) : pass('Broken images', 'zero');
clippedAll.length ? fail('Headline lines clipped', clippedAll.join(' | ')) : pass('Headline lines clipped', 'zero');

/* ---------- 1440x900 ---------- */
const p = await browser.newPage({ viewport: { width: 1440, height: 900 } });
await p.goto(URL, { waitUntil: 'networkidle' });
await p.evaluate(() => document.fonts.ready);
await p.waitForTimeout(2000);

const hasCards = await p.locator('[data-card]').count();
if (hasCards) {
  const cards = await p.evaluate(() => [...document.querySelectorAll('[data-card]')].map(c => {
    const b = c.getBoundingClientRect();
    const cta = c.querySelector('.c-cta');
    const cb = cta ? cta.getBoundingClientRect() : null;
    return {
      h: Math.round(b.height),
      ctaInside: cb ? (cb.bottom <= b.bottom + 1 && cb.top >= b.top - 1 && cb.right <= b.right + 1) : null,
      title: (c.querySelector('.c-title') || {}).textContent
    };
  }));
  const heights = [...new Set(cards.map(c => c.h))];
  cards.length === 6 ? pass('Project cards count', '6') : fail('Project cards count', String(cards.length));
  heights.length === 1 ? pass('Cards uniform height', `all ${heights[0]}px`) : fail('Cards uniform height', heights.join(', '));
  const out = cards.filter(c => c.ctaInside === false);
  out.length ? fail('CTA inside card bounds', out.map(c => c.title).join(', ')) : pass('CTA inside card bounds', 'all 6 contained');
} else {
  skip('Project cards', 'no [data-card] on this page');
}

const nav = await p.evaluate(() => {
  const n = document.querySelector('nav');
  const b = n.getBoundingClientRect();
  return { h: Math.round(b.height * 10) / 10, top: Math.round(b.top * 10) / 10, blur: getComputedStyle(n).backdropFilter };
});
(Math.abs(nav.h - 71) <= 1 && Math.abs(nav.top - 20) <= 1)
  ? pass('Nav height / top @1440', `${nav.h}px / ${nav.top}px  (${nav.blur})`)
  : fail('Nav height / top @1440', `got ${nav.h} / ${nav.top}, want 71 / 20`);

const perf = await p.evaluate(async () => {
  const deltas = []; let last = performance.now(), stop = false;
  const tick = t => { deltas.push(t - last); last = t; if (!stop) requestAnimationFrame(tick); };
  requestAnimationFrame(tick);
  const max = document.documentElement.scrollHeight - innerHeight;
  for (let y = 0; y <= max; y += 60) { window.scrollTo(0, y); await new Promise(r => requestAnimationFrame(r)); }
  stop = true; await new Promise(r => setTimeout(r, 60));
  const s = deltas.slice(3).sort((a, b) => a - b);
  return { median: s[Math.floor(s.length / 2)], p95: s[Math.floor(s.length * 0.95)], n: s.length };
});
(perf.median <= 20 && perf.p95 <= 35)
  ? pass('Scroll frame time @1440x900', `median ${perf.median.toFixed(1)}ms, p95 ${perf.p95.toFixed(1)}ms (${perf.n} frames)`)
  : fail('Scroll frame time @1440x900', `median ${perf.median.toFixed(1)}ms, p95 ${perf.p95.toFixed(1)}ms`);

/* Reveal replay. Counting .in at arbitrary scroll offsets is boundary
   sensitive: any element whose intersection ratio sits near the observer
   threshold flickers between runs. Test the actual semantics instead, per
   element: fully in -> lit, scrolled away -> unlit, back again -> relit.
   A one-shot reveal (the regression this guards against) stays lit at
   step 2 and so fails here. */
const replay = await p.evaluate(async () => {
  const settle = ms => new Promise(r => setTimeout(r, ms));
  // html{scroll-behavior:smooth} animates these jumps; a long one is still in
  // flight when we sample, so pin it to instant for the measurement.
  const prevBehavior = document.documentElement.style.scrollBehavior;
  document.documentElement.style.scrollBehavior = 'auto';
  const targets = [...document.querySelectorAll('.rev,.cmp,[data-card]')].slice(0, 8);
  const rows = [];
  for (const el of targets) {
    el.scrollIntoView({ block: 'center' });
    await settle(700);
    const lit1 = el.classList.contains('in');
    // Push it clear of the viewport. Scrolling up clamps at 0 for anything in
    // the hero, so try both directions and confirm it really left the screen
    // before judging the class.
    // Sticky cards stay pinned through their own scroll range, so a computed
    // offset is unreliable. Both document extremes are always valid scroll
    // positions; one of them clears any element on a page this long.
    const maxY = document.documentElement.scrollHeight - innerHeight;
    let offscreen = false;
    for (const target of [maxY, 0]) {
      window.scrollTo(0, target);
      await settle(650);
      const r = el.getBoundingClientRect();
      if (r.bottom < 0 || r.top > innerHeight) { offscreen = true; break; }
    }
    const unlit = offscreen && !el.classList.contains('in');
    el.scrollIntoView({ block: 'center' });
    await settle(700);
    const lit2 = el.classList.contains('in');
    rows.push({
      el: el.className.replace(/\s*\bin\b/, '').trim().split(/\s+/)[0] || el.tagName,
      lit1, unlit, lit2, offscreen
    });
  }
  document.documentElement.style.scrollBehavior = prevBehavior;
  return { rows, ok: rows.every(r => r.lit1 && r.unlit && r.lit2), n: rows.length };
});
replay.ok
  ? pass('Reveal replay', `${replay.n} elements: lit, unlit when scrolled away, relit on return`)
  : fail('Reveal replay', replay.rows.filter(r => !(r.lit1 && r.unlit && r.lit2))
      .map(r => `${r.el}: lit=${r.lit1} leftView=${r.offscreen} unlit=${r.unlit} relit=${r.lit2}`).join(' | '));

/* dead rules: selectors that match nothing, ignoring JS-applied state classes */
const html = fs.readFileSync(FILE, 'utf8');
// strip comments up front, otherwise a comment sitting above a rule gets
// swallowed into that rule's prelude and its prose parsed as selectors
const css = html.slice(html.indexOf('<style>') + 7, html.indexOf('</style>'))
  .replace(/\/\*[\s\S]*?\*\//g, '');
// classes the JS applies at runtime, so absent from the static markup
const STATE = /\.(in|on|open|stuck|hid|live|out|js|soon|done|active|lit)\b/g;
const preludes = [];
{
  let i = 0, ctx = [];
  while (i < css.length) {
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
        let d = 1; while (i < css.length && d > 0) { if (css[i] === '{') d++; else if (css[i] === '}') d--; i++; }
        ctx.pop();
      }
      continue;
    }
    let d = 1; while (i < css.length && d > 0) { if (css[i] === '{') d++; else if (css[i] === '}') d--; i++; }
    preludes.push({ prelude, ctx: ctx.join(' >> ') || 'top-level' });
  }
}
const dupSeen = new Map();
for (const { prelude, ctx } of preludes) {
  const k = ctx + ' :: ' + prelude;
  dupSeen.set(k, (dupSeen.get(k) || 0) + 1);
}
const dupes = [...dupSeen].filter(([, c]) => c > 1);
dupes.length ? fail('Duplicate CSS selector blocks', dupes.map(([s, c]) => `${s} x${c}`).slice(0, 6).join(' | '))
             : pass('Duplicate CSS selector blocks', 'zero');

const candidates = [...new Set(preludes.flatMap(({ prelude }) => prelude.split(',').map(s => s.trim())))]
  .map(sel => sel.replace(/::?[a-z-]+(\([^)]*\))?/g, '').replace(STATE, '').replace(/\s+/g, ' ').trim())
  // bare element selectors are shared base resets carried over from the
  // homepage, not rules left behind by a removed section
  .filter(s => s && !s.startsWith('*') && !/^[a-z][a-z0-9]*$/.test(s));
const dead = await p.evaluate(sels => sels.filter(s => {
  try { return !document.querySelector(s); } catch { return false; }
}), candidates);
dead.length ? fail('Dead rules from removed sections', dead.join(', '))
            : pass('Dead rules from removed sections', `zero (${candidates.length} selectors checked)`);

const em = (html.match(/—/g) || []).length;
em === 0 ? pass('Em-dashes in markup', 'zero U+2014') : fail('Em-dashes in markup', `${em} found`);

await p.close();
await browser.close();

console.log('\n' + '='.repeat(74));
for (const r of results) console.log(`${r.ok ? 'PASS' : 'FAIL'}  ${r.n.padEnd(44)} ${r.d}`);
const failed = results.filter(r => !r.ok);
console.log('='.repeat(74));
console.log(failed.length ? `${failed.length} CHECK(S) FAILED` : `ALL ${results.length} CHECKS PASSED`);
process.exit(failed.length ? 1 : 0);
