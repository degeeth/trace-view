---
version: alpha
name: La Grande Ourthe · Les Coureurs Célestes
description: >
  Identité visuelle de La Grande Ourthe (≈ 100 km, Lohan, La Roche-en-Ardenne), organisée par
  Les Coureurs Célestes. Emblème : une empreinte de semelle de trail bleu ciel, nom en noir étroit et gras.
  Ton convivial (« on est bien »), sobre, sportif, ardennais.
source: https://www.lescoureurscelestes.be/
colors:
  primary: "#78A8D8"        # Bleu ciel de l'empreinte du logo (couleur signature)
  primary-dark: "#1E5AA8"   # Bleu profond dérivé du logo : tracé, liens, éléments actifs
  on-primary: "#0F1C2B"     # Encre posée sur le bleu ciel
  ink: "#1A1A1A"            # Noir du nom dans le logo
  text: "#333333"           # Titres et texte sur fond clair (site)
  text-muted: "#666666"     # Texte courant du site
  surface: "#FFFFFF"
  surface-soft: "#F2F6FA"   # Fond légèrement bleuté (sections, tableau)
  footer: "#222222"         # Pied de page du site
  web-accent: "#2EA3F2"     # Bleu du site (thème Divi par défaut) : à ne pas reprendre, voir §2
typography:
  display: { family: "Oswald, 'Bebas Neue', 'Arial Narrow', sans-serif", weight: 700, transform: lowercase }
  heading: { family: "Montserrat, sans-serif", weight: 600 }
  body:    { family: "'Open Sans', Arial, sans-serif", weight: 400, size: 15px }
  button:  { family: "Montserrat, sans-serif", weight: 500, transform: uppercase, tracking: 1px }
rounded:
  default: 6px             # le site est doux (boutons arrondis), contrairement au GTLC
  pill: 9999px
branding:                  # proposition pour branding/coureurs-celestes.json (trace-view)
  traceColor: "#1E5AA8"
  accentColor: "#78A8D8"
  aidStationIcon: "empreinte de semelle du logo, vectorisée (comme le cerf du GTLC)"
---

# DESIGN.md : La Grande Ourthe · Les Coureurs Célestes

