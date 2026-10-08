---
version: alpha
name: Grand Trail des Lacs & Châteaux — Édition Winter
description: >
  Système visuel de l'édition hivernale du Grand Trail des Lacs & Châteaux (grandtrail.be).
  Photo plein cadre assombrie, typographie Montserrat en capitales très espacées,
  accent « bleu glacier », angles droits et sections en diagonale.
source: https://grandtrail.be/winter/edition-winter-le-grand-trail-des-lacs-chateaux/
colors:
  primary: "#DCECF0"        # Bleu glacier — accent signature de l'édition Winter
  on-primary: "#04080B"     # Encre presque noire posée sur le bleu glacier
  ink: "#04080B"            # Noir profond (barre copyright, bouton newsletter)
  night: "#141E28"          # Bleu nuit — fond du footer
  text: "#202020"           # Texte courant et titres sur fond clair
  text-muted: "#585858"     # Liens / puces dans le contenu Winter, hover footer
  surface: "#FFFFFF"
  surface-alt: "#D4D4D4"    # Bandes grises (intro, sponsors)
  surface-soft: "#F4F4F4"
  disabled: "#CCCCCC"
  overlay: "rgba(0,0,0,0.5)"       # Voile sur photos / vidéo hero
  overlay-light: "rgba(0,0,0,0.2)" # Voile sur cartes de course
  glass: "rgba(255,255,255,0.5)"   # Nav sticky + backdrop-filter blur(15px)
  # Couleurs sœurs (autres éditions du même système, à ne pas mélanger)
  edition-summer: "#C9D89A" # Vert tilleul — édition principale
  edition-backyard: "#DDCAAD" # Sable — Backyard
  danger: "#AE0000"
typography:
  font-family: "Montserrat, Helvetica, Arial, sans-serif"
  root-size: 18px          # html { font-size: 1.125em } → 1rem = 18px
  line-height: 1.5556      # 28px
  display:   { size: 60px, weight: 600, transform: none }               # chiffres clés
  hero-date: { size: 32px, weight: 700, tracking: 1.09px, transform: uppercase, color: primary }
  h1:        { size: 36px, weight: 700, tracking: 1.5px, transform: uppercase }
  h2:        { size: 28px, weight: 700 }
  section-title: { size: 28px, weight: 300, transform: uppercase, color: text }
  h3:        { size: 24px, weight: 700 }
  h4:        { size: 20px, weight: 600 }
  body:      { size: 18px, weight: 400 }
  body-sm:   { size: 16px, weight: 400 }
  label:     { size: 14px, weight: 700, transform: uppercase }           # nav
  caption:   { size: 12px, weight: 700, tracking: 1px, transform: uppercase }
  button-lg: { size: 18px, weight: 600, tracking: 6px, transform: uppercase }
  button-md: { size: 16px, weight: 600, tracking: 5px, transform: uppercase }
  button-sm: { size: 14px, weight: 600, tracking: 1px, transform: uppercase }
spacing:
  unit: 10px
  scale: [4px, 10px, 20px, 30px, 40px, 50px, 100px, 150px]
  container-max: 1096px
  gutter: 20px
rounded:
  none: 0px        # défaut : boutons, cartes, inputs
  sm: 4px
  lg: 10px         # losange flottant latéral
  full: 50%        # pastilles, bouton play
elevation:
  card: "0 1px 11px 0 rgba(172,172,172,0.5)"
  float: "0 10px 50px 0 rgba(0,0,0,0.1)"
motion:
  duration: 300ms
  easing: ease-in-out
  image-zoom: "scale(1.1) 350ms ease-in-out"
breakpoints:
  mobile: 475px    # 29.6775em
  tablet: 768px    # 47.99em
  desktop: 1024px  # 63.99em
components:
  button-primary:
    background: surface
    color: on-primary
    padding: 18px 60px
    rounded: none
    hover: { background: primary, color: surface }
  button-winter:
    background: primary
    color: on-primary
    hover: { background: surface, border: "2px solid primary" }
  race-card:
    height: 280px
    overlay: overlay-light
    hover-overlay: overlay
  heading-underline:
    dot: "9px circle, primary"
    bar: "3px × 96%, primary"
