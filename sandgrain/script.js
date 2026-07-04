/* Sand & Grain — small interactivity layer */

// Year in footer
document.getElementById('yr').textContent = new Date().getFullYear();

// Header shrink + sticky CTA reveal on scroll
const header = document.getElementById('siteHeader');
const stickyCta = document.getElementById('stickyCta');
const heroHeight = () => document.querySelector('.hero').offsetHeight;

function onScroll(){
  const y = window.scrollY;
  header.classList.toggle('scrolled', y > 40);
  // Sticky CTA appears after user scrolls past the hero, hides near bottom (over the enquiry form)
  const enquireTop = document.getElementById('enquire').getBoundingClientRect().top + window.scrollY;
  const showCta = y > heroHeight() * 0.7 && y + window.innerHeight < enquireTop + 200;
  stickyCta.classList.toggle('visible', showCta);
}
window.addEventListener('scroll', onScroll, { passive: true });
onScroll();

// Mobile nav toggle
const navToggle = document.getElementById('navToggle');
const primaryNav = document.querySelector('.primary-nav');
navToggle.addEventListener('click', () => {
  const open = primaryNav.classList.toggle('open');
  navToggle.setAttribute('aria-expanded', String(open));
});
primaryNav.querySelectorAll('a').forEach(a => {
  a.addEventListener('click', () => {
    primaryNav.classList.remove('open');
    navToggle.setAttribute('aria-expanded', 'false');
  });
});

// Enquiry form — concept submit handler (no backend wired up yet)
const form = document.getElementById('enquireForm');
form.addEventListener('submit', (e) => {
  e.preventDefault();
  const name = form.querySelector('#f-name').value.trim();
  const email = form.querySelector('#f-email').value.trim();
  const looking = form.querySelector('#f-looking').value;
  if (!name || !email || !looking){
    alert('Please add your name, email and what you’re looking for so we can come back to you.');
    return;
  }
  // Placeholder: in production this should POST to a backend / form provider.
  form.innerHTML = `
    <div style="text-align:center;padding:24px 8px;">
      <div style="font-family:'Cormorant Garamond',serif;font-size:1.6rem;color:#23423a;margin-bottom:8px;">Thanks, ${name.split(' ')[0]}.</div>
      <p style="color:#6c6a64;margin:0;">We’ve got your enquiry and will reply within one working day.</p>
    </div>`;
});
