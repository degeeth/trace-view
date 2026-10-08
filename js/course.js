// ── Page d'une course (index.html?course=<id>) : charge la course et relie carte, profil et tableau ──
import { on, emit } from './bus.js';
import { loadRace, brandIconSvg, brandIconBox, fmtClock, fmtDuration } from './race.js';
import { createMap } from './map.js';
import { createChart } from './chart.js';
import { createTable } from './table.js';
import { createFlyover } from './flyover.js';
import { icon, hydrateIcons } from './icons.js';

const $ = sel => document.querySelector(sel);
const params = new URLSearchParams(location.search);

// ?course=<id> charge data/<id>.json (sans paramètre, js/app.js affiche la page d'accueil)
const raceId = params.get('course').replace(/[^a-z0-9_-]/gi, '');
const isMobile = () => window.matchMedia('(max-width: 768px)').matches;

if (params.get('embed') === '1') document.body.classList.add('embed-mode');
// ?table=0 : carte et profil seuls, sans tableau des côtes
if (params.get('table') === '0') document.body.classList.add('no-table');
hydrateIcons();

// Chargement : la page reste masquée (classe page-loading posée dans index.html) derrière la pastille
// « Chargement… », jusqu'à ce que la carte soit dessinée ; elle apparaît alors d'un bloc, déjà aux couleurs et au
// logo de la course. Venant de la page d'accueil, la pastille de la tuile continue sans délai ni changement de texte.
const loader = $('#page-loader');
const label = loader.querySelector('[role="status"]');
try {
  const opening = sessionStorage.getItem('trace-view:opening');
  sessionStorage.removeItem('trace-view:opening');
  if (opening) { label.textContent = `Chargement de ${opening}…`; label.style.setProperty('--fade-label-delay', '0ms'); }
} catch { /* stockage indisponible : pastille après 300 ms */ }
loader.hidden = false;
let revealed = false;
function reveal() {
  if (revealed) return;
  revealed = true;
  loader.hidden = true;
  document.documentElement.classList.remove('page-loading');
  document.documentElement.classList.add('page-ready');
}
let race;
try {
  race = await loadRace(`data/${raceId}.json`);
} catch (err) {
  reveal();
  document.body.innerHTML = `<p class="load-error">Impossible de charger la course « ${raceId} » : ${err.message}`
    + ` · <a href="${location.pathname}">Tous les parcours</a></p>`;
  throw err;
}

// ── Thème de l'identité visuelle (branding/<nom>.json → theme) : variables CSS de style.css ──
const theme = race.branding.theme || {};
const THEME_VARS = { primary: '--gt-primary', onPrimary: '--gt-on-primary', ink: '--gt-ink', night: '--gt-night',
  nightHover: '--gt-night-hover', radius: '--gt-radius', font: '--gt-font', fontDisplay: '--gt-font-display',
  text: '--gt-text', textMuted: '--gt-text-muted', surfaceSoft: '--gt-surface-soft', surfaceAlt: '--gt-surface-alt',
  border: '--gt-border', caps: '--gt-caps', tracking: '--gt-tracking' };
Object.entries(THEME_VARS).forEach(([key, cssVar]) => {
  if (theme[key] != null && theme[key] !== '') document.documentElement.style.setProperty(cssVar, theme[key]);
});
// Point + filet sous les titres (signature du GTLC) : seulement pour les identités qui le demandent
document.documentElement.classList.toggle('title-rule', !!theme.titleRule);
document.documentElement.style.setProperty('--gt-trace', race.branding.traceColor);
// Polices des identités : servies par l'application (fonts/fonts.css, scripts/fetch_fonts.py), pas par Google

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
  [race.climbs.length, `Côtes ≥ ${minClimbLength} m`],
  // Départ et temps limite (barrière horaire de l'arrivée), si la course les indique
  ...(race.race.start ? [[new Date(race.race.start).toLocaleDateString('fr-BE', { weekday: 'short', day: 'numeric', month: 'short' })
    + ' ' + fmtClock(race.race.start), 'Départ']] : []),
  ...(race.race.finishCutoff ? [[fmtDuration(race.race.finishCutoff.elapsed), 'Temps limite']] : [])
].map(([v, l]) => `<div class="stat"><strong>${v}</strong>${l}</div>`).join('');

// ── Retour à la page d'accueil (tuiles des parcours) ──
$('.back-link').href = location.pathname;

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
mapApi.map.once('load', reveal);
setTimeout(reveal, 20000);   // carte jamais chargée (WebGL indisponible…) : la page s'affiche quand même
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
async function set3D(enabled) {
  const btn = $('#btn-3d');
  btn.textContent = enabled ? '2D' : '3D';
  btn.classList.toggle('active', enabled);
  btn.setAttribute('aria-pressed', enabled);
  btn.disabled = true;   // pas de double clic pendant la bascule
  btn.classList.add('busy');
  try { await mapApi.setMode3D(enabled); }
  finally { btn.disabled = false; btn.classList.remove('busy'); }
}
$('#btn-3d').addEventListener('click', () => { flyover.stop(); set3D(!mapApi.is3D()); });

// ── Survol 3D (js/flyover.js) : toute la course, ou la côte sélectionnée ; le bouton devient « Arrêter » ──
const flyoverBtn = $('#flyover-btn');
function refreshFlyoverBtn(flying) {
  const what = selected ? 'de la côte' : 'du parcours';
  flyoverBtn.innerHTML = flying ? `${icon('square', 13)} <span class="btn-label">Arrêter</span>`
    : `${icon('play', 13)} <span class="btn-label">Survol</span>`;
  flyoverBtn.title = flying ? 'Arrêter le survol' : `Survol 3D ${what}`;
  flyoverBtn.setAttribute('aria-label', flyoverBtn.title);
  flyoverBtn.classList.toggle('active', flying);
}
const flyover = createFlyover(race, mapApi, { enter3D: () => set3D(true), onChange: refreshFlyoverBtn });
flyoverBtn.addEventListener('click', () => flyover.isFlying() ? flyover.stop() : flyover.start(selected));
// Choisir (ou désélectionner) une côte pendant le survol l'arrête : la carte vole vers la côte
on('climb:select', () => { flyover.stop(); refreshFlyoverBtn(flyover.isFlying()); });

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
window.trace = { race, map: mapApi.map, mapApi, chart, emit, flyover, get selected() { return selected; } };
