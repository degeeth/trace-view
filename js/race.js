// ── Données de la course : chargement + valeurs dérivées ──────────────
// Toute la course (tracé, profil, côtes, ravitaillements, identité visuelle)
// vient d'un seul fichier JSON : changer de course = changer de fichier.

// Couleurs des catégories de côtes (pente moyenne) et des pentes locales
export const CAT_COLORS = { rouge: '#c0392b', orange: '#e67e22', vert: '#27ae60', blanc: '#95a5a6' };
export const CAT_LABELS = { vert: 'Vert 4–7 %', orange: 'Orange 7–10 %', rouge: 'Rouge ≥ 10 %', blanc: '< 4 %' };
export const CAT_SHORT  = { vert: 'Vert', orange: 'Orange', rouge: 'Rouge', blanc: '< 4 %' };

// Seuils de pente locale : même légende partout (carte, profil, info-bulles)
export function slopeColor(pct) {
  if (pct >= 10) return '#c0392b';
  if (pct >= 7)  return '#e67e22';
  if (pct >= 4)  return '#27ae60';
  if (pct <= -4) return '#2980b9';
  return '#c8c8c8';
}

export async function loadRace(url) {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Données de course introuvables (${url})`);
  const data = await res.json();
  const { points, dist, ele } = data.track;
  const n = points.length;

  // Pente locale lissée sur ±win points
  const slopeAt = (i, win = 6) => {
    const i0 = Math.max(0, i - win), i1 = Math.min(n - 1, i + win);
    const d = (dist[i1] - dist[i0]) * 1000;
    return d > 0 ? (ele[i1] - ele[i0]) / d * 100 : 0;
  };
  const slope = Array.from({ length: n }, (_, i) => slopeAt(i));

  // Index du point GPS le plus proche d'une distance (recherche dichotomique)
  const idxAtKm = km => {
    let lo = 0, hi = n - 1;
    while (lo < hi) {
      const mid = (lo + hi) >> 1;
      if (dist[mid] < km) lo = mid + 1; else hi = mid;
    }
    return lo;
  };

  // Altitude brute du GPX (chiffres affichés) ; `ele` est lissée (dessin, pentes, côtes)
  const eleRaw = data.track.eleRaw || ele;

  // D+ cumulé sur l'altitude brute : arrive au D+ annoncé dans l'en-tête
  const cumDplus = [0];
  for (let i = 1; i < n; i++) cumDplus.push(cumDplus[i - 1] + Math.max(0, eleRaw[i] - eleRaw[i - 1]));

  // Point culminant (altitude brute, comme l'en-tête)
  const peakIdx = eleRaw.reduce((best, e, i) => e > eleRaw[best] ? i : best, 0);

  const totalKm = dist[n - 1];
  const lngLat = points.map(([lat, lng], i) => [lng, lat, ele[i]]);

  return {
    ...data,
    points, dist, ele, slope, lngLat, totalKm, cumDplus,
    peak: { idx: peakIdx, km: dist[peakIdx], ele: ele[peakIdx], eleRaw: eleRaw[peakIdx] },
    // Boucle : départ et arrivée à moins de 150 m
    isLoop: Math.hypot((points[n - 1][0] - points[0][0]) * 111320,
      (points[n - 1][1] - points[0][1]) * 111320 * Math.cos(points[0][0] * Math.PI / 180)) < 150,
    idxAtKm,
    slopeAt,
    climbLabel: c => `Côte #${c.num} (${c.startKm.toLocaleString('fr-BE')} → ${c.endKm.toLocaleString('fr-BE')} km)`
  };
}

// Icône des ravitaillements (identité visuelle de la course) : forme pleine (logo, ex. cerf du GTLC)
// ou dessin au trait (icône par défaut couteau / fourchette)
export function brandIconSvg(race, color, height) {
  const { viewBox, path, style } = race.branding.aidStationIcon;
  const paint = style === 'stroke'
    ? `fill="none" stroke="${color}" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"`
    : `fill="${color}" fill-rule="evenodd"`;
  return `<svg class="aid-icon" xmlns="http://www.w3.org/2000/svg" viewBox="${viewBox}" height="${height}" aria-hidden="true">`
    + `<path ${paint} d="${path}"/></svg>`;
}

// Taille de l'icône dans un carré de `size` px en gardant ses proportions (cerf vertical, empreinte horizontale)
export function brandIconBox(race, size) {
  const [, , w, h] = race.branding.aidStationIcon.viewBox.split(/[\s,]+/).map(Number);
  return w >= h ? { width: size, height: Math.round(size * h / w) } : { width: Math.round(size * w / h), height: size };
}

// Couleur de l'icône sur la pastille blanche : celle de l'identité, sinon encre
export const brandIconColor = race => race.branding.theme?.aidIconColor || '#04080b';

// Image SVG de l'icône à la taille exacte (pour MapLibre et le canvas du profil)
export function brandIconImage(race, color, size) {
  const { width, height } = brandIconBox(race, size);
  const img = new Image(width, height);
  img.src = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(
    brandIconSvg(race, color, height).replace('<svg ', `<svg width="${width}" `));
  return img;
}

export const escapeHtml = s => String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);

// Catégories du contenu des ravitaillements (champ `category` de chaque élément de `supplies`)
export const SUPPLIES = {
  liquide: { label: 'Liquide', icon: 'glass-water' },
  solide:  { label: 'Solide',  icon: 'sandwich' },
  chaud:   { label: 'Chaud',   icon: 'soup' },
  autre:   { label: 'Autre',   icon: 'utensils' }
};

// Éléments regroupés par catégorie, dans l'ordre de SUPPLIES : [[catégorie, [éléments]], …]
export function suppliesByCategory(aid) {
  return Object.keys(SUPPLIES)
    .map(cat => [cat, (aid.supplies || []).filter(s => s.category === cat)])
    .filter(([, items]) => items.length);
}

// « Boisson isotonique (Naak) », « Naak » si pas de libellé
export const supplyText = s => [s.label, s.brand && (s.label ? `(${s.brand})` : s.brand)].filter(Boolean).join(' ');

// Détail d'un ravitaillement (contenu, marques, note) en HTML ; `icon` vient de js/icons.js
export function aidDetailsHtml(aid, icon) {
  const parts = suppliesByCategory(aid).map(([cat, items]) => {
    const texts = items.map(supplyText).filter(Boolean);
    return `<div class="aid-supply-row"><span class="aid-chip">${icon(SUPPLIES[cat].icon, 12)} ${SUPPLIES[cat].label}</span>`
      + (texts.length ? `<span class="aid-supply-items">${texts.map(escapeHtml).join(', ')}</span>` : '') + '</div>';
  });
  if (aid.note) parts.push(`<div class="aid-note">${escapeHtml(aid.note)}</div>`);
  return parts.join('');
}
