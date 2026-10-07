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

---

## 19. Identité visuelle GTLC (DESIGN.md)

**Fichiers** : `DESIGN.md` (créé), `style.css`

- `DESIGN.md` : tokens et règles d'après grandtrail.be (édition Winter) — bleu glacier `#DCECF0`, Montserrat, angles droits
- `style.css` réécrit sur ces tokens (`--gt-*`) : en-tête bleu nuit, boutons carrés en capitales, panneaux à filet bleu glacier
- Ravitaillements : cerf du GTLC (logo vectorisé) noir sur cercle blanc, à la place de la banane

---

## 20. Carte 3D façon LiveTrail

**Fichiers** : `index.html`, `styles/topo-trail.json` (créé)

- Relief Terrarium en `tileSize: 256` (512 chargeait un niveau de zoom trop bas)
- Ombrage doux et chaud (0.35, ombres brunes, lumière 200°)
- Tracé en 3 couches : halo, contour, trait — option dégradé par pente
- MapLibre 5 (ciel via `setSky`), fond « Topo trail » (port du style LiveTrail sur OpenFreeMap) par défaut
- Satellite : orthophotos SPW (Wallonie) par-dessus Esri

---

## 21. Une seule carte MapLibre, code découpé, données séparées

**Fichiers** : `index.html` (réécrit : balisage seul), `js/` (créé), `data/` (créé), `style.css`, `gen_contours.py`

### Une seule carte (Leaflet supprimé)
- MapLibre sert la 2D et la 3D : le bouton 3D active le relief et incline la caméra
- Tous les fonds disponibles dans les deux vues (Topo trail par défaut) ; Light / Dark passent sur OpenFreeMap
  (Carto n'avait pas la police Noto Sans : les libellés km et ravitaillements ne s'y affichaient pas)
- Curseur du profil et côte sélectionnée visibles en 3D ; en 3D, la caméra vole vers la côte, face à la pente
- Pastilles de côtes : numéro, D+ et pente en texte au survol (lisible sans distinguer les couleurs)

### Code découpé en modules (`js/`)
| Fichier | Rôle |
|---|---|
| `app.js` | point d'entrée : en-tête, sélection, lien partagé, GPX, onglets mobiles, mode embed |
| `race.js` | chargement des données, pentes, couleurs des catégories |
| `map.js` | carte 2D/3D, couches, panneau des fonds, curseur, surbrillance |
| `map-styles.js` | définition des fonds de carte |
| `chart.js` | profil altimétrique, info-bulle, barre des ravitaillements |
| `table.js` | tableau, filtres, tri, mini-profil |
| `bus.js` | événements entre modules (`climb:select`, `trace:mode`, `cursor:move`…) |

### Données séparées (`data/`)
- `data/lgo100km.json` : course, statistiques, identité visuelle (couleurs, icône), ravitaillements, tracé, profil, côtes
- Autre course : `index.html?course=<fichier>` charge `data/<fichier>.json`
- Courbes de niveau : `data/contours/` — 6,1 Mo → 2,5 Mo (coordonnées à 5 décimales, courbes maîtresses plus
  dupliquées) ; les courbes fines ne se chargent qu'à partir du zoom 12,5

### Mobile
- Plus de code mobile séparé : même page, même carte, même tableau ; le CSS masque les colonnes secondaires
  et un onglet affiche soit la carte + profil, soit le tableau
- La 3D est disponible sur mobile

