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
- Points de contrôle avec barrière horaire sans ravitaillement (Tracedetrail en prévoit) : type de point à ajouter.
- Aide contextuelle : une phrase dans la carte et le profil tant qu'aucune côte n'est choisie (clic sur une
  pastille, survol du profil).
- Profil plus haut ou repliable sur mobile.
- Version néerlandaise et anglaise (le site du GTLC est trilingue).
- Contexte de la course : date d'édition, lien vers la page officielle.
- Option : garder les côtes colorées sur la carte en mode Ravitaillements.

## Idées d'évolution, par effort

Liste du 8 octobre 2026. Priorités proposées : 1) temps de passage estimés et marge sur les barrières, 2) survol 3D
animé, 3) espace organisateur.

### Simples (quelques heures à deux jours)

- **Roadbook imprimable** : une page A4 (profil, tableau des côtes, ravitos, barrières) à glisser dans le sac.
- **Temps de passage estimés** : le coureur donne son allure ou son objectif ; heure de passage à chaque ravito et
  marge sur la barrière horaire, en tenant compte du D+ (une côte à 15 % compte plus qu'un plat).
- **Partager une côte en image** : vignette générée (profil, D+, %, logo de l'organisation) pour les réseaux sociaux.
- **Comparer deux distances** d'une même organisation (ex. Extratrail noir et bleu) : profils superposés, D+,
  kilomètres les plus durs.
- **Mode sombre**, automatique selon l'appareil.
- **Lien « Inscription »** sur la tuile et la page du parcours, vers la billetterie de l'organisation.
- (Déjà noté plus haut : versions néerlandaise et anglaise.)

### Intermédiaires (quelques jours à deux semaines)

- **Envoi du parcours sur la montre** : GPX enrichi, ravitos et côtes en points d'alerte (Garmin, Coros, Suunto) ;
  voir « Parcours sur smartphone » plus haut.
- **Application installable et hors connexion** : carte et parcours disponibles sans réseau.
- **« Où suis-je ? »** : position GPS sur le tracé, km parcouru, D+ restant, distance au prochain ravito et à la
  prochaine côte.
- **Passage le plus raide de chaque côte** : en plus de la pente moyenne, le pourcentage maximal sur 100 m
  (« 12 % de moyenne, 28 % sur 150 m au km 3,2 »).
- **Survol 3D animé** du parcours (à la Relive) : caméra qui suit le tracé, profil qui défile ; argument marketing.
- **Météo par segment le jour J** : température et vent au sommet et en vallée, coucher du soleil (frontale).
- **Surface du sentier** sur le profil (asphalte, chemin, single), d'après OpenStreetMap.

### Compliquées (plusieurs semaines)

- **Espace organisateur** : dépôt du GPX, des ravitos et des barrières par l'organisation elle-même, sans le skill ;
  s'appuie sur l'architecture ci-dessous. Base d'un produit vendable.
- **Suivi en direct le jour de la course** : positions des coureurs sur la carte 3D (chronométrage SQMTime, balises).
- **Analyse après course** : trace Strava du coureur comparée au parcours, côte par côte (temps perdu, vitesse
  ascensionnelle, comparaison à la moyenne).
- **Plan de course nutritionnel** : d'après le temps estimé et le contenu des ravitos, quoi emporter entre chacun.
- **Comparateur de courses** : courses au profil, au D+ par km et à la technicité semblables.

### Futuristes

- **Prédiction personnalisée par IA** : temps par segment d'après l'historique Strava du coureur (vitesse en montée,
  fatigue en fin de course), défaillance probable comprise.
- **Coach vocal pendant la course** : annonce des côtes, des ravitos et de la marge sur les barrières dans les
  écouteurs.
- **Réalité augmentée** : tracé, côtes à venir et noms des sommets affichés sur le paysage à travers le téléphone.
- **Jumeau numérique de la course** pour l'organisateur : simulation des coureurs avant le jour J (bouchons sur les
  singles, ravitos saturés, passage du serre-file).
- **Détection du terrain par photos aériennes et IA** : passages techniques (rochers, racines, gués) et zones
  boueuses, affichés sur le profil.
- **Visite immersive** : parcours en vue subjective 3D, photos des bénévoles géolocalisées le long du tracé.

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
