// Test de fumée : charge l'application dans Chrome (headless) et vérifie les
// parcours principaux — tableau, carte, profil, modes du tracé, sélection,
// curseur, 3D, changements de fond, lien partagé, mobile.
//
//   npm install && npm run test:smoke
//   npm run test:smoke -- --course <id>      (une course précise ; par défaut la première du catalogue)
//
// Chrome : chemin par défaut macOS, sinon variable CHROME_PATH.
import puppeteer from 'puppeteer-core';
import { startServer } from '../scripts/serve.mjs';

const CHROME = process.env.CHROME_PATH || '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
// Bruit réseau sans rapport avec l'application (tuiles raster tierces)
const IGNORED_URLS = /tile\.openstreetmap\.org|tile\.opentopomap\.org/;
// Orthophotos IGN (qualité haute) : 404 attendus hors de France (HRP côté espagnol)
const IGN_OUTSIDE_FRANCE = /data\.geopf\.fr\/wmts/;

const sleep = ms => new Promise(r => setTimeout(r, ms));
const results = [];
function check(name, ok, detail = '') {
  results.push({ name, ok });
  console.log(`${ok ? '✔' : '✘'} ${name}${detail ? ' — ' + detail : ''}`);
}

const server = await startServer(0);
const courseArg = process.argv.indexOf('--course');
const COURSE = courseArg > 0 ? process.argv[courseArg + 1] : null;
const BASE = `http://localhost:${server.address().port}/index.html` + (COURSE ? `?course=${COURSE}` : '');
const browser = await puppeteer.launch({
  executablePath: CHROME,
  headless: 'new',
  protocolTimeout: 300000,
  args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader']
});

async function openPage(url, viewport) {
  const page = await browser.newPage();
  await page.setViewport(viewport);
  const errors = [];
  page.on('pageerror', e => errors.push('JS : ' + e.message));
  page.on('console', async m => {
    if (m.type() !== 'error') return;
    // Les objets Error n'ont pas de texte : on lit leur message dans la page
    const parts = await Promise.all(m.args().map(a =>
      a.evaluate(v => v instanceof Error ? v.message : String(v)).catch(() => '')));
    const text = parts.join(' ').trim() || m.text();
    // Les « Failed to load resource » sont vérifiés ci-dessous, URL par URL
    if (text && !text.startsWith('Failed to load resource')) errors.push('console : ' + text);
  });
  page.on('response', r => {
    if (r.status() === 404 && IGN_OUTSIDE_FRANCE.test(r.url())) return;
    if (r.status() >= 400 && !IGNORED_URLS.test(r.url())) errors.push(`HTTP ${r.status()} : ${r.url()}`);
  });
  await page.goto(url, { waitUntil: 'networkidle2', timeout: 60000 });
  await page.waitForFunction(() => window.trace?.map.loaded() && trace.map.getLayer('trace-line'), { timeout: 60000 })
    .catch(() => {});
  return { page, errors };
}

