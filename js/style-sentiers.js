// ── Style « Sentiers » : fond de carte propre à trace-view ────────────────
// Tuiles vectorielles OpenFreeMap (schéma OpenMapTiles). Conçu pour le trail : les chemins de terre
// ressortent, le reste s'efface. Palette définie ici (conventions cartographiques usuelles : forêt verte,
// eau bleue, routes chaudes), réglée pour rester lisible sous le tracé rouge et sur l'ombrage du relief.

// Palette
const C = {
  paper:      '#f4f1e8',   // fond : papier ivoire
  farmland:   '#ebe5cc',   // cultures
  meadow:     '#d9e6bd',   // prairies, pelouses
  scrub:      '#cddcaa',   // broussailles, landes
  forest:     '#aed096',   // forêts : vert tendre, laisse voir le relief
  wetland:    '#cfe2d6',   // zones humides
  rock:       '#e3dccd',   // rochers, sable
  ice:        '#f3f8fb',   // glace, neige
  urban:      '#e8e0d2',   // zones habitées
  building:   '#d4c9b8', buildingLine: '#bfb19c',
  water:      '#9dcbe1', river: '#7ab5d3', waterText: '#2e6c8c',
  border:     '#9c8b73',
  // Routes : remplissage (du plus important au moins important) et bordure commune
  motorway: '#e9a865', trunk: '#efbb80', primary: '#f5d08f', secondary: '#f8e3ad', tertiary: '#fbf0d4', minor: '#ffffff',
  roadCase: '#a8977b', roadCaseMajor: '#9b7d55',
  // Chemins (couleurs de terre) et voies piétonnes revêtues
  trail:      '#b4522a',   // sentier en terre : élément le plus important pour le trail
  track:      '#8b6b45',   // chemin forestier, chemin agricole
  dirtRoad:   '#9a7a52',   // bordure d'une petite route non revêtue
  pavedPath:  '#a99d8d',   // trottoir, piste cyclable, place piétonne
  // Textes
  textPlace: '#3a2f22', textVillage: '#54473a', textPeak: '#5b4128', textRoad: '#6b5c46', halo: '#f4f1e8'
};

const NAME = ['coalesce', ['get', 'name:fr'], ['get', 'name']];
const isClass = (...classes) => ['in', ['get', 'class'], ['literal', classes]];
const isUnpaved = ['!=', ['get', 'surface'], 'paved'];          // terre ou revêtement inconnu
const notTunnel = ['!=', ['get', 'brunnel'], 'tunnel'];

// Épaisseurs : une échelle unique, multipliée par le rang de la voie (z9 → z13 → z17)
const width = rank => ['interpolate', ['exponential', 1.5], ['zoom'], 9, 0.5 * rank, 13, 1.4 * rank, 17, 4 * rank];

function roadLayers() {
  // [classes, rang, couleur, zoom d'apparition]
  const roads = [
    [['minor', 'service'], 1, C.minor, 12.5],
    [['tertiary'], 1.4, C.tertiary, 10],
    [['secondary'], 1.7, C.secondary, 9],
    [['primary'], 2, C.primary, 8],
    [['trunk'], 2.3, C.trunk, 7],
    [['motorway'], 2.6, C.motorway, 6]
  ];
  const base = { type: 'line', source: 'openmaptiles', 'source-layer': 'transportation',
                 layout: { 'line-cap': 'round', 'line-join': 'round' } };
  const casings = roads.map(([cls, rank, , minzoom]) => ({
    ...base, id: `sentiers-${cls[0]}-casing`, minzoom,
    filter: ['all', isClass(...cls), notTunnel],
    paint: {
      'line-color': rank >= 2 ? C.roadCaseMajor : C.roadCase,
      'line-width': ['interpolate', ['exponential', 1.5], ['zoom'], 9, 0.5 * rank + 0.8, 13, 1.4 * rank + 1.4, 17, 4 * rank + 2.4]
    }
  }));
  const fills = roads.map(([cls, rank, color, minzoom]) => ({
    ...base, id: `sentiers-${cls[0]}`, minzoom,
    filter: ['all', isClass(...cls), notTunnel],
    paint: { 'line-color': color, 'line-width': width(rank) }
  }));
  // Petite route non revêtue : bordure en tirets couleur terre par-dessus
  const dirtRoad = {
    ...base, id: 'sentiers-minor-unpaved', minzoom: 13,
    filter: ['all', isClass('minor', 'service'), ['==', ['get', 'surface'], 'unpaved'], notTunnel],
    layout: { 'line-join': 'round' },
    paint: { 'line-color': C.dirtRoad, 'line-width': width(0.6), 'line-dasharray': [2, 2] }
  };
  return [...casings, ...fills, dirtRoad];
}

