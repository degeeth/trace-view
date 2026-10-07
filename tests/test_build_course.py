"""Tests du script de construction des courses : python3 -m unittest tests/test_build_course.py"""
import hashlib
import json
import os
import shutil
import sys
import tempfile
import unittest

sys.path.insert(0, os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), 'scripts'))
import build_course as bc  # noqa: E402

COURSE_DIR = os.path.join(bc.ROOT, 'courses', 'lgo100km')


class LaGrandeOurthe(unittest.TestCase):
    """Régression : mêmes résultats que analyze_climbs.py sur LGO100km.gpx."""

    @classmethod
    def setUpClass(cls):
        cls.data, cls.catalog, cls.warnings = bc.build('lgo100km')

    def test_climbs(self):
        climbs = self.data['climbs']
        self.assertEqual(len(climbs), 44)
        self.assertEqual({k: sum(c['cat'] == k for c in climbs) for k in ('rouge', 'orange', 'vert', 'blanc')},
                         {'rouge': 2, 'orange': 4, 'vert': 18, 'blanc': 20})
        first = climbs[0]
        self.assertEqual((first['startKm'], first['endKm'], first['length'], first['dplus'], first['pct']),
                         (0.0, 1.78, 1780, 170, 9.5))
        self.assertEqual(first['cat'], 'orange')

    def test_stats_use_raw_elevation(self):
        stats = self.data['race']['stats']
        self.assertEqual(stats['distance'], '100,2 km')
        self.assertEqual(stats['dplus'], '+3 408 m')
        self.assertEqual(stats['altMax'], '643 m')
        self.assertEqual(self.catalog, {'distanceKm': 100.2, 'dplus': 3408, 'branding': 'coureurs-celestes'})

    def test_track(self):
        track = self.data['track']
        self.assertEqual(len(track['points']), 2263)
        self.assertEqual(len(track['eleRaw']), 2263)
        self.assertEqual(max(track['eleRaw']), 643.0)

    def test_no_warning_on_reference_course(self):
        self.assertEqual(self.warnings, [])


class AidStations(unittest.TestCase):
    """Ravitaillements donnés par km, par coordonnées ou les deux."""

    @classmethod
    def setUpClass(cls):
        course = bc.load_json(os.path.join(COURSE_DIR, 'course.json'))
        cls.points = bc.parse_gpx(os.path.join(COURSE_DIR, course['gpx']))

    def resolve(self, *stations):
        warnings = []
        return bc.resolve_aid_stations(list(stations), self.points, warnings), warnings

    def test_km_only_gives_coordinates_on_track(self):
        [aid], warnings = self.resolve({'name': 'Samrée', 'km': 26})
        self.assertAlmostEqual(aid['lat'], 50.2253, places=2)
        self.assertAlmostEqual(aid['lng'], 5.6656, places=2)
        self.assertEqual(warnings, [])

    def test_coordinates_only_give_km(self):
        [aid], warnings = self.resolve({'name': 'Achouffe', 'lat': 50.14999, 'lng': 5.74557})
        self.assertAlmostEqual(aid['km'], 51, delta=0.5)
        self.assertEqual(warnings, [])

    def test_inconsistent_km_is_reported(self):
        _, warnings = self.resolve({'name': 'Achouffe', 'km': 40, 'lat': 50.14999, 'lng': 5.74557})
        self.assertTrue(any('km annoncé 40' in w for w in warnings), warnings)

    def test_off_track_is_reported(self):
        _, warnings = self.resolve({'name': 'Loin', 'lat': 50.30, 'lng': 5.90})
        self.assertTrue(any('du tracé' in w for w in warnings), warnings)

    def test_missing_position_is_ignored(self):
        aids, warnings = self.resolve({'name': 'Vide'})
        self.assertEqual(aids, [])
        self.assertTrue(warnings)

    def test_supplies_are_structured_items(self):
        [aid], warnings = self.resolve({'name': 'Spa', 'km': 35.5, 'note': 'Ravito chaud en hiver', 'supplies': [
            {'category': 'liquide', 'label': 'Eau plate'},
            {'category': 'Liquide', 'label': 'Boisson isotonique', 'brand': 'Naak'},
            {'category': 'solide', 'brand': '6D'}]})
        self.assertEqual(aid['supplies'], [
            {'category': 'liquide', 'label': 'Eau plate'},
            {'category': 'liquide', 'label': 'Boisson isotonique', 'brand': 'Naak'},
            {'category': 'solide', 'brand': '6D'}])
        self.assertEqual(aid['note'], 'Ravito chaud en hiver')
        self.assertEqual(warnings, [])

    def test_invalid_supplies_are_reported(self):
        [aid], warnings = self.resolve({'name': 'Spa', 'km': 35.5, 'brands': ['Naak'], 'supplies': [
            'liquide',                                        # ancien format : ignoré
            {'category': 'gel', 'label': 'Gel énergétique'},  # catégorie inconnue → autre
            {'brand': ''}]})                                  # vide : ignoré
        self.assertEqual(aid['supplies'], [{'category': 'autre', 'label': 'Gel énergétique'}])
        self.assertEqual(len(warnings), 4, warnings)          # brands + 3 éléments

    def test_sorted_by_km(self):
        aids, _ = self.resolve({'name': 'B', 'km': 60}, {'name': 'A', 'km': 10})
        self.assertEqual([a['name'] for a in aids], ['A', 'B'])


