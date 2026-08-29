# Changements apportés au projet trace-view

## Contexte

Application d'analyse des côtes du parcours **La Grande Ourthe 100km** (GPX).
Stack : HTML/CSS/JS vanilla, Leaflet 1.9.4, Chart.js 4.4.1, MapLibre GL JS 4.

---

## 1. Extraction du CSS vers `style.css`

**Fichiers modifiés** : `index.html`, `style.css` (créé)

- Tout le contenu du bloc `<style>` (lignes 12–418) a été extrait dans `style.css`
- Le `<head>` référence maintenant `<link rel="stylesheet" href="style.css"/>`

---

## 2. Design "Profil de course" style UTMB

**Fichiers modifiés** : `index.html`, `style.css`

### HTML — section `.chart-card`
Remplacement du titre `📈 Profil altimétrique` par :

```html
<div class="profile-header">
  <span class="profile-title">Profil de course</span>
  <span class="selection-info" id="chart-info"></span>
</div>
<div class="profile-tabs">
  <button class="profile-tab active" onclick="switchProfileTab('climbs', this)">Côtes</button>
  <button class="profile-tab" onclick="switchProfileTab('slope', this)">Pente</button>
</div>
```

### CSS ajouté (`style.css`)
- `.profile-header` : flex row, espace entre titre et info
- `.profile-title` : uppercase, bold, couleur navy `#1a2744`, underline rouge `#e8002d`
- `.profile-tabs` / `.profile-tab` : pills rondes, actif = fond navy plein
- `.profile-tab.active` : `background: #1a2744; color: #fff`

### JS — fonction `switchProfileTab`
```js
function switchProfileTab(mode, el) {
  document.querySelectorAll('.profile-tab').forEach(b => b.classList.remove('active'));
  el.classList.add('active');
  setTraceMode(mode);
}
```
- "Côtes" → `setTraceMode('climbs')` (bandes de côtes sur la carte + le graphique)
- "Pente" → `setTraceMode('slope')` (coloration par pente sur la carte + le graphique)

### Activation automatique au chargement
Après l'initialisation du chart et des plugins, ajout de :
```js
setTraceMode('climbs');
```

---

## 3. Couleurs du graphique Chart.js

**Fichiers modifiés** : `index.html`

| Élément | Avant | Après |
|---|---|---|
| Ligne principale | `#27ae60` (vert) | `#e8002d` (rouge UTMB) |
| Fill sous la courbe | `rgba(39,174,96,0.18)` | `rgba(232,0,45,0.12)` |
| Côte sélectionnée (dataset 1) | `#e74c3c` | `#1a2744` (navy) |
| Zone highlight côte | `rgba(231,76,60,0.15)` | `rgba(26,39,68,0.12)` |
| Lignes pointillées highlight | `#e74c3c` | `#1a2744` |
| Curseur ligne/dot | `#e74c3c` | `#1a2744` |
| Épaisseur ligne | `1.8` | `2.5` |

Idem pour le graphique **mobile** (`altChartMInst`).

---

## 4. Coloration du graphique par pente (mode "Pente")

**Fichiers modifiés** : `index.html`

### Pré-calculs (avant l'init carte)
```js
// D+ cumulé par point du graphique
const chartCumDplus = [0];
for (let i = 1; i < chartEle.length; i++) {
  const diff = chartEle[i] - chartEle[i - 1];
  chartCumDplus.push(chartCumDplus[i - 1] + (diff > 0 ? diff : 0));
}

// Couleur de pente par point (même algorithme WIN=6 que la carte)
const chartSlopeColors = chartKm.map(km => {
  // ... find closest GPX index, compute slope over ±6 points
  if (pct >= 10)  return '#c0392b';
  if (pct >= 7)   return '#e67e22';
  if (pct >= 4)   return '#27ae60';
  if (pct <= -4)  return '#2980b9';
  return '#aaa';
});
```

### Dans `setTraceMode(mode)`
```js
if (mode === 'slope') {
  ds.segment = {
    borderColor: ctx => chartSlopeColors[ctx.p0DataIndex] || '#aaa',
    backgroundColor: ctx => (chartSlopeColors[ctx.p0DataIndex] || '#aaa') + '28'
  };
  ds.borderColor = '#aaa';
  ds.backgroundColor = 'transparent';
} else {
  ds.segment = undefined;
  ds.borderColor = '#e8002d';
  ds.backgroundColor = 'rgba(232,0,45,0.12)';
}
altChart.update('none');
```
Même logique appliquée à `altChartMInst` dans `setTraceModeM`.

