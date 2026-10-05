---
version: alpha
name: Ohm Trail · Aywaille
description: >
  Identité visuelle de l'Ohm Trail (Aywaille, Ardenne liégeoise), course historique depuis 2004.
  Emblème : un oméga orange (Ω, clin d'œil à « Ohm ») traversé par « OHM-TRAIL » en capitales grasses,
  souligné d'un filet aux couleurs du drapeau belge. Ton : exigeant, fier, un brin d'humour.
source: https://www.ohmtrail.be/oto/
colors:
  primary: "#E84E0F"        # Orange de l'oméga (logo) : couleur signature
  web-accent: "#FA471C"     # Orange du site, un peu plus vif : non repris (voir §2)
  on-primary: "#FFFFFF"     # Texte blanc sur orange, comme les boutons du site
  ink: "#313131"            # Gris anthracite des bandeaux du site
  night: "#313131"
  charcoal: "#32373C"       # Gris bleuté des boutons du site : tracé de la course
  surface-soft: "#F2F1F1"   # Fond clair des sections du site
  flag-black: "#2B2B2A"     # Filet tricolore du logo (décor uniquement)
  flag-yellow: "#FBE61E"
  flag-red: "#EA1B23"
typography:
  display: { family: "Montserrat, sans-serif", weight: 700 }
  body:    { family: "'Open Sans', Arial, sans-serif", weight: 400 }
rounded:
  default: 4px
branding:                  # branding/ohm-trail.json
  traceColor: "#32373C"
  accentColor: "#E84E0F"
  aidStationIcon: "oméga du logo, vectorisé"
---

# DESIGN.md : Ohm Trail · Aywaille

> Identité de l'[Ohm Trail](https://www.ohmtrail.be/), au départ du Hall Omnisport d'Aywaille.
> Ce document habille l'édition 2018 de l'**Ohm Trail Original** (OTO, ≈ 35 km, 1 950 m D+ annoncés) dans
> trace-view. Valeurs relevées sur le site (feuille de style, logo) et sur la carte Google My Maps de l'organisation.

---

## 1. Esprit

**Mots-clés : orange, oméga, costaud, Ardenne, belge.**

- **L'emblème** : un grand Ω orange (l'unité de résistance, jeu de mots sur « Ohm ») traversé par
  « OHM-TRAIL » en capitales grasses, posé sur un filet noir, jaune, rouge.
- **Ton** : « Le seul et unique, depuis 2004 ». Le site décrit une course « tracée pour les costauds »,
  avec « une courbe de niveau enviée par tous les cardiologues » : du défi, avec humour.
- **Sobriété** : site WordPress clair, bandeaux anthracite, l'orange réservé aux accents.

## 2. Couleurs

| Token | Hex | Rôle |
|---|---|---|
| `primary` : orange oméga | `#E84E0F` | Accents, onglet actif, icône des ravitaillements, logo de l'en-tête |
| `on-primary` | `#FFFFFF` | Texte sur l'orange (≈ 3,6:1 : réservé au texte gras, comme les boutons du site) |
| `ink` / `night` : anthracite | `#313131` | En-tête, texte fort |
| `charcoal` | `#32373C` | **Tracé de la course** |
| `surface-soft` | `#F2F1F1` | Fonds clairs |

**L'orange du site (`#FA471C`) n'est pas repris** : on garde celui du logo, plus profond.

**Tracé anthracite, pas orange** : sur la carte et le profil, l'orange désigne déjà les côtes de 7 à 10 %.
Un tracé orange brouillerait cette information ; l'orange reste à l'interface et aux ravitaillements.

**Drapeau belge** : décor du logo, jamais comme couleurs d'interface (le rouge et le vert des pentes portent une
information).

## 3. Typographie

| Usage | Police |
|---|---|
| Nom de la course, titres | **Montserrat** 600 à 700 (police des titres du site) |
| Texte courant, tableau | **Open Sans** 400 (police du texte du site) |

La police du logo (capitales étroites et grasses) est une image ; Montserrat reste la police publiée par le site.

## 4. Formes et composants

- **Arrondis légers** (4 px).
- **En-tête** : bandeau anthracite, oméga orange à côté du nom (`headerLogo`).
- **Pastille des ravitaillements** : cercle blanc, oméga orange.

## 5. À faire / À éviter

### À faire
- L'orange en accent, l'anthracite pour ce qui se lit.
- Garder l'oméga entier et ses proportions (pieds larges, anneau ouvert en bas).

### À éviter
- Un tracé orange (confusion avec la catégorie de pente orange).
- Les couleurs du drapeau en dehors du logo.
- Le tiret cadratin dans les textes (règle du projet, `CLAUDE.md`).

## 6. Application dans trace-view

Fait : identité `branding/ohm-trail.json`, assignée à `courses/ohm-trail-2018/course.json`.

| Élément | Valeur |
|---|---|
| Tracé | `traceColor` `#32373C` |
| Curseur, sélection | `accentColor` `#E84E0F` |
| Ravitaillements | oméga vectorisé, `aidIconColor` `#E84E0F` |
| Thème | accent `#E84E0F` (texte blanc), en-tête `#313131`, arrondis 4 px, Montserrat et Open Sans |

**Ravitaillements** : d'après la carte de l'organisation (Ravito 1 Vivaro, Ravito 2 Ninglinspo, Ravito 4
Secheval), placés par coordonnées sur la trace 2018. À Ninglinspo, l'OTO fait un aller-retour jusqu'au ravitaillement.
Les positions sont celles de l'édition actuelle : la trace de 2018 peut différer légèrement.

**Accord** : le logo appartient à l'Ohm Trail ASBL ; obtenir son accord avant une publication.
