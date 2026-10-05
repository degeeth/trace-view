// ── Point d'entrée : charge la course et relie carte, profil et tableau ──
import { on, emit } from './bus.js';
import { loadRace, brandIconSvg, brandIconBox } from './race.js';
import { createMap } from './map.js';
import { createChart } from './chart.js';
import { createTable } from './table.js';
import { icon, hydrateIcons } from './icons.js';

const $ = sel => document.querySelector(sel);
const params = new URLSearchParams(location.search);

// Catalogue des courses (data/courses.json, tenu à jour par scripts/build_course.py)
const catalog = await fetch('data/courses.json').then(r => r.ok ? r.json() : []).catch(() => []);
// ?course=<id> charge data/<id>.json ; sinon la première course du catalogue
const raceId = (params.get('course') || catalog[0]?.id || 'lgo100km').replace(/[^a-z0-9_-]/gi, '');
const isMobile = () => window.matchMedia('(max-width: 768px)').matches;

if (params.get('embed') === '1') document.body.classList.add('embed-mode');
// ?table=0 : carte et profil seuls, sans tableau des côtes
if (params.get('table') === '0') document.body.classList.add('no-table');
hydrateIcons();

let race;
try {
  race = await loadRace(`data/${raceId}.json`);
} catch (err) {
  document.body.innerHTML = `<p class="load-error">Impossible de charger la course « ${raceId} » : ${err.message}</p>`;
  throw err;
}

// ── Thème de l'identité visuelle (branding/<nom>.json → theme) : variables CSS de style.css ──
const theme = race.branding.theme || {};
const THEME_VARS = { primary: '--gt-primary', onPrimary: '--gt-on-primary', ink: '--gt-ink', night: '--gt-night',
  nightHover: '--gt-night-hover', radius: '--gt-radius', font: '--gt-font', fontDisplay: '--gt-font-display' };
Object.entries(THEME_VARS).forEach(([key, cssVar]) => {
  if (theme[key]) document.documentElement.style.setProperty(cssVar, theme[key]);
});
document.documentElement.style.setProperty('--gt-trace', race.branding.traceColor);
if (theme.googleFonts) {
  const link = document.createElement('link');
  link.rel = 'stylesheet';
  link.href = `https://fonts.googleapis.com/css2?${theme.googleFonts}&display=swap`;
  document.head.appendChild(link);
}

// ── En-tête et statistiques ──
const { name, subtitle, gpxFile, stats, minClimbLength } = race.race;
document.title = `${name} · Analyse des côtes`;
$('#race-name').textContent = name;
// Logo de l'organisation à côté du titre (identité avec "headerLogo": true), sinon la montagne
if (race.branding.headerLogo) {
  // Large au plus 42 px, haut au plus 30 px (empreinte horizontale, cerf vertical)
  const box = brandIconBox(race, 42);
  const height = Math.min(30, box.height);
  $('header h1 .icon').outerHTML = brandIconSvg(race, 'var(--gt-primary)', height).replace('class="aid-icon"', 'class="header-logo"');
}
const elevationNote = race.race.elevationSource && race.race.elevationSource !== 'GPX'
  ? ' · Altitudes : modèle Copernicus' : '';
$('#race-subtitle').textContent = `${subtitle} · Source : ${gpxFile}${elevationNote}`;
$('.stats-bar').innerHTML = [
  [stats.distance, 'Distance'], [stats.dplus, 'Dénivelé +'], [stats.dminus, 'Dénivelé −'],
  [stats.altMin, 'Alt. min'], [stats.altMax, 'Alt. max'], [stats.altMoy, 'Alt. moy'],
  [race.climbs.length, `Côtes ≥ ${minClimbLength} m`]
].map(([v, l]) => `<div class="stat"><strong>${v}</strong>${l}</div>`).join('');

// ── Sélecteur de course (visible à partir de deux courses) ──
if (catalog.length > 1) {
  const select = $('#course-select');
  select.innerHTML = catalog.map(c =>
    `<option value="${c.id}"${c.id === raceId ? ' selected' : ''}>${c.name} · ${c.distanceKm.toLocaleString('fr-BE')} km · +${c.dplus.toLocaleString('fr-BE')} m</option>`
  ).join('');
  select.addEventListener('change', () => {
    params.set('course', select.value);
    location.href = `${location.pathname}?${params}`;   // sans #climb-N : il désignait une côte de l'autre course
  });
  $('.course-picker').hidden = false;
}

// ── Modules ──
createTable(race, {
  tbody: $('#climbs-body'), thead: $('#climbs-table thead'), filterBar: $('.filter-bar'),
  noResult: $('#no-result'), miniProfile: $('#mini-profile')
});
const chart = createChart(race, {
  canvas: $('#altChart'), wrap: $('.chart-wrap'), rvBar: $('#rv-bar'), infoEl: $('#chart-info'),
  resetBtn: $('#profile-reset')
});
const mapApi = createMap(race, { container: $('#map') });

