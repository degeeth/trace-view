# trace-view

Application web d'analyse des côtes d'un parcours de trail : à partir d'un fichier GPX, elle détecte les
côtes, les classe par pente et les présente sur une carte 2D/3D, un profil altimétrique et un tableau filtrable.

Course de référence : **La Grande Ourthe 100km** (100,2 km, +3 408 m, 44 côtes ≥ 300 m).

## Fonctionnalités

- **Tableau des côtes** : distance, dénivelé, pente moyenne, altitudes ; filtres par catégorie, tri,
  mini-profil au survol.
- **Carte** (MapLibre) en **2D ou 3D** avec relief : tracé, côtes colorées, bornes kilométriques, flèches de
  direction, ravitaillements, fonds de carte au choix, dont **Sentiers** (par défaut, conçu pour le trail : sentiers en terre, chemins,
  revêtement) et le satellite avec orthophotos SPW en Wallonie.
- **Profil altimétrique** : repères (départ, point culminant, arrivée, ravitaillements), modes Côtes / Pente /
  Ravitaillements, info-bulle (altitude, pente, D+ cumulé), zoom automatique sur la côte sélectionnée.
- **Tout est relié** : cliquer une côte la met en avant partout (en 3D, la caméra se place face à la pente) ;
  survoler le profil déplace un curseur sur la carte.
- **Partage** : lien direct vers une côte (`#climb-12`), export GPX, mode intégrable (`?embed=1`).
- **Plusieurs courses** : `index.html` sans paramètre est la page d'accueil, une tuile par parcours (logo et couleurs de l'organisation), regroupées par organisation ou par `group` ; une tuile ouvre `index.html?course=<id>`, le lien « Tous les parcours » y ramène.
- **Mobile** : même page, onglets Carte / Côtes.

Catégories de pente (moyenne de la côte) : 🟢 4–7 % · 🟠 7–10 % · 🔴 ≥ 10 % · ⚪ < 4 %.

## Documentation

| Document | Contenu |
|---|---|
| [docs/CARTOGRAPHIE.md](docs/CARTOGRAPHIE.md) | architecture de la carte : technologies, sources, fonds, empilement des couches, 2D/3D, production des données géographiques |
| [docs/LICENCES.md](docs/LICENCES.md) | licences des fonds de carte et des données, en vue d'un usage commercial : ce qui est autorisé, ce qu'il faut remplacer |
| [DESIGN.md](DESIGN.md) | style de base de trace-view (neutre) et thèmes des organisations |
| [docs/BACKLOG.md](docs/BACKLOG.md) | idées retenues, pas encore réalisées |
| [CHANGES.md](CHANGES.md) | journal des changements |
| [CLAUDE.md](CLAUDE.md) | règles du projet pour Claude Code |

## Démarrage

Prérequis : Node.js ≥ 18 (serveur local et tests), Python 3 (construction des courses).

```bash
npm install          # uniquement pour les tests (puppeteer-core)
npm run serve        # → http://localhost:8080
```

L'application est un site statique (HTML + modules JavaScript + données JSON) : elle doit être servie en HTTP,
ouvrir `index.html` directement depuis le disque ne fonctionne pas. N'importe quel hébergement statique
convient (GitHub Pages…).

### Paramètres d'URL

| Paramètre | Effet |
|---|---|
| `?course=<id>` | charge `data/<id>.json` (par défaut : première course du catalogue) |
| `#climb-<n>` | sélectionne la côte n° n à l'ouverture |
| `?embed=1` | masque l'en-tête et les statistiques (intégration en iframe) |
| `?table=0` | masque le tableau des côtes : carte et profil seuls |

## Ajouter une course

Tout part d'un GPX avec altitudes. Le calcul est fait par des scripts reproductibles ; avec Claude Code, le skill
**`add-course`** (commande `/add-course`, fichier `.claude/skills/add-course/SKILL.md`, rédigé en anglais) enchaîne toutes les étapes : il demande les
informations manquantes, lance les scripts, fait corriger les avertissements et vérifie le résultat.

```
courses/<id>/course.json + <fichier>.gpx ──► scripts/build_course.py <id> ──► data/<id>.json + data/courses.json
                                         └─► scripts/gen_contours.py <id> ──► data/contours/<id>/   (optionnel)
```

