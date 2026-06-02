/* ============================================================
   charts.js — Theme-aware SVG mock charts (illustrative data)
   Colors are read from CSS variables so charts adapt to the
   active light/dark theme. Call Charts.renderAll() on load and
   whenever the theme changes.
   ============================================================ */
(function () {
  const V = (n) => getComputedStyle(document.documentElement).getPropertyValue(n).trim();
  const C = () => ({
    accent: V('--accent'), cyan: V('--accent-2'), gold: V('--gold'),
    bronze: V('--bronze'), silver: V('--silver'), ok: V('--ok'),
    border: V('--border'), border2: V('--border-2'),
    dim: V('--text-dim'), faint: V('--text-faint'), surface: V('--surface')
  });
  const MONO = "'JetBrains Mono', monospace";
  const set = (id, svg) => { const el = document.getElementById(id); if (el) el.innerHTML = svg; };
  const S = (w, h) => `<svg viewBox="0 0 ${w} ${h}" width="100%" style="height:auto;display:block" xmlns="http://www.w3.org/2000/svg" font-family="${MONO}">`;

  /* ---- 1. Stacked bars: ingestion volume by region ---- */
  function ingestion() {
    const c = C(), w = 520, h = 250, x0 = 46, x1 = 506, y0 = 26, y1 = 198;
    const labels = ['W1', 'W2', 'W3', 'W4', 'W5', 'W6', 'W7'];
    const data = [
      [70, 32, 18], [80, 35, 20], [76, 34, 18], [88, 40, 22],
      [95, 43, 24], [92, 42, 24], [102, 46, 27]
    ];
    const max = 180, scale = (y1 - y0) / max;
    const slot = (x1 - x0) / labels.length, bw = 30;
    let g = '';
    for (let i = 1; i <= 4; i++) { const y = y1 - (i * 40) * scale; g += `<line class="cx-grid" x1="${x0}" y1="${y}" x2="${x1}" y2="${y}"/><text class="cx-text" x="${x0 - 8}" y="${y + 3}" text-anchor="end">${i * 40}</text>`; }
    let bars = '';
    data.forEach((d, i) => {
      const x = x0 + i * slot + (slot - bw) / 2;
      let acc = y1;
      const segs = [[d[0], c.accent], [d[1], c.cyan], [d[2], c.gold]];
      segs.forEach(([v, col]) => { const hh = v * scale; acc -= hh; bars += `<rect x="${x}" y="${acc}" width="${bw}" height="${hh}" fill="${col}" rx="1.5"/>`; });
      bars += `<text class="cx-text" x="${x + bw / 2}" y="${y1 + 16}" text-anchor="middle">${labels[i]}</text>`;
    });
    const leg = [['Brazil', c.accent], ['North America', c.cyan], ['Europe', c.gold]];
    let lg = '', lx = x0;
    leg.forEach(([t, col]) => { lg += `<rect x="${lx}" y="${h - 14}" width="11" height="11" rx="2" fill="${col}"/><text class="cx-text-d" x="${lx + 16}" y="${h - 5}">${t}</text>`; lx += t.length * 6.6 + 34; });
    set('chart-ingestion', S(w, h) +
      `<line class="cx-axis" x1="${x0}" y1="${y1}" x2="${x1}" y2="${y1}"/>` +
      `<text class="cx-text" x="${x0 - 30}" y="${y0 + 2}" transform="rotate(-90 ${x0 - 30} ${(y0 + y1) / 2})" text-anchor="middle">GB / day</text>` +
      g + bars + lg + `</svg>`);
  }

  /* ---- 2a. KPI trend line ---- */
  function kpiTrend() {
    const c = C(), w = 520, h = 170, x0 = 40, x1 = 508, y0 = 18, y1 = 132;
    const vals = [78, 81, 80, 84, 86, 85, 88, 90, 89, 91, 93, 94], target = 90;
    const lo = 70, hi = 100, sx = (x1 - x0) / (vals.length - 1), sy = (y1 - y0) / (hi - lo);
    const px = (i) => x0 + i * sx, py = (v) => y1 - (v - lo) * sy;
    let grid = '';
    [70, 80, 90, 100].forEach(v => { const y = py(v); grid += `<line class="cx-grid" x1="${x0}" y1="${y}" x2="${x1}" y2="${y}"/><text class="cx-text" x="${x0 - 7}" y="${y + 3}" text-anchor="end">${v}</text>`; });
    let line = `M ${px(0)} ${py(vals[0])}`, area = `M ${px(0)} ${y1} L ${px(0)} ${py(vals[0])}`;
    vals.forEach((v, i) => { if (i) { line += ` L ${px(i)} ${py(v)}`; area += ` L ${px(i)} ${py(v)}`; } });
    area += ` L ${px(vals.length - 1)} ${y1} Z`;
    const months = ['J', 'F', 'M', 'A', 'M', 'J', 'J', 'A', 'S', 'O', 'N', 'D'];
    let mx = ''; months.forEach((m, i) => mx += `<text class="cx-text" x="${px(i)}" y="${y1 + 14}" text-anchor="middle">${m}</text>`);
    set('chart-kpitrend', S(w, h) +
      `<defs><linearGradient id="kpgrad" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${c.accent}" stop-opacity="0.32"/><stop offset="1" stop-color="${c.accent}" stop-opacity="0"/></linearGradient></defs>` +
      grid +
      `<line x1="${x0}" y1="${py(target)}" x2="${x1}" y2="${py(target)}" stroke="${c.cyan}" stroke-width="1.3" stroke-dasharray="5 4"/>` +
      `<text class="cx-text" x="${x1}" y="${py(target) - 5}" text-anchor="end" fill="${c.cyan}">target ${target}</text>` +
      `<path d="${area}" fill="url(#kpgrad)"/>` +
      `<path d="${line}" fill="none" stroke="${c.accent}" stroke-width="2.4" stroke-linejoin="round"/>` +
      `<circle cx="${px(vals.length - 1)}" cy="${py(vals[vals.length - 1])}" r="4.5" fill="${c.accent}"/>` +
      mx + `</svg>`);
  }

  /* ---- 2b. ISO 25012 radar ---- */
  function isoRadar() {
    const c = C(), w = 360, h = 300, cx = 180, cy = 140, R = 96;
    const axes = ['Accuracy', 'Completeness', 'Consistency', 'Credibility', 'Currentness', 'Accessibility'];
    const vals = [94, 88, 96, 90, 83, 86];
    const n = axes.length, ang = (i) => (-90 + i * 360 / n) * Math.PI / 180;
    const pt = (i, r) => [cx + Math.cos(ang(i)) * r, cy + Math.sin(ang(i)) * r];
    let rings = '';
    [0.25, 0.5, 0.75, 1].forEach(f => {
      let p = '';
      for (let i = 0; i < n; i++) { const [x, y] = pt(i, R * f); p += (i ? 'L' : 'M') + x + ' ' + y + ' '; }
      rings += `<path d="${p}Z" fill="none" class="cx-grid"/>`;
    });
    let spokes = '', labels = '';
    for (let i = 0; i < n; i++) {
      const [x, y] = pt(i, R); spokes += `<line x1="${cx}" y1="${cy}" x2="${x}" y2="${y}" class="cx-grid"/>`;
      const [lx, ly] = pt(i, R + 22);
      const anchor = Math.abs(lx - cx) < 8 ? 'middle' : (lx > cx ? 'start' : 'end');
      labels += `<text class="cx-text-d" x="${lx}" y="${ly + 3}" text-anchor="${anchor}">${axes[i]}</text>`;
      labels += `<text class="cx-text" x="${(pt(i, R + 9))[0]}" y="${(pt(i, R + 9))[1] + 3}" text-anchor="${anchor}" fill="${c.faint}"></text>`;
    }
    let poly = '';
    for (let i = 0; i < n; i++) { const [x, y] = pt(i, R * vals[i] / 100); poly += (i ? 'L' : 'M') + x + ' ' + y + ' '; }
    let dots = '';
    for (let i = 0; i < n; i++) { const [x, y] = pt(i, R * vals[i] / 100); dots += `<circle cx="${x}" cy="${y}" r="3" fill="${c.accent}"/>`; }
    set('chart-iso', S(w, h) + rings + spokes +
      `<path d="${poly}Z" fill="${c.accent}" fill-opacity="0.16" stroke="${c.accent}" stroke-width="2"/>` +
      dots + labels + `</svg>`);
  }

  /* ---- 3a. Blend composition (horizontal stacked) ---- */
  function blend() {
    const c = C(), w = 520, h = 150, x0 = 16, x1 = 504, y = 30, bh = 40;
    const segs = [['Material A', 38, c.accent], ['Material B', 27, c.cyan], ['Material C', 19, c.gold], ['Material D', 11, c.bronze], ['Additives', 5, c.silver]];
    const tot = x1 - x0; let x = x0, bars = '', leg = '', lx = x0, ly = 96;
    segs.forEach(([t, v, col], i) => {
      const ww = tot * v / 100;
      bars += `<rect x="${x}" y="${y}" width="${ww}" height="${bh}" fill="${col}" ${i === 0 ? 'rx="4"' : ''}/>`;
      if (ww > 30) bars += `<text x="${x + ww / 2}" y="${y + bh / 2 + 4}" text-anchor="middle" font-size="12" fill="#0a0c11" font-weight="700">${v}%</text>`;
      x += ww;
      if (i % 3 === 0 && i) { lx = x0; ly += 24; }
      leg += `<rect x="${lx}" y="${ly}" width="11" height="11" rx="2" fill="${col}"/><text class="cx-text-d" x="${lx + 16}" y="${ly + 9}">${t} · ${v}%</text>`;
      lx += t.length * 6.4 + 56;
    });
    set('chart-blend', S(w, h) +
      `<text class="cx-text" x="${x0}" y="${y - 8}">RECOMMENDED MIX → target quality 99.2%</text>` +
      bars + leg + `</svg>`);
  }

  /* ---- 3b. Cost vs quality frontier ---- */
  function frontier() {
    const c = C(), w = 520, h = 230, x0 = 48, x1 = 504, y0 = 20, y1 = 184;
    let grid = '';
    [0, 1, 2, 3, 4].forEach(i => { const y = y1 - i * (y1 - y0) / 4; grid += `<line class="cx-grid" x1="${x0}" y1="${y}" x2="${x1}" y2="${y}"/><text class="cx-text" x="${x0 - 7}" y="${y + 3}" text-anchor="end">${90 + i * 2.5}</text>`; });
    // frontier curve
    const fp = (t) => { const x = x0 + t * (x1 - x0); const y = y1 - (Math.pow(t, 0.55)) * (y1 - y0) * 0.96; return [x, y]; };
    let curve = ''; for (let i = 0; i <= 40; i++) { const [x, y] = fp(i / 40); curve += (i ? 'L' : 'M') + x.toFixed(1) + ' ' + y.toFixed(1) + ' '; }
    // feasible scatter
    const pts = [[0.18, 0.28], [0.3, 0.22], [0.42, 0.46], [0.55, 0.4], [0.68, 0.66], [0.8, 0.58], [0.36, 0.62], [0.6, 0.78], [0.25, 0.5], [0.72, 0.84], [0.5, 0.6], [0.85, 0.74]];
    let dots = '';
    pts.forEach(([tx, ty]) => { const x = x0 + tx * (x1 - x0); const y = y1 - ty * (y1 - y0); dots += `<circle cx="${x}" cy="${y}" r="3.4" fill="${c.faint}" fill-opacity="0.7"/>`; });
    // optimum
    const [ox, oy] = fp(0.46);
    const tgtY = y1 - 0.62 * (y1 - y0);
    set('chart-frontier', S(w, h) + grid +
      `<line class="cx-axis" x1="${x0}" y1="${y1}" x2="${x1}" y2="${y1}"/>` +
      `<line x1="${x0}" y1="${tgtY}" x2="${x1}" y2="${tgtY}" stroke="${c.cyan}" stroke-width="1.2" stroke-dasharray="5 4"/>` +
      `<text class="cx-text" x="${x1}" y="${tgtY - 5}" text-anchor="end" fill="${c.cyan}">quality target</text>` +
      dots +
      `<path d="${curve}" fill="none" stroke="${c.accent}" stroke-width="2.2" opacity="0.9"/>` +
      `<circle cx="${ox}" cy="${oy}" r="6.5" fill="${c.accent}"/><circle cx="${ox}" cy="${oy}" r="11" fill="none" stroke="${c.accent}" stroke-width="1.4" opacity="0.6"/>` +
      `<text class="cx-text-d" x="${ox + 16}" y="${oy + 4}" fill="${c.accent}">optimum</text>` +
      `<text class="cx-text" x="${(x0 + x1) / 2}" y="${h - 4}" text-anchor="middle">relative material cost →</text>` +
      `</svg>`);
  }

  /* ---- 4. Scrap class distribution ---- */
  function scrapDist() {
    const c = C(), w = 520, h = 220, x0 = 92, x1 = 470;
    const data = [['Class A', 34, 0.98], ['Class B', 26, 0.96], ['Class C', 18, 0.94], ['Class D', 14, 0.91], ['Class E', 8, 0.89]];
    const max = 34, rowH = 34, top = 16;
    let rows = '';
    data.forEach((d, i) => {
      const y = top + i * rowH, ww = (d[1] / max) * (x1 - x0);
      const col = i === 0 ? c.accent : (i === 1 ? c.cyan : c.bronze);
      rows += `<text class="cx-text-d" x="${x0 - 10}" y="${y + 15}" text-anchor="end">${d[0]}</text>`;
      rows += `<rect x="${x0}" y="${y + 4}" width="${x1 - x0}" height="16" rx="3" class="cx-surface2"/>`;
      rows += `<rect x="${x0}" y="${y + 4}" width="${ww}" height="16" rx="3" fill="${col}"/>`;
      rows += `<text class="cx-text" x="${x0 + ww + 8}" y="${y + 16}">${d[1]}%</text>`;
      rows += `<text class="cx-text" x="${x1 + 6}" y="${y + 16}" fill="${c.ok}">conf ${d[2].toFixed(2)}</text>`;
    });
    set('chart-scrap', S(w, h) + rows + `</svg>`);
  }

  /* ---- 5. Predicted vs actual scatter ---- */
  function predActual() {
    const c = C(), w = 520, h = 250, x0 = 46, x1 = 502, y0 = 18, y1 = 198;
    let grid = '';
    [0, 1, 2, 3, 4].forEach(i => {
      const y = y1 - i * (y1 - y0) / 4, x = x0 + i * (x1 - x0) / 4;
      grid += `<line class="cx-grid" x1="${x0}" y1="${y}" x2="${x1}" y2="${y}"/>`;
      grid += `<text class="cx-text" x="${x0 - 7}" y="${y + 3}" text-anchor="end">${i * 25}</text>`;
      grid += `<text class="cx-text" x="${x}" y="${y1 + 15}" text-anchor="middle">${i * 25}</text>`;
    });
    // deterministic pseudo points near diagonal
    let dots = ''; let seed = 7;
    const rnd = () => { seed = (seed * 9301 + 49297) % 233280; return seed / 233280; };
    for (let i = 0; i < 46; i++) {
      const t = rnd(); const noise = (rnd() - 0.5) * 0.14;
      const ax = t, ay = Math.min(0.99, Math.max(0.01, t + noise));
      const x = x0 + ax * (x1 - x0), y = y1 - ay * (y1 - y0);
      dots += `<circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="3.2" fill="${c.accent}" fill-opacity="0.62"/>`;
    }
    set('chart-pred', S(w, h) + grid +
      `<line class="cx-axis" x1="${x0}" y1="${y1}" x2="${x1}" y2="${y1}"/>` +
      `<line class="cx-axis" x1="${x0}" y1="${y0}" x2="${x0}" y2="${y1}"/>` +
      `<line x1="${x0}" y1="${y1}" x2="${x1}" y2="${y0}" stroke="${c.cyan}" stroke-width="1.5" stroke-dasharray="5 4"/>` +
      `<text class="cx-text" x="${x1 - 6}" y="${y0 + 14}" text-anchor="end" fill="${c.cyan}">y = x</text>` +
      dots +
      `<rect x="${x0 + 10}" y="${y0 + 8}" width="92" height="24" rx="6" class="cx-surface" stroke="${c.border2}"/>` +
      `<text x="${x0 + 18}" y="${y0 + 24}" font-size="12" fill="${c.dim}">R² = 0.97</text>` +
      `<text class="cx-text" x="${(x0 + x1) / 2}" y="${h - 4}" text-anchor="middle">actual →   |   ↑ predicted</text>` +
      `</svg>`);
  }

  function renderAll() {
    try {
      ingestion(); kpiTrend(); isoRadar(); blend(); frontier(); scrapDist(); predActual();
    } catch (e) { /* fail-safe: charts are decorative */ console.warn(e); }
  }

  window.Charts = { renderAll };
})();