try {
  // ═══ Ordinateur ═══
  const { page, errors } = await openPage(BASE, { width: 1440, height: 900 });

  const rows = await page.$$eval('#climbs-body tr', trs => trs.length);
  const expected = await page.evaluate(() => trace.race.climbs.length);
  check('Tableau des côtes rempli depuis les données', rows > 0 && rows === expected, `${rows} lignes`);
  const dplus = await page.evaluate(() => ({
    header: parseInt(trace.race.race.stats.dplus.replace(/\D/g, ''), 10),
    cumul: Math.round(trace.race.cumDplus.at(-1))
  }));
  check('D+ cumulé à l\'arrivée = D+ de l\'en-tête', Math.abs(dplus.header - dplus.cumul) <= 2,
    `${dplus.cumul} m / ${dplus.header} m`);
  const picker = await page.evaluate(async () => {
    const catalog = await fetch('data/courses.json').then(r => r.json());
    const el = document.querySelector('.course-picker');
    return { count: catalog.length, visible: !el.hidden, value: document.querySelector('#course-select').value,
             id: trace.race.race.id };
  });
  check('Sélecteur de course', picker.count > 1 ? picker.visible && picker.value === picker.id : !picker.visible,
    `${picker.count} course(s)`);
  check('En-tête et statistiques générés', await page.$eval('#race-name', el => el.textContent.length > 0)
    && await page.$$eval('.stats-bar .stat', s => s.length) === 7);
  check('Carte chargée', await page.evaluate(() => trace.map.loaded()));
  // Réglages de js/config.js réellement appliqués
  const cfg = await page.evaluate(async () => {
    const { MAP_CONFIG: C } = await import('./js/config.js');
    const m = trace.map, layer = id => m.getStyle().layers.find(l => l.id === id) || {};
    const problems = [];
    if (trace.mapApi.styleKey() !== C.defaultStyle) problems.push('fond par défaut');
    if (document.querySelector('.m3d-panel-body').classList.contains('collapsed') !== C.stylePanelCollapsed) problems.push('panneau');
    if (layer('contours-thick').minzoom !== undefined && layer('contours-thick').minzoom !== C.contoursMinZoom.thick) problems.push('courbes maîtresses');
    if (layer('contours-thin').minzoom !== undefined && layer('contours-thin').minzoom !== C.contoursMinZoom.thin) problems.push('courbes fines');
    if (m.getPaintProperty('terrain-hillshade', 'hillshade-exaggeration') !== C.hillshadeIntensity) problems.push('ombrage');
    if (!JSON.stringify(m.getFilter('km-circle')).includes(String(C.kmMarkersEvery5Zoom))) problems.push('bornes');
    return { problems, climbPitch: C.climbFlightPitch };
  });
  check('Réglages de js/config.js appliqués', cfg.problems.length === 0, cfg.problems.join(', '));
  check('Profil affiché, onglet Ravitaillements par défaut (le premier)', await page.$('#altChart') !== null
    && await page.$eval('.profile-tab', el => el.dataset.mode === 'ravitaillements' && el.classList.contains('active')));

  // Modes du tracé
  await page.evaluate(() => trace.emit('trace:mode', 'slope'));
  const slope = await page.evaluate(() => ({
    gradient: !!trace.map.getPaintProperty('trace-line', 'line-gradient'),
    legend: document.querySelector('.slope-legend').classList.contains('visible')
  }));
  check('Mode Pente : tracé en dégradé + légende', slope.gradient && slope.legend);
  await page.evaluate(() => trace.emit('trace:mode', 'climbs'));
  check('Mode Côtes : côtes et pastilles visibles', await page.evaluate(() =>
    trace.map.getLayoutProperty('badges-circle', 'visibility') === 'visible'
    && !trace.map.getPaintProperty('trace-line', 'line-gradient')));

  // Curseur du profil
  await page.evaluate(() => trace.emit('cursor:move', 25));
  check('Curseur du profil visible sur la carte', await page.$('.cursor-dot') !== null);
  await page.evaluate(() => trace.emit('cursor:stop'));
  check('Curseur retiré', await page.$('.cursor-dot') === null);

  // Sélection depuis le tableau
  await page.click('#climbs-body tr');
  await sleep(1200);
  const sel = await page.evaluate(() => ({
    num: trace.selected?.num, hash: location.hash,
    dots: document.querySelectorAll('#map .map-dot, #map .map-endpoint').length,
    share: !document.querySelector('#share-btn').hidden,
    row: document.querySelector('#climbs-body tr.selected')?.dataset.num
  }));
  check('Clic sur une ligne : côte sélectionnée', sel.num === 1 && sel.row === '1');
  const zoom = await page.evaluate(() => {
    const x = trace.chart.scales.x, c = trace.selected;
    return { min: x.min, max: x.max, btn: !document.querySelector('#profile-reset').hidden,
             framesClimb: x.min <= c.startKm && x.max >= c.endKm, partial: x.max - x.min < trace.race.totalKm * 0.9 };
  });
  check('Profil zoomé sur la côte + bouton « Profil complet »', zoom.framesClimb && zoom.partial && zoom.btn,
    `${zoom.min.toFixed(2)} → ${zoom.max.toFixed(2)} km`);
  await page.click('#profile-reset');
  check('« Profil complet » rétablit toute la course', await page.evaluate(() =>
    trace.chart.scales.x.min === 0 && trace.chart.scales.x.max === trace.race.totalKm));
  // Départ + arrivée (une seule pastille sur une boucle) + début (S) et sommet (E) de la côte
  const expectedDots = (await page.evaluate(() => trace.race.isLoop) ? 1 : 2) + 2;
  check('Sélection : URL, bouton Partager, pastilles S/E', sel.hash === '#climb-1' && sel.share && sel.dots === expectedDots,
    `${sel.hash}, ${sel.dots} pastilles`);

  // 3D
  // Attendre la fin du vol de caméra (plus long en qualité haute) plutôt qu'un délai fixe
  await page.evaluate(() => new Promise(r => {
    trace.map.once('moveend', () => r()); document.querySelector('#btn-3d').click(); setTimeout(r, 15000);
  }));
  const state3d = await page.evaluate(() => ({
    terrain: !!trace.map.getTerrain(), pitch: Math.round(trace.map.getPitch()), btn: document.querySelector('#btn-3d').textContent
  }));
  const exag = await page.evaluate(async () => {
    const { MAP_STYLES } = await import('./js/map-styles.js');
    return { got: trace.map.getTerrain()?.exaggeration,
             want: trace.race.race.terrainExaggeration ?? MAP_STYLES[trace.mapApi.styleKey()].exag };
  });
  check('3D : exagération du relief (course ou fond de carte)', exag.got === exag.want, `×${exag.got}`);
  check('3D : relief activé et carte inclinée', state3d.terrain && Math.abs(state3d.pitch - cfg.climbPitch) <= 1 && state3d.btn === '2D',
    `inclinaison ${state3d.pitch}°`);

  // Changements de fond : surbrillance, icône et relief conservés
  for (const key of ['topotrail', 'terrain', 'satellite', 'positron', 'dark', 'osm', 'sentiers']) {
    await page.evaluate(k => new Promise(resolve => {
      trace.map.once('style.load', () => trace.map.once('idle', resolve));
      document.querySelector(`.m3d-style-thumb[data-style="${k}"]`).click();
      setTimeout(resolve, 30000);
    }), key);
  }
  // Ombrage du relief : masqué sur Satellite (réglage satelliteHillshade), visible sur les autres fonds
  const shadeOnSat = await page.evaluate(async () => {
    const { MAP_CONFIG } = await import('./js/config.js');
    await new Promise(r => { trace.map.once('style.load', () => trace.map.once('idle', r));
      document.querySelector('.m3d-style-thumb[data-style="satellite"]').click(); setTimeout(r, 30000); });
    const vis = trace.map.getLayoutProperty('terrain-hillshade', 'visibility') ?? 'visible';
    await new Promise(r => { trace.map.once('style.load', () => trace.map.once('idle', r));
      document.querySelector('.m3d-style-thumb[data-style="sentiers"]').click(); setTimeout(r, 30000); });
    const visBack = trace.map.getLayoutProperty('terrain-hillshade', 'visibility') ?? 'visible';
    return { ok: (vis === 'visible') === MAP_CONFIG.satelliteHillshade && visBack === 'visible', vis };
  });
  check('Ombrage du relief selon le réglage satellite', shadeOnSat.ok, `satellite : ${shadeOnSat.vis}`);
  const afterSwitch = await page.evaluate(() => ({
    hl: !!trace.map.getLayer('climb-hl-line') && !!trace.map.getSource('climb-hl').serialize().data.geometry,
    icon: trace.map.hasImage('aid-icon'),
    terrain: !!trace.map.getTerrain()
  }));
  const peaks = await page.evaluate(async () => {
    const { MAP_CONFIG } = await import('./js/config.js');
    const layers = trace.map.getStyle().layers.filter(l => l['source-layer'] === 'mountain_peak');
    return { expected: MAP_CONFIG.peaksMinZoom, zooms: layers.map(l => l.minzoom) };
  });
  check('Sommets affichés à partir du zoom réglé', peaks.zooms.length > 0 && peaks.zooms.every(z => z === peaks.expected),
    `zoom ${peaks.expected}`);
  check('Changements de fond sans perte (surbrillance, icône, relief)',
    afterSwitch.hl && afterSwitch.icon && afterSwitch.terrain, JSON.stringify(afterSwitch));

  // Retour en 2D
  await page.click('#btn-3d');
  const back2d = await page.waitForFunction(() => !trace.map.getTerrain() && trace.map.getPitch() < 1,
    { timeout: 15000 }).then(() => true, () => false);
  check('Retour en 2D', back2d);

  // Désélection
  await page.click('#climbs-body tr.selected');
  check('Second clic : désélection', await page.evaluate(() => !trace.selected && location.hash === ''));

  // Règle du projet (CLAUDE.md) : jamais de tiret cadratin dans l'application
  const emDash = await page.evaluate(() => {
    const text = document.title + document.body.innerText
      + [...document.querySelectorAll('[title], .maplibregl-ctrl-attrib-inner')].map(el => el.title + el.textContent).join('');
    return text.includes('\u2014');
  });
  check('Aucun tiret cadratin « — » affiché', !emDash);
  check('Aucune erreur (ordinateur)', errors.length === 0, errors.slice(0, 5).join(' | '));
  await page.close();

  // ═══ Lien partagé ═══
  const linkNum = Math.min(5, rows);   // une course peut avoir moins de 5 côtes
  const shared = await openPage(BASE + `#climb-${linkNum}`, { width: 1440, height: 900 });
  await sleep(1500);
  check(`Lien #climb-${linkNum} : côte sélectionnée à l'ouverture`, await shared.page.evaluate(n => trace.selected?.num === n, linkNum));
  await shared.page.close();

  // ═══ Mobile ═══
  const mobile = await openPage(BASE, { width: 390, height: 844, isMobile: true, hasTouch: true });
  const visible = sel => mobile.page.$eval(sel, el => el.offsetParent !== null).catch(() => false);
  const mapH = await mobile.page.$eval('#map', el => el.getBoundingClientRect().height);
  check('Mobile : onglets visibles, carte affichée', await visible('.mobile-nav') && mapH > 250, `carte ${Math.round(mapH)} px`);
  await mobile.page.click('.mobile-tab[data-tab="cotes"]');
  check('Mobile : onglet Côtes affiche le tableau', await visible('#climbs-table') && !await visible('#map'));
  const mobileNum = Math.min(3, rows);
  await mobile.page.click(`#climbs-body tr:nth-child(${mobileNum})`);
  await sleep(1000);
  check('Mobile : choisir une côte revient sur la carte', await visible('#map')
    && await mobile.page.evaluate(n => trace.selected?.num === n, mobileNum));
  check('Aucune erreur (mobile)', mobile.errors.length === 0, mobile.errors.slice(0, 5).join(' | '));
} finally {
  await browser.close();
  server.close();
}

const failed = results.filter(r => !r.ok).length;
console.log(`\n${results.length - failed}/${results.length} vérifications réussies`);
process.exit(failed ? 1 : 0);
