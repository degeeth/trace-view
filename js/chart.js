// ── Profil altimétrique (Chart.js) ──────────────────────────────────────
// Dessiné sur le tracé complet (tous les points GPS) pour rester précis en zoom.
// Survoler ou glisser le doigt sur le profil déplace un curseur sur la carte.
import { on, emit } from './bus.js';
import { CAT_COLORS, slopeColor, brandIconBox, brandIconImage, brandIconColor, SUPPLIES, suppliesByCategory, supplyText, escapeHtml } from './race.js';
import { icon } from './icons.js';

const INK = '#04080b';
// Repères permanents (même légende que sous le titre du profil)
export const LANDMARK_COLORS = { peak: '#f39c12' };
// Départ et arrivée : encre de l'identité (variable CSS --gt-night), sobre
const endpointInk = () => getComputedStyle(document.documentElement).getPropertyValue('--gt-night').trim() || '#141e28';

function hexAlpha(hex, alpha) {
  const a = Math.round(alpha * 255).toString(16).padStart(2, '0');
  return hex + a;
}

export function createChart(race, { canvas, wrap, rvBar, infoEl, resetBtn }) {
  const traceColor = race.branding.traceColor;
  const accent = race.branding.accentColor;
  const colored = race.climbs.filter(c => c.cat !== 'blanc');
  const slopeColors = race.slope.map(slopeColor);
  const points = race.dist.map((d, i) => ({ x: d, y: race.ele[i] }));

  let traceMode = 'ravitaillements';
  let selected = null;
  let cursorKm = null;
  let zoomed = false;

  // Icône de ravitaillement dessinée sur le canvas
  const aidImg = brandIconImage(race, brandIconColor(race), 40);

  const waypoints = () => [
    { km: 0, name: 'Départ', kind: 'start' },
    ...race.aidStations.map(a => ({ km: a.km, name: a.name, kind: 'aid', aid: a })),
    { km: race.totalKm, name: 'Arrivée', kind: 'end' }
  ];
  const eleAtKm = km => race.ele[race.idxAtKm(km)];

  // ── Plugins de dessin ──
  const plugins = [
    {
      // Bandes colorées des côtes (mode « Côtes »)
      id: 'climbBands',
      beforeDatasetsDraw(chart) {
        if (traceMode !== 'climbs') return;
        const { ctx, chartArea: area, scales: { x, y } } = chart;
        ctx.save();
        ctx.beginPath(); ctx.rect(area.left, area.top, area.width, area.height); ctx.clip();
        colored.forEach(c => {
          const color = CAT_COLORS[c.cat];
          const x1 = x.getPixelForValue(c.startKm), x2 = x.getPixelForValue(c.endKm);
          ctx.fillStyle = hexAlpha(color, 0.16);
          ctx.fillRect(x1, y.top, x2 - x1, y.bottom - y.top);
          ctx.fillStyle = color;
          ctx.fillRect(x1, y.top, x2 - x1, 3);
        });
        ctx.restore();
      }
    },
    {
      // Côte sélectionnée : zone ombrée + bornes pointillées
      id: 'selectedClimb',
      beforeDatasetsDraw(chart) {
        if (!selected) return;
        const { ctx, scales: { x, y } } = chart;
        const x1 = x.getPixelForValue(selected.startKm), x2 = x.getPixelForValue(selected.endKm);
        ctx.save();
        ctx.fillStyle = hexAlpha(accent, 0.12);
        ctx.fillRect(x1, y.top, x2 - x1, y.bottom - y.top);
        ctx.restore();
      },
      afterDatasetsDraw(chart) {
        if (!selected) return;
        const { ctx, scales: { x, y } } = chart;
        ctx.save();
        ctx.strokeStyle = accent;
        ctx.lineWidth = 1.5;
        ctx.setLineDash([5, 4]);
        [selected.startKm, selected.endKm].forEach(km => {
          const px = x.getPixelForValue(km);
          ctx.beginPath(); ctx.moveTo(px, y.top); ctx.lineTo(px, y.bottom); ctx.stroke();
        });
        ctx.restore();
      }
    },
    {
      // Repères permanents : départ, point culminant, arrivée, ravitaillements
      // (en mode « Ravitaillements » : pastilles plus grandes + lignes verticales)
      id: 'landmarks',
      afterDatasetsDraw(chart) {
        const { ctx, chartArea: area, scales: { x, y } } = chart;
        const isAid = traceMode === 'ravitaillements';
        const visible = px => px >= area.left - 1 && px <= area.right + 1;
        const dot = (px, py, color, r = 5) => {
          ctx.beginPath(); ctx.arc(px, py, r, 0, Math.PI * 2);
          ctx.fillStyle = color; ctx.strokeStyle = '#fff'; ctx.lineWidth = 2;
          ctx.fill(); ctx.stroke();
        };
        ctx.save();
        waypoints().forEach(wp => {
          const px = x.getPixelForValue(wp.km);
          if (!visible(px)) return;
          const py = y.getPixelForValue(eleAtKm(wp.km));
          if (isAid) {
            ctx.save();
            ctx.setLineDash([5, 5]);
            ctx.strokeStyle = wp.kind === 'aid' ? 'rgba(4,8,11,.35)' : 'rgba(120,120,120,.4)';
            ctx.lineWidth = 1;
            ctx.beginPath(); ctx.moveTo(px, y.top); ctx.lineTo(px, y.bottom); ctx.stroke();
            ctx.restore();
          }
          if (wp.kind === 'start') {   // anneau
            ctx.beginPath(); ctx.arc(px, py, 5, 0, Math.PI * 2);
            ctx.fillStyle = '#fff'; ctx.strokeStyle = endpointInk(); ctx.lineWidth = 2.5; ctx.fill(); ctx.stroke(); return;
          }
          if (wp.kind === 'end') { dot(px, py, endpointInk()); return; }
          // Petite pastille blanche (18 px, comme l'ancienne icône de la barre) et icône de l'identité, sur la courbe
          ctx.save();
          ctx.shadowColor = 'rgba(0,0,0,.35)'; ctx.shadowBlur = 3; ctx.shadowOffsetY = 1;
          ctx.beginPath(); ctx.arc(px, py, 9, 0, Math.PI * 2);
          ctx.fillStyle = '#fff'; ctx.fill();
          ctx.restore();
          const { width: iw, height: ih } = brandIconBox(race, 13);
          if (aidImg.complete) ctx.drawImage(aidImg, px - iw / 2, py - ih / 2, iw, ih);
        });
        // Point culminant + son altitude
        const px = x.getPixelForValue(race.peak.km);
        if (visible(px)) {
          const py = y.getPixelForValue(race.peak.ele);
          dot(px, py, LANDMARK_COLORS.peak);
          ctx.font = `700 10px ${getComputedStyle(document.documentElement).getPropertyValue('--gt-font')}`;
          ctx.textAlign = 'center';
          ctx.lineWidth = 3; ctx.strokeStyle = '#fff'; ctx.fillStyle = INK;
          const label = `▲ ${Math.round(race.peak.eleRaw)} m`;
          const ly = Math.max(area.top + 12, py - 13);
          ctx.strokeText(label, px, ly); ctx.fillText(label, px, ly);
        }
        ctx.restore();
      }
    },
    {
      // Curseur vertical
      id: 'cursorLine',
      afterDatasetsDraw(chart) {
        if (cursorKm === null) return;
        const { ctx, scales: { x, y } } = chart;
        const px = x.getPixelForValue(cursorKm);
        const py = y.getPixelForValue(eleAtKm(cursorKm));
        ctx.save();
        ctx.strokeStyle = accent; ctx.lineWidth = 1.5;
        ctx.beginPath(); ctx.moveTo(px, y.top); ctx.lineTo(px, y.bottom); ctx.stroke();
        ctx.fillStyle = accent;
        ctx.beginPath(); ctx.arc(px, py, 4, 0, Math.PI * 2); ctx.fill();
        ctx.restore();
      }
    }
  ];

  // ── Info-bulle (altitude, pente, D+ cumulé) ──
  function tooltip(context) {
    let el = wrap.querySelector('.altchart-tooltip');
    if (!el) {
      el = document.createElement('div');
      el.className = 'altchart-tooltip';
      wrap.appendChild(el);
    }
    const tt = context.tooltip;
    const dp = tt.dataPoints?.find(p => p.datasetIndex === 0);
    if (tt.opacity === 0 || !dp) { el.style.opacity = '0'; return; }

    const i = dp.dataIndex;
    const km = race.dist[i];
    const pct = race.slopeAt(i, 10);
    const sc = slopeColor(pct) === '#c8c8c8' ? '#999' : slopeColor(pct);
    const sign = pct >= 0 ? '+' : '';
    el.innerHTML = `
      <div class="tt-head">
        <span><span style="color:${sc}">●</span>&nbsp;${km.toFixed(2)}&nbsp;km</span>
        <span style="color:${sc}">${sign}${pct.toFixed(1)}&thinsp;%</span>
      </div>
      <div class="tt-cols">
        <div><b>${Math.round(race.ele[i])}&thinsp;m</b><span>Altitude</span></div>
        <div><b style="color:${sc}">${sign}${pct.toFixed(1)}&thinsp;%</b><span>Pente</span></div>
        <div><b>+${Math.round(race.cumDplus[i])}&thinsp;m</b><span>D+ cumulé</span></div>
      </div>`;
    const x = tt.caretX, y = tt.caretY, w = 200;
    el.style.opacity = '1';
    el.style.left = (x + 14 + w > wrap.clientWidth ? x - w - 14 : x + 14) + 'px';
    el.style.top = Math.max(0, y - 30) + 'px';
  }

  const chart = new Chart(canvas.getContext('2d'), {
    type: 'line',
    data: {
      datasets: [
        { label: 'Altitude (m)', data: points, fill: true, borderWidth: 1.2,
          pointRadius: 0, tension: 0.2, order: 2 },
        { label: 'Côte sélectionnée', data: [], fill: false, borderColor: accent, borderWidth: 3,
          pointRadius: 0, tension: 0.2, order: 1 }
      ]
    },
    plugins,
    options: {
      responsive: true,
      maintainAspectRatio: false,
      animation: false,
      interaction: { mode: 'nearest', axis: 'x', intersect: false },
      plugins: { legend: { display: false }, tooltip: { enabled: false, external: tooltip } },
      scales: {
        x: { type: 'linear', min: 0, max: race.totalKm,
             // pas de titre « Distance (km) » : les graduations l'indiquent, et la courbe garde la hauteur du mode Ravitaillements
             ticks: { maxTicksLimit: 10, callback: v => +v.toFixed(2) + ' km', font: { size: 10 } } },
        y: { grace: '14%', title: { display: true, text: 'Altitude (m)', font: { size: 10 } },
             ticks: { callback: v => v + ' m', font: { size: 10 } } }
      }
    }
  });
  // Icône des ravitaillements dessinée sur le profil : redessiner quand son image a fini de charger
  if (!aidImg.complete) aidImg.addEventListener('load', () => chart.update('none'), { once: true });

  // ── Zoom sur la côte sélectionnée ──
  // Fenêtre = côte ± 40 % de sa longueur (au moins ± 500 m), altitudes recalées sur la fenêtre
  function applyView() {
    const { x, y } = chart.options.scales;
    zoomed = !!selected && traceMode !== 'ravitaillements' && !applyView.full;
    if (zoomed) {
      const pad = Math.max(0.5, (selected.endKm - selected.startKm) * 0.4);
      x.min = Math.max(0, selected.startKm - pad);
      x.max = Math.min(race.totalKm, selected.endKm + pad);
      const i0 = race.idxAtKm(x.min), i1 = race.idxAtKm(x.max);
      const win = race.ele.slice(i0, i1 + 1);
      const lo = Math.min(...win), hi = Math.max(...win), margin = Math.max(10, (hi - lo) * 0.15);
      y.min = Math.floor((lo - margin) / 10) * 10;
      y.max = Math.ceil((hi + margin) / 10) * 10;
      y.grace = 0;
    } else {
      x.min = 0; x.max = race.totalKm;
      // Marge en haut : place pour l'étiquette du point culminant au-dessus des bandes de côtes
      y.min = undefined; y.max = undefined; y.grace = '14%';
    }
    resetBtn.hidden = !zoomed;
    resetBtn.innerHTML = `${icon('maximize-2', 12)} Profil complet`;
    if (selected && !zoomed && traceMode !== 'ravitaillements') {
      resetBtn.hidden = false;
      resetBtn.innerHTML = `${icon('zoom-in', 12)} Zoom sur la côte`;
    }
    chart.update('none');
  }
  applyView.full = false;
  resetBtn.addEventListener('click', () => { applyView.full = zoomed; applyView(); });

  function applyMode() {
    const ds = chart.data.datasets[0];
    if (traceMode === 'slope') {
      ds.segment = {
        borderColor: c => slopeColors[c.p0DataIndex],
        backgroundColor: c => hexAlpha(slopeColors[c.p0DataIndex], 0.16)
      };
      ds.borderColor = '#aaa';
      ds.backgroundColor = 'transparent';
    } else {
      ds.segment = undefined;
      ds.borderColor = traceColor;
      ds.backgroundColor = hexAlpha(traceColor, 0.12);
    }
    const isAid = traceMode === 'ravitaillements';
    // Mode Ravitaillements : l'axe des distances garde sa place (graduations invisibles) et la barre des
    // ravitaillements s'y superpose : la courbe a exactement la même hauteur dans les trois modes
    chart.options.scales.x.ticks.color = isAid ? 'transparent' : undefined;
    chart.options.scales.x.grid.display = !isAid;   // pas de quadrillage tous les 10 km : les ravitos ont leurs lignes
    wrap.classList.toggle('rv-mode', isAid);
    applyView();   // la barre des ravitaillements suppose le profil complet
    rvBar.style.display = isAid ? 'block' : 'none';
    if (isAid) buildAidBar();
  }

  // Barre sous le profil, sur une ligne : un point et le km de chaque ravitaillement (nom dessous), et entre deux
  // points la distance et le D+ du tronçon, plus petits. Les chevauchements sont réglés après rendu, sur les
  // tailles réelles : libellés d'un point masqués (le point reste, détail au survol ; départ et arrivée toujours
  // affichés), texte d'un tronçon réduit au D+ puis masqué
  function buildAidBar() {
    const wps = waypoints().map(wp => ({ ...wp, dplus: Math.round(race.cumDplus[race.idxAtKm(wp.km)]) }));
    const ca = chart.chartArea, w = chart.canvas.offsetWidth;
    const left = ca.left / w * 100, width = (ca.right - ca.left) / w * 100;
    const pct = km => left + km / race.totalKm * width;
    const fmtKm = km => km.toLocaleString('fr-BE', { minimumFractionDigits: 1, maximumFractionDigits: 1 });
    const kmText = wp => `${(Math.round(wp.km * 10) / 10).toLocaleString('fr-BE')} KM`;
    let html = '<div class="rv-bar-inner">';
    for (let i = 0; i < wps.length - 1; i++) {
      const a = wps[i], b = wps[i + 1], dp = `+${b.dplus - a.dplus} m`, full = `${fmtKm(b.km - a.km)} km · ${dp}`;
      html += `<div class="rv-bar-seg" style="left:${pct(a.km).toFixed(2)}%;width:${(pct(b.km) - pct(a.km)).toFixed(2)}%"`
        + ` title="${escapeHtml(`${a.name} → ${b.name} : ${full}`)}"><span data-full="${full}" data-dp="${dp}">${full}</span></div>`;
    }
    wps.forEach(wp => {
      const color = wp.kind === 'aid' ? INK : endpointInk();
      // Contenu du ravito : une icône par catégorie présente ; détail complet au survol
      const groups = wp.aid ? suppliesByCategory(wp.aid) : [];
      const supplies = groups.map(([cat]) => icon(SUPPLIES[cat].icon, 11)).join('');
      const title = [`${wp.name} · ${kmText(wp)}`, ...groups.map(([cat, items]) => `${SUPPLIES[cat].label} : `
        + (items.map(supplyText).filter(Boolean).join(', ') || 'non précisé')), wp.aid?.note].filter(Boolean).join('\n');
      html += `<div class="rv-bar-wp rv-${wp.kind}" style="left:${pct(wp.km).toFixed(2)}%" title="${escapeHtml(title)}">
        <div class="rv-bar-dot" style="background:${color}"></div>
        <div class="rv-bar-km" style="color:${color}">${kmText(wp)}</div>
        <div class="rv-bar-name">${escapeHtml(wp.name)}</div>
        ${supplies ? `<div class="rv-bar-supplies">${supplies}</div>` : ''}</div>`;
    });
    rvBar.innerHTML = html + '</div>';

    // Chevauchements, mesurés sur le rendu
    const labelsOf = el => [...el.querySelectorAll('.rv-bar-km, .rv-bar-name, .rv-bar-supplies')].map(e => e.getBoundingClientRect());
    const span = el => { const r = labelsOf(el); return { l: Math.min(...r.map(x => x.left)), r: Math.max(...r.map(x => x.right)) }; };
    const wpEls = [...rvBar.querySelectorAll('.rv-bar-wp')];
    let last = 0;
    wpEls.forEach((el, i) => {
      if (i === 0 || span(el).l >= span(wpEls[last]).r + 6) { last = i; return; }
      if (i === wpEls.length - 1) { if (last > 0) wpEls[last].classList.add('rv-tight'); last = i; }
      else el.classList.add('rv-tight');
    });
    const shown = wpEls.filter(el => !el.classList.contains('rv-tight')).flatMap(labelsOf);
    const overlaps = r => shown.some(o => r.left < o.right + 4 && o.left < r.right + 4 && r.top < o.bottom && o.top < r.bottom);
    rvBar.querySelectorAll('.rv-bar-seg span').forEach(el => {
      for (const text of [el.dataset.full, el.dataset.dp, '']) {
        el.textContent = text;
        if (!text || !overlaps(el.getBoundingClientRect())) break;
      }
    });
  }

  // ── Profil → curseur ──
  const kmFromEvent = clientX => {
    const rect = canvas.getBoundingClientRect();
    const km = chart.scales.x.getValueForPixel(clientX - rect.left);
    const { min, max } = chart.scales.x;
    return km >= min && km <= max ? km : null;
  };
  const move = clientX => { const km = kmFromEvent(clientX); if (km !== null) emit('cursor:move', km); };
  canvas.addEventListener('mousemove', e => move(e.clientX));
  canvas.addEventListener('mouseleave', () => emit('cursor:stop'));
  canvas.addEventListener('touchmove', e => move(e.touches[0].clientX), { passive: true });
  canvas.addEventListener('touchend', () => emit('cursor:stop'));

  on('cursor:move', km => { cursorKm = km; chart.update('none'); });
  on('cursor:stop', () => {
    cursorKm = null;
    const tt = wrap.querySelector('.altchart-tooltip');
    if (tt) tt.style.opacity = '0';
    chart.update('none');
  });
  on('trace:mode', mode => { traceMode = mode; applyMode(); });
  on('climb:select', climb => {
    selected = climb;
    applyView.full = false;   // une nouvelle côte se montre toujours en gros plan
    chart.data.datasets[1].data = climb ? points.slice(climb.startIdx, climb.endIdx + 1) : [];
    infoEl.textContent = climb ? race.climbLabel(climb) : '';
    applyView();
  });
  // Barre recalculée à chaque changement de taille du profil (fenêtre, onglet Carte affiché sur mobile, panneau,
  // iframe) : construite pendant que le profil est masqué, elle aurait une largeur nulle
  new ResizeObserver(() => requestAnimationFrame(() => {
    if (traceMode === 'ravitaillements' && chart.chartArea) buildAidBar();
  })).observe(canvas.parentElement);

  applyMode();
  return chart;
}
