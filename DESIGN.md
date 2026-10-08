---
version: 1
name: trace-view · style de base
description: >
  Style propre à trace-view, neutre, pour la page d'accueil et les parcours sans identité d'organisation (HRP).
  Chaque organisation remplace ces jetons par les siens (branding/<nom>.json → theme), décrits dans le
  DESIGN.md du dossier de sa course.
colors:
  primary: "#10B981"        # Vert émeraude : accent (onglet actif, filets, boutons au survol), logo
  on-primary: "#022C22"     # Encre vert très sombre posée sur l'émeraude
  ink: "#0F172A"            # Texte fort
  night: "#1E293B"          # Ardoise : en-tête
  night-hover: "#334155"
  text: "#1F2937"
  text-muted: "#64748B"
  surface: "#FFFFFF"
  surface-soft: "#F1F5F9"
  surface-alt: "#CBD5E1"
  border: "#E2E8F0"
  trace: "#E8002D"          # Tracé par défaut (identité « defaut »)
typography:
  font: "system-ui, -apple-system, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif"
  caps: none                # titres et libellés en casse normale
  tracking: 0.2             # interlettrage léger
rounded:
  default: 6px
---

# DESIGN.md : trace-view, style de base

Style de l'application elle-même, volontairement neutre : il ne doit rappeler aucune organisation. Il habille la
**page d'accueil** (tuiles des parcours) et les **parcours sans identité propre** (ex. HRP). Les organisations ont
le leur, appliqué à leurs parcours :

| Identité | Fichier | DESIGN.md |
|---|---|---|
| Grand Trail des Lacs & Châteaux | `branding/gtlc.json` | `courses/gtlc-65-2024/DESIGN.md` (d'après grandtrail.be, édition Winter) |
| Les Coureurs Célestes | `branding/coureurs-celestes.json` | `courses/lgo100km/DESIGN.md` |
| Cercle Sportif Olnois | `branding/oso.json` | `courses/oso-2023/DESIGN.md` |
| Extratrail | `branding/extratrail.json` | `courses/extratrail-stoumont-30/DESIGN.md` |
| Ohm Trail | `branding/ohm-trail.json` | `courses/ohm-trail-2018/DESIGN.md` |

## Principes

- **Neutre** : ardoise et vert émeraude, sans logo ni décor d'organisation ; la carte et les côtes portent les couleurs.
- **Logo** : badge carré arrondi vert émeraude, profil de dénivelé blanc à deux sommets et repère sur le plus haut
  (`appLogo()` dans `js/icons.js`, aussi icône d'onglet). Il signe la page d'accueil, les parcours sans identité et
  leurs tuiles ; les organisations gardent le leur (`headerLogo`).
- **Police du système** (San Francisco, Segoe UI, Roboto selon l'appareil) : rien à télécharger, lisible partout.
- **Casse normale** pour les titres et libellés, interlettrage léger ; arrondis de 6 px.
- **Pas de décor sous les titres** : le point + filet sous « Profil de course » est la signature du GTLC, réservé
  à son thème (`titleRule`).

## Jetons et thèmes

Les jetons sont des variables CSS (`--gt-…` dans `style.css`). Un thème d'identité peut remplacer :

| Clé du thème | Variable | Rôle |
|---|---|---|
| `primary`, `onPrimary` | `--gt-primary`, `--gt-on-primary` | accent et texte posé dessus |
| `ink`, `night`, `nightHover` | `--gt-ink`, `--gt-night`, `--gt-night-hover` | texte fort, en-tête |
| `text`, `textMuted`, `surfaceSoft`, `surfaceAlt`, `border` | idem | textes et fonds |
| `font`, `fontDisplay`, `googleFonts` | `--gt-font`, `--gt-font-display` | polices (servies par l'application, `scripts/fetch_fonts.py`) |
| `radius` | `--gt-radius` | arrondis |
| `caps` | `--gt-caps` | `uppercase` : titres, libellés et boutons en capitales |
| `tracking` | `--gt-tracking` | interlettrage (1 : 1,5 px sur un titre, celui du GTLC) |
| `titleRule` | classe `title-rule` | point + filet sous les titres (GTLC) |
| `aidIconColor` | | couleur de l'icône des ravitaillements |

## À éviter

- Reprendre dans ce style de base un élément propre à une organisation (couleur, police, décor).
- Le tiret cadratin dans les textes (règle du projet, `CLAUDE.md`).
