/* ============================================================
   charts.js — Interactive, responsive charts (Chart.js v4)
   Illustrative data. Colors are read from the active theme's
   CSS variables, so charts adapt to light/dark. Charts are
   destroyed and rebuilt on theme change (Charts.renderAll()).
   ============================================================ */
(function () {
  const MONO = "'JetBrains Mono', ui-monospace, monospace";
  const css = (n) => getComputedStyle(document.documentElement).getPropertyValue(n).trim();

  function P() {
    return {
      accent: css('--accent'), cyan: css('--accent-2'), gold: css('--gold'),
      bronze: css('--bronze'), silver: css('--silver'), ok: css('--ok'),
      grid: css('--border'), axis: css('--border-2'),
      tick: css('--text-faint'), label: css('--text-dim'),
      surface: css('--surface'), text: css('--text')
    };
  }
  function rgba(hex, a) {
    hex = (hex || '#888').replace('#', '');
    if (hex.length === 3) hex = hex.split('').map(c => c + c).join('');
    const n = parseInt(hex, 16);
    return `rgba(${(n >> 16) & 255},${(n >> 8) & 255},${n & 255},${a})`;
  }

  let instances = [];
  let mob = false;
  function add(id, cfg) {
    const el = document.getElementById(id);
    if (!el || typeof Chart === 'undefined') return;
    instances.push(new Chart(el.getContext('2d'), cfg));
  }

  function common(p, extra) {
    return Object.assign({
      responsive: true,
      maintainAspectRatio: false,
      interaction: { mode: 'nearest', intersect: false },
      plugins: {
        legend: {
          labels: {
            color: p.label, usePointStyle: true, boxWidth: mob ? 7 : 9, boxHeight: mob ? 7 : 9, padding: mob ? 9 : 16,
            font: { family: MONO, size: mob ? 10.5 : 12.5 }
          }
        },
        tooltip: {
          backgroundColor: rgba(p.surface, 0.97), titleColor: p.text, bodyColor: p.label,
          borderColor: p.axis, borderWidth: 1, padding: 12, cornerRadius: 8,
          titleFont: { family: MONO, size: 13 }, bodyFont: { family: MONO, size: 13 },
          footerFont: { family: MONO, size: 12 }, footerColor: p.tick
        }
      }
    }, extra || {});
  }
  function axis(p, title, opts) {
    return Object.assign({
      grid: { color: p.grid, drawTicks: false },
      border: { color: p.axis, display: true },
      ticks: { color: p.tick, font: { family: MONO, size: mob ? 10 : 12 }, padding: 5, autoSkip: true, maxRotation: 0, autoSkipPadding: 10, maxTicksLimit: mob ? 7 : 13 },
      title: title ? { display: !mob, text: title, color: p.label, font: { family: MONO, size: 11 } } : undefined
    }, opts || {});
  }

  /* ---- 1 · Ingestion: stacked bars by continent ---- */
  function ingestion(p) {
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug'];
    add('chart-ingestion', {
      type: 'bar',
      data: {
        labels: months,
        datasets: [
          { label: 'S. America', data: [120, 135, 128, 150, 162, 158, 175, 182], backgroundColor: rgba(p.accent, 0.9), borderRadius: 3, stack: 's' },
          { label: 'N. America', data: [80, 86, 90, 98, 104, 101, 110, 118], backgroundColor: rgba(p.cyan, 0.9), borderRadius: 3, stack: 's' },
          { label: 'Europe', data: [60, 64, 66, 72, 78, 76, 82, 88], backgroundColor: rgba(p.gold, 0.9), borderRadius: 3, stack: 's' },
          { label: 'Asia', data: [22, 28, 30, 36, 41, 44, 52, 60], backgroundColor: rgba(p.silver, 0.85), borderRadius: 3, stack: 's' }
        ]
      },
      options: common(p, {
        scales: {
          x: axis(p, null, { stacked: true, grid: { display: false } }),
          y: axis(p, 'GB / day', { stacked: true, beginAtZero: true })
        },
        plugins: {
          tooltip: {
            callbacks: {
              footer: (items) => 'Total: ' + items.reduce((s, i) => s + i.parsed.y, 0) + ' GB/day'
            }
          }
        }
      })
    });
  }

  /* ---- 2a · KPI trend (multi-line + target) ---- */
  function kpiTrend(p) {
    const m = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    add('chart-kpitrend', {
      type: 'line',
      data: {
        labels: m,
        datasets: [
          { label: 'OEE %', data: [78, 80, 81, 83, 84, 85, 86, 88, 89, 90, 92, 93], borderColor: p.accent, backgroundColor: rgba(p.accent, 0.12), fill: true, tension: 0.35, borderWidth: 2.4, pointRadius: 0, pointHoverRadius: 5 },
          { label: 'Yield %', data: [90, 90.5, 91, 91.4, 92, 92.3, 93, 93.4, 93.9, 94.1, 94.6, 95], borderColor: p.cyan, backgroundColor: 'transparent', tension: 0.35, borderWidth: 2.4, pointRadius: 0, pointHoverRadius: 5 },
          { label: 'Target', data: Array(12).fill(90), borderColor: p.tick, borderDash: [5, 4], borderWidth: 1.3, pointRadius: 0, fill: false }
        ]
      },
      options: common(p, {
        scales: {
          x: axis(p, null, { grid: { display: false } }),
          y: axis(p, '%', { suggestedMin: 70, suggestedMax: 100 })
        }
      })
    });
  }

  /* ---- 2b · ISO 25012 radar (before vs after observability) ---- */
  function isoRadar(p) {
    add('chart-iso', {
      type: 'radar',
      data: {
        labels: ['Accuracy', 'Completeness', 'Consistency', 'Credibility', 'Currentness', 'Accessibility', 'Compliance'],
        datasets: [
          { label: 'Before', data: [70, 64, 72, 68, 60, 62, 66], borderColor: rgba(p.silver, 0.9), backgroundColor: rgba(p.silver, 0.12), borderWidth: 1.6, pointRadius: 2.5, pointBackgroundColor: p.silver },
          { label: 'After observability', data: [94, 88, 96, 90, 86, 89, 92], borderColor: p.accent, backgroundColor: rgba(p.accent, 0.16), borderWidth: 2, pointRadius: 3, pointBackgroundColor: p.accent }
        ]
      },
      options: common(p, {
        scales: {
          r: {
            min: 40, max: 100,
            grid: { color: p.grid }, angleLines: { color: p.grid },
            pointLabels: { color: p.label, font: { family: MONO, size: mob ? 9.5 : 12 } },
            ticks: { display: false, stepSize: 20 }
          }
        }
      })
    });
  }

  /* ---- 3a · Blend composition (doughnut) ---- */
  function blend(p) {
    add('chart-blend', {
      type: 'doughnut',
      data: {
        labels: ['Material A', 'Material B', 'Material C', 'Material D', 'Additives'],
        datasets: [{
          data: [38, 27, 19, 11, 5],
          backgroundColor: [p.accent, p.cyan, p.gold, p.bronze, p.silver],
          borderColor: p.surface, borderWidth: 2, hoverOffset: 8
        }]
      },
      options: common(p, {
        cutout: '58%',
        plugins: {
          legend: { position: 'bottom' },
          tooltip: { callbacks: { label: (c) => ` ${c.label}: ${c.parsed}%` } }
        }
      })
    });
  }

  /* ---- 3b · Cost vs quality frontier (scatter + line) ---- */
  function frontier(p) {
    const feasible = [
      { x: 0.40, y: 94.5 }, { x: 0.50, y: 95.5 }, { x: 0.60, y: 96.0 },
      { x: 0.75, y: 97.2 }, { x: 0.85, y: 98.0 }, { x: 0.35, y: 93.8 },
      { x: 0.48, y: 95.0 }, { x: 0.66, y: 96.6 }, { x: 0.90, y: 98.4 }
    ];
    const front = [
      { x: 0.30, y: 95.2 }, { x: 0.42, y: 96.8 }, { x: 0.55, y: 97.5 },
      { x: 0.68, y: 98.3 }, { x: 0.80, y: 98.9 }, { x: 0.92, y: 99.3 }
    ];
    add('chart-frontier', {
      type: 'scatter',
      data: {
        datasets: [
          { type: 'line', label: 'Pareto frontier', data: front, borderColor: p.accent, borderWidth: 2.2, tension: 0.3, pointRadius: 0, fill: false },
          { type: 'line', label: 'Quality target', data: [{ x: 0.25, y: 97.5 }, { x: 0.97, y: 97.5 }], borderColor: p.cyan, borderDash: [5, 4], borderWidth: 1.3, pointRadius: 0, fill: false },
          { label: 'Feasible mixes', data: feasible, backgroundColor: rgba(p.tick, 0.7), pointRadius: 4, pointHoverRadius: 6 },
          { label: 'Selected optimum', data: [{ x: 0.55, y: 97.5 }], backgroundColor: p.accent, pointRadius: 7, pointHoverRadius: 9, pointStyle: 'rectRot' }
        ]
      },
      options: common(p, {
        scales: {
          x: axis(p, 'Relative material cost', { min: 0.2, max: 1.0 }),
          y: axis(p, 'Quality %', { min: 92, max: 100 })
        },
        plugins: { tooltip: { callbacks: { label: (c) => `${c.dataset.label}: cost ${c.parsed.x}, quality ${c.parsed.y}%` } } }
      })
    });
  }

  /* ---- 4 · Scrap class distribution (horizontal bars) ---- */
  function scrapDist(p) {
    const conf = [0.98, 0.96, 0.94, 0.91, 0.89], tons = [510, 390, 270, 210, 120];
    add('chart-scrap', {
      type: 'bar',
      data: {
        labels: ['Class A', 'Class B', 'Class C', 'Class D', 'Class E'],
        datasets: [{
          label: 'Volume share %',
          data: [34, 26, 18, 14, 8],
          backgroundColor: [p.accent, p.cyan, p.gold, p.bronze, p.silver],
          borderRadius: 4
        }]
      },
      options: common(p, {
        indexAxis: 'y',
        scales: {
          x: axis(p, 'Share %', { beginAtZero: true, suggestedMax: 40 }),
          y: axis(p, null, { grid: { display: false } })
        },
        plugins: {
          legend: { display: false },
          tooltip: {
            callbacks: {
              label: (c) => ` Share: ${c.parsed.x}%`,
              footer: (items) => { const i = items[0].dataIndex; return `Confidence: ${conf[i].toFixed(2)} · ${tons[i]} t/mo`; }
            }
          }
        }
      })
    });
  }

  /* ---- 5 · Predicted vs actual (scatter + identity) ---- */
  function predActual(p) {
    let seed = 7; const rnd = () => { seed = (seed * 9301 + 49297) % 233280; return seed / 233280; };
    const pts = [];
    for (let i = 0; i < 44; i++) {
      const a = 62 + rnd() * 36;
      const pr = Math.min(99.5, Math.max(60, a + (rnd() - 0.5) * 6));
      pts.push({ x: +a.toFixed(1), y: +pr.toFixed(1) });
    }
    add('chart-pred', {
      type: 'scatter',
      data: {
        datasets: [
          { type: 'line', label: 'Ideal (y = x)', data: [{ x: 60, y: 60 }, { x: 100, y: 100 }], borderColor: p.cyan, borderDash: [5, 4], borderWidth: 1.5, pointRadius: 0, fill: false },
          { label: 'Samples', data: pts, backgroundColor: rgba(p.accent, 0.62), pointRadius: 3.5, pointHoverRadius: 6 }
        ]
      },
      options: common(p, {
        scales: {
          x: axis(p, 'Actual', { min: 58, max: 102 }),
          y: axis(p, 'Predicted', { min: 58, max: 102 })
        },
        plugins: {
          subtitle: { display: true, text: 'R² = 0.97   ·   MAE = 1.8', color: p.tick, font: { family: MONO, size: 12.5 }, padding: { bottom: 8 } },
          tooltip: { callbacks: { label: (c) => `actual ${c.parsed.x} · predicted ${c.parsed.y}` } }
        }
      })
    });
  }

  function renderAll() {
    if (typeof Chart === 'undefined') return;
    Chart.defaults.font.family = MONO;
    Chart.defaults.font.size = 12;
    mob = (window.innerWidth || 1024) <= 560;
    instances.forEach(c => { try { c.destroy(); } catch (e) {} });
    instances = [];
    const p = P();
    try {
      ingestion(p); kpiTrend(p); isoRadar(p); blend(p); frontier(p); scrapDist(p); predActual(p);
    } catch (e) { console.warn('charts:', e); }
  }

  window.Charts = { renderAll };
})();