function pathLayers() {
  const base = { type: 'line', source: 'openmaptiles', 'source-layer': 'transportation' };
  const subclass = (...values) => ['in', ['get', 'subclass'], ['literal', values]];
  return [
    // Voies piétonnes revêtues (trottoirs, pistes cyclables, places) : discrètes
    { ...base, id: 'sentiers-paved-path', minzoom: 14,
      filter: ['all', isClass('path'), ['==', ['get', 'surface'], 'paved'], ['!', subclass('steps')]],
      paint: { 'line-color': C.pavedPath, 'line-width': ['interpolate', ['linear'], ['zoom'], 14, 0.5, 17, 1.2] } },
    // Chemins forestiers et agricoles : tirets longs
    { ...base, id: 'sentiers-track', minzoom: 11,
      filter: ['all', isClass('track'), isUnpaved],
      paint: { 'line-color': C.track, 'line-width': ['interpolate', ['linear'], ['zoom'], 11, 0.6, 14, 1.1, 17, 1.8],
               'line-dasharray': [6, 2.5] } },
    // Sentiers en terre : tirets courts et serrés, la ligne la plus visible après le tracé de la course
    { ...base, id: 'sentiers-trail', minzoom: 12,
      filter: ['all', isClass('path'), isUnpaved, ['!', subclass('steps', 'platform', 'pedestrian', 'cycleway')]],
      paint: { 'line-color': C.trail, 'line-width': ['interpolate', ['linear'], ['zoom'], 12, 0.6, 14, 1, 17, 1.6],
               'line-dasharray': [2.5, 1.5] } },
    // Escaliers : marches
    { ...base, id: 'sentiers-steps', minzoom: 15, filter: ['all', isClass('path'), subclass('steps')],
      paint: { 'line-color': C.trail, 'line-width': ['interpolate', ['linear'], ['zoom'], 15, 2, 17, 4],
               'line-dasharray': [0.4, 0.6] } }
  ];
}

const fill = (id, layer, classes, color, opacity, extra = {}) => ({
  id, type: 'fill', source: 'openmaptiles', 'source-layer': layer,
  filter: isClass(...classes), paint: { 'fill-color': color, 'fill-opacity': opacity }, ...extra
});

const label = (id, layer, filter, layout, color, extra = {}) => ({
  id, type: 'symbol', source: 'openmaptiles', 'source-layer': layer, ...(filter ? { filter } : {}),
  layout: { 'text-field': NAME, 'text-font': ['Noto Sans Regular'], ...layout },
  paint: { 'text-color': color, 'text-halo-color': C.halo, 'text-halo-width': 1.4, 'text-halo-blur': 0.3 }, ...extra
});