### Outils
- `npm run serve` : serveur local (http://localhost:8080) — les modules et les données exigent HTTP
- `npm run test:smoke` : test de fumée dans Chrome headless (tableau, carte, modes, sélection, 3D,
  changements de fond, lien partagé, mobile)
- MapLibre figé en `5.24.0`

---

## 22. Profil : repères permanents, zoom sur la côte ; pastille Départ/Arrivée

**Fichiers** : `js/chart.js`, `js/race.js`, `js/map.js`, `index.html`, `style.css`, `data/lgo100km.json`

- Profil dessiné sur le tracé complet (2 263 points) au lieu de 454 points sous-échantillonnés :
  précis en zoom, D+ cumulé plus juste ; le profil sous-échantillonné est retiré des données
- Repères toujours visibles : départ (vert), point culminant (orange, avec son altitude), arrivée (rouge),
  ravitaillements (cerf) ; légende à droite des onglets (masquée sur mobile)
- Sélection d'une côte : le profil zoome sur la côte (± 40 % de sa longueur, au moins ± 500 m), axe des
  altitudes recalé ; bouton « ↔ Profil complet » / « ⤢ Zoom sur la côte » ; pas de zoom en mode Ravitaillements
- Parcours en boucle (départ et arrivée à moins de 150 m) : une seule pastille Départ / Arrivée sur la carte

---

## 23. Icônes Lucide à la place des emojis

**Fichiers** : `js/icons.js` (créé), `index.html`, `js/app.js`, `js/chart.js`, `js/map.js`, `js/table.js`, `style.css`

- 14 icônes [Lucide](https://lucide.dev) (licence ISC) embarquées en SVG dans `js/icons.js` : pas de police ni de script externe
- Dans le HTML : `<i data-icon="route"></i>`, remplacé au démarrage par `hydrateIcons()` ; dans le JS : `icon('download', 13)`
- Remplacés : titre (montagne), Tableau des côtes, Tracé du parcours, onglets mobiles, GPX, Partager / Copié,
  Profil complet / Zoom, Tout, chevrons, bouton de réouverture du tableau, départ / arrivée sur la carte

---

## 24. Workflow « ajouter une course » : GPX → données → application

**Fichiers** : `scripts/build_course.py`, `scripts/gen_contours.py` (déplacé, paramétré), `courses/lgo100km/`,
`branding/gtlc.json`, `data/courses.json`, `.claude/skills/ajouter-course/SKILL.md`, `tests/test_build_course.py`,
`js/race.js`, `js/map.js`, `js/app.js`, `index.html`, `style.css`, `tests/smoke.mjs`, `package.json`

- `scripts/build_course.py <id>` : lit `courses/<id>/course.json` + GPX, détecte les côtes (algorithme repris de
  `analyze_climbs.py`, résultats identiques : 44 côtes), calcule les statistiques, place les ravitaillements
  (km et/ou coordonnées, avec avertissements), écrit `data/<id>.json` et `data/courses.json`.
  `--check` compare sans écrire.
- Altitudes : chiffres affichés sur l'altitude **brute** du GPX (D+ 3 408 m, comme Openrunner), détection et
  profil sur l'altitude **lissée** ; le D+ cumulé de l'info-bulle finit désormais à 3 408 m (il finissait à 2 669 m)
- `scripts/gen_contours.py <id>` : zone calculée depuis le GPX (+ 2 km), tuiles Copernicus déduites et fusionnées ;
  courbes par course dans `data/contours/<id>/` (1,6 Mo pour La Grande Ourthe)
- Identité visuelle partagée entre courses : `branding/gtlc.json`
- Sélecteur de course dans l'en-tête (affiché à partir de deux courses), `?course=<id>`
- Skill `ajouter-course` : recueil des infos, construction, correction des avertissements, courbes, vérification
- `npm run build:course <id>`, `npm run test:build` (10 tests unitaires), `npm run test:smoke -- --course <id>`

---

## 25. GPX sans altitudes : récupération sur demande

**Fichiers** : `scripts/build_course.py`, `scripts/gen_contours.py`, `tests/test_build_course.py`,
`.claude/skills/ajouter-course/SKILL.md`, `README.md`, `js/app.js`

- Un GPX sans altitudes (ex. export Geolives) arrête la construction avec les solutions possibles
- Récupération **uniquement si l'utilisateur l'active** : `--fill-elevation` ou `"fillElevation": true` dans
  `course.json` ; le skill demande l'accord avant de l'ajouter
- Tracé densifié (1 point / 20 m), altitudes lues dans Copernicus GLO-30, cache `courses/<id>/elevation-cache.json`
- Statistiques sur l'altitude lissée dans ce cas (sur Stoumont 30 km : D+ brut du modèle 2 182 m, lissé 1 308 m)
- Sous-titre de la course : « Altitudes : modèle Copernicus » quand elles ont été récupérées
- 4 tests unitaires de plus (14 au total), sans accès réseau

---

## 26. Course ajoutée : Extratrail Stoumont 30 km (noir)

**Fichiers** : `courses/extratrail-stoumont-30/` (GPX, `course.json`, `elevation-cache.json`),
`branding/extratrail.json`, `data/extratrail-stoumont-30.json`, `data/contours/extratrail-stoumont-30/`,
`data/courses.json`

- GPX Geolives sans altitudes : récupérées depuis Copernicus GLO-30 avec l'accord de l'utilisateur
  (`"fillElevation": true`), tracé densifié à 1 712 points
- 30,1 km, +1 308 m (altitude lissée), 180 → 574 m, boucle au départ de Stoumont
- 13 côtes ≥ 300 m : 3 rouges, 6 orange, 2 vertes, 2 < 4 %
- Aucun ravitaillement pour l'instant (à compléter dans `course.json`)
- Identité `branding/extratrail.json` provisoire : couleurs actuelles, goutte d'eau comme icône des ravitaillements

---

## 27. Course ajoutée : OSO 2023

**Fichiers** : `courses/oso-2023/` (GPX RouteYou, `course.json`), `branding/oso.json`, `data/oso-2023.json`,
`data/contours/oso-2023/`, `data/courses.json`

- GPX RouteYou avec altitudes : 70,8 km, 100 → 371 m, boucle Pepinster – Theux – Spa – Chaudfontaine
- D+ **2 129 m** : statistiques sur l'altitude lissée (`"statsElevation": "smoothed"`, nouvelle option) — le brut
  (2 797 m) était gonflé par les altitudes arrondies de RouteYou ; l'organisation annonce 2 100–2 300 m
- 29 côtes ≥ 300 m : 3 rouges, 5 orange, 12 vertes, 9 < 4 %
- Ravitaillements (site de l'organisation, km arrondis, placés d'après les indications) : Banneux km 16,
  Spa km 35,5 (parc de Sept Heures, au pied de la côte 16), Oneux km 49,4 (dans le village), Drolenval km 64
- Identité `branding/oso.json` provisoire (couleurs actuelles, goutte d'eau)

---

## 28. Ravitaillements : icône par défaut et contenu

**Fichiers** : `scripts/build_course.py`, `branding/defaut.json` (créé), `branding/extratrail.json`, `branding/oso.json`,
`js/race.js`, `js/map.js`, `js/chart.js`, `js/icons.js`, `style.css`, `tests/test_build_course.py`, skill, README

- Icône par défaut des ravitaillements : **couteau / fourchette** (Lucide), quand l'identité n'en fournit pas
  (la goutte d'eau provisoire d'Extratrail et d'OSO est retirée) ; le GTLC garde son cerf
- Identité `defaut` quand `course.json` n'en précise pas ; icônes pleines (logos) ou au trait (`"style": "stroke"`)
- Chaque ravitaillement peut décrire son **contenu** (`supplies` : liquide, solide, chaud avec icône, ou texte libre),
  ses **marques** (`brands` : Naak, 6D…) et une **note** — affichés dans la popup de la carte et la barre du profil
- Km au format français (35,5) ; noms échappés dans le HTML ; 2 tests unitaires de plus (17)

---

## 29. Contenu des ravitaillements structuré

**Fichiers** : `scripts/build_course.py`, `js/race.js`, `js/chart.js`, `style.css`, `tests/test_build_course.py`,
README, skill

- `supplies` devient un tableau d'éléments `{ "category", "label", "brand" }` dans `course.json`
  (`category` : liquide, solide, chaud, autre) ; le champ `brands` disparaît (marque par produit)
- Validation au build : catégorie inconnue → « autre », éléments vides ou mal formés ignorés, avertissements
- Popup de la carte : contenu regroupé par catégorie (« Liquide : Eau plate, Boisson isotonique (Naak) ») ;
  barre du profil : une icône par catégorie, détail au survol ; 18 tests unitaires

---

## 30. Règle : jamais de tiret cadratin dans l'application

**Fichiers** : `CLAUDE.md` (créé), `index.html`, `js/app.js`, `js/map.js`, `js/chart.js`, `js/map-styles.js`,
`js/race.js`, `js/table.js`, `js/icons.js`, `style.css`, `branding/*.json`, `scripts/build_course.py`, `tests/smoke.mjs`

- Le caractère « — » est retiré de l'interface (sous-titre, titre de l'onglet, popups, crédits, info-bulles),
  des identités et des commentaires du code livré ; remplacé par « · », une virgule ou des parenthèses
- Libellé des côtes : « Côte #3 (4,29 → 7,15 km) » au lieu de « (4.29 – 7.15 km) »
- Règle inscrite dans `CLAUDE.md` ; le test de fumée échoue si le caractère s'affiche, `build_course.py`
  le signale dans `course.json`

---

## 31. Nouveau fond de carte par défaut : « Sentiers »

**Fichiers** : `js/style-sentiers.js` (créé), `js/map-styles.js`, `js/map.js`, `style.css`, `index.html`,
`tests/smoke.mjs`, `README.md`

- Style propre, conçu pour le trail, sur les tuiles OpenFreeMap : palette définie dans le fichier (fond ivoire,
  forêts vert tendre, eau, routes), épaisseurs sur une échelle unique
- Utilise le revêtement et le type de voie des tuiles : sentiers en terre (tirets rouge-brun serrés), chemins
  forestiers (tirets bruns longs), petites routes non revêtues (bordure en tirets), voies piétonnes revêtues
  discrètes, escaliers
- Sommets : icône montagne (Lucide) + nom + altitude ; bâtiments, noms de rues et de rivières
- Nouveaux réglages de l'ombrage du relief (lumière nord-ouest, ombres olive) et des courbes de niveau
- Topo trail et Terrain **dépréciés** (repris de LiveTrail) : rangés dans « Anciens » du panneau, à supprimer

---

## 32. Sommets visibles seulement en zoom rapproché, réglable

**Fichiers** : `js/config.js` (créé), `js/map.js`, `tests/smoke.mjs`, `docs/CARTOGRAPHIE.md`, `README.md`

- Nouveau fichier de réglages `js/config.js` ; `peaksMinZoom: 15` (au lieu de 11 dans Sentiers, 9 dans Topo trail)
- Appliqué à toutes les couches de sommets (`mountain_peak`) à chaque chargement de fond
- Vérifié : col de la Vecquée absent au zoom 14,9, affiché au zoom 15,1 ; test de fumée : 26 vérifications

---

## 33. Réglages de la carte regroupés dans `js/config.js`

**Fichiers** : `js/config.js`, `js/map.js`, `js/map-styles.js`, `tests/smoke.mjs`, `docs/CARTOGRAPHIE.md`, `README.md`

- Ajoutés à `MAP_CONFIG` : `defaultStyle`, `stylePanelCollapsed`, `contoursMinZoom`, `thinContoursLoadZoom`,
  `kmMarkersEvery5Zoom`, `arrowsZooms`, `hillshadeIntensity`, `hillshadeLightDirection`, `pitch3D`, `bearing3D`,
  `climbFlightPitch`, `climbMaxZoom`, `animationDuration` (en plus de `peaksMinZoom`) ; `DEFAULT_STYLE` retiré
  de `js/map-styles.js`
- Les zooms internes des fonds restent dans les styles ; l'exagération 3D reste par fond (`MAP_STYLES`)
- Test de fumée : vérifie l'application des réglages ; vérifié aussi avec une configuration modifiée
  (fond, panneau, bornes, flèches, ombrage, inclinaison)

---

## 34. Skill traduit en anglais : `/add-course`

**Fichiers** : `.claude/skills/add-course/SKILL.md` (remplace `.claude/skills/ajouter-course/`), `README.md`

- Skill et commande renommés `add-course`, texte en anglais
- Consignes ajoutées : répondre dans la langue de l'utilisateur, écrire `course.json` en français, jamais de tiret
  cadratin ; les valeurs du format de données (`liquide`, `solide`, `chaud`, `autre`, `defaut`) restent en français

---

## 35. Course ajoutée : Grand Trail des Lacs & Châteaux 65 km (2024)

**Fichiers** : `courses/gtlc-65-2024/` (GPX Trace de Trail, `course.json`), `data/gtlc-65-2024.json`,
`data/contours/gtlc-65-2024/`, `data/courses.json`

- 64,5 km en boucle autour de Malmedy (lac de Robertville), 334 → 602 m, identité GTLC (cerf)
- D+ **2 574 m** sur l'altitude lissée (`"statsElevation": "smoothed"`) : le D+ brut du GPX (3 435 m) dépasse
  nettement le chiffre officiel (≈ 2 500 à 2 700 m)
- 36 côtes ≥ 300 m : 12 rouges, 5 orange, 10 vertes, 9 < 4 %
- Courbes de niveau : zone à cheval sur deux tuiles Copernicus (6° E), fusionnées sans couture visible
- Ravitaillements : à compléter

---

## 36. Course ajoutée : HRP 11, Etsaut, refuge d'Ayous ; réglages satellite

**Fichiers** : `courses/hrp-11-etsaut-ayous/`, `data/hrp-11-etsaut-ayous.json`, `data/contours/hrp-11-etsaut-ayous/`,
`data/courses.json`, `js/config.js`, `js/map.js`, `tests/smoke.mjs`, `docs/CARTOGRAPHIE.md`

- GPX Strava (caractère parasite en tête de fichier retiré) : 14,2 km, +1 638 m, 592 → 2 175 m, étape en ligne
- 2 côtes ≥ 300 m, toutes deux rouges (5,7 km à 12 % et 6,5 km à 14 %) ; ravitaillement : refuge d'Ayous
  (repas, boissons chaudes) ; identité par défaut
- `satelliteHillshade` (défaut `false`) : l'ombrage du relief délavait les photos satellites en montagne
- `fog` / `satelliteFog` (défaut `true` / `false`) : brume vers l'horizon en 3D
- Test de fumée : vérification du zoom du profil rendue indépendante de la course, ombrage selon le réglage
- Style Sentiers : chemins et sentiers affinés (≈ 1 px au zoom 14, comme Topo trail), voies piétonnes aussi

---

## 37. Option « qualité haute » par course

**Fichiers** : `scripts/build_course.py`, `js/map.js`, `.claude/skills/add-course/SKILL.md`, `tests/test_build_course.py`,
`docs/CARTOGRAPHIE.md`, `README.md`

- `"quality": "high"` dans `course.json` : relief **Mapterhorn** jusqu'au zoom 17 (au lieu de Terrarium AWS, zoom 14)
  et, sur le fond Satellite, orthophotos **IGN** en France (rochers, éboulis, sentiers visibles)
- Le skill `add-course` propose systématiquement l'option, avec ses contreparties (données plus lourdes, deux
  services tiers de plus), et la recommande en montagne ; valeur invalide → `standard` avec avertissement
- Comparaison sur l'HRP 11 : `capture/v22_qualite_comparaison.png`
- HRP 11 passée en qualité haute (`"quality": "high"`)

---

## 38. Profil : onglet Ravitaillements par défaut

- « Ravitaillements » devient le premier onglet du profil et celui affiché à l'ouverture (puis Côtes, Pente) ;
  la carte s'ouvre avec le tracé simple

---

## 39. Course ajoutée : HRP 10, Lescun, Etsaut

**Fichiers** : `courses/hrp-10-lescun-etsaut/`, `data/hrp-10-lescun-etsaut.json`, `data/contours/hrp-10-lescun-etsaut/`,
`data/courses.json`, `scripts/build_course.py`

- 14,8 km en ligne, +895 m / −1 148 m, 592 → 1 611 m ; qualité haute ; identité par défaut ; sans ravitaillement
- 4 côtes ≥ 300 m : 1 rouge (4 km à 15,2 %), 1 orange, 2 < 4 %
- `build_course.py` ignore les caractères parasites avant le XML d'un GPX (avertissement), au lieu d'échouer

---

## 40. Exagération du relief 3D par course ; backlog

**Fichiers** : `scripts/build_course.py`, `js/map.js`, `courses/*/course.json`, `tests/`, skill, README,
`docs/CARTOGRAPHIE.md`, `docs/BACKLOG.md` (créé)

- `"terrainExaggeration"` (1 à 5) dans `course.json` remplace l'exagération du fond de carte en 3D
- ×2,5 pour les quatre courses ardennaises (La Grande Ourthe, OSO, Stoumont, GTLC 65) ; les étapes HRP gardent ×1,5
- Le skill la propose selon le terrain ; valeur invalide ignorée avec avertissement ; tests unitaire et de fumée
- `docs/BACKLOG.md` : idées retenues (ombrage par course, ombrage des pentes, courbes à 5 m, teinte d'altitude…)

---

## 41. Identité des Coureurs Célestes pour La Grande Ourthe ; thème d'interface par identité

**Fichiers** : `courses/lgo100km/DESIGN.md` (créé), `branding/coureurs-celestes.json` (créé),
`courses/lgo100km/course.json`, `style.css`, `js/app.js`, `js/race.js`, `js/map.js`, `js/chart.js`, README, skill

- `DESIGN.md` propre à la course, d'après lescoureurscelestes.be (logo, polices, couleurs du site)
- Identité `coureurs-celestes` : tracé bleu profond `#1E5AA8`, icône des ravitaillements = empreinte de semelle
  vectorisée depuis le logo ; La Grande Ourthe n'affiche plus le cerf du GTLC
- Thème d'interface par identité (`theme` dans `branding/<nom>.json`) : accent, encre, en-tête, arrondis, polices
  appliqués via les variables CSS ; nouveaux jetons `--gt-radius`, `--gt-font-display`, `--gt-trace`,
  teintes dérivées de l'accent (`color-mix`)
- Icône des ravitaillements dimensionnée selon ses proportions (icônes horizontales lisibles) et colorable
- En-tête : logo de l'organisation à côté du titre (`"headerLogo": true` dans l'identité), activé pour La Grande Ourthe
- Logo dans l'en-tête aussi pour l'identité GTLC (cerf) : GTLC 65 Malmedy

---

## 42. DESIGN.md propres à l'OSO et à l'Extratrail

**Fichiers** : `courses/oso-2023/DESIGN.md`, `courses/extratrail-stoumont-30/DESIGN.md` (créés)

- OSO : identité du Cercle Sportif Olnois (vert pomme `#8DC63F`, Sora / Poppins, angles droits), proposition
  pour `branding/oso.json` (tracé violet `#7B2D8E`) ; pas de logo propre à la course, celui du club
- Extratrail : réseau de parcours permanents (pas de course ni de ravitaillement), code couleur des distances
  (noir = 30 km), logo SVG, mauve de Stoumont ; proposition pour `branding/extratrail.json` (tracé `#6C4796`)

---

## 43. Identités OSO et Extratrail appliquées

**Fichiers** : `branding/oso.json`, `branding/extratrail.json`, `courses/oso-2023/DESIGN.md`,
`courses/extratrail-stoumont-30/DESIGN.md`, README, `docs/BACKLOG.md`

- OSO : coureuse vectorisée depuis le logo du Cercle Sportif Olnois (en-tête et ravitaillements), tracé violet
  `#7B2D8E`, accent vert pomme `#8DC63F`, en-tête vert-noir, angles droits, Sora / Poppins
- Extratrail : emblème repris du SVG du site, tracé `#6C4796`, accent vert anis `#BBCE00`, en-tête `#323232`,
  arrondis 8 px, Saira
- Plus aucune identité provisoire ; backlog : logo propre à l'OSO, GPX Extratrail avec altitudes, accords

---

## 44. Départ / arrivée sobres ; transition 2D ↔ 3D progressive

**Fichiers** : `js/map.js`, `js/chart.js`, `style.css`, `index.html`, `tests/smoke.mjs`, `docs/CARTOGRAPHIE.md`

- Départ / arrivée : pastille blanche cerclée de l'encre de l'identité avec pictogramme fin (lecture, drapeau),
  au lieu du vert / rouge ; sur le profil, anneau (départ) et pastille pleine (arrivée) de la même encre
- Passage en 3D : le relief monte progressivement (exagération de 0 à la cible) en même temps que la caméra
  s'incline, et s'aplatit au retour en 2D ; plus de saut brutal du dénivelé

---

## 45. Passage 2D ↔ 3D en fondu enchaîné

**Fichiers** : `js/config.js`, `js/map.js`, `js/app.js`, `style.css`, `index.html`, `tests/smoke.mjs`, `docs/CARTOGRAPHIE.md`,
`docs/BACKLOG.md`

- Par défaut, image figée de la carte par-dessus, bascule instantanée dessous, puis fondu (450 ms) une fois la
  nouvelle vue dessinée : fluide sur une machine modeste, plus de saut de dénivelé visible
- `mode3DTransition: 'animate'` garde l'ancienne animation (caméra + relief progressif)
- Image figée copiée dans un canvas (pas d'encodage JPEG, quasi immédiat) ; si elle tarde plus de
  `fadeSnapshotWait` (400 ms), bascule directe sans fondu
- Changement de fond en 3D : relief retiré avant `setStyle` puis remis au `style.load` (corrige l'erreur MapLibre
  « shaderPreludeCode », relief dessiné avant que le nouveau style soit prêt)
- Test de fumée : les 404 des orthophotos IGN (hors de France) sont ignorés
- Retour visuel pendant la bascule : image figée (à sa taille exacte, sans effet de zoom) voilée et légèrement
  floutée par un calque `backdrop-filter` dès le clic, pastille
  « Passage en 3D… » / « Retour en 2D… » si l'attente dépasse 300 ms (`fadeLabelDelay`), bouton 2D/3D grisé
  avec indicateur tournant jusqu'à la fin du fondu
- Options d'allègement et d'animations réduites notées dans le backlog

---

## 46. Course : Ohm Trail 2018 (Ohm Trail Original, Aywaille)

**Fichiers** : `courses/ohm-trail-2018/` (`course.json`, `Ohm_Trail.gpx`, `DESIGN.md`), `branding/ohm-trail.json`,
`data/ohm-trail-2018.json`, `data/courses.json`, `data/contours/ohm-trail-2018/`, `style.css`, `index.html`

- Trace Strava du 3 juin 2018 : 34,7 km, +2 017 m (1 950 m annoncés par l'organisation), 18 322 points,
  16 côtes ≥ 300 m (rouge 7, orange 2, vert 6, < 4 % 1), relief 3D ×2,5, qualité standard, courbes de niveau
- 3 ravitaillements placés par coordonnées depuis la carte Google My Maps de l'organisation : Vivaro (km 9,3),
  Ninglinspo (km 19,9, aller-retour), Secheval (km 25,4)
- Identité Ohm Trail : oméga orange du logo vectorisé (ravitaillements et en-tête), accent `#E84E0F`, en-tête
  anthracite `#313131`, tracé anthracite `#32373C` (l'orange est réservé à la catégorie de pente 7 à 10 %),
  Montserrat et Open Sans
- `style.css` : boutons à contour (Tout, GPX, Partager, 3D) écrits à l'encre (`--gt-ink`) et non plus en
  `--gt-on-primary`, qui n'est lisible que sur l'accent (texte blanc invisible sur fond blanc avec l'identité Ohm)

---

## 47. Épaisseur du tracé réglable, plus fine en 3D

**Fichiers** : `js/config.js`, `js/map.js`, `scripts/build_course.py`, `courses/ohm-trail-2018/course.json`,
`data/ohm-trail-2018.json`, `.claude/skills/add-course/SKILL.md`, `docs/CARTOGRAPHIE.md`, `index.html`

- `traceWidth` (`js/config.js`, 1 par défaut) : facteur appliqué à toutes les couches du tracé (halo, contour,
  trait, côtes colorées, côte sélectionnée) en gardant leurs proportions ; une course peut le remplacer par
  `"traceWidth"` dans `course.json` (0,3 à 3, vérifié par `build_course.py`). Ohm Trail 2018 : ×0,6
- `traceWidth3D` (0,7) : tracé plus fin en 3D. Plaqué sur le relief, il s'élargissait sur les versants face à la
  caméra et les lacets de montagne se fondaient en une tache (≈ 30 à 50 m de large au zoom 13,5) ; ×0,5 était trop
  fin (rouge dominé par le contour, flèches plus grosses que le trait)
- `traceGlowOpacity3D` (0,35) : halo sombre allégé en 3D
- En 3D, épaisseurs plafonnées à leur valeur du zoom 12 et surbrillance de côte resserrée
  (`climbHighlightWidth3D`, 0,72) : en zoomant sur une côte (HRP 11, gorge de la côte 2), la perspective et le
  versant face à la caméra grossissaient la surbrillance (1,8 fois le tracé) en un ruban rouge très épais
- Bascule en fondu : l'épaisseur change sous l'image figée, invisible ; la 2D garde son épaisseur

---

## 48. HRP 11 : altitudes corrigées, tracé aminci sur les parois en 3D

**Fichiers** : `scripts/build_course.py`, `tests/test_build_course.py`, `courses/hrp-11-etsaut-ayous/course.json`,
`data/hrp-11-etsaut-ayous.json`, `js/map.js`, `js/config.js`, `tests/smoke.mjs`, `README.md`,
`docs/CARTOGRAPHIE.md`, `.claude/skills/add-course/SKILL.md`, `index.html`

- `"elevationFixes"` (`course.json`) : altitudes interpolées entre deux km, signalées dans le résumé de
  `build_course.py` et dans `race.elevationFixes`. HRP 11 : le GPX Strava avait des paliers (755 m puis 1 053 m)
  et un saut de +298 m en 80 m sur le Chemin de la Mâture ; km 3,02 à 4,07 interpolés de 753 à 1 066 m. D+ et
  côtes inchangés, profil sans faux mur. 2 tests unitaires
- HRP 11 : relief 3D ×1 (`terrainExaggeration`), falaises moins accentuées
- 3D : tracé aminci sur les versants raides. La pente du relief en travers du tracé est mesurée
  (`queryTerrainElevation` à 15 m de part et d'autre) et la largeur multipliée par son cosinus (au moins 0,35) :
  sur la paroi du Chemin de la Mâture (55 à 77°), le trait plaqué sur le relief ne s'étale plus en ruban.
  Réglages `steepSlopeCompensation`, `steepMinWidth`, `steepSampleDistance`
- Tracé, côtes colorées et côte sélectionnée découpés en tronçons (couleur, facteur de largeur `w`) : le mode
  Pente passe d'un `line-gradient` à une couleur par tronçon (même rendu) ; test de fumée adapté

---

## 49. Détection des altitudes suspectes du GPX

**Fichiers** : `scripts/build_course.py`, `tests/test_build_course.py`, `.claude/skills/add-course/SKILL.md`

- `build_course.py` signale (`⚠ Altitudes suspectes km X à Y`) les sauts physiquement impossibles : plus de
  100 % de pente sur au moins 30 m de dénivelé (fenêtre de 100 m), zone étendue aux paliers parfaitement plats
  qui l'entourent. L'avertissement donne la ligne `"elevationFixes"` à ajouter ; une zone corrigée n'est plus
  signalée
- Skill `add-course` : la correction est toujours le choix de la personne qui importe la course (zone, effet sur
  le profil, explication, accord zone par zone ; refus possible, l'avertissement reste alors expliqué)
- Courses existantes : rien sur La Grande Ourthe, OSO, GTLC 65, HRP 10. Corrigées avec accord, bornes ajustées
  en comparant au modèle Copernicus : HRP 11 km 13,22 à 13,56 (palier puis −73 m ; le col d'Ayous à 2 175 m est
  gardé, descente progressive comme sur le relief) ; Ohm Trail km 0,89 à 1,51 (erreur de l'enregistrement
  jusqu'à +45 m, détectée seulement au saut du km 1,11 ; D+ +2 017 → +1 986 m). Extratrail Stoumont : km 13,59 à
  13,65 signalé (34 m en 20 m sur les altitudes Copernicus récupérées) : laissé tel quel (invisible, D+ calculé
  sur l'altitude lissée), l'avertissement restant est expliqué
- `apply_elevation_fixes` : tolérance de 0,5 m sur les bornes (un km arrondi désignait le point précédent)
- 2 tests unitaires

---

## 50. Course : Extratrail Malmedy 19 km (bleu)

**Fichiers** : `courses/extratrail-malmedy-19/` (`course.json`, `extratrail_malmedy_bleu.gpx`),
`data/extratrail-malmedy-19.json`, `data/courses.json`, `data/contours/extratrail-malmedy-19/`

- Trace SityTrail : boucle de 18,8 km au départ de Malmedy, 686 points, aucune altitude suspecte
- D+ sur l'altitude lissée (`statsElevation: "smoothed"`) : +518 m, l'organisation annonce 470 m pour 18 km ;
  l'altitude brute (+740 m) est bruitée
- 6 côtes ≥ 300 m (rouge 1, orange 1, vert 2, < 4 % 2), dont 0,51 à 1,82 km : +165 m à 12,6 %
- Identité Extratrail (comme Stoumont), relief 3D ×2,5, qualité standard, courbes de niveau, sans ravitaillement

---

## 51. Barrières horaires, ravitaillements du GT65, version commerciale, démo GTLC

**Fichiers** : `scripts/build_course.py`, `scripts/fetch_fonts.py`, `fonts/`, `tests/test_build_course.py`,
`tests/smoke.mjs`, `courses/gtlc-65-2024/course.json`, `data/gtlc-65-2024.json`, `js/race.js`, `js/map.js`,
`js/map-styles.js`, `js/chart.js`, `js/app.js`, `js/icons.js`, `js/config.js`, `style.css`, `index.html`,
`README.md`, `docs/CARTOGRAPHIE.md`, `docs/LICENCES.md`, `docs/BACKLOG.md`,
`.claude/skills/add-course/SKILL.md`

- **Barrières horaires** : `start`, `finishCutoff` et `aidStations[].cutoff` dans `course.json` ; le script
  calcule l'heure (lendemain si avant le départ), le temps de course et la vitesse moyenne minimale, et signale
  les barrières illisibles, sans départ ou dans le désordre. Affichage : bulle du ravito, libellé sur la carte
  (« Barrière 11h15 »), barre sous le profil (icône minuteur), en-tête (départ, temps limite). 3 tests unitaires
- **Bulle des ravitaillements** : distance et D+ depuis le point précédent et jusqu'au suivant, « Contenu non
  communiqué » quand il n'est pas connu
- **GT65** : 4 ravitaillements placés par coordonnées depuis la carte Tracedetrail de l'organisation (Bévercé,
  Mont, Moviemills, barrage de Robertville) et barrières 2026 (11h15, 12h25, 14h20, 17h20, arrivée 20h00 ;
  départ samedi 7 novembre 2026 à 9h00) sur la trace 2024
- **Version commerciale** (`commercialUse: true`) : plus d'Esri (fond « Photos » : orthophotos SPW et IGN sur
  Sentiers, vignette SPW), plus d'OSM ni d'OpenTopoMap, attributions complétées (Terrarium, Copernicus, SPW avec
  lien, IGN) ; vérifié : aucune requête vers Esri, OSM, OpenTopoMap ou Google
- **Polices** servies par l'application : `scripts/fetch_fonts.py` télécharge les familles du style de base et
  des identités (16 fichiers woff2, 345 Ko, licence OFL) dans `fonts/`
- **Profil** : au moins 300 px sur ordinateur et 290 px sur mobile en mode Ravitaillements (la courbe était
  écrasée dans une iframe de 800 px) ; barre des ravitaillements recalculée à chaque changement de taille
  (`ResizeObserver`), elle était entassée à gauche quand le profil était construit masqué (onglet Carte mobile)
- **Démo** `demo-comparaison-gt65.html` : carte actuelle du GTLC (Tracedetrail) et proposition côte à côte (page locale, non versionnée, comme `demo-grandtrail-gt65.html`)
- Backlog : parcours sur smartphone (à analyser), libellés serrés sur mobile, points de contrôle sans ravito

---

## 52. Profil Ravitaillements épuré

**Fichiers** : `js/chart.js`, `style.css`, `index.html`, `docs/BACKLOG.md`

- Courbe à la même hauteur que dans les modes Côtes et Pente (mesuré : 150 px sur ordinateur, 70 px sur mobile
  pour le GT65) : la barre tient sur une ligne et prend la place de l'axe des distances
- Sur la courbe, petite icône de l'identité sur une pastille blanche de 18 px (taille de l'ancienne icône de la barre)
- Barre : un point à chaque ravitaillement (comme au départ et à l'arrivée), km et nom sans puce, plus de
  barrières horaires (visibles dans la bulle du ravito et sur la carte) ; distance et D+ de chaque tronçon sur la
  ligne des km, en plus petit
- Chevauchements réglés sur le rendu réel : libellés d'un ravito trop proche masqués (point gardé, détail au
  survol ; départ et arrivée toujours affichés), texte d'un tronçon réduit au D+ puis masqué ; arrivée calée à
  droite, départ à gauche. Vérifié sans chevauchement sur 4 courses, ordinateur et mobile
