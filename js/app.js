// ── Point d'entrée : page d'accueil (tuiles des parcours) ou page d'une course (?course=<id>) ──
// La version (?v=…) de ce fichier est reprise pour le module chargé, afin de ne pas servir une ancienne copie.
const version = new URL(import.meta.url).search;
if (new URLSearchParams(location.search).get('course')) await import(`./course.js${version}`);
else await import(`./dashboard.js${version}`);
