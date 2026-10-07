#!/usr/bin/env python3
"""
Construit les données d'une course pour l'application à partir de son GPX.

    python3 scripts/build_course.py <id>           # écrit data/<id>.json et met à jour data/courses.json
    python3 scripts/build_course.py <id> --check   # compare avec data/<id>.json sans rien écrire
    python3 scripts/build_course.py <id> --fill-elevation   # GPX sans altitudes : les récupérer (voir plus bas)

Entrée : courses/<id>/course.json (+ le GPX qu'il référence) et branding/<identité>.json.

Algorithme de détection des côtes repris de analyze_climbs.py (La Grande Ourthe 2023) :
  - lissage de l'altitude (moyenne glissante, fenêtre `smoothWindow` points)
  - une côte commence dès que l'altitude monte et s'arrête quand on redescend de plus de
    `noiseTolerance` m sous le point le plus haut atteint ; gardée si sa longueur ≥ `minClimbLength` m
  - catégorie selon la pente moyenne : vert 4–7 %, orange 7–10 %, rouge ≥ 10 %, blanc < 4 %

Altitudes : les statistiques affichées (D+, altitudes min/max/moy.) utilisent l'altitude brute du GPX,
comme Openrunner ; la détection des côtes, les pentes et le profil utilisent l'altitude lissée.

Statistiques sur l'altitude lissée pour un GPX aux altitudes bruitées : "statsElevation": "smoothed"
dans course.json (à décider en comparant au D+ annoncé par l'organisation).

GPX sans altitudes : la construction s'arrête et propose l'option. Elle n'est utilisée que si l'utilisateur
l'active (`--fill-elevation` ou `"fillElevation": true` dans course.json) : le tracé est alors densifié
(un point tous les 20 m) et les altitudes sont lues dans le modèle Copernicus GLO-30. Ce modèle est un
modèle de surface (30 m) : sous la forêt, il mesure le haut des arbres, d'où une précision moindre qu'un
GPX d'origine. Les statistiques affichées utilisent alors l'altitude lissée (l'altitude brute du modèle,
bruitée point à point, gonflerait fortement le D+). Le résultat est mis en cache dans
courses/<id>/elevation-cache.json.

Python standard uniquement, sauf la récupération des altitudes (rasterio).
"""
import argparse
import hashlib
import json
import math
import os
import sys
import xml.etree.ElementTree as ET

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
DEFAULT_DETECTION = {'minClimbLength': 300, 'noiseTolerance': 8, 'smoothWindow': 5}
AID_KM_TOLERANCE = 0.3     # km : écart toléré entre le km annoncé et la position projetée
AID_OFF_TRACK = 200        # m : au-delà, le ravitaillement est signalé hors du tracé
SUPPLY_CATEGORIES = ('liquide', 'solide', 'chaud', 'autre')
ELEVATION_SPACING = 20     # m : densité du tracé quand les altitudes sont récupérées
DEFAULT_BRANDING = 'defaut'
# Icône des ravitaillements quand l'identité n'en fournit pas : couteau et fourchette (Lucide, ISC, au trait)
DEFAULT_AID_ICON = {
    'name': 'Couteau et fourchette (icône par défaut)',
    'viewBox': '0 0 24 24',
    'style': 'stroke',
    'path': 'M3 2v7c0 1.1.9 2 2 2h4a2 2 0 0 0 2-2V2 M7 2v20 M21 15V2a5 5 0 0 0-5 5v6c0 1.1.9 2 2 2h3Zm0 0v7',
}
ELEVATION_CACHE = 'elevation-cache.json'
# Altitudes suspectes (saut impossible) : au moins JUMP_MIN_RISE m de dénivelé à plus de 100 % de pente sur au
# plus JUMP_WINDOW m ; un palier parfaitement plat (PLATEAU_MIN m) collé au saut est inclus dans la zone
JUMP_MIN_RISE = 30
JUMP_WINDOW = 100
PLATEAU_MIN = 200