---

# DESIGN.md — Grand Trail des Lacs & Châteaux · Édition Winter

> Document de référence pour reproduire l'identité visuelle de
> [l'édition Winter](https://grandtrail.be/winter/edition-winter-le-grand-trail-des-lacs-chateaux/).
> Le front-matter YAML contient les tokens normatifs ; la prose ci-dessous explique
> **comment** et **pourquoi** les appliquer. Valeurs extraites de la feuille de style
> du site (`themes/sage/dist/styles/main.css`).

---

## 1. Thème visuel & atmosphère

**Mots-clés : hivernal, minéral, épique, aéré, sportif-premium.**

L'édition Winter est la déclinaison « froide » d'une identité de trail nature. Tout
repose sur un contraste net entre **la photographie** (forêts, lacs, châteaux sous la
brume, coureurs frontales allumées) et **une interface quasi monochrome** où une seule
couleur — le **bleu glacier `#DCECF0`** — signale ce qui est propre à l'hiver.

- **Image d'abord.** Le hero occupe 80–90 vh, photo ou vidéo en `cover`, toujours
  voilée de noir à 50 %. Le texte est blanc, centré, en capitales.
- **Rigueur géométrique.** Pas d'arrondis sur les boutons ni les cartes : des aplats
  nets, comme un dossard ou une signalétique de balisage.
- **Le relief comme motif.** Des tracés de crêtes de montagne en trait fin (SVG,
  `stroke: #DCECF0`, 2px) encadrent les titres de section ; des blocs entiers sont
  inclinés à **5°** (`skewY`) pour évoquer la pente.
- **Calme typographique.** Une seule famille (Montserrat). L'énergie vient de
  l'interlettrage très large des CTA (jusqu'à 6px), pas de la multiplication des
  styles.

## 2. Palette & rôles des couleurs

### Couleurs de l'édition

| Token | Hex | Rôle |
|---|---|---|
| `primary` — Bleu glacier | `#DCECF0` | Accent Winter : date du hero, filets sous les titres, puces, bordure haute du footer (8px), fonds de CTA, bandeau « Sold out », icônes sociales |
| `on-primary` — Encre | `#04080B` | Texte posé sur le bleu glacier (seul couple lisible) |

### Neutres

| Token | Hex | Rôle |
|---|---|---|
| `ink` | `#04080B` | Barre de copyright, bouton d'envoi newsletter |
| `night` | `#141E28` | Fond du footer |
| `text` | `#202020` | Titres et paragraphes sur fond clair |
| `text-muted` | `#585858` | Liens et puces dans les contenus Winter, hover dans le footer |
| `surface` | `#FFFFFF` | Fond de page, fond des boutons primaires |
| `surface-alt` | `#D4D4D4` | Bandes diagonales (intro, sponsors) |
| `disabled` | `#CCCCCC` | Course complète / bouton inactif |

### Voiles & verre

| Token | Valeur | Usage |
|---|---|---|
| `overlay` | `rgba(0,0,0,.5)` | Hero, bannières de page, hover des cartes |
| `overlay-light` | `rgba(0,0,0,.2)` | Cartes de course au repos |
| `glass` | `rgba(255,255,255,.5)` + `blur(15px)` | Barre de navigation devenue sticky |
| Sous-menu | `rgba(0,0,0,.7)` | Dropdown de navigation |

### Système multi-éditions

Le site partage un seul système de composants entre trois éditions ; seule la couleur
d'accent change via un modificateur `.is-winter` / `.is-backyard` :

| Édition | Accent |
|---|---|
| Principale (été) | `#C9D89A` vert tilleul |
| **Winter** | **`#DCECF0` bleu glacier** |
| Backyard | `#DDCAAD` sable |

> Règle : sur une page Winter, **aucun** vert tilleul ni sable. Toute occurrence de
> l'accent passe par le token `primary`.

## 3. Typographie

