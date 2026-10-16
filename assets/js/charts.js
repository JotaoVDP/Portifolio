/* ============================================================
   charts.js — SVG charts & architecture diagrams (zero deps)
   · every colour comes from CSS variables → live light/dark
   · diagrams re-layout vertically on narrow containers
   · hover: elements with .hv dim their siblings (styles.css)
   · nodes with data-modal-* open the detail modal (main.js)
   ============================================================ */
(function () {
  'use strict';

  var C = {
    accent: 'var(--accent)', accent2: 'var(--accent-2)', gold: 'var(--gold)',
    silver: 'var(--silver)', bronze: 'var(--bronze)', ok: 'var(--ok)',
    text: 'var(--text)', dim: 'var(--text-dim)', faint: 'var(--text-faint)',
    grid: 'var(--border)', grid2: 'var(--border-2)', surface: 'var(--surface)',
    surface2: 'var(--surface-2)', bg2: 'var(--bg-2)'
  };
  var BODY = 'var(--font-body)', HEAD = 'var(--font-head)';

  /* ---------- primitives ---------- */
  function rr(n) { return Math.round(n * 100) / 100; }
  function svg(w, h, body, cls) {
    return '<svg viewBox="0 0 ' + w + ' ' + h + '" width="' + w + '" height="' + h + '"' +
        ' style="width:100%;height:auto;display:block"' + (cls ? ' class="' + cls + '"' : '') +
        ' xmlns="http://www.w3.org/2000/svg" font-family="var(--font-mono)" role="img">' + body + '</svg>';
  }
  function txt(x, y, s, o) {
    o = o || {};
    return '<text x="' + rr(x) + '" y="' + rr(y) + '" fill="' + (o.fill || C.faint) + '" font-size="' + (o.size || 11) + '"' +
        (o.anchor ? ' text-anchor="' + o.anchor + '"' : '') + (o.weight ? ' font-weight="' + o.weight + '"' : '') +
        (o.family ? ' font-family="' + o.family + '"' : '') + (o.ls ? ' letter-spacing="' + o.ls + '"' : '') +
        (o.extra ? ' ' + o.extra : '') + '>' + s + '</text>';
  }
  function scale(d0, d1, r0, r1) { var k = (r1 - r0) / (d1 - d0); return function (v) { return rr(r0 + (v - d0) * k); }; }
  function cp(cx, cy, r) { return 'M' + (cx - r) + ' ' + cy + 'a' + r + ' ' + r + ' 0 1 0 ' + (2 * r) + ' 0a' + r + ' ' + r + ' 0 1 0 ' + (-2 * r) + ' 0'; }
  function wrapAnim(kind, delay, inner) {
    return '<g class="ca-' + kind + '"' + (delay ? ' style="animation-delay:' + delay + 's"' : '') + '>' + inner + '</g>';
  }
  function drawPath(d, attrs, delay) {
    return '<path d="' + d + '" pathLength="1" class="ca-draw"' + (delay ? ' style="animation-delay:' + delay + 's"' : '') + ' ' + attrs + '/>';
  }
  function smooth(p) {
    var d = 'M' + rr(p[0][0]) + ' ' + rr(p[0][1]);
    for (var i = 0; i < p.length - 1; i++) {
      var p0 = p[Math.max(0, i - 1)], p1 = p[i], p2 = p[i + 1], p3 = p[Math.min(p.length - 1, i + 2)];
      d += ' C' + rr(p1[0] + (p2[0] - p0[0]) / 6) + ' ' + rr(p1[1] + (p2[1] - p0[1]) / 6) + ' ' +
          rr(p2[0] - (p3[0] - p1[0]) / 6) + ' ' + rr(p2[1] - (p3[1] - p1[1]) / 6) + ' ' + rr(p2[0]) + ' ' + rr(p2[1]);
    }
    return d;
  }
  function curveH(x1, y1, x2, y2) { var m = (x1 + x2) / 2; return 'M' + x1 + ' ' + y1 + ' C' + m + ' ' + y1 + ' ' + m + ' ' + y2 + ' ' + x2 + ' ' + y2; }
  function curveV(x1, y1, x2, y2) { var m = (y1 + y2) / 2; return 'M' + x1 + ' ' + y1 + ' C' + x1 + ' ' + m + ' ' + x2 + ' ' + m + ' ' + x2 + ' ' + y2; }
  function pill(x, y, label, color, o) {
    o = o || {};
    var size = o.size || 10.5, w = o.w || (label.length * size * 0.62 + 16), h = o.h || 20;
    var px = o.anchor === 'end' ? x - w : o.anchor === 'middle' ? x - w / 2 : x;
    return '<g><rect x="' + rr(px) + '" y="' + rr(y - h / 2) + '" width="' + rr(w) + '" height="' + h + '" rx="' + (h / 2) +
        '" fill="' + (o.solid ? color : C.surface) + '" stroke="' + color + '" stroke-opacity="' + (o.solid ? 1 : 0.55) + '"/>' +
        txt(px + w / 2, y + size * 0.36, label, { fill: o.solid ? 'var(--on-accent)' : color, size: size, anchor: 'middle', weight: 700 }) + '</g>';
  }
  function legend(items, x, y) {
    var out = '', cx = x;
    items.forEach(function (it) {
      out += it[2] === 'ring'
          ? '<circle cx="' + (cx + 4) + '" cy="' + (y - 4) + '" r="4" fill="none" stroke="' + it[1] + '" stroke-width="2"/>'
          : '<rect x="' + cx + '" y="' + (y - 8) + '" width="9" height="9" rx="2.5" fill="' + it[1] + '"/>';
      out += txt(cx + 15, y, it[0], { fill: C.dim, size: 11 });
      cx += 15 + it[0].length * 6.7 + 16;
    });
    return out;
  }

  /* ---------- icon set (24×24, stroked) ---------- */
  var IC = {
    db: 'M4 6c0-1.7 3.6-3 8-3s8 1.3 8 3-3.6 3-8 3-8-1.3-8-3zM4 6v12c0 1.7 3.6 3 8 3s8-1.3 8-3V6M4 12c0 1.7 3.6 3 8 3s8-1.3 8-3',
    truck: 'M2 6h12v10H2zM14 9h4.5L22 12.5V16h-8' + cp(6, 18, 2) + cp(18, 18, 2),
    server: 'M4 4h16v6H4zM4 14h16v6H4zM8 7h.01M8 17h.01',
    stream: 'M2 8c2.5-3 5 3 7.5 0s5-3 7.5 0 3.5 2 5 0M2 16c2.5-3 5 3 7.5 0s5-3 7.5 0 3.5 2 5 0',
    shield: 'M12 3l7 3v5c0 4.5-3 8-7 10-4-2-7-5.5-7-10V6zM9 12l2 2 4-4',
    inbox: 'M3 13l3-8h12l3 8v6H3zM3 13h5l1.5 2.5h5L16 13h5',
    filter: 'M3 5h18l-7 8v6l-4 2v-8z',
    layers: 'M12 3 2 8l10 5 10-5zM2 12.5l10 5 10-5M2 17l10 5 10-5',
    send: 'M4 12h13M13 6l6 6-6 6',
    chart: 'M3 21h18M6 17v-5M11 17V7M16 17v-8M20.5 17V4',
    ml: cp(6, 6, 2.4) + cp(18, 6, 2.4) + cp(12, 18, 2.4) + 'M8.4 6h7.2M7.2 8.2l3.6 7.6M16.8 8.2l-3.6 7.6',
    bot: 'M5 9h14v10H5zM12 5.5V9M9.5 13.5v1M14.5 13.5v1M9.5 17h5' + cp(12, 4.3, 1.3),
    app: 'M3 5h18v14H3zM3 9h18M6 7h.01M9 7h.01',
    user: cp(12, 8, 3.5) + 'M5 20c1.2-3.8 3.8-5.5 7-5.5s5.8 1.7 7 5.5',
    doc: 'M7 3h7l4 4v14H7zM14 3v4h4M10 12h5M10 16h5',
    tree: 'M10 3h4v4h-4zM3 16h4v4H3zM10 16h4v4h-4zM17 16h4v4h-4zM12 7v5M5 16v-4h14v4M12 12v4',
    target: cp(12, 12, 8.5) + cp(12, 12, 4.5) + cp(12, 12, 0.8),
    spark: 'M12 3l2.2 5.8L20 11l-5.8 2.2L12 19l-2.2-5.8L4 11l5.8-2.2z',
    gauge: 'M4 17a8 8 0 1 1 16 0M12 17l4-5',
    check: 'M5 12.5l4.5 4.5L19 7.5',
    branch: cp(6, 5, 2) + cp(6, 19, 2) + cp(18, 8, 2) + 'M6 7v10M18 10c0 4-6 3-11.5 7.5'
  };
  function icon(name, x, y, size, color) {
    var k = size / 24;
    return '<g transform="translate(' + rr(x) + ' ' + rr(y) + ') scale(' + rr(k) + ')"><path d="' + IC[name] +
        '" fill="none" stroke="' + color + '" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"/></g>';
  }
  function tile(x, y, s, name, color) {
    return '<rect x="' + x + '" y="' + y + '" width="' + s + '" height="' + s + '" rx="' + (s * 0.28) + '" fill="' + color +
        '" fill-opacity="0.13" stroke="' + color + '" stroke-opacity="0.38"/>' + icon(name, x + s * 0.2, y + s * 0.2, s * 0.6, color);
  }

  /* ---------- diagram building blocks ---------- */
  function defs(p) {
    return '<defs>' +
        '<marker id="' + p + 'ar" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse">' +
        '<path d="M1 1.5 L8.5 5 L1 8.5" fill="none" stroke="' + C.grid2 + '" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/></marker>' +
        '<filter id="' + p + 'sh" x="-20%" y="-30%" width="140%" height="170%"><feDropShadow dx="0" dy="5" stdDeviation="6" flood-color="#000" flood-opacity="0.22"/></filter>' +
        '<filter id="' + p + 'gl" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="2.4" result="b"/><feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge></filter>' +
        '</defs>';
  }
  function modalAttrs(m) {
    return m ? ' tabindex="0" role="button" data-modal-title="' + m[0] + '" data-modal-body="' + m[1] + '" data-i18n-aria="' + m[0] + '"' : '';
  }
  /* row node: icon tile left, title + subtitle */
  function rowNode(p, o) {
    var col = o.col || C.accent, s = o.tile || 32, ts = o.ts || 13.5;
    var out = '<g class="dn' + (o.m ? ' dgm-node' : '') + '"' + modalAttrs(o.m) + '>';
    out += '<rect class="dgm-box" x="' + o.x + '" y="' + o.y + '" width="' + o.w + '" height="' + o.h + '" rx="12" fill="' + C.surface2 +
        '" stroke="' + C.grid + '" stroke-width="1.2" filter="url(#' + p + 'sh)"/>';
    out += '<rect x="' + (o.x + 14) + '" y="' + (o.y - 1.5) + '" width="' + Math.min(44, o.w - 28) + '" height="3" rx="1.5" fill="' + col + '"/>';
    out += tile(o.x + 12, o.y + (o.h - s) / 2, s, o.ic, col);
    var tx = o.x + 12 + s + 11;
    out += txt(tx, o.y + o.h / 2 - (o.s ? 2 : -4), o.t, { fill: C.text, size: ts, weight: 650, family: BODY });
    if (o.s) out += txt(tx, o.y + o.h / 2 + 13, o.s, { fill: C.faint, size: o.ss || 10.5 });
    if (o.badge) out += pill(o.x + o.w - 10, o.y + o.h / 2, o.badge, o.badgeCol || col, { anchor: 'end', size: 9.5, h: 19 });
    return out + '</g>';
  }
  /* column node: lakehouse layer card */
  function layerNode(p, o) {
    var col = o.col, out = '<g class="dn dgm-node"' + modalAttrs(o.m) + '>';
    out += '<rect class="dgm-box" x="' + o.x + '" y="' + o.y + '" width="' + o.w + '" height="' + o.h + '" rx="13" fill="' + C.surface2 +
        '" stroke="' + C.grid + '" stroke-width="1.2" filter="url(#' + p + 'sh)"/>';
    out += '<path d="M' + (o.x + 13) + ' ' + o.y + ' H' + (o.x + o.w - 13) + '" stroke="' + col + '" stroke-width="4" stroke-linecap="round"/>';
    out += tile(o.x + 12, o.y + 16, 30, o.ic, col);
    out += txt(o.x + o.w - 12, o.y + 34, o.n, { fill: C.faint, size: 10, anchor: 'end' });
    out += txt(o.x + 12, o.y + 68, o.t, { fill: C.text, size: 14, weight: 700, family: BODY, ls: '.04em' });
    out += txt(o.x + 12, o.y + 84, o.s, { fill: C.faint, size: 10 });
    out += '<rect x="' + (o.x + 10) + '" y="' + (o.y + o.h - 30) + '" width="' + (o.w - 20) + '" height="19" rx="9.5" fill="' + col +
        '" fill-opacity="0.12" stroke="' + col + '" stroke-opacity="0.4"/>';
    out += txt(o.x + o.w / 2, o.y + o.h - 17, o.f, { fill: col, size: 9.5, anchor: 'middle', weight: 600 });
    return out + '</g>';
  }
  function edge(p, d, col, delay) {
    return '<path d="' + d + '" fill="none" stroke="' + C.grid2 + '" stroke-width="1.6" marker-end="url(#' + p + 'ar)"/>' +
        '<path class="flow" d="' + d + '" fill="none" stroke="' + (col || C.accent) + '" stroke-width="2.4" stroke-linecap="round" style="animation-delay:-' + (delay || 0) + 's"/>';
  }
  function head(x, y, s, anchor) { return txt(x, y, s, { fill: C.faint, size: 10, ls: '.16em', anchor: anchor, weight: 600 }); }

  /* ================================================================
     DIAGRAM · Lakehouse (project 1)
     ================================================================ */
  var LAYERS = [
    { n: '01', t: 'RAW', s: 'as received', f: 'append-only', ic: 'inbox', col: C.bronze, m: ['mRawT', 'mRawB'] },
    { n: '02', t: 'TRUSTED', s: 'validated', f: 'DQ · ISO 25012', ic: 'filter', col: C.silver, m: ['mTrustedT', 'mTrustedB'] },
    { n: '03', t: 'REFINED', s: 'business logic', f: 'DQ · ISO 25012', ic: 'layers', col: C.gold, m: ['mRefinedT', 'mRefinedB'] },
    { n: '04', t: 'SERVING', s: 'ready to use', f: 'governed', ic: 'send', col: C.accent, m: ['mServingT', 'mServingB'] }
  ];
  var SOURCES = [['truck', 'Truck scales', 'weighing'], ['server', 'Ops systems', 'operational'], ['stream', 'Kafka', 'event streams']];
  var CONSUMERS = [['chart', 'BI', 'Power BI'], ['ml', 'ML models', 'MLflow'], ['bot', 'AI agents', 'Bedrock']];

  function envRow(p, cx, y) {
    var envs = ['dev', 'staging', 'prod'], w = 86, gap = 34, x0 = cx - (3 * w + 2 * gap) / 2, out = '';
    envs.forEach(function (e, i) {
      var x = x0 + i * (w + gap), last = i === 2;
      out += '<rect x="' + x + '" y="' + y + '" width="' + w + '" height="26" rx="13" fill="' + (last ? C.accent : C.surface2) +
          '" stroke="' + (last ? C.accent : C.grid2) + '"/>';
      out += icon('branch', x + 10, y + 6, 14, last ? 'var(--on-accent)' : C.faint);
      out += txt(x + 30, y + 17, e, { fill: last ? 'var(--on-accent)' : C.dim, size: 11, weight: 600 });
      if (i < 2) out += '<path d="M' + (x + w + 6) + ' ' + (y + 13) + ' H' + (x + w + gap - 6) + '" stroke="' + C.grid2 + '" stroke-width="1.6" marker-end="url(#' + p + 'ar)"/>';
    });
    return out;
  }
  function govBand(x, y, w) {
    return '<rect x="' + x + '" y="' + y + '" width="' + w + '" height="42" rx="11" fill="' + C.accent2 + '" fill-opacity="0.07" stroke="' +
        C.accent2 + '" stroke-opacity="0.55" stroke-dasharray="5 4"/>' + icon('shield', x + 14, y + 10, 22, C.accent2) +
        txt(x + 46, y + 19, 'Unity Catalog', { fill: C.text, size: 12.5, weight: 650, family: BODY }) +
        txt(x + 46, y + 33, 'governance across every layer', { fill: C.faint, size: 10 });
  }

  function lakehouse(narrow) {
    var p = 'lk', out = defs(p);
    if (!narrow) {
      var W = 800, H = 336, LX = 172, LW = 104, LG = 20, LY = 82, LH = 128, cy = LY + LH / 2;
      out += head(0, 20, 'SOURCES') + head(LX, 20, 'LAKEHOUSE · DATABRICKS') + head(W, 20, 'CONSUMERS', 'end');
      SOURCES.forEach(function (s, i) {
        var y = 44 + i * 70;
        out += edge(p, curveH(140, y + 26, LX - 3, cy), C.bronze, i * 0.4);
        out += wrapAnim('rise', 0.05 * i, rowNode(p, { x: 0, y: y, w: 140, h: 52, t: s[1], s: s[2], ic: s[0], col: C.bronze, tile: 28, ts: 12.5, ss: 9.5 }));
      });
      LAYERS.forEach(function (l, i) {
        var x = LX + i * (LW + LG);
        if (i < 3) out += edge(p, 'M' + (x + LW) + ' ' + cy + ' H' + (x + LW + LG - 3), LAYERS[i + 1].col, i * 0.3);
        out += '<path d="M' + (x + LW / 2) + ' ' + (LY + LH) + ' V232" stroke="' + C.accent2 + '" stroke-opacity="0.45" stroke-dasharray="3 4"/>';
        out += wrapAnim('rise', 0.15 + 0.08 * i, layerNode(p, { x: x, y: LY, w: LW, h: LH, n: l.n, t: l.t, s: l.s, f: l.f, ic: l.ic, col: l.col, m: l.m }));
      });
      var SX = LX + 4 * LW + 3 * LG;
      CONSUMERS.forEach(function (c, i) {
        var y = 44 + i * 70;
        out += edge(p, curveH(SX, cy, 677, y + 26), C.accent, i * 0.4);
        out += wrapAnim('rise', 0.5 + 0.05 * i, rowNode(p, { x: 680, y: y, w: 120, h: 52, t: c[1], s: c[2], ic: c[0], col: C.accent, tile: 28, ts: 12.5, ss: 9.5 }));
      });
      out += wrapAnim('rise', 0.6, govBand(LX, 232, SX - LX));
      out += wrapAnim('rise', 0.7, envRow(p, LX + (SX - LX) / 2, 292));
      return svg(W, H, out, 'dgm');
    }
    /* narrow: vertical flow */
    var Wn = 360, y = 28, ly = 108;
    out += head(0, 14, 'SOURCES');
    SOURCES.forEach(function (s, i) {
      var x = i * 123;
      out += edge(p, curveV(x + 57, y + 50, 180, ly - 3), C.bronze, i * 0.4);
      out += wrapAnim('rise', 0.05 * i, rowNode(p, { x: x, y: y, w: 114, h: 50, t: s[1].split(' ')[0], s: s[2], ic: s[0], col: C.bronze, tile: 24, ts: 11.5, ss: 9 }));
    });
    LAYERS.forEach(function (l, i) {
      var yy = ly + i * 78;
      if (i < 3) out += edge(p, 'M180 ' + (yy + 58) + ' V' + (yy + 75), LAYERS[i + 1].col, i * 0.3);
      out += wrapAnim('rise', 0.15 + 0.08 * i, rowNode(p, { x: 14, y: yy, w: 332, h: 58, t: l.t, s: l.s, ic: l.ic, col: l.col, m: l.m, badge: l.f, badgeCol: l.col }));
    });
    var cyy = ly + 4 * 78 + 30;
    CONSUMERS.forEach(function (c, i) {
      var x = i * 123;
      out += edge(p, curveV(180, cyy - 50, x + 57, cyy - 3), C.accent, i * 0.4);
      out += wrapAnim('rise', 0.5, rowNode(p, { x: x, y: cyy, w: 114, h: 50, t: c[1], s: c[2], ic: c[0], col: C.accent, tile: 24, ts: 11.5, ss: 9 }));
    });
    out += wrapAnim('rise', 0.6, govBand(0, cyy + 72, Wn));
    out += wrapAnim('rise', 0.7, envRow(p, 180, cyy + 132));
    return svg(Wn, cyy + 166, out, 'dgm');
  }

  /* ================================================================
     DIAGRAM · System map (project 2)
     ================================================================ */
  function system(narrow) {
    var p = 'sy', out = defs(p);
    var N = {
      lake: { t: 'Lakehouse', s: 'serving layer', ic: 'db', col: C.gold, m: ['dtDataT', 'dtDataB'] },
      ml: { t: 'ML models', s: 'MLflow', ic: 'ml', col: C.accent2, m: ['dtModelsT', 'dtModelsB'] },
      a1: { t: 'Bedrock agent', s: 'Lambda · API Gateway', ic: 'bot', col: C.accent, m: ['dtAgentT', 'dtAgentB'] },
      a2: { t: 'Optimizer agent', s: 'OR-Tools · SCIP', ic: 'target', col: C.accent, m: ['dtOptT', 'dtOptB'] },
      app: { t: 'Operator app', s: 'NestJS · MongoDB', ic: 'app', col: C.ok, m: ['dtAppT', 'dtAppB'] }
    };
    function place(k, x, y, w, h, extra) {
      var o = N[k], d = { x: x, y: y, w: w, h: h, t: o.t, s: o.s, ic: o.ic, col: o.col, m: o.m };
      for (var e in extra) d[e] = extra[e];
      return rowNode(p, d);
    }
    if (!narrow) {
      var W = 800, H = 336;
      out += head(0, 20, 'DATA') + head(186, 20, 'MODELS') + head(396, 20, 'AGENTS') + head(800, 20, 'USERS', 'end');
      out += edge(p, 'M150 150 H183', C.accent2, 0);
      out += edge(p, curveH(340, 150, 393, 78), C.accent, 0.3);
      out += edge(p, curveH(340, 150, 393, 222), C.accent, 0.6);
      out += edge(p, curveH(601, 78, 633, 150), C.ok, 0.2);
      out += edge(p, curveH(601, 222, 633, 150), C.ok, 0.5);
      var loop = 'M718 180 V292 Q718 306 704 306 H90 Q76 306 76 292 V183';
      out += '<path d="' + loop + '" fill="none" stroke="' + C.ok + '" stroke-opacity="0.55" stroke-width="1.6" stroke-dasharray="5 5" marker-end="url(#' + p + 'ar)"/>';
      out += '<path class="flow flow-slow" d="' + loop + '" fill="none" stroke="' + C.ok + '" stroke-width="2.4" stroke-linecap="round"/>';
      out += '<rect x="290" y="295" width="232" height="22" rx="11" fill="' + C.bg2 + '" stroke="' + C.ok + '" stroke-opacity="0.45"/>';
      out += txt(406, 310, 'feedback · coded rejection reasons', { fill: C.ok, size: 10, anchor: 'middle', weight: 600 });
      out += '<circle cx="718" cy="244" r="15" fill="' + C.surface + '" stroke="' + C.ok + '" stroke-width="1.4"/>' + icon('user', 709, 235, 18, C.ok);
      out += wrapAnim('rise', 0, place('lake', 0, 121, 150, 58));
      out += wrapAnim('rise', 0.1, place('ml', 186, 121, 154, 58));
      out += wrapAnim('rise', 0.2, place('a1', 396, 46, 205, 64));
      out += wrapAnim('rise', 0.28, place('a2', 396, 190, 205, 64));
      out += wrapAnim('rise', 0.36, place('app', 636, 121, 164, 58));
      out += wrapAnim('rise', 0.5, pill(718, 104, '~70% accepted', C.ok, { anchor: 'middle', size: 10 }));
      return svg(W, H, out, 'dgm');
    }
    out += edge(p, 'M180 58 V83', C.accent2, 0);
    out += edge(p, curveV(180, 142, 94, 175), C.accent, 0.3);
    out += edge(p, curveV(180, 142, 270, 175), C.accent, 0.6);
    out += edge(p, curveV(94, 242, 180, 279), C.ok, 0.2);
    out += edge(p, curveV(270, 242, 180, 279), C.ok, 0.5);
    var loopN = 'M20 311 H9 Q3 311 3 305 V35 Q3 29 9 29 H17';
    out += '<path d="' + loopN + '" fill="none" stroke="' + C.ok + '" stroke-opacity="0.55" stroke-width="1.6" stroke-dasharray="5 5" marker-end="url(#' + p + 'ar)"/>';
    out += '<path class="flow flow-slow" d="' + loopN + '" fill="none" stroke="' + C.ok + '" stroke-width="2.4" stroke-linecap="round"/>';
    out += wrapAnim('rise', 0, place('lake', 20, 0, 320, 58));
    out += wrapAnim('rise', 0.1, place('ml', 20, 86, 320, 56));
    out += wrapAnim('rise', 0.2, place('a1', 16, 178, 158, 64, { ts: 12, ss: 9, tile: 26, s: 'Amazon Bedrock' }));
    out += wrapAnim('rise', 0.28, place('a2', 190, 178, 158, 64, { ts: 12, ss: 9, tile: 26, t: 'Optimizer' }));
    out += wrapAnim('rise', 0.36, place('app', 20, 282, 320, 58, { badge: '~70% accepted', badgeCol: C.ok }));
    out += txt(180, 366, '↺ feedback · coded rejection reasons', { fill: C.ok, size: 10, anchor: 'middle', weight: 600 });
    return svg(360, 376, out, 'dgm');
  }

  /* ================================================================
     DIAGRAM · Agent observability (project 2)
     ================================================================ */
  var OBS = [
    { n: '1', t: 'User feedback', s: '50+ entries · coded reasons', v: '~70%', l: 'accepted', ic: 'user', col: C.ok, m: ['obsFeedbackT', 'obsFeedbackB'] },
    { n: '2', t: 'Agent evaluation', s: 'evaluations on Amazon Bedrock', v: '', l: 'answer quality', ic: 'spark', col: C.accent, m: ['obsEvalT', 'obsEvalB'] },
    { n: '3', t: 'CloudWatch', s: 'dashboards · agent health', v: '', l: 'in production', ic: 'gauge', col: C.accent2, m: ['obsCwT', 'obsCwB'] }
  ];
  function obsRow(p, o, x, y, w, h) {
    var out = '<g class="dn dgm-node"' + modalAttrs(o.m) + '>';
    out += '<rect class="dgm-box" x="' + x + '" y="' + y + '" width="' + w + '" height="' + h + '" rx="12" fill="' + C.surface2 + '" stroke="' + C.grid + '" stroke-width="1.2" filter="url(#' + p + 'sh)"/>';
    out += '<rect x="' + x + '" y="' + (y + 12) + '" width="3.5" height="' + (h - 24) + '" rx="1.75" fill="' + o.col + '"/>';
    out += tile(x + 16, y + (h - 34) / 2, 34, o.ic, o.col);
    out += txt(x + 62, y + h / 2 - 3, '<tspan fill="' + o.col + '">' + o.n + ' · </tspan>' + o.t, { fill: C.text, size: 13.5, weight: 650, family: BODY });
    out += txt(x + 62, y + h / 2 + 14, o.s, { fill: C.faint, size: 10 });
    var rx = x + w - 16;
    if (o.v) out += txt(rx, y + h / 2 + 3, o.v, { fill: o.col, size: 22, weight: 800, family: HEAD, anchor: 'end' });
    else out += icon('check', rx - 22, y + h / 2 - 19, 22, o.col);
    out += txt(rx, y + h / 2 + 18, o.l, { fill: C.faint, size: 9.5, anchor: 'end' });
    return out + '</g>';
  }
  function observability(narrow) {
    var p = 'ob', out = defs(p);
    if (!narrow) {
      OBS.forEach(function (o, i) {
        var y = 8 + i * 84;
        out += edge(p, curveH(170, 128, 223, y + 33), o.col, i * 0.4);
        out += wrapAnim('rise', 0.15 + 0.1 * i, obsRow(p, o, 226, y, 574, 66));
      });
      out += wrapAnim('rise', 0, rowNode(p, { x: 0, y: 92, w: 170, h: 72, t: 'AI agents', s: 'assisted operation', ic: 'bot', col: C.accent }));
      return svg(800, 256, out, 'dgm');
    }
    out += wrapAnim('rise', 0, rowNode(p, { x: 70, y: 0, w: 220, h: 56, t: 'AI agents', s: 'assisted operation', ic: 'bot', col: C.accent }));
    OBS.forEach(function (o, i) {
      var y = 84 + i * 90;
      out += edge(p, 'M180 ' + (i === 0 ? 56 : y - 22) + ' V' + (y - 3), o.col, i * 0.4);
      out += wrapAnim('rise', 0.15 + 0.1 * i, obsRow(p, o, 0, y, 360, 68));
    });
    return svg(360, 334, out, 'dgm');
  }

  /* ================================================================
     DIAGRAM · Industrial data model (project 3) — layout illustrative
     ================================================================ */
  function model() {
    var p = 'dm', W = 600, H = 440, cx = 300, cy = 212, R = 132, n = 22;
    var DOM = [
      { idx: [21, 0, 1], t: 'OSI PI historian', s: 'time series · tags', col: C.accent2 },
      { idx: [4, 5, 6], t: 'HAZOP', s: 'hazard study', col: C.gold },
      { idx: [10, 11, 12], t: 'Root-cause analysis', s: 'RCA reports', col: C.ok },
      { idx: [15, 16, 17], t: 'Equipment docs', s: 'manuals · specs', col: C.bronze }
    ];
    function ang(i) { return (-90 + i * 360 / n) * Math.PI / 180; }
    function pt(i, r) { return [rr(cx + Math.cos(ang(i)) * r), rr(cy + Math.sin(ang(i)) * r)]; }
    var mine = {};
    DOM.forEach(function (d, di) { d.idx.forEach(function (i) { mine[i] = di; }); });
    var out = defs(p);
    out += '<circle cx="' + cx + '" cy="' + cy + '" r="' + R + '" fill="none" stroke="' + C.grid2 + '" stroke-dasharray="2 6"/>';
    out += '<circle cx="' + cx + '" cy="' + cy + '" r="' + (R + 26) + '" fill="none" stroke="' + C.grid + '" stroke-opacity="0.6"/>';
    for (var i = 0; i < n; i++) {
      if (mine[i] != null) continue;
      var q = pt(i, R), q0 = pt(i, 62);
      out += '<line x1="' + q0[0] + '" y1="' + q0[1] + '" x2="' + q[0] + '" y2="' + q[1] + '" stroke="' + C.grid2 + '" stroke-opacity="0.5"/>';
      out += '<circle cx="' + q[0] + '" cy="' + q[1] + '" r="5" fill="' + C.surface2 + '" stroke="' + C.grid2 + '" stroke-width="1.4"/>';
    }
    DOM.forEach(function (d, di) {
      var g = '<g class="hv">';
      var a0 = ang(d.idx[0]) - 0.13, a1 = ang(d.idx[d.idx.length - 1]) + 0.13;
      var s0 = [cx + Math.cos(a0) * R, cy + Math.sin(a0) * R], s1 = [cx + Math.cos(a1) * R, cy + Math.sin(a1) * R];
      g += '<path d="M' + rr(s0[0]) + ' ' + rr(s0[1]) + ' A' + R + ' ' + R + ' 0 0 1 ' + rr(s1[0]) + ' ' + rr(s1[1]) + '" fill="none" stroke="' + d.col + '" stroke-opacity="0.22" stroke-width="28" stroke-linecap="round"/>';
      d.idx.forEach(function (i) {
        var q = pt(i, R), q0 = pt(i, 62);
        g += '<line x1="' + q0[0] + '" y1="' + q0[1] + '" x2="' + q[0] + '" y2="' + q[1] + '" stroke="' + d.col + '" stroke-opacity="0.7" stroke-width="1.6"/>';
        g += '<circle cx="' + q[0] + '" cy="' + q[1] + '" r="7.5" fill="' + d.col + '" stroke="' + C.surface + '" stroke-width="2" filter="url(#' + p + 'gl)"/>';
      });
      var la = ang(d.idx[1]), lr = R + 46;
      var lx = cx + Math.cos(la) * lr, ly = cy + Math.sin(la) * lr;
      var anchor = Math.abs(Math.cos(la)) < 0.3 ? 'middle' : (Math.cos(la) > 0 ? 'start' : 'end');
      var dy = Math.sin(la) > 0.7 ? 14 : (Math.sin(la) < -0.7 ? -12 : 0);
      g += txt(lx, ly + dy, d.t, { fill: C.text, size: 14, weight: 650, family: BODY, anchor: anchor });
      g += txt(lx, ly + dy + 16, d.s, { fill: d.col, size: 10.5, anchor: anchor });
      out += wrapAnim('rise', 0.15 + di * 0.1, g + '</g>');
    });
    out += wrapAnim('pop', 0.05,
        '<circle cx="' + cx + '" cy="' + cy + '" r="60" fill="' + C.surface2 + '" stroke="' + C.accent + '" stroke-width="1.8" filter="url(#' + p + 'sh)"/>' +
        icon('tree', cx - 12, cy - 40, 24, C.accent) +
        txt(cx, cy + 4, 'Asset', { fill: C.text, size: 13, weight: 700, family: BODY, anchor: 'middle' }) +
        txt(cx, cy + 20, 'hierarchy', { fill: C.text, size: 13, weight: 700, family: BODY, anchor: 'middle' }) +
        txt(cx, cy + 36, 'PI Vision-style', { fill: C.faint, size: 9.5, anchor: 'middle' }));
    out += legend([['my domains', C.accent, 'ring'], ['other entities', C.grid2, 'ring']], 8, H - 10);
    out += txt(W - 8, H - 10, '22 entities in total', { fill: C.faint, size: 11, anchor: 'end' });
    return svg(W, H, out, 'dgm');
  }

  /* ================================================================
     SCENE · Overhead camera on the scrap truck (project 4)
     Fixed "camera" palette: a video feed looks the same in both themes.
     An optional photo (assets/img/scrap-truck.webp) sits between the
     illustration and the HUD overlay.
     ================================================================ */
  function truck() {
    var W = 640, H = 400, seed = 11;
    function rnd() { seed = (seed * 9301 + 49297) % 233280; return seed / 233280; }
    var b = '<defs>' +
        '<radialGradient id="tkVig" cx="50%" cy="48%" r="70%"><stop offset="55%" stop-color="#000" stop-opacity="0"/><stop offset="100%" stop-color="#000" stop-opacity="0.55"/></radialGradient>' +
        '<linearGradient id="tkCab" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#d9dee6"/><stop offset="0.5" stop-color="#b8c0cc"/><stop offset="1" stop-color="#8d96a3"/></linearGradient>' +
        '<linearGradient id="tkWall" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#4a525e"/><stop offset="1" stop-color="#2b313a"/></linearGradient>' +
        '<radialGradient id="tkPile" cx="50%" cy="50%" r="60%"><stop offset="0" stop-color="#6b5a4a"/><stop offset="1" stop-color="#2f2924"/></radialGradient>' +
        '<filter id="tkSh" x="-10%" y="-10%" width="130%" height="140%"><feGaussianBlur stdDeviation="9"/></filter>' +
        '<pattern id="tkGrain" width="6" height="6" patternUnits="userSpaceOnUse"><circle cx="1" cy="1" r=".6" fill="#fff" fill-opacity=".05"/><circle cx="4" cy="4" r=".5" fill="#000" fill-opacity=".18"/></pattern>' +
        '</defs>';
    b += '<rect width="' + W + '" height="' + H + '" fill="#23272e"/><rect y="50" width="' + W + '" height="300" fill="#2a2f37"/><rect width="' + W + '" height="' + H + '" fill="url(#tkGrain)"/>';
    for (var lx = 10; lx < W; lx += 70) b += '<rect x="' + lx + '" y="36" width="38" height="5" rx="1" fill="#c9a227" fill-opacity=".75"/><rect x="' + lx + '" y="359" width="38" height="5" rx="1" fill="#c9a227" fill-opacity=".75"/>';
    b += '<path d="M604 54 V346" stroke="#e8e8e8" stroke-opacity=".5" stroke-width="5" stroke-dasharray="14 10"/>';
    b += '<rect x="66" y="104" width="510" height="212" rx="18" fill="#000" fill-opacity=".55" filter="url(#tkSh)" transform="translate(10 12)"/>';
    [[96, 96], [96, 304], [420, 90], [470, 90], [420, 310], [470, 310]].forEach(function (w) {
      b += '<rect x="' + (w[0] - 18) + '" y="' + (w[1] - 7) + '" width="36" height="14" rx="4" fill="#111316"/>';
    });
    /* cab (front faces left) */
    b += '<rect x="44" y="118" width="128" height="170" rx="22" fill="url(#tkCab)" stroke="#5c6470" stroke-width="2"/>';
    b += '<rect x="58" y="132" width="34" height="142" rx="10" fill="#1e2a36"/><rect x="62" y="136" width="12" height="134" rx="6" fill="#6f8aa3" fill-opacity=".35"/>';
    b += '<rect x="100" y="134" width="62" height="138" rx="10" fill="#c7ced8" stroke="#8d96a3"/>';
    b += '<rect x="116" y="150" width="30" height="20" rx="3" fill="#8d96a3"/><rect x="116" y="236" width="30" height="20" rx="3" fill="#8d96a3"/>';
    b += '<rect x="68" y="104" width="10" height="16" rx="2" fill="#2b2f36"/><rect x="68" y="286" width="10" height="16" rx="2" fill="#2b2f36"/>';
    b += '<rect x="176" y="150" width="14" height="106" rx="3" fill="#2b2f36"/>';
    /* bed */
    b += '<rect x="192" y="96" width="388" height="214" rx="10" fill="url(#tkWall)" stroke="#1a1d22" stroke-width="2"/>';
    b += '<rect x="204" y="108" width="364" height="190" rx="6" fill="url(#tkPile)"/>';
    for (var r = 0; r < 4; r++) b += '<rect x="' + (240 + r * 92) + '" y="98" width="6" height="210" fill="#5a636f" fill-opacity=".6"/>';
    /* scrap pile: chunks, plates and rebar */
    var pal = ['#8b4a2b', '#a65a33', '#6e3b23', '#7d8590', '#9aa3ad', '#5b616b', '#b8763f', '#4f555e', '#c0c6ce'];
    for (var k = 0; k < 190; k++) {
      var px = 210 + rnd() * 352, py = 114 + rnd() * 178;
      var dc = Math.sqrt(Math.pow((px - 386) / 176, 2) + Math.pow((py - 203) / 89, 2));
      var sz = 7 + rnd() * 16 * (1.15 - dc * 0.5), sides = 4 + Math.floor(rnd() * 3), pts = [], rot = rnd() * Math.PI;
      for (var s = 0; s < sides; s++) {
        var a = rot + s * 2 * Math.PI / sides, rad = sz * (0.6 + rnd() * 0.5);
        pts.push(rr(Math.min(564, Math.max(206, px + Math.cos(a) * rad))) + ',' + rr(Math.min(296, Math.max(110, py + Math.sin(a) * rad))));
      }
      b += '<polygon points="' + pts.join(' ') + '" fill="' + pal[Math.floor(rnd() * pal.length)] + '" fill-opacity="' + (dc < 0.55 ? 1 : 0.86) + '" stroke="#16130f" stroke-opacity=".55" stroke-width="1"/>';
    }
    for (var m = 0; m < 26; m++) {
      var x1 = 214 + rnd() * 330, y1 = 118 + rnd() * 168, len = 40 + rnd() * 70, an = rnd() * Math.PI;
      var x2 = Math.min(560, Math.max(210, x1 + Math.cos(an) * len)), y2 = Math.min(292, Math.max(114, y1 + Math.sin(an) * len));
      b += '<line x1="' + rr(x1) + '" y1="' + rr(y1) + '" x2="' + rr(x2) + '" y2="' + rr(y2) + '" stroke="' + (rnd() > 0.5 ? '#7a3f22' : '#8e98a4') + '" stroke-width="' + rr(2 + rnd() * 2.5) + '" stroke-linecap="round"/>';
    }
    for (var h = 0; h < 30; h++) {
      b += '<circle cx="' + rr(230 + rnd() * 310) + '" cy="' + rr(125 + rnd() * 150) + '" r="' + rr(1 + rnd() * 1.8) + '" fill="#fff" fill-opacity="' + rr(0.25 + rnd() * 0.4) + '"/>';
    }
    b += '<rect width="' + W + '" height="' + H + '" fill="url(#tkVig)"/>';
    var base = '<svg class="cam-base" viewBox="0 0 ' + W + ' ' + H + '" width="' + W + '" height="' + H + '" style="width:100%;height:auto;display:block" xmlns="http://www.w3.org/2000/svg" role="img">' + b + '</svg>';

    /* HUD overlay */
    var hv = '', HC = '#e9eef5', A = '#ff6a2b', CY = '#38bdf8', GD = '#f0b429', OK = '#34d399';
    hv += '<path d="M16 40 V16 H40 M600 16 H624 V40 M16 360 V384 H40 M600 384 H624 V360" fill="none" stroke="' + HC + '" stroke-opacity=".85" stroke-width="2.5"/>';
    hv += '<rect x="28" y="24" width="236" height="24" rx="5" fill="#0a0c11" fill-opacity=".62"/>';
    hv += '<text x="38" y="40" fill="' + HC + '" font-size="11.5" font-weight="600">CAM-02 · GATE 1 · OVERHEAD</text>';
    hv += '<rect x="494" y="24" width="118" height="24" rx="5" fill="#0a0c11" fill-opacity=".62"/>';
    hv += '<circle class="rec-dot" cx="508" cy="36" r="4.5" fill="#ff3b30"/><text x="518" y="40" fill="' + HC + '" font-size="11.5" font-weight="600">REC 14:32:07</text>';
    hv += '<path d="M320 196 v-10 M320 210 v10 M313 203 h-10 M327 203 h10" stroke="' + HC + '" stroke-opacity=".4" stroke-width="1.4"/>';
    function box(x, y, w, h2, col, label, d) {
      var c = 12, s = '<rect x="' + x + '" y="' + y + '" width="' + w + '" height="' + h2 + '" fill="' + col + '" fill-opacity=".1"/>';
      s += '<path d="M' + x + ' ' + (y + c) + ' V' + y + ' H' + (x + c) + ' M' + (x + w - c) + ' ' + y + ' H' + (x + w) + ' V' + (y + c) +
          ' M' + (x + w) + ' ' + (y + h2 - c) + ' V' + (y + h2) + ' H' + (x + w - c) + ' M' + (x + c) + ' ' + (y + h2) + ' H' + x + ' V' + (y + h2 - c) +
          '" fill="none" stroke="' + col + '" stroke-width="3" stroke-linecap="round"/>';
      s += '<rect x="' + x + '" y="' + (y - 22) + '" width="' + (label.length * 7.2 + 18) + '" height="18" rx="4" fill="' + col + '"/>';
      s += '<text x="' + (x + 9) + '" y="' + (y - 9) + '" fill="#0a0c11" font-size="11" font-weight="700">' + label + '</text>';
      return wrapAnim('pop', d, s);
    }
    hv += box(222, 128, 132, 84, A, 'CLASS A', 0.3);
    hv += box(392, 150, 150, 120, CY, 'CLASS B', 0.5);
    hv += box(250, 232, 112, 58, GD, 'CLASS C', 0.7);
    hv += '<rect class="scanline" x="204" y="108" width="3" height="190" fill="' + CY + '" fill-opacity=".8"/>';
    hv += '<rect x="28" y="330" width="204" height="40" rx="9" fill="#0a0c11" fill-opacity=".72" stroke="' + A + '" stroke-width="1.5"/>';
    hv += '<text x="44" y="347" fill="' + HC + '" fill-opacity=".7" font-size="9.5" font-weight="600" letter-spacing=".12em">DRIVER GUIDANCE</text>';
    hv += '<text x="44" y="362" fill="' + A + '" font-size="13" font-weight="700">▸ UNLOAD AT BAY B3</text>';
    hv += '<rect x="408" y="330" width="204" height="40" rx="9" fill="#0a0c11" fill-opacity=".72" stroke="' + OK + '" stroke-width="1.5"/>';
    hv += '<text x="424" y="347" fill="' + HC + '" fill-opacity=".7" font-size="9.5" font-weight="600" letter-spacing=".12em">INVENTORY</text>';
    hv += '<text x="424" y="362" fill="' + OK + '" font-size="13" font-weight="700">✓ SYNCED · 3 CLASSES</text>';
    var hud = '<svg class="cam-hud" viewBox="0 0 ' + W + ' ' + H + '" xmlns="http://www.w3.org/2000/svg" font-family="var(--font-mono)" aria-hidden="true">' + hv + '</svg>';
    return '<div class="cam">' + base + '<img class="cam-photo" src="assets/img/scrap-truck.webp" alt="" onerror="this.remove()">' + hud + '</div>';
  }

  /* ================================================================
     CHART · Data-quality score (endpoints real, path illustrative)
     ================================================================ */
  function dq() {
    var W = 520, H = 300, L = 46, R = 24, T = 64, B = 36;
    var vals = [70, 71.2, 73.5, 76.8, 79.4, 82.6, 85.3, 88.1, 90.4, 92.3, 93.9, 94.78];
    var n = vals.length, sx = scale(0, n - 1, L, W - R), sy = scale(60, 100, H - B, T);
    var pts = vals.map(function (v, i) { return [sx(i), sy(v)]; });
    var out = '<defs><linearGradient id="dqA" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="' + C.accent + '" stop-opacity=".38"/><stop offset="1" stop-color="' + C.accent + '" stop-opacity="0"/></linearGradient>' +
        '<linearGradient id="dqL" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="' + C.silver + '"/><stop offset=".45" stop-color="' + C.accent + '"/></linearGradient>' +
        '<filter id="dqG" x="-20%" y="-20%" width="140%" height="140%"><feGaussianBlur stdDeviation="3" result="b"/><feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge></filter></defs>';
    out += txt(0, 18, 'Data-quality score', { fill: C.text, size: 14, weight: 650, family: BODY });
    out += txt(0, 36, 'ISO/IEC 25012 · trusted & refined layers', { fill: C.faint, size: 10.5 });
    out += wrapAnim('rise', 1.1, pill(W, 18, '▲ +24.8 pp', C.ok, { anchor: 'end', size: 11, h: 22 }));
    [60, 70, 80, 90, 100].forEach(function (t) {
      out += '<line x1="' + L + '" y1="' + sy(t) + '" x2="' + (W - R) + '" y2="' + sy(t) + '" stroke="' + C.grid + '" stroke-opacity="' + (t === 60 ? 1 : 0.55) + '"/>';
      out += txt(L - 10, sy(t) + 4, t + '%', { fill: C.faint, size: 10, anchor: 'end' });
    });
    for (var i = 0; i < n; i++) out += '<line x1="' + sx(i) + '" y1="' + (H - B) + '" x2="' + sx(i) + '" y2="' + (H - B + 4) + '" stroke="' + C.grid2 + '"/>';
    out += txt(sx(0), H - 10, 'baseline', { fill: C.faint, size: 10.5 });
    out += txt(sx(n - 1), H - 10, 'today', { fill: C.faint, size: 10.5, anchor: 'end' });
    out += wrapAnim('rise', 0.2, '<path d="' + smooth(pts) + ' L' + sx(n - 1) + ' ' + sy(60) + ' L' + sx(0) + ' ' + sy(60) + ' Z" fill="url(#dqA)"/>');
    out += drawPath(smooth(pts), 'fill="none" stroke="url(#dqL)" stroke-width="3.2" stroke-linecap="round" filter="url(#dqG)"', 0.1);
    pts.forEach(function (q, i) {
      if (i === 0 || i === n - 1) return;
      out += wrapAnim('pop', 0.3 + i * 0.06, '<circle class="hv pt" cx="' + q[0] + '" cy="' + q[1] + '" r="3.4" fill="' + C.surface + '" stroke="' + C.accent + '" stroke-width="1.8"><title>' + vals[i].toFixed(1) + '% (illustrative)</title></circle>');
    });
    out += wrapAnim('pop', 0.2, '<circle cx="' + pts[0][0] + '" cy="' + pts[0][1] + '" r="6" fill="' + C.surface + '" stroke="' + C.silver + '" stroke-width="2.4"/>');
    out += wrapAnim('rise', 0.3, pill(pts[0][0] + 12, pts[0][1] + 22, '~70%', C.silver, { size: 11, h: 22 }));
    var e = pts[n - 1];
    out += wrapAnim('pop', 1.0, '<circle cx="' + e[0] + '" cy="' + e[1] + '" r="12" fill="' + C.accent + '" fill-opacity=".18"/><circle cx="' + e[0] + '" cy="' + e[1] + '" r="6" fill="' + C.accent + '" stroke="' + C.surface + '" stroke-width="2"/>');
    out += wrapAnim('rise', 1.1, '<rect x="' + (e[0] - 112) + '" y="' + (e[1] + 36) + '" width="100" height="42" rx="9" fill="' + C.surface + '" stroke="' + C.accent + '" stroke-opacity=".6"/>' +
        txt(e[0] - 62, e[1] + 60, '94.78%', { fill: C.accent, size: 19, weight: 800, family: HEAD, anchor: 'middle' }) +
        txt(e[0] - 62, e[1] + 73, 'production', { fill: C.faint, size: 9, anchor: 'middle' }));
    return svg(W, H, out);
  }

  /* ================================================================
     CHART · ISO/IEC 25012 dimensions — dumbbell (illustrative split,
     averages match ~70% → 94.78%)
     ================================================================ */
  function iso() {
    var W = 520, H = 300, LX = 128, R = 54, T = 72;
    var rows = [['Accuracy', 72, 96], ['Completeness', 68, 95], ['Consistency', 66, 93], ['Credibility', 74, 97], ['Currentness', 69, 93], ['Compliance', 71, 94.7]];
    var sx = scale(50, 100, LX + 10, W - R);
    var out = '';
    out += txt(0, 18, 'Quality by dimension', { fill: C.text, size: 14, weight: 650, family: BODY });
    out += legend([['before', C.silver, 'ring'], ['after', C.accent, 'ring']], 0, 40);
    [50, 60, 70, 80, 90, 100].forEach(function (t) {
      out += '<line x1="' + sx(t) + '" y1="' + (T - 12) + '" x2="' + sx(t) + '" y2="' + (H - 12) + '" stroke="' + C.grid + '" stroke-opacity=".55"/>';
      out += txt(sx(t), T - 18, t, { fill: C.faint, size: 9.5, anchor: 'middle' });
    });
    rows.forEach(function (r, i) {
      var y = T + 10 + i * 36, x0 = sx(r[1]), x1 = sx(r[2]);
      var g = '<g class="hv row-hv"><rect class="band" x="0" y="' + (y - 16) + '" width="' + W + '" height="32" rx="8" fill="transparent"/>';
      g += txt(LX - 6, y + 4, r[0], { fill: C.dim, size: 12, anchor: 'end', family: BODY });
      g += '<line x1="' + x0 + '" y1="' + y + '" x2="' + x1 + '" y2="' + y + '" stroke="' + C.accent + '" stroke-opacity=".45" stroke-width="5" stroke-linecap="round"/>';
      g += '<circle cx="' + x0 + '" cy="' + y + '" r="6" fill="' + C.surface + '" stroke="' + C.silver + '" stroke-width="2.2"/>';
      g += '<circle cx="' + x1 + '" cy="' + y + '" r="7" fill="' + C.accent + '" stroke="' + C.surface + '" stroke-width="2"/>';
      g += txt(W - 4, y + 4, '+' + Math.round(r[2] - r[1]), { fill: C.ok, size: 11.5, weight: 700, anchor: 'end' });
      g += '<title>' + r[0] + ': ' + r[1] + ' → ' + r[2] + ' (illustrative)</title></g>';
      out += wrapAnim('rise', 0.1 + i * 0.07, g);
    });
    return svg(W, H, out);
  }

  /* ================================================================
     CHART · Agent recommendation outcomes (~70% real; reasons illustrative)
     ================================================================ */
  function accept() {
    var W = 520, H = 300, cx = 112, cy = 172, r = 84, sw = 24;
    var reasons = [['Constraint / feasibility', 36], ['Data freshness', 26], ['Operator context', 24], ['Other', 14]];
    var segs = [['Accepted', 70, C.ok, 1]].concat(reasons.map(function (x, i) { return [x[0], 30 * x[1] / 100, C.accent, 1 - i * 0.2]; }));
    var out = txt(0, 18, 'Recommendation outcomes', { fill: C.text, size: 14, weight: 650, family: BODY });
    out += txt(0, 36, 'assisted operation · coded feedback', { fill: C.faint, size: 10.5 });
    var a = -Math.PI / 2, gap = 0.025;
    segs.forEach(function (s, i) {
      var a1 = a + s[1] / 100 * 2 * Math.PI;
      var b0 = a + gap, b1 = a1 - gap, lg = (b1 - b0) > Math.PI ? 1 : 0;
      var d = 'M' + rr(cx + r * Math.cos(b0)) + ' ' + rr(cy + r * Math.sin(b0)) + ' A' + r + ' ' + r + ' 0 ' + lg + ' 1 ' + rr(cx + r * Math.cos(b1)) + ' ' + rr(cy + r * Math.sin(b1));
      out += wrapAnim('rise', 0.1 + i * 0.08, '<path class="hv" d="' + d + '" fill="none" stroke="' + s[2] + '" stroke-opacity="' + s[3] + '" stroke-width="' + sw + '"><title>' + s[0] + ' · ' + Math.round(s[1] * 10) / 10 + '%</title></path>');
      a = a1;
    });
    out += txt(cx, cy + 4, '~70%', { fill: C.text, size: 32, weight: 800, family: HEAD, anchor: 'middle' });
    out += txt(cx, cy + 24, 'accepted', { fill: C.ok, size: 11, anchor: 'middle', weight: 600 });
    var X = 248, bw = 196;
    out += txt(X, 82, 'Rejected · ~30%', { fill: C.text, size: 12.5, weight: 650, family: BODY });
    out += txt(W, 82, 'share of rejections', { fill: C.faint, size: 9.5, anchor: 'end' });
    reasons.forEach(function (rw, i) {
      var y = 108 + i * 36;
      var g = '<g class="hv">' + txt(X, y, rw[0], { fill: C.dim, size: 11.5, family: BODY });
      g += '<rect x="' + X + '" y="' + (y + 7) + '" width="' + bw + '" height="7" rx="3.5" fill="' + C.grid + '" fill-opacity=".6"/>';
      g += '<rect x="' + X + '" y="' + (y + 7) + '" width="' + rr(bw * rw[1] / 40) + '" height="7" rx="3.5" fill="' + C.accent + '" fill-opacity="' + (1 - i * 0.2) + '"/>';
      g += txt(W, y + 14, rw[1] + '%', { fill: C.text, size: 12, weight: 700, anchor: 'end' }) + '</g>';
      out += wrapAnim('rise', 0.4 + i * 0.08, g);
    });
    out += wrapAnim('rise', 0.8, '<rect x="' + X + '" y="252" width="' + (W - X) + '" height="36" rx="10" fill="' + C.ok + '" fill-opacity=".08" stroke="' + C.ok + '" stroke-opacity=".4"/>' +
        icon('doc', X + 12, 261, 18, C.ok) + txt(X + 38, 274, '50+ structured feedback entries', { fill: C.text, size: 11.5, weight: 600, family: BODY }));
    return svg(W, H, out);
  }

  /* ================================================================
     CHART · Anomaly detection on a synthetic sensor (illustrative)
     ================================================================ */
  function anomaly() {
    var W = 520, H = 330, L = 34, R = 10, n = 96, seed = 7;
    function rnd() { seed = (seed * 9301 + 49297) % 233280; return seed / 233280; }
    function base(i) { return 50 + 8 * Math.sin(i / 7.5) + 3 * Math.sin(i / 2.3); }
    var vals = [];
    for (var i = 0; i < n; i++) {
      var v = base(i) + (rnd() - 0.5) * 5;
      if (i === 28) v += 21;
      if (i >= 66 && i <= 75) v += (i - 65) * 2.2;
      vals.push(v);
    }
    var score = vals.map(function (v, k) { return Math.min(1, Math.abs(v - base(k)) / 13); });
    var T1 = 60, B1 = 206, T2 = 236, B2 = 296, thr = 0.72;
    var sx = scale(0, n - 1, L, W - R), sy = scale(25, 90, B1, T1), ss = scale(0, 1, B2, T2);
    var out = '<defs><pattern id="anH" width="7" height="7" patternUnits="userSpaceOnUse" patternTransform="rotate(45)"><line x1="0" y1="0" x2="0" y2="7" stroke="' + C.accent + '" stroke-opacity=".3" stroke-width="2"/></pattern>' +
        '<linearGradient id="anB" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="' + C.accent2 + '" stop-opacity=".16"/><stop offset="1" stop-color="' + C.accent2 + '" stop-opacity=".05"/></linearGradient></defs>';
    out += txt(0, 18, 'Equipment sensor · synthetic year', { fill: C.text, size: 14, weight: 650, family: BODY });
    out += legend([['signal', C.accent2], ['expected range', C.silver], ['anomaly', C.accent]], 0, 40);
    [30, 50, 70, 90].forEach(function (t) {
      out += '<line x1="' + L + '" y1="' + sy(t) + '" x2="' + (W - R) + '" y2="' + sy(t) + '" stroke="' + C.grid + '" stroke-opacity=".55"/>';
      out += txt(L - 6, sy(t) + 4, t, { fill: C.faint, size: 9.5, anchor: 'end' });
    });
    var top = [], bot = [];
    for (var j = 0; j < n; j++) { top.push([sx(j), sy(base(j) + 7)]); bot.push([sx(j), sy(base(j) - 7)]); }
    var band = 'M' + top.map(function (q) { return q[0] + ' ' + q[1]; }).join(' L') + ' L' + bot.reverse().map(function (q) { return q[0] + ' ' + q[1]; }).join(' L') + ' Z';
    out += wrapAnim('rise', 0.05, '<path d="' + band + '" fill="url(#anB)" stroke="' + C.silver + '" stroke-opacity=".35" stroke-dasharray="3 4"/>');
    out += wrapAnim('rise', 0.5, '<rect x="' + sx(65.5) + '" y="' + T1 + '" width="' + rr(sx(75.5) - sx(65.5)) + '" height="' + (B2 - T1) + '" fill="url(#anH)" rx="4"/>');
    var d = 'M' + vals.map(function (v, k) { return sx(k) + ' ' + rr(sy(v)); }).join(' L');
    out += drawPath(d, 'fill="none" stroke="' + C.accent2 + '" stroke-width="1.8" stroke-linejoin="round"', 0.1);
    vals.forEach(function (v, k) {
      if (score[k] < thr) return;
      out += wrapAnim('pop', 0.9 + k * 0.004, '<circle class="hv" cx="' + sx(k) + '" cy="' + rr(sy(v)) + '" r="9" fill="' + C.accent + '" fill-opacity=".18"/><circle cx="' + sx(k) + '" cy="' + rr(sy(v)) + '" r="4" fill="' + C.accent + '" stroke="' + C.surface + '" stroke-width="1.5"/>');
    });
    out += wrapAnim('rise', 1.1, '<path d="M' + sx(28) + ' ' + rr(sy(vals[28]) - 9) + ' L' + (sx(28) + 16) + ' ' + rr(sy(vals[28]) - 20) + '" stroke="' + C.accent + '" stroke-width="1.2"/>' + pill(sx(28) + 16, sy(vals[28]) - 20, 'spike', C.accent, { size: 10 }));
    out += wrapAnim('rise', 1.2, pill(sx(70.5), T1 - 4, 'drift', C.accent, { anchor: 'middle', size: 10 }));
    out += txt(L, T2 - 8, 'anomaly score', { fill: C.faint, size: 10 });
    out += '<line x1="' + L + '" y1="' + B2 + '" x2="' + (W - R) + '" y2="' + B2 + '" stroke="' + C.grid2 + '"/>';
    var bw = (W - R - L) / n - 1.2;
    score.forEach(function (s, k) {
      var hot = s >= thr, hh = Math.max(1.5, B2 - ss(s));
      out += '<rect x="' + rr(sx(k) - bw / 2) + '" y="' + rr(B2 - hh) + '" width="' + rr(bw) + '" height="' + rr(hh) + '" rx="1" fill="' + (hot ? C.accent : C.accent2) + '" fill-opacity="' + (hot ? 1 : 0.35) + '"/>';
    });
    out += '<line x1="' + L + '" y1="' + ss(thr) + '" x2="' + (W - R) + '" y2="' + ss(thr) + '" stroke="' + C.accent + '" stroke-dasharray="4 4" stroke-opacity=".8"/>';
    out += txt(W - R, ss(thr) - 5, 'threshold', { fill: C.accent, size: 9.5, anchor: 'end' });
    ['Jan', 'Mar', 'May', 'Jul', 'Sep', 'Nov'].forEach(function (mo, k) { out += txt(sx(k * n / 6), H - 12, mo, { fill: C.faint, size: 10 }); });
    return svg(W, H, out);
  }

  /* ================================================================
     CHART · Scrap classes — waffle (illustrative)
     ================================================================ */
  function scrap() {
    var W = 520, H = 300, cs = 19, gp = 4, Y = 60;
    var cls = [['A', 'Class A', 34, C.accent], ['B', 'Class B', 26, C.accent2], ['C', 'Class C', 18, C.gold], ['D', 'Class D', 14, C.bronze], ['E', 'Class E', 8, C.silver]];
    var out = txt(0, 18, 'Detected scrap mix', { fill: C.text, size: 14, weight: 650, family: BODY });
    out += txt(0, 36, 'share of volume by class · 1 cell = 1%', { fill: C.faint, size: 10.5 });
    var cells = [];
    cls.forEach(function (c) { for (var i = 0; i < c[2]; i++) cells.push(c); });
    cells.forEach(function (c, i) {
      var col = Math.floor(i / 10), row = i % 10;
      out += wrapAnim('pop', rr(0.1 + i * 0.012), '<rect class="cell" data-c="' + c[0] + '" x="' + (col * (cs + gp)) + '" y="' + (Y + row * (cs + gp)) + '" width="' + cs + '" height="' + cs + '" rx="4.5" fill="' + c[3] + '"/>');
    });
    var LX = 262;
    cls.forEach(function (c, i) {
      var y = 72 + i * 46;
      var g = '<g class="lg" data-hl="' + c[0] + '"><rect class="band" x="' + (LX - 8) + '" y="' + (y - 14) + '" width="' + (W - LX + 8) + '" height="42" rx="9" fill="transparent"/>';
      g += '<rect x="' + LX + '" y="' + (y - 4) + '" width="12" height="12" rx="3.5" fill="' + c[3] + '"/>';
      g += txt(LX + 22, y + 6, c[1], { fill: C.text, size: 13, weight: 600, family: BODY });
      g += txt(W - 4, y + 8, c[2] + '%', { fill: C.text, size: 18, weight: 800, family: HEAD, anchor: 'end' });
      g += '<rect x="' + (LX + 22) + '" y="' + (y + 15) + '" width="150" height="4" rx="2" fill="' + C.grid + '"/>';
      g += '<rect x="' + (LX + 22) + '" y="' + (y + 15) + '" width="' + rr(150 * c[2] / 40) + '" height="4" rx="2" fill="' + c[3] + '"/></g>';
      out += wrapAnim('rise', 0.2 + i * 0.07, g);
    });
    return svg(W, H, out, 'waffle');
  }

  /* ================================================================
     render — lazy, scroll-triggered; responsive diagrams re-layout
     ================================================================ */
  var builders = {
    'dgm-lakehouse': lakehouse, 'dgm-system': system, 'dgm-obs': observability, 'dgm-model': model, 'dgm-truck': truck,
    'chart-dq': dq, 'chart-iso': iso, 'chart-accept': accept, 'chart-anomaly': anomaly, 'chart-scrap': scrap
  };
  var responsive = { 'dgm-lakehouse': 600, 'dgm-system': 600, 'dgm-obs': 560 };

  function isNarrow(id, el) { return responsive[id] ? el.clientWidth < responsive[id] : false; }

  function wireWaffle(el) {
    el.querySelectorAll('[data-hl]').forEach(function (lg) {
      var c = lg.getAttribute('data-hl');
      lg.addEventListener('mouseenter', function () { el.querySelectorAll('.cell').forEach(function (r) { r.classList.toggle('dim', r.getAttribute('data-c') !== c); }); });
      lg.addEventListener('mouseleave', function () { el.querySelectorAll('.cell').forEach(function (r) { r.classList.remove('dim'); }); });
    });
  }

  function renderOne(id, force) {
    var el = document.getElementById(id);
    if (!el || (el.dataset.rendered && !force)) return;
    var narrow = isNarrow(id, el);
    el.innerHTML = builders[id](narrow);
    el.dataset.rendered = '1';
    el.dataset.narrow = narrow ? '1' : '0';
    wireWaffle(el);
    if (window.I18N && window.Charts.onRender) window.Charts.onRender(el);
    window.setTimeout(function () { el.querySelectorAll('svg').forEach(function (s) { s.classList.add('settle'); }); }, 2600);
  }

  function renderAll() {
    var ids = Object.keys(builders), pending = ids.slice();
    function flush() { pending.forEach(function (id) { renderOne(id); }); pending = []; }
    if (!('IntersectionObserver' in window)) { flush(); return; }
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (!e.isIntersecting) return;
        var slots = e.target.querySelectorAll('[data-chart-slot]');
        for (var i = 0; i < slots.length; i++) renderOne(slots[i].id);
        io.unobserve(e.target);
      });
    }, { threshold: 0, rootMargin: '0px 0px 160px 0px' });
    ids.forEach(function (id) {
      var el = document.getElementById(id);
      if (!el) return;
      el.setAttribute('data-chart-slot', '1');
      io.observe(el.closest('figure') || el.parentElement);
    });
    window.setTimeout(flush, 2000);

    var t = null;
    window.addEventListener('resize', function () {
      clearTimeout(t);
      t = setTimeout(function () {
        Object.keys(responsive).forEach(function (id) {
          var el = document.getElementById(id);
          if (el && el.dataset.rendered && (isNarrow(id, el) ? '1' : '0') !== el.dataset.narrow) renderOne(id, true);
        });
      }, 150);
    });
  }

  window.Charts = { renderAll: renderAll, builders: builders, onRender: null };
})();