# ── Géométrie ───────────────────────────────────────────────────────────

def haversine(lat1, lon1, lat2, lon2):
    R = 6371000
    phi1, phi2 = math.radians(lat1), math.radians(lat2)
    dphi = math.radians(lat2 - lat1)
    dlambda = math.radians(lon2 - lon1)
    a = math.sin(dphi / 2) ** 2 + math.cos(phi1) * math.cos(phi2) * math.sin(dlambda / 2) ** 2
    return 2 * R * math.atan2(math.sqrt(a), math.sqrt(1 - a))


def copernicus_tile_url(lat, lng):
    """URL de la tuile Copernicus GLO-30 (1° × 1°) dont le coin sud-ouest est (lat, lng)."""
    ns, ew = ('N' if lat >= 0 else 'S'), ('E' if lng >= 0 else 'W')
    name = f'Copernicus_DSM_COG_10_{ns}{abs(lat):02d}_00_{ew}{abs(lng):03d}_00_DEM'
    return f'https://copernicus-dem-30m.s3.amazonaws.com/{name}/{name}.tif'


# ── Lecture du GPX ──────────────────────────────────────────────────────

def parse_gpx(gpx_file):
    """Points de trace (ou de route à défaut) : lat, lon, altitude brute (None si absente), distance cumulée (m)."""
    with open(gpx_file, 'rb') as f:
        raw = f.read()
    # Caractères parasites avant le XML (frappe accidentelle dans un éditeur) : ignorés, signalés
    start = min([i for i in (raw.find(b'<?xml'), raw.find(b'<gpx')) if i >= 0], default=0)
    if start > 0:
        print(f'⚠ {os.path.basename(gpx_file)} : {start} caractère(s) avant le XML ignoré(s) '
              f'({raw[:start].decode(errors="replace")!r})')
    root = ET.fromstring(raw[start:])
    local = lambda el: el.tag.rsplit('}', 1)[-1]          # GPX 1.0 et 1.1 (espaces de noms différents)
    pts = [el for el in root.iter() if local(el) == 'trkpt'] or [el for el in root.iter() if local(el) == 'rtept']
    if not pts:
        sys.exit(f'Aucun point de trace dans {gpx_file}')
    points, cum = [], 0.0
    for el in pts:
        lat, lon = float(el.get('lat')), float(el.get('lon'))
        ele_el = next((c for c in el if local(c) == 'ele'), None)
        ele = float(ele_el.text) if ele_el is not None and (ele_el.text or '').strip() else None
        if points:
            cum += haversine(points[-1]['lat'], points[-1]['lon'], lat, lon)
        points.append({'lat': lat, 'lon': lon, 'ele': ele, 'dist': cum})
    return points


# ── Altitudes manquantes (sur demande de l'utilisateur) ─────────────────

def densify(points, spacing):
    """Ajoute des points intermédiaires pour qu'ils soient espacés d'au plus `spacing` m (même tracé)."""
    out = [dict(points[0], dist=0.0)]
    for a, b in zip(points, points[1:]):
        seg = b['dist'] - a['dist']
        steps = max(1, math.ceil(seg / spacing))
        for k in range(1, steps + 1):
            t = k / steps
            out.append({'lat': a['lat'] + (b['lat'] - a['lat']) * t, 'lon': a['lon'] + (b['lon'] - a['lon']) * t,
                        'ele': None, 'dist': a['dist'] + seg * t})
    return out


