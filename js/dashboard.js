// ── Page d'accueil (index.html sans paramètre) : une tuile par parcours, regroupées par organisation ──
// Catalogue : data/courses.json ; identités (logo, couleurs) : data/brandings.json, écrits par scripts/build_course.py.
// Groupe d'une course : "group" de son course.json, sinon son organisation (identité), sinon « Autres parcours ».
import { brandIconSvg, brandIconBox, escapeHtml, fmtClock } from './race.js';
import { icon, appLogo, hydrateIcons } from './icons.js';

const DEFAULT_BRANDING = 'defaut';
const $ = sel => document.querySelector(sel);

const [catalog, brandings] = await Promise.all(['data/courses.json', 'data/brandings.json']
  .map(url => fetch(url).then(r => r.ok ? r.json() : Promise.reject(new Error(`${url} : ${r.status}`)))));

document.body.classList.add('dashboard-mode');
document.title = 'Parcours · analyse des côtes';
hydrateIcons();

// Logo d'une identité : celui de l'organisation (headerLogo), sinon la montagne de l'application
const brandingOf = id => brandings[id] || brandings[DEFAULT_BRANDING] || {};
function logo(id, size) {
  const b = brandingOf(id);
  if (!b.headerLogo || !b.aidStationIcon) return appLogo(Math.round(size * 0.85));
  const fake = { branding: b };
  const { height } = brandIconBox(fake, size);
  return brandIconSvg(fake, b.theme?.aidIconColor || '#04080b', height);
}

// Groupes, dans l'ordre du catalogue (du plus long au plus court parcours)
const groups = new Map();
for (const c of catalog) {
  const isDefault = (c.branding || DEFAULT_BRANDING) === DEFAULT_BRANDING;
  const key = c.group || (isDefault ? 'autres' : c.branding);
  if (!groups.has(key)) {
    // Nom de l'organisation sans sa précision entre parenthèses (« Extratrail (Ardenne Running Territories) »)
    const full = c.group || (isDefault ? 'Autres parcours' : brandingOf(c.branding).name);
    groups.set(key, { label: c.group ? full : full.replace(/\s*\(.*\)\s*$/, ''), full, branding: c.branding, courses: [] });
  }
  groups.get(key).courses.push(c);
}

const fmt = (v, digits = 0) => v.toLocaleString('fr-BE', { maximumFractionDigits: digits });
const startText = iso => {
  const d = new Date(iso);
  return `${d.toLocaleDateString('fr-BE', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' })} · ${fmtClock(iso)}`;
};

function tile(c) {
  const theme = brandingOf(c.branding).theme || {};
  const vars = [theme.night && `--tile-night:${theme.night}`, theme.primary && `--tile-primary:${theme.primary}`,
    theme.fontDisplay && `--tile-font:${theme.fontDisplay}`].filter(Boolean).join(';');
  return `<a class="dash-tile" href="?course=${encodeURIComponent(c.id)}" data-name="${escapeHtml(c.name)}"${vars ? ` style="${escapeHtml(vars)}"` : ''}>
    <span class="dash-tile-band"><span class="dash-tile-logo">${logo(c.branding, 40)}</span></span>
    <span class="dash-tile-body">
      <span class="dash-tile-name" title="${escapeHtml(c.name)}">${escapeHtml(c.name)}</span>
      <span class="dash-tile-stats"><b>${fmt(c.distanceKm, 1)} km</b><span>+${fmt(c.dplus)} m</span></span>
      <span class="dash-tile-date">${c.start ? `${icon('timer', 12)} ${escapeHtml(startText(c.start))}` : ''}</span>
    </span>
  </a>`;
}

$('#dashboard').innerHTML = `
  <header class="dash-header">
    <h1>${appLogo(28)} Parcours</h1>
    <p>Carte en 3D, profil et analyse côte par côte · ${catalog.length} parcours</p>
  </header>
  <main class="dash-main">
    ${[...groups.values()].map(g => `
      <section class="dash-group" style="--n:${g.courses.length}">
        <h2 class="dash-group-title" title="${escapeHtml(g.full)}"><span class="dash-group-logo">${logo(g.branding, 22)}</span>
          <span>${escapeHtml(g.label)} <span class="dash-group-count">· ${g.courses.length} parcours</span></span></h2>
        <div class="dash-grid">${g.courses.map(tile).join('')}</div>
      </section>`).join('')}
  </main>`;
$('#dashboard').hidden = false;

// Choix d'une tuile : la page du parcours se charge ; pastille « Chargement… » si l'attente dure
// (même style que le passage 2D ↔ 3D). Clic avec Ctrl / Cmd / milieu : nouvel onglet, sans pastille.
const loader = $('#page-loader');
$('#dashboard').addEventListener('click', e => {
  const a = e.target.closest('.dash-tile');
  if (!a || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
  loader.querySelector('[role="status"]').textContent = `Chargement de ${a.dataset.name}…`;
  loader.hidden = false;
  // La page du parcours reprend cette pastille dès son premier affichage (js/course.js)
  try { sessionStorage.setItem('trace-view:opening', a.dataset.name); } catch { /* sans stockage : pastille différée */ }
});
// Retour arrière (page restaurée depuis le cache du navigateur) : plus de pastille
window.addEventListener('pageshow', e => { if (e.persisted) loader.hidden = true; });