export const SENTIERS_STYLE = {
  version: 8,
  name: 'Sentiers',
  glyphs: 'https://tiles.openfreemap.org/fonts/{fontstack}/{range}.pbf',
  sources: {
    openmaptiles: {
      type: 'vector',
      url: 'https://tiles.openfreemap.org/planet',
      attribution: '<a href="https://openfreemap.org" target="_blank">OpenFreeMap</a> © <a href="https://www.openmaptiles.org/" target="_blank">OpenMapTiles</a> © <a href="https://www.openstreetmap.org/copyright" target="_blank">OpenStreetMap</a>'
    }
  },
  layers: [
    { id: 'background', type: 'background', paint: { 'background-color': C.paper } },
    fill('sentiers-farmland', 'landcover', ['farmland'], C.farmland, 0.55),
    fill('sentiers-meadow', 'landcover', ['grass'], C.meadow, 0.65),
    fill('sentiers-scrub', 'landcover', ['scrub', 'heath'], C.scrub, 0.6),
    fill('sentiers-wetland', 'landcover', ['wetland'], C.wetland, 0.6),
    fill('sentiers-forest', 'landcover', ['wood', 'forest'], C.forest, 0.62),
    fill('sentiers-rock', 'landcover', ['rock', 'sand', 'bare_rock', 'scree'], C.rock, 0.75),
    fill('sentiers-ice', 'landcover', ['ice', 'glacier', 'snow'], C.ice, 0.85),
    fill('sentiers-urban', 'landuse', ['residential', 'suburb', 'neighbourhood', 'commercial', 'industrial'], C.urban,
      ['interpolate', ['linear'], ['zoom'], 10, 0.35, 14, 0.65], { minzoom: 10 }),
    { id: 'sentiers-water', type: 'fill', source: 'openmaptiles', 'source-layer': 'water', paint: { 'fill-color': C.water } },
    { id: 'sentiers-river', type: 'line', source: 'openmaptiles', 'source-layer': 'waterway', filter: isClass('river'),
      layout: { 'line-cap': 'round', 'line-join': 'round' },
      paint: { 'line-color': C.river, 'line-width': ['interpolate', ['linear'], ['zoom'], 7, 0.6, 12, 2.2, 16, 4.5] } },
    { id: 'sentiers-stream', type: 'line', source: 'openmaptiles', 'source-layer': 'waterway', minzoom: 12,
      filter: isClass('stream', 'canal', 'drain', 'ditch'), layout: { 'line-cap': 'round' },
      paint: { 'line-color': C.river, 'line-width': ['interpolate', ['linear'], ['zoom'], 12, 0.5, 16, 1.6] } },
    { id: 'sentiers-border', type: 'line', source: 'openmaptiles', 'source-layer': 'boundary',
      filter: ['all', ['<=', ['get', 'admin_level'], 4], ['!=', ['get', 'maritime'], 1]],
      paint: { 'line-color': C.border, 'line-dasharray': [5, 2, 1, 2],
               'line-width': ['interpolate', ['linear'], ['zoom'], 6, 0.6, 12, 1.4] } },
    ...pathLayers(),
    ...roadLayers(),
    { id: 'sentiers-building', type: 'fill', source: 'openmaptiles', 'source-layer': 'building', minzoom: 14,
      paint: { 'fill-color': C.building, 'fill-outline-color': C.buildingLine } },
    label('sentiers-road-label', 'transportation_name', isClass('primary', 'secondary', 'tertiary', 'minor'),
      { 'symbol-placement': 'line', 'text-size': 10 }, C.textRoad, { minzoom: 13.5 }),
    label('sentiers-water-label', 'water_name', null,
      { 'text-font': ['Noto Sans Italic'], 'text-size': 11 }, C.waterText, { minzoom: 9 }),
    label('sentiers-waterway-label', 'waterway', isClass('river'),
      { 'symbol-placement': 'line', 'text-font': ['Noto Sans Italic'], 'text-size': 10.5, 'symbol-spacing': 350 },
      C.waterText, { minzoom: 12 }),
    // Sommets : icône montagne (ajoutée par l'application) + nom + altitude
    label('sentiers-peak', 'mountain_peak', ['has', 'ele'],
      { 'icon-image': 'sentiers-peak', 'icon-size': 1, 'icon-anchor': 'bottom',
        'text-field': ['format', NAME, {}, '\n', {}, ['concat', ['to-string', ['get', 'ele']], ' m'], { 'font-scale': 0.9 }],
        'text-size': 10, 'text-anchor': 'top', 'text-offset': [0, 0.2], 'text-optional': true },
      C.textPeak, { minzoom: 11 }),
    label('sentiers-village', 'place', isClass('village', 'hamlet'),
      { 'text-size': ['interpolate', ['linear'], ['zoom'], 10, 10, 15, 13] }, C.textVillage, { minzoom: 10 }),
    label('sentiers-town', 'place', isClass('town'),
      { 'text-font': ['Noto Sans Bold'], 'text-size': ['interpolate', ['linear'], ['zoom'], 8, 11, 14, 15] },
      C.textPlace, { minzoom: 8 }),
    label('sentiers-city', 'place', isClass('city'),
      { 'text-font': ['Noto Sans Bold'], 'text-size': ['interpolate', ['linear'], ['zoom'], 5, 12, 12, 18],
        'text-letter-spacing': 0.04 }, C.textPlace)
  ]
};

// Icône des sommets (Lucide « mountain », ISC), dessinée en image pour MapLibre
export const PEAK_ICON = {
  id: 'sentiers-peak',
  svg: `<svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="${C.halo}" stroke="${C.textPeak}"`
    + ` stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="m8 3 4 8 5-5 5 15H2L8 3z"/></svg>`
};