def fill_elevation(course_dir, gpx_name, points, spacing=ELEVATION_SPACING):
    """Densifie le tracé et lit les altitudes dans Copernicus GLO-30 (avec cache par GPX)."""
    with open(os.path.join(course_dir, gpx_name), 'rb') as f:
        digest = hashlib.sha1(f.read()).hexdigest()
    cache_path = os.path.join(course_dir, ELEVATION_CACHE)
    if os.path.exists(cache_path):
        cache = load_json(cache_path)
        if cache.get('gpxSha1') == digest and cache.get('spacing') == spacing:
            pts, cum = [], 0.0
            for lat, lon, ele in cache['points']:
                if pts:
                    cum += haversine(pts[-1]['lat'], pts[-1]['lon'], lat, lon)
                pts.append({'lat': lat, 'lon': lon, 'ele': ele, 'dist': cum})
            return pts
    try:
        import rasterio
    except ImportError:
        sys.exit('La récupération des altitudes nécessite rasterio : pip install rasterio')

    dense = densify(points, spacing)
    by_tile = {}
    for i, p in enumerate(dense):
        by_tile.setdefault((math.floor(p['lat']), math.floor(p['lon'])), []).append(i)
    print(f'Récupération des altitudes (Copernicus GLO-30, {len(dense)} points, {len(by_tile)} tuile(s))…')
    for (lat, lng), idxs in by_tile.items():
        with rasterio.open(copernicus_tile_url(lat, lng)) as src:
            for i, value in zip(idxs, src.sample([(dense[i]['lon'], dense[i]['lat']) for i in idxs])):
                dense[i]['ele'] = round(float(value[0]), 1)
    with open(cache_path, 'w', encoding='utf-8') as f:
        json.dump({'source': 'Copernicus GLO-30', 'gpxSha1': digest, 'spacing': spacing,
                   'points': [[round(p['lat'], 6), round(p['lon'], 6), p['ele']] for p in dense]}, f)
    return dense


def apply_elevation_fixes(points, fixes, warnings):
    """Altitudes fausses du GPX (paliers, sauts) : interpolées linéairement entre deux km.

    fixes = [{"fromKm": 3.03, "toKm": 4.06}, …] (course.json, "elevationFixes"). Les points strictement entre le
    dernier point avant fromKm et le premier point après toKm prennent l'altitude interpolée selon la distance.
    Renvoie la liste des corrections appliquées (km, nombre de points) pour le résumé.
    """
    applied = []
    total_km = points[-1]['dist'] / 1000
    for fx in fixes if isinstance(fixes, list) else []:
        a, b = (fx.get('fromKm'), fx.get('toKm')) if isinstance(fx, dict) else (None, None)
        if not all(isinstance(v, (int, float)) for v in (a, b)) or not 0 <= a < b <= total_km:
            warnings.append(f'"elevationFixes" : {fx!r} ignoré (attendu {{"fromKm": …, "toKm": …}}, '
                            f'0 ≤ fromKm < toKm ≤ {total_km:.2f})')
            continue
        # Tolérance de 0,5 m : un km arrondi au mètre (proposé par detect_elevation_anomalies) désigne bien son point
        i0 = max(i for i, p in enumerate(points) if p['dist'] / 1000 <= a + 0.0005)
        i1 = min(i for i, p in enumerate(points) if p['dist'] / 1000 >= b - 0.0005)
        e0, e1 = points[i0]['ele'], points[i1]['ele']
        d0, d1 = points[i0]['dist'], points[i1]['dist']
        for i in range(i0 + 1, i1):
            points[i]['ele'] = e0 + (e1 - e0) * (points[i]['dist'] - d0) / (d1 - d0)
        applied.append({'fromKm': round(d0 / 1000, 2), 'toKm': round(d1 / 1000, 2), 'points': i1 - i0 - 1,
                        'fromEle': round(e0), 'toEle': round(e1)})
    return applied


