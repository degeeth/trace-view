// ── Tableau des côtes : rendu, filtres, tri, mini-profil au survol ────────
// Un seul tableau pour ordinateur et mobile ; sur mobile, le CSS masque
// les colonnes secondaires (classe .col-opt).
import { on, emit } from './bus.js';
import { CAT_COLORS, CAT_LABELS, CAT_SHORT, slopeColor, fmtSteepPct, fmtSteepKm, steepText, STEEPEST_WINDOW_KM } from './race.js';
import { icon } from './icons.js';

const CATS = ['vert', 'orange', 'rouge', 'blanc'];

export function createTable(race, { tbody, thead, filterBar, noResult, countInfo, miniProfile }) {
  const activeFilters = new Set();
  const sort = { col: null, dir: 1 };
  const rowByNum = new Map();
  let selectedNum = null;

  // ── Lignes ──
  race.climbs.forEach(c => {
    const tr = document.createElement('tr');
    tr.dataset.num = c.num;
    tr.dataset.cat = c.cat;
    tr.tabIndex = 0;
    tr.innerHTML = `
      <td>${c.num}</td>
      <td>${c.startKm.toFixed(2)} km</td>
      <td class="col-opt col-end">${c.endKm.toFixed(2)} km</td>
      <td>${c.length} m</td>
      <td class="cell-cat cell-${c.cat}">+${c.dplus} m&nbsp; (${c.pct.toFixed(1)} %)</td>
      <td class="col-opt cell-steep" title="Passage le plus raide : ${steepText(c)}"><span class="steep-pct" style="--steep:${slopeColor(c.maxPct)}">${fmtSteepPct(c)}</span> · km ${fmtSteepKm(c)}</td>
      <td class="col-opt">${c.altStart} m</td>
      <td>${c.altTop} m</td>`;
    tr.addEventListener('click', () => emit('climb:select', selectedNum === c.num ? null : c));
    tr.addEventListener('keydown', e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); tr.click(); } });
    tbody.appendChild(tr);
    rowByNum.set(c.num, tr);
  });

  // ── Filtres (compteurs calculés depuis les données) ──
  const counts = Object.fromEntries(CATS.map(k => [k, race.climbs.filter(c => c.cat === k).length]));
  filterBar.innerHTML = `<strong>Filtrer :</strong>`
    + CATS.map(k => `<button class="filter-btn btn-${k}" data-filter="${k}" aria-pressed="false">
        <span aria-hidden="true">●</span> <span class="lbl-long">${CAT_LABELS[k]}</span><span class="lbl-short">${CAT_SHORT[k]}</span>
        <span class="badge">${counts[k]}</span></button>`).join('')
    + `<button class="btn-reset">${icon('x', 12)} Tout</button><span class="count-info"></span>`;
  filterBar.querySelectorAll('.filter-btn').forEach(btn => btn.addEventListener('click', () => {
    const cat = btn.dataset.filter;
    activeFilters.has(cat) ? activeFilters.delete(cat) : activeFilters.add(cat);
    btn.classList.toggle('active', activeFilters.has(cat));
    btn.setAttribute('aria-pressed', activeFilters.has(cat));
    applyFilters();
  }));
  filterBar.querySelector('.btn-reset').addEventListener('click', () => {
    activeFilters.clear();
    filterBar.querySelectorAll('.filter-btn').forEach(b => { b.classList.remove('active'); b.setAttribute('aria-pressed', 'false'); });
    applyFilters();
  });

  function applyFilters() {
    let visible = 0;
    rowByNum.forEach((tr, num) => {
      const show = activeFilters.size === 0 || activeFilters.has(tr.dataset.cat);
      tr.classList.toggle('hidden', !show);
      if (show) visible++;
      // La côte sélectionnée disparaît du tableau : on la désélectionne
      if (!show && num === selectedNum) emit('climb:select', null);
    });
    noResult.style.display = visible === 0 ? 'block' : 'none';
    filterBar.querySelector('.count-info').textContent = activeFilters.size
      ? `${visible} côte${visible > 1 ? 's' : ''} affichée${visible > 1 ? 's' : ''}` : '';
  }

  // ── Tri ──
  const sortValue = { num: c => c.num, dist: c => c.length, deni: c => c.dplus, steep: c => c.maxPct };
  thead.querySelectorAll('th.sortable').forEach(th => th.addEventListener('click', () => {
    const col = th.dataset.col;
    sort.dir = sort.col === col ? -sort.dir : 1;
    sort.col = col;
    [...race.climbs]
      .sort((a, b) => (sortValue[col](a) - sortValue[col](b)) * sort.dir)
      .forEach(c => tbody.appendChild(rowByNum.get(c.num)));
    thead.querySelectorAll('th.sortable').forEach(t => {
      t.classList.remove('sort-asc', 'sort-desc');
      t.removeAttribute('aria-sort');
    });
    th.classList.add(sort.dir === 1 ? 'sort-asc' : 'sort-desc');
    th.setAttribute('aria-sort', sort.dir === 1 ? 'ascending' : 'descending');
  }));

  // ── Mini-profil au survol (appareils avec souris uniquement) ──
  let mpChart = null;
  function placeMini(x, y) {
    let lx = x + 18, ly = y - 20;
    if (lx + 230 > window.innerWidth) lx = x - 238;
    if (ly + 175 > window.innerHeight) ly = y - 170;
    miniProfile.style.left = lx + 'px';
    miniProfile.style.top = ly + 'px';
  }
  function showMini(c, x, y) {
    const color = CAT_COLORS[c.cat];
    const pts = race.ele.slice(c.startIdx, c.endIdx + 1);
    miniProfile.querySelector('.mp-title').textContent = `Côte #${c.num} (${c.startKm.toLocaleString('fr-BE')} → ${c.endKm.toLocaleString('fr-BE')} km)`;
    miniProfile.querySelector('[data-mp=dist]').textContent = c.length + ' m';
    miniProfile.querySelector('[data-mp=deni]').textContent = '+' + c.dplus + ' m';
    miniProfile.querySelector('[data-mp=pct]').textContent = c.pct.toFixed(1) + ' %';
    miniProfile.querySelector('[data-mp=top]').textContent = c.altTop + ' m';
    miniProfile.querySelector('[data-mp=steep]').textContent = steepText(c);
    // Passage le plus raide : trait plus épais sur le mini-profil
    const steep = i => race.dist[c.startIdx + i] >= c.maxKm - 1e-6 && race.dist[c.startIdx + i] < c.maxKm + STEEPEST_WINDOW_KM;
    mpChart?.destroy();
    mpChart = new Chart(miniProfile.querySelector('canvas').getContext('2d'), {
      type: 'line',
      data: { labels: pts.map((_, i) => i), datasets: [{ data: pts, borderColor: color, borderWidth: 1.5,
        backgroundColor: color + '22', fill: true, pointRadius: 0, tension: 0.3,
        segment: { borderWidth: s => steep(s.p0DataIndex) ? 3.5 : 1.5 } }] },
      options: { responsive: false, animation: false,
        plugins: { legend: { display: false }, tooltip: { enabled: false } },
        scales: { x: { display: false }, y: { display: false, min: Math.min(...pts) - 5, max: Math.max(...pts) + 5 } } }
    });
    miniProfile.style.display = 'block';
    placeMini(x, y);
  }
  if (window.matchMedia('(hover: hover)').matches) {
    race.climbs.forEach(c => {
      const tr = rowByNum.get(c.num);
      tr.addEventListener('mouseenter', e => showMini(c, e.clientX, e.clientY));
      tr.addEventListener('mousemove', e => placeMini(e.clientX, e.clientY));
      tr.addEventListener('mouseleave', () => { miniProfile.style.display = 'none'; });
    });
  }

  on('climb:select', climb => {
    if (selectedNum !== null) rowByNum.get(selectedNum)?.classList.remove('selected');
    selectedNum = climb ? climb.num : null;
    if (climb) rowByNum.get(climb.num).classList.add('selected');
  });

  return { rowOf: num => rowByNum.get(num) };
}