GPX_WITHOUT_ELEVATION = """<?xml version="1.0" encoding="UTF-8"?>
<gpx xmlns="http://www.topografix.com/GPX/1/1" version="1.1"><trk><trkseg>
<trkpt lat="50.40000" lon="5.80000"></trkpt>
<trkpt lat="50.40500" lon="5.80000"></trkpt>
<trkpt lat="50.41000" lon="5.80000"></trkpt>
</trkseg></trk></gpx>"""


class MissingElevation(unittest.TestCase):
    """GPX sans altitudes : refus par défaut, récupération seulement si l'utilisateur l'active."""

    def setUp(self):
        self.root = tempfile.mkdtemp()
        self.old_root, bc.ROOT = bc.ROOT, self.root
        self.course_dir = os.path.join(self.root, 'courses', 'essai')
        os.makedirs(self.course_dir)
        os.makedirs(os.path.join(self.root, 'branding'))
        shutil.copy(os.path.join(self.old_root, 'branding', 'gtlc.json'), os.path.join(self.root, 'branding'))
        with open(os.path.join(self.course_dir, 'essai.gpx'), 'w') as f:
            f.write(GPX_WITHOUT_ELEVATION)
        self.write_course({})

    def tearDown(self):
        bc.ROOT = self.old_root
        shutil.rmtree(self.root)

    def write_course(self, extra):
        with open(os.path.join(self.course_dir, 'course.json'), 'w') as f:
            json.dump({'id': 'essai', 'name': 'Essai', 'gpx': 'essai.gpx', 'branding': 'gtlc', **extra}, f)

    def write_cache(self):
        """Altitudes déjà récupérées (évite le réseau) : une montée régulière de 300 → 400 m."""
        points = bc.densify(bc.parse_gpx(os.path.join(self.course_dir, 'essai.gpx')), bc.ELEVATION_SPACING)
        with open(os.path.join(self.course_dir, 'essai.gpx'), 'rb') as f:
            sha1 = hashlib.sha1(f.read()).hexdigest()
        n = len(points) - 1
        with open(os.path.join(self.course_dir, bc.ELEVATION_CACHE), 'w') as f:
            json.dump({'gpxSha1': sha1, 'spacing': bc.ELEVATION_SPACING,
                       'points': [[p['lat'], p['lon'], 300 + 100 * i / n] for i, p in enumerate(points)]}, f)

    def test_default_aid_icon_when_branding_has_none(self):
        os.remove(os.path.join(self.root, 'branding', 'gtlc.json'))
        with open(os.path.join(self.root, 'branding', 'defaut.json'), 'w') as f:
            json.dump({'traceColor': '#e8002d', 'accentColor': '#1a2744'}, f)
        self.write_course({'fillElevation': True})
        os.remove(os.path.join(self.course_dir, 'course.json'))
        with open(os.path.join(self.course_dir, 'course.json'), 'w') as f:   # sans "branding" : identité par défaut
            json.dump({'id': 'essai', 'name': 'Essai', 'gpx': 'essai.gpx', 'fillElevation': True}, f)
        self.write_cache()
        data, _, _ = bc.build('essai')
        self.assertEqual(data['branding']['aidStationIcon'], bc.DEFAULT_AID_ICON)

    def test_quality_option(self):
        self.write_course({'fillElevation': True})
        self.write_cache()
        self.assertEqual(bc.build('essai')[0]['race']['quality'], 'standard')
        self.write_course({'fillElevation': True, 'quality': 'high'})
        self.assertEqual(bc.build('essai')[0]['race']['quality'], 'high')
        self.write_course({'fillElevation': True, 'quality': 'ultra'})
        data, _, warnings = bc.build('essai')
        self.assertEqual(data['race']['quality'], 'standard')
        self.assertTrue(any('"quality"' in w for w in warnings), warnings)

    def test_terrain_exaggeration(self):
        self.write_course({'fillElevation': True})
        self.write_cache()
        self.assertNotIn('terrainExaggeration', bc.build('essai')[0]['race'])
        self.write_course({'fillElevation': True, 'terrainExaggeration': 2.5})
        self.assertEqual(bc.build('essai')[0]['race']['terrainExaggeration'], 2.5)
        self.write_course({'fillElevation': True, 'terrainExaggeration': 12})
        data, _, warnings = bc.build('essai')
        self.assertNotIn('terrainExaggeration', data['race'])
        self.assertTrue(any('terrainExaggeration' in w for w in warnings), warnings)

    def test_refused_without_user_consent(self):
        with self.assertRaises(SystemExit) as ctx:
            bc.build('essai')
        self.assertIn('--fill-elevation', str(ctx.exception.code))
        self.assertIn('"fillElevation": true', str(ctx.exception.code))

    def test_densify_keeps_track_length(self):
        points = bc.parse_gpx(os.path.join(self.course_dir, 'essai.gpx'))
        dense = bc.densify(points, 20)
        self.assertAlmostEqual(dense[-1]['dist'], points[-1]['dist'], places=6)
        self.assertTrue(all(b['dist'] - a['dist'] <= 20.0001 for a, b in zip(dense, dense[1:])))

    def test_filled_with_cli_option(self):
        self.write_cache()
        data, _, _ = bc.build('essai', fill_elevation_opt=True)
        self.assertTrue(data['race']['elevationSource'].startswith('Copernicus'))
        self.assertEqual(len(data['climbs']), 1)
        # Montée de 100 m ; la moyenne glissante rabote un peu les extrémités → 96 m
        self.assertEqual(data['climbs'][0]['dplus'], 96)

    def test_stats_on_smoothed_elevation_when_requested(self):
        # GPX avec altitudes : brut par défaut, lissé si "statsElevation": "smoothed"
        gpx = GPX_WITHOUT_ELEVATION.replace('></trkpt>', '><ele>300</ele></trkpt>', 1) \
            .replace('5.80000"></trkpt>\n<trkpt lat="50.41000"', '5.80000"><ele>320</ele></trkpt>\n<trkpt lat="50.41000"') \
            .replace('<trkpt lat="50.41000" lon="5.80000"></trkpt>', '<trkpt lat="50.41000" lon="5.80000"><ele>310</ele></trkpt>')
        with open(os.path.join(self.course_dir, 'essai.gpx'), 'w') as f:
            f.write(gpx)
        raw, _, _ = bc.build('essai')
        self.write_course({'statsElevation': 'smoothed'})
        smoothed, _, _ = bc.build('essai')
        self.assertEqual(raw['race']['stats']['dplus'], '+20 m')
        self.assertNotEqual(smoothed['race']['stats']['dplus'], '+20 m')
        self.assertEqual(raw['climbs'], smoothed['climbs'])

    def test_filled_with_course_setting(self):
        self.write_course({'fillElevation': True})
        self.write_cache()
        data, _, _ = bc.build('essai')
        # Altitudes récupérées : statistiques sur l'altitude lissée (96 m), pas sur le modèle brut (100 m)
        self.assertEqual(data['race']['stats']['dplus'], '+96 m')