def detect_elevation_anomalies(points):
    """Zones où l'altitude du GPX est physiquement impossible : saut de plus de 100 % de pente (≥ 30 m de dénivelé
    en 100 m au plus), souvent entouré de paliers parfaitement plats (itinéraire Strava le long d'une falaise).

    Renvoie [{fromKm, toKm, fromEle, toEle, rise, over}] : fromKm / toKm = derniers points fiables avant et après la
    zone, à proposer tels quels dans "elevationFixes" (la correction reste le choix de l'utilisateur).
    """
    n = len(points)
    flagged = [False] * n
    jumps = {}
    for i in range(n):
        j = i + 1
        while j < n and points[j]['dist'] - points[i]['dist'] <= JUMP_WINDOW:
            rise = points[j]['ele'] - points[i]['ele']
            run = max(points[j]['dist'] - points[i]['dist'], 1.0)
            if abs(rise) >= JUMP_MIN_RISE and abs(rise) > run:
                for k in range(i, j + 1):
                    flagged[k] = True
                jumps[i] = max(jumps.get(i, (0, 0)), (abs(rise), run))
            j += 1

    def plateau(k, step):
        """Étend k le long d'un palier (altitude identique) s'il fait au moins PLATEAU_MIN m."""
        e, m = points[k]['ele'], k
        while 0 <= m + step < n and abs(points[m + step]['ele'] - e) < 0.05:
            m += step
        return m if abs(points[m]['dist'] - points[k]['dist']) >= PLATEAU_MIN else k

    zones, i = [], 0
    while i < n:
        if not flagged[i]:
            i += 1
            continue
        j = i
        while j + 1 < n and flagged[j + 1]:
            j += 1
        a, b = plateau(i, -1), plateau(j, +1)
        a, b = max(a - 1, 0), min(b + 1, n - 1)   # derniers points fiables de part et d'autre
        rise, run = max(v for k, v in jumps.items() if i <= k <= j)
        if zones and a <= zones[-1]['_b']:
            zones[-1].update(_b=b, toKm=round(points[b]['dist'] / 1000, 3), toEle=round(points[b]['ele']))
        else:
            zones.append({'_b': b, 'fromKm': round(points[a]['dist'] / 1000, 3),
                          'toKm': round(points[b]['dist'] / 1000, 3), 'fromEle': round(points[a]['ele']),
                          'toEle': round(points[b]['ele']), 'rise': round(rise), 'over': round(run)})
        i = j + 1
    for z in zones:
        z.pop('_b')
    return zones


