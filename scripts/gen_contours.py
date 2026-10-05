"""
Génère les courbes de niveau d'une course depuis le DEM Copernicus GLO-30 (domaine public, AWS Open Data).

    python3 scripts/gen_contours.py <id>     → data/contours/<id>/thin.geojson + thick.geojson

La zone couverte est celle du GPX de la course (courses/<id>/) avec une marge ; les tuiles Copernicus
(1° × 1°) sont déduites de cette zone et fusionnées si le parcours en chevauche plusieurs.
Dépendances : rasterio, numpy (pip install rasterio). Relancer ensuite build_course.py pour que
l'application référence les courbes.
Post-traitement : chaînage des segments → lissage Chaikin → simplification Douglas-Peucker
→ coordonnées arrondies à 5 décimales (≈ 1 m, bien sous la résolution de 30 m du DEM).
thin = courbes intermédiaires seules (les maîtresses sont dans thick, pas de doublon).
"""
import argparse
import json
import math
import os
import sys
from collections import defaultdict

import numpy as np
import rasterio
import rasterio.merge
import rasterio.windows

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from build_course import ROOT, copernicus_tile_url, load_json, parse_gpx  # noqa: E402

MARGIN_KM     = 2      # marge autour du parcours
INTERVAL      = 10     # intervalle de courbes en mètres
THICK_EVERY   = 50     # courbes maîtresses tous les N mètres
SMOOTH_ITER   = 3      # itérations Chaikin
DP_EPSILON    = 5e-5   # simplification Douglas-Peucker (°, ≈5 m)
DECIMALS      = 5      # précision des coordonnées exportées (≈1 m)
MIN_CHAIN_PTS = 4      # ignore les chaînes trop courtes

# ── 0. Zone du parcours ────────────────────────────────────────────
parser = argparse.ArgumentParser(description='Courbes de niveau d\'une course (Copernicus GLO-30)')
parser.add_argument('course', help='identifiant de la course (dossier courses/<id>)')
COURSE = parser.parse_args().course
course = load_json(os.path.join(ROOT, 'courses', COURSE, 'course.json'))
track = parse_gpx(os.path.join(ROOT, 'courses', COURSE, course['gpx']))
lats, lngs = [p['lat'] for p in track], [p['lon'] for p in track]
d_lat = MARGIN_KM / 111.32
d_lng = MARGIN_KM / (111.32 * math.cos(math.radians(sum(lats) / len(lats))))
BBOX = (min(lngs) - d_lng, min(lats) - d_lat, max(lngs) + d_lng, max(lats) + d_lat)
OUT = os.path.join(ROOT, 'data', 'contours', COURSE)

tiles = [copernicus_tile_url(la, ln)
         for la in range(math.floor(BBOX[1]), math.floor(BBOX[3]) + 1)
         for ln in range(math.floor(BBOX[0]), math.floor(BBOX[2]) + 1)]

# ── 1. Lecture du DEM ──────────────────────────────────────────────
print(f'Zone {BBOX[0]:.3f},{BBOX[1]:.3f} → {BBOX[2]:.3f},{BBOX[3]:.3f}, {len(tiles)} tuile(s) Copernicus GLO-30…')
if len(tiles) == 1:
    with rasterio.open(tiles[0]) as src:
        win  = rasterio.windows.from_bounds(*BBOX, src.transform)
        elev = src.read(1, window=win, masked=True).astype(np.float32)
        tr   = src.window_transform(win)
else:
    srcs = [rasterio.open(u) for u in tiles]
    mosaic, tr = rasterio.merge.merge(srcs, bounds=BBOX)
    elev = np.ma.masked_equal(mosaic[0].astype(np.float32), srcs[0].nodata) if srcs[0].nodata is not None else mosaic[0].astype(np.float32)
    for s_ in srcs: s_.close()

elev = np.ma.filled(elev, 0)
H, W = elev.shape
print(f'Grille : {W}×{H} px | Élévation : {elev.min():.0f}–{elev.max():.0f} m')

# ── 2. Marching squares (segments bruts) ──────────────────────────
def geo(px, py):
    return [tr.c + px * tr.a, tr.f + py * tr.e]

def raw_segments(lv):
    G = (elev >= lv).view(np.uint8)
    idx_arr = (G[:-1,:-1] | (G[:-1,1:]<<1) | (G[1:,1:]<<2) | (G[1:,:-1]<<3))
    rows, cols = np.where((idx_arr != 0) & (idx_arr != 15))
    segs = []
    for py, px in zip(rows.tolist(), cols.tolist()):
        v00=float(elev[py,px]); v10=float(elev[py,px+1])
        v11=float(elev[py+1,px+1]); v01=float(elev[py+1,px])
        a=int(v00>=lv); b=int(v10>=lv); c=int(v11>=lv); d=int(v01>=lv)
        idx=a|(b<<1)|(c<<2)|(d<<3)
        def lr(va,vb): return .5 if va==vb else (lv-va)/(vb-va)
        T =geo(px+lr(v00,v10),py)      if(a^b)else None
        R =geo(px+1,py+lr(v10,v11))    if(b^c)else None
        Bo=geo(px+lr(v01,v11),py+1)    if(c^d)else None
        L =geo(px,py+lr(v00,v01))      if(a^d)else None
        pairs={1:[[T,L]],14:[[T,L]],2:[[T,R]],13:[[T,R]],
               3:[[L,R]],12:[[L,R]],4:[[R,Bo]],11:[[R,Bo]],
               6:[[T,Bo]],9:[[T,Bo]],7:[[L,Bo]],8:[[L,Bo]],
               5:[[T,L],[R,Bo]],10:[[T,R],[L,Bo]]}.get(idx,[])
        for s in pairs:
            if s[0] and s[1]: segs.append(s)
    return segs

