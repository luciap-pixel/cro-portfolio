/* =========================================================
   Konar Studio — Lucia Pagano
   ---------------------------------------------------------
   Small, purposeful JS:
     1. Line-mask reveal for [data-lm] headings
     2. Fade / slide-up reveals on .reveal
     3. Per-card scroll-through — computes overflow so hover
        smoothly translates through the whole full-page image
     4. Custom cursor + cursor-follow glow
     5. Magnetic buttons
   Everything degrades gracefully under prefers-reduced-motion
   and on touch devices (no cursor, no magnetic).
   ========================================================= */

(function () {
  'use strict';

  const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const isTouch        = window.matchMedia('(hover: none)').matches;

  /* =============================================================
     1. Line-mask reveal
     Each .lm__line is wrapped in an .lm__inner (overflow:hidden).
     Under reduced motion the CSS falls back to a simple fade.
  ============================================================= */
  document.querySelectorAll('[data-lm]').forEach((h) => {
    h.querySelectorAll('.lm__line').forEach((line, i) => {
      // Wrap line in an inner mask if not already wrapped
      if (!line.parentElement.classList.contains('lm__inner')) {
        const wrap = document.createElement('span');
        wrap.className = 'lm__inner';
        line.parentNode.insertBefore(wrap, line);
        wrap.appendChild(line);
      }
      // stagger
      line.style.setProperty('--lm-delay', String(i * 90));
    });
  });

  /* =============================================================
     2. Reveal on scroll
  ============================================================= */
  const reveals = document.querySelectorAll('.reveal, [data-lm]');

  if (prefersReduced || !('IntersectionObserver' in window)) {
    reveals.forEach((el) => el.classList.add('is-in'));
  } else {
    reveals.forEach((el) => {
      const d = el.getAttribute('data-delay');
      if (d) el.style.setProperty('--reveal-delay', d);
    });
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('is-in');
            io.unobserve(entry.target);
          }
        });
      },
      { root: null, rootMargin: '0px 0px -8% 0px', threshold: 0.12 }
    );
    reveals.forEach((el) => io.observe(el));
  }

  /* =============================================================
     3. Card scroll-through
     Measure the rendered image height inside each card's fixed
     4/3 viewport and set --shift so the hover transform reveals
     the whole image, no matter its length.
  ============================================================= */
  const cards = document.querySelectorAll('.card');

  function measureCard(card) {
    const viewport = card.querySelector('.card__viewport');
    const img = card.querySelector('.card__shot');
    if (!viewport || !img) return;

    const rect = viewport.getBoundingClientRect();
    if (!img.naturalWidth || !img.naturalHeight || !rect.width || !rect.height) return;

    // Image is width:100% inside the viewport, so rendered height:
    const renderedH = img.naturalHeight * (rect.width / img.naturalWidth);
    const overflow = Math.max(0, renderedH - rect.height);
    img.style.setProperty('--shift', `-${Math.round(overflow)}px`);
  }

  function setupCard(card) {
    const img = card.querySelector('.card__shot');
    if (!img) return;
    if (prefersReduced) return;
    if (img.complete && img.naturalWidth) {
      measureCard(card);
    } else {
      img.addEventListener('load', () => measureCard(card), { once: true });
    }
  }

  cards.forEach(setupCard);

  let resizeTimer;
  window.addEventListener('resize', () => {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(() => cards.forEach(measureCard), 120);
  });

  /* =============================================================
     4. Custom cursor + ambient cursor glow
  ============================================================= */
  const cursor = document.querySelector('.cursor');
  const ambient = document.querySelector('.ambient');
  const glow = document.getElementById('cursorGlow');

  const cursorEnabled = cursor && !isTouch && !prefersReduced;

  if (cursorEnabled) {
    let mouseX = 0, mouseY = 0;
    let curX = 0, curY = 0;
    let glowX = 0, glowY = 0;
    let raf = null;
    let heroBounds = null;

    function refreshHero() {
      const hero = document.querySelector('.hero');
      heroBounds = hero ? hero.getBoundingClientRect() : null;
    }
    refreshHero();
    window.addEventListener('resize', refreshHero);
    window.addEventListener('scroll', refreshHero, { passive: true });

    const activate = () => cursor.classList.add('is-active');

    window.addEventListener('mousemove', (e) => {
      mouseX = e.clientX;
      mouseY = e.clientY;
      if (!cursor.classList.contains('is-active')) activate();

      // Hero-only cursor glow
      if (ambient && glow) {
        const inHero = heroBounds && mouseY <= heroBounds.bottom + 200;
        if (inHero) ambient.classList.add('is-cursor');
        else ambient.classList.remove('is-cursor');
      }

      if (!raf) raf = requestAnimationFrame(tick);
    }, { passive: true });

    window.addEventListener('mouseleave', () => {
      cursor.classList.remove('is-active');
      if (ambient) ambient.classList.remove('is-cursor');
    });
    window.addEventListener('blur', () => cursor.classList.remove('is-active'));

    function tick() {
      curX += (mouseX - curX) * 0.30;
      curY += (mouseY - curY) * 0.30;
      cursor.style.transform = `translate3d(${curX}px, ${curY}px, 0)`;

      // Softer follow for the ambient glow
      glowX += (mouseX - glowX) * 0.08;
      glowY += (mouseY - glowY) * 0.08;
      if (glow) {
        glow.style.setProperty('--cx', glowX + 'px');
        glow.style.setProperty('--cy', glowY + 'px');
      }

      const done =
        Math.abs(mouseX - curX) < 0.1 &&
        Math.abs(mouseY - curY) < 0.1 &&
        Math.abs(mouseX - glowX) < 0.5 &&
        Math.abs(mouseY - glowY) < 0.5;
      raf = done ? null : requestAnimationFrame(tick);
    }

    document.querySelectorAll('.card--cursor').forEach((el) => {
      el.addEventListener('mouseenter', () => cursor.classList.add('is-zone'));
      el.addEventListener('mouseleave', () => cursor.classList.remove('is-zone'));
    });
  }

  /* =============================================================
     5. Magnetic buttons — gentle pull toward cursor
  ============================================================= */
  if (!isTouch && !prefersReduced) {
    const strength = 18; // max px offset
    document.querySelectorAll('.magnetic').forEach((btn) => {
      let raf = null;
      let tx = 0, ty = 0;
      let cx = 0, cy = 0;

      function loop() {
        cx += (tx - cx) * 0.18;
        cy += (ty - cy) * 0.18;
        btn.style.transform = `translate3d(${cx}px, ${cy}px, 0)`;
        if (Math.abs(tx - cx) > 0.05 || Math.abs(ty - cy) > 0.05) {
          raf = requestAnimationFrame(loop);
        } else {
          raf = null;
          if (tx === 0 && ty === 0) btn.style.transform = '';
        }
      }

      btn.addEventListener('mousemove', (e) => {
        const r = btn.getBoundingClientRect();
        const px = (e.clientX - (r.left + r.width  / 2)) / r.width;
        const py = (e.clientY - (r.top  + r.height / 2)) / r.height;
        tx = px * strength * 2;
        ty = py * strength * 2;
        if (!raf) raf = requestAnimationFrame(loop);
      });

      btn.addEventListener('mouseleave', () => {
        tx = 0; ty = 0;
        if (!raf) raf = requestAnimationFrame(loop);
      });
    });
  }
})();