---

## 5. Tooltip HTML custom style UTMB

**Fichiers modifiés** : `index.html`

Remplacement du tooltip natif Chart.js par un tooltip HTML external.

### Structure visuelle
```
┌─────────────────────────────┐
│ ● 52.30 km          +9.5 % │  ← dot coloré + km + pente colorée
├─────────────────────────────┤
│  △ Altitude   〰 Pente  ↑ D+│
│   400 m      +9.5 %  +85 m │  ← 3 stats avec icônes SVG
└─────────────────────────────┘
```

### Config Chart.js
```js
tooltip: {
  enabled: false,
  external(context) {
    // Crée/maj un <div id="altchart-tooltip"> dans .chart-wrap
    // Calcule : km, altitude, pente (±10pts GPX), D+ cumulé (chartCumDplus)
    // Couleur du dot/pente selon catégorie
    // Positionnement : bascule à gauche si trop près du bord droit
  }
}
```

### Disparition au mouseleave
Dans `stopCursor()` :
```js
const ttEl = document.getElementById('altchart-tooltip');
if (ttEl) ttEl.style.opacity = '0';
```

---

## 6. Vue 3D — MapLibre GL JS

**Fichiers modifiés** : `index.html`, `style.css`

### Dépendances ajoutées dans `<head>`
```html
<link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/maplibre-gl@4/dist/maplibre-gl.css"/>
<script src="https://cdn.jsdelivr.net/npm/maplibre-gl@4/dist/maplibre-gl.js"></script>
```

### HTML
- Ajout de `<div id="map3d"></div>` à côté de `<div id="map"></div>` dans `.map-card`
- Bouton toggle dans le header : `<button id="btn-3d" onclick="toggle3D()" class="btn-3d-toggle">3D</button>`

### Fonctionnement
- Bouton affiche **"3D"** en mode 2D, **"2D"** en mode 3D (comme UTMB)
- Masque la carte Leaflet, affiche `#map3d` avec MapLibre
- Initialisation **lazy** (une seule fois au premier clic)

### Sources de tuiles (toutes gratuites, sans API key)
| Style | URL |
|---|---|
| Terrain | `https://tiles.openfreemap.org/styles/liberty` |
| Streets | `https://tiles.openfreemap.org/styles/bright` |
| Light | `https://basemaps.cartocdn.com/gl/positron-gl-style/style.json` |
| Dark | `https://basemaps.cartocdn.com/gl/dark-matter-gl-style/style.json` |
| DEM terrain | `https://s3.amazonaws.com/elevation-tiles-prod/terrarium/{z}/{x}/{y}.png` (AWS, format terrarium) |

### Paramètres carte
- `pitch: 35°` (légère perspective, style UTMB)
- `bearing: -15°`
- Terrain DEM avec `exaggeration` variable selon le style (1.6 pour Terrain, 1.0 Streets, 0.8 Light/Dark)

### Tracé GPX
Conversion `allPoints [lat,lng]` → GeoJSON `[lng,lat,elevation]` :
```js
map3dCoords = allPoints.map((p, i) => [p[1], p[0], allElevFull[i] || 0]);
```
Rendu : ombre portée noire (opacity 0.15, blur 3) + ligne rouge `#e8002d` width 3.5.

### Panneau de styles (overlay, style UTMB)
- Positionné en `position:absolute; top:10px; right:44px` dans `#map3d`
- Grille 2×2 avec thumbnails colorés (CSS gradients) + label
- Changement de style via `setMap3DStyle(key)` → `map3dInst.setStyle(url)` + re-injection terrain/tracé sur `style.load`

### CSS ajouté
Classes : `.m3d-style-panel`, `.m3d-styles-grid`, `.m3d-style-thumb`, `.m3d-thumb-{liberty|bright|positron|dark}`, `.m3d-marker-start`, `.m3d-marker-end`, `.btn-3d-toggle`, `.btn-3d-toggle.active`

---

## 7. Style Topo avec courbes de niveau

**Fichiers modifiés** : `index.html`, `style.css`