# ── 3. Chaînage des segments en polylignes ────────────────────────
def chain_segments(segs):
    def key(pt): return (round(pt[0],7), round(pt[1],7))
    adj = defaultdict(list)
    for i,(a,b) in enumerate(segs):
        adj[key(a)].append((i,True))
        adj[key(b)].append((i,False))

    used   = [False]*len(segs)
    chains = []

    def other_end(seg_i, is_start):
        a2,b2 = segs[seg_i]
        return b2 if is_start else a2

    for start_i in range(len(segs)):
        if used[start_i]: continue
        used[start_i] = True
        chain = list(segs[start_i])   # [a, b]

        # Extension vers l'avant
        while True:
            k = key(chain[-1])
            moved = False
            for seg_i, is_start in adj[k]:
                if not used[seg_i]:
                    used[seg_i] = True
                    chain.append(other_end(seg_i, is_start))
                    moved = True; break
            if not moved: break

        # Extension vers l'arrière
        while True:
            k = key(chain[0])
            moved = False
            for seg_i, is_start in adj[k]:
                if not used[seg_i]:
                    used[seg_i] = True
                    chain.insert(0, other_end(seg_i, is_start))
                    moved = True; break
            if not moved: break

        if len(chain) >= MIN_CHAIN_PTS:
            chains.append(chain)

    return chains

# ── 4. Lissage Chaikin ─────────────────────────────────────────────
def chaikin(pts, iters=SMOOTH_ITER):
    for _ in range(iters):
        out = [pts[0]]
        for i in range(len(pts)-1):
            p,q = pts[i],pts[i+1]
            out.append([.75*p[0]+.25*q[0], .75*p[1]+.25*q[1]])
            out.append([.25*p[0]+.75*q[0], .25*p[1]+.75*q[1]])
        out.append(pts[-1])
        pts = out
    return pts

# ── 5. Simplification Douglas-Peucker ─────────────────────────────
def pt_line_dist(p, a, b):
    dx,dy = b[0]-a[0],b[1]-a[1]
    if dx==dy==0: return ((p[0]-a[0])**2+(p[1]-a[1])**2)**.5
    t = max(0,min(1,((p[0]-a[0])*dx+(p[1]-a[1])*dy)/(dx*dx+dy*dy)))
    return ((p[0]-a[0]-t*dx)**2+(p[1]-a[1]-t*dy)**2)**.5

def douglas_peucker(pts, eps=DP_EPSILON):
    if len(pts)<=2: return pts
    dmax,idx = 0,0
    for i in range(1,len(pts)-1):
        d = pt_line_dist(pts[i],pts[0],pts[-1])
        if d>dmax: dmax,idx = d,i
    if dmax>eps:
        return douglas_peucker(pts[:idx+1],eps)[:-1]+douglas_peucker(pts[idx:],eps)
    return [pts[0],pts[-1]]

# ── 6. Pipeline complet par niveau ────────────────────────────────
def process_level(lv):
    segs   = raw_segments(lv)
    chains = chain_segments(segs)
    result = []
    for ch in chains:
        ch = chaikin(ch)
        ch = douglas_peucker(ch)
        # Arrondi + suppression des points devenus identiques
        rounded = []
        for x, y in ch:
            p = [round(x, DECIMALS), round(y, DECIMALS)]
            if not rounded or rounded[-1] != p: rounded.append(p)
        if len(rounded)>=2: result.append(rounded)
    return result

min_e  = int(np.floor(elev.min()/INTERVAL)*INTERVAL)
max_e  = int(np.ceil (elev.max()/INTERVAL)*INTERVAL)
levels = list(range(min_e, max_e+INTERVAL, INTERVAL))
print(f'Niveaux ({INTERVAL} m) : {levels}')

thin_features  = []
thick_features = []

for lv in levels:
    chains = process_level(lv)
    total_pts = sum(len(c) for c in chains)
    print(f'  {lv:>5} m → {len(chains):>4} polylignes, {total_pts:>6} pts')
    if not chains: continue
    feat = {'type':'Feature',
            'properties':{'ele':lv},
            'geometry':{'type':'MultiLineString','coordinates':chains}}
    if lv % THICK_EVERY == 0: thick_features.append(feat)
    else:                     thin_features.append(feat)

# ── 7. Export ──────────────────────────────────────────────────────
os.makedirs(OUT, exist_ok=True)
for name,feats in [('thin',thin_features),('thick',thick_features)]:
    fc  = {'type':'FeatureCollection','features':feats}
    raw = json.dumps(fc, separators=(',',':'))
    with open(os.path.join(OUT, name+'.geojson'),'w') as f: f.write(raw)
    print(f'→ {name}.geojson  ({len(raw)/1024:.0f} KB, {len(feats)} niveaux)')

print(f'Terminé ! Relancer : python3 scripts/build_course.py {COURSE}')
