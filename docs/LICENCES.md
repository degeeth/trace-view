# Licences des fonds de carte et des données

Inventaire des services et données utilisés par trace-view, en vue d'un usage **commercial** (carte intégrée au
site d'une organisation qui vit de ses évènements, comme le GTLC). Relevé en octobre 2026 : les conditions des
services gratuits changent, à revérifier avant un contrat.

Légende : ✅ utilisable tel quel (avec attribution) · ⚠️ utilisable avec réserves · ❌ à remplacer ou à faire valider

## 1. Synthèse

| Source | Utilisée pour | Licence / conditions | Usage commercial | Verdict |
|---|---|---|---|---|
| OpenFreeMap | fonds Sentiers (défaut), Streets, Light, Dark ; polices, sprites | données OSM (ODbL), service gratuit sans limite, « commercial use: yes », pas de SLA | oui | ✅ (soutien financier conseillé, auto-hébergement possible) |
| Terrarium (AWS Open Data, Mapzen) | relief standard (ombrage, 3D) | données ouvertes (SRTM, 3DEP, GMTED…), attribution obligatoire | oui | ✅ **attribution manquante** |
| Mapterhorn | relief qualité haute | code BSD-3, données ouvertes (attribution par source) ; conditions du service hébergé non publiées, pas de SLA | non précisé | ⚠️ à demander, ou auto-héberger les PMTiles |
| IGN Géoplateforme | orthophotos France (qualité haute) | Licence ouverte Etalab 2.0 | oui | ✅ |
| SPW Géoportail Wallonie | orthophotos Wallonie | gratuit, tout usage, redistribution et publication web autorisées, mention « Sources des données : SPW » + lien | oui | ✅ **attribution à compléter** ; service lent, non prévu pour un fort trafic |
| Esri World Imagery | fond Satellite | conditions Esri : usage hors logiciel Esri et commercial soumis à compte ou licence ArcGIS | non sans licence | ❌ |
| tile.openstreetmap.org | fond OSM | données ODbL ; serveur communautaire « best-effort », accès retirable à tout moment, services commerciaux avertis | toléré, déconseillé | ❌ pour un produit vendu |
| OpenTopoMap | fond Topo (courbes) | CC-BY-SA ; serveur bénévole | non vérifié | ⚠️ à éviter pour un produit vendu |
| Copernicus DEM GLO-30 | courbes de niveau, altitudes manquantes (calculées à l'avance) | licence Copernicus : libre, y compris commercial, avec mention | oui | ✅ **attribution manquante** |
| MapLibre GL JS | moteur de carte | BSD-3 | oui | ✅ |
| Chart.js | profil | MIT | oui | ✅ |
| Lucide | icônes | ISC | oui | ✅ |
| Google Fonts | polices des identités | SIL OFL | oui | ⚠️ chargées depuis Google : à auto-héberger (RGPD, voir §3) |

## 2. Ce qu'il faut corriger avant un usage commercial

1. **Satellite (Esri)** : retirer du produit vendu, ou le remplacer. Pistes : orthophotos SPW (Wallonie) et IGN
   (France) seules, gratuites et autorisées ; ailleurs, un fournisseur payant (MapTiler, Stadia Maps…).
   Les courses actuelles sont en Wallonie et en France : SPW + IGN les couvrent.
2. **Fonds OSM et Topo** : les retirer du panneau pour la version vendue (Sentiers les remplace), ou passer par
   un fournisseur payant.
3. **Mapterhorn** : demander les conditions aux auteurs, ou auto-héberger le relief (fichiers PMTiles statiques
   sur un stockage à soi) ; sinon, garder Terrarium (qualité standard) pour la version vendue.
4. **Attributions à ajouter ou compléter** dans la carte :
   - Terrarium : « Terrain Tiles : Mapzen, AWS Open Data (SRTM, GMTED…) » ;
   - Copernicus (courbes de niveau) : « Copernicus DEM GLO-30, © DLR e.V. et © Airbus Defence and Space,
     fourni dans le cadre de COPERNICUS par l'Union européenne et l'ESA » ;
   - SPW : « Sources des données : SPW » avec lien vers geoportail.wallonie.be ;
   - IGN : « © IGN, BD ORTHO » (Etalab demande la source et la date de mise à jour si connue).
5. **Polices** : héberger les fichiers des polices avec l'application au lieu de les charger depuis Google.
6. **OpenFreeMap** : sans garantie de service. Pour un client payant, prévoir un soutien financier au projet ou
   l'auto-hébergement (outil fourni par OpenFreeMap), et un fond de secours.

## 3. Autres droits à régler (hors fonds de carte)

- **Logos et identités** (`branding/`) : propriété de chaque organisation, accord écrit nécessaire.
- **Traces GPX** : les droits appartiennent à leur auteur. Pour un client, utiliser **le GPX officiel fourni par
  l'organisation**. Les traces Strava du dépôt (HRP 10 et 11, Ohm Trail 2018) viennent du compte personnel du
  mainteneur, qui les a parcourues : pas de droit de tiers. Une trace d'un autre utilisateur ne doit pas servir
  dans une version vendue sans son accord.
- **RGPD** : charger des polices depuis Google transmet l'adresse IP des visiteurs à Google ; des tribunaux
  européens l'ont déjà sanctionné (Munich, 2022). Pour le site d'une société, auto-héberger les polices. Les tuiles
  de carte tierces posent la même question : à mentionner dans la politique de confidentialité du site.

## 4. Version « commerciale » recommandée

| Élément | Choix |
|---|---|
| Fond par défaut | Sentiers (OpenFreeMap), avec soutien ou auto-hébergement |
| Photos aériennes | SPW (Wallonie) + IGN (France) seulement |
| Relief | Terrarium (standard) ; Mapterhorn seulement après accord ou auto-hébergé |
| Retirés | Esri, OSM raster, OpenTopoMap |
| Attributions | complètes (§2.4) |
| Polices | auto-hébergées |

## Sources

- [OpenFreeMap](https://openfreemap.org) : usage commercial, absence de limites et de SLA, attribution
- [Politique d'usage des tuiles OpenStreetMap](https://operations.osmfoundation.org/policies/tiles/)
- [Terrain Tiles, AWS Open Data](https://registry.opendata.aws/terrain-tiles) et
  [attribution](https://github.com/tilezen/joerd/blob/master/docs/attribution.md)
- [Mapterhorn](https://mapterhorn.com/) et [attribution](https://mapterhorn.com/attribution)
- [IGN, données sous licence ouverte Etalab](https://atlas.co/data-portals/ign-geoservices/)
- [SPW, conditions d'accès](https://geoportail.wallonie.be/files/documents/ConditionsSPW/DataSPW-CGA.pdf) et
  [licence des services](https://geoportail.wallonie.be/files/documents/ConditionsSPW/LicServicesSPW.pdf)
- [Esri World Imagery, conditions d'usage (discussion)](https://www.globalmapperforum.com/discussion/10809/world-imagery-usage-license-information)
