# trace-view : consignes pour Claude

Voir `README.md` (fonctionnement, ajout d'une course) et `DESIGN.md` (style de base neutre de trace-view ; le style de chaque organisation est dans le
`DESIGN.md` du dossier de sa course et dans son thème `branding/<nom>.json`).

## Règles

- **Jamais de tiret cadratin « — » (U+2014) dans l'application** : textes de l'interface, données
  (`courses/*/course.json`, `data/*.json`), styles, commentaires du code livré, noms et notes de ravitaillements.
  Il trahit un texte écrit par une IA. Utiliser à la place une virgule, deux-points, des parenthèses ou « · ».
  Le test de fumée et `scripts/build_course.py` le vérifient.
- Ne pas commiter sans demande explicite.
- Après une modification de l'application : `npm run test:build` et `npm run test:smoke`.
