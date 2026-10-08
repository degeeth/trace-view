// ── Carte unique MapLibre : 2D (vue du dessus) et 3D (relief incliné) ─────────
// La même carte sert aux deux vues : le bouton 3D active le relief et incline la caméra.
import { on, emit } from './bus.js';
import { MAP_STYLES, zoomWidth } from './map-styles.js';
import { PEAK_ICON } from './style-sentiers.js';
import { MAP_CONFIG } from './config.js';
import { CAT_COLORS, slopeColor, brandIconSvg, brandIconImage, brandIconColor, aidDetailsHtml, aidLegsHtml, escapeHtml, fmtClock } from './race.js';
import { steepText } from './race.js';
import { icon } from './icons.js';

// Relief : Terrarium AWS (standard, zoom 14) ou Mapterhorn (qualité haute, zoom 17 : rochers, crêtes, ravins nets)
const DEM = {
  standard: { tiles: ['https://s3.amazonaws.com/elevation-tiles-prod/terrarium/{z}/{x}/{y}.png'], tileSize: 256, maxzoom: 14,
              attribution: '<a href="https://github.com/tilezen/joerd/blob/master/docs/attribution.md" target="_blank">Relief : Mapzen</a>' },
  high: { tiles: ['https://tiles.mapterhorn.com/{z}/{x}/{y}.webp'], tileSize: 512, maxzoom: 17,
          attribution: '<a href="https://mapterhorn.com/attribution" target="_blank">© Mapterhorn</a>' }
};
// Orthophotos IGN (France, très détaillées) : qualité haute, par-dessus Esri ; hors de France, rien (Esri reste)
const IGN_ORTHO = {
  type: 'raster', tileSize: 256, minzoom: 10, maxzoom: 19, bounds: [-5.3, 41.3, 9.7, 51.2],
  tiles: ['https://data.geopf.fr/wmts?SERVICE=WMTS&REQUEST=GetTile&VERSION=1.0.0&LAYER=ORTHOIMAGERY.ORTHOPHOTOS'
    + '&STYLE=normal&FORMAT=image/jpeg&TILEMATRIXSET=PM&TILEMATRIX={z}&TILECOL={x}&TILEROW={y}'],
  attribution: '© <a href="https://geoservices.ign.fr" target="_blank">IGN</a>, BD ORTHO (Licence ouverte Etalab)'
};
const EMPTY = { type: 'FeatureCollection', features: [] };

// Cap (degrés) du point a vers le point b ([lat, lng])
function bearingBetween(a, b) {
  const toRad = d => d * Math.PI / 180;
  const [lat1, lat2] = [toRad(a[0]), toRad(b[0])];
  const dLng = toRad(b[1] - a[1]);
  const y = Math.sin(dLng) * Math.cos(lat2);
  const x = Math.cos(lat1) * Math.sin(lat2) - Math.sin(lat1) * Math.cos(lat2) * Math.cos(dLng);
  return Math.atan2(y, x) * 180 / Math.PI;
}

function boundsOf(lngLats) {
  const lngs = lngLats.map(c => c[0]), lats = lngLats.map(c => c[1]);
  return [[Math.min(...lngs), Math.min(...lats)], [Math.max(...lngs), Math.max(...lats)]];
}

// Pastille ronde avec une lettre ou un symbole (départ, arrivée, début/sommet de côte)
function dotHtml(text, color, size = 22) {
  return `<div class="map-dot" style="background:${color};width:${size}px;height:${size}px;font-size:${Math.round(size / 2)}px">${text}</div>`;
}