- Ajout d'un 5e style `topo` dans `MAP3D_STYLES` utilisant **OpenTopoMap** (libre, CC-BY-SA)
- Style inline `TOPO_STYLE` (objet MapLibre v8) avec source raster `https://tile.opentopomap.org/{z}/{x}/{y}.png`
- Affiché comme item pleine largeur sous la grille 2×2 dans le panneau de styles 3D
- CSS ajouté : `.m3d-thumb-topo`, `.m3d-topo-btn`
- Exagération du relief : `1.4` (moins agressive que Terrain pour ne pas écraser les courbes)
- Nota : les courbes proviennent du fond de carte OpenTopoMap (raster SRTM). Pour des courbes vectorielles identiques à UTMB, il faudrait une clé API Maptiler (gratuit) ou Mapbox (payant).

---

## 8. Couche Hillshade

**Fichiers modifiés** : `index.html`

- Ajout d'une couche `terrain-hillshade` de type `hillshade` dans `_add3DTerrainAndTrace()`
- Source : la source `dem` (tuiles terrarium AWS Mapzen) déjà chargée pour le terrain 3D
- Rendu entre le fond de carte et le tracé GPX (ajoutée avant `trace-shadow`)
- Paramètres :
  - `hillshade-illumination-direction: 315` (lumière depuis le nord-ouest)
  - `hillshade-exaggeration: 0.4` (subtil mais efficace)
  - `hillshade-shadow-color: #1a2744` (navy UTMB)
  - `hillshade-highlight-color: #ffffff`
- Disponible sur tous les styles (Terrain, Streets, Light, Dark, Topo)
- Même source DEM que le terrain 3D → aucune requête réseau supplémentaire

---

## Variables/fonctions clés ajoutées

| Nom | Type | Rôle |
|---|---|---|
| `chartCumDplus` | `number[]` | D+ cumulé pour chaque point du graphique |
| `chartSlopeColors` | `string[]` | Couleur de pente par point du graphique |
| `switchProfileTab(mode, el)` | fonction | Active le bon onglet Côtes/Pente |
| `toggle3D()` | fonction | Bascule entre Leaflet 2D et MapLibre 3D |
| `init3DMap()` | fonction | Init lazy de la carte MapLibre |
| `_add3DTerrainAndTrace(exag)` | fonction | Ajoute DEM + tracé GPX (appelé après chaque changement de style) |
| `setMap3DStyle(key)` | fonction | Change le fond de carte MapLibre à chaud |
| `MAP3D_STYLES` | `object` | Config des 5 styles (url, label, exaggeration) |
| `TOPO_STYLE` | `object` | Style MapLibre inline pour OpenTopoMap (courbes de niveau) |
| `map3dCoords` | `[lng,lat,ele][]` | Coordonnées GeoJSON du tracé GPX |
| `map3dCurrentStyle` | `string` | Style MapLibre actif |
| `map3dArrows` | `FeatureCollection` | Points GeoJSON avec `bearing` et `tier` pour les flèches directionnelles 3D |
| `contourThinCache` | `object\|null` | Cache mémoire du GeoJSON contours_thin (évite re-téléchargement) |
| `contourThickCache` | `object\|null` | Cache mémoire du GeoJSON contours_thick |
| `SAT_STYLE` | `object` | Style MapLibre inline pour Esri World Imagery (satellite) |
| `toggleClimbsPanel()` | fonction | Masque/affiche la colonne tableau des côtes avec animation |
| `toggleM3DPanel(el)` | fonction | Replie/déplie le panneau "Fond de carte" 3D |

---

## Analyse : reproduire le style terrain UTMB

### Ce qu'UTMB utilise
- **Mapbox GL JS** → remplacé par MapLibre GL JS (identique, open source)
- **Mapbox Terrain-v2** → tuiles vectorielles propriétaires avec courbes de niveau + étiquettes d'altitude (nécessite clé Mapbox payante)
- **Mapbox Outdoors/Terrain style** → fond de carte avec teintes hypsométriques
- **Mapzen terrain tiles** (AWS terrarium) → déjà intégré dans ce projet (`s3.amazonaws.com/elevation-tiles-prod/terrarium/`)

### Attribution img_3 : `© OpenStreetMap · Natural Earth · Mapzen`
Nos sources correspondent exactement :
- OpenStreetMap → via OpenFreeMap / CartoDB
- Natural Earth → inclus dans le style liberty (`ne2_shaded`)
- Mapzen → tuiles DEM terrarium AWS déjà utilisées

