/* =========================================================
   Konar Studio — Lucia Pagano
   ---------------------------------------------------------
   Tiny, purposeful JS:
     1. Fade/slide-up reveals (IntersectionObserver, staggered)
     2. Scroll-through per project card — computes the exact
        pixel offset (image height - viewport height) so the
        hover reveal shows the full page, not just a slice.
     3. Custom cursor on non-touch, non-reduced-motion.
   ========================================================= */

(function () {
  'use strict';

  const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const isTouch        = window.matchMedia('(hover: none)').matches;

  /* ---------- 1. Reveal on scroll ---------- */
  const reveals = document.querySelectorAll('.reveal');

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

  /* ---------- 2. Card scroll-through ---------- */
  /*
     For each project card:
       - measure the natural size of the screenshot after it loads
       - compute how many pixels the image overflows the viewport
       - store as CSS variable --shift on the <img>
     CSS handles the actual transition on :hover.

     Under reduced motion, we don't set --shift, so the hover
     transform (translateY(0)) simply keeps the top of the image
     visible — no auto reveal.
  */
  const cards = document.querySelectorAll('.card');

  function measureCard(card) {
    const viewport = card.querySelector('.card__viewport');
    const img = card.querySelector('.card__shot');
    if (!viewport || !img) return;

    const vh = viewport.getBoundingClientRect().height;
    // The image is width:100% inside the viewport, so its rendered
    // height is naturalHeight * (viewport.width / naturalWidth)
    const vw = viewport.getBoundingClientRect().width;
    if (!img.naturalWidth || !img.naturalHeight || !vw || !vh) return;

    const renderedH = img.naturalHeight * (vw / img.naturalWidth);
    const overflow = Math.max(0, renderedH - vh);
    // negative — image translates UP to reveal the bottom
    img.style.setProperty('--shift', `-${Math.round(overflow)}px`);
  }

  function setupCard(card) {
    const img = card.querySelector('.card__shot');
    if (!img) return;
    if (prefersReduced) return; // leave --shift at 0
    if (img.complete && img.naturalWidth) {
      measureCard(card);
    } else {
      img.addEventListener('load', () => measureCard(card), { once: true });
    }
  }

  cards.forEach(setupCard);

  // Recompute on resize (viewport height changes with card width)
  let resizeTimer;
  window.addEventListener('resize', () => {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(() => cards.forEach(measureCard), 120);
  });

  /* ---------- 3. Custom cursor ---------- */
  const cursor = document.querySelector('.cursor');
  if (cursor && !isTouch && !prefersReduced) {
    let mouseX = 0, mouseY = 0;
    let curX  = 0, curY  = 0;
    let raf   = null;

    const activate = () => cursor.classList.add('is-active');

    window.addEventListener('mousemove', (e) => {
      mouseX = e.clientX;
      mouseY = e.clientY;
      if (!cursor.classList.contains('is-active')) activate();
      if (!raf) raf = requestAnimationFrame(tick);
    }, { passive:true });

    window.addEventListener('mouseleave', () => cursor.classList.remove('is-active'));
    window.addEventListener('blur', () => cursor.classList.remove('is-active'));

    function tick() {
      // small easing for a smoother feel
      curX += (mouseX - curX) * 0.28;
      curY += (mouseY - curY) * 0.28;
      cursor.style.transform = `translate3d(${curX}px, ${curY}px, 0)`;
      if (Math.abs(mouseX - curX) > 0.1 || Math.abs(mouseY - curY) > 0.1) {
        raf = requestAnimationFrame(tick);
      } else {
        raf = null;
      }
    }

    // Grow into "View" label over any card zone
    document.querySelectorAll('.card--cursor').forEach((el) => {
      el.addEventListener('mouseenter', () => cursor.classList.add('is-zone'));
      el.addEventListener('mouseleave', () => cursor.classList.remove('is-zone'));
    });
  }
})();
