/* ============================================================
   bg.js — animated graph background (canvas)
   Slowly drifting nodes linked by proximity edges; a few accent
   "hub" nodes; the pointer gently pulls links towards it.
   Static frame when prefers-reduced-motion; paused when hidden.
   ============================================================ */
(function () {
  var canvas = document.getElementById('bgGraph');
  if (!canvas || !canvas.getContext) return;
  var ctx = canvas.getContext('2d');
  var reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var W = 0, H = 0, dpr = 1, nodes = [], colors = {}, mouse = { x: -9999, y: -9999 }, raf = null;
  var LINK = 150;

  function readColors() {
    var cs = getComputedStyle(document.documentElement);
    colors.node = cs.getPropertyValue('--text-faint').trim() || '#7f8a9e';
    colors.accent = cs.getPropertyValue('--accent').trim() || '#ff6a2b';
    colors.cyan = cs.getPropertyValue('--accent-2').trim() || '#38bdf8';
    colors.light = document.documentElement.getAttribute('data-theme') === 'light';
  }

  function hexA(hex, a) {
    var h = hex.replace('#', '');
    if (h.length === 3) h = h[0] + h[0] + h[1] + h[1] + h[2] + h[2];
    var n = parseInt(h, 16);
    return 'rgba(' + (n >> 16 & 255) + ',' + (n >> 8 & 255) + ',' + (n & 255) + ',' + a + ')';
  }

  function resize() {
    dpr = Math.min(window.devicePixelRatio || 1, 2);
    if (!W || !H) nodes = [];          /* first real size: scatter nodes across it */
    W = window.innerWidth; H = window.innerHeight;
    canvas.width = W * dpr; canvas.height = H * dpr;
    canvas.style.width = W + 'px'; canvas.style.height = H + 'px';
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    var target = Math.round(Math.min(110, Math.max(36, W * H / 15000)));
    while (nodes.length < target) nodes.push(make());
    nodes.length = target;
  }

  function make() {
    var r = Math.random(), hub = r > 0.93;
    return {
      x: Math.random() * W, y: Math.random() * H,
      vx: (Math.random() - 0.5) * 0.22, vy: (Math.random() - 0.5) * 0.22,
      r: hub ? 2.6 + Math.random() * 1.4 : 1.2 + Math.random() * 1.2,
      kind: hub ? (Math.random() > 0.5 ? 'accent' : 'cyan') : 'node',
      ph: Math.random() * Math.PI * 2
    };
  }

  function draw(t) {
    ctx.clearRect(0, 0, W, H);
    var base = colors.light ? 0.2 : 0.17;
    for (var i = 0; i < nodes.length; i++) {
      var a = nodes[i];
      for (var j = i + 1; j < nodes.length; j++) {
        var b = nodes[j], dx = a.x - b.x, dy = a.y - b.y, d2 = dx * dx + dy * dy;
        if (d2 > LINK * LINK) continue;
        var k = 1 - Math.sqrt(d2) / LINK;
        var hubLink = a.kind !== 'node' || b.kind !== 'node';
        ctx.strokeStyle = hexA(hubLink ? colors[a.kind !== 'node' ? a.kind : b.kind] : colors.node, k * (hubLink ? base * 2.2 : base * 1.6));
        ctx.lineWidth = hubLink ? 1 : 0.8;
        ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.lineTo(b.x, b.y); ctx.stroke();
      }
      var mdx = a.x - mouse.x, mdy = a.y - mouse.y, md = Math.sqrt(mdx * mdx + mdy * mdy);
      if (md < 190) {
        ctx.strokeStyle = hexA(colors.accent, (1 - md / 190) * 0.35);
        ctx.lineWidth = 1;
        ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.lineTo(mouse.x, mouse.y); ctx.stroke();
      }
    }
    for (var n = 0; n < nodes.length; n++) {
      var p = nodes[n], pulse = p.kind === 'node' ? 1 : 0.75 + 0.25 * Math.sin(t / 900 + p.ph);
      if (p.kind !== 'node') {
        ctx.fillStyle = hexA(colors[p.kind], 0.12 * pulse);
        ctx.beginPath(); ctx.arc(p.x, p.y, p.r * 4, 0, Math.PI * 2); ctx.fill();
      }
      ctx.fillStyle = hexA(p.kind === 'node' ? colors.node : colors[p.kind], p.kind === 'node' ? (colors.light ? 0.55 : 0.5) : 0.9);
      ctx.beginPath(); ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2); ctx.fill();
    }
  }

  function step(t) {
    for (var i = 0; i < nodes.length; i++) {
      var p = nodes[i];
      var dx = mouse.x - p.x, dy = mouse.y - p.y, d = Math.sqrt(dx * dx + dy * dy);
      if (d < 190 && d > 1) { p.vx += dx / d * 0.004; p.vy += dy / d * 0.004; }
      p.vx *= 0.995; p.vy *= 0.995;
      var sp = Math.sqrt(p.vx * p.vx + p.vy * p.vy);
      if (sp < 0.06) { p.vx += (Math.random() - 0.5) * 0.02; p.vy += (Math.random() - 0.5) * 0.02; }
      p.x += p.vx; p.y += p.vy;
      if (p.x < -20) p.x = W + 20; else if (p.x > W + 20) p.x = -20;
      if (p.y < -20) p.y = H + 20; else if (p.y > H + 20) p.y = -20;
    }
    draw(t);
    raf = requestAnimationFrame(step);
  }

  function start() { if (!raf && !reduce) raf = requestAnimationFrame(step); }
  function stop() { if (raf) cancelAnimationFrame(raf); raf = null; }

  readColors(); resize(); draw(0); start();
  window.addEventListener('resize', function () { resize(); if (reduce) draw(0); });
  window.addEventListener('pointermove', function (e) { mouse.x = e.clientX; mouse.y = e.clientY; }, { passive: true });
  document.addEventListener('pointerleave', function () { mouse.x = mouse.y = -9999; });
  document.addEventListener('visibilitychange', function () { if (document.hidden) stop(); else start(); });
  new MutationObserver(function () { readColors(); if (reduce) draw(0); })
      .observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] });
})();
