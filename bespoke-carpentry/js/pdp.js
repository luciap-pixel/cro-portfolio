/* Live Edge Table — PDP interactions
   Honest per-timber "From £X" base prices (Narrow / 120cm baseline).
*/
(function () {
  'use strict';

  const TIMBER_BASE_PRICE = {
    Tulipwood: 1380,
    Sapele: 1480,
    Beech: 1480,
    Ash: 1580,
    Iroko: 1580,
    Oak: 1870,
    Walnut: 2315
  };

  const fmt = (n) => '£' + n.toLocaleString('en-GB', { minimumFractionDigits: 0 });

  /* ---------- Gallery ---------- */
  function initGallery() {
    const main = document.querySelector('[data-gallery-main]');
    const thumbs = document.querySelectorAll('[data-gallery-thumb]');
    if (!main || !thumbs.length) return;

    thumbs.forEach((btn) => {
      btn.addEventListener('click', () => {
        const src = btn.dataset.src;
        const alt = btn.dataset.alt || main.alt;
        if (!src) return;
        main.style.opacity = '0';
        setTimeout(() => {
          main.src = src;
          main.alt = alt;
          main.style.opacity = '1';
        }, 100);
        thumbs.forEach((b) => b.classList.remove('is-active'));
        btn.classList.add('is-active');
      });
      btn.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          btn.click();
        }
      });
    });
  }

  /* ---------- Options + Price ---------- */
  function initOptions() {
    const groups = document.querySelectorAll('[data-option-group]');
    const priceEls = document.querySelectorAll('[data-price]');
    const priceMiniEl = document.querySelector('[data-price-mini]');
    const specTimber = document.querySelector('[data-spec-timber]');
    const specWidth = document.querySelector('[data-spec-width]');
    const specLength = document.querySelector('[data-spec-length]');
    const specLeg = document.querySelector('[data-spec-leg]');

    const state = {
      Timber: null,
      Width: null,
      Length: null,
      Leg: null
    };

    function updatePrice() {
      if (!priceEls.length) return;
      const timber = state.Timber;
      const base = timber && TIMBER_BASE_PRICE[timber];
      const label = base ? 'From ' + fmt(base) : 'From £1,380';
      priceEls.forEach((el) => { el.textContent = label; });
      if (priceMiniEl) priceMiniEl.textContent = label;
    }

    function updateSpec() {
      if (specTimber) specTimber.textContent = state.Timber || '—';
      if (specWidth) specWidth.textContent = state.Width || '—';
      if (specLength) specLength.textContent = state.Length || '—';
      if (specLeg) specLeg.textContent = state.Leg || '—';
    }

    function updateLabelValue(group) {
      const key = group.dataset.optionGroup;
      const valEl = group.querySelector('[data-selected]');
      if (valEl) valEl.textContent = state[key] || '';
    }

    groups.forEach((group) => {
      const key = group.dataset.optionGroup;
      const options = group.querySelectorAll('[data-value]');
      options.forEach((opt) => {
        opt.addEventListener('click', () => {
          const value = opt.dataset.value;
          options.forEach((p) => p.classList.remove('is-active'));
          opt.classList.add('is-active');
          state[key] = value;
          updateLabelValue(group);
          updatePrice();
          updateSpec();
        });
      });
      // Pre-select default if configured
      if (group.dataset.default) {
        const el = group.querySelector(`[data-value="${group.dataset.default}"]`);
        if (el) el.click();
      }
    });
  }

  /* ---------- Timber guide modal ---------- */
  function initTimberModal() {
    const openers = document.querySelectorAll('[data-open-timber]');
    const modal = document.querySelector('[data-modal]');
    if (!openers.length || !modal) return;
    const close = modal.querySelector('[data-close]');

    openers.forEach((opener) => {
      opener.addEventListener('click', (e) => {
        e.preventDefault();
        modal.classList.add('is-open');
        modal.setAttribute('aria-hidden', 'false');
      });
    });

    if (close) {
      close.addEventListener('click', () => {
        modal.classList.remove('is-open');
        modal.setAttribute('aria-hidden', 'true');
      });
    }
    modal.addEventListener('click', (e) => {
      if (e.target === modal) {
        modal.classList.remove('is-open');
        modal.setAttribute('aria-hidden', 'true');
      }
    });
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') {
        modal.classList.remove('is-open');
        modal.setAttribute('aria-hidden', 'true');
      }
    });
  }

  /* ---------- Sticky mobile buy bar ---------- */
  function initStickyBar() {
    const bar = document.querySelector('.sticky-mobile-bar');
    if (!bar) return;
    bar.classList.add('enabled');
  }

  document.addEventListener('DOMContentLoaded', () => {
    initGallery();
    initOptions();
    initTimberModal();
    initStickyBar();
  });
})();
