// SISTERLY · The Elevator — PDP interactions
(function () {
  'use strict';

  const state = {
    currency: 'GBP', // default to £ for the UK-facing demo
    mode: 'sub',
    plan: 'sub-1',
  };

  // 1) Gallery swap ------------------------------------------------
  const mainImg = document.getElementById('galleryMain');
  const thumbs = document.querySelectorAll('.thumb');
  thumbs.forEach((t) => {
    t.addEventListener('click', () => {
      thumbs.forEach((x) => {
        x.classList.remove('is-active');
        x.setAttribute('aria-selected', 'false');
      });
      t.classList.add('is-active');
      t.setAttribute('aria-selected', 'true');
      const src = t.dataset.src;
      const alt = t.dataset.alt || '';
      if (mainImg && src) {
        mainImg.style.opacity = '0';
        setTimeout(() => {
          mainImg.src = src;
          mainImg.alt = alt;
          mainImg.style.opacity = '1';
        }, 120);
      }
    });
  });

  // 2) Currency switcher -------------------------------------------
  const curBtns = document.querySelectorAll('.cur-btn');
  curBtns.forEach((b) => {
    b.addEventListener('click', () => {
      const cur = b.dataset.cur;
      if (cur === state.currency) return;
      state.currency = cur;
      curBtns.forEach((x) => {
        const on = x.dataset.cur === cur;
        x.classList.toggle('is-active', on);
        x.setAttribute('aria-pressed', on ? 'true' : 'false');
      });
      renderPrices();
      renderAtc();
    });
  });

  function symbol() { return state.currency === 'GBP' ? '£' : '€'; }
  function priceOf(el) {
    if (!el) return '';
    const val = state.currency === 'GBP' ? el.dataset.gbp : el.dataset.eur;
    return symbol() + val;
  }
  function totalOf(el) {
    if (!el) return '';
    const val = state.currency === 'GBP' ? el.dataset.gbpTotal : el.dataset.eurTotal;
    return symbol() + val;
  }

  function renderPrices() {
    document.querySelectorAll('.price-major').forEach((el) => {
      el.textContent = priceOf(el);
    });
    document.querySelectorAll('[data-eur-total]').forEach((el) => {
      el.textContent = totalOf(el);
    });
    document.querySelectorAll('[data-per-day-eur]').forEach((el) => {
      const val = state.currency === 'GBP' ? el.dataset.perDayGbp : el.dataset.perDayEur;
      el.textContent = symbol() + val;
    });
  }

  // 3) Plan mode toggle (sub / one-time) ---------------------------
  const modeBtns = document.querySelectorAll('.mode-btn');
  const planGroups = document.querySelectorAll('.plans');
  modeBtns.forEach((b) => {
    b.addEventListener('click', () => {
      const mode = b.dataset.mode;
      state.mode = mode;
      modeBtns.forEach((x) => {
        const on = x.dataset.mode === mode;
        x.classList.toggle('is-active', on);
        x.setAttribute('aria-selected', on ? 'true' : 'false');
      });
      planGroups.forEach((g) => {
        g.classList.toggle('is-hidden', g.dataset.plans !== mode);
      });
      // Reset selection to the first plan of the active group
      const activeGroup = document.querySelector(`.plans[data-plans="${mode}"]`);
      if (activeGroup) {
        const first = activeGroup.querySelector('.plan');
        activeGroup.querySelectorAll('.plan').forEach((p) => p.classList.remove('is-selected'));
        if (first) {
          first.classList.add('is-selected');
          const input = first.querySelector('input[type="radio"]');
          if (input) input.checked = true;
          state.plan = first.dataset.plan;
        }
      }
      renderAtc();
    });
  });

  // 4) Plan card selection -----------------------------------------
  document.querySelectorAll('.plan').forEach((p) => {
    p.addEventListener('click', () => {
      const group = p.closest('.plans');
      if (!group) return;
      group.querySelectorAll('.plan').forEach((x) => x.classList.remove('is-selected'));
      p.classList.add('is-selected');
      const input = p.querySelector('input[type="radio"]');
      if (input) input.checked = true;
      state.plan = p.dataset.plan;
      renderAtc();
    });
  });

  // 5) Add-to-cart price + mobile mirror ---------------------------
  const atcPrice = document.getElementById('atcPrice');
  const mbPrice = document.getElementById('mbPrice');
  function renderAtc() {
    const activeGroup = document.querySelector(`.plans[data-plans="${state.mode}"]`);
    if (!activeGroup) return;
    const selected = activeGroup.querySelector('.plan.is-selected .price-major');
    if (!selected) return;
    const label = state.mode === 'sub' && state.plan === 'sub-3'
      ? totalFor('sub-3')
      : priceOf(selected);
    if (atcPrice) atcPrice.textContent = label;
    if (mbPrice) mbPrice.textContent = label;
  }
  function totalFor(planId) {
    // For 3-month sub show billed total, not the /mo rate
    const el = document.querySelector(`.plan[data-plan="${planId}"] [data-eur-total]`);
    return el ? totalOf(el) : '';
  }

  // 6) Simple cart increment ---------------------------------------
  const cartCountEl = document.querySelector('.cart-count');
  const atcBtn = document.getElementById('addToCart');
  if (atcBtn && cartCountEl) {
    atcBtn.addEventListener('click', () => {
      const n = parseInt(cartCountEl.textContent, 10) || 0;
      cartCountEl.textContent = String(n + 1);
      atcBtn.style.background = 'var(--olive-2)';
      const original = atcBtn.querySelector('span').textContent;
      atcBtn.querySelector('span').textContent = 'Added';
      setTimeout(() => {
        atcBtn.style.background = '';
        atcBtn.querySelector('span').textContent = original;
      }, 1200);
    });
  }

  // 7) FAQ — one open at a time (nice touch) -----------------------
  const faqs = document.querySelectorAll('.faq-list details');
  faqs.forEach((d) => {
    d.addEventListener('toggle', () => {
      if (d.open) {
        faqs.forEach((o) => { if (o !== d) o.open = false; });
      }
    });
  });

  // Initial render
  renderPrices();
  renderAtc();
})();
