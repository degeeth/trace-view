// ── Survol 3D du parcours (façon Relive) ──────────────────────────────
// La caméra suit le tracé du départ à l'arrivée (ou la côte sélectionnée), inclinée derrière le point courant et
// tournée vers la suite du parcours ; le curseur du profil avance en même temps (évènement cursor:move).
// Réglages : MAP_CONFIG (js/config.js), section « Survol 3D ».
import { emit } from './bus.js';
import { MAP_CONFIG as C } from './config.js';

const toRad = d => d * Math.PI / 180;
const toDeg = r => r * 180 / Math.PI;
// Écart d'angle ramené entre -180° et 180° (le chemin le plus court pour tourner)
const angleDiff = (to, from) => ((to - from) % 360 + 540) % 360 - 180;

// Chemin rééchantillonné à pas régulier (au plus flyoverStep mètres) entre deux points du tracé : calculé une fois
// au départ, puis interpolé à chaque image (jamais de boucle sur les 18 000 points d'un enregistrement à la seconde)
function resamplePath(race, i0, i1) {
  const lat0 = race.lngLat[i0][1], lng0 = race.lngLat[i0][0];
  const kx = 111320 * Math.cos(toRad(lat0)), ky = 110540;   // mètres par degré (approximation locale)
  const km0 = race.dist[i0];
  const length = Math.max(0, (race.dist[i1] - km0) * 1000);
  const n = Math.max(1, Math.ceil(length / C.flyoverStep));
  const ds = length / n;
  const x = new Float64Array(n + 1), y = new Float64Array(n + 1);
  for (let k = 0, j = i0; k <= n; k++) {
    const km = km0 + k * ds / 1000;
    while (j < i1 - 1 && race.dist[j + 1] < km) j++;
    const a = race.lngLat[j], b = race.lngLat[Math.min(j + 1, i1)];
    const span = race.dist[Math.min(j + 1, i1)] - race.dist[j];
    const f = span > 0 ? Math.min(1, Math.max(0, (km - race.dist[j]) / span)) : 0;
    x[k] = (a[0] + (b[0] - a[0]) * f - lng0) * kx;
    y[k] = (a[1] + (b[1] - a[1]) * f - lat0) * ky;
  }
  return {
    n, ds, length, km0,
    // Position (mètres) à la distance s du début du chemin
    at(s) {
      const t = Math.min(n, Math.max(0, s / (ds || 1)));
      const k = Math.min(n - 1, Math.floor(t)), f = t - k;
      return [x[k] + (x[k + 1] - x[k]) * f, y[k] + (y[k + 1] - y[k]) * f];
    },
    // Cap visé depuis s : vers le centre de gravité du tracé des flyoverLookAhead mètres suivants (plus stable
    // qu'un seul point devant : un lacet ne fait pas pivoter la caméra d'un coup) ; null en bout de chemin
    aim(s) {
      const [px, py] = this.at(s);
      const k0 = Math.floor(s / (ds || 1)) + 1, k1 = Math.min(n, Math.floor((s + C.flyoverLookAhead) / (ds || 1)));
      if (k1 < k0) return null;
      let cx = 0, cy = 0;
      for (let k = k0; k <= k1; k++) { cx += x[k]; cy += y[k]; }
      const dx = cx / (k1 - k0 + 1) - px, dy = cy / (k1 - k0 + 1) - py;
      return Math.hypot(dx, dy) < 5 ? null : toDeg(Math.atan2(dx, dy));
    },
    toLngLat: ([mx, my]) => [lng0 + mx / kx, lat0 + my / ky]
  };
}

// Distance parcourue après t secondes sur un vol de durée T : vitesse qui monte puis redescend en douceur
// (rampes de flyoverRamp secondes), constante entre les deux
function distanceAt(t, T, length) {
  const r = Math.min(C.flyoverRamp, T / 4);
  const v = length / (T - r);
  if (t <= 0) return 0;
  if (t >= T) return length;
  if (t < r) return 0.5 * v * t * t / r;
  if (t > T - r) return length - 0.5 * v * (T - t) ** 2 / r;
  return 0.5 * v * r + v * (t - r);
}

