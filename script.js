/* =========================================================
   Konar Studio — Lucia Pagano
   ---------------------------------------------------------
   Modules (kept small and independent):
     1. Line-mask reveal for [data-lm] headings
     2. Fade / slide-up reveals on .reveal
     3. Per-card scroll-through (measures overflow → --shift)
     4. Draggable hero strip with momentum + auto-scroll idle
     5. Before/After slider (pointer + keyboard)
     6. Custom cursor + cursor-follow glow
     7. Magnetic buttons
   Everything degrades gracefully under prefers-reduced-motion
   and on touch devices.
   ========================================================= */

(function () {
  'use strict';

  const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const isTouch        = window.matchMedia('(hover: none)').matches;

  /* =============================================================
     1. Line-mask reveal
  ============================================================= */
  document.querySelectorAll('[data-lm]').forEach((h) => {
    h.querySelectorAll('.lm__line').forEach((line, i) => {
      if (!line.parentElement.classList.contains('lm__inner')) {
        const wrap = document.createElement('span');
        wrap.className = 'lm__inner';
        line.parentNode.insertBefore(wrap, line);
        wrap.appendChild(line);
      }
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
     3. Card scroll-through — measure per-card overflow so hover
     translateY reveals the whole tall screenshot.
  ============================================================= */
  const cards = document.querySelectorAll('.card');

  function measureCard(card) {
    const viewport = card.querySelector('.card__viewport');
    const img = card.querySelector('.card__shot');
    if (!viewport || !img) return;
    const rect = viewport.getBoundingClientRect();
    if (!img.naturalWidth || !img.naturalHeight || !rect.width || !rect.height) return;
    const renderedH = img.naturalHeight * (rect.width / img.naturalWidth);
    const overflow = Math.max(0, renderedH - rect.height);
    img.style.setProperty('--shift', `-${Math.round(overflow)}px`);
  }
  function setupCard(card) {
    const img = card.querySelector('.card__shot');
    if (!img || prefersReduced) return;
    if (img.complete && img.naturalWidth) measureCard(card);
    else img.addEventListener('load', () => measureCard(card), { once: true });
  }
  cards.forEach(setupCard);

  let resizeTimer;
  window.addEventListener('resize', () => {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(() => cards.forEach(measureCard), 120);
  });

  /* =============================================================
     4. Draggable hero project strip
     - Drags with pointer (mouse + touch), momentum on release
     - Auto-scrolls slowly when idle
     - Pauses on hover / drag
     - Uses a duplicated set + modulo so it loops seamlessly
  ============================================================= */
  (function initStrip() {
    const track = document.querySelector('[data-strip]');
    if (!track) return;

    let halfWidth = 0;       // width of one set (loop distance)
    let x = 0;               // current translateX
    let vel = 0;             // pixels per frame at 60fps
    const autoVel = -0.35;   // idle drift speed (px/frame)
    let dragging = false;
    let lastX = 0;
    let lastT = 0;
    let hovering = false;
    let raf = null;

    function measure() {
      halfWidth = track.scrollWidth / 2;
    }
    function apply() { track.style.transform = `translate3d(${x}px, 0, 0)`; }

    function normalize() {
      // keep x within [-halfWidth, 0]
      if (halfWidth <= 0) return;
      if (x <= -halfWidth) x += halfWidth;
      else if (x > 0) x -= halfWidth;
    }

    function tick() {
      if (!dragging) {
        if (Math.abs(vel) > 0.05) {
          x += vel;
          vel *= 0.94; // friction
        } else if (!hovering && !prefersReduced) {
          x += autoVel;
        }
        normalize();
        apply();
      }
      raf = requestAnimationFrame(tick);
    }

    // Setup
    const setup = () => {
      measure();
      if (raf) cancelAnimationFrame(raf);
      raf = requestAnimationFrame(tick);
    };
    // wait for images
    const imgs = track.querySelectorAll('img');
    let pending = imgs.length;
    if (!pending) setup();
    else imgs.forEach((im) => {
      if (im.complete) { if (--pending === 0) setup(); }
      else im.addEventListener('load', () => { if (--pending === 0) setup(); }, { once: true });
    });
    window.addEventListener('resize', () => setTimeout(measure, 100));

    // Pointer drag
    track.addEventListener('pointerdown', (e) => {
      dragging = true;
      track.classList.add('is-dragging');
      lastX = e.clientX;
      lastT = performance.now();
      vel = 0;
      track.setPointerCapture(e.pointerId);
    });
    track.addEventListener('pointermove', (e) => {
      if (!dragging) return;
      const dx = e.clientX - lastX;
      const now = performance.now();
      const dt = Math.max(1, now - lastT);
      vel = (dx / dt) * 16; // convert to px/frame @16ms
      x += dx;
      normalize();
      apply();
      lastX = e.clientX;
      lastT = now;
    });
    const endDrag = (e) => {
      if (!dragging) return;
      dragging = false;
      track.classList.remove('is-dragging');
      try { track.releasePointerCapture(e.pointerId); } catch {}
    };
    track.addEventListener('pointerup', endDrag);
    track.addEventListener('pointercancel', endDrag);
    track.addEventListener('pointerleave', endDrag);

    track.addEventListener('mouseenter', () => { hovering = true; });
    track.addEventListener('mouseleave', () => { hovering = false; });

    // Prevent native image drag
    track.querySelectorAll('img').forEach((im) => im.addEventListener('dragstart', (e) => e.preventDefault()));
  })();

  /* =============================================================
     5. Before / After slider
  ============================================================= */
  (function initBA() {
    const root = document.querySelector('[data-ba]');
    if (!root) return;

    const viewport = root.querySelector('.ba__viewport');
    const clip = root.querySelector('.ba__clip');
    const handle = root.querySelector('.ba__handle');
    const beforeImg = root.querySelector('.ba__img--before');
    const beforeSrc = root.dataset.before;

    // If "before" image failed to load, gracefully hide the whole slider
    function fail() {
      root.style.display = 'none';
      const section = document.getElementById('difference');
      if (section) section.style.display = 'none';
    }
    if (!beforeImg || !beforeSrc) return;
    beforeImg.addEventListener('error', fail);
    if (beforeImg.complete && beforeImg.naturalWidth === 0) fail();

    let pct = 50;
    let dragging = false;

    function set(p) {
      pct = Math.max(0, Math.min(100, p));
      clip.style.width = pct + '%';
      handle.style.left = pct + '%';
      handle.setAttribute('aria-valuenow', Math.round(pct));
    }
    set(50);

    function fromEvent(e) {
      const rect = viewport.getBoundingClientRect();
      const x = (e.clientX ?? (e.touches && e.touches[0].clientX)) - rect.left;
      set((x / rect.width) * 100);
    }

    handle.addEventListener('pointerdown', (e) => {
      dragging = true;
      handle.classList.add('is-dragging');
      handle.setPointerCapture(e.pointerId);
    });
    handle.addEventListener('pointermove', (e) => {
      if (!dragging) return;
      fromEvent(e);
    });
    const end = (e) => {
      dragging = false;
      handle.classList.remove('is-dragging');
      try { handle.releasePointerCapture(e.pointerId); } catch {}
    };
    handle.addEventListener('pointerup', end);
    handle.addEventListener('pointercancel', end);

    // Click anywhere in viewport to jump the handle
    viewport.addEventListener('pointerdown', (e) => {
      if (e.target.closest('.ba__handle')) return;
      fromEvent(e);
      // then start dragging as if the handle was grabbed
      dragging = true;
      handle.classList.add('is-dragging');
      const move = (ev) => fromEvent(ev);
      const up = () => {
        dragging = false;
        handle.classList.remove('is-dragging');
        window.removeEventListener('pointermove', move);
        window.removeEventListener('pointerup', up);
      };
      window.addEventListener('pointermove', move);
      window.addEventListener('pointerup', up);
    });

    // Keyboard support
    handle.addEventListener('keydown', (e) => {
      const step = e.shiftKey ? 10 : 2;
      if (e.key === 'ArrowLeft')  { e.preventDefault(); set(pct - step); }
      if (e.key === 'ArrowRight') { e.preventDefault(); set(pct + step); }
      if (e.key === 'Home')       { e.preventDefault(); set(0); }
      if (e.key === 'End')        { e.preventDefault(); set(100); }
    });
  })();

  /* =============================================================
     6. Custom cursor + ambient cursor glow
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

    const refreshHero = () => {
      const hero = document.querySelector('.hero');
      heroBounds = hero ? hero.getBoundingClientRect() : null;
    };
    refreshHero();
    window.addEventListener('resize', refreshHero);
    window.addEventListener('scroll', refreshHero, { passive: true });

    window.addEventListener('mousemove', (e) => {
      mouseX = e.clientX; mouseY = e.clientY;
      if (!cursor.classList.contains('is-active')) cursor.classList.add('is-active');
      if (ambient && glow) {
        const inHero = heroBounds && mouseY <= heroBounds.bottom + 200;
        ambient.classList.toggle('is-cursor', !!inHero);
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
     7. Magnetic buttons — gentle pull toward cursor
  ============================================================= */
  if (!isTouch && !prefersReduced) {
    const strength = 18;
    document.querySelectorAll('.magnetic').forEach((btn) => {
      let raf = null;
      let tx = 0, ty = 0, cx = 0, cy = 0;
      const loop = () => {
        cx += (tx - cx) * 0.18;
        cy += (ty - cy) * 0.18;
        btn.style.transform = `translate3d(${cx}px, ${cy}px, 0)`;
        if (Math.abs(tx - cx) > 0.05 || Math.abs(ty - cy) > 0.05) {
          raf = requestAnimationFrame(loop);
        } else {
          raf = null;
          if (tx === 0 && ty === 0) btn.style.transform = '';
        }
      };
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
