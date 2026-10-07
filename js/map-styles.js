// ── Fonds de carte ────────────────────────────────────────────────────
// Tous les fonds utilisent les polices OpenFreeMap (Noto Sans) : les libellés
// ajoutés par l'application (km, ravitaillements, côtes) s'affichent partout.

import { SENTIERS_STYLE } from './style-sentiers.js';
import { MAP_CONFIG } from './config.js';

// ── Style « Terrain » (ANCIEN, à supprimer : palette reprise de LiveTrail) ──
// Palette chaude inspirée des cartes topo : fond crème, végétation translucide
// pour laisser passer l'ombrage du relief, sentiers en pointillés.
const TERRAIN_NAME = ['coalesce', ['get', 'name:fr'], ['get', 'name']];
export const zoomWidth = (...stops) => ['interpolate', ['linear'], ['zoom'], ...stops];
const classIs = (...classes) => ['in', ['get', 'class'], ['literal', classes]];

function terrainRoadLayers() {
  // [classe(s), minzoom, couleur bordure, couleur trait, largeurs bordure, largeurs trait]
  const roads = [
    [['minor', 'service'], 12, '#b8a888', '#ffffff', [12, 1.2, 16, 5],   [12, 0.6, 16, 3.5]],
    [['tertiary'],         10, '#b8a878', '#fdf5dc', [10, 1.6, 16, 7],   [10, 0.8, 16, 5]],
    [['secondary'],         9, '#b8a060', '#fbecb0', [9, 1.8, 16, 8.5],  [9, 1, 16, 6.5]],
    [['primary'],           8, '#b08838', '#f4ce80', [8, 2.5, 16, 11],   [8, 1.5, 16, 8.5]],
    [['trunk'],             7, '#b06028', '#f4b870', [7, 2.8, 16, 12],   [7, 1.8, 16, 9.5]],
    [['motorway'],          6, '#a85820', '#f0a858', [6, 3, 16, 13],     [6, 2, 16, 10.5]]
  ];
  const cases = roads.map(([cls, minzoom, caseColor, , caseW]) => ({
    id: `road-${cls[0]}-case`, type: 'line', source: 'openmaptiles', 'source-layer': 'transportation',
    minzoom, filter: ['all', classIs(...cls), ['!=', ['get', 'brunnel'], 'tunnel']],
    layout: { 'line-cap': 'round', 'line-join': 'round' },
    paint: { 'line-color': caseColor, 'line-width': zoomWidth(...caseW) }
  }));
  const fills = roads.map(([cls, minzoom, , color, , w]) => ({
    id: `road-${cls[0]}`, type: 'line', source: 'openmaptiles', 'source-layer': 'transportation',
    minzoom, filter: ['all', classIs(...cls), ['!=', ['get', 'brunnel'], 'tunnel']],
    layout: { 'line-cap': 'round', 'line-join': 'round' },
    paint: { 'line-color': color, 'line-width': zoomWidth(...w) }
  }));
  return [...cases, ...fills];
}

