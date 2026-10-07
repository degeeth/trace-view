---
name: add-course
description: Adds or updates a course (trail running route) in trace-view from a GPX file: climb detection, statistics, aid stations, contour lines, course selector, verification. Use when the user provides a GPX file or asks to add, import or update a route, a distance or a course, or to change its aid stations.
---

# Add a course to trace-view

The computation is done by scripts in the repository (reproducible, no Claude needed). This skill collects the
missing information, runs the scripts, gets the warnings fixed and checks the result.

Talk to the user in their own language (the project and its users are French-speaking). The application is in
French: names, notes and labels written into `course.json` must be in French. Never use the em dash character
(U+2014) in anything that reaches the application (see `CLAUDE.md`).

```
courses/<id>/course.json + <file>.gpx ──► scripts/build_course.py <id> ──► data/<id>.json + data/courses.json
                                      └─► scripts/gen_contours.py <id> ──► data/contours/<id>/ (optional)
```

## 1. Collect the information

Ask for whatever is not already known (a single grouped question):

| Information | Required | Notes |
|---|---|---|
| GPX file | yes | track with elevations (Openrunner, Garmin, Strava…) |
| Identifier | yes | short lowercase slug: `lgo100km`, `gtlc-winter-35` |
| Display name | yes | « La Grande Ourthe 100km » |
| Visual identity | no | existing identity (`gtlc`…) or a new one (`branding/<name>.json`): colours + **aid station icon**. Ask whether the organiser has its own icon (logo, SVG); otherwise leave it out and the default **knife and fork** icon applies. No identity given: `defaut` |
| Aid stations | no | name + **km** (simplest, usually given by the organiser) **or** name + coordinates, or both; for each one, also ask for its **contents** (products, with their category and brand) and its **time barrier** if known |
| Start and time limit | no | start date and time (`"start": "2026-11-07T09:00"`), required for time barriers; finish time barrier (`"finishCutoff": "20:00"`); barriers per aid station (`"cutoff": "11:15"`) |
| Detection thresholds | no | defaults: climbs ≥ 300 m, tolerance 8 m, smoothing 5 points; only change on request |
| Display quality | no | **always offer it** (see « High quality » below), default `standard` |
| 3D relief exaggeration | no | `terrainExaggeration` (1 to 5): propose **2.5** for gentle relief (Ardennes, hills: valleys stand out), leave it out in the mountains (background default ×1.5, stronger looks caricatural) |

Check that the GPX contains elevations (`<ele>`) before going further. If it contains waypoints (`<wpt>`),
offer them as aid stations.

### GPX without elevations

**Never** enable elevation retrieval without the user's explicit consent. Offer them:
1. **provide another GPX with elevations** (Openrunner, Strava, Garmin… include them on export), the most accurate;
2. **retrieve the elevations** from the Copernicus GLO-30 model, explaining the limits: 30 m surface model
   (under forest it measures the treetops), less accurate than an original GPX, elevation gain computed on the
   smoothed elevation, network access and `rasterio` required.

Only if the user picks option 2, add `"fillElevation": true` to `course.json` (so the choice is kept for
rebuilds). The script then densifies the track (one point every 20 m) and caches the elevations in
`courses/<id>/elevation-cache.json` (to be committed with the course).

### High quality

**Always propose** this option to the user, with its trade-offs, and only enable it if they accept
(`"quality": "high"` in `course.json`):
- **What it brings**: relief from Mapterhorn up to zoom 17 instead of zoom 14 (sharp ridges, gullies, rocky
  slopes in 3D and in the hillshade) and, on the Satellite background, IGN orthophotos where the course is in
  France (rocks, scree and paths clearly visible). Outside France the IGN layer simply shows nothing and Esri
  stays underneath.
- **Trade-offs**: heavier map data (relief tiles ≈ 150 KB each in the mountains, more on mobile data), relies on
  two more free third-party services (Mapterhorn, IGN Géoplateforme).
- **Recommend it** for mountain courses (Alps, Pyrenees) and courses in France; for low hills (Ardennes) the gain
  is small and `standard` is enough.

## 2. Create the course

```
courses/<id>/
├── course.json
└── <file>.gpx      (copy of the provided GPX)
```

`course.json`:
```json
{
  "id": "<id>",
  "name": "<display name>",
  "subtitle": "Analyse des côtes ≥ 300 m",
  "gpx": "<file>.gpx",
  "branding": "gtlc",
  "aidStations": [
    { "name": "Samrée", "km": 26, "supplies": [
        { "category": "liquide", "label": "Boisson isotonique", "brand": "Naak" },
        { "category": "solide", "label": "Barres énergétiques", "brand": "6D" } ] },
    { "name": "Achouffe", "lat": 50.14999, "lng": 5.74557, "note": "Eau uniquement",
      "supplies": [ { "category": "liquide", "label": "Eau plate" } ] }
  ],
  "detection": { "minClimbLength": 300, "noiseTolerance": 8, "smoothWindow": 5 }
}
```

(`"fillElevation": true` and `"quality": "high"` only if the user agreed, see above; add `"terrainExaggeration": 2.5`
for gentle relief. Optional `"traceWidth"` (0.3 to 3) overrides the trace thickness factor of `js/config.js` for
this course, only on request.)

### Suspicious elevations