**Famille unique : Montserrat** (Google Fonts, variable 100–900), repli
`Helvetica, Arial, sans-serif`. Lissage `antialiased`.

Base : `html { font-size: 1.125em }` → **1rem = 18px**, interligne **1.5556** (28px).

| Rôle | Taille | Graisse | Interlettrage | Casse | Notes |
|---|---|---|---|---|---|
| Chiffre clé | 60px (40px mobile) | 600 | — | — | Blanc, sur photo en parallaxe |
| Date hero | 32px (22px mobile) | 700 | 1.09px | MAJ | Couleur `primary` |
| H1 / titre hero | 36px | 700 | 1.5px | MAJ | Blanc sur photo |
| Sous-titre hero | 22px (16px mobile) | 400 | 0.85px | MAJ | Blanc |
| Titre de section | 28px | **300** | — | MAJ | `#202020`, centré, encadré de crêtes SVG |
| H2 | 28px | 700 | — | — | Souligné point + barre |
| H3 | 24px | 700 | — | — | |
| H4 / titre footer | 20px / 19px | 600 | — | — | |
| Corps | 18px | 400 | — | — | |
| Corps secondaire | 16px | 400 | — | — | Liens footer |
| Navigation | 14px | 700 | — | MAJ | Blanc → accent au survol |
| Libellé de chiffre | 20px (16px mobile) | 400 | 3px | MAJ | Max 200px de large |
| Caption / badge | 12px | 700 | 1px | MAJ | |

**Principes**

1. Les **titres de section** utilisent le contraste de graisse : **300 en capitales** —
   léger, monumental. Les sous-titres et noms de course repassent en 700.
2. **Capitales + tracking large** = action. Plus le bouton est grand, plus
   l'interlettrage est large (6px → 5px → 1px).
3. Pas d'italique, pas de seconde famille, pas de serif.

## 4. Composants

### Boutons — `.c-btn`

Base commune : `inline-flex`, capitales, `border-radius: 0`, transition
`all 300ms ease-in-out`. Le survol **inverse** fond et texte (plein ↔ contour).

| Variante | Repos | Survol | Padding |
|---|---|---|---|
| **Winter (CTA principal)** | fond `#DCECF0`, texte `#04080B` | fond blanc, bordure 2px `#DCECF0` | — |
| Primaire / large | fond blanc, texte accent, 600, 18px, tracking 6px | fond accent, texte blanc | `18px 60px` |
| Medium | 16px, tracking 5px | — | `15px 25px` |
| Small | 14px, tracking 1px | — | `10px 20px` |
| Désactivé | fond `#CCCCCC`, texte blanc, `not-allowed` | inchangé | — |

### Carte de course — `.home__race__item`

- Grille **3 colonnes** (gap 40px vertical / 30px horizontal) → 2 colonnes ≤ 1024px →
  1 colonne ≤ 768px.
- Visuel : photo `cover`, **hauteur 280px** (240px mobile), voile noir 20 %.
  Le logo de la course (blanc, ~200px) est centré par-dessus.
- Infos sur l'image : distance / D+ en blanc 20px **bold**, unité en 14px regular.
- **Bandeau jour** blanc collé en bas, 14px bold, padding 10px.
- **Bouton** blanc qui **déborde** de 10px sous la carte (`bottom: -10px`, insets 5 %),
  texte en accent, tracking 2–4px.
- Survol : voile → 50 %, image `scale(1.1)` en 350ms.
- **Sold out** : bandeau pleine largeur incliné `skewY(-5deg)`, fond accent, 20px 700.

### Titre souligné « point + filet »

Signature graphique pour les H2 de contenu et les titres de colonnes du footer :

```css
h2 { position: relative; display: inline-block; }
h2::before { /* pastille */
  content: ""; position: absolute; left: 0; bottom: -14px;
  width: 9px; height: 9px; border-radius: 50%; background: var(--primary);
}
h2::after { /* filet */
  content: ""; position: absolute; right: 0; display: block;
  width: 96%; height: 3px; margin-top: 8px; background: var(--primary);
}
```