const TERRAIN_STYLE = {
  version: 8,
  name: 'Trail Terrain',
  glyphs: 'https://tiles.openfreemap.org/fonts/{fontstack}/{range}.pbf',
  sources: {
    openmaptiles: {
      type: 'vector',
      url: 'https://tiles.openfreemap.org/planet',
      attribution: '<a href="https://openfreemap.org" target="_blank">OpenFreeMap</a> © <a href="https://www.openmaptiles.org/" target="_blank">OpenMapTiles</a> © <a href="https://www.openstreetmap.org/copyright" target="_blank">OpenStreetMap</a>'
    }
  },
  layers: [
    { id: 'background', type: 'background', paint: { 'background-color': '#f5f0e8' } },
    { id: 'landcover-farmland', type: 'fill', source: 'openmaptiles', 'source-layer': 'landcover',
      filter: classIs('farmland'), paint: { 'fill-color': '#efe8d4', 'fill-opacity': 0.6 } },
    { id: 'landcover-grass', type: 'fill', source: 'openmaptiles', 'source-layer': 'landcover',
      filter: classIs('grass'), paint: { 'fill-color': '#d4e8b0', 'fill-opacity': 0.7 } },
    { id: 'landcover-wetland', type: 'fill', source: 'openmaptiles', 'source-layer': 'landcover',
      filter: classIs('wetland'), paint: { 'fill-color': '#c8dcc0', 'fill-opacity': 0.7 } },
    { id: 'landcover-wood', type: 'fill', source: 'openmaptiles', 'source-layer': 'landcover',
      filter: classIs('wood'), paint: { 'fill-color': '#9ec87a', 'fill-opacity': 0.7 } },
    { id: 'landcover-rock', type: 'fill', source: 'openmaptiles', 'source-layer': 'landcover',
      filter: classIs('rock', 'sand'), paint: { 'fill-color': '#d8cfc0', 'fill-opacity': 0.8 } },
    { id: 'landcover-ice', type: 'fill', source: 'openmaptiles', 'source-layer': 'landcover',
      filter: classIs('ice'), paint: { 'fill-color': '#eef5ff', 'fill-opacity': 0.9 } },
    { id: 'landuse-residential', type: 'fill', source: 'openmaptiles', 'source-layer': 'landuse',
      minzoom: 10, filter: classIs('residential', 'suburb', 'neighbourhood'),
      paint: { 'fill-color': '#e6dccd', 'fill-opacity': zoomWidth(10, 0.4, 14, 0.7) } },
    { id: 'water', type: 'fill', source: 'openmaptiles', 'source-layer': 'water',
      paint: { 'fill-color': '#89c4e1' } },
    { id: 'waterway-river', type: 'line', source: 'openmaptiles', 'source-layer': 'waterway',
      filter: classIs('river'), layout: { 'line-cap': 'round', 'line-join': 'round' },
      paint: { 'line-color': '#89c4e1', 'line-width': zoomWidth(6, 0.5, 12, 2.5, 16, 5) } },
    { id: 'waterway-stream', type: 'line', source: 'openmaptiles', 'source-layer': 'waterway',
      minzoom: 11, filter: classIs('stream', 'canal', 'drain', 'ditch'),
      layout: { 'line-cap': 'round', 'line-join': 'round' },
      paint: { 'line-color': '#89c4e1', 'line-width': zoomWidth(11, 0.5, 16, 1.8) } },
    { id: 'boundary-country', type: 'line', source: 'openmaptiles', 'source-layer': 'boundary',
      filter: ['all', ['==', ['get', 'admin_level'], 2], ['!=', ['get', 'maritime'], 1]],
      paint: { 'line-color': '#9a8870', 'line-width': zoomWidth(2, 0.8, 8, 2), 'line-dasharray': [4, 2] } },
    { id: 'boundary-region', type: 'line', source: 'openmaptiles', 'source-layer': 'boundary',
      minzoom: 6, filter: ['all', ['==', ['get', 'admin_level'], 4], ['!=', ['get', 'maritime'], 1]],
      paint: { 'line-color': '#b8a888', 'line-width': 0.8, 'line-dasharray': [3, 2] } },
    { id: 'road-track', type: 'line', source: 'openmaptiles', 'source-layer': 'transportation',
      minzoom: 11, filter: classIs('track'),
      paint: { 'line-color': '#a07040', 'line-width': zoomWidth(11, 0.8, 16, 1.8), 'line-dasharray': [5, 2] } },
    { id: 'road-path', type: 'line', source: 'openmaptiles', 'source-layer': 'transportation',
      minzoom: 12, filter: classIs('path'),
      paint: { 'line-color': '#b85820', 'line-width': zoomWidth(12, 0.7, 16, 1.5), 'line-dasharray': [3, 2] } },
    ...terrainRoadLayers(),
    { id: 'building', type: 'fill', source: 'openmaptiles', 'source-layer': 'building',
      minzoom: 14, paint: { 'fill-color': '#d9cfc0', 'fill-outline-color': '#c4b8a4' } },
    { id: 'road-label', type: 'symbol', source: 'openmaptiles', 'source-layer': 'transportation_name',
      minzoom: 13, filter: classIs('primary', 'secondary', 'tertiary', 'minor'),
      layout: { 'symbol-placement': 'line', 'text-field': TERRAIN_NAME,
                'text-font': ['Noto Sans Regular'], 'text-size': 10 },
      paint: { 'text-color': '#6a5838', 'text-halo-color': '#f5f0e8', 'text-halo-width': 1.5 } },
    { id: 'water-label', type: 'symbol', source: 'openmaptiles', 'source-layer': 'water_name',
      minzoom: 8, layout: { 'text-field': TERRAIN_NAME, 'text-font': ['Noto Sans Italic'], 'text-size': 11 },
      paint: { 'text-color': '#2a6888', 'text-halo-color': '#f5f0e8', 'text-halo-width': 1 } },
    { id: 'waterway-label', type: 'symbol', source: 'openmaptiles', 'source-layer': 'waterway',
      minzoom: 12, filter: classIs('river', 'stream'),
      layout: { 'symbol-placement': 'line', 'text-field': TERRAIN_NAME,
                'text-font': ['Noto Sans Italic'], 'text-size': 10 },
      paint: { 'text-color': '#2a6888', 'text-halo-color': '#f5f0e8', 'text-halo-width': 1 } },
    { id: 'mountain-peak', type: 'symbol', source: 'openmaptiles', 'source-layer': 'mountain_peak',
      minzoom: 11,
      layout: { 'text-field': ['concat', '▲ ', TERRAIN_NAME, '\n', ['to-string', ['get', 'ele']], ' m'],
                'text-font': ['Noto Sans Regular'], 'text-size': 10, 'text-anchor': 'top' },
      paint: { 'text-color': '#5a3a1a', 'text-halo-color': '#f5f0e8', 'text-halo-width': 1.5 } },
    { id: 'place-village', type: 'symbol', source: 'openmaptiles', 'source-layer': 'place',
      minzoom: 10, filter: classIs('village', 'hamlet'),
      layout: { 'text-field': TERRAIN_NAME, 'text-font': ['Noto Sans Regular'],
                'text-size': zoomWidth(10, 10, 14, 13) },
      paint: { 'text-color': '#5a4830', 'text-halo-color': '#f5f0e8', 'text-halo-width': 1.5 } },
    { id: 'place-town', type: 'symbol', source: 'openmaptiles', 'source-layer': 'place',
      minzoom: 7, filter: classIs('town'),
      layout: { 'text-field': TERRAIN_NAME, 'text-font': ['Noto Sans Bold'],
                'text-size': zoomWidth(7, 11, 14, 15) },
      paint: { 'text-color': '#2a1808', 'text-halo-color': '#f5f0e8', 'text-halo-width': 1.5 } },
    { id: 'place-city', type: 'symbol', source: 'openmaptiles', 'source-layer': 'place',
      filter: classIs('city'),
      layout: { 'text-field': TERRAIN_NAME, 'text-font': ['Noto Sans Bold'],
                'text-size': zoomWidth(5, 12, 12, 18) },
      paint: { 'text-color': '#3a2810', 'text-halo-color': '#f5f0e8', 'text-halo-width': 1.5 } }
  ]
};

