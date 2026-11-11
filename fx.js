/* Olympic Distributors — interaction layer: kinetic type, parallax, cursor, tilt, sound, live content.
   Everything here is progressive enhancement: the page reads and works without it. */
(function () {
  const root = document.documentElement;
  const anim = root.classList.contains('anim');
  const fine = matchMedia('(hover:hover) and (pointer:fine)').matches;
  const $ = (s, c) => (c || document).querySelector(s);
  const $$ = (s, c) => [...(c || document).querySelectorAll(s)];
  const lang = () => (root.lang || 'en').slice(0, 2);
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));

  /* ---------- 1. Sound (off until the visitor turns it on) ---------- */
  const sound = (function () {
    const btn = $('.sound'); let ctx = null, on = false, last = 0;
    function blip(freq, dur, vol, type, when) {
      if (!on || !ctx) return;
      const t = ctx.currentTime + (when || 0), o = ctx.createOscillator(), g = ctx.createGain();
      o.type = type || 'sine'; o.frequency.setValueAtTime(freq, t);
      g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(vol, t + 0.008); g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
      o.connect(g); g.connect(ctx.destination); o.start(t); o.stop(t + dur + 0.02);
    }
    const api = {
      tick() { const n = performance.now(); if (n - last < 70) return; last = n; blip(1500, 0.045, 0.018, 'sine'); },
      pop() { blip(520, 0.09, 0.05, 'triangle'); blip(880, 0.07, 0.025, 'sine', 0.02); },
      blip() { blip(740, 0.08, 0.04, 'sine'); },
      chime() { blip(660, 0.18, 0.05, 'sine'); blip(990, 0.28, 0.05, 'sine', 0.12); }
    };
    if (!btn) return api;
    function set(v) {
      on = v; btn.setAttribute('aria-pressed', v);
      try { localStorage.setItem('od-sound', v ? '1' : '0'); } catch (e) {}
    }
    btn.addEventListener('click', () => {
      try {
        if (!ctx) ctx = new (window.AudioContext || window.webkitAudioContext)();
        if (ctx.state === 'suspended') ctx.resume();
      } catch (e) { return; }
      set(!on); if (on) api.chime();
    });
    document.addEventListener('pointerover', e => { if (on && e.target.closest && e.target.closest('a.btn,button,.nav-links a,.gl li')) api.tick(); });
    document.addEventListener('click', e => { if (on && e.target.closest && e.target.closest('a,button') && !e.target.closest('.sound')) api.pop(); });
    return api;
  })();
  window.__odSound = sound;

  /* ---------- 2. Kinetic type: headings split into words that rise from a mask ---------- */
  const HEADS = '.hero h1, main .h2, .chapter h2, main .h3';
  function split(el) {
    let n = 0;
    const seg = lang() === 'zh' && window.Intl && Intl.Segmenter ? new Intl.Segmenter('zh-Hant', { granularity: 'word' }) : null;
    const OPEN = /^[\(\[“"「『（«]+$/;
    (function walk(parent) {
      [...parent.childNodes].forEach(ch => {
        if (ch.nodeType === 3) {
          const toks = [];
          if (seg) {
            for (const s of seg.segment(ch.nodeValue)) {
              const prev = toks[toks.length - 1];
              if (/^\s+$/.test(s.segment)) toks.push({ sp: 1, t: s.segment });
              else if (prev && !prev.sp && (!s.isWordLike || OPEN.test(prev.t))) prev.t += s.segment;
              else toks.push({ t: s.segment });
            }
          } else ch.nodeValue.split(/(\s+)/).forEach(t => { if (t) toks.push(/^\s+$/.test(t) ? { sp: 1, t } : { t }); });
          const frag = document.createDocumentFragment();
          toks.forEach(k => {
            if (k.sp) { frag.appendChild(document.createTextNode(k.t)); return; }
            const w = document.createElement('span'), i = document.createElement('span');
            w.className = 'w'; i.style.setProperty('--w', n++); i.textContent = k.t; w.appendChild(i); frag.appendChild(w);
          });
          ch.replaceWith(frag);
        } else if (ch.nodeType === 1 && ch.tagName !== 'BR' && !ch.classList.contains('w')) walk(ch);
      });
    })(el);
    el.classList.add('kt');
    return n;
  }
  if (anim) {
    const heads = $$(HEADS);
    heads.forEach(split);
    const hio = new IntersectionObserver(es => es.forEach(en => {
      if (!en.isIntersecting) return;
      const el = en.target; hio.unobserve(el); el.classList.add('in');
      setTimeout(() => el.classList.add('sdone'), $$('.w', el).length * 45 + 1100);
    }), { threshold: 0.2 });
    requestAnimationFrame(() => heads.forEach(h => hio.observe(h)));
    document.addEventListener('od:lang', () => heads.forEach(split));
  }

  /* ---------- 3. Cursor follower, magnetic buttons, click ripple ---------- */
  let mx = innerWidth / 2, my = innerHeight / 2, nx = 0, ny = 0;   // nx, ny: pointer as -1..1 across the viewport
  addEventListener('pointermove', e => { mx = e.clientX; my = e.clientY; nx = mx / innerWidth * 2 - 1; ny = my / innerHeight * 2 - 1; }, { passive: true });
  let cur = null, cx = mx, cy = my;
  if (anim && fine) {
    cur = document.createElement('div'); cur.className = 'cur'; cur.setAttribute('aria-hidden', 'true'); document.body.appendChild(cur);
    document.addEventListener('pointerover', e => {
      const t = e.target; if (!t.closest) return;
      cur.classList.add('on');
      cur.classList.toggle('drag', !!t.closest('#globe'));
      cur.classList.toggle('big', !!t.closest('a,button,.gl li,.tl,select,input,textarea,label'));
    });
    document.addEventListener('pointerleave', () => cur.classList.remove('on'));
    root.addEventListener('mouseleave', () => cur.classList.remove('on'));
    $$('.btn').forEach(b => {
      b.addEventListener('pointermove', e => {
        const r = b.getBoundingClientRect();
        b.style.translate = ((e.clientX - r.left - r.width / 2) * 0.22).toFixed(1) + 'px ' + ((e.clientY - r.top - r.height / 2) * 0.3).toFixed(1) + 'px';
      });
      b.addEventListener('pointerleave', () => { b.style.translate = ''; });
    });
  }
  if (anim) document.addEventListener('pointerdown', e => {
    const b = e.target.closest && e.target.closest('.btn,.filters button,.roles button'); if (!b) return;
    const r = b.getBoundingClientRect(), s = document.createElement('span'), d = Math.max(r.width, r.height) * 2;
    s.className = 'rip'; s.style.cssText = 'width:' + d + 'px;height:' + d + 'px;left:' + (e.clientX - r.left - d / 2) + 'px;top:' + (e.clientY - r.top - d / 2) + 'px';
    b.appendChild(s); s.addEventListener('animationend', () => s.remove());
  });

  /* ---------- 4. 3D tilt on cards ---------- */
  if (anim && fine) $$('.stat,.road,.pf,.viz,.card,.cta-band .g2>div,.icards li').forEach(el => {
    el.addEventListener('pointermove', e => {
      const host = el.closest('.seq'); if ((host && !host.classList.contains('done')) || (el.classList.contains('rv') && !el.classList.contains('in'))) return;
      const r = el.getBoundingClientRect(), px = (e.clientX - r.left) / r.width - 0.5, py = (e.clientY - r.top) / r.height - 0.5;
      el.classList.add('tilt');
      el.style.transform = 'perspective(900px) rotateX(' + (-py * 7).toFixed(2) + 'deg) rotateY(' + (px * 7).toFixed(2) + 'deg)';
      el.style.setProperty('--gx', ((px + 0.5) * 100).toFixed(0) + '%'); el.style.setProperty('--gy', ((py + 0.5) * 100).toFixed(0) + '%');
    });
    el.addEventListener('pointerleave', () => { el.style.transform = ''; });
  });

  /* ---------- 5. Parallax, scroll-reactive ticker, one shared frame loop ---------- */
  const heroCopy = $('.hero-copy'), heroMap = $('.hero-map'), heroEl = $('.hero');
  const shapes = $$('.shapes i').map(el => ({ el, d: +el.dataset.depth || 0.5, x: 0, y: 0 }));
  const ghosts = $$('.ghost').map(el => ({ el, k: +el.dataset.px || 0.1 }));
  const darks = $$('.section.dark');
  const marq = $('.marquee'), track = marq && $('.track', marq);
  let half = 0, tx = 0, lastY = scrollY, vel = 0, lastT = performance.now(), sx = 0, sy = 0, dirty = true;
  if (anim && marq) { marq.classList.add('js-marq'); const m = () => { half = track.scrollWidth / 2; }; m(); addEventListener('resize', m); document.addEventListener('od:lang', () => requestAnimationFrame(m)); if (document.fonts && document.fonts.ready) document.fonts.ready.then(m); }
  addEventListener('scroll', () => { dirty = true; }, { passive: true });
  addEventListener('resize', () => { dirty = true; });
  function frame(now) {
    const dt = Math.min(64, now - lastT); lastT = now;
    const y = scrollY, dy = y - lastY; lastY = y;
    vel += (dy - vel) * 0.2;
    // ticker: steady drift, pushed along (or back) by scrolling
    if (track && half) {
      tx -= dt * 0.045 + vel * 0.9;
      tx = ((tx % half) - half) % half;
      track.style.transform = 'translate3d(' + tx.toFixed(1) + 'px,0,0) skewX(' + clamp(vel * -0.25, -8, 8).toFixed(2) + 'deg)';
    }
    // cursor ring eases after the pointer
    if (cur) { cx += (mx - cx) * 0.2; cy += (my - cy) * 0.2; cur.style.transform = 'translate3d(' + cx.toFixed(1) + 'px,' + cy.toFixed(1) + 'px,0)'; }
    // hero layers: floating shapes follow scroll and pointer at different depths
    sx += (nx - sx) * 0.06; sy += (ny - sy) * 0.06;
    if (heroEl && y < heroEl.offsetHeight + 200) {
      shapes.forEach(s => { s.el.style.translate = (-sx * 26 * s.d).toFixed(1) + 'px ' + (-sy * 20 * s.d + y * 0.35 * s.d).toFixed(1) + 'px'; });
      if (dirty) {
        if (heroCopy) heroCopy.style.translate = '0 ' + (y * 0.14).toFixed(1) + 'px';
        if (heroMap) heroMap.style.translate = '0 ' + (y * 0.06).toFixed(1) + 'px';
      }
    }
    if (dirty) {
      const vh = innerHeight;
      ghosts.forEach(g => { const r = g.el.parentElement.getBoundingClientRect(); if (r.bottom < -200 || r.top > vh + 200) return; g.el.style.translate = ((r.top + r.height / 2 - vh / 2) * g.k).toFixed(1) + 'px 0'; });
      darks.forEach(d => { const r = d.getBoundingClientRect(); if (r.bottom < 0 || r.top > vh) return; d.style.setProperty('--by', (r.top * -0.18).toFixed(1) + 'px'); });
      dirty = false;
    }
    requestAnimationFrame(frame);
  }
  if (anim) requestAnimationFrame(frame);

  /* ---------- 6. Live & reactive content ---------- */
  // 6a. Banner filter on the listings wall
  const filt = $('.filters'), cust = $('#customers');
  function replay(el) {
    if (!anim) return;
    el.classList.remove('in', 'done'); void el.offsetWidth; el.classList.add('in');
    setTimeout(() => el.classList.add('done'), el.children.length * 45 + 900);
  }
  if (filt && cust) filt.addEventListener('click', e => {
    const b = e.target.closest('button'); if (!b) return;
    const f = b.dataset.f;
    $$('button', filt).forEach(x => x.setAttribute('aria-pressed', x === b));
    cust.classList.toggle('filtered', f !== 'all');
    $$('.lgroup', cust).forEach(g => {
      const show = f === 'all' || g.dataset.g === f;
      g.classList.toggle('gone', !show);
      if (show) { g.classList.add('in'); replay($('.logos', g)); }
    });
    sound.blip();
  });

  // 6b. Milestones: the big background year follows the milestone under the pointer or focus
  const gy = $('#ghost-year'), tls = $$('.timeline .tl');
  if (gy && tls.length) {
    let shown = 1949, raf = 0;
    function to(target) {
      cancelAnimationFrame(raf);
      if (!anim) { gy.textContent = shown = target; return; }
      const from = shown, t0 = performance.now();
      (function step(t) {
        const p = Math.min(1, (t - t0) / 500), e = 1 - Math.pow(1 - p, 3);
        shown = Math.round(from + (target - from) * e); gy.textContent = shown;
        if (p < 1) raf = requestAnimationFrame(step);
      })(t0);
    }
    function act(li) { tls.forEach(x => x.classList.toggle('act', x === li)); to(+li.dataset.year); }
    tls.forEach(li => { ['pointerenter', 'focus', 'click'].forEach(ev => li.addEventListener(ev, () => act(li))); });
    tls[0].classList.add('act');
  }

  // 6c. Contact: role chips drive the hidden select and a contextual note
  const roles = $('.roles'), sel = $('select[name="type"]'), hint = $('.role-hint');
  if (roles && sel) roles.addEventListener('click', e => {
    const b = e.target.closest('button'); if (!b) return;
    $$('button', roles).forEach(x => x.setAttribute('aria-pressed', x === b));
    sel.selectedIndex = +b.dataset.i;
    if (hint) hint.hidden = b.dataset.role !== 'supplier';
    sound.blip();
  });

  // 6d. Live local time at the Burnaby office
  const clock = $('#local-time');
  if (clock) {
    const LOC = { en: 'en-CA', fr: 'fr-CA', zh: 'zh-Hant-HK' };
    const paint = () => {
      try { clock.textContent = new Intl.DateTimeFormat(LOC[lang()] || 'en-CA', { timeZone: 'America/Vancouver', weekday: 'short', hour: 'numeric', minute: '2-digit' }).format(new Date()); }
      catch (e) { clock.parentElement.hidden = true; }
    };
    paint(); setInterval(paint, 15000); document.addEventListener('od:lang', paint);
  }

  /* ---------- 7. Rolodex: partner brands flip past, none on show for more than two seconds ---------- */
  const rolodex = $('#rolodex');
  if (rolodex) {
    let list = []; try { list = JSON.parse(rolodex.dataset.brands); } catch (e) {}
    const slots = $$('.rolo', rolodex), HOLD = 1800;   // ms each logo stays up
    list.forEach(b => { const im = new Image(); im.src = b[0]; });
    slots.forEach((slot, k) => {
      const mine = list.filter((_, i) => i % slots.length === k); if (mine.length < 2) return;
      const flip = $('.flip', slot), faces = [$('.a img', slot), $('.b img', slot)];
      let idx = 0, turns = 0;
      const next = () => {
        idx = (idx + 1) % mine.length; turns++;
        const face = faces[turns % 2]; face.src = mine[idx][0]; face.alt = mine[idx][1];
        flip.style.transform = 'rotateX(' + (-180 * turns) + 'deg)';
      };
      setTimeout(() => { next(); setInterval(next, HOLD); }, 500 + k * 400);
    });
  }

  /* ---------- 8. Dynamic graphs: replay on every visit and hover, and answer the pointer ---------- */
  const count = el => { if (window.__odCount) window.__odCount(el); };
  function regraph(el) {
    el.classList.add('snap'); el.classList.remove('go'); void el.offsetWidth;
    el.classList.remove('snap'); el.classList.add('go'); $$('[data-count]', el).forEach(count);
  }
  const graphs = $$('.viz,.netviz');
  if (graphs.length) {
    const gio = new IntersectionObserver(es => es.forEach(en => {
      const el = en.target;
      if (!en.isIntersecting) { el.classList.remove('go', 'ready'); return; }
      if (!el.classList.contains('go')) { el.classList.add('go'); $$('[data-count]', el).forEach(count); }
      if (el.classList.contains('netviz')) setTimeout(() => el.classList.add('ready'), 2600);
    }), { threshold: 0 });
    graphs.forEach(el => gio.observe(el));
    $$('.viz').forEach(el => {
      if ($('.dots', el)) return;   // the store-dot tile answers the pointer dot by dot instead
      el.addEventListener('pointerenter', e => { if (e.pointerType === 'mouse') regraph(el); });
      el.addEventListener('click', () => regraph(el));
    });
  }
  // store dots: point at a dot to count up to it
  const dotsEl = $('.dots');
  if (dotsEl) {
    const num = $('.n', dotsEl.closest('.viz')), kids = () => [...dotsEl.children];
    kids().forEach(d => d.style.setProperty('--d', (Math.random() * 2.8).toFixed(2) + 's'));
    dotsEl.addEventListener('pointerover', e => {
      const i = kids().indexOf(e.target); if (i < 0) return;
      num._ct = (num._ct || 0) + 1;
      kids().forEach((d, j) => d.classList.toggle('dim', j > i));
      num.textContent = '~' + ((i + 1) * 1000).toLocaleString('en-CA');
    });
    dotsEl.addEventListener('pointerleave', () => {
      kids().forEach(d => d.classList.remove('dim'));
      num._ct = (num._ct || 0) + 1; num.textContent = num.dataset.final || '~28,000';
    });
  }
  // network bar: hover or focus a segment or legend line to isolate it
  const net = $('.netviz');
  if (net) {
    const big = $('.net-total .n', net), lab = $('.net-total .l', net);
    const VAL = { a: [4800, '+'], b: [959, ''], c: [300, '+'] }, BASE = [5700, '+'];
    let shown = 5700, raf = 0, base = null;
    function hot(k) {
      if ((net.dataset.hot || '') === (k || '')) return;
      net.dataset.hot = k || '';
      const [target, suf] = k ? VAL[k] : BASE, from = shown, t0 = performance.now();
      big._ct = (big._ct || 0) + 1; cancelAnimationFrame(raf);
      if (k) { if (base == null) base = lab.innerHTML; lab.innerHTML = $('li[data-k="' + k + '"] span', net).innerHTML; }
      else if (base != null) { lab.innerHTML = base; base = null; }
      (function step(t) {
        const p = anim ? Math.min(1, (t - t0) / 450) : 1, e = 1 - Math.pow(1 - p, 3);
        shown = Math.round(from + (target - from) * e);
        big.textContent = shown.toLocaleString('en-CA') + (p === 1 ? suf : '');
        if (p < 1) raf = requestAnimationFrame(step);
      })(t0);
      if (k) sound.tick();
    }
    net.addEventListener('pointerover', e => { const t = e.target.closest('[data-k]'); hot(t ? t.dataset.k : null); });
    net.addEventListener('pointerleave', () => hot(null));
    net.addEventListener('focusin', e => { const t = e.target.closest('[data-k]'); if (t) hot(t.dataset.k); });
    net.addEventListener('focusout', () => hot(null));
    document.addEventListener('od:lang', () => { base = null; net.dataset.hot = ''; shown = 5700; big.textContent = big.dataset.final || '5,700+'; });
  }

  // 6e. A sent form gets a small celebration
  const status = $('#form-status');
  if (status) new MutationObserver(() => { if (status.style.color === 'rgb(26, 127, 55)') { status.classList.remove('yay'); void status.offsetWidth; status.classList.add('yay'); sound.chime(); } }).observe(status, { childList: true });
})();
