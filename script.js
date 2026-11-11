(function () {
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;

  const header = document.querySelector('.site-header');
  const bar = document.querySelector('.progress'), toTop = document.querySelector('.totop');
  const onScroll = () => {
    const y = window.scrollY, max = document.documentElement.scrollHeight - innerHeight;
    header.classList.toggle('scrolled', y > 8);
    if (bar) bar.style.transform = 'scaleX(' + (max > 0 ? Math.min(1, y / max) : 0) + ')';
    if (toTop) toTop.classList.toggle('show', y > innerHeight * 0.9);
  };
  onScroll(); addEventListener('scroll', onScroll, { passive: true });

  const menuBtn = document.querySelector('.menu-btn');
  const links = document.querySelector('.nav-links');
  menuBtn.addEventListener('click', () => {
    const open = links.classList.toggle('open');
    menuBtn.setAttribute('aria-expanded', open);
  });
  links.addEventListener('click', e => {
    if (e.target.tagName === 'A') { links.classList.remove('open'); menuBtn.setAttribute('aria-expanded', false); }
  });

  // Infographic pictograms
  const dots = document.querySelector('.dots');
  if (dots) dots.innerHTML = Array.from({ length: 28 }, (_, i) => '<i style="--i:' + i + '"></i>').join('');
  document.querySelectorAll('.ppl .row').forEach(r => {
    r.innerHTML = Array.from({ length: 10 }, (_, i) => '<svg viewBox="0 0 12 20" style="--i:' + i + '"><use href="#i-person"/></svg>').join('');
  });

  // Count-up numbers
  const fmt = n => n.toLocaleString('en-CA');
  function countUp(el) {
    const target = +el.dataset.count, prefix = el.dataset.prefix || '', suffix = el.dataset.suffix || '';
    const final = el.dataset.final || (el.dataset.final = el.textContent), token = el._ct = (el._ct || 0) + 1;
    if (reduce || !target) { el.textContent = final; return; }
    const t0 = performance.now(), dur = 1100;
    (function tick(t) {
      if (el._ct !== token) return;
      const p = Math.min(1, (t - t0) / dur), e = 1 - Math.pow(1 - p, 3);
      el.textContent = p < 1 ? prefix + fmt(Math.round(target * e)) + suffix : final;
      if (p < 1) requestAnimationFrame(tick);
    })(t0);
  }
  window.__odCount = countUp;
  const cio = new IntersectionObserver(entries => {
    entries.forEach(en => { if (en.isIntersecting) { countUp(en.target); cio.unobserve(en.target); } });
  }, { threshold: 0.6 });
  document.querySelectorAll('[data-count]').forEach(el => cio.observe(el));

  // Scroll reveals
  const io = new IntersectionObserver(entries => {
    entries.forEach(en => { if (en.isIntersecting) { en.target.classList.add('in', 'go'); io.unobserve(en.target); } });
  }, { threshold: 0.12, rootMargin: '0px 0px -40px 0px' });
  document.querySelectorAll('.rv, .sec-head').forEach(el => io.observe(el));

  // Staggered groups: children animate in sequence, then hand back to normal hover transitions
  const sio = new IntersectionObserver(entries => {
    entries.forEach(en => {
      if (!en.isIntersecting) return;
      const el = en.target, n = el.children.length, step = parseFloat(getComputedStyle(el).getPropertyValue('--step')) || 90;
      el.classList.add('in'); sio.unobserve(el);
      setTimeout(() => el.classList.add('done'), n * step + 900);
    });
  }, { threshold: 0.05, rootMargin: '0px 0px -8% 0px' });
  document.querySelectorAll('.seq').forEach(el => {
    [...el.children].forEach((c, i) => c.style.setProperty('--i', i));
    sio.observe(el);
  });

  // Active nav
  const sections = [...document.querySelectorAll('main section[id]')];
  const navA = [...links.querySelectorAll('a')];
  const spy = new IntersectionObserver(entries => {
    entries.forEach(en => {
      if (en.isIntersecting) navA.forEach(a => a.classList.toggle('active', a.getAttribute('href') === '#' + en.target.id));
    });
  }, { rootMargin: '-40% 0px -55% 0px' });
  sections.forEach(s => spy.observe(s));

  // Language toggle (EN / FR / 繁體中文)
  const dict = window.I18N || {};
  const HTML_LANG = { en: 'en', fr: 'fr', zh: 'zh-Hant' };
  // Snapshot the page's original English so toggling back restores it
  dict.en = dict.en || {};
  document.querySelectorAll('[data-i18n]').forEach(el => { if (!(el.dataset.i18n in dict.en)) dict.en[el.dataset.i18n] = el.innerHTML; });
  let current = 'en';
  function setLang(lang) {
    if (!HTML_LANG[lang]) lang = 'en';
    current = lang;
    document.documentElement.lang = HTML_LANG[lang];
    document.querySelectorAll('[data-i18n]').forEach(el => {
      const v = (dict[lang] && dict[lang][el.dataset.i18n]) ?? dict.en[el.dataset.i18n];
      if (v != null) el.innerHTML = v;
    });
    document.querySelectorAll('.lang button').forEach(b => b.setAttribute('aria-pressed', b.dataset.lang === lang));
    try { localStorage.setItem('od-lang', lang); } catch (e) {}
    document.dispatchEvent(new CustomEvent('od:lang', { detail: lang }));
  }
  document.querySelectorAll('.lang button').forEach(b => b.addEventListener('click', () => setLang(b.dataset.lang)));
  let saved = null; try { saved = localStorage.getItem('od-lang'); } catch (e) {}
  if (saved && saved !== 'en') setLang(saved);

  // Formspree submit
  const MSG = {
    en: { sending: 'Sending…', ok: 'Thank you — we will be in touch shortly.', err: 'Something went wrong. Please email info@olympicfoods.ca.' },
    fr: { sending: 'Envoi…', ok: 'Merci — nous vous répondrons sous peu.', err: 'Une erreur est survenue. Écrivez-nous à info@olympicfoods.ca.' },
    zh: { sending: '傳送中…', ok: '感謝您的來信，我們會盡快與您聯絡。', err: '傳送失敗，請電郵至 info@olympicfoods.ca。' }
  };
  const form = document.getElementById('contact-form');
  const status = document.getElementById('form-status');
  form.addEventListener('submit', async e => {
    e.preventDefault();
    const m = MSG[current] || MSG.en;
    status.textContent = m.sending; status.style.color = '#555';
    try {
      const r = await fetch(form.action, { method: 'POST', body: new FormData(form), headers: { Accept: 'application/json' } });
      if (r.ok) { form.reset(); const rb = document.querySelector('.roles button'); if (rb) rb.click(); status.textContent = m.ok; status.style.color = '#1a7f37'; }
      else throw new Error();
    } catch (err) {
      status.textContent = m.err; status.style.color = '#c0392b';
    }
  });
})();