// Style inline pour OpenTopoMap (courbes de niveau natives)
const TOPO_STYLE = {
  version: 8,
  glyphs: 'https://tiles.openfreemap.org/fonts/{fontstack}/{range}.pbf',
  sources: {
    topo: {
      type: 'raster',
      tiles: ['https://tile.opentopomap.org/{z}/{x}/{y}.png'],
      tileSize: 256, maxzoom: 17,
      attribution: '© <a href="https://opentopomap.org" target="_blank">OpenTopoMap</a> (CC-BY-SA) | © OpenStreetMap contributors'
    }
  },
  layers: [{ id: 'topo-base', type: 'raster', source: 'topo' }]
};

// Satellite : Esri partout, orthophotos officielles du SPW (dernière campagne)
// par-dessus en Wallonie. Export ArcGIS reprojeté en Web Mercator, image 512 px
// pour des tuiles 256 → net sur écran Retina ; PNG transparent hors couverture.
const SPW_ORTHO = 'https://geoservices.wallonie.be/arcgis/rest/services/IMAGERIE/ORTHO_LAST/MapServer/export'
  + '?bbox={bbox-epsg-3857}&bboxSR=3857&imageSR=3857&size=512,512&format=png32&transparent=true&f=image';
const SPW_ATTRIBUTION = 'Sources des données : <a href="https://geoportail.wallonie.be" target="_blank">SPW</a> (orthophotos)';
const SAT_STYLE = {
  version: 8,
  glyphs: 'https://tiles.openfreemap.org/fonts/{fontstack}/{range}.pbf',
  sources: {
    satellite: {
      type: 'raster',
      tiles: ['https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}'],
      tileSize: 256, maxzoom: 19,
      attribution: 'Source : Esri, Maxar, Earthstar Geographics et la communauté des utilisateurs SIG'
    },
    'spw-ortho': {
      type: 'raster',
      tiles: [SPW_ORTHO],
      tileSize: 256, minzoom: 10, maxzoom: 19,
      bounds: [2.84, 49.49, 6.41, 50.82],
      attribution: SPW_ATTRIBUTION
    }
  },
  layers: [
    { id: 'sat-base', type: 'raster', source: 'satellite' },
    { id: 'spw-ortho', type: 'raster', source: 'spw-ortho' }
  ]
};