export function createMap(race, { container }) {
  const traceColor = race.branding.traceColor;
  const fullBounds = boundsOf(race.lngLat);
  const colored = race.climbs.filter(c => c.cat !== 'blanc');

  const C = MAP_CONFIG;
  // Épaisseurs du tracé par couche (zoom, largeur, zoom, largeur…), multipliées par traceWidth (celui de la
  // course, course.json, sinon js/config.js) et en 3D par traceWidth3D : le tracé plaqué sur le relief s'élargit
  // sur les versants face à la caméra et empâte les lacets
  const TRACE_WIDTHS = {
    'trace-glow': [8, 7, 12, 9, 16, 12],
    'trace-outline': [8, 3.5, 12, 5, 16, 7],
    'trace-line': [8, 2, 12, 3, 16, 4.5],
    'climbs-line': [8, 2.5, 12, 3.5, 16, 5.5],
    'climb-hl-outline': [8, 6, 12, 9, 16, 13],
    'climb-hl-line': [8, 3.5, 12, 5.5, 16, 8]
  };
  const baseWidth = race.race.traceWidth ?? C.traceWidth ?? 1;
  const traceWidth = id => {
    // En 3D : épaisseurs plafonnées à leur valeur du zoom 12 (la perspective grossit déjà le tracé au premier
    // plan) et surbrillance de côte resserrée (climbHighlightWidth3D)
    const stops = is3D ? TRACE_WIDTHS[id].slice(0, 4) : TRACE_WIDTHS[id];
    const factor = baseWidth * (is3D ? (C.traceWidth3D ?? 1) * (id.startsWith('climb-hl') ? C.climbHighlightWidth3D ?? 1 : 1) : 1);
    // ['get', 'w'] : facteur du tronçon (amincissement sur les versants raides en 3D, voir plus bas)
    return zoomWidth(...stops.map((v, i) => i % 2 ? ['*', v * factor, ['coalesce', ['get', 'w'], 1]] : v));
  };
  const glowOpacity = () => is3D ? C.traceGlowOpacity3D ?? 0.6 : 0.6;
  function applyTraceWidths() {
    for (const id of Object.keys(TRACE_WIDTHS)) if (map.getLayer(id)) map.setPaintProperty(id, 'line-width', traceWidth(id));
    if (map.getLayer('trace-glow')) map.setPaintProperty('trace-glow', 'line-opacity', glowOpacity());
    refreshTraceData();
    scheduleSteep();
  }
  let styleKey = MAP_STYLES[C.defaultStyle] ? C.defaultStyle : Object.keys(MAP_STYLES)[0];
  let is3D = false;
  let traceMode = 'ravitaillements';
  let selected = null;
  let cursorMarker = null;
  let highlightMarkers = [];
  const contourCache = { thick: null, thin: null };

  const map = new maplibregl.Map({
    container,
    style: MAP_STYLES[styleKey].url,
    bounds: fullBounds,
    fitBoundsOptions: { padding: 30 },
    maxPitch: 80,
    attributionControl: { compact: true }
  });
  map.addControl(new maplibregl.NavigationControl({ visualizePitch: true }), 'top-right');
  map.addControl(new maplibregl.ScaleControl({ unit: 'metric' }), 'bottom-left');
  // Petit écran : crédits repliés derrière le bouton « i » pour dégager la carte
  if (window.matchMedia('(max-width: 768px)').matches) {
    map.once('load', () => container.querySelector('.maplibregl-ctrl-attrib')?.classList.remove('maplibregl-compact-show'));
  }
  setRotation(false);

  // Une tuile d'un serveur tiers qui échoue (réseau, serveur SPW lent…) n'est pas une
  // erreur de l'application : simple avertissement. Le reste reste une vraie erreur.
  map.on('error', e => {
    if (e.sourceId || e.tile) console.warn(`Tuile non chargée (${e.sourceId}) :`, e.error?.message);
    else console.error(e.error);
  });

  // ── Données GeoJSON dérivées de la course ──
  // Tracé, côtes et côte sélectionnée découpés en tronçons de même couleur (pente en mode Pente, catégorie des
  // côtes) et de même facteur de largeur `w`. Plaqué sur le relief en 3D, un trait s'étale sur une paroi (×3 à 4 à
  // 70°) : sa largeur y est multipliée par le cosinus de la pente du relief en travers du tracé (au moins
  // steepMinWidth), mesurée sur le relief affiché (exagération comprise) à mesure que les tuiles arrivent.
  const nPts = race.lngLat.length;
  const steep = new Float32Array(nPts).fill(1);        // facteur de largeur par point
  let steepExag = null;
  const widthAt = i => is3D && C.steepSlopeCompensation
    ? Math.round(Math.min(steep[i], steep[Math.min(i + 1, nPts - 1)]) * 10) / 10 : 1;

  // Tronçon i = du point i au point i + 1
  function segments(start, end, colorAt) {
    const props = i => ({ w: widthAt(i), ...(colorAt ? { color: colorAt(i) } : {}) });
    const features = [];
    let from = start, cur = props(start);
    for (let i = start + 1; i <= end; i++) {
      const next = i < end ? props(i) : null;
      if (!next || next.w !== cur.w || next.color !== cur.color) {
        features.push({ type: 'Feature', properties: cur,
          geometry: { type: 'LineString', coordinates: race.lngLat.slice(from, i + 1) } });
        from = i;
        cur = next;
      }
    }
    return { type: 'FeatureCollection', features };
  }
  const traceData = () => segments(0, nPts - 1, traceMode === 'slope' ? i => slopeColor(race.slope[i]) : null);
  const climbsData = () => ({ type: 'FeatureCollection',
    features: colored.flatMap(c => segments(c.startIdx, c.endIdx, () => CAT_COLORS[c.cat]).features) });
  const highlightData = () => selected ? segments(selected.startIdx, selected.endIdx, null) : EMPTY;
  function refreshTraceData() {
    map.getSource('trace')?.setData(traceData());
    map.getSource('climbs')?.setData(climbsData());
    map.getSource('climb-hl')?.setData(highlightData());
  }

  // Pente du relief en travers du tracé, de part et d'autre du tracé (steepSampleDistance) ; remesurée quand on
  // zoome (tuiles de relief plus fines) pour les points visibles. Mesurée sur un point tous les steepSampleDistance
  // mètres (pas sur chaque point GPS : 18 000 points pour un enregistrement à la seconde), les points entre deux
  // échantillons prenant la valeur la plus faible des deux ; travail découpé en tranches de 8 ms qui rendent la main au
  // navigateur, pour ne jamais figer le zoom ni l'animation. Une mesure en cours va jusqu'au bout (les tuiles de relief arrivent
  // en continu : l'abandonner à chaque tuile l'empêcherait de finir) puis se relance une fois si on l'a redemandée.
  const steepSamples = (() => {
    const out = [0];
    for (let i = 1; i < nPts; i++) if ((race.dist[i] - race.dist[out.at(-1)]) * 1000 >= C.steepSampleDistance) out.push(i);
    if (out.at(-1) !== nPts - 1) out.push(nPts - 1);
    return out;
  })();
  const sampleSteep = new Float32Array(steepSamples.length).fill(1);
  const sampleZoom = new Float32Array(steepSamples.length).fill(-1);
  let steepBusy = false, steepAgain = false;
  function measureSteep() {
    if (!is3D || !C.steepSlopeCompensation || !map.getTerrain()) return;
    if (steepBusy) { steepAgain = true; return; }
    steepBusy = true;
    const exag = map.getTerrain().exaggeration;
    if (exag !== steepExag) { sampleZoom.fill(-1); steepExag = exag; }
    const zoom = Math.floor(map.getZoom()), bounds = map.getBounds(), d = C.steepSampleDistance;
    let k = 0, changed = false;
    const finish = () => {
      steepBusy = false;
      if (steepAgain) { steepAgain = false; scheduleSteep(); }
    };
    const slice = () => {
      if (!is3D) { finish(); return; }                 // retour en 2D : arrêt
      const until = performance.now() + 8;
      for (; k < steepSamples.length && performance.now() < until; k++) {
        if (sampleZoom[k] >= zoom) continue;
        const i = steepSamples[k];
        const [lng, lat] = race.lngLat[i];
        if (sampleZoom[k] >= 0 && !bounds.contains([lng, lat])) continue;
        const a = race.lngLat[steepSamples[Math.max(0, k - 1)]], b = race.lngLat[steepSamples[Math.min(steepSamples.length - 1, k + 1)]];
        const kx = 111320 * Math.cos(lat * Math.PI / 180), ky = 110540;
        const dx = (b[0] - a[0]) * kx, dy = (b[1] - a[1]) * ky, len = Math.hypot(dx, dy) || 1;
        const ox = -dy / len * d / kx, oy = dx / len * d / ky;   // perpendiculaire au tracé, en degrés
        const left = map.queryTerrainElevation([lng + ox, lat + oy]);
        const right = map.queryTerrainElevation([lng - ox, lat - oy]);
        if (left == null || right == null) continue;
        const f = Math.max(C.steepMinWidth, Math.cos(Math.atan(Math.abs(left - right) / (2 * d))));
        if (Math.abs(f - sampleSteep[k]) >= 0.05) changed = true;
        sampleSteep[k] = f;
        sampleZoom[k] = zoom;
      }
      if (k < steepSamples.length) { setTimeout(slice, 0); return; }   // rend la main (rendu, zoom), sans attendre une image
      if (!changed) { finish(); return; }
      // Report sur tous les points : valeur la plus faible des deux échantillons qui les encadrent
      for (let s = 0; s < steepSamples.length - 1; s++) {
        const f = Math.min(sampleSteep[s], sampleSteep[s + 1]);
        for (let i = steepSamples[s]; i < steepSamples[s + 1]; i++) steep[i] = f;
      }
      steep[nPts - 1] = sampleSteep.at(-1);
      refreshTraceData();
      finish();
    };
    slice();
  }
  // Mesure différée (250 ms) après chaque mouvement et chaque tuile de relief reçue, pas pendant un mouvement ;
  // pas sur « idle », qui peut ne jamais venir tant que des tuiles se chargent en 3D
  let steepTimer = null;
  const scheduleSteep = () => { clearTimeout(steepTimer); steepTimer = setTimeout(() => { if (!map.isMoving()) measureSteep(); }, 250); };
  map.on('moveend', scheduleSteep);
  map.on('sourcedata', e => { if (e.sourceId === 'dem' && e.tile) scheduleSteep(); });
  const badgesGeo = {
    type: 'FeatureCollection',
    features: colored.map(c => ({
      type: 'Feature',
      properties: { num: c.num, color: CAT_COLORS[c.cat], label: `#${c.num} · +${c.dplus} m · ${c.pct.toFixed(1)} %`, steep: steepText(c) },
      geometry: { type: 'Point', coordinates: race.lngLat[c.endIdx] }
    }))
  };

  // Flèches de direction : tous les km, avec 4 niveaux de densité selon le zoom
  const arrowsGeo = (() => {
    const features = [];
    let nextKm = 1;
    for (let i = 1; i < race.points.length; i++) {
      if (race.dist[i] < nextKm) continue;
      const km = Math.round(race.dist[i]);
      const tier = km % 10 === 0 ? 1 : km % 5 === 0 ? 2 : km % 2 === 0 ? 3 : 4;
      features.push({
        type: 'Feature',
        properties: { bearing: bearingBetween(race.points[i - 1], race.points[i]), tier },
        geometry: { type: 'Point', coordinates: race.lngLat[i] }
      });
      nextKm++;
    }
    return { type: 'FeatureCollection', features };
  })();

  // Bornes kilométriques tous les 5 km (les dizaines toujours visibles)
  const kmGeo = {
    type: 'FeatureCollection',
    features: Array.from({ length: Math.floor(race.totalKm / 5) }, (_, k) => (k + 1) * 5)
      .filter(km => km < race.totalKm)
      .map(km => ({
        type: 'Feature',
        properties: { km, major: km % 10 === 0 },
        geometry: { type: 'Point', coordinates: race.lngLat[race.idxAtKm(km)] }
      }))
  };

  const aidGeo = {
    type: 'FeatureCollection',
    features: race.aidStations.map((a, i) => ({
      type: 'Feature', properties: { name: a.name, km: a.km, idx: i, cutoff: a.cutoff ? fmtClock(a.cutoff.time) : '' },
      geometry: { type: 'Point', coordinates: [a.lng, a.lat] }
    }))
  };

  // Icône des ravitaillements en image (MapLibre ne dessine que des images), rendue en 4×
  const aidImage = brandIconImage(race, brandIconColor(race), 64);   // 16 px à l'écran (pixelRatio 4)

  // ── Marqueurs DOM permanents (survivent aux changements de fond) ──
  const addDot = (lngLat, html, popup) => {
    const el = document.createElement('div');
    el.innerHTML = html;
    return new maplibregl.Marker({ element: el }).setLngLat(lngLat)
      .setPopup(new maplibregl.Popup({ offset: 14 }).setHTML(popup)).addTo(map);
  };
  if (race.isLoop) {
    // Boucle : une seule pastille, sinon l'arrivée masque exactement le départ
    addDot(race.lngLat[0], `<div class="map-endpoint">${icon('flag', 13)}</div>`, '<b>Départ / Arrivée</b>');
  } else {
    addDot(race.lngLat[0], `<div class="map-endpoint">${icon('play', 12)}</div>`, '<b>Départ</b>');
    addDot(race.lngLat[race.lngLat.length - 1], `<div class="map-endpoint">${icon('flag', 13)}</div>`, '<b>Arrivée</b>');
  }

  // ── Panneau : fonds de carte + mode du tracé ──
  const panel = document.createElement('div');
  panel.className = 'm3d-style-panel';
  const gridKeys = Object.keys(MAP_STYLES).filter(k => k !== 'topo' && !MAP_STYLES[k].deprecated);
  const oldKeys = Object.keys(MAP_STYLES).filter(k => MAP_STYLES[k].deprecated);
  panel.innerHTML = `
    <div class="m3d-panel-header">
      <span class="m3d-panel-title">Fond de carte</span>
      <button class="m3d-panel-toggle" tabindex="-1" aria-label="Replier">${icon('chevron-down', 12)}</button>
    </div>
    <div class="m3d-panel-body">
      <div class="m3d-styles-grid">
        ${gridKeys.map(k => `
          <button class="m3d-style-thumb" data-style="${k}">
            <span class="m3d-thumb-icon m3d-thumb-${k}"></span>
            <span>${MAP_STYLES[k].label}</span>
          </button>`).join('')}
      </div>
      ${MAP_STYLES.topo ? `<button class="m3d-style-thumb m3d-topo-btn" data-style="topo">
        <span class="m3d-thumb-icon m3d-thumb-topo"></span>
        <span>${MAP_STYLES.topo.label}</span>
      </button>` : ''}
      ${oldKeys.length ? `<div class="m3d-old-row" title="Anciens styles, bientôt retirés">
        <span class="m3d-old-label">Anciens</span>
        ${oldKeys.map(k => `<button class="m3d-style-thumb m3d-old-btn" data-style="${k}">${MAP_STYLES[k].label}</button>`).join('')}
      </div>` : ''}
      <div class="m3d-trace-row">
        <span class="m3d-trace-label">Tracé</span>
        <button class="m3d-trace-btn" data-mode="none">Simple</button>
        <button class="m3d-trace-btn" data-mode="slope">Pente</button>
        <button class="m3d-trace-btn" data-mode="climbs">Côtes</button>
      </div>
    </div>`;
  container.appendChild(panel);
  const header = panel.querySelector('.m3d-panel-header');
  header.addEventListener('click', () => {
    panel.querySelector('.m3d-panel-body').classList.toggle('collapsed');
    panel.querySelector('.m3d-panel-toggle').classList.toggle('collapsed');
  });
  if (C.stylePanelCollapsed) header.click();   // replié : la carte reste dégagée
  panel.querySelectorAll('.m3d-style-thumb').forEach(b => b.addEventListener('click', () => setStyle(b.dataset.style)));
  panel.querySelectorAll('.m3d-trace-btn').forEach(b => b.addEventListener('click', () => {
    emit('trace:mode', traceMode === b.dataset.mode && b.dataset.mode !== 'none' ? 'none' : b.dataset.mode);
  }));

  const legend = document.createElement('div');
  legend.className = 'slope-legend';
  legend.innerHTML = [['Plat', slopeColor(0)], ['4–7 %', slopeColor(5)], ['7–10 %', slopeColor(8)],
    ['≥ 10 %', slopeColor(12)], ['Descente', slopeColor(-5)]]
    .map(([txt, c]) => `<span><i style="background:${c}"></i>${txt}</span>`).join('');
  container.appendChild(legend);

  function refreshPanel() {
    panel.querySelectorAll('.m3d-style-thumb').forEach(b => b.classList.toggle('m3d-active', b.dataset.style === styleKey));
    const mapMode = traceMode === 'ravitaillements' ? 'none' : traceMode;
    panel.querySelectorAll('.m3d-trace-btn').forEach(b => b.classList.toggle('active', b.dataset.mode === mapMode));
    legend.classList.toggle('visible', traceMode === 'slope');
  }

  // ── Couches de l'application, ajoutées sur chaque fond ──
  function firstLabelId() {
    return map.getStyle().layers.find(l => l.type === 'symbol')?.id;
  }

  function addOverlays() {
    const style = MAP_STYLES[styleKey];
    const beforeLabels = firstLabelId();

    // Sommets : n'apparaissent qu'à partir du zoom réglé dans js/config.js, quel que soit le fond
    map.getStyle().layers
      .filter(l => l['source-layer'] === 'mountain_peak')
      .forEach(l => map.setLayerZoomRange(l.id, C.peaksMinZoom, l.maxzoom ?? 24));
    const outline = style.dark ? '#fff' : '#000';
    const halo = style.dark ? 'rgba(0,0,0,.85)' : 'rgba(255,255,255,.95)';

    if (!map.hasImage('aid-icon')) {
      const add = () => !map.hasImage('aid-icon') && map.addImage('aid-icon', aidImage, { pixelRatio: 4 });
      aidImage.complete ? add() : aidImage.addEventListener('load', add, { once: true });
    }

    // Relief : la même source alimente l'ombrage (2D et 3D) et le terrain (3D)
    const highQuality = race.race.quality === 'high';
    map.addSource('dem', { type: 'raster-dem', encoding: 'terrarium', ...DEM[highQuality ? 'high' : 'standard'] });
    // IGN : qualité haute, ou toujours en usage commercial (seules photos ouvertes en France, Esri retiré)
    if ((highQuality || C.commercialUse) && styleKey === 'satellite') {
      map.addSource('ign-ortho', IGN_ORTHO);
      map.addLayer({ id: 'ign-ortho', type: 'raster', source: 'ign-ortho' }, 'spw-ortho');
    }
    map.addLayer({
      id: 'terrain-hillshade', type: 'hillshade', source: 'dem',
      paint: {
        // Lumière du nord-ouest (convention cartographique), ombres olive, doux pour laisser lire la carte
        'hillshade-illumination-direction': C.hillshadeLightDirection,
        'hillshade-illumination-anchor': 'map',
        'hillshade-exaggeration': C.hillshadeIntensity,
        'hillshade-shadow-color': '#4a5541',
        'hillshade-highlight-color': '#fffef6',
        'hillshade-accent-color': '#6e5c47'
      }
    }, beforeLabels);

    if (styleKey === 'satellite' && !C.satelliteHillshade) map.setLayoutProperty('terrain-hillshade', 'visibility', 'none');
    if (style.contours && race.contours) addContours(beforeLabels);

    map.addSource('trace', { type: 'geojson', data: traceData() });
    const lineLayout = { 'line-cap': 'round', 'line-join': 'round' };
    map.addLayer({ id: 'trace-glow', type: 'line', source: 'trace', layout: lineLayout,
      paint: { 'line-color': outline, 'line-width': traceWidth('trace-glow'), 'line-opacity': glowOpacity(), 'line-blur': 3 } });
    map.addLayer({ id: 'trace-outline', type: 'line', source: 'trace', layout: lineLayout,
      paint: { 'line-color': outline, 'line-width': traceWidth('trace-outline') } });
    map.addLayer({ id: 'trace-line', type: 'line', source: 'trace', layout: lineLayout,
      paint: { 'line-color': ['coalesce', ['get', 'color'], traceColor], 'line-width': traceWidth('trace-line') } });

    // Côtes colorées par catégorie (mode « Côtes »)
    map.addSource('climbs', { type: 'geojson', data: climbsData() });
    map.addLayer({ id: 'climbs-line', type: 'line', source: 'climbs', layout: lineLayout,
      paint: { 'line-color': ['get', 'color'], 'line-width': traceWidth('climbs-line') } });

    // Côte sélectionnée
    map.addSource('climb-hl', { type: 'geojson', data: EMPTY });
    map.addLayer({ id: 'climb-hl-outline', type: 'line', source: 'climb-hl', layout: lineLayout,
      paint: { 'line-color': '#fff', 'line-width': traceWidth('climb-hl-outline') } });
    map.addLayer({ id: 'climb-hl-line', type: 'line', source: 'climb-hl', layout: lineLayout,
      paint: { 'line-color': '#e74c3c', 'line-width': traceWidth('climb-hl-line') } });

    map.addSource('arrows', { type: 'geojson', data: arrowsGeo });
    map.addLayer({
      id: 'trace-arrows', type: 'symbol', source: 'arrows',
      // avant le 1er zoom : aucune ; puis tous les 10 km → 5 km → 2 km → 1 km
      filter: ['<=', ['get', 'tier'], ['step', ['zoom'], 0, ...C.arrowsZooms.flatMap((z, i) => [z, i + 1])]],
      layout: {
        'text-field': '▲', 'text-font': ['Noto Sans Bold'], 'text-size': 13,
        'text-rotate': ['get', 'bearing'], 'text-rotation-alignment': 'map', 'text-pitch-alignment': 'map',
        'text-allow-overlap': true, 'text-ignore-placement': true
      },
      paint: { 'text-color': traceColor, 'text-halo-color': 'rgba(255,255,255,0.9)', 'text-halo-width': 2 }
    });

    map.addSource('km', { type: 'geojson', data: kmGeo });
    const kmVisible = ['any', ['get', 'major'], ['>=', ['zoom'], C.kmMarkersEvery5Zoom]];
    map.addLayer({ id: 'km-circle', type: 'circle', source: 'km', filter: kmVisible,
      paint: {
        'circle-radius': zoomWidth(10, ['case', ['get', 'major'], 10, 8], 15, ['case', ['get', 'major'], 14, 11]),
        'circle-color': '#fff',
        'circle-stroke-color': ['case', ['get', 'major'], '#999', '#bbb'],
        'circle-stroke-width': ['case', ['get', 'major'], 2, 1]
      } });
    map.addLayer({ id: 'km-text', type: 'symbol', source: 'km', filter: kmVisible,
      layout: { 'text-field': ['to-string', ['get', 'km']], 'text-font': ['Noto Sans Bold'],
                'text-size': zoomWidth(10, 9, 15, 11), 'text-allow-overlap': true, 'text-ignore-placement': true },
      paint: { 'text-color': ['case', ['get', 'major'], '#2c3e50', '#5a7080'] } });

    map.addSource('badges', { type: 'geojson', data: badgesGeo });
    map.addLayer({ id: 'badges-circle', type: 'circle', source: 'badges',
      paint: { 'circle-radius': 10, 'circle-color': ['get', 'color'], 'circle-stroke-color': '#fff', 'circle-stroke-width': 2 } });
    map.addLayer({ id: 'badges-text', type: 'symbol', source: 'badges',
      layout: { 'text-field': ['to-string', ['get', 'num']], 'text-font': ['Noto Sans Bold'], 'text-size': 10,
                'text-allow-overlap': true, 'text-ignore-placement': true },
      paint: { 'text-color': '#fff' } });

    map.addSource('aid', { type: 'geojson', data: aidGeo });
    map.addLayer({ id: 'aid-circle', type: 'circle', source: 'aid',
      paint: { 'circle-radius': 12, 'circle-color': '#fff', 'circle-blur': 0.05 } });
    map.addLayer({ id: 'aid-icon', type: 'symbol', source: 'aid',
      layout: { 'icon-image': 'aid-icon', 'icon-allow-overlap': true, 'icon-ignore-placement': true } });
    map.addLayer({ id: 'aid-label', type: 'symbol', source: 'aid',
      layout: {
        'text-field': ['concat', ['get', 'name'], '\n',
          ['number-format', ['get', 'km'], { locale: 'fr-BE', 'max-fraction-digits': 1 }], ' km',
          ['case', ['!=', ['get', 'cutoff'], ''], ['concat', '\nBarrière ', ['get', 'cutoff']], '']],
        'text-font': ['Noto Sans Bold'], 'text-size': 11, 'text-offset': [0, 1.7], 'text-anchor': 'top'
      },
      paint: { 'text-color': style.dark ? '#fff' : '#04080b', 'text-halo-color': halo, 'text-halo-width': 1.5 } });

    // Ciel et brume (visibles en 3D). Sans brume : voile repoussé à l'horizon, le ciel reste
    const fog = styleKey === 'satellite' ? C.satelliteFog : C.fog;
    map.setSky({
      'sky-color': style.dark ? '#1a2a3a' : '#bcd8ec',
      'horizon-color': style.dark ? '#3a4a5a' : '#f5f0e8',
      'fog-color': style.dark ? '#3a4a5a' : '#f5f0e8',
      'sky-horizon-blend': 0.6, 'horizon-fog-blend': fog ? 0.7 : 0, 'fog-ground-blend': fog ? 0.6 : 1,
      'atmosphere-blend': zoomWidth(0, 1, 10, 1, 12, 0)
    });
    if (is3D) {   // nouveau fond en 3D : relief directement à la valeur du fond (pas d'animation)
      cancelAnimationFrame(exaggerationFrame);
      currentExaggeration = terrainExaggeration();
      map.setTerrain({ source: 'dem', exaggeration: currentExaggeration });
    }

    applyTraceMode();
    showHighlight(false);
  }

  function addContours(beforeId) {
    const copernicus = '<a href="https://spacedata.copernicus.eu/collections/copernicus-digital-elevation-model" target="_blank">Courbes : Copernicus DEM</a> © DLR, Airbus DS (UE, ESA)';
    map.addSource('contours-thick', { type: 'geojson', data: contourCache.thick || race.contours.thick, attribution: copernicus });
    map.addSource('contours-thin', { type: 'geojson', data: contourCache.thin || EMPTY });
    const color = '#8d7154';
    const { thick, thin, labels } = C.contoursMinZoom;   // apparition en fondu juste après le zoom réglé
    map.addLayer({ id: 'contours-thin', type: 'line', source: 'contours-thin', minzoom: thin,
      paint: { 'line-color': color, 'line-width': zoomWidth(thin, 0.4, thin + 3, 0.8),
               'line-opacity': zoomWidth(thin, 0, thin + 1.5, 0.32) } }, beforeId);
    map.addLayer({ id: 'contours-thick', type: 'line', source: 'contours-thick', minzoom: thick,
      paint: { 'line-color': color, 'line-width': zoomWidth(thick, 0.8, thick + 3, 1.2),
               'line-opacity': zoomWidth(thick, 0, thick + 2, 0.48) } }, beforeId);
    map.addLayer({ id: 'contours-labels', type: 'symbol', source: 'contours-thick', minzoom: labels,
      layout: { 'symbol-placement': 'line', 'text-field': ['concat', ['to-string', ['get', 'ele']], ' m'],
                'text-font': ['Noto Sans Regular'], 'text-size': 9, 'symbol-spacing': 400 },
      paint: { 'text-color': '#6a5440', 'text-halo-color': '#f4f1e8', 'text-halo-width': 1 } }, beforeId);
    if (!contourCache.thick) fetch(race.contours.thick).then(r => r.json()).then(d => { contourCache.thick = d; });
    loadThinContours();
  }

  function loadThinContours() {
    if (contourCache.thin || map.getZoom() < C.thinContoursLoadZoom || loadThinContours.pending) return;
    loadThinContours.pending = true;
    fetch(race.contours.thin).then(r => r.json()).then(d => {
      contourCache.thin = d;
      map.getSource('contours-thin')?.setData(d);
    }).finally(() => { loadThinContours.pending = false; });
  }
  map.on('zoomend', () => { if (map.getSource('contours-thin')) loadThinContours(); });

  // ── Mode du tracé ──
  function applyTraceMode() {
    if (!map.getLayer('trace-line')) return;
    map.getSource('trace').setData(traceData());   // mode Pente : un tronçon par changement de couleur
    const vis = traceMode === 'climbs' ? 'visible' : 'none';
    ['climbs-line', 'badges-circle', 'badges-text'].forEach(id => map.setLayoutProperty(id, 'visibility', vis));
    refreshPanel();
  }

  // ── Sélection d'une côte ──
  function clearHighlightMarkers() {
    highlightMarkers.forEach(m => m.remove());
    highlightMarkers = [];
  }

  function showHighlight(fly) {
    clearHighlightMarkers();
    const src = map.getSource('climb-hl');
    if (!selected) { src?.setData(EMPTY); return; }
    const coords = race.lngLat.slice(selected.startIdx, selected.endIdx + 1);
    src?.setData(highlightData());
    const label = race.climbLabel(selected);
    highlightMarkers = [
      addDot(race.lngLat[selected.startIdx], dotHtml('S', '#e74c3c'), `<b>${label}</b><br>Départ côte`),
      addDot(race.lngLat[selected.endIdx], dotHtml('E', '#8e44ad'), `<b>${label}</b><br>Sommet`)
    ];
    if (fly) flyToClimb(coords);
  }

  // Caméra 3D derrière la côte, face à la pente (sans animation, pour le fondu enchaîné)
  function jumpToClimb3D(coords) {
    const bearing = bearingBetween(race.points[selected.startIdx], race.points[selected.endIdx]);
    const cam = map.cameraForBounds(boundsOf(coords), { padding: 80, bearing, maxZoom: C.climbMaxZoom.map3D });
    if (cam) map.jumpTo({ ...cam, zoom: cam.zoom - 0.4, pitch: C.climbFlightPitch, bearing });
  }

  function flyToClimb(coords) {
    const bounds = boundsOf(coords);
    if (!is3D) {
      map.fitBounds(bounds, { padding: 60, maxZoom: C.climbMaxZoom.map2D, duration: C.animationDuration.climb2D });
      return;
    }
    // 3D : caméra derrière la côte, face à la pente
    const bearing = bearingBetween(race.points[selected.startIdx], race.points[selected.endIdx]);
    const cam = map.cameraForBounds(bounds, { padding: 80, bearing, maxZoom: C.climbMaxZoom.map3D });
    if (cam) map.flyTo({ ...cam, zoom: cam.zoom - 0.4, pitch: C.climbFlightPitch, bearing,
                         duration: C.animationDuration.climb3D, essential: true });
  }

  // ── Changement de fond ──
  function setStyle(key) {
    if (key === styleKey || !MAP_STYLES[key]) return;
    styleKey = key;
    // Relief retiré pendant le chargement du nouveau style (style.load le remet) : sinon MapLibre peut dessiner
    // le terrain avant que la projection du nouveau style soit prête (erreur « shaderPreludeCode »)
    if (map.getTerrain()) map.setTerrain(null);
    map.setStyle(MAP_STYLES[key].url);
    refreshPanel();
  }
  // style.load se déclenche au premier chargement et après chaque setStyle
  map.on('style.load', addOverlays);

  // Icône des sommets du style « Sentiers », fournie à la demande
  const peakImage = new Image(28, 28);
  peakImage.src = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(PEAK_ICON.svg);
  map.on('styleimagemissing', e => {
    if (e.id !== PEAK_ICON.id) return;
    const add = () => !map.hasImage(PEAK_ICON.id) && map.addImage(PEAK_ICON.id, peakImage, { pixelRatio: 2 });
    peakImage.complete ? add() : peakImage.addEventListener('load', add, { once: true });
  });

  // ── 2D / 3D ──
  // Exagération du relief : réglée par course (course.json, ex. ×2,5 pour un relief doux comme les Ardennes),
  // sinon celle du fond de carte
  const terrainExaggeration = () => race.race.terrainExaggeration ?? MAP_STYLES[styleKey].exag;

  function setRotation(enabled) {
    if (enabled) { map.dragRotate.enable(); map.touchZoomRotate.enableRotation(); map.keyboard.enableRotation(); }
    else { map.dragRotate.disable(); map.touchZoomRotate.disableRotation(); map.keyboard.disableRotation(); }
    map.touchPitch[enabled ? 'enable' : 'disable']();
  }

  // Relief qui monte (ou s'aplatit) progressivement, en même temps que la caméra s'incline :
  // évite le saut brutal du dénivelé au passage 2D ↔ 3D
  let exaggerationFrame = null;
  let currentExaggeration = 0;
  function animateExaggeration(to, duration, done) {
    cancelAnimationFrame(exaggerationFrame);
    if (!map.getSource('dem')) return done?.();
    // Terrain créé une seule fois ; ensuite seule sa valeur d'exagération change à chaque image
    // (setTerrain recrée le terrain et sa texture de rendu : trop coûteux pour une animation)
    if (!map.terrain) map.setTerrain({ source: 'dem', exaggeration: currentExaggeration });
    const from = currentExaggeration, start = performance.now();
    const ease = t => (t < 0.5 ? 2 * t * t : 1 - (-2 * t + 2) ** 2 / 2);
    const step = now => {
      const t = Math.min(1, (now - start) / duration);
      currentExaggeration = from + (to - from) * ease(t);
      if (map.terrain) {
        map.terrain.exaggeration = currentExaggeration;
        map.terrain.options.exaggeration = currentExaggeration;
        map.triggerRepaint();
      }
      if (t < 1) { exaggerationFrame = requestAnimationFrame(step); return; }
      if (to > 0) map.setTerrain({ source: 'dem', exaggeration: to });   // état final par l'API officielle
      done?.();
    };
    exaggerationFrame = requestAnimationFrame(step);
  }

  // ── Fondu enchaîné : image figée de la carte par-dessus, bascule instantanée dessous, puis effacement ──
  function snapshot() {
    // Copie du canvas WebGL pendant l'évènement « render », avant que le navigateur n'efface le tampon ;
    // drawImage sur un canvas 2D est immédiat (un encodage JPEG prend jusqu'à plusieurs centaines de ms)
    return new Promise(resolve => {
      const done = copy => { map.off('render', onRender); clearTimeout(timer); resolve(copy); };
      const onRender = () => {
        const src = map.getCanvas(), copy = document.createElement('canvas');
        copy.width = src.width; copy.height = src.height;
        copy.style.width = src.style.width; copy.style.height = src.style.height;   // superposition au pixel près
        try { copy.getContext('2d').drawImage(src, 0, 0); done(copy); } catch { done(null); }
      };
      const timer = setTimeout(() => done(null), C.fadeSnapshotWait);   // rendu trop lent : bascule sans fondu
      map.on('render', onRender);
      map.triggerRepaint();
    });
  }

  let fadeOverlay = null;
  async function crossfade(change, label) {
    fadeOverlay?.remove();
    const image = await snapshot();
    // Image figée voilée et floutée dès le clic ; pastille « Passage en 3D… » si la bascule dure (CSS, fadeLabelDelay)
    fadeOverlay = null;
    if (image) {
      fadeOverlay = document.createElement('div');
      fadeOverlay.className = 'map-crossfade';
      fadeOverlay.style.transitionDuration = `${C.fadeDuration}ms`;
      fadeOverlay.style.setProperty('--fade-label-delay', `${C.fadeLabelDelay}ms`);
      image.className = 'map-crossfade-image';
      const pill = document.createElement('div');
      pill.className = 'map-crossfade-label';
      pill.setAttribute('role', 'status');
      pill.textContent = label;
      const veil = document.createElement('div');
      veil.className = 'map-crossfade-veil';
      fadeOverlay.append(image, veil, pill);
      container.appendChild(fadeOverlay);
    }
    // Bascule à l'image suivante : la faire pendant l'évènement « render » casse le rendu en cours
    await new Promise(requestAnimationFrame);
    change();
    const overlay = fadeOverlay;
    if (!overlay) return;
    // Effacer l'image quand la nouvelle vue est dessinée (ou après fadeMaxWait si les tuiles tardent)
    await new Promise(resolve => { map.once('idle', resolve); setTimeout(resolve, C.fadeMaxWait); });
    overlay.style.opacity = '0';
    await new Promise(resolve => setTimeout(resolve, C.fadeDuration + 50));
    overlay.remove();
  }

  // Renvoie une promesse résolue à la fin de la bascule (fondu) : l'appelant peut bloquer le bouton entre-temps
  function setMode3D(enabled) {
    is3D = enabled;
    setRotation(enabled);
    if (C.mode3DTransition === 'fade') {
      return crossfade(() => {
        cancelAnimationFrame(exaggerationFrame);
        applyTraceWidths();   // sous l'image figée : le changement d'épaisseur ne se voit pas
        if (enabled) {
          currentExaggeration = terrainExaggeration();
          if (map.getSource('dem')) map.setTerrain({ source: 'dem', exaggeration: currentExaggeration });
          if (selected) jumpToClimb3D(race.lngLat.slice(selected.startIdx, selected.endIdx + 1));
          else map.jumpTo({ pitch: C.pitch3D, bearing: C.bearing3D });
        } else {
          currentExaggeration = 0;
          map.setTerrain(null);
          map.jumpTo({ pitch: 0, bearing: 0 });
        }
      }, enabled ? 'Passage en 3D…' : 'Retour en 2D…');
    }
    applyTraceWidths();
    if (enabled) {
      const duration = selected ? C.animationDuration.climb3D : C.animationDuration.enter3D;
      animateExaggeration(terrainExaggeration(), duration);
      if (selected) flyToClimb(race.lngLat.slice(selected.startIdx, selected.endIdx + 1));
      else map.easeTo({ pitch: C.pitch3D, bearing: C.bearing3D, duration });
    } else {
      animateExaggeration(0, C.animationDuration.exit3D, () => { if (!is3D) map.setTerrain(null); });
      map.easeTo({ pitch: 0, bearing: 0, duration: C.animationDuration.exit3D });
    }
    return Promise.resolve();
  }

  // ── Interactions ──
  const pointer = id => {
    map.on('mouseenter', id, () => { map.getCanvas().style.cursor = 'pointer'; });
    map.on('mouseleave', id, () => { map.getCanvas().style.cursor = ''; });
  };
  ['badges-circle', 'aid-circle'].forEach(pointer);
  map.on('click', 'badges-circle', e => emit('climb:select-num', e.features[0].properties.num));
  // Au survol : numéro, dénivelé et pente en texte (la couleur seule ne suffit pas)
  const badgeTip = new maplibregl.Popup({ closeButton: false, closeOnClick: false, offset: 14 });
  map.on('mouseenter', 'badges-circle', e => {
    const f = e.features[0];
    badgeTip.setLngLat(f.geometry.coordinates).setHTML(`<b>Côte ${f.properties.label}</b><br>Plus raide : ${f.properties.steep}`).addTo(map);
  });
  map.on('mouseleave', 'badges-circle', () => badgeTip.remove());
  map.on('click', 'aid-circle', e => {
    const idx = e.features[0].properties.idx, aid = race.aidStations[idx];
    new maplibregl.Popup({ offset: 14, className: 'aid-popup' }).setLngLat(e.features[0].geometry.coordinates)
      .setHTML(`<b>${brandIconSvg(race, 'currentColor', 14)} Ravitaillement</b><br>${escapeHtml(aid.name)} · km ${aid.km.toLocaleString('fr-BE')}`
        + aidDetailsHtml(aid, icon) + aidLegsHtml(race, idx)
        + (aid.supplies?.length ? '' : '<div class="aid-note">Contenu non communiqué</div>'))
      .addTo(map);
  });

  on('trace:mode', mode => { traceMode = mode; applyTraceMode(); });
  on('climb:select', climb => { selected = climb; showHighlight(!!climb); });
  on('cursor:move', km => {
    const pos = race.lngLat[race.idxAtKm(km)];
    if (!cursorMarker) {
      const el = document.createElement('div');
      el.className = 'cursor-dot';
      cursorMarker = new maplibregl.Marker({ element: el }).setLngLat(pos).addTo(map);
    } else cursorMarker.setLngLat(pos);
  });
  on('cursor:stop', () => { cursorMarker?.remove(); cursorMarker = null; });

  return {
    map,
    setMode3D,
    is3D: () => is3D,
    resize: () => map.resize(),
    styleKey: () => styleKey
  };
}