### Titre de section « entre deux crêtes »

Titre 28px / 300 / capitales, flanqué à gauche (`::before`) et à droite (`::after`)
d'une **ligne de crête montagneuse** en SVG, trait 2px `#DCECF0`, sans remplissage.
Masqué sur mobile.

### Hero — `.c-header`

- Hauteur 850px (min 850px) → 90 vh → 80 vh selon l'écran.
- Média `object-fit: cover` + voile `rgba(0,0,0,.5)`.
- Bloc centré verticalement, capitales : titre blanc → sous-titre → **date en bleu
  glacier** → bouton vidéo (pastille blanche ronde, icône play accent ; survol : fond
  accent, icône blanche).
- **Badge d'édition** sous le logo : étiquette inclinée `skewX(10deg)` fond accent,
  texte 12px 700 capitales noir (contre-incliné à `-10deg`), filet de 1px au-dessus.

### Navigation

- Transparente sur le hero ; liens 14px **bold** capitales blancs, survol accent.
- Sous-menu : panneau `rgba(0,0,0,.7)`, 200px, liens padding 10px.
- **Sticky** : fond `rgba(255,255,255,.5)` + `backdrop-filter: blur(15px)`, liens
  passent en noir, logo réduit à 100px.
- Mobile : tiroir latéral 300px glissant depuis la droite (`translateX`, 0.3s).

### Bloc chiffres clés — `.home__numbers`

Photo en `background-attachment: fixed` (parallaxe), padding `150px 0 240px`.
Contenu incliné `skewY(-5deg)`. Chiffre 60px/600 blanc + libellé 20px capitales
tracking 3px. Rangée flex `space-between` → colonne sur mobile.

### Footer

- Fond `#141E28`, **bordure haute 8px `#DCECF0`**, padding haut 50px.
- Colonnes à titre souligné (point + filet), listes à puces `•` accent ; survol : puce
  blanche, lien `#585858`.
- Newsletter : input blanc à angles droits, bouton carré 45px `#04080B` accolé à droite.
- Icônes sociales 35px remplies en accent, survol `#585858`.
- Barre copyright `#04080B`, 14px blanc 90 %.

## 5. Mise en page

- **Conteneur** : `max-width: 1096px`, gouttières 20px, centré.
- **Échelle d'espacement** (base 10px) : 4 · 10 · 20 · 30 · 40 · 50 · 100 · 150.
  Les sections respirent beaucoup : 100–150px entre blocs majeurs.
- **Diagonales** : les bandes de fond (`#D4D4D4`) sont inclinées `skewY(5deg)` et leur
  contenu contre-incliné `skewY(-5deg)` ; elles se chevauchent avec des marges
  négatives (`-150px`) pour créer des transitions en biais entre sections.
- **Composition intro** : image 50 % à gauche, texte (max 510px) décalé à droite ;
  centré pleine largeur sur mobile.
- **Rythme de page** : Hero → intro diagonale → courses (grille) → chiffres
  (parallaxe) → participants → actualités → sponsors (bande grise) → footer nuit.

## 6. Profondeur & élévation

L'interface est **essentiellement plate** ; la profondeur vient des photos et des voiles.

| Niveau | Traitement | Usage |
|---|---|---|
| 0 — Plat | aucune ombre | Boutons, cartes de course, sections |
| 1 — Carte | `0 1px 11px 0 rgba(172,172,172,.5)` | Cartes d'actualité, encarts |
| 2 — Flottant | `0 10px 50px 0 rgba(0,0,0,.1)` | Popups, panneaux |
| Voile | `rgba(0,0,0,.2 → .5)` | Photos (repos → survol) |
| Verre | blanc 50 % + flou 15px | Navigation sticky |
| Modale | `rgba(0,0,0,.9)` | Lecteur vidéo plein écran |

## 7. Mouvement

- Durée standard **300ms `ease-in-out`** sur toutes les transitions (couleur, fond,
  bordure).
