---
version: alpha
name: Olne-Spa-Olne · Cercle Sportif Olnois
description: >
  Identité visuelle de l'Olne-Spa-Olne (OSO, ≈ 71 km, boucle au départ d'Olne par Banneux, Spa et Oneux),
  organisée par le Cercle Sportif Olnois (CSO). Emblème : silhouettes d'une coureuse, d'un marcheur et d'un
  vététiste sur une montagne, monogramme « CSO » arrondi, le tout en vert pomme. Ton : « Courir pour le plaisir ».
source: https://www.courirpourleplaisir.be/olne-spa-olne-2/
colors:
  primary: "#8DC63F"        # Vert pomme des deux logos (CSO et « Courir pour le plaisir ») : couleur signature
  primary-dark: "#3B6E1E"   # Vert profond dérivé du logo : sélection du profil, liens, éléments actifs
  site-green: "#79C143"     # Couleur primaire Elementor du site (liens), proche du logo
  site-green-dark: "#548D2A" # Survol des liens, boutons d'inscription (CSS personnalisé du site)
  button: "#67C81F"         # Bouton « S'inscrire » rendu (accent Elementor)
  on-primary: "#1F2A16"     # Encre posée sur le vert pomme
  ink: "#404040"            # Texte du site (couleur « text » Elementor)
  ink-strong: "#1D1B1B"     # Titres et gras du site
  muted: "#A4A4A4"          # Menu du site (couleur « secondary » Elementor)
  surface: "#FFFFFF"        # Le site est entièrement blanc (aucun bandeau sombre)
  night: "#26331B"          # Proposition : vert-noir pour l'en-tête de trace-view (absent du site)
  trace: "#7B2D8E"          # Proposition : violet complémentaire du vert, pour le tracé sur la carte
  web-hover: "#D84D2B"      # Survol des liens dans le kit Elementor : reliquat de modèle, à ne pas reprendre, voir §2
typography:
  display: { family: "Sora, Poppins, sans-serif", weight: 600, transform: uppercase }
  heading: { family: "Poppins, sans-serif", weight: 600, transform: uppercase }
  body:    { family: "Poppins, sans-serif", weight: 400, size: 15px }
  button:  { family: "Sora, sans-serif", weight: 400, transform: uppercase, tracking: 1.2px }
rounded:
  default: 0px             # boutons, images et champs à angles droits sur le site
branding:                  # proposition pour branding/oso.json (trace-view)
  traceColor: "#7B2D8E"
  accentColor: "#3B6E1E"
  aidStationIcon: "silhouette de la coureuse du logo CSO, vectorisée (comme le cerf du GTLC)"
---

# DESIGN.md : Olne-Spa-Olne · Cercle Sportif Olnois