def smooth_elevation(points, window):
    n = len(points)
    result = []
    for i in range(n):
        s, e = max(0, i - window // 2), min(n, i + window // 2 + 1)
        result.append(sum(points[j]['ele'] for j in range(s, e)) / (e - s))
    return result


# ── Détection des côtes ─────────────────────────────────────────────────

def find_climbs(points, elev, min_length, noise_tol):
    n, climbs, i = len(points), [], 0
    while i < n - 1:
        if elev[i + 1] <= elev[i]:
            i += 1
            continue
        start_ele, start_dist, start_idx = elev[i], points[i]['dist'], i
        peak_ele, peak_idx = elev[i], i
        j = i + 1
        while j < n:
            e = elev[j]
            if e > peak_ele:
                peak_ele, peak_idx = e, j
            if peak_ele - e > noise_tol:
                break
            j += 1
        gain = elev[peak_idx] - start_ele
        length = points[peak_idx]['dist'] - start_dist
        if length >= min_length and gain > 0:
            pct = round(gain / length * 100, 1)
            climbs.append({
                'num': len(climbs) + 1,
                'cat': category(pct),
                'startKm': round(start_dist / 1000, 2),
                'endKm': round(points[peak_idx]['dist'] / 1000, 2),
                'startIdx': start_idx,
                'endIdx': peak_idx,
                'length': round(length),
                'dplus': round(gain),
                'pct': pct,
                'altStart': round(start_ele),
                'altTop': round(elev[peak_idx]),
            })
        i = peak_idx + 1
    return climbs


def category(pct):
    if pct >= 10: return 'rouge'
    if pct >= 7:  return 'orange'
    if pct >= 4:  return 'vert'
    return 'blanc'


# ── Statistiques (altitude brute) ───────────────────────────────────────

def fmt_int(value):
    return f'{round(value):,}'.replace(',', ' ')          # 3408 → « 3 408 »


def stats(points, elevations):
    raw = elevations
    up = sum(max(0.0, raw[i] - raw[i - 1]) for i in range(1, len(raw)))
    down = sum(max(0.0, raw[i - 1] - raw[i]) for i in range(1, len(raw)))
    km = points[-1]['dist'] / 1000
    return {
        'distance': f'{km:.1f}'.replace('.', ',') + ' km',
        'dplus': f'+{fmt_int(up)} m',
        'dminus': f'−{fmt_int(down)} m',
        'altMin': f'{fmt_int(min(raw))} m',
        'altMax': f'{fmt_int(max(raw))} m',
        'altMoy': f'{fmt_int(sum(raw) / len(raw))} m',
    }, {'distanceKm': round(km, 1), 'dplus': round(up)}


# ── Ravitaillements ─────────────────────────────────────────────────────

def resolve_aid_stations(stations, points, warnings):
    """Chaque ravito donne un km, des coordonnées, ou les deux : on calcule ce qui manque."""
    resolved = []
    for st in stations:
        name = st.get('name') or '(sans nom)'
        has_km, has_pos = 'km' in st, 'lat' in st and 'lng' in st
        if not has_km and not has_pos:
            warnings.append(f'Ravitaillement « {name} » ignoré : ni km ni coordonnées')
            continue
        if has_pos:
            # Point du tracé le plus proche (sur une boucle, privilégier les passages proches du km annoncé)
            dists = [haversine(st['lat'], st['lng'], p['lat'], p['lon']) for p in points]
            if has_km:
                near = [i for i, d in enumerate(dists) if d <= AID_OFF_TRACK] or range(len(points))
                idx = min(near, key=lambda i: (abs(points[i]['dist'] / 1000 - st['km']), dists[i]))
            else:
                idx = min(range(len(points)), key=dists.__getitem__)
            if dists[idx] > AID_OFF_TRACK:
                warnings.append(f'« {name} » est à {dists[idx]:.0f} m du tracé : coordonnées à vérifier')
            km_on_track = points[idx]['dist'] / 1000
            if has_km and abs(km_on_track - st['km']) > AID_KM_TOLERANCE:
                warnings.append(f'« {name} » : km annoncé {st["km"]} mais les coordonnées tombent au km '
                                f'{km_on_track:.1f} du tracé')
            km = st['km'] if has_km else round(km_on_track, 1)
            lat, lng = st['lat'], st['lng']
        else:
            km = st['km']
            idx = min(range(len(points)), key=lambda i: abs(points[i]['dist'] / 1000 - km))
            lat, lng = round(points[idx]['lat'], 5), round(points[idx]['lon'], 5)
        if not 0 <= km <= points[-1]['dist'] / 1000:
            warnings.append(f'« {name} » : km {km} hors du parcours')
        aid = {'km': km, 'name': name, 'lat': lat, 'lng': lng}
        # Contenu : tableau d'éléments { category, label, brand } ; note : facultative
        supplies = normalize_supplies(st.get('supplies', []), name, warnings)
        if supplies:
            aid['supplies'] = supplies
        if 'brands' in st:
            warnings.append(f'« {name} » : "brands" n\'est plus utilisé, indiquer la marque dans chaque élément '
                            'de "supplies" ("brand")')
        if st.get('note'):
            aid['note'] = str(st['note']).strip()
        resolved.append(aid)
    return sorted(resolved, key=lambda a: a['km'])


def normalize_supplies(items, name, warnings):
    """Contenu d'un ravitaillement : [{"category": "liquide", "label": "Eau plate", "brand": "Naak"}, …].

    category : liquide | solide | chaud | autre (icône et regroupement à l'affichage) ;
    label : produit (texte libre) ; brand : marque (facultative). Un élément doit avoir au moins
    une catégorie connue ou un libellé.
    """
    if not isinstance(items, list):
        warnings.append(f'« {name} » : "supplies" doit être un tableau d\'éléments, ignoré')
        return []
    out = []
    for item in items:
        if not isinstance(item, dict):
            warnings.append(f'« {name} » : élément de "supplies" ignoré ({item!r}), attendu '
                            '{{"category": …, "label": …, "brand": …}}')
            continue
        category = str(item.get('category', '')).strip().lower()
        label, brand = str(item.get('label', '')).strip(), str(item.get('brand', '')).strip()
        if category not in SUPPLY_CATEGORIES:
            if category:
                warnings.append(f'« {name} » : catégorie « {category} » inconnue (liquide, solide, chaud, autre) '
                                '→ classée « autre »')
            category = 'autre'
        if category == 'autre' and not label:
            warnings.append(f'« {name} » : élément de "supplies" sans libellé ni catégorie, ignoré')
            continue
        entry = {'category': category}
        if label:
            entry['label'] = label
        if brand:
            entry['brand'] = brand
        out.append(entry)
    return out


# ── Construction ────────────────────────────────────────────────────────

def load_json(path):
    with open(path, encoding='utf-8') as f:
        return json.load(f)


def build(course_id, fill_elevation_opt=False):
    course_dir = os.path.join(ROOT, 'courses', course_id)
    course = load_json(os.path.join(course_dir, 'course.json'))
    detection = {**DEFAULT_DETECTION, **course.get('detection', {})}
    branding = load_json(os.path.join(ROOT, 'branding', course.get('branding', DEFAULT_BRANDING) + '.json'))
    branding.pop('name', None)
    branding.setdefault('aidStationIcon', DEFAULT_AID_ICON)

    points = parse_gpx(os.path.join(course_dir, course['gpx']))
    elevation_source = 'GPX'
    missing = sum(p['ele'] is None for p in points)
    if missing:
        if not (fill_elevation_opt or course.get('fillElevation')):
            sys.exit(
                f"{missing} point(s) sur {len(points)} n'ont pas d'altitude dans {course['gpx']} : "
                "la détection des côtes est impossible.\n"
                "Solutions : fournir un GPX avec altitudes, ou récupérer les altitudes depuis le modèle "
                "Copernicus GLO-30 (précision moindre, réseau + rasterio requis) en relançant avec "
                "--fill-elevation, ou en ajoutant \"fillElevation\": true dans course.json.")
        points = fill_elevation(course_dir, course['gpx'], points)
        elevation_source = f'Copernicus GLO-30 (récupérées, un point tous les {ELEVATION_SPACING} m)'
    warnings = []
    # Altitudes fausses du GPX (ex. Strava : paliers puis saut de 300 m le long d'une falaise) : interpolées
    fixes = apply_elevation_fixes(points, course.get('elevationFixes', []), warnings)
    # Altitudes suspectes restantes : signalées, jamais corrigées sans l'accord de l'utilisateur
    for z in detect_elevation_anomalies(points):
        warnings.append(
            f"Altitudes suspectes km {z['fromKm']} à {z['toKm']} ({z['fromEle']} → {z['toEle']} m, saut de "
            f"{z['rise']} m en {z['over']} m) : après vérification et accord, ajouter dans course.json "
            f"\"elevationFixes\": [{{\"fromKm\": {z['fromKm']}, \"toKm\": {z['toKm']}}}]")
    elev = smooth_elevation(points, detection['smoothWindow'])
    climbs = find_climbs(points, elev, detection['minClimbLength'], detection['noiseTolerance'])
    # Altitudes du GPX : chiffres affichés sur l'altitude brute (comme Openrunner), sauf si course.json demande
    # "statsElevation": "smoothed" (GPX aux altitudes bruitées, ex. RouteYou arrondies au mètre).
    # Altitudes récupérées : le modèle est bruité point à point (D+ brut ×1,7 sur Stoumont), toujours lissées.
    use_raw = elevation_source == 'GPX' and course.get('statsElevation', 'raw') != 'smoothed'
    shown = [p['ele'] for p in points] if use_raw else elev
    race_stats, catalog_stats = stats(points, shown)
    # Règle du projet (CLAUDE.md) : le tiret cadratin « — » ne doit jamais apparaître dans l'application
    if course.get('quality', 'standard') not in ('standard', 'high'):
        warnings.append(f'"quality" doit valoir "standard" ou "high" (reçu : {course["quality"]!r}), "standard" utilisé')
        course['quality'] = 'standard'
    if 'terrainExaggeration' in course:
        exag = course['terrainExaggeration']
        if not isinstance(exag, (int, float)) or not 1 <= exag <= 5:
            warnings.append(f'"terrainExaggeration" doit être un nombre entre 1 et 5 (reçu : {exag!r}), ignoré')
            del course['terrainExaggeration']
    if 'traceWidth' in course:
        width = course['traceWidth']
        if not isinstance(width, (int, float)) or not 0.3 <= width <= 3:
            warnings.append(f'"traceWidth" doit \u00eatre un nombre entre 0.3 et 3 (re\u00e7u : {width!r}), ignor\u00e9')
            del course['traceWidth']
    if '\u2014' in json.dumps(course, ensure_ascii=False):
        warnings.append('course.json contient le caractère « — » : le remplacer (virgule, deux-points, « · »)')
    aid = resolve_aid_stations(course.get('aidStations', []), points, warnings)

    contours_dir = os.path.join(ROOT, 'data', 'contours', course_id)
    contours = None
    if os.path.exists(os.path.join(contours_dir, 'thick.geojson')):
        contours = {k: f'data/contours/{course_id}/{k}.geojson' for k in ('thick', 'thin')}

    data = {
        'race': {
            'id': course_id,
            'name': course['name'],
            'subtitle': course.get('subtitle', f'Analyse des côtes ≥ {detection["minClimbLength"]} m'),
            'gpxFile': course['gpx'],
            'elevationSource': elevation_source,
            'minClimbLength': detection['minClimbLength'],
            # Qualité d'affichage : "standard" ou "high" (relief Mapterhorn jusqu'au zoom 17, orthophotos IGN en France)
            'quality': course.get('quality', 'standard'),
            # Exagération du relief en 3D (facultative) : remplace celle du fond de carte
            **({'terrainExaggeration': course['terrainExaggeration']} if 'terrainExaggeration' in course else {}),
            # Altitudes corrigées (facultatif) : tronçons interpolés, pour information
            **({'elevationFixes': fixes} if fixes else {}),
            # Épaisseur du tracé (facultative) : remplace le réglage traceWidth de js/config.js
            **({'traceWidth': course['traceWidth']} if 'traceWidth' in course else {}),
            'stats': race_stats,
        },
        'branding': branding,
        'aidStations': aid,
        'track': {
            'points': [[round(p['lat'], 6), round(p['lon'], 6)] for p in points],
            'dist': [round(p['dist'] / 1000, 3) for p in points],
            'ele': [round(e, 1) for e in elev],
            'eleRaw': [round(e, 1) for e in shown],
        },
        'climbs': climbs,
    }
    if contours:
        data['contours'] = contours
    return data, catalog_stats, warnings


def summary(data, warnings):
    s = data['race']['stats']
    counts = {k: sum(1 for c in data['climbs'] if c['cat'] == k) for k in ('rouge', 'orange', 'vert', 'blanc')}
    lines = [
        f"{data['race']['name']} : {s['distance']}, {s['dplus']}, altitude {s['altMin']} → {s['altMax']}",
        f"{len(data['track']['points'])} points GPS, {len(data['climbs'])} côtes ≥ {data['race']['minClimbLength']} m "
        f"(rouge {counts['rouge']}, orange {counts['orange']}, vert {counts['vert']}, < 4 % {counts['blanc']})",
        'Ravitaillements : ' + (', '.join(f"{a['name']} (km {a['km']})" for a in data['aidStations']) or 'aucun'),
        'Altitudes : ' + data['race']['elevationSource'] + ''.join(
            f"\n  corrigées km {f['fromKm']} → {f['toKm']} : {f['points']} point(s) interpolé(s) de {f['fromEle']} à {f['toEle']} m"
            for f in data['race'].get('elevationFixes', [])),
        'Relief 3D : ' + (f"exagération ×{data['race']['terrainExaggeration']}" if 'terrainExaggeration' in data['race']
                          else 'exagération du fond de carte'),
        *([f"Épaisseur du tracé : ×{data['race']['traceWidth']}"] if 'traceWidth' in data['race'] else []),
        'Qualité : ' + ('haute (relief Mapterhorn, orthophotos IGN)' if data['race']['quality'] == 'high' else 'standard'),
        'Courbes de niveau : ' + ('oui' if 'contours' in data else 'non (python3 scripts/gen_contours.py ' + data['race']['id'] + ')'),
    ]
    lines += [f'⚠ {w}' for w in warnings]
    return '\n'.join(lines)


def check(data, existing_path):
    """Liste les différences avec les données existantes (côtes, statistiques, ravitos, tracé)."""
    if not os.path.exists(existing_path):
        return [f'{existing_path} n\'existe pas encore']
    old = load_json(existing_path)
    diffs = []
    old_climbs, new_climbs = old.get('climbs', []), data['climbs']
    if len(old_climbs) != len(new_climbs):
        diffs.append(f'nombre de côtes : {len(old_climbs)} → {len(new_climbs)}')
    for a, b in zip(old_climbs, new_climbs):
        changed = {k: (a.get(k), b[k]) for k in b if a.get(k) != b[k]}
        if changed:
            diffs.append(f'côte {b["num"]} : ' + ', '.join(f'{k} {v[0]} → {v[1]}' for k, v in changed.items()))
    for k, v in data['race']['stats'].items():
        if old.get('race', {}).get('stats', {}).get(k) != v:
            diffs.append(f'stats.{k} : {old.get("race", {}).get("stats", {}).get(k)} → {v}')
    old_aid = [(a['name'], a['km']) for a in old.get('aidStations', [])]
    new_aid = [(a['name'], a['km']) for a in data['aidStations']]
    if old_aid != new_aid:
        diffs.append(f'ravitaillements : {old_aid} → {new_aid}')
    for k in ('points', 'dist', 'ele'):
        if old.get('track', {}).get(k) != data['track'][k]:
            diffs.append(f'track.{k} différent')
    return diffs


def update_catalog(course_id, name, catalog_stats):
    path = os.path.join(ROOT, 'data', 'courses.json')
    catalog = load_json(path) if os.path.exists(path) else []
    catalog = [c for c in catalog if c['id'] != course_id]
    catalog.append({'id': course_id, 'name': name, **catalog_stats})
    catalog.sort(key=lambda c: (-c['distanceKm'], c['name']))
    with open(path, 'w', encoding='utf-8') as f:
        json.dump(catalog, f, ensure_ascii=False, indent=2)
        f.write('\n')


def main():
    parser = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    parser.add_argument('course', help='identifiant de la course (dossier courses/<id>)')
    parser.add_argument('--check', action='store_true', help='comparer avec data/<id>.json sans rien écrire')
    parser.add_argument('--fill-elevation', action='store_true',
                        help='GPX sans altitudes : les récupérer depuis Copernicus GLO-30 (à activer explicitement)')
    args = parser.parse_args()

    data, catalog_stats, warnings = build(args.course, args.fill_elevation)
    print(summary(data, warnings))
    out = os.path.join(ROOT, 'data', f'{args.course}.json')

    if args.check:
        diffs = check(data, out)
        print('\nAucune différence avec ' + os.path.relpath(out, ROOT) if not diffs
              else '\nDifférences avec ' + os.path.relpath(out, ROOT) + ' :\n  ' + '\n  '.join(diffs))
        sys.exit(1 if diffs else 0)

    with open(out, 'w', encoding='utf-8') as f:
        json.dump(data, f, ensure_ascii=False, separators=(',', ':'))
    update_catalog(args.course, data['race']['name'], catalog_stats)
    print(f'\n→ {os.path.relpath(out, ROOT)} ({os.path.getsize(out) // 1024} Ko) et data/courses.json mis à jour')


if __name__ == '__main__':
    main()
