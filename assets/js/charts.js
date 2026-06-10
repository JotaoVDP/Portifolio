/* ============================================================
   charts.js — premium SVG data-viz (zero dependencies)
   Design language:
   · smooth monotone curves + gradient area fades
   · soft glow on accent strokes (industrial "molten" look)
   · value pills & annotations baked in (no hover needed)
   · dotted hairline grids, minimal chrome
   · scroll-triggered entrance animations (CSS-driven)
   · all colors via CSS variables → live light/dark theming
   ============================================================ */
(function () {
  'use strict';

  /* ---------- tokens ---------- */
  var C = {
    accent: 'var(--accent)', accent2: 'var(--accent-2)', gold: 'var(--gold)',
    silver: 'var(--silver)', bronze: 'var(--bronze)', ok: 'var(--ok)',
    text: 'var(--text)', dim: 'var(--text-dim)', faint: 'var(--text-faint)',
    grid: 'var(--border)', grid2: 'var(--border-2)', surface: 'var(--surface)',
    surface2: 'var(--surface-2)'
  };

  function rr(n) { return Math.round(n * 100) / 100; }

  function svg(w, h, body) {
    return '<svg viewBox="0 0 ' + w + ' ' + h + '" width="100%" style="height:auto;display:block" ' +
        'xmlns="http://www.w3.org/2000/svg" font-family="var(--font-mono)" role="img">' + body + '</svg>';
  }
  function txt(x, y, s, fill, size, anchor, extra) {
    return '<text x="' + rr(x) + '" y="' + rr(y) + '" fill="' + (fill || C.faint) + '" font-size="' + (size || 10.5) + '"' +
        (anchor ? ' text-anchor="' + anchor + '"' : '') + (extra ? ' ' + extra : '') + '>' + s + '</text>';
  }
  function dline(x1, y1, x2, y2, stroke, w, extra) {
    return '<line x1="' + rr(x1) + '" y1="' + rr(y1) + '" x2="' + rr(x2) + '" y2="' + rr(y2) +
        '" stroke="' + stroke + '" stroke-width="' + (w || 1) + '"' + (extra ? ' ' + extra : '') + '/>';
  }
  function scale(d0, d1, r0, r1) {
    var k = (r1 - r0) / (d1 - d0);
    return function (v) { return rr(r0 + (v - d0) * k); };
  }

  /* defs: vertical fade gradient + soft glow filter (unique ids per chart) */
  function fadeDef(id, color, op) {
    return '<linearGradient id="' + id + '" x1="0" y1="0" x2="0" y2="1">' +
        '<stop offset="0" stop-color="' + color + '" stop-opacity="' + op + '"/>' +
        '<stop offset="1" stop-color="' + color + '" stop-opacity="0"/></linearGradient>';
  }
  function glowDef(id, blur) {
    return '<filter id="' + id + '" x="-50%" y="-50%" width="200%" height="200%">' +
        '<feGaussianBlur stdDeviation="' + (blur || 2.6) + '" result="b"/>' +
        '<feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge></filter>';
  }

  /* Catmull-Rom → cubic bezier smoothing */
  function smoothBody(p) {
    var d = '';
    for (var i = 0; i < p.length - 1; i++) {
      var p0 = p[Math.max(0, i - 1)], p1 = p[i], p2 = p[i + 1], p3 = p[Math.min(p.length - 1, i + 2)];
      d += ' C' + rr(p1[0] + (p2[0] - p0[0]) / 6) + ' ' + rr(p1[1] + (p2[1] - p0[1]) / 6) +
          ' ' + rr(p2[0] - (p3[0] - p1[0]) / 6) + ' ' + rr(p2[1] - (p3[1] - p1[1]) / 6) +
          ' ' + rr(p2[0]) + ' ' + rr(p2[1]);
    }
    return d;
  }
  function smoothPath(pts) { return 'M' + rr(pts[0][0]) + ' ' + rr(pts[0][1]) + smoothBody(pts); }
  /* closed band between top points and bottom points (both left→right) */
  function bandPath(top, bot) {
    var rb = bot.slice().reverse();
    return smoothPath(top) + ' L' + rr(rb[0][0]) + ' ' + rr(rb[0][1]) + smoothBody(rb) + ' Z';
  }

  /* rounded value pill */
  function pill(x, y, label, color, anchor) {
    var w = label.length * 6.6 + 14, h = 18;
    var px = anchor === 'end' ? x - w : anchor === 'middle' ? x - w / 2 : x;
    return '<g><rect x="' + rr(px) + '" y="' + rr(y - h / 2) + '" width="' + rr(w) + '" height="' + h +
        '" rx="9" fill="' + C.surface2 + '" stroke="' + C.grid2 + '"/>' +
        txt(px + w / 2, y + 3.6, label, color, 10.5, 'middle', 'font-weight="700"') + '</g>';
  }

  function chips(items, x, y) {
    var out = '', cx = x;
    items.forEach(function (it) {
      out += '<circle cx="' + cx + '" cy="' + (y - 3.5) + '" r="3.6" fill="' + it[1] + '"/>';
      out += txt(cx + 9, y, it[0], C.dim, 10.5);
      cx += 9 + it[0].length * 6.4 + 16;
    });
    return out;
  }

  /* dotted hairline y-grid */
  function yGrid(ticks, sy, x0, x1, fmt) {
    var out = '';
    ticks.forEach(function (t) {
      out += dline(x0, sy(t), x1, sy(t), C.grid, 1, 'stroke-dasharray="2 5" opacity="0.9"');
      out += txt(x0 - 8, sy(t) + 3.5, fmt ? fmt(t) : t, C.faint, 10, 'end');
    });
    return out;
  }

  /* animation helpers (classes defined in styles.css) */
  function draw(extra, delay) { return ' pathLength="1" class="ca-draw"' + (delay ? ' style="animation-delay:' + delay + 's"' : '') + (extra || ''); }
  function rise(delay) { return ' class="ca-rise"' + (delay ? ' style="animation-delay:' + delay + 's"' : ''); }
  function pop(delay) { return ' class="ca-pop"' + (delay ? ' style="animation-delay:' + delay + 's"' : ''); }
  function grow(delay) { return ' class="ca-grow"' + (delay ? ' style="animation-delay:' + delay + 's"' : ''); }

  /* ================================================================
     1. INGESTION — smooth stacked area "stream" + peak pill
     ================================================================ */
  function ingestion() {
    var W = 420, H = 264, L = 42, R = 16, T = 40, B = 30;
    var months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug'];
    var series = [
      ['S. America', C.accent,  [120, 135, 128, 150, 162, 158, 175, 182]],
      ['N. America', C.accent2, [60, 64, 61, 70, 74, 72, 80, 84]],
      ['Europe',     C.gold,    [38, 40, 42, 46, 48, 47, 52, 55]],
      ['Asia',       C.silver,  [22, 24, 25, 27, 29, 30, 33, 35]]
    ];
    var n = months.length;
    var sx = scale(0, n - 1, L, W - R), sy = scale(0, 400, H - B, T);
    var defs = '<defs>';
    series.forEach(function (s, i) { defs += fadeDef('gIng' + i, s[1], 0.50); });
    defs += glowDef('fIng') + '</defs>';

    var out = defs + chips(series.map(function (s) { return [s[0], s[1]]; }), L, 18);
    out += yGrid([0, 100, 200, 300, 400], sy, L, W - R);
    months.forEach(function (m, i) { out += txt(sx(i), H - B + 16, m, C.faint, 10, 'middle'); });

    /* cumulative bands, bottom → top */
    var cum = [], base = months.map(function (_, i) { return [sx(i), sy(0)]; });
    var acc = months.map(function () { return 0; });
    series.forEach(function (s, si) {
      var topPts = s[2].map(function (v, i) { acc[i] += v; return [sx(i), sy(acc[i])]; });
      cum.push(topPts);
      var botPts = si === 0 ? base : cum[si - 1];
      out += '<path d="' + bandPath(topPts, botPts) + '" fill="url(#gIng' + si + ')"' + rise(0.08 * si) + '/>';
      out += '<path d="' + smoothPath(topPts) + '" fill="none" stroke="' + s[1] + '" stroke-width="2"' +
          draw('', 0.08 * si) + '/>';
    });
    /* peak annotation */
    var px = sx(n - 1), py = cum[3][n - 1][1];
    out += '<circle cx="' + px + '" cy="' + py + '" r="4.5" fill="' + C.accent + '" filter="url(#fIng)"' + pop(0.7) + '/>';
    out += '<g' + rise(0.8) + '>' + pill(px - 8, py - 18, '356 GB/day', C.text, 'end') + '</g>';
    out += txt(L - 30, T - 8, 'GB/day', C.faint, 9.5);
    return svg(W, H, out);
  }

  /* ================================================================
     2. KPI TREND — glowing smooth lines, target tag, end pills
     ================================================================ */
  function kpitrend() {
    var W = 420, H = 262, L = 40, R = 62, T = 42, B = 30;
    var oee =   [78, 80.5, 81.5, 83.5, 84.5, 85.8, 87.5, 88.5, 89.5, 90, 92, 93];
    var yld =   [90, 91, 91.5, 92, 92.3, 93, 93.5, 94, 94.2, 94.5, 94.8, 95.1];
    var sx = scale(0, 11, L, W - R), sy = scale(70, 100, H - B, T);
    var oP = oee.map(function (v, i) { return [sx(i), sy(v)]; });
    var yP = yld.map(function (v, i) { return [sx(i), sy(v)]; });

    var out = '<defs>' + fadeDef('gKpi', C.accent, 0.30) + fadeDef('gKpi2', C.accent2, 0.16) + glowDef('fKpi') + '</defs>';
    out += chips([['OEE %', C.accent], ['Yield %', C.accent2]], L, 18);
    out += '<g' + rise(0.1) + '>' + pill(W - R + 50, 16, '▲ 15 pts', C.ok, 'end') + '</g>';
    out += yGrid([70, 80, 90, 100], sy, L, W - R);
    ['Jan', 'Mar', 'May', 'Jul', 'Sep', 'Nov'].forEach(function (m, i) {
      out += txt(sx(i * 2), H - B + 16, m, C.faint, 10, 'middle');
    });
    /* target */
    out += dline(L, sy(90), W - R, sy(90), C.faint, 1.3, 'stroke-dasharray="3 6" opacity="0.9"');
    out += txt(W - R + 8, sy(90) + 3.5, 'target', C.faint, 9.5);
    /* gradient areas + glowing curves */
    var base = [[sx(0), sy(70)], [sx(11), sy(70)]];
    out += '<path d="' + smoothPath(yP) + ' L' + sx(11) + ' ' + sy(70) + ' L' + sx(0) + ' ' + sy(70) + ' Z" fill="url(#gKpi2)"' + rise(0.15) + '/>';
    out += '<path d="' + smoothPath(oP) + ' L' + sx(11) + ' ' + sy(70) + ' L' + sx(0) + ' ' + sy(70) + ' Z" fill="url(#gKpi)"' + rise(0.25) + '/>';
    out += '<path d="' + smoothPath(yP) + '" fill="none" stroke="' + C.accent2 + '" stroke-width="2.6" stroke-linecap="round"' + draw(' filter="url(#fKpi)"', 0.1) + '/>';
    out += '<path d="' + smoothPath(oP) + '" fill="none" stroke="' + C.accent + '" stroke-width="2.8" stroke-linecap="round"' + draw(' filter="url(#fKpi)"', 0.2) + '/>';
    /* endpoints */
    out += '<circle cx="' + sx(11) + '" cy="' + sy(95.1) + '" r="4.5" fill="' + C.accent2 + '"' + pop(1.0) + '/>';
    out += '<circle cx="' + sx(11) + '" cy="' + sy(93) + '" r="4.5" fill="' + C.accent + '"' + pop(1.1) + '/>';
    out += '<g' + rise(1.05) + '>' + pill(sx(11) + 10, sy(95.1) - 4, '95.1', C.accent2) + '</g>';
    out += '<g' + rise(1.15) + '>' + pill(sx(11) + 10, sy(93) + 14, '93.0', C.accent) + '</g>';
    return svg(W, H, out);
  }

  /* ================================================================
     3. ISO 25012 — radar, glow polygon + vertex dots
     ================================================================ */
  function iso() {
    var W = 420, H = 318, cx = 210, cy = 176, R = 98;
    var dims = ['Accuracy', 'Completeness', 'Consistency', 'Credibility', 'Currentness', 'Compliance'];
    var before = [62, 58, 55, 60, 52, 64], after = [88, 90, 86, 92, 85, 91];
    function pt(i, v) {
      var a = -Math.PI / 2 + i * Math.PI / 3;
      return [rr(cx + Math.cos(a) * R * v / 100), rr(cy + Math.sin(a) * R * v / 100)];
    }
    var out = '<defs>' + glowDef('fIso', 3) + '</defs>';
    out += chips([['Before', C.silver], ['After', C.accent]], 42, 18);
    [25, 50, 75, 100].forEach(function (g) {
      out += '<polygon points="' + dims.map(function (_, i) { return pt(i, g).join(','); }).join(' ') +
          '" fill="none" stroke="' + C.grid + '" stroke-width="1" stroke-dasharray="2 5"/>';
    });
    dims.forEach(function (d, i) {
      var e = pt(i, 100); out += dline(cx, cy, e[0], e[1], C.grid, 1, 'opacity="0.8"');
      var lp = pt(i, 122), anchor = 'middle';
      if (lp[0] < cx - 12) anchor = 'end'; else if (lp[0] > cx + 12) anchor = 'start';
      out += txt(lp[0], lp[1] + 4, d, C.dim, 10.5, anchor);
    });
    out += '<polygon points="' + before.map(function (v, i) { return pt(i, v).join(','); }).join(' ') +
        '" fill="' + C.silver + '" fill-opacity="0.10" stroke="' + C.silver + '" stroke-width="1.8" stroke-dasharray="5 4"' + rise(0.1) + '/>';
    out += '<polygon points="' + after.map(function (v, i) { return pt(i, v).join(','); }).join(' ') +
        '" fill="' + C.accent + '" fill-opacity="0.18" stroke="' + C.accent + '" stroke-width="2.4" filter="url(#fIso)"' + rise(0.3) + '/>';
    after.forEach(function (v, i) {
      var p = pt(i, v);
      out += '<circle cx="' + p[0] + '" cy="' + p[1] + '" r="3.6" fill="' + C.accent + '"' + pop(0.5 + i * 0.06) + '/>';
    });
    return svg(W, H, out);
  }

  /* ================================================================
     4. BLEND — segmented donut + glow + value legend
     ================================================================ */
  function blend() {
    var W = 420, H = 244, cx = 116, cy = 126, r1 = 50, r2o = 80;
    var parts = [['Scrap A', 38, C.accent], ['Scrap B', 27, C.accent2], ['Alloy X', 19, C.gold], ['Flux', 16, C.silver]];
    function p(r, a) { return rr(cx + r * Math.cos(a)) + ' ' + rr(cy + r * Math.sin(a)); }
    function arc(a0, a1, color, extra) {
      var lg = (a1 - a0) > Math.PI ? 1 : 0;
      return '<path d="M ' + p(r2o, a0) + ' A ' + r2o + ' ' + r2o + ' 0 ' + lg + ' 1 ' + p(r2o, a1) +
          ' L ' + p(r1, a1) + ' A ' + r1 + ' ' + r1 + ' 0 ' + lg + ' 0 ' + p(r1, a0) +
          ' Z" fill="' + color + '" stroke="' + C.surface + '" stroke-width="3"' + (extra || '') + '/>';
    }
    var out = '<defs>' + glowDef('fBlend', 3.4) + '</defs>';
    /* faint full track ring */
    out += '<circle cx="' + cx + '" cy="' + cy + '" r="' + ((r1 + r2o) / 2) + '" fill="none" stroke="' + C.grid + '" stroke-width="' + (r2o - r1) + '" opacity="0.25"/>';
    var a = -Math.PI / 2;
    parts.forEach(function (s, i) {
      var a1 = a + s[1] / 100 * 2 * Math.PI;
      out += arc(a, a1, s[2], (i === 0 ? ' filter="url(#fBlend)"' : '') + rise(0.12 * i));
      a = a1;
    });
    out += '<g' + rise(0.55) + '>';
    out += txt(cx, cy - 3, '99.2%', C.text, 21, 'middle', 'font-weight="800" font-family="var(--font-head)"');
    out += txt(cx, cy + 16, 'quality met', C.faint, 9.5, 'middle');
    out += '</g>';
    var ly = 64;
    parts.forEach(function (s, i) {
      out += '<g' + rise(0.15 + 0.1 * i) + '>';
      out += '<rect x="226" y="' + (ly - 11) + '" width="14" height="14" rx="5" fill="' + s[2] + '"/>';
      out += txt(250, ly, s[0], C.dim, 12);
      out += txt(384, ly, s[1] + '%', C.text, 12.5, 'end', 'font-weight="700"');
      out += dline(226, ly + 10, 384, ly + 10, C.grid, 1, 'opacity="0.7"');
      out += '</g>';
      ly += 33;
    });
    return svg(W, H, out);
  }

  /* ================================================================
     5. FRONTIER — target zone + glowing pareto + optimum
     ================================================================ */
  function frontier() {
    var W = 420, H = 262, L = 42, R = 16, T = 40, B = 34;
    var sx = scale(0.2, 1.0, L, W - R), sy = scale(92, 100, H - B, T);
    var feas = [[0.28, 93.2], [0.33, 94.0], [0.38, 93.6], [0.45, 95.0], [0.52, 94.4],
      [0.60, 95.8], [0.68, 96.4], [0.78, 96.9], [0.88, 97.3], [0.95, 97.6]];
    var pareto = [[0.28, 93.6], [0.40, 95.2], [0.55, 97.4], [0.75, 98.3], [0.95, 98.9]];
    var out = '<defs>' + glowDef('fFro') + fadeDef('gFro', C.accent2, 0.10) + '</defs>';
    out += chips([['Pareto', C.accent], ['Feasible', C.silver]], L, 18);
    /* target zone ≥97 */
    out += '<rect x="' + L + '" y="' + sy(100) + '" width="' + (W - R - L) + '" height="' + rr(sy(97) - sy(100)) +
        '" fill="url(#gFro)"' + rise(0.05) + '/>';
    out += dline(L, sy(97), W - R, sy(97), C.accent2, 1.3, 'stroke-dasharray="3 6"');
    out += txt(W - R - 4, sy(97) - 6, 'target zone ≥ 97', C.accent2, 9.5, 'end');
    out += yGrid([92, 94, 96, 98, 100], sy, L, W - R);
    [0.2, 0.4, 0.6, 0.8, 1.0].forEach(function (t) { out += txt(sx(t), H - B + 16, t.toFixed(1), C.faint, 10, 'middle'); });
    out += txt((L + W - R) / 2, H - 5, 'relative material cost', C.faint, 9.5, 'middle');
    feas.forEach(function (q, i) {
      out += '<circle cx="' + sx(q[0]) + '" cy="' + sy(q[1]) + '" r="4.5" fill="none" stroke="' + C.silver +
          '" stroke-width="1.8" opacity="0.7"' + pop(0.1 + i * 0.04) + '/>';
    });
    var pp = pareto.map(function (q) { return [sx(q[0]), sy(q[1])]; });
    out += '<path d="' + smoothPath(pp) + '" fill="none" stroke="' + C.accent + '" stroke-width="2.8" stroke-linecap="round" filter="url(#fFro)"' + draw('', 0.3) + '/>';
    var ox = sx(0.55), oy = sy(97.4);
    out += '<path d="M ' + ox + ' ' + (oy - 9) + ' L ' + (ox + 9) + ' ' + oy + ' L ' + ox + ' ' + (oy + 9) +
        ' L ' + (ox - 9) + ' ' + oy + ' Z" fill="' + C.accent + '" filter="url(#fFro)"' + pop(1.0) + '/>';
    out += '<g' + rise(1.1) + '>' + pill(ox + 14, oy - 12, 'optimum · 0.55', C.accent) + '</g>';
    return svg(W, H, out);
  }

  /* ================================================================
     6. SCRAP CLASSES — dashboard progress list
     ================================================================ */
  function scrap() {
    var W = 420, H = 236, L = 84, R = 52, T = 18;
    var rows = [['Class A', 34, C.accent], ['Class B', 26, C.accent2], ['Class C', 18, C.gold],
      ['Class D', 14, C.bronze], ['Class E', 8, C.silver]];
    var max = 40, bw = W - L - R, bh = 13, gap = 30;
    var out = '<defs>';
    rows.forEach(function (s, i) {
      out += '<linearGradient id="gScr' + i + '" x1="0" y1="0" x2="1" y2="0">' +
          '<stop offset="0" stop-color="' + s[2] + '" stop-opacity="0.55"/>' +
          '<stop offset="1" stop-color="' + s[2] + '" stop-opacity="1"/></linearGradient>';
    });
    out += '</defs>';
    rows.forEach(function (s, i) {
      var y = T + i * (bh + gap);
      out += txt(L - 10, y + bh - 3, s[0], C.dim, 11.5, 'end');
      out += '<rect x="' + L + '" y="' + y + '" width="' + bw + '" height="' + bh + '" rx="6.5" fill="' + C.grid + '" opacity="0.45"/>';
      out += '<rect x="' + L + '" y="' + y + '" width="' + rr(bw * s[1] / max) + '" height="' + bh + '" rx="6.5" fill="url(#gScr' + i + ')"' + grow(0.08 * i) + '/>';
      out += '<g' + rise(0.5 + 0.08 * i) + '>' + txt(L + bw * s[1] / max + 9, y + bh - 2.5, s[1] + '%', C.text, 12, false, 'font-weight="700"') + '</g>';
    });
    out += txt(L, H - 6, '0', C.faint, 9.5, 'middle');
    out += txt(L + bw, H - 6, 'share of detected volume → 40%', C.faint, 9.5, 'end');
    return svg(W, H, out);
  }

  /* ================================================================
     7. PRED VS ACTUAL — identity band + glowing dots + R² pill
     ================================================================ */
  function pred() {
    var W = 420, H = 262, L = 42, R = 16, T = 24, B = 34;
    var sx = scale(70, 100, L, W - R), sy = scale(70, 100, H - B, T);
    var pts = [[72, 73], [75, 74.4], [78, 78.6], [81, 80.2], [84, 84.9], [86, 85.6],
      [88, 88.8], [90, 89.4], [92, 92.7], [94, 93.5], [96, 96.5], [98, 97.8]];
    var out = '<defs>' + glowDef('fPre', 2.2) + '</defs>';
    /* ±2 identity band */
    out += '<path d="M' + sx(70) + ' ' + sy(72) + ' L' + sx(98) + ' ' + sy(100) + ' L' + sx(100) + ' ' + sy(100) +
        ' L' + sx(100) + ' ' + sy(98) + ' L' + sx(72) + ' ' + sy(70) + ' L' + sx(70) + ' ' + sy(70) + ' Z" fill="' +
        C.accent2 + '" opacity="0.08"' + rise(0.05) + '/>';
    out += yGrid([70, 80, 90, 100], sy, L, W - R);
    [70, 80, 90, 100].forEach(function (t) { out += txt(sx(t), H - B + 16, t, C.faint, 10, 'middle'); });
    out += txt((L + W - R) / 2, H - 5, 'actual', C.faint, 9.5, 'middle');
    out += txt(14, (T + H - B) / 2, 'predicted', C.faint, 9.5, 'middle', 'transform="rotate(-90 14 ' + rr((T + H - B) / 2) + ')"');
    out += dline(sx(70), sy(70), sx(100), sy(100), C.faint, 1.3, 'stroke-dasharray="3 6" opacity="0.9"');
    pts.forEach(function (q, i) {
      out += '<circle cx="' + sx(q[0]) + '" cy="' + sy(q[1]) + '" r="4.6" fill="' + C.accent2 + '" filter="url(#fPre)"' + pop(0.1 + i * 0.05) + '/>' +
          '<circle cx="' + sx(q[0]) + '" cy="' + sy(q[1]) + '" r="1.8" fill="' + C.surface + '"' + pop(0.1 + i * 0.05) + '/>';
    });
    out += '<g' + rise(0.8) + '>' + pill(L + 8, T + 8, 'R² = 0.97', C.ok) + '</g>';
    return svg(W, H, out);
  }

  /* ================================================================
     KPI sparklines (mini trend inside the metric cards)
     ================================================================ */
  function sparkline(data, color, idSuffix, invertGood) {
    var W = 120, H = 30, L = 2, R = 2, T = 4, B = 4;
    var lo = Math.min.apply(null, data), hi = Math.max.apply(null, data);
    var sx = scale(0, data.length - 1, L, W - R), sy = scale(lo, hi, H - B, T);
    var p = data.map(function (v, i) { return [sx(i), sy(v)]; });
    var g = 'gSpk' + idSuffix;
    var out = '<defs>' + fadeDef(g, color, 0.35) + '</defs>';
    out += '<path d="' + smoothPath(p) + ' L' + rr(p[p.length - 1][0]) + ' ' + (H - 0) + ' L' + rr(p[0][0]) + ' ' + (H - 0) + ' Z" fill="url(#' + g + ')"' + rise(0.1) + '/>';
    out += '<path d="' + smoothPath(p) + '" fill="none" stroke="' + color + '" stroke-width="2" stroke-linecap="round"' + draw() + '/>';
    out += '<circle cx="' + rr(p[p.length - 1][0]) + '" cy="' + rr(p[p.length - 1][1]) + '" r="2.8" fill="' + color + '"' + pop(0.9) + '/>';
    return '<svg viewBox="0 0 ' + W + ' ' + H + '" width="100%" style="height:auto;display:block" xmlns="http://www.w3.org/2000/svg">' + out + '</svg>';
  }
  function sparkOee()    { return sparkline([78, 80.5, 81.5, 83.5, 84.5, 85.8, 87.5, 88.5, 89.5, 90, 92, 93], C.accent, 'a'); }
  function sparkYield()  { return sparkline([90, 91, 91.5, 92, 92.3, 93, 93.5, 94, 94.2, 94.5, 94.8, 95.1], C.accent2, 'b'); }
  function sparkScrap()  { return sparkline([3.5, 3.4, 3.5, 3.2, 3.1, 3.0, 2.9, 2.9, 2.8, 2.7, 2.7, 2.6], C.gold, 'c'); }
  function sparkEnergy() { return sparkline([0.92, 0.91, 0.92, 0.90, 0.89, 0.88, 0.87, 0.86, 0.85, 0.84, 0.84, 0.83], C.ok, 'd'); }

  /* ================================================================
     render — lazy, scroll-triggered (animations play when seen)
     ================================================================ */
  var builders = {
    'chart-ingestion': ingestion,
    'chart-kpitrend': kpitrend,
    'chart-iso': iso,
    'chart-blend': blend,
    'chart-frontier': frontier,
    'chart-scrap': scrap,
    'chart-pred': pred,
    'spark-oee': sparkOee,
    'spark-yield': sparkYield,
    'spark-scrap': sparkScrap,
    'spark-energy': sparkEnergy
  };

  function renderOne(id) {
    var el = document.getElementById(id);
    if (el && !el.dataset.rendered) { el.innerHTML = builders[id](); el.dataset.rendered = '1'; }
  }

  function renderAll() {
    var ids = Object.keys(builders);
    if (!('IntersectionObserver' in window)) { ids.forEach(renderOne); return; }
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (e.isIntersecting) { renderOne(e.target.id); io.unobserve(e.target); }
      });
    }, { threshold: 0.18, rootMargin: '0px 0px -4% 0px' });
    ids.forEach(function (id) {
      var el = document.getElementById(id);
      if (el) io.observe(el);
    });
  }

  window.Charts = { renderAll: renderAll, builders: builders };
})();