class ElevationFixes(unittest.TestCase):
    """Altitudes fausses d'un GPX (paliers, saut) interpolées entre deux km (course.json, "elevationFixes")."""

    def points(self):
        # 0 à 1 km, un point tous les 100 m : palier à 100 m puis saut à 400 m au km 0,5
        return [{'lat': 0, 'lon': 0, 'ele': 100.0 if i <= 5 else 400.0, 'dist': i * 100.0} for i in range(11)]

    def test_interpolated_between_bounds(self):
        pts, warnings = self.points(), []
        applied = bc.apply_elevation_fixes(pts, [{'fromKm': 0.2, 'toKm': 0.8}], warnings)
        self.assertEqual(warnings, [])
        self.assertEqual(applied, [{'fromKm': 0.2, 'toKm': 0.8, 'points': 5, 'fromEle': 100, 'toEle': 400}])
        self.assertEqual([round(p['ele']) for p in pts], [100, 100, 100, 150, 200, 250, 300, 350, 400, 400, 400])

    def test_jump_with_plateaus_is_detected(self):
        # 0 à 2 km, un point tous les 20 m : montée régulière, palier, saut de 200 m en 20 m, palier, montée
        pts = []
        for i in range(101):
            d = i * 20.0
            ele = 100 + d * 0.1 if d < 600 else 160.0 if d < 1000 else 360.0 if d < 1400 else 360 + (d - 1400) * 0.1
            pts.append({'lat': 0, 'lon': 0, 'ele': ele, 'dist': d})
        zones = bc.detect_elevation_anomalies(pts)
        self.assertEqual(len(zones), 1)
        self.assertEqual((zones[0]['fromKm'], zones[0]['toKm'], zones[0]['rise']), (0.58, 1.42, 200))
        bc.apply_elevation_fixes(pts, [{'fromKm': zones[0]['fromKm'], 'toKm': zones[0]['toKm']}], [])
        self.assertEqual(bc.detect_elevation_anomalies(pts), [])

    def test_steep_but_possible_climb_is_not_detected(self):
        # 60 % sur 100 m : raide mais réel
        pts = [{'lat': 0, 'lon': 0, 'ele': 100 + i * 6.0, 'dist': i * 10.0} for i in range(11)]
        self.assertEqual(bc.detect_elevation_anomalies(pts), [])

    def test_invalid_fix_is_reported(self):
        pts, warnings = self.points(), []
        self.assertEqual(bc.apply_elevation_fixes(pts, [{'fromKm': 0.8, 'toKm': 0.2}, {'fromKm': 0.5}], warnings), [])
        self.assertEqual(len(warnings), 2)
        self.assertEqual(pts[3]['ele'], 100.0)