### Comparatif des alternatives libres pour les courbes de niveau

| Source | Courbes | Vecteur | Sans clé API |
|---|---|---|---|
| OpenTopoMap | ✓ | ✗ raster | ✓ |
| OpenFreeMap | ✗ | ✓ | ✓ |
| Protomaps | ✗ | ✓ | ✓ |
| Stamen Terrain | ✓ | ✗ | ✗ (clé Stadia) |
| Maptiler Outdoor-v2 | ✓ | ✓ | ✗ (clé gratuite) |
| SRTM/Copernicus + GDAL | ✓ | ✓ GeoJSON statique | ✓ |

### Voie recommandée : GeoJSON statique depuis DEM libre

La seule option **100 % open source + sans clé + courbes vectorielles** est de pré-générer les courbes depuis les données DEM publiques (SRTM NASA ou Copernicus ESA, résolution 30 m) :

```bash
# Télécharger le DEM Copernicus pour la zone GPX
# Puis générer les courbes avec GDAL
gdal_contour -a ele -i 100 dem.tif contours.geojson
```

- Fichier estimé pour la zone La Grande Ourthe (~60×60 km) : **2–5 MB** à 100 m d'intervalle
- Intégration : source GeoJSON statique dans MapLibre, deux couches (courbes secondaires 100 m / courbes maîtresses 500 m)
- Avantage : aucune dépendance externe, fonctionne sur tous les styles 3D
- **Implémenté** — voir `gen_contours.py` et les fichiers `contours_thin.geojson` / `contours_thick.geojson`

---

## 9. Flèches directionnelles — carte 2D (Leaflet)

**Fichiers modifiés** : `index.html`

- Flèches SVG rotatives tous les 2 km sur la carte Leaflet (desktop et mobile)
- Bearing calculé via atan2/haversine entre deux points GPX consécutifs
- Icône `L.divIcon` avec SVG `<path d="M5,0 L10,10 L5,6.5 L0,10 Z">` (forme de flèche pleine)
- Couleur bleue `#2980b9`, contour blanc, taille 14 px (desktop) / 12 px (mobile)
- Non interactif (`interactive: false`)

---

## 10. Flèches directionnelles — carte 3D (MapLibre) avec densité adaptative au zoom

**Fichiers modifiés** : `index.html`

- Flèches `▲` tous les 1 km sur la carte MapLibre 3D
- Bearing calculé identiquement (atan2/haversine) et stocké en propriété GeoJSON
- `text-rotation-alignment: 'map'` + `text-pitch-alignment: 'map'` → flèches ancrées au terrain, pas à l'écran
- Couleur rouge `#e8002d` (cohérente avec le tracé), halo blanc 2.5 px

### Densité adaptative au zoom

Chaque flèche porte une propriété `tier` :

| Tier | Espacement | Condition |
|---|---|---|
| 1 | 10 km | km % 10 == 0 |
| 2 | 5 km | km % 5 == 0 |
| 3 | 2 km | km % 2 == 0 |
| 4 | 1 km | tous les km |

Filtre MapLibre avec expression `step` sur le zoom :

```js
filter: ['<=', ['get', 'tier'], ['step', ['zoom'], 1, 10, 2, 11.5, 3, 13, 4]]
```

| Zoom | Flèches affichées |
|---|---|
| < 10 | 1 flèche / 10 km |
| 10 – 11.5 | 1 flèche / 5 km |
| 11.5 – 13 | 1 flèche / 2 km |
| ≥ 13 | 1 flèche / 1 km |

Aucun recalcul JS au zoom — le filtrage est entièrement géré par le moteur MapLibre GL.

---

## 11. Courbes de niveau — contrôle par zoom minimum

**Fichiers modifiés** : `index.html`

Ajout de `minzoom` sur les couches de courbes de niveau pour éviter l'encombrement visuel à faible zoom :

| Couche | `minzoom` | Opacité |
|---|---|---|
| `contours-thin-layer` (10 m) | 13 | fade-in entre 13 et 14.5 |
| `contours-thick-layer` (50 m) | 11 | fade-in entre 11 et 13 |
| `contours-labels` | 14 | fade-in entre 14 et 15 |

---

## 12. Style Satellite 3D (Esri World Imagery)