The script flags physically impossible elevations (*Altitudes suspectes km X à Y*): a jump steeper than 100 %
over at least 30 m of height, often between perfectly flat sections (Strava routes along cliffs, GPS glitches in
a recording). **The person importing the course decides**; never add a fix on your own:
0. before proposing, compare the zone with the terrain model when `rasterio` is available (sample Copernicus
   GLO-30 along the track, as `build_course.copernicus_tile_url` does) and adjust the km bounds to where the GPX
   and the terrain agree again: the detected zone only covers the jump and flat sections, the error can start
   earlier (Ohm Trail: from km 0.89, detected at 1.11) and a flat section can be a real summit to keep
   (HRP 11: col d'Ayous at km 13.22);
1. show them each zone: km range, elevations before and after, size of the jump, what it does to the profile
   (a false wall, wrong maximum slope of the climb) and, if relevant, to the elevation gain;
2. explain the fix: elevations interpolated in a straight line between the two km given in the warning, GPX
   file unchanged, reversible by removing the line;
3. ask, for each zone, whether to fix it. Only if they accept, add the zone to
   `"elevationFixes": [{ "fromKm": …, "toKm": … }]` in `course.json` and rebuild. If they refuse (a real
   ladder, via ferrata…), leave it: the warning will remain on every build and is then explained.

Aid stations: `supplies` (optional) = array of `{ "category", "label", "brand" }` items. `category` is one of
`liquide`, `solide`, `chaud`, `autre` (these values are part of the data format and stay in French); `label` =
product (required for `autre`); `brand` optional. `note` = free text. Turn the user's description (« eau, coca,
barres Naak, soupe ») into items; the brand goes into `brand`, never into the label.

Visual identity `branding/<name>.json`:
```json
{ "name": "…", "traceColor": "#e8002d", "accentColor": "#1a2744",
  "aidStationIcon": { "name": "…", "viewBox": "0 0 24 24", "path": "M…" } }
```
`aidStationIcon` is optional (default: knife and fork). A provided icon is a filled shape (vectorised logo,
like the GTLC deer or the Coureurs Célestes sole print) by default; add `"style": "stroke"` for a line icon.
Optional `theme` adapts the whole interface to the organiser (keys: `primary`, `onPrimary`, `ink`, `night`,
`nightHover`, `radius`, `font`, `fontDisplay`, `googleFonts`, `aidIconColor`; see README; a new `googleFonts`
family requires `python3 scripts/fetch_fonts.py`: fonts are served by the app, never by Google). `"headerLogo": true`
shows the organiser's icon next to the title instead of the mountain. When the user gives
the organiser's website, offer to write a `courses/<id>/DESIGN.md` from it and derive the identity from it
(example: `branding/coureurs-celestes.json`).

## 3. Build the data

```bash
python3 scripts/build_course.py <id>
```

Review the summary with the user: distance, elevation gain, elevations, number of climbs per colour, aid stations.
**Compare the elevation gain with the organiser's figure**: if it is clearly higher (noisy GPX elevations,
e.g. RouteYou), compare with the smoothed elevation gain and, if that one matches, add
`"statsElevation": "smoothed"` to `course.json` with the user's consent.

Aid stations described by a place (« near the park », « in the village ») rather than an exact km: locate the
place, take the nearest track point and give it as coordinates; the kilometres announced by organisers are
often rounded.

Handle **every** `⚠` line:
- *km annoncé X mais les coordonnées tombent au km Y* (km and coordinates disagree) → ask which one is right, fix `course.json`
- *à N m du tracé* (N m away from the track) → coordinates probably wrong (or an aid station deliberately off the route: keep it if confirmed)
- *hors du parcours* (outside the course) → km greater than the total distance
- *Altitudes suspectes km X à Y* (suspicious elevations) → see « Suspicious elevations » above: ask the user, fix only with their consent
- *N point(s) n'ont pas d'altitude* (points without elevation) → the GPX has no elevations: go back to « GPX without elevations » and ask

Then run the command again until no unexplained warning remains.

To **update** an existing course: edit `course.json` (or replace the GPX), then run
`python3 scripts/build_course.py <id> --check` to see the differences before regenerating.

## 4. Contour lines (optional)

```bash
python3 scripts/gen_contours.py <id>
python3 scripts/build_course.py <id>      # so that the data references the contour lines
```

Requires `rasterio` (`pip install rasterio`) and network access (Copernicus DEM on AWS, ~1 min).
Without `rasterio`, tell the user: the application works without contour lines.

## 5. Verify

```bash
npm run test:build
npm run test:smoke -- --course <id>
```

Then run `npm run serve` and open `http://localhost:8080/?course=<id>` (or take a screenshot with the driven
browser): track, coloured climbs, aid stations in the right places, elevation profile, course selector in the
header (visible as soon as there are two courses). Show the screenshot to the user.

## 6. Finish

- Add a section to `CHANGES.md` (course added, number of climbs, aid stations).
- Do not commit without an explicit request. Files to commit: `courses/<id>/` (with `elevation-cache.json` if
  present), `data/<id>.json`, `data/courses.json`, `data/contours/<id>/` (if generated), `branding/<name>.json`
  (if a new identity).

## Remove a course

Delete `courses/<id>/`, `data/<id>.json`, `data/contours/<id>/` and its entry in `data/courses.json`.
