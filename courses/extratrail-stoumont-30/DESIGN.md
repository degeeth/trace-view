---
version: alpha
name: Extratrail Stoumont · Parcours noir (30 km)
description: >
  Identité visuelle du parcours noir d'Extratrail Stoumont (30 km, 967 m D+, départ de la bibliothèque
  communale de Stoumont, vallée de l'Amblève). Extratrail (ASBL) est un réseau de parcours de trail
  permanents, balisés et gratuits dans l'Ardenne belge, et non une course. Emblème : un cercle bleu ouvert
  en bas, des sapins ou sommets vert anis et un chemin blanc sinueux ; nom « EXTRA » bleu fin et « TRAIL »
  vert gras, devise manuscrite « Ardenne Running Territories ». Ton : nature, liberté, découverte.
source: https://www.extratrail.com/fr
course-page: https://www.extratrail.com/fr/trails-balisestrails-stoumont/stoumont-extratrail-30-km
colors:
  brand-blue: "#008ECE"     # Bleu du logo (cercle, « EXTRA ») ; mesuré #008ECF dans le SVG du logo
  brand-green: "#BBCE00"    # Vert anis du logo (sommets, « TRAIL ») ; mesuré #BCCF00 ; couleur « primary » du site
  brand-grey: "#6F6F6E"     # Gris de la devise et du texte courant du site (#706F6F dans le logo)
  route-noir: "#323232"     # Couleur du parcours noir (panneau « Descriptif du parcours », balise noire)
  stoumont: "#A287BD"       # Mauve de la commune de Stoumont (bandeau de titre, écusson « Extratrail Stoumont »)
  stoumont-dark: "#6C4796"  # Violet foncé du site (connexions entre communes), même teinte que le mauve Stoumont
  ink: "#333234"            # « black » du thème du site (titres h2, icônes)
  surface: "#FFFFFF"
  surface-soft: "#FAFAFA"
  route-colors: { vert: "#BBCE00", bleu: "#008ECE", rouge: "#E64125", noir: "#323232" }
typography:
  display: { family: "Eurostile (Adobe Fonts) ; substitut libre : Saira", weight: 700 }
  menu:    { family: "Eurostile", weight: 500, transform: uppercase, size: 17px }
  script:  { family: "Damion (Google Fonts)", weight: 400, usage: "titres d'accroche, « Parcours noir », devise" }
  body:    { family: "Helvetica, Roboto, Arial, sans-serif", weight: 300, size: 16px }
rounded:
  card: 20px               # panneau noir « Descriptif du parcours »
  button: 25px             # boutons pilule (« Vue d'ensemble », « Vérifier le calendrier de chasse »)
  small: 8px               # champ de recherche, petits éléments
  app: 8px                 # proposition pour trace-view
branding:                  # proposition pour branding/extratrail.json (trace-view)
  traceColor: "#6C4796"
  accentColor: "#6C4796"
  aidStationIcon: "emblème du logo (cercle + sommets + chemin), repris tel quel du SVG du site"
  headerLogo: true
---

# DESIGN.md : Extratrail Stoumont · Parcours noir (30 km)

