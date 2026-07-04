/* =========================================================
   Konar Studio — Lucia Pagano
   ---------------------------------------------------------
   Kept intentionally tiny:
     1. Fade-up reveal on scroll (IntersectionObserver)
     2. Respect prefers-reduced-motion
     3. Per-element stagger via data-delay
   Everything else (marquee, hover, glow, live dot) is CSS.
   ========================================================= */

(function () {
  'use strict';

  const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  const reveals = document.querySelectorAll('.reveal');

  // If the user prefers reduced motion, or the browser can't observe,
  // just show everything immediately — no animation.
  if (prefersReduced || !('IntersectionObserver' in window)) {
    reveals.forEach((el) => el.classList.add('is-in'));
    return;
  }

  // Per-element stagger (index.html sets data-delay="60" etc.)
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
    {
      root: null,
      rootMargin: '0px 0px -8% 0px',
      threshold: 0.12,
    }
  );

  reveals.forEach((el) => io.observe(el));
})();