**Fichiers modifiés** : `index.html`, `style.css`

- 6e style ajouté dans `MAP3D_STYLES` : `satellite` via `SAT_STYLE` (objet MapLibre inline)
- Source : Esri World Imagery (`server.arcgisonline.com`) — même tuiles que la carte Leaflet 2D, sans API key, maxzoom 19
- `glyphs` ajoutés aux styles inline (SAT_STYLE, TOPO_STYLE) → polices Noto Sans disponibles pour les flèches et labels
- Exagération terrain : 1.5 (intermédiaire entre Terrain et Streets)
- Halo du tracé GPX renforcé en mode satellite : width 9 px / opacity 0.4 / blur 5 (vs 5/0.15/3)
- Thumbnail dans le panneau : vraie tuile Esri via `background-image`
- Grille du panneau de styles passe de 2×2 à 3 colonnes pour accueillir 5 styles + Topo

---

## 13. Amélioration qualité terrain 3D

**Fichiers modifiés** : `index.html`

- `tileSize: 512` sur la source DEM → 4× plus de points d'élévation, maillage terrain nettement plus lisse
- `optimizeForTerrain: true` sur la carte MapLibre → priorité rendu terrain
- `maxPitch: 80°` → inclinaison quasi-FPS possible dans les vallées
- Pitch initial 35° → 45° à l'ouverture
- Couche `sky` type `atmosphere` (API MapLibre 4 correcte, wrappée en try/catch)
- `setFog` avec brume atmosphérique subtile pour profondeur de champ
- `hillshade-illumination-anchor: 'map'` → éclairage cohérent lors de la rotation
- Hillshade-exaggeration 0.4 → 0.5
- Épaisseur tracé GPX adaptive : `['interpolate', zoom, 8→2px, 12→3.5px, 16→5px]`

---

## 14. Cours d'eau renforcés — style Terrain 3D

**Fichiers modifiés** : `index.html`

- Couches ajoutées uniquement sur le style `liberty` (Terrain), source `openmaptiles`
- `water-enhanced` (fill) : surfaces d'eau en `#4a9fc7`, opacité 0.75
- `waterway-river` (line) : rivières en `#4a9fc7`, épaisseur 1.5→3.5→6 px selon zoom
- `waterway-stream` (line) : ruisseaux/canaux en `#5aafe0`, épaisseur 0.6→2 px selon zoom

---

## 15. Labels km sur flèches 3D + cache contours

**Fichiers modifiés** : `index.html`

- Couche `trace-arrows-km` : labels "10 km", "20 km"... sur les flèches tier 1 & 2 uniquement
- Contours GeoJSON pré-chargés en mémoire au premier `init3DMap()` via `Promise.all` → plus de re-téléchargement de 6 MB lors des changements de style

---

## 16. Panneau "Fond de carte" 3D — toggle collapse

**Fichiers modifiés** : `index.html`, `style.css`

- Header du panneau cliquable avec chevron animé
- Clic → `max-height` collapse animé en 0.25s
- Seul le titre reste visible à l'état réduit

---

## 17. Tableau des côtes — masquer / afficher

**Fichiers modifiés** : `index.html`, `style.css`

- Header "📋 Tableau des côtes" rendu cliquable avec chevron
- Clic → colonne gauche passe à `width: 0` en 0.3s, colonne droite (carte + profil) prend toute la largeur
- Bouton 📋 flottant (`position: fixed`) apparaît sur le bord gauche de l'écran pour ré-ouvrir le tableau
- `map.invalidateSize()` et `map3dInst.resize()` appelés après la transition pour éviter les artefacts Leaflet/MapLibre
- Contrôles MapLibre agrandis (40×40 px) sur mobile via `@media (max-width: 768px)`

---

## 18. Flèches 3D — disparition dézoomé + densité affinée

**Fichiers modifiés** : `index.html`

- Zoom < 8 : aucune flèche affichée (tier seuil → 0)
- Labels km visibles uniquement si zoom ≥ 8 (filtre `['>=', ['zoom'], 8]`)
- Tableau récapitulatif mis à jour :

| Zoom | Flèches |
|---|---|
| < 8 | aucune |
| 8 – 10 | 1 / 10 km |
| 10 – 11.5 | 1 / 5 km |
| 11.5 – 13 | 1 / 2 km |
| ≥ 13 | 1 / 1 km |