// Photos aériennes sous licence ouverte (usage commercial, réglage commercialUse) : orthophotos SPW (Wallonie)
// et IGN (France, ajoutées par map.js) sur le fond Sentiers sans libellés ; ailleurs, la carte reste visible
// au lieu d'un vide. Esri, dont les conditions excluent cet usage sans licence ArcGIS, n'est pas utilisé.
const OPEN_ORTHO_STYLE = {
  ...SENTIERS_STYLE,
  sources: { ...SENTIERS_STYLE.sources, 'spw-ortho': SAT_STYLE.sources['spw-ortho'] },
  layers: [
    ...SENTIERS_STYLE.layers.filter(l => l.type !== 'symbol'),
    { id: 'spw-ortho', type: 'raster', source: 'spw-ortho' }
  ]
};

// Carte OpenStreetMap classique (ancien fond 2D par défaut)
const OSM_STYLE = {
  version: 8,
  glyphs: 'https://tiles.openfreemap.org/fonts/{fontstack}/{range}.pbf',
  sources: {
    osm: {
      type: 'raster',
      tiles: ['https://tile.openstreetmap.org/{z}/{x}/{y}.png'],
      tileSize: 256, maxzoom: 19,
      attribution: '© <a href="https://www.openstreetmap.org/copyright" target="_blank">OpenStreetMap</a>'
    }
  },
  layers: [{ id: 'osm-base', type: 'raster', source: 'osm' }]
};

// dark : libellés et ciel adaptés aux fonds sombres ; contours : courbes de niveau Copernicus
// deprecated : ancien style, encore proposé (grisé) mais à supprimer (palette et réglages repris de LiveTrail)
// nonCommercial : serveur dont les conditions excluent (ou déconseillent) un usage commercial, retiré quand
// commercialUse est activé (js/config.js, docs/LICENCES.md)
const COMMERCIAL = MAP_CONFIG.commercialUse;
const ALL_STYLES = {
  sentiers:  { url: SENTIERS_STYLE,                                  label: 'Sentiers',   exag: 1.5, contours: true },
  osm:       { url: OSM_STYLE,                                       label: 'OSM',        exag: 1.3, nonCommercial: true },
  satellite: COMMERCIAL
    ? { url: OPEN_ORTHO_STYLE, label: 'Photos', exag: 1.5, dark: true }
    : { url: SAT_STYLE,        label: 'Satellite', exag: 1.5, dark: true },
  bright:    { url: 'https://tiles.openfreemap.org/styles/bright',   label: 'Streets',    exag: 1.0 },
  positron:  { url: 'https://tiles.openfreemap.org/styles/positron', label: 'Light',      exag: 0.8 },
  dark:      { url: 'https://tiles.openfreemap.org/styles/dark',     label: 'Dark',       exag: 0.8, dark: true },
  topo:      { url: TOPO_STYLE,                                      label: 'Topo (courbes)', exag: 1.4, nonCommercial: true },
  topotrail: { url: 'styles/topo-trail.json', label: 'Topo trail', exag: 1.5, contours: true, deprecated: true },
  terrain:   { url: TERRAIN_STYLE,            label: 'Terrain',    exag: 1.5, contours: true, deprecated: true }
};
export const MAP_STYLES = Object.fromEntries(
  Object.entries(ALL_STYLES).filter(([, st]) => !(COMMERCIAL && st.nonCommercial)));