// ── Sélection d'une côte : URL, partage, libellé, onglet mobile ──
let selected = null;
on('climb:select', climb => {
  selected = climb;
  history.replaceState(null, '', location.pathname + location.search + (climb ? `#climb-${climb.num}` : ''));
  $('#share-btn').hidden = !climb;
  $('#map-info').textContent = climb ? race.climbLabel(climb) : '';
  if (climb && isMobile()) switchTab('carte');
});
on('climb:select-num', num => {
  const climb = race.climbs.find(c => c.num === num);
  if (!climb) return;
  document.querySelector(`#climbs-body tr[data-num="${num}"]`)?.scrollIntoView({ behavior: 'smooth', block: 'center' });
  emit('climb:select', climb);
});

function selectFromHash() {
  const m = location.hash.match(/^#climb-(\d+)$/);
  if (m) emit('climb:select-num', parseInt(m[1], 10));
}
mapApi.map.once('load', selectFromHash);
window.addEventListener('hashchange', selectFromHash);

$('#share-btn').addEventListener('click', () => {
  if (!selected) return;
  const btn = $('#share-btn');
  navigator.clipboard.writeText(location.href.replace(/#.*$/, '') + `#climb-${selected.num}`).then(() => {
    btn.innerHTML = `${icon('check', 13)} Copié !`;
    btn.classList.add('done');
    setTimeout(() => { btn.innerHTML = `${icon('link', 13)} Partager`; btn.classList.remove('done'); }, 2000);
  });
});

// ── Mode du tracé (onglets du profil ↔ boutons de la carte) ──
document.querySelectorAll('.profile-tab').forEach(tab =>
  tab.addEventListener('click', () => emit('trace:mode', tab.dataset.mode)));
on('trace:mode', mode => document.querySelectorAll('.profile-tab').forEach(tab =>
  tab.classList.toggle('active', tab.dataset.mode === mode)));
emit('trace:mode', 'ravitaillements');   // profil affiché par défaut

// ── 2D / 3D ──
$('#btn-3d').addEventListener('click', async () => {
  const btn = $('#btn-3d'), enabled = !mapApi.is3D();
  btn.textContent = enabled ? '2D' : '3D';
  btn.classList.toggle('active', enabled);
  btn.setAttribute('aria-pressed', enabled);
  btn.disabled = true;   // pas de double clic pendant la bascule
  btn.classList.add('busy');
  try { await mapApi.setMode3D(enabled); }
  finally { btn.disabled = false; btn.classList.remove('busy'); }
});

// ── Téléchargement GPX ──
$('#gpx-btn').addEventListener('click', () => {
  const pts = race.points.map(([lat, lng], i) =>
    `    <trkpt lat="${lat.toFixed(6)}" lon="${lng.toFixed(6)}"><ele>${race.ele[i].toFixed(1)}</ele></trkpt>`).join('\n');
  const gpx = `<?xml version="1.0" encoding="UTF-8"?>
<gpx version="1.1" creator="trace-view" xmlns="http://www.topografix.com/GPX/1/1">
  <trk>
    <name>${name}</name>
    <trkseg>
${pts}
    </trkseg>
  </trk>
</gpx>`;
  const a = document.createElement('a');
  a.href = URL.createObjectURL(new Blob([gpx], { type: 'application/gpx+xml' }));
  a.download = gpxFile;
  a.click();
  URL.revokeObjectURL(a.href);
});

// ── Mise en page : panneau du tableau (ordinateur), onglets (mobile) ──
const resizeViews = () => { mapApi.resize(); chart.resize(); };

$('.col-left-header').addEventListener('click', () => {
  const open = !document.body.classList.toggle('climbs-collapsed');
  $('#col-toggle-btn').setAttribute('aria-expanded', open);
  setTimeout(resizeViews, 310);
});
$('#climbs-reopen-btn').addEventListener('click', () => $('.col-left-header').click());

function switchTab(tab) {
  document.body.dataset.tab = tab;
  document.querySelectorAll('.mobile-tab').forEach(t => t.classList.toggle('active', t.dataset.tab === tab));
  if (tab === 'carte') setTimeout(resizeViews, 50);
}
document.querySelectorAll('.mobile-tab').forEach(t => t.addEventListener('click', () => switchTab(t.dataset.tab)));
switchTab('carte');

// Exposé pour le test de fumée et le débogage dans la console
window.trace = { race, map: mapApi.map, mapApi, chart, emit, get selected() { return selected; } };