> Identité de [La Grande Ourthe](https://www.lescoureurscelestes.be/), course de ≈ 100 km au départ de
> Lohan (La Roche-en-Ardenne), organisée par **Les Coureurs Célestes**. Ce document sert à habiller la course
> dans trace-view ; le `DESIGN.md` à la racine du dépôt décrit le style de base neutre de trace-view ; celui du GTLC est dans
> `courses/gtlc-65-2024/DESIGN.md`.
> Valeurs relevées sur le site (feuille de style, rendu de la page, logo).

---

## 1. Esprit

**Mots-clés : convivial, nature, simple, Ardenne, bleu ciel.**

- **L'emblème dit tout** : une semelle de trail dont les crampons forment des taches bleu ciel, avec
  « lescoureurscelestes » en un seul mot, noir, très étroit et gras. L'empreinte évoque la course dans la
  boue et les sentiers ; le bleu ciel, le « céleste » du nom.
- **Ton** : chaleureux et sans prétention. La devise du site est « on est bien », l'édition passée
  « On était bien ».
- **Sobriété** : le site repose sur un thème WordPress (Divi) presque sans personnalisation ; l'identité
  tient au logo et aux photos. Pour trace-view, on garde cette sobriété et on reprend **le bleu du logo**
  plutôt que celui du site.

## 2. Couleurs

| Token | Hex | Rôle |
|---|---|---|
| `primary` : bleu ciel | `#78A8D8` | Couleur signature (empreinte) : accents, filets, onglet actif, fond des pastilles |
| `primary-dark` : bleu profond | `#1E5AA8` | Tracé de la course, liens, boutons actifs ; lisible sur fond blanc (contraste ≈ 6,8:1) |
| `on-primary` : encre | `#0F1C2B` | Texte sur le bleu ciel (contraste ≈ 6,9:1) |
| `ink` : noir | `#1A1A1A` | Titres forts, nom de la course |
| `text` | `#333333` | Texte et titres |
| `text-muted` | `#666666` | Texte secondaire |
| `surface-soft` | `#F2F6FA` | Fond de sections, lignes paires du tableau |
| `footer` | `#222222` | Bandeaux sombres (en-tête de l'application) |

**Le bleu du site (`#2EA3F2`) n'est pas repris** : c'est la couleur par défaut du thème Divi, pas un choix de
l'organisation ; il est plus vif et plus « générique » que le bleu du logo.

**Tracé sur la carte** : `#1E5AA8`, avec le contour sombre de trace-view. Il reste distinct des rivières
(bleu clair `#7AB5D3` du style Sentiers) par sa luminosité nettement plus foncée. Les catégories de pente
(vert, orange, rouge) et les couleurs du mode Pente ne changent pas : elles portent une information.

## 3. Typographie

| Usage | Police | Remarque |
|---|---|---|
| Nom de la course, grands titres | **Oswald** 700 (repli Bebas Neue, Arial Narrow) | rappelle le nom du logo, étroit et gras ; minuscules possibles comme le logo |
| Titres de section, boutons | **Montserrat** 500 à 600 | police des titres et boutons du site ; boutons en capitales |
| Texte courant, tableau | **Open Sans** 400 | police du texte du site |

Le nom du logo est une image : la police exacte n'est pas publiée. Oswald (Google Fonts) en est la plus proche
parmi les polices libres. À remplacer si l'organisation fournit sa police.

## 4. Formes et composants

- **Arrondis doux** (6 px) sur boutons, cartes, panneaux : le site utilise des boutons arrondis ; c'est la
  principale différence avec le GTLC (angles droits).
- **Boutons** : fond bleu ciel, texte encre, capitales Montserrat ; actif ou survol : bleu profond, texte blanc.
- **Onglets du profil** : onglet actif en bleu ciel ; les autres en contour bleu ciel.
- **En-tête** : bandeau `#222222` (comme le pied de page du site), nom de la course en Oswald blanc,
  filet bleu ciel de 4 px dessous.
- **Pastille des ravitaillements** : cercle blanc, **empreinte de semelle** en bleu profond (vectorisation du
  logo, comme le cerf du GTLC). À défaut, icône par défaut couteau / fourchette.
- **Photos** : la course se vit en forêt ardennaise ; si des images sont utilisées, les voiler légèrement
  (≈ 30 % de noir) sous du texte blanc, comme les bandeaux du site.

## 5. À faire / À éviter

### À faire
- Utiliser le **bleu ciel** comme accent, avec parcimonie, et le **bleu profond** pour ce qui doit se lire.
- Garder le ton simple et chaleureux dans les textes (« On est bien »).
- Reprendre l'**empreinte** comme motif : icône des ravitaillements, éventuellement en filigrane très léger.

### À éviter
- Le bleu `#2EA3F2` du thème Divi.
- Du texte bleu ciel sur fond blanc (contraste ≈ 2,5:1, illisible) : bleu ciel = fonds et filets uniquement.
- Le cerf, le bleu glacier et les angles droits du GTLC : ce n'est pas la même organisation.
- Le tiret cadratin dans les textes (règle du projet, `CLAUDE.md`).

## 6. Application dans trace-view

Fait : identité `branding/coureurs-celestes.json`, assignée à La Grande Ourthe (`courses/lgo100km/course.json`).

| Élément | Valeur |
|---|---|
| Tracé, curseur, sélection du profil | `traceColor` / `accentColor` `#1E5AA8` |
| Icône des ravitaillements | empreinte de semelle vectorisée depuis le logo, en `#1E5AA8` (`aidIconColor`) |
| En-tête | empreinte en bleu ciel à côté du nom (`headerLogo`), à la place de la montagne |
| Thème de l'interface (`theme`) | accent `#78A8D8`, encre `#0F1C2B`, en-tête `#222222`, arrondis 6 px, Oswald (nom) et Open Sans (texte) |

Le thème est appliqué au chargement de la course (variables CSS de `style.css`) ; les autres courses gardent
le leur. Le tableau des côtes et les catégories de pente ne changent pas.

**Accord** : le logo appartient aux Coureurs Célestes ; obtenir leur accord avant une publication.
