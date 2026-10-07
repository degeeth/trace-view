# Backlog

Idées retenues, pas encore réalisées. Classées par priorité indicative.

## Lisibilité du relief (courses à faible dénivelé, Ardennes)

Contexte : dans les Ardennes, les dénivelés sont faibles (100 à 200 m par vallée) et le relief s'écrase
visuellement. L'exagération 3D par course (`terrainExaggeration`) est faite ; restent :

1. **Ombrage plus marqué par course** : intensité de l'ombrage (`hillshadeIntensity`, 0,4 aujourd'hui) réglable
   dans `course.json`, 0,6 à 0,7 pour le relief doux, proposé par le skill selon le terrain. Effet visible en 2D.
2. **Ombrage des pentes sur le terrain** : colorier le sol selon la raideur (vert < 4 %, orange 7 à 10 %,
   rouge ≥ 10 %), comme les cartes de ski de randonnée, pour lire côtes et descentes autour du tracé d'un coup
   d'œil. Précalcul par course dans `scripts/gen_contours.py` depuis Copernicus GLO-30 (classes de pente en
   polygones GeoJSON ou en tuiles), couche translucide sous les libellés, activable dans le panneau.
   C'est l'idée qui répond le mieux au besoin.
3. **Courbes de niveau tous les 5 m** quand l'amplitude d'altitude de la zone est faible (maîtresses tous les
   25 m) : choix automatique dans `gen_contours.py`, à refléter dans les zooms d'apparition.
4. **Teinte selon l'altitude** (vallées plus foncées, plateaux plus clairs) : utile pour distinguer fonds de
   vallée et crêtes ; moins prioritaire.

Note : espacer les courbes (intervalle plus grand) donnerait *moins* d'information ; leur écartement traduit
déjà la pente.

## Cartographie

Passage 2D ↔ 3D : le fondu enchaîné est en place (`mode3DTransition: 'fade'`). Options possibles :

- **Animation allégée** (pour `'animate'`) : pendant le mouvement, masquer courbes de niveau, ombrage et
  libellés et baisser la résolution de rendu (`map.setPixelRatio`), puis tout rétablir à l'arrivée ; durées
  raccourcies (0,6 s).
- **Animations réduites** : réglage `reducedMotion` dans `js/config.js`, activé automatiquement si le système le
  demande (`prefers-reduced-motion`) : fondu ou bascule instantanée, y compris pour le vol vers une côte.
- À éviter : garder le relief actif en 2D pour accélérer la bascule (2D plus lente en permanence).

- Supprimer les styles dépréciés **Topo trail** et **Terrain** (repris de LiveTrail) : deux entrées de
  `MAP_STYLES`, `styles/topo-trail.json`, le bloc Terrain de `js/map-styles.js`.
- Réglages fins du style Sentiers (forêts, fond) selon les rendus de `capture/v18_variantes/`.

## Contenu des courses

- Ravitaillements réels (et leur contenu) : Extratrail Stoumont, OSO (contenu fictif de test à remplacer). GTLC 65 :
  ravitaillements et barrières 2026 en place (carte Tracedetrail de l'organisation), contenu à obtenir ; GPX 2026
  officiel à demander.
- OSO : vérifier s'il existe un logo propre à la course (affiche, dossard), à préférer à celui du club.
- Extratrail : GPX avec altitudes d'origine (D+ annoncé 967 m, Copernicus donne 1 308 m).
- Chiffre de D+ officiel de l'Extratrail Stoumont pour juger les altitudes récupérées (Copernicus).

## Interface

- **Parcours sur smartphone** (à analyser) : aujourd'hui le GTLC propose, via Tracedetrail, un QR code vers
  l'application Trail Connect (parcours embarqué, guidage). Pistes, de la plus simple à la plus lourde :
  QR code vers la page mobile de la course ; envoi du GPX vers la montre ou l'application du coureur (Garmin
  Connect, Suunto, Coros, Strava, Komoot : import de fichier ou API selon la marque) ; mode hors connexion
  (application web installable, tuiles en cache, position GPS sur le tracé). À arbitrer : besoin réel des
  coureurs, coût de maintenance, conditions des fournisseurs de tuiles pour le hors-ligne.
- Barre des ravitaillements sur mobile étroit : libellés qui se touchent quand deux ravitos sont proches
  (GT65 : Bévercé et Mont à 7 km d'écart, 390 px de large).
- Points de contrôle avec barrière horaire sans ravitaillement (Tracedetrail en prévoit) : type de point à ajouter.
- Aide contextuelle : une phrase dans la carte et le profil tant qu'aucune côte n'est choisie (clic sur une
  pastille, survol du profil).
- Profil plus haut ou repliable sur mobile.
- Version néerlandaise et anglaise (le site du GTLC est trilingue).
- Contexte de la course : date d'édition, lien vers la page officielle.
- Option : garder les côtes colorées sur la carte en mode Ravitaillements.

## Architecture : application Angular + API + PostgreSQL

Idée : passer du site statique (fichiers JSON générés) à une application Angular servie par une API REST,
données dans PostgreSQL avec l'extension PostGIS.

**Données**

| Donnée actuelle | Table | Remarque |
|---|---|---|
| `course.json` + statistiques | `course` | id, nom, réglages (`quality`, `terrainExaggeration`…), stats, `branding_id` |
| tracé (`track.points`, `ele`, `eleRaw`, `dist`) | `course` ou `course_track` | géométrie PostGIS `LineStringZ` ; distances et altitudes en `real[]` ou recalculées |
| côtes | `climb` | une ligne par côte (course, n°, catégorie, km, D+, pente, indices) |
| ravitaillements | `aid_station` + `aid_supply` | point PostGIS, km, nom, note ; produits (catégorie, libellé, marque) en table fille |
| identités | `branding` | couleurs, icône (viewBox + path) |
| catalogue | requête sur `course` | remplace `data/courses.json` |

**API REST** : `GET /courses`, `GET /courses/{id}` (en-tête, stats, côtes, ravitaillements),
`GET /courses/{id}/track` (GeoJSON).

**Points d'attention**

- **Courbes de niveau** (jusqu'à 2 Mo par course) : stockées en PostGIS mais servies en **tuiles vectorielles**
  (`ST_AsMVT`, Martin ou pg_tileserv) plutôt qu'en JSON complet ; MapLibre ne charge que la zone visible.
- **Calcul** (`build_course.py` : côtes, ravitaillements, altitudes Copernicus) : en Python. À garder comme
  service ou tâche d'import ; une réécriture en Java demanderait de revalider les résultats (les tests actuels
  servent de référence).
- **Hors base** : fonds de carte, relief, satellite, orthophotos restent des services tiers appelés par le
  navigateur ; styles et réglages (`style-sentiers.js`, `config.js`) restent du code front.

**Front Angular** : MapLibre (direct ou `ngx-maplibre-gl`) et Chart.js ; les modules `map.js`, `chart.js`,
`table.js` deviennent des composants, le bus d'événements un service (signaux ou RxJS).

**Recommandation** : Angular + **FastAPI** (SQLAlchemy, GeoAlchemy2) + PostgreSQL/PostGIS, le chemin le plus
court car le Python d'import et de calcul est réutilisé tel quel. Spring Boot (JPA, Hibernate Spatial) si
l'écosystème est déjà Java, en gardant Python pour l'import.

## Publication

- Accords pour les logos : GTLC (cerf), Coureurs Célestes (empreinte), Cercle Sportif Olnois (coureuse),
  ASBL Extratrail (emblème).
- OSO : le règlement (article 4) demande de ne pas publier la trace GPS ; accord de l'organisation nécessaire.
