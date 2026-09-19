(function () {
  const header = document.querySelector('.site-header');
  const onScroll = () => header.classList.toggle('scrolled', window.scrollY > 8);
  onScroll(); addEventListener('scroll', onScroll, { passive: true });

  const menuBtn = document.querySelector('.menu-btn');
  const links = document.querySelector('.nav-links');
  menuBtn.addEventListener('click', () => {
    const open = links.classList.toggle('open');
    menuBtn.setAttribute('aria-expanded', open);
  });
  links.addEventListener('click', e => { if (e.target.tagName === 'A') links.classList.remove('open'); });

  // Scroll reveals
  const io = new IntersectionObserver(entries => {
    entries.forEach(en => { if (en.isIntersecting) { en.target.classList.add('in'); io.unobserve(en.target); } });
  }, { threshold: 0.12, rootMargin: '0px 0px -40px 0px' });
  document.querySelectorAll('.rv').forEach(el => io.observe(el));

  // Active nav
  const sections = [...document.querySelectorAll('main section[id]')];
  const navA = [...links.querySelectorAll('a')];
  const spy = new IntersectionObserver(entries => {
    entries.forEach(en => {
      if (en.isIntersecting) navA.forEach(a => a.classList.toggle('active', a.getAttribute('href') === '#' + en.target.id));
    });
  }, { rootMargin: '-40% 0px -55% 0px' });
  sections.forEach(s => spy.observe(s));

  // Language toggle
  const dict = window.I18N || {};
  // Snapshot the page's original English so toggling back from French restores it
  dict.en = dict.en || {};
  document.querySelectorAll('[data-i18n]').forEach(el => { if (!(el.dataset.i18n in dict.en)) dict.en[el.dataset.i18n] = el.innerHTML; });
  document.querySelectorAll('[data-i18n-ph]').forEach(el => { if (!(el.dataset.i18nPh in dict.en)) dict.en[el.dataset.i18nPh] = el.placeholder; });
  function setLang(lang) {
    document.documentElement.lang = lang;
    document.querySelectorAll('[data-i18n]').forEach(el => {
      const v = dict[lang] && dict[lang][el.dataset.i18n];
      if (v != null) el.innerHTML = v;
    });
    document.querySelectorAll('[data-i18n-ph]').forEach(el => {
      const v = dict[lang] && dict[lang][el.dataset.i18nPh];
      if (v != null) el.placeholder = v;
    });
    document.querySelectorAll('.lang button').forEach(b => b.setAttribute('aria-pressed', b.dataset.lang === lang));
    try { localStorage.setItem('od-lang', lang); } catch (e) {}
  }
  document.querySelectorAll('.lang button').forEach(b => b.addEventListener('click', () => setLang(b.dataset.lang)));
  let saved = null; try { saved = localStorage.getItem('od-lang'); } catch (e) {}
  if (saved === 'fr') setLang('fr');

  // Formspree submit
  const form = document.getElementById('contact-form');
  const status = document.getElementById('form-status');
  form.addEventListener('submit', async e => {
    e.preventDefault();
    const lang = document.documentElement.lang;
    if (form.action.includes('YOUR_FORM_ID')) {
      status.textContent = lang === 'fr' ? 'Configurez votre identifiant Formspree dans index.html.' : 'Set your Formspree form ID in index.html to enable submissions.';
      status.style.color = '#E66200'; return;
    }
    status.textContent = lang === 'fr' ? 'Envoi…' : 'Sending…'; status.style.color = '#555';
    try {
      const r = await fetch(form.action, { method: 'POST', body: new FormData(form), headers: { Accept: 'application/json' } });
      if (r.ok) { form.reset(); status.textContent = lang === 'fr' ? 'Merci — nous vous répondrons sous peu.' : 'Thank you — we will be in touch shortly.'; status.style.color = '#1a7f37'; }
      else throw new Error();
    } catch (err) {
      status.textContent = lang === 'fr' ? 'Une erreur est survenue. Écrivez-nous à info@olympicfoods.ca.' : 'Something went wrong. Please email info@olympicfoods.ca.'; status.style.color = '#c0392b';
    }
  });
})();
