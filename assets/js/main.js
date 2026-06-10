/* ============================================================
   main.js — language switching, theme, nav, reveal, charts
   ============================================================ */
(function () {
  const store = {
    get(k, d) { try { return localStorage.getItem(k) || d; } catch (e) { return d; } },
    set(k, v) { try { localStorage.setItem(k, v); } catch (e) {} }
  };

  /* ---------- i18n ---------- */
  const SUPPORTED = ['pt', 'en', 'es', 'fi', 'it', 'fr'];
  let lang = store.get('lang', '');
  if (!SUPPORTED.includes(lang)) {
    const nav = (navigator.language || 'pt').slice(0, 2).toLowerCase();
    lang = SUPPORTED.includes(nav) ? nav : 'pt';
  }

  function applyLang(l) {
    const dict = window.I18N[l] || window.I18N.en;
    document.documentElement.lang = l === 'pt' ? 'pt-BR' : l;
    document.querySelectorAll('[data-i18n]').forEach(el => {
      const k = el.getAttribute('data-i18n');
      if (dict[k] != null) el.textContent = dict[k];
    });
    document.querySelectorAll('[data-i18n-aria]').forEach(el => {
      const k = el.getAttribute('data-i18n-aria');
      if (dict[k] != null) el.setAttribute('aria-label', dict[k]);
    });
    const md = document.getElementById('modal');
    if (md && !md.hidden && md.dataset.tk) {
      const mt = document.getElementById('modalTitle'); const mb = document.getElementById('modalBody');
      if (mt) mt.textContent = dict[md.dataset.tk] || '';
      if (mb) mb.textContent = dict[md.dataset.bk] || '';
    }
    if (dict.docTitle) {
      const name = document.getElementById('brandName');
      const who = name ? name.textContent.trim() : '';
      document.title = (who ? who + ' · ' : '') + dict.docTitle;
    }
    document.querySelectorAll('.flag-btn').forEach(b =>
        b.classList.toggle('active', b.dataset.lang === l));
    lang = l; store.set('lang', l);
  }

  /* ---------- theme ---------- */
  function applyTheme(t) {
    document.documentElement.setAttribute('data-theme', t);
    store.set('theme', t);
    /* charts are SVG driven by CSS variables — they adapt to the theme live */
  }

  document.addEventListener('DOMContentLoaded', () => {
    /* theme init (default dark) */
    let theme = store.get('theme', 'dark');
    document.documentElement.setAttribute('data-theme', theme);

    /* language buttons */
    document.querySelectorAll('.flag-btn').forEach(btn => {
      btn.addEventListener('click', () => applyLang(btn.dataset.lang));
    });

    /* theme toggle */
    const tBtn = document.getElementById('themeBtn');
    if (tBtn) tBtn.addEventListener('click', () => {
      const cur = document.documentElement.getAttribute('data-theme');
      applyTheme(cur === 'light' ? 'dark' : 'light');
    });

    /* mobile menu */
    const menuBtn = document.getElementById('menuBtn');
    const links = document.getElementById('navLinks');
    if (menuBtn && links) {
      menuBtn.addEventListener('click', () => links.classList.toggle('open'));
      links.querySelectorAll('a').forEach(a => a.addEventListener('click', () => links.classList.remove('open')));
    }

    /* detail modal (interactive diagrams) */
    const modal = document.getElementById('modal');
    let lastTrigger = null;
    function openModal(tk, bk) {
      if (!modal) return;
      const dict = window.I18N[lang] || window.I18N.en;
      const t = document.getElementById('modalTitle'); const b = document.getElementById('modalBody');
      if (t) t.textContent = dict[tk] || '';
      if (b) b.textContent = dict[bk] || '';
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

    /* header shadow on scroll */
    const header = document.querySelector('header');
    const onScroll = () => header.classList.toggle('scrolled', window.scrollY > 8);
    window.addEventListener('scroll', onScroll, { passive: true }); onScroll();

    /* render charts then apply language (so chart-internal text—none translated—stays) */
    if (window.Charts) window.Charts.renderAll();
    applyLang(lang);

    /* reveal on scroll */
    const io = new IntersectionObserver((entries) => {
      entries.forEach(e => { if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); } });
    }, { threshold: 0.12 });
    document.querySelectorAll('.reveal').forEach(el => io.observe(el));
  });
})();