> Identité du [parcours noir d'Extratrail Stoumont](https://www.extratrail.com/fr/trails-balisestrails-stoumont/stoumont-extratrail-30-km),
> boucle de 30 km et 967 m D+ (durée annoncée 4 h à 7 h, difficulté « +++++ ») au départ de la bibliothèque
> communale, route de l'Amblève 45, 4987 Stoumont. Ce document sert à habiller le parcours dans trace-view ;
> le `DESIGN.md` à la racine du dépôt décrit le style de base neutre de trace-view ; celui du GTLC est dans
> `courses/gtlc-65-2024/DESIGN.md`.
> Valeurs relevées le 5 octobre 2026 sur le site (feuilles de style, rendu de la page, SVG du logo).

---

## 1. Esprit

**Mots-clés : nature, liberté, découverte, Ardenne, balisage, couleurs par distance.**

- **Ce n'est pas une course** : Extratrail est un réseau de parcours **permanents, balisés et gratuits**
  (« le plus grand réseau de parcours de trail balisés et permanents d'Europe du Nord-Ouest »), réparti sur
  plusieurs communes (Stoumont, Spa, Theux, Stavelot, Trois-Ponts, Jalhay, Malmedy) et relié par des
  connexions. Pas de dossard, pas de ravitaillement : on court « en toute liberté », sous sa propre
  responsabilité, en vérifiant le calendrier des chasses.
- **L'emblème** : un cercle bleu ouvert en bas, d'où sort un chemin blanc qui serpente entre des sommets
  (ou des sapins) vert anis. Le nom « EXTRATRAIL » est en capitales géométriques, « EXTRA » bleu et fin,
  « TRAIL » vert et gras ; dessous, la devise manuscrite « Ardenne Running Territories » en gris
  (l'image de partage du site porte encore l'ancienne devise « Decathlon Running Territories »).
- **Le code couleur des distances** structure tout le réseau, sur le terrain comme sur le site : vert
  (≈ 7 km), bleu (14 km), rouge (21 km), **noir (30 km)**. Les balises portent ces couleurs, le logo de la
  commune et une flèche.
- **Chaque commune a sa couleur** : Stoumont est **mauve** (`#A287BD`), visible dans le bandeau
  « Trails à Stoumont » et l'écusson « Extratrail Stoumont » (cercle gris, texte mauve et gris).
- **Ton** : « 100 % nature, 100 % découverte » ; textes concrets et prudents (servitudes privées, routes
  étroites, chasses).

## 2. Couleurs

Toutes les valeurs viennent du thème Drupal sur mesure du site (`thextra`) ou du SVG du logo ; ce sont donc
des choix de l'organisation.

| Token | Hex | Rôle |
|---|---|---|
| `brand-blue` : bleu Extratrail | `#008ECE` | Cercle et « EXTRA » du logo, boutons pilule du site ; contraste sur blanc ≈ 3,7:1 (grands textes et graphismes seulement) |
| `brand-green` : vert anis | `#BBCE00` | Sommets et « TRAIL » du logo, couleur `primary` du site (curseurs, grands titres) ; **jamais en texte sur blanc** (≈ 1,8:1) |
| `brand-grey` : gris | `#6F6F6E` | Devise du logo, texte courant et en-têtes de tableau du site ; ≈ 5,0:1 sur blanc |
| `route-noir` : noir du parcours | `#323232` | Couleur du parcours 30 km (panneau « Descriptif du parcours », balise) ; texte blanc dessus ≈ 12,8:1 |
| `stoumont` : mauve | `#A287BD` | Couleur de la commune ; fonds et filets ; ≈ 3,1:1 sur blanc |
| `stoumont-dark` : violet | `#6C4796` | Violet du site (connexions), même teinte que le mauve Stoumont (≈ 268°) ; ≈ 7,1:1 sur blanc |
| `ink` | `#333234` | Titres, icônes (« black » du thème) |

Mesure du logo (rendu PNG 703 × 216, pixels opaques) : vert `#BCCF00` 55 %, bleu `#008ECF` 35 %,
gris `#706F6F` 8 %. Ce sont exactement les remplissages déclarés dans le SVG ; le site arrondit à
`#BBCE00` / `#008ECE` / `#6F6F6E` dans sa feuille de style.

**Couleurs à ne pas reprendre** (valeurs par défaut d'outils, pas des choix d'Extratrail) : la palette de
l'éditeur Gutenberg (`#FF6900`, `#0693E3`, `#CF2E2E`, `#FCB900`, `#00D084`, `#9B51E0`), le jaune
`#F1D600` du bandeau cookies (cookieconsent), le bleu pur du tracé de la carte Leaflet du site.

**Tracé sur la carte** : `#6C4796` (violet de la famille Stoumont), avec le contour sombre de trace-view.

| Fond / repère | Contraste avec `#6C4796` |
|---|---|
| Blanc (profil, tableau) | ≈ 7,1:1 |
| Prairie vert pâle (≈ `#D8E8C0`) | ≈ 5,5:1 |
| Forêt du style Sentiers (`#AED096`) | ≈ 4,1:1 |
| Beige (≈ `#F2EFE6`) | ≈ 6,1:1 |
| Rivières (`#7AB5D3`) | ≈ 3,2:1, et teinte différente (violet contre bleu ciel) |

Pourquoi pas les couleurs du logo pour le tracé : le **bleu** `#008ECE` se confond avec les rivières
(même teinte, contraste ≈ 1,6:1) et le **vert anis** disparaît sur les prairies et forêts (≈ 1,4:1).
Le **noir du parcours** `#323232` serait le plus fidèle au balisage et très lisible (≈ 9,9:1 sur prairie),
mais il se fond dans le contour noir que trace-view dessine sous le tracé et dans les routes et libellés
sombres ; il reste une alternative si l'organisation y tient. Les catégories de pente (vert, orange, rouge)
et les couleurs du mode Pente ne changent pas : elles portent une information.

## 3. Typographie

| Usage | Police | Remarque |
|---|---|---|
| Nom du logo, titres, menu | **Eurostile** 400, 500, 700 (Adobe Fonts, kit `use.typekit.net/qql1qxv.css`) | menu en capitales 500, titres 700 ; police sous licence Adobe, liée au kit du site |
| Accroches, « Parcours noir », devise | **Damion** 400 (Google Fonts) | manuscrite, réservée aux grands titres décoratifs |
| Texte courant | **Helvetica** 300, repli Roboto, Arial | police système, aucun chargement |

Eurostile n'est pas libre : pour trace-view, **Saira** (Google Fonts, 500 à 700) en est un substitut proche
(formes carrées arrondies). Damion est libre et peut être reprise telle quelle, avec parcimonie
(un mot ou un titre, jamais du texte courant ni des chiffres de tableau).

## 4. Formes et composants

- **Arrondis marqués** : panneau noir du parcours à 20 px, boutons en pilule (23 à 25 px), petits éléments
  à 8 px. Pour trace-view, 8 px sur boutons et panneaux garde l'esprit sans gonfler l'interface.
- **Boutons** : pilule bleue `#008ECE` texte blanc gras en capitales (« Vérifier le calendrier de chasse »),
  ou pilule grise `#646464` (« Vue d'ensemble »).
- **Panneau du parcours** : fond de la couleur du parcours (noir `#323232` ici), texte blanc, gros chiffres
  en Damion (« 30 km », « 967 m ») sur un motif de courbes de niveau.
- **Motifs** : courbes de niveau en filigrane gris clair, bords de photos déchirés (effet papier),
  petit triangle de sommets gris au-dessus des titres.
- **Pastille des ravitaillements** : le parcours permanent n'a **aucun ravitaillement**
  (`aidStations: []`) ; si des points d'intérêt sont ajoutés (départ, fontaine, source de Bru), utiliser
  l'**emblème** du logo (cercle + sommets + chemin) en violet sur pastille blanche.

## 5. À faire / À éviter

### À faire
- Reprendre le **code couleur des distances** : le 30 km est le **parcours noir**, à dire dans le titre et,
  si possible, par un filet ou une pastille noire `#323232`.
- Utiliser le **vert anis** comme accent de fond (onglet actif, filets) avec un texte noir dessus
  (`#1A1A1A` sur `#BBCE00` ≈ 9,9:1).
- Rappeler la nature du parcours : permanent, balisé, gratuit, à vérifier avant de partir (chasses, tempêtes).

### À éviter
- Du texte vert anis ou mauve clair sur fond blanc (≈ 1,8:1 et 3,1:1).
- Un tracé bleu (confusion avec les rivières) ou vert anis (invisible sur la carte).
- Parler de « course », de « dossard » ou de « ravitaillements » : ce n'est pas un événement.
- La palette Gutenberg et le jaune du bandeau cookies (§2).
- Le cerf, le bleu glacier et les angles droits du GTLC, l'empreinte bleu ciel des Coureurs Célestes.
- Le tiret cadratin dans les textes (règle du projet, `CLAUDE.md`).

## 6. Application dans trace-view

Fait : `branding/extratrail.json` applique cette proposition (emblème repris du SVG du site, `headerLogo` actif).

| Élément | Valeur |
|---|---|
| Tracé, curseur, sélection du profil | `traceColor` / `accentColor` `#6C4796` |
| Icône des ravitaillements | emblème du logo (cercle ouvert, sommets, chemin en creux), forme pleine, en `#6C4796` (`aidIconColor`) |
| En-tête | `headerLogo: true` : l'emblème à côté du nom, à la place de la montagne (lisible à 24 px, le chemin reste visible en creux) |
| Accent de l'interface (`primary` / `onPrimary`) | `#BBCE00` / `#1A1A1A` (≈ 9,9:1) |
| Encre (`ink`) | `#333234` |
| En-tête et en-têtes de tableau (`night` / `nightHover`) | `#323232` (noir du parcours) / `#464646` ; texte blanc ≈ 12,8:1, vert anis dessus ≈ 7,3:1 |
| Arrondis (`radius`) | `8px` |
| Polices | texte `Helvetica, Roboto, Arial, sans-serif` (système) ; nom `Saira` 700 (substitut d'Eurostile) |

```json
{
  "name": "Extratrail (Ardenne Running Territories)",
  "traceColor": "#6C4796",
  "accentColor": "#6C4796",
  "aidStationIcon": {
    "name": "Emblème Extratrail (cercle, sommets et chemin)",
    "viewBox": "-4 -4 229 224",
    "path": "M110.37 0C49.42 0 0 49.41 0 110.37c0 43.98 25.79 81.84 63.02 99.58 6.58-2.59 13.16-5.23 18.65-8.41-38.72-12.22-66.88-48.46-66.88-91.16 0-52.72 42.87-95.59 95.58-95.59s95.58 42.88 95.58 95.58c0 40.03-24.77 74.34-59.76 88.55.16 5.69-1.28 11.46-3.93 17.09 45.39-13.69 78.47-55.79 78.47-105.64C220.74 49.41 171.32 0 110.37 0 M206.12 134.44l-15.29-32.71-7.63 16.31-14.56-30.09-13.36 27.61-4.48-8.44-15.64 29.55s-3.67 1.02-9.14 3.5c-7.02 3.18-9.12 9.18-9.13 13.3-.01 6.55 6.87 13.34 16.56 21.42 14.54 12.12 15.4 27.05 8.84 41.07a110.5 110.5 0 0 0 75.74-81.51z M91.82 171.18c-1.56-3.14-2.94-6.45-3.28-9.94-1.62-16.44 21.13-22.51 33.65-25.21 2.88-.62 9.13-1.54 12.16-1.97L114.8 90.05l-7.62 17.15-15.07-30.61-12.28 24.95-16.79-36.38-21.63 46.87-8.49-16.41-20.08 38.84H2.7A110.5 110.5 0 0 0 62.93 210c19.96-7.86 40.23-16.07 28.89-38.8"
  },
  "headerLogo": true,
  "theme": {
    "primary": "#BBCE00",
    "onPrimary": "#1A1A1A",
    "ink": "#333234",
    "night": "#323232",
    "nightHover": "#464646",
    "radius": "8px",
    "font": "Helvetica, Roboto, Arial, sans-serif",
    "fontDisplay": "Saira, 'Arial Narrow', sans-serif",
    "googleFonts": "family=Saira:wght@500;700",
    "aidIconColor": "#6C4796"
  }
}
```

**Origine de l'icône** : le logo est publié en **SVG vectoriel** dans la page d'accueil
(`<svg id="theme-logo" viewBox="0 0 702.5 216.01">`), il n'y a donc rien à tracer. L'emblème réunit trois
tracés de ce SVG : le cercle bleu (`#008ECF`), les sommets de droite (`#BCCF00`) et les sommets de gauche
(dernier sous-tracé du mot « TRAIL », recalé en coordonnées absolues). En une seule couleur, le chemin
reste lisible en creux. Logo complet :
`https://www.extratrail.com/fr` (SVG en ligne) ; image de partage
`https://www.extratrail.com/sites/default/files/extratrail-share.png` (ancienne devise) ; écusson communal
`https://www.extratrail.com/sites/default/files/media-svg/logo-stoumont_0.svg` (gris `#CFCFCF`, `#6F6F6E`,
mauve `#A287BD`).

Le thème s'applique au chargement du parcours (variables CSS de `style.css`) ; les autres courses gardent le
leur. Le tableau des côtes et les catégories de pente ne changent pas. L'identité `extratrail` vaut pour tout
le réseau : un autre parcours Extratrail (Spa, Theux…) pourrait garder l'emblème et changer seulement le
tracé, à condition que la couleur de sa commune reste lisible sur la carte.

**Accord** : le logo, l'emblème et l'écusson communal appartiennent à l'ASBL Extratrail (et à la commune de
Stoumont pour l'écusson) ; obtenir leur accord avant toute publication de trace-view avec ces éléments.
