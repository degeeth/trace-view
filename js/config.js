// ── Réglages de la carte ──────────────────────────────────────────────
// Modifier une valeur puis recharger la page. Détails : docs/CARTOGRAPHIE.md, section « Réglages ».
// Repères de zoom : 9 = toute la course, 11 = une vallée, 13 = quelques kilomètres, 15 = un quartier, 16 = une rue.
// Les zooms propres à un fond (apparition des routes, bâtiments, sentiers…) se règlent dans le style
// lui-même (js/style-sentiers.js), pas ici.

export const MAP_CONFIG = {
  // ── Au démarrage ──
  defaultStyle: 'sentiers',          // fond de carte au chargement (clé de MAP_STYLES, js/map-styles.js)
  stylePanelCollapsed: true,         // panneau « Fond de carte » replié

  // ── Tracé ──
  traceWidth: 1,                     // épaisseur du tracé : facteur appliqué à toutes ses couches (halo, contour,
                                     // trait, côtes colorées, côte sélectionnée) ; 0.8 = plus fin, 1.3 = plus épais
  traceWidth3D: 0.7,                 // facteur supplémentaire en 3D : le tracé plaqué sur le relief s'élargit sur les
                                     // versants face à la caméra et empâte les lacets en montagne
  climbHighlightWidth3D: 0.72,       // côte sélectionnée en 3D : surbrillance resserrée (≈ 1,3 fois le tracé au lieu de 1,8)
  traceGlowOpacity3D: 0.35,
  steepSlopeCompensation: true,      // 3D : tracé aminci là où le relief est raide en travers (paroi, falaise), où le
                                     // trait plaqué sur le relief s'étale ; largeur × cosinus de la pente
  steepMinWidth: 0.35,               // amincissement maximal (facteur minimal, atteint vers 70°)
  steepSampleDistance: 15,           // distance (m) de part et d'autre du tracé pour mesurer la pente du relief          // opacité du halo sombre du tracé en 3D (0.6 en 2D) : moins de masse sur le relief

  // ── Apparition selon le zoom ──
  peaksMinZoom: 15,                  // sommets (icône, nom, altitude), sur tous les fonds vectoriels
  contoursMinZoom: {
    thick: 11,                       // courbes maîtresses (tous les 50 m)
    thin: 13,                        // courbes intermédiaires (tous les 10 m)
    labels: 14                       // altitude écrite le long des courbes maîtresses
  },
  thinContoursLoadZoom: 12.5,        // téléchargement des courbes intermédiaires (≈ 1 à 2 Mo) : pas avant ce zoom
  kmMarkersEvery5Zoom: 13,           // bornes tous les 5 km (les dizaines restent toujours visibles)
  arrowsZooms: [9, 10.5, 12, 13.5],  // flèches de direction : tous les 10 km, puis 5, 2 et 1 km

  // ── Relief ──
  hillshadeIntensity: 0.4,           // force de l'ombrage, de 0 (aucun) à 1
  hillshadeLightDirection: 315,      // direction de la lumière en degrés (315 = nord-ouest, la convention)
  satelliteHillshade: false,         // ombrage sur le fond Satellite : les photos ont déjà leurs ombres,
                                     // l'ombrage ajouté les délave (voile blanchâtre en montagne)

  // ── Brume (vue 3D) : voile qui estompe le relief vers l'horizon ──
  fog: true,                         // brume sur les fonds de carte
  satelliteFog: false,               // brume sur le fond Satellite (ternit les photos, surtout en montagne)

  // ── Caméra ──
  pitch3D: 55,                       // inclinaison à l'activation de la 3D (degrés)
  bearing3D: -15,                    // orientation à l'activation de la 3D (degrés, 0 = nord en haut)
  climbFlightPitch: 60,              // inclinaison du vol vers une côte sélectionnée en 3D
  climbMaxZoom: {                    // zoom maximal en cadrant une côte
    map2D: 15,
    map3D: 15.5
  },
  // Passage 2D ↔ 3D : 'fade' = fondu enchaîné (bascule instantanée sous une image figée qui s'efface, fluide sur
  // toute machine) ; 'animate' = caméra qui s'incline et relief qui monte (plus spectaculaire, plus exigeant)
  mode3DTransition: 'fade',
  fadeDuration: 450,                 // durée du fondu (ms)
  fadeMaxWait: 2500,                 // attente maximale du rendu 3D avant le fondu (ms), si le réseau est lent
  fadeLabelDelay: 300,               // la pastille « Passage en 3D… » n'apparaît que si la bascule dure plus (ms)
  fadeSnapshotWait: 400,             // attente maximale de l'image figée (ms) ; au-delà, bascule sans fondu
  animationDuration: {               // durée des mouvements de caméra (ms)
    climb2D: 900,                    // recadrage sur une côte en 2D
    climb3D: 1800,                   // vol vers une côte en 3D
    enter3D: 1200,                   // passage en 3D
    exit3D: 800                      // retour en 2D
  }
};