> Identité de l'[Olne-Spa-Olne](https://www.courirpourleplaisir.be/olne-spa-olne-2/) (OSO), trail de ≈ 71 km
> (2 296 m D+ annoncés pour l'édition 2026, la 30e) au départ du Hall Omnisport d'Olne, organisé par le
> **Cercle Sportif Olnois (CSO)**, site « Courir pour le plaisir ». Ravitaillements annoncés aux km 16 (Banneux),
> 32 (Spa), 48 (Oneux) et 64. Ce document sert à habiller la course dans trace-view ; le `DESIGN.md` à la racine
> du dépôt reste celui du Grand Trail des Lacs & Châteaux (GTLC).
> Valeurs relevées sur le site (feuilles de style en ligne Elementor, rendu de la page, logos) en octobre 2026.

---

## 1. Esprit

**Mots-clés : plaisir, club, nature, vert, multisport, Pays de Herve et Ardenne.**

- **L'OSO n'a pas de logo propre** : la page de la course affiche le logo du club, le **CSO** (fichier
  `CSO-logo-2025.png`). On y voit une coureuse à queue de cheval, un randonneur avec bâtons et chapeau et un
  vététiste en appui sur la roue arrière, sur une ligne de montagne dans un grand arc de cercle (soleil ou
  colline), au-dessus du monogramme « CSO » en lettres arrondies, inclinées, au trait évidé, et de
  « CERCLE SPORTIF OLNOIS » en capitales de même style. Tout est d'un seul vert, `#8DC63F`.
- **Second logo, « Courir pour le plaisir »** : deux coureurs devant un soleil, des collines et deux sapins,
  au-dessus de « COURIR / POUR LE PLAISIR », même vert et même lettrage. C'est l'image de partage du site
  (`og:image`) et le logo déclaré pour les moteurs de recherche. Le règlement de l'OSO s'y réfère : course
  « dans l'esprit "Courir pour le plaisir" ».
- **Ton** : club local et bénévole, chaleureux (« nous attendons toujours les derniers aussi méritants que les
  premiers »), soucieux de la nature (« Respectez la nature et le code forestier », plus de gobelets aux ravitos).
- **Sobriété du site** : thème WordPress Hello Elementor, fond entièrement blanc, titres en capitales, une grande
  photo de chemin entre prairies. L'identité tient au vert du logo ; trace-view peut la reprendre sans surcharge.

## 2. Couleurs

| Token | Hex | Rôle |
|---|---|---|
| `primary` : vert pomme | `#8DC63F` | Couleur signature, mesurée sur les deux logos (≈ 20 % des pixels du logo CSO, le reste étant blanc) : onglet actif, filets, pastilles |
| `primary-dark` : vert profond | `#3B6E1E` | Dérivé du logo : sélection et curseur du profil, liens, boutons actifs ; contraste 6,1:1 sur blanc |
| `on-primary` : encre verte | `#1F2A16` | Texte sur le vert pomme (7,3:1) |
| `ink` | `#404040` | Texte courant (couleur « text » du kit Elementor ; 10,4:1 sur blanc) |
| `ink-strong` | `#1D1B1B` | Titres et gras |
| `muted` | `#A4A4A4` | Texte secondaire (menu du site) ; pas pour du texte long |
| `night` : vert-noir | `#26331B` | Proposition pour l'en-tête de trace-view ; blanc dessus 13,4:1, vert pomme dessus 6,5:1 |
| `night-hover` | `#34452A` | Survol ; blanc dessus 10,3:1 |
| `trace` : violet | `#7B2D8E` | Proposition pour le tracé, voir ci-dessous |

**Couleurs du site, ce qui est un choix et ce qui ne l'est pas**

- **Choix de l'organisation** : les verts. Couleur primaire Elementor `#79C143` (liens), accent `#67C81F`
  (bouton « S'inscrire », rendu `rgb(103,200,31)`), survol des boutons `#73B145`, et dans le CSS personnalisé
  du site `#548D2A` (survol des liens, boutons de paiement) et `#8DC63F` (encadrés WooCommerce, soit exactement
  le vert du logo). Ce sont des variantes proches du vert du logo : on retient **`#8DC63F`**, la valeur exacte.
- **Pas un choix** : `#D84D2B` (survol des liens dans le kit) et `#FFBC7D` (transition de page) sont des
  réglages hérités d'un modèle Elementor, sans lien avec le logo ; la palette `--wp--preset--color--*`
  (`#CF2E2E`, `#FF6900`, `#0693E3`…) est celle de WordPress par défaut. À ne pas reprendre.
- Le site pose du **texte blanc sur le vert** (bouton d'inscription : 2,1:1, illisible au sens WCAG) : ne pas
  reproduire, voir §5.

**Tracé sur la carte : `#7B2D8E` (violet)**. Un tracé vert, même foncé, se confondrait avec les forêts
(`#AED096`) et prairies (`#D9E6BD`) du style Sentiers et avec la catégorie verte des pentes. Le violet est
**la couleur complémentaire du vert pomme** du logo, donc il le met en valeur sans le copier. Contrastes :
7,1:1 sur le fond papier `#F4F1E8`, 6,4:1 sur les cultures `#EBE5CC`, 6,1:1 sur les prairies, 4,7:1 sur les
forêts, et une teinte nettement distincte des rivières (`#7AB5D3`, écart de luminance 3,6:1 en plus de la
teinte) et des sentiers en terre (`#B4522A`, brun-orange). Avec le contour sombre de trace-view, il reste
lisible sur l'ombrage du relief.

*Variante fidèle à la marque* : `#2F5A17` (vert très foncé, 7,2:1 sur papier, 4,7:1 sur forêt). Contraste
suffisant en luminance, mais même teinte que la végétation : moins repérable d'un coup d'œil. À n'utiliser que
si l'organisation tient à un tracé vert.

Les catégories de pente (vert, orange, rouge) et les couleurs du mode Pente ne changent pas : elles portent
une information.

## 3. Typographie

| Usage | Police | Remarque |
|---|---|---|
| Nom de la course, grands titres | **Sora** 600, capitales | titre de la page « OLNE SPA OLNE » (52 px) et titres de colonne, menu en Sora 500 |
| Titres de section | **Poppins** 600, capitales | titres h2 du site |
| Texte courant, tableau | **Poppins** 400, 15 px | police du texte du site, couleur `#404040` |
| Boutons | **Sora** 400, capitales, interlettrage 1,2 px | bouton « S'inscrire » rendu |

Les trois familles sont servies par Google Fonts (copies locales Elementor : `sora.css`, `poppins.css`,
`oswald.css`). **Oswald** est chargée mais ne sert qu'au style de bouton par défaut du kit, remplacé à
l'affichage par Sora : ne pas la retenir.

Le lettrage des logos (« CSO », « COURIR ») est une police arrondie, inclinée, de style techno ; elle n'est pas
identifiée et n'est pas publiée. Ne pas chercher à l'imiter en texte : utiliser le logo en image.

## 4. Formes et composants

- **Angles droits** : boutons, champs et images du site ont `border-radius: 0` (seul un encadré de paiement est
  arrondi à 5 px). Contrairement aux Coureurs Célestes, on garde donc `radius: 0` ; les formes rondes viennent
  du logo lui-même (arc de cercle, lettres arrondies).
- **Boutons** : fond vert pomme, texte encre verte `#1F2A16`, capitales Sora ; actif ou survol : vert profond
  `#3B6E1E`, texte blanc (6,1:1).
- **Onglets du profil** : onglet actif en vert pomme ; les autres en contour vert pomme.
- **En-tête** : le site n'a aucun bandeau sombre (en-tête et pied de page blancs). Pour trace-view, qui a un
  en-tête sombre, proposer un vert-noir `#26331B` plutôt que du gris neutre : il prolonge le vert sans le
  diluer. Nom de la course en Sora blanc, filet vert pomme de 4 px dessous.
- **Pastille des ravitaillements** : cercle blanc, **silhouette de la coureuse** du logo CSO (à gauche, queue de
  cheval, en pleine foulée) en vert profond. C'est la figure la plus lisible à petite taille ; le marcheur et le
  vététiste sont trop fins (bâtons, rayons). À défaut, icône par défaut couteau / fourchette.
- **Photos** : prairies, chemins et haies du pays de Herve et de la vallée de la Hoëgne. Si des images sont
  utilisées sous du texte blanc, les voiler (≈ 30 % de noir).

## 5. À faire / À éviter

### À faire
- Utiliser le **vert pomme** comme accent (fonds, filets, pastilles) et le **vert profond** pour ce qui doit se lire.
- Garder un tracé de couleur **distincte de la végétation** (violet proposé).
- Reprendre le ton « Courir pour le plaisir » : simple, accueillant, respectueux de la nature.

### À éviter
- Du texte blanc sur le vert pomme (2,0:1) ou sur le vert du bouton du site `#67C81F` (2,1:1), et du texte vert
  pomme sur fond blanc (2,0:1) : vert pomme = fonds et filets uniquement.
- Le rouge-orangé `#D84D2B`, l'orange `#FFBC7D` et la palette WordPress par défaut : reliquats de modèles.
- Un tracé vert clair ou moyen (`#8DC63F`, `#79C143`, `#548D2A`) : invisible sur les forêts (2,1:1 à 2,4:1).
- Le cerf, le bleu glacier du GTLC et l'empreinte bleu ciel des Coureurs Célestes : autres organisations.
- Recolorer ou déformer le logo ; il est monochrome vert, on peut seulement le passer en blanc sur fond sombre.
- Le tiret cadratin dans les textes (règle du projet, `CLAUDE.md`).

## 6. Application dans trace-view

Fait : `branding/oso.json` applique cette proposition. La coureuse a été vectorisée depuis le logo du CSO
(isolée de l'arc et de la ligne de sol) ; `headerLogo` est actif.

```json
{
  "name": "Cercle Sportif Olnois (Olne-Spa-Olne)",
  "traceColor": "#7B2D8E",
  "accentColor": "#3B6E1E",
  "aidStationIcon": { "name": "Coureuse (logo du CSO)", "viewBox": "…", "path": "M…" },
  "headerLogo": true,
  "theme": {
    "primary": "#8DC63F",
    "onPrimary": "#1F2A16",
    "ink": "#404040",
    "night": "#26331B",
    "nightHover": "#34452A",
    "radius": "0",
    "font": "Poppins, Arial, sans-serif",
    "fontDisplay": "Sora, Poppins, sans-serif",
    "googleFonts": "family=Sora:wght@600;700&family=Poppins:wght@400;600;700",
    "aidIconColor": "#3B6E1E"
  }
}
```

| Élément | Valeur |
|---|---|
| Tracé sur la carte | `traceColor` `#7B2D8E` (violet complémentaire, voir §2) ; variante verte `#2F5A17` |
| Curseur, sélection du profil | `accentColor` `#3B6E1E` (vert profond, 6,1:1 sur blanc) |
| Icône des ravitaillements | coureuse vectorisée depuis le logo CSO, en `#3B6E1E` (`aidIconColor`) ; à produire (tant qu'elle manque, retirer `aidStationIcon` pour garder l'icône par défaut) |
| En-tête | `headerLogo: true` pertinent une fois l'icône vectorisée : la coureuse en vert pomme sur `#26331B` (6,5:1), à la place de la montagne |
| Thème de l'interface (`theme`) | accent `#8DC63F`, encre sur accent `#1F2A16`, en-tête `#26331B`, angles droits, Sora (nom) et Poppins (texte) |

**Sources du logo** (à vectoriser à partir du plus grand fichier) :
- logo du club, 788 × 510 px, **fond blanc opaque** (à détourer) :
  `https://www.courirpourleplaisir.be/wp-content/uploads/2021/11/CSO-logo-2025.png`
- logo « Courir pour le plaisir », 700 × 200 px, fond transparent :
  `https://www.courirpourleplaisir.be/wp-content/uploads/2021/11/courir-pour-le-plaisir-logo1.png`

Pour l'icône, isoler la coureuse (partie gauche du logo CSO), la vectoriser en une forme pleine, sans l'arc ni
la ligne de montagne, et vérifier qu'elle reste reconnaissable à 16 px.

**Accord** : les logos appartiennent au Cercle Sportif Olnois ; obtenir son accord avant toute utilisation
publique. Par ailleurs, le règlement de l'OSO (article 4) demande aux participants de **ne pas publier ni céder
la trace GPS** (passages en terrain privé) : une version publique de trace-view affichant ce parcours doit
aussi recevoir l'accord de l'organisation.

À vérifier : l'OSO a-t-il un logo propre (affiche, dossard, t-shirt) qui ne figure pas sur le site ? Si oui, il
prime sur celui du club.
