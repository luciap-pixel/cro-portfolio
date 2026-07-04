/* Woodchester — small editorial UI behaviours
   - sticky masthead shadow
   - scroll-reveal (respects prefers-reduced-motion)
   - sticky "Book a consultation" pill, hidden near the enquiry section
   - placeholder enquiry form (no backend)
*/
(function () {
  const masthead = document.getElementById('masthead');
  const burger   = document.getElementById('burger');
  const drawer   = document.getElementById('drawer');
  const sticky   = document.getElementById('sticky');
  const enquire  = document.getElementById('enquire');
  const form     = document.getElementById('enquireForm');
  const sent     = document.getElementById('formSent');

  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* Scroll-driven UI */
  const onScroll = () => {
    const y = window.scrollY;
    masthead.classList.toggle('is-scrolled', y > 8);

    if (sticky && enquire) {
      sticky.hidden = false;
      const enqTop = enquire.getBoundingClientRect().top + window.scrollY;
      const visible = y > window.innerHeight * 0.8 &&
                      (y + window.innerHeight) < (enqTop + 220);
      sticky.classList.toggle('is-visible', visible);
    }
  };
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  /* Restrained scroll-reveal */
  if (!reduced && 'IntersectionObserver' in window) {
    const io = new IntersectionObserver((entries) => {
      entries.forEach(en => {
        if (en.isIntersecting) {
          en.target.classList.add('is-in');
          io.unobserve(en.target);
        }
      });
    }, { rootMargin: '0px 0px -8% 0px', threshold: 0.08 });
    document.querySelectorAll('.reveal').forEach(el => io.observe(el));
  } else {
    document.querySelectorAll('.reveal').forEach(el => el.classList.add('is-in'));
  }

  /* Mobile drawer */
  if (burger && drawer) {
    burger.addEventListener('click', () => {
      const open = drawer.classList.toggle('is-open');
      drawer.hidden = !open;
      burger.setAttribute('aria-expanded', String(open));
    });
    drawer.querySelectorAll('a').forEach(a => {
      a.addEventListener('click', () => {
        drawer.classList.remove('is-open');
        drawer.hidden = true;
        burger.setAttribute('aria-expanded', 'false');
      });
    });
  }

  /* Placeholder form — no backend wired in this mockup */
  if (form) {
    form.addEventListener('submit', (e) => {
      e.preventDefault();
      const name  = form.querySelector('#f-name');
      const email = form.querySelector('#f-email');
      if (!name.value.trim() || !email.value.trim()) {
        (name.value.trim() ? email : name).focus();
        return;
      }
      form.querySelectorAll('input, textarea, button').forEach(el => el.disabled = true);
      if (sent) sent.hidden = false;
    });
  }
})();