// enter3D : passe la carte en 3D (bouton 3D compris) et renvoie une promesse ; onChange(vol en cours ?)
export function createFlyover(race, mapApi, { enter3D, onChange } = {}) {
  const map = mapApi.map;
  let run = null;   // vol en cours

  const clamp = (v, lo, hi) => Math.min(hi, Math.max(lo, v));
  function durationFor(km, climb) {
    return climb
      ? clamp(km * C.flyoverClimbSecondsPerKm, C.flyoverClimbMinDuration, C.flyoverClimbMaxDuration)
      : clamp(km * C.flyoverSecondsPerKm, C.flyoverMinDuration, C.flyoverMaxDuration);
  }

  // Caméra derrière le point à la distance s, tournée vers le cap : le centre de la vue est un peu devant le point
  // (flyoverCenterAhead), qui se retrouve sous le milieu de l'écran, la suite du parcours au-dessus
  function cameraAt(path, s, bearing) {
    const [px, py] = path.at(s), b = toRad(bearing);
    const center = path.toLngLat([px + Math.sin(b) * C.flyoverCenterAhead, py + Math.cos(b) * C.flyoverCenterAhead]);
    return { center, bearing, pitch: C.flyoverPitch, zoom: C.flyoverZoom };
  }

  // Animation de caméra qui se termine (ou est interrompue) : promesse résolue à « moveend »
  function ease(options) {
    return new Promise(resolve => {
      const timer = setTimeout(resolve, options.duration + 1500);
      map.once('moveend', () => { clearTimeout(timer); resolve(); });
      map.easeTo({ ...options, essential: true });
    });
  }

  // Toute action sur la carte (glisser, pincer, molette, clavier) reprend la main : arrêt sans recadrage.
  // Le panneau des fonds de carte reste utilisable pendant le survol.
  const onUserInput = e => {
    if (e.target.closest?.('.m3d-style-panel')) return;
    stop();
  };
  const INPUTS = ['mousedown', 'touchstart', 'wheel', 'keydown'];

  async function start(climb = null) {
    if (run) return;
    const r = run = { climb, stopped: false, frame: null };
    onChange?.(true);
    if (!mapApi.is3D()) await enter3D();
    if (r.stopped) return;
    INPUTS.forEach(type => map.getContainer().addEventListener(type, onUserInput, { passive: true }));
    mapApi.setFlyover(true);   // pas de mesure du relief à chaque image (js/map.js)

    const path = climb ? resamplePath(race, climb.startIdx, climb.endIdx) : resamplePath(race, 0, race.lngLat.length - 1);
    const T = durationFor(path.length / 1000, !!climb);
    let bearing = path.aim(0) ?? map.getBearing();

    // Mise en place : de la vue actuelle au départ du survol, sans saut
    await ease({ ...cameraAt(path, 0, bearing), duration: C.flyoverIntroDuration });
    if (r.stopped) return;

    let elapsed = 0, last = null;
    const frame = now => {
      if (r.stopped) return;
      // Écart entre deux images plafonné : onglet en arrière-plan ou machine lente, le survol reprend où il était
      const dt = last === null ? 0 : Math.min(0.5, (now - last) / 1000);
      last = now;
      elapsed += dt;
      const s = distanceAt(elapsed, T, path.length);
      // Cap lissé (exponentiel, flyoverBearingSmoothing secondes) : la caméra ne tourne jamais d'un coup
      const aim = path.aim(s);
      if (aim !== null) bearing += angleDiff(aim, bearing) * (1 - Math.exp(-dt / C.flyoverBearingSmoothing));
      map.jumpTo(cameraAt(path, s, bearing));
      emit('cursor:move', path.km0 + s / 1000);
      if (elapsed >= T) { stop({ reframe: true }); return; }
      r.frame = requestAnimationFrame(frame);
    };
    r.frame = requestAnimationFrame(frame);
  }

  // reframe : à l'arrivée, recadrage en douceur sur toute la course (ou la côte), toujours en 3D
  function stop({ reframe = false } = {}) {
    if (!run) return;
    const r = run;
    run = null;
    r.stopped = true;
    cancelAnimationFrame(r.frame);
    INPUTS.forEach(type => map.getContainer().removeEventListener(type, onUserInput));
    mapApi.setFlyover(false);
    emit('cursor:stop');
    onChange?.(false);
    if (reframe && mapApi.is3D()) {
      const coords = r.climb ? race.lngLat.slice(r.climb.startIdx, r.climb.endIdx + 1) : race.lngLat;
      const lngs = coords.map(c => c[0]), lats = coords.map(c => c[1]);
      const bounds = [[Math.min(...lngs), Math.min(...lats)], [Math.max(...lngs), Math.max(...lats)]];
      const bearing = map.getBearing();
      const cam = map.cameraForBounds(bounds, { padding: r.climb ? 80 : 40, bearing });
      if (cam) map.easeTo({ ...cam, zoom: cam.zoom - (r.climb ? 0.4 : 0.3), bearing,
        pitch: r.climb ? C.climbFlightPitch : C.pitch3D, duration: C.flyoverOutroDuration, essential: true });
    }
  }

  return { start, stop, isFlying: () => !!run };
}