- Zoom image au survol : `scale(1.1)` en 350ms, conteneur en `overflow: hidden`.
- Parallaxe : couches SVG de montagnes (`parallax__layer--back` / `--front`) et fonds
  en `background-attachment: fixed`.
- Pas de rebond, pas d'animation décorative en boucle.

## 8. À faire / À éviter

### ✅ À faire

- Utiliser le **bleu glacier uniquement comme accent** : date, filets, puces, CTA,
  bordures. Il reste rare pour rester signifiant.
- Poser du texte `#04080B` sur le bleu glacier.
- Garder **les angles droits** sur boutons, cartes, inputs.
- Toujours voiler les photos (≥ 20 %) avant d'y poser du texte blanc.
- Mettre les CTA en **capitales avec interlettrage large**.
- Utiliser le motif **crête de montagne** et la **diagonale 5°** pour rythmer.

### ❌ À éviter

- **Texte bleu glacier sur fond blanc** : contraste ≈ 1.2:1, illisible. (Le site le
  fait sur certains boutons blancs — ne pas reproduire ; préférer `#04080B` sur
  `#DCECF0`, ou `#585858` sur blanc.)
- Mélanger les accents des autres éditions (vert `#C9D89A`, sable `#DDCAAD`).
- Ajouter une seconde police ou de l'italique.
- Les grands rayons d'arrondi, dégradés colorés ou ombres portées marquées.
- Les titres de section en gras : ils sont en **300**.

## 9. Responsive

| Point de rupture | Largeur | Changements principaux |
|---|---|---|
| Desktop | > 1024px | Grille 3 colonnes, nav horizontale, intro en deux colonnes |
| Tablette | ≤ 1024px (`63.99em`) | Grille 2 colonnes, hero 90 vh, intro décalée moins loin |
| Mobile | ≤ 768px (`47.99em`) | 1 colonne, nav en tiroir, chiffres empilés, crêtes masquées, hero 80 vh |
| Petit mobile | ≤ 475px (`29.6775em`) | Boutons 14–16px, tracking réduit (6px → 4px), logo 75px |

- Cibles tactiles : boutons ≥ 45px de haut.
- Les textes du hero réduisent d'environ 25 % à chaque palier.

## 10. Guide de prompt pour agent

**Référence rapide**

```
Accent : #DCECF0 (bleu glacier)   Texte sur accent : #04080B
Texte : #202020   Atténué : #585858   Footer : #141E28   Bande : #D4D4D4
Police : Montserrat, base 18px / 1.556
CTA : capitales, 600, tracking 5–6px, angles droits, survol plein ↔ contour
Photos : cover + voile noir 50 %
Transitions : 300ms ease-in-out
```

**Exemples de prompts**

- « Crée un hero plein écran avec une photo de forêt enneigée voilée à 50 % de noir,
  titre blanc 36px bold en capitales, date en `#DCECF0` 32px bold, bouton rectangulaire
  fond `#DCECF0` texte `#04080B` en capitales tracking 6px. »
- « Crée une grille de 3 cartes de course : image 280px de haut voilée à 20 %, logo
  blanc centré, distance en blanc bold, bandeau blanc « Samedi » en bas, bouton blanc
  débordant de 10px sous la carte ; au survol, voile 50 % et zoom 1.1. »
- « Crée un footer fond `#141E28` avec bordure haute 8px `#DCECF0`, colonnes dont le
  titre est souligné d'une pastille 9px et d'un filet 3px bleu glacier. »

**Variables CSS prêtes à l'emploi**

```css
:root {
  --gt-primary: #dcecf0;
  --gt-on-primary: #04080b;
  --gt-ink: #04080b;
  --gt-night: #141e28;
  --gt-text: #202020;
  --gt-text-muted: #585858;
  --gt-surface: #ffffff;
  --gt-surface-alt: #d4d4d4;
  --gt-disabled: #cccccc;
  --gt-overlay: rgba(0, 0, 0, 0.5);
  --gt-font: "Montserrat", Helvetica, Arial, sans-serif;
  --gt-ease: 300ms ease-in-out;
  --gt-container: 1096px;
  --gt-skew: 5deg;
}
```
