/* ============================================================
   main.js — language switching, theme, nav, reveal, charts
   ============================================================ */
(function () {
  const store = {
    get(k, d) { try { return localStorage.getItem(k) || d; } catch (e) { return d; } },
    set(k, v) { try { localStorage.setItem(k, v); } catch (e) {} }
  };
  const reduceMotion = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ---------- i18n ---------- */
  const SUPPORTED = ['en', 'pt', 'es', 'fr', 'fi'];
  let lang = store.get('lang', '');
  if (!SUPPORTED.includes(lang)) {
    const nav = (navigator.language || 'en').slice(0, 2).toLowerCase();
    lang = SUPPORTED.includes(nav) ? nav : 'en';
  }

  function t(k) {
    const dict = window.I18N[lang] || window.I18N.en;
    return dict[k] != null ? dict[k] : (window.I18N.en[k] || '');
  }

  function applyLang(l) {
    lang = l;
    document.documentElement.lang = l === 'pt' ? 'pt-BR' : l;
    document.querySelectorAll('[data-i18n]').forEach(el => {
      const v = t(el.getAttribute('data-i18n'));
      if (v) el.textContent = v;
    });
    document.querySelectorAll('[data-i18n-aria]').forEach(el => {
      const v = t(el.getAttribute('data-i18n-aria'));
      if (v) el.setAttribute('aria-label', v);
    });
    const md = document.getElementById('modal');
    if (md && !md.hidden && md.dataset.tk) {
      document.getElementById('modalTitle').textContent = t(md.dataset.tk);
      document.getElementById('modalBody').textContent = t(md.dataset.bk);
    }
    document.querySelectorAll('[data-count][data-decimals]').forEach(el => {
      el.textContent = fmtNum(parseFloat(el.dataset.count), parseInt(el.dataset.decimals, 10));
    });
    document.title = 'João Vitor Dellaqua Pacheco · ' + t('docTitle');
    document.querySelectorAll('.lang-btn').forEach(b => {
      const on = b.dataset.lang === l;
      b.classList.toggle('active', on);
      b.setAttribute('aria-pressed', on ? 'true' : 'false');
    });
    store.set('lang', l);
  }

  /* ---------- theme ---------- */
  function applyTheme(th) {
    document.documentElement.setAttribute('data-theme', th);
    store.set('theme', th);
  }

  /* ---------- metric count-up ---------- */
  function fmtNum(v, dec) {
    return v.toLocaleString(document.documentElement.lang, { minimumFractionDigits: dec, maximumFractionDigits: dec });
  }
  function countUp(el) {
    const end = parseFloat(el.dataset.count);
    const dec = parseInt(el.dataset.decimals || '0', 10);
    if (reduceMotion || isNaN(end)) return;
    const dur = 1300, t0 = performance.now();
    const fmt = v => fmtNum(v, dec);
    function step(now) {
      const p = Math.min(1, (now - t0) / dur);
      const e = 1 - Math.pow(1 - p, 3);
      el.textContent = fmt(end * e);
      if (p < 1) requestAnimationFrame(step); else el.textContent = fmt(end);
    }
    requestAnimationFrame(step);
  }

  document.addEventListener('DOMContentLoaded', () => {
    /* theme: set before paint by the inline script in <head> */
    if (!document.documentElement.getAttribute('data-theme')) applyTheme('dark');

    document.querySelectorAll('.lang-btn').forEach(btn => {
      btn.addEventListener('click', () => applyLang(btn.dataset.lang));
    });

    const tBtn = document.getElementById('themeBtn');
    if (tBtn) tBtn.addEventListener('click', () => {
      const cur = document.documentElement.getAttribute('data-theme');
      applyTheme(cur === 'light' ? 'dark' : 'light');
    });

    /* mobile menu */
    const menuBtn = document.getElementById('menuBtn');
    const links = document.getElementById('navLinks');
    if (menuBtn && links) {
      const setOpen = open => { links.classList.toggle('open', open); menuBtn.setAttribute('aria-expanded', open ? 'true' : 'false'); };
      menuBtn.addEventListener('click', () => setOpen(!links.classList.contains('open')));
      links.querySelectorAll('a').forEach(a => a.addEventListener('click', () => setOpen(false)));
    }

    /* detail modal (interactive diagrams) */
    const modal = document.getElementById('modal');
    let lastTrigger = null;
    function openModal(tk, bk) {
      if (!modal) return;
      document.getElementById('modalTitle').textContent = t(tk);
      document.getElementById('modalBody').textContent = t(bk);
      modal.dataset.tk = tk; modal.dataset.bk = bk;
      modal.hidden = false;
      requestAnimationFrame(() => modal.classList.add('open'));
      const c = modal.querySelector('.modal-close'); if (c) c.focus();
    }
    function closeModal() {
      if (!modal || modal.hidden) return;
      modal.classList.remove('open');
      window.setTimeout(() => { modal.hidden = true; }, 200);
      if (lastTrigger && lastTrigger.focus) { try { lastTrigger.focus(); } catch (e) {} }
    }
    document.addEventListener('click', (e) => {
      const trg = e.target.closest && e.target.closest('[data-modal-title]');
      if (trg) { lastTrigger = trg; openModal(trg.getAttribute('data-modal-title'), trg.getAttribute('data-modal-body')); return; }
      if (e.target.closest && e.target.closest('[data-close]')) closeModal();
    });
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') { closeModal(); return; }
      if (e.key === 'Enter' || e.key === ' ' || e.key === 'Spacebar') {
        const trg = e.target.closest && e.target.closest('[data-modal-title]');
        if (trg) { e.preventDefault(); lastTrigger = trg; openModal(trg.getAttribute('data-modal-title'), trg.getAttribute('data-modal-body')); }
      }
    });

    /* copy email */
    const copyBtn = document.getElementById('copyEmail');
    const toast = document.getElementById('copyToast');
    if (copyBtn) copyBtn.addEventListener('click', () => {
      const email = 'joaovitordellpa@gmail.com';
      const done = () => { if (toast) { toast.textContent = t('copied'); setTimeout(() => { toast.textContent = ''; }, 2200); } };
      if (navigator.clipboard) navigator.clipboard.writeText(email).then(done, () => {});
    });

    /* year */
    const y = document.getElementById('year');
    if (y) y.textContent = new Date().getFullYear();

    /* header border + active nav link */
    const header = document.querySelector('header');
    const navAnchors = Array.from(document.querySelectorAll('.nav-links a'));
    const sections = navAnchors.map(a => document.querySelector(a.getAttribute('href'))).filter(Boolean);
    const onScroll = () => {
      header.classList.toggle('scrolled', window.scrollY > 8);
      const pos = window.scrollY + 120;
      let current = null;
      sections.forEach(s => { if (s.offsetTop <= pos) current = s.id; });
      navAnchors.forEach(a => a.classList.toggle('active', a.getAttribute('href') === '#' + current));
    };
    window.addEventListener('scroll', onScroll, { passive: true }); onScroll();

    if (window.Charts) {
      /* diagrams render lazily: translate their aria-labels as they appear */
      window.Charts.onRender = el => el.querySelectorAll('[data-i18n-aria]').forEach(n => {
        const v = t(n.getAttribute('data-i18n-aria')); if (v) n.setAttribute('aria-label', v);
      });
      window.Charts.renderAll();
    }
    applyLang(lang);

    /* reveal on scroll */
    const io = new IntersectionObserver((entries) => {
      entries.forEach(e => { if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); } });
    }, { threshold: 0.12 });
    document.querySelectorAll('.reveal').forEach(el => io.observe(el));

    /* count-up once the hero card is visible */
    const counters = document.querySelectorAll('[data-count]');
    const cio = new IntersectionObserver((entries) => {
      entries.forEach(e => { if (e.isIntersecting) { countUp(e.target); cio.unobserve(e.target); } });
    }, { threshold: 0.4 });
    counters.forEach(el => cio.observe(el));
  });
})();