class TimeBarriers(unittest.TestCase):
    """Départ, barrières horaires des ravitaillements et de l'arrivée (course.json)."""

    def aid(self):
        return [{'name': 'A', 'km': 12.0, 'cutoff': '11:00'}, {'name': 'B', 'km': 30.0, 'cutoff': '02:00'}]

    def test_elapsed_time_and_minimum_speed(self):
        warnings, aid = [], self.aid()
        race = bc.time_barriers({'start': '2026-11-07T09:00', 'finishCutoff': '2026-11-08T06:00'}, aid, 60.0, warnings)
        self.assertEqual(warnings, [])
        self.assertEqual(race['start'], '2026-11-07T09:00')
        self.assertEqual(aid[0]['cutoff'], {'time': '2026-11-07T11:00', 'elapsed': 120, 'speed': 6.0})
        # heure avant le départ : le lendemain (course de nuit)
        self.assertEqual(aid[1]['cutoff']['time'], '2026-11-08T02:00')
        self.assertEqual(race['finishCutoff']['elapsed'], 21 * 60)

    def test_cutoffs_without_start_are_ignored(self):
        warnings, aid = [], self.aid()
        self.assertEqual(bc.time_barriers({}, aid, 60.0, warnings), {})
        self.assertEqual(len(warnings), 1)
        self.assertNotIn('cutoff', aid[0])

    def test_unordered_or_invalid_cutoffs_are_reported(self):
        warnings = []
        aid = [{'name': 'A', 'km': 12.0, 'cutoff': '13:00'}, {'name': 'B', 'km': 30.0, 'cutoff': '12:00'},
               {'name': 'C', 'km': 40.0, 'cutoff': 'midi'}]
        bc.time_barriers({'start': '2026-11-07T09:00'}, aid, 60.0, warnings)
        # B (12h00, même jour) avant A (13h00) : signalé ; C illisible : signalé et ignoré
        self.assertEqual(len(warnings), 2)
        self.assertEqual(aid[1]['cutoff']['time'], '2026-11-07T12:00')
        self.assertNotIn('cutoff', aid[2])


if __name__ == '__main__':
    unittest.main()
