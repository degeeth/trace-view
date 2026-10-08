// Icônes Lucide (https://lucide.dev), licence ISC, © Lucide Icons and Contributors.
// Seules les icônes utilisées sont embarquées (lucide-static 1.51.0) : pas de police ni de script à charger.
const ICONS = {
  'utensils': '<path d="M3 2v7c0 1.1.9 2 2 2h4a2 2 0 0 0 2-2V2" /> <path d="M7 2v20" /> <path d="M21 15V2a5 5 0 0 0-5 5v6c0 1.1.9 2 2 2h3Zm0 0v7" />',
  'glass-water': '<path d="M5.116 4.104A1 1 0 0 1 6.11 3h11.78a1 1 0 0 1 .994 1.105L17.19 20.21A2 2 0 0 1 15.2 22H8.8a2 2 0 0 1-2-1.79z" /> <path d="M6 12a5 5 0 0 1 6 0 5 5 0 0 0 6 0" />',
  'sandwich': '<path d="m2.37 11.223 8.372-6.777a2 2 0 0 1 2.516 0l8.371 6.777" /> <path d="M21 15a1 1 0 0 1 1 1v2a1 1 0 0 1-1 1h-5.25" /> <path d="M3 15a1 1 0 0 0-1 1v2a1 1 0 0 0 1 1h9" /> <path d="m6.67 15 6.13 4.6a2 2 0 0 0 2.8-.4l3.15-4.2" /> <rect width="20" height="4" x="2" y="11" rx="1" />',
  'soup': '<path d="M12 21a9 9 0 0 0 9-9H3a9 9 0 0 0 9 9Z" /> <path d="M7 21h10" /> <path d="M19.5 12 22 6" /> <path d="M16.25 3c.27.1.8.53.75 1.36-.06.83-.93 1.2-1 2.02-.05.78.34 1.24.73 1.62" /> <path d="M11.25 3c.27.1.8.53.74 1.36-.05.83-.93 1.2-.98 2.02-.06.78.33 1.24.72 1.62" /> <path d="M6.25 3c.27.1.8.53.75 1.36-.06.83-.93 1.2-1 2.02-.05.78.34 1.24.74 1.62" />',
  'mountain-snow': '<path d="m8 3 4 8 5-5 5 15H2L8 3z" /> <path d="M4.14 15.08c2.62-1.57 5.24-1.43 7.86.42 2.74 1.94 5.49 2 8.23.19" />',
  'route': '<circle cx="6" cy="19" r="3" /> <path d="M9 19h8.5a3.5 3.5 0 0 0 0-7h-11a3.5 3.5 0 0 1 0-7H15" /> <circle cx="18" cy="5" r="3" />',
  'table-2': '<path d="M3 9h18" /> <path d="M9 3v18" /> <rect x="3" y="3" width="18" height="18" rx="2" />',
  'map': '<path d="M14.106 5.553a2 2 0 0 0 1.788 0l3.659-1.83A1 1 0 0 1 21 4.619v12.764a1 1 0 0 1-.553.894l-4.553 2.277a2 2 0 0 1-1.788 0l-4.212-2.106a2 2 0 0 0-1.788 0l-3.659 1.83A1 1 0 0 1 3 19.381V6.618a1 1 0 0 1 .553-.894l4.553-2.277a2 2 0 0 1 1.788 0z" /> <path d="M15 5.764v15" /> <path d="M9 3.236v15" />',
  'panel-left-open': '<rect width="18" height="18" x="3" y="3" rx="2" /> <path d="M9 3v18" /> <path d="m14 9 3 3-3 3" />',
  'chevron-down': '<path d="m6 9 6 6 6-6" />',
  'download': '<path d="M12 15V3" /> <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /> <path d="m7 10 5 5 5-5" />',
  'link': '<path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" /> <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />',
  'check': '<path d="M20 6 9 17l-5-5" />',
  'arrow-left': '<path d="m12 19-7-7 7-7" /> <path d="M19 12H5" />',
  'timer': '<line x1="10" x2="14" y1="2" y2="2" /> <line x1="12" x2="15" y1="14" y2="11" /> <circle cx="12" cy="14" r="8" />',
  'x': '<path d="M18 6 6 18" /> <path d="m6 6 12 12" />',
  'maximize-2': '<path d="M15 3h6v6" /> <path d="m21 3-7 7" /> <path d="m3 21 7-7" /> <path d="M9 21H3v-6" />',
  'zoom-in': '<circle cx="11" cy="11" r="8" /> <line x1="21" x2="16.65" y1="21" y2="16.65" /> <line x1="11" x2="11" y1="8" y2="14" /> <line x1="8" x2="14" y1="11" y2="11" />',
  'play': '<path d="M5 5a2 2 0 0 1 3.008-1.728l11.997 6.998a2 2 0 0 1 .003 3.458l-12 7A2 2 0 0 1 5 19z" />',
  'flag': '<path d="M4 22V4a1 1 0 0 1 .4-.8A6 6 0 0 1 8 2c3 0 5 2 7.333 2q2 0 3.067-.8A1 1 0 0 1 20 4v10a1 1 0 0 1-.4.8A6 6 0 0 1 16 16c-3 0-5-2-8-2a6 6 0 0 0-4 1.528" />',
  'square': '<rect width="18" height="18" x="3" y="3" rx="2" />'
};

export function icon(name, size = 16) {
  return `<svg class="icon icon-${name}" xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 24 24"`
    + ` fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${ICONS[name]}</svg>`;
}

// Logo de trace-view : badge vert émeraude et un seul trait blanc qui se lit deux fois — un coureur penché
// en pleine foulée (la tête, les jambes) et un tracé de trail (le sommet, la descente qui repart vers le haut).
// L'ancienne version illustrée est conservée dans docs/logo-illustre.svg.
// Utilisé là où l'application parle en son nom (page d'accueil, parcours sans identité, icône d'onglet).
// Même dessin que l'icône d'onglet d'index.html : modifier les deux ensemble.
export const APP_LOGO_COLOR = '#10B981';
export function appLogo(size = 24) {
  return `<svg class="icon app-logo" xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 32 32" aria-hidden="true">`
    + `<rect x="1" y="1" width="30" height="30" rx="8" fill="${APP_LOGO_COLOR}"/>`
    + '<path d="M6 23.5 12.8 12.8l4.4 6.3c2.4 3.2 6.2 2.6 9.8-3.6" fill="none" stroke="#fff" stroke-width="3.2" stroke-linecap="round" stroke-linejoin="round"/>'
    + '<circle cx="14.6" cy="7.4" r="2.6" fill="#fff"/></svg>';
}

// Remplace les <i data-icon="nom" data-size="16"> du HTML par l'icône correspondante (« trace-view » : le logo)
export function hydrateIcons(root = document) {
  root.querySelectorAll('i[data-icon]').forEach(el => {
    const size = Number(el.dataset.size) || 16;
    el.outerHTML = el.dataset.icon === 'trace-view' ? appLogo(size) : icon(el.dataset.icon, size);
  });
}
