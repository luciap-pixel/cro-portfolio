(function () {
  'use strict';

  // ===== Gallery: WAI-ARIA tabs pattern =====
  const mainImage = document.getElementById('mainImage');
  const thumbs = Array.from(document.querySelectorAll('.thumb'));

  function fileFromPath(p) {
    return (p || '').split('/').pop();
  }

  function selectThumb(index, focus) {
    if (index < 0) index = thumbs.length - 1;
    if (index >= thumbs.length) index = 0;

    const target = thumbs[index];
    const src = target.getAttribute('data-src');
    if (!src || !mainImage) return;

    if (fileFromPath(mainImage.src) !== fileFromPath(src)) {
      mainImage.style.opacity = '0';
      const preload = new Image();
      preload.onload = () => {
        mainImage.src = src;
        mainImage.style.opacity = '1';
      };
      preload.src = src;
    }

    thumbs.forEach((t, i) => {
      const selected = i === index;
      t.setAttribute('aria-selected', selected ? 'true' : 'false');
      t.setAttribute('tabindex', selected ? '0' : '-1');
    });

    if (focus) target.focus();
  }

  thumbs.forEach((thumb, i) => {
    thumb.addEventListener('click', () => selectThumb(i, false));
    thumb.addEventListener('keydown', (e) => {
      switch (e.key) {
        case 'ArrowRight':
        case 'ArrowDown':
          e.preventDefault(); selectThumb(i + 1, true); break;
        case 'ArrowLeft':
        case 'ArrowUp':
          e.preventDefault(); selectThumb(i - 1, true); break;
        case 'Home':
          e.preventDefault(); selectThumb(0, true); break;
        case 'End':
          e.preventDefault(); selectThumb(thumbs.length - 1, true); break;
      }
    });
  });

  // ===== Mobile menu =====
  const menuToggle = document.getElementById('menuToggle');
  const mobileNav = document.getElementById('mobileNav');
  if (menuToggle && mobileNav) {
    menuToggle.addEventListener('click', () => {
      const isOpen = !mobileNav.hasAttribute('hidden');
      if (isOpen) {
        mobileNav.setAttribute('hidden', '');
        menuToggle.setAttribute('aria-expanded', 'false');
      } else {
        mobileNav.removeAttribute('hidden');
        menuToggle.setAttribute('aria-expanded', 'true');
      }
    });
  }

  // ===== CTA pulse feedback =====
  function pulseButton(btn, label) {
    if (!btn || btn.dataset.pulsing === 'true') return;
    const span = btn.querySelector('.cta-label, span') || btn;
    const original = span.textContent;
    span.textContent = label;
    btn.dataset.pulsing = 'true';
    btn.setAttribute('disabled', '');
    setTimeout(() => {
      span.textContent = original;
      btn.removeAttribute('disabled');
      btn.dataset.pulsing = 'false';
    }, 1600);
  }

  ['ctaPrimary', 'ctaSecondary'].forEach((id) => {
    const btn = document.getElementById(id);
    if (btn) btn.addEventListener('click', () => pulseButton(btn, 'Added — prototype'));
  });
  const stickyBtn = document.getElementById('stickyBtn');
  if (stickyBtn) stickyBtn.addEventListener('click', () => pulseButton(stickyBtn, 'Added'));

  // ===== Sticky CTA: show after scroll, hide when primary CTA is on screen =====
  const stickyCta = document.getElementById('stickyCta');
  const ctaPrimary = document.getElementById('ctaPrimary');
  if (stickyCta && ctaPrimary && 'IntersectionObserver' in window) {
    let ctaInView = false;
    let scrolledEnough = false;

    function updateSticky() {
      if (scrolledEnough && !ctaInView) stickyCta.classList.add('is-visible');
      else stickyCta.classList.remove('is-visible');
    }

    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => { ctaInView = entry.isIntersecting; });
        updateSticky();
      },
      { rootMargin: '0px 0px -20% 0px', threshold: 0 }
    );
    io.observe(ctaPrimary);

    window.addEventListener('scroll', () => {
      scrolledEnough = window.scrollY > 320;
      updateSticky();
    }, { passive: true });
  }

  // ===== Reveal on scroll =====
  const revealTargets = document.querySelectorAll(
    '.section-head, .box-card, .faq-item, .journey-points li, .strip-item, .final-cta__title'
  );
  revealTargets.forEach((el) => el.classList.add('reveal'));

  if ('IntersectionObserver' in window) {
    const revealIO = new IntersectionObserver(
      (entries, obs) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('is-visible');
            obs.unobserve(entry.target);
          }
        });
      },
      { rootMargin: '0px 0px -8% 0px', threshold: 0.05 }
    );
    revealTargets.forEach((el) => revealIO.observe(el));
  } else {
    revealTargets.forEach((el) => el.classList.add('is-visible'));
  }

  // ===== Newsletter form =====
  const newsletterForm = document.getElementById('newsletterForm');
  const newsletterInput = document.getElementById('newsletterEmail');
  const newsletterNote = document.getElementById('newsletterNote');
  if (newsletterForm && newsletterInput && newsletterNote) {
    newsletterForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const value = newsletterInput.value.trim();
      const valid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
      if (!valid) {
        newsletterNote.textContent = 'Please enter a valid email.';
        newsletterInput.focus();
        return;
      }
      newsletterNote.textContent = 'Thanks — you are on the list.';
      newsletterInput.value = '';
    });
  }

  // ===== Sticky header: scrolled state =====
  const siteHeader = document.querySelector('.site-header');
  if (siteHeader) {
    const setScrolled = () => {
      if (window.scrollY > 8) siteHeader.classList.add('is-scrolled');
      else siteHeader.classList.remove('is-scrolled');
    };
    setScrolled();
    window.addEventListener('scroll', setScrolled, { passive: true });
  }

  // ===== Year =====
  const yearEl = document.getElementById('year');
  if (yearEl) yearEl.textContent = String(new Date().getFullYear());

  // ===== FAQ — close other items when one opens =====
  const faqItems = document.querySelectorAll('.faq-item');
  faqItems.forEach((item) => {
    item.addEventListener('toggle', () => {
      if (item.open) {
        faqItems.forEach((other) => {
          if (other !== item && other.open) other.open = false;
        });
      }
    });
  });
})();
