/* ============================================================
   charts.js — dependency-free SVG charts
   - viewBox scaling: identical proportions on any screen
   - colors via CSS variables: adapts to light/dark theme live
   - values labeled in the chart itself (no hover needed on mobile)
   ============================================================ */
(function () {
  'use strict';

  /* ---------- palette (CSS variables) ---------- */
  var C = {
    accent: 'var(--accent)', accent2: 'var(--accent-2)', gold: 'var(--gold)',
    silver: 'var(--silver)', bronze: 'var(--bronze)', ok: 'var(--ok)',
    text: 'var(--text)', dim: 'var(--text-dim)', faint: 'var(--text-faint)',
    grid: 'var(--border)', grid2: 'var(--border-2)', surface: 'var(--surface)'
  };
  var FS = { tick: 10.5, label: 11, value: 11.5, legend: 11 };

  function svg(w, h, body) {
    return '<svg viewBox="0 0 ' + w + ' ' + h + '" width="100%" style="height:auto;display:block" ' +
        'xmlns="http://www.w3.org/2000/svg" font-family="var(--font-mono)" role="img">' + body + '</svg>';
  }
  function txt(x, y, s, fill, size, anchor, extra) {
    return '<text x="' + x + '" y="' + y + '" fill="' + (fill || C.faint) + '" font-size="' + (size || FS.tick) + '"' +
        (anchor ? ' text-anchor="' + anchor + '"' : '') + (extra ? ' ' + extra : '') + '>' + s + '</text>';
  }
  function line(x1, y1, x2, y2, stroke, w, extra) {
    return '<line x1="' + x1 + '" y1="' + y1 + '" x2="' + x2 + '" y2="' + y2 + '" stroke="' + stroke +
        '" stroke-width="' + (w || 1) + '"' + (extra ? ' ' + extra : '') + '/>';
  }
  function r2(n) { return Math.round(n * 100) / 100; }

  /* compact legend row: [[label,color],...] */
  function legend(items, x, y) {
    var out = '', cx = x;
    items.forEach(function (it) {
      out += '<circle cx="' + cx + '" cy="' + (y - 3.5) + '" r="4" fill="' + it[1] + '"/>';
      out += txt(cx + 9, y, it[0], C.dim, FS.legend);
      cx += 9 + it[0].length * 6.6 + 17;
    });
    return out;
  }

  /* linear scale factory */
  function scale(d0, d1, r0, r1) {
    var k = (r1 - r0) / (d1 - d0);
    return function (v) { return r2(r0 + (v - d0) * k); };
  }

  /* y gridlines + tick labels */
  function yAxis(ticks, sy, x0, x1, fmt) {
    var out = '';
    ticks.forEach(function (t) {
      var y = sy(t);
      out += line(x0, y, x1, y, C.grid, 1, 'opacity="0.85"');
      out += txt(x0 - 7, y + 3.5, fmt ? fmt(t) : t, C.faint, FS.tick, 'end');
    });
    return out;
  }

  /* ============ 1. Ingestion — stacked bars ============ */
  function ingestion() {
    var W = 420, H = 250, L = 42, R = 12, T = 34, B = 30;
    var months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug'];
    var series = [
      ['S. America', C.accent,  [120, 135, 128, 150, 162, 158, 175, 182]],
      ['N. America', C.accent2, [60, 64, 61, 70, 74, 72, 80, 84]],
      ['Europe',     C.gold,    [38, 40, 42, 46, 48, 47, 52, 55]],
      ['Asia',       C.silver,  [22, 24, 25, 27, 29, 30, 33, 35]]
    ];
    var sy = scale(0, 380, H - B, T);
    var out = legend(series.map(function (s) { return [s[0], s[1]]; }), L, 16);
    out += yAxis([0, 100, 200, 300], sy, L, W - R);
    var n = months.length, step = (W - L - R) / n, bw = 24;
    months.forEach(function (m, i) {
      var x = r2(L + step * i + (step - bw) / 2), acc = 0;
      series.forEach(function (s) {
        var v = s[2][i], y1 = sy(acc + v), hh = r2(sy(acc) - y1);
        out += '<rect x="' + x + '" y="' + y1 + '" width="' + bw + '" height="' + hh + '" fill="' + s[1] + '" rx="2"/>';
        acc += v;
      });
      out += txt(x + bw / 2, H - B + 16, m, C.faint, FS.tick, 'middle');
    });
    out += txt(L - 30, T - 6, 'GB/day', C.faint, 10);
    return svg(W, H, out);
  }

  /* ============ 2. KPI trend — clean lines, no fill ============ */
  function kpitrend() {
    var W = 420, H = 250, L = 40, R = 46, T = 34, B = 30;
    var oee =   [78, 80.5, 81.5, 83.5, 84.5, 85.8, 87.5, 88.5, 89.5, 90, 92, 93];
    var yieldv = [90, 91, 91.5, 92, 92.3, 93, 93.5, 94, 94.2, 94.5, 94.8, 95.1];
    var months = ['Jan', '', 'Mar', '', 'May', '', 'Jul', '', 'Sep', '', 'Nov', ''];
    var sy = scale(70, 100, H - B, T);
    var sx = scale(0, 11, L, W - R);
    function path(data, stroke) {
      var d = data.map(function (v, i) { return (i ? 'L' : 'M') + sx(i) + ' ' + sy(v); }).join(' ');
      return '<path d="' + d + '" fill="none" stroke="' + stroke + '" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"/>';
    }
    var out = legend([['OEE %', C.accent], ['Yield %', C.accent2], ['Target', C.faint]], L, 16);
    out += yAxis([70, 80, 90, 100], sy, L, W - R);
    months.forEach(function (m, i) { if (m) out += txt(sx(i), H - B + 16, m, C.faint, FS.tick, 'middle'); });
    out += line(L, sy(90), W - R, sy(90), C.faint, 1.4, 'stroke-dasharray="5 5" opacity="0.8"');
    out += path(yieldv, C.accent2) + path(oee, C.accent);
    out += '<circle cx="' + sx(11) + '" cy="' + sy(93) + '" r="4" fill="' + C.accent + '"/>';
    out += '<circle cx="' + sx(11) + '" cy="' + sy(95.1) + '" r="4" fill="' + C.accent2 + '"/>';
    out += txt(sx(11) + 8, sy(93) + 4, '93', C.accent, FS.value, false, 'font-weight="700"');
    out += txt(sx(11) + 8, sy(95.1) + 1, '95.1', C.accent2, FS.value, false, 'font-weight="700"');
    return svg(W, H, out);
  }

  /* ============ 3. ISO 25012 — radar ============ */
  function iso() {
    var W = 420, H = 312, cx = 210, cy = 172, R = 96;
    var dims = ['Accuracy', 'Completeness', 'Consistency', 'Credibility', 'Currentness', 'Compliance'];
    var before = [62, 58, 55, 60, 52, 64], after = [88, 90, 86, 92, 85, 91];
    function pt(i, v) {
      var a = -Math.PI / 2 + i * Math.PI / 3;
      return [r2(cx + Math.cos(a) * R * v / 100), r2(cy + Math.sin(a) * R * v / 100)];
    }
    function poly(vals, stroke, fillOp) {
      var p = vals.map(function (v, i) { return pt(i, v).join(','); }).join(' ');
      return '<polygon points="' + p + '" fill="' + stroke + '" fill-opacity="' + fillOp + '" stroke="' + stroke + '" stroke-width="2"/>';
    }
    var out = legend([['Before', C.silver], ['After', C.accent]], 42, 16);
    [25, 50, 75, 100].forEach(function (g) {
      out += '<polygon points="' + dims.map(function (_, i) { return pt(i, g).join(','); }).join(' ') +
          '" fill="none" stroke="' + C.grid + '" stroke-width="1"/>';
    });
    dims.forEach(function (d, i) {
      var e = pt(i, 100);
      out += line(cx, cy, e[0], e[1], C.grid, 1);
      var lp = pt(i, 121), anchor = 'middle';
      if (lp[0] < cx - 12) anchor = 'end'; else if (lp[0] > cx + 12) anchor = 'start';
      out += txt(lp[0], lp[1] + 4, d, C.dim, 10.5, anchor);
    });
    out += poly(before, C.silver, 0.13) + poly(after, C.accent, 0.16);
    return svg(W, H, out);
  }

  /* ============ 4. Blend — doughnut + value legend ============ */
  function blend() {
    var W = 420, H = 236, cx = 118, cy = 124, r1 = 46, r2o = 76;
    var parts = [['Scrap A', 38, C.accent], ['Scrap B', 27, C.accent2], ['Alloy X', 19, C.gold], ['Flux', 16, C.silver]];
    function arc(a0, a1, color) {
      var lg = (a1 - a0) > Math.PI ? 1 : 0;
      function p(r, a) { return r2(cx + r * Math.cos(a)) + ' ' + r2(cy + r * Math.sin(a)); }
      return '<path d="M ' + p(r2o, a0) + ' A ' + r2o + ' ' + r2o + ' 0 ' + lg + ' 1 ' + p(r2o, a1) +
          ' L ' + p(r1, a1) + ' A ' + r1 + ' ' + r1 + ' 0 ' + lg + ' 0 ' + p(r1, a0) +
          ' Z" fill="' + color + '" stroke="' + C.surface + '" stroke-width="2"/>';
    }
    var out = '', a = -Math.PI / 2;
    parts.forEach(function (s) {
      var a1 = a + s[1] / 100 * 2 * Math.PI;
      out += arc(a, a1, s[2]); a = a1;
    });
    out += txt(cx, cy - 2, '99.2%', C.text, 19, 'middle', 'font-weight="700"');
    out += txt(cx, cy + 16, 'quality', C.faint, 10, 'middle');
    var ly = 62;
    parts.forEach(function (s) {
      out += '<circle cx="232" cy="' + (ly - 4) + '" r="4.5" fill="' + s[2] + '"/>';
      out += txt(243, ly, s[0], C.dim, FS.legend + 1);
      out += txt(382, ly, s[1] + '%', C.text, FS.value + 0.5, 'end', 'font-weight="700"');
      ly += 31;
    });
    return svg(W, H, out);
  }

  /* ============ 5. Cost × quality frontier ============ */
  function frontier() {
    var W = 420, H = 250, L = 42, R = 14, T = 34, B = 34;
    var sx = scale(0.2, 1.0, L, W - R), sy = scale(92, 100, H - B, T);
    var feas = [[0.28, 93.2], [0.33, 94.0], [0.38, 93.6], [0.45, 95.0], [0.52, 94.4],
      [0.60, 95.8], [0.68, 96.4], [0.78, 96.9], [0.88, 97.3], [0.95, 97.6]];
    var pareto = [[0.28, 93.6], [0.40, 95.2], [0.55, 97.4], [0.75, 98.3], [0.95, 98.9]];
    var opt = [0.55, 97.4];
    var out = legend([['Pareto', C.accent], ['Target', C.accent2], ['Feasible', C.silver]], L, 16);
    out += yAxis([92, 94, 96, 98, 100], sy, L, W - R);
    [0.2, 0.4, 0.6, 0.8, 1.0].forEach(function (t) {
      out += txt(sx(t), H - B + 16, t.toFixed(1), C.faint, FS.tick, 'middle');
    });
    out += txt((L + W - R) / 2, H - 4, 'relative material cost', C.faint, 10, 'middle');
    out += line(L, sy(97), W - R, sy(97), C.accent2, 1.4, 'stroke-dasharray="5 5" opacity="0.9"');
    feas.forEach(function (p) {
      out += '<circle cx="' + sx(p[0]) + '" cy="' + sy(p[1]) + '" r="4.5" fill="' + C.silver + '" opacity="0.55"/>';
    });
    out += '<path d="' + pareto.map(function (p, i) { return (i ? 'L' : 'M') + sx(p[0]) + ' ' + sy(p[1]); }).join(' ') +
        '" fill="none" stroke="' + C.accent + '" stroke-width="2.6" stroke-linecap="round"/>';
    var ox = sx(opt[0]), oy = sy(opt[1]);
    out += '<path d="M ' + ox + ' ' + (oy - 8) + ' L ' + (ox + 8) + ' ' + oy + ' L ' + ox + ' ' + (oy + 8) +
        ' L ' + (ox - 8) + ' ' + oy + ' Z" fill="' + C.accent + '"/>';
    out += txt(ox + 13, oy - 8, 'optimum', C.accent, FS.value, false, 'font-weight="700"');
    return svg(W, H, out);
  }

  /* ============ 6. Scrap classes — horizontal bars ============ */
  function scrap() {
    var W = 420, H = 222, L = 86, R = 48, T = 16, B = 28;
    var rows = [['Class A', 34, C.accent], ['Class B', 26, C.accent2], ['Class C', 18, C.gold],
      ['Class D', 14, C.bronze], ['Class E', 8, C.silver]];
    var sx = scale(0, 40, L, W - R);
    var out = '';
    [0, 10, 20, 30, 40].forEach(function (t) {
      out += line(sx(t), T, sx(t), H - B, C.grid, 1, 'opacity="0.85"');
      out += txt(sx(t), H - B + 15, t, C.faint, FS.tick, 'middle');
    });
    var bh = 22, gap = (H - T - B - rows.length * bh) / (rows.length - 1);
    rows.forEach(function (rrow, i) {
      var y = r2(T + i * (bh + gap));
      out += txt(L - 9, y + bh / 2 + 4, rrow[0], C.dim, FS.label, 'end');
      out += '<rect x="' + L + '" y="' + y + '" width="' + r2(sx(rrow[1]) - L) + '" height="' + bh + '" rx="4" fill="' + rrow[2] + '"/>';
      out += txt(sx(rrow[1]) + 8, y + bh / 2 + 4, rrow[1] + '%', C.text, FS.value, false, 'font-weight="700"');
    });
    out += txt((L + W - R) / 2, H - 2, 'share %', C.faint, 10, 'middle');
    return svg(W, H, out);
  }

  /* ============ 7. Predicted vs actual — scatter ============ */
  function pred() {
    var W = 420, H = 250, L = 42, R = 14, T = 22, B = 34;
    var sx = scale(70, 100, L, W - R), sy = scale(70, 100, H - B, T);
    var pts = [[72, 73], [75, 74.4], [78, 78.6], [81, 80.2], [84, 84.9], [86, 85.6],
      [88, 88.8], [90, 89.4], [92, 92.7], [94, 93.5], [96, 96.5], [98, 97.8]];
    var out = yAxis([70, 80, 90, 100], sy, L, W - R);
    [70, 80, 90, 100].forEach(function (t) {
      out += txt(sx(t), H - B + 16, t, C.faint, FS.tick, 'middle');
    });
    out += txt((L + W - R) / 2, H - 4, 'actual', C.faint, 10, 'middle');
    out += txt(14, (T + H - B) / 2, 'pred.', C.faint, 10, 'middle', 'transform="rotate(-90 14 ' + ((T + H - B) / 2) + ')"');
    out += line(sx(70), sy(70), sx(100), sy(100), C.faint, 1.4, 'stroke-dasharray="5 5" opacity="0.8"');
    pts.forEach(function (p) {
      out += '<circle cx="' + sx(p[0]) + '" cy="' + sy(p[1]) + '" r="4.5" fill="' + C.accent2 + '" opacity="0.9"/>';
    });
    out += '<rect x="' + (W - 96) + '" y="' + (T + 4) + '" width="82" height="24" rx="6" fill="none" stroke="' + C.grid2 + '"/>';
    out += txt(W - 55, T + 20, 'R² = 0.97', C.text, FS.value, 'middle', 'font-weight="700"');
    return svg(W, H, out);
  }

  /* ============ render ============ */
  var builders = {
    'chart-ingestion': ingestion,
    'chart-kpitrend': kpitrend,
    'chart-iso': iso,
    'chart-blend': blend,
    'chart-frontier': frontier,
    'chart-scrap': scrap,
    'chart-pred': pred
  };

  function renderAll() {
    for (var id in builders) {
      var el = document.getElementById(id);
      if (el) el.innerHTML = builders[id]();
    }
  }

  window.Charts = { renderAll: renderAll, builders: builders };
})();