### 1. Décrire la course : `courses/<id>/course.json`

```json
{
  "id": "lgo100km",
  "name": "La Grande Ourthe 100km",
  "subtitle": "Analyse des côtes ≥ 300 m",
  "gpx": "LGO100km.gpx",
  "branding": "gtlc",
  "aidStations": [
    { "name": "Samrée", "km": 26, "supplies": [
        { "category": "liquide", "label": "Eau plate" },
        { "category": "liquide", "label": "Boisson isotonique", "brand": "Naak" },
        { "category": "solide", "label": "Barres énergétiques", "brand": "6D" },
        { "category": "chaud", "label": "Soupe" } ] },
    { "name": "Achouffe", "lat": 50.14999, "lng": 5.74557, "note": "Eau uniquement",
      "supplies": [ { "category": "liquide", "label": "Eau plate" } ] },
    { "name": "Nisramont (barrage)", "km": 74, "lat": 50.14597, "lng": 5.66861 }
  ],
  "detection": { "minClimbLength": 300, "noiseTolerance": 8, "smoothWindow": 5 }
}
```

| Champ | Description |
|---|---|
| `id` | identifiant court (nom du dossier, de l'URL et du fichier de données) |
| `gpx` | fichier GPX placé dans le même dossier |
| `branding` | identité visuelle, fichier `branding/<nom>.json` (couleurs du tracé, icône des ravitaillements) ; `defaut` si absent |
| `aidStations` | ravitaillements : **km**, **coordonnées**, ou les deux (le script calcule ce qui manque) ; facultatifs : `supplies` (contenu, voir ci-dessous), `note` et `cutoff` (barrière horaire, `"11:15"` : le jour du départ, ou le lendemain si l'heure est avant le départ ; date complète pour une course de plusieurs jours). Le script calcule le temps de course et la vitesse moyenne minimale |
| `detection` | facultatif : longueur minimale d'une côte (m), tolérance au bruit GPS (m), lissage (points) |
| `group` | facultatif : nom du groupe de la course sur la page d'accueil (`"Haute Randonnée Pyrénéenne (HRP)"`) ; sinon l'organisation de son identité, ou « Autres parcours » pour l'identité par défaut |
| `start` | facultatif : départ, `"2026-11-07T09:00"` ; nécessaire aux barrières horaires, affiché dans l'en-tête |
| `finishCutoff` | facultatif : barrière horaire de l'arrivée (`"20:00"`, ou date complète `"2026-11-08T06:00"`) ; affichée comme temps limite |
| `elevationFixes` | facultatif : altitudes fausses du GPX (paliers, sauts) interpolées entre deux km, `[{ "fromKm": 3.03, "toKm": 4.06 }]` ; le GPX n'est pas modifié |
| `terrainExaggeration` | facultatif : exagération du relief en 3D (1 à 5), remplace celle du fond de carte ; 2,5 pour un relief doux comme les Ardennes, absent en montagne |
| `quality` | facultatif : `"high"` pour une carte plus détaillée (relief Mapterhorn jusqu'au zoom 17, orthophotos IGN en France sur le fond Satellite) ; `"standard"` par défaut. Recommandé en montagne, plus lourd à charger |
| `fillElevation` | facultatif : `true` pour récupérer les altitudes d'un GPX qui n'en a pas (voir ci-dessous) |
| `statsElevation` | facultatif : `"smoothed"` : statistiques (D+, altitudes) sur l'altitude lissée, pour un GPX aux altitudes bruitées (ex. RouteYou, arrondies au mètre) ; à décider en comparant au D+ annoncé par l'organisation |

Les GPX (Openrunner notamment) ne contiennent généralement pas les ravitaillements : ils sont saisis ici.

Contenu d'un ravitaillement : tableau `supplies`, un élément par produit :

| Champ | Obligatoire | Valeurs |
|---|---|---|
| `category` | oui (sinon `autre`) | `liquide`, `solide`, `chaud`, `autre` (icône et regroupement à l'affichage) |
| `label` | oui pour `autre` | produit, texte libre (« Eau plate », « Barres énergétiques ») |
| `brand` | non | marque (« Naak », « 6D ») |

Le script signale les éléments invalides (catégorie inconnue → `autre`, élément vide ignoré).

Le contenu (regroupé par catégorie, avec les marques) et la note s'affichent dans la popup de la carte ;
la barre des ravitaillements du profil montre une icône par catégorie et le détail au survol.

#### Identité visuelle : `branding/<nom>.json`

```json
{ "name": "Grand Trail des Lacs & Châteaux", "traceColor": "#e8002d", "accentColor": "#1a2744",
  "aidStationIcon": { "name": "Cerf du GTLC", "viewBox": "784 264 931 1240", "path": "M…" } }
```

`aidStationIcon` est facultatif : sans lui, les ravitaillements prennent l'icône par défaut **couteau / fourchette**.
Une icône fournie est une forme pleine (logo vectorisé) ; `"style": "stroke"` pour une icône au trait.
Identités présentes : `gtlc` (cerf, courses du GTLC), `coureurs-celestes` (empreinte de semelle, La Grande Ourthe),
`oso` (coureuse du Cercle Sportif Olnois), `extratrail` (emblème Extratrail), `defaut` (couteau / fourchette).
Chacune a son `DESIGN.md` dans le dossier de sa course de référence.

`theme` (facultatif) adapte l'interface à l'organisation ; sans lui, style de base neutre de trace-view
(`DESIGN.md`, aussi celui de la page d'accueil) :

| Clé | Effet |
|---|---|
| `primary`, `onPrimary` | couleur d'accent (onglets actifs, filets, sélection) et texte posé dessus |
| `ink`, `night`, `nightHover` | encre, fond de l'en-tête et des en-têtes de tableau, survol |
| `radius` | arrondi des boutons et panneaux (`0` = angles droits, `6px` = doux) |
| `font`, `fontDisplay`, `googleFonts` | police du texte, du nom de la course, et familles Google Fonts utilisées ; après l'ajout d'une famille, lancer `python3 scripts/fetch_fonts.py` : les polices sont servies par l'application (`fonts/`), jamais chargées depuis Google |
| `text`, `textMuted`, `surfaceSoft`, `surfaceAlt`, `border` | couleurs des textes et des fonds |
| `caps`, `tracking` | `"uppercase"` : titres, libellés et boutons en capitales ; interlettrage (`1` = 1,5 px sur un titre) |
| `titleRule` | `true` : point + filet sous les titres (signature du GTLC) |
| `aidIconColor` | couleur de l'icône des ravitaillements sur sa pastille blanche (défaut : encre) |

`headerLogo: true` (au niveau de l'identité) affiche l'icône de l'organisation dans l'en-tête, à côté du titre,
dans la couleur d'accent, à la place de la montagne (actif pour toutes les identités sauf `defaut`).

Exemple : `branding/coureurs-celestes.json`, d'après `courses/lgo100km/DESIGN.md`.

#### GPX sans altitudes

Certains exports (Geolives…) n'ont pas d'altitudes : la construction s'arrête alors et explique les solutions.
La récupération des altitudes n'est **jamais automatique** ; elle s'active explicitement, au choix :

```bash
python3 scripts/build_course.py <id> --fill-elevation     # pour cette exécution
```
ou `"fillElevation": true` dans `course.json` (choix conservé pour les reconstructions ; c'est ce que fait le skill,
après avoir demandé l'accord de l'utilisateur).

Le tracé est densifié (un point tous les 20 m) et les altitudes sont lues dans le modèle **Copernicus GLO-30**
(`rasterio` et réseau requis). Limites : modèle de surface à 30 m (sous la forêt, il mesure le haut des arbres),
donc moins précis qu'un GPX d'origine ; les statistiques affichées utilisent l'altitude lissée (l'altitude brute
du modèle, bruitée, gonflerait le D+). Les altitudes sont mises en cache dans `courses/<id>/elevation-cache.json`.
Quand c'est possible, mieux vaut exporter un GPX avec altitudes.

### 2. Construire les données

```bash
npm run build:course lgo100km                     # ou : python3 scripts/build_course.py lgo100km
python3 scripts/build_course.py lgo100km --check  # compare avec data/lgo100km.json sans rien écrire
```

Le script affiche un résumé (distance, D+, côtes par catégorie, ravitaillements) et des avertissements à traiter :

| Avertissement | Signification |
|---|---|
| *km annoncé X mais les coordonnées tombent au km Y* | km et coordonnées incohérents (écart > 300 m) |
| *à N m du tracé* | coordonnées à plus de 200 m du parcours |
| *hors du parcours* | km supérieur à la distance totale |

### 3. Courbes de niveau (optionnel)

```bash
pip install rasterio
python3 scripts/gen_contours.py lgo100km
python3 scripts/build_course.py lgo100km   # pour que les données référencent les courbes
```

Les courbes (10 m, maîtresses tous les 50 m) sont calculées depuis le modèle d'altitude **Copernicus GLO-30**
sur la zone du parcours + 2 km. Sans elles, l'application fonctionne normalement.

### 4. Vérifier

```bash
npm run test:smoke -- --course lgo100km
```

Pour mettre à jour une course : modifier `course.json` (ou remplacer le GPX) puis relancer l'étape 2.
Pour la retirer : supprimer `courses/<id>/`, `data/<id>.json`, `data/contours/<id>/` et son entrée dans
`data/courses.json`.

## Fonds de carte

| Fond | Statut | Remarque |
|---|---|---|
| **Sentiers** | par défaut | style propre (`js/style-sentiers.js`) : sentiers en terre en tirets rouge-brun, chemins en tirets bruns, petites routes non revêtues signalées, voies revêtues discrètes, sommets avec icône et altitude |
| OSM, Satellite, Streets, Light, Dark, Topo (courbes) | disponibles | fonds tiers (OpenStreetMap, Esri + SPW, OpenFreeMap, OpenTopoMap) |
| Topo trail, Terrain | **dépréciés** | repris de LiveTrail ; proposés dans « Anciens » du panneau, à supprimer |

Ombrage du relief et courbes de niveau sont ajoutés par l'application sur tous les fonds (courbes : Sentiers et
anciens styles).

### Réglages de la carte

`js/config.js` regroupe les réglages modifiables : fond par défaut, zooms d'apparition (sommets, courbes de
niveau, bornes, flèches), ombrage du relief, caméra 3D et durées d'animation. Détails : [docs/CARTOGRAPHIE.md](docs/CARTOGRAPHIE.md#12-réglages-jsconfigjs).

## Comment les côtes sont détectées

Algorithme repris du script d'analyse d'origine (`analyze_climbs.py`, 2023), résultats identiques :

1. Lecture du GPX : distance cumulée (formule de haversine) et altitude de chaque point.
2. Lissage de l'altitude : moyenne glissante sur 5 points, pour gommer le bruit du GPS.
3. Une côte commence dès que l'altitude lissée monte, et se termine quand on redescend de plus de **8 m** sous
   le point le plus haut atteint (les petites descentes en pleine montée ne la coupent pas).
4. Elle est retenue si sa longueur horizontale est d'au moins **300 m** ; sa pente moyenne = gain / longueur.

**Altitudes** : les chiffres affichés (D+, D−, altitudes min / max / moyenne, D+ cumulé, point culminant)
utilisent l'altitude **brute** du GPX, comme Openrunner ; la détection, les pentes et le dessin du profil
utilisent l'altitude **lissée**. Si le D+ brut dépasse nettement le D+ annoncé par l'organisation (GPX bruité),
`"statsElevation": "smoothed"` aligne aussi les statistiques sur l'altitude lissée (cas de l'OSO 2023 :
2 797 m brut, 2 129 m lissé, 2 100–2 300 m annoncés). C'est pourquoi le D+ annoncé (3 408 m) est supérieur à la somme des côtes.

## Structure du dépôt

```
index.html               balisage seul
style.css                styles (jetons de DESIGN.md)
js/
  app.js                 point d'entrée : page d'accueil (sans paramètre) ou page d'une course (?course=)
  dashboard.js           page d'accueil : tuiles des parcours, groupes, chargement
  course.js              page d'une course : chargement, en-tête, sélection, partage, GPX, onglets mobiles
  race.js                chargement des données, pentes, couleurs des catégories
  map.js                 carte MapLibre 2D/3D : couches, panneau des fonds, curseur, surbrillance
  map-styles.js          fonds de carte
  chart.js               profil altimétrique (Chart.js)
  table.js               tableau, filtres, tri, mini-profil
  icons.js               icônes Lucide embarquées
  bus.js                 événements entre modules
js/style-sentiers.js     style de carte « Sentiers » (par défaut)
styles/topo-trail.json   ancien style « Topo trail » (déprécié, à supprimer)
courses/<id>/            entrées : course.json + GPX
branding/<nom>.json      identités visuelles (couleurs, icône des ravitaillements)
data/<id>.json           données générées pour l'application
data/courses.json        catalogue des courses (tuiles de la page d'accueil : identité, groupe, départ)
data/brandings.json      identités des courses du catalogue (logo, couleurs), écrit par build_course.py
data/contours/<id>/      courbes de niveau générées
scripts/
  build_course.py        GPX → données (Python standard)
  gen_contours.py        courbes de niveau (rasterio)
  serve.mjs              serveur local
tests/
  test_build_course.py   tests unitaires du script de construction
  smoke.mjs              test de bout en bout dans Chrome
.claude/skills/add-course/       skill Claude Code du workflow (anglais)
docs/CARTOGRAPHIE.md     documentation technique de la carte
docs/LICENCES.md         licences des fonds de carte et des données
DESIGN.md                style de base de trace-view (neutre) ; chaque organisation a le sien (courses/<id>/DESIGN.md)
CHANGES.md               journal des changements
```

### Architecture de l'application

Les modules ne s'appellent pas directement : ils communiquent par événements (`js/bus.js`).

| Événement | Données | Émis par → écouté par |
|---|---|---|
| `climb:select` | côte ou `null` | tableau, carte, URL → carte, profil, tableau, en-tête |
| `climb:select-num` | n° de côte | pastilles de la carte, lien `#climb-n` → app |
| `trace:mode` | `climbs`, `slope`, `none`, `ravitaillements` | onglets du profil, panneau de la carte → carte, profil |
| `cursor:move` / `cursor:stop` | km | profil → carte, profil |

Dans la console du navigateur, `window.trace` donne accès à la course, à la carte et au profil (débogage, tests).

## Tests

```bash
npm run test:build                         # 18 tests unitaires : côtes, statistiques, ravitaillements, altitudes
npm run test:smoke                         # 24 vérifications dans Chrome headless (ordinateur + mobile)
npm run test:smoke -- --course <id>        # sur une course précise
```

Le test de fumée utilise Chrome installé sur la machine (chemin macOS par défaut, sinon variable `CHROME_PATH`).
Il vérifie notamment : tableau, modes du tracé, curseur, sélection et zoom du profil, 3D, changements de fond,
lien partagé, page d'accueil (tuiles, ouverture d'un parcours) et lien de retour, cohérence du D+, affichage mobile,
absence d'erreur JavaScript.

## Crédits et licences

| Élément | Source | Licence / conditions |
|---|---|---|
| Carte | [MapLibre GL JS](https://maplibre.org) 5.24 | BSD-3 |
| Profil | [Chart.js](https://www.chartjs.org) 4.4 | MIT |
| Tuiles vectorielles, polices | [OpenFreeMap](https://openfreemap.org), © OpenMapTiles, © OpenStreetMap | ODbL / attribution |
| Relief | Terrarium (AWS Open Data), Mapzen | attribution |
| Courbes de niveau | Copernicus DEM GLO-30 | libre, attribution |
| Satellite | Esri World Imagery ; orthophotos © SPW (Wallonie) | conditions des fournisseurs |
| Icônes | [Lucide](https://lucide.dev) | ISC |

**À régler avant une mise en ligne publique** :
- les anciens styles **Topo trail** et **Terrain** (dépréciés) reprennent le style de LiveTrail (palette et
  réglages) : les supprimer avant publication, le style par défaut **Sentiers** est une création propre ;
- le **cerf** des ravitaillements est le logo du Grand Trail des Lacs & Châteaux : l'utiliser avec l'accord
  de l'organisation.
