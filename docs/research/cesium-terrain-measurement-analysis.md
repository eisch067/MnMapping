# Cesium terrain measurement and analysis techniques

Research for **Choose feasible Cesium terrain measurement and analysis techniques**. Verified September 23, 2026 against MnMapping's map code, CesiumJS 1.132 source, and the live Minnesota elevation service.

## Decision

The requested features are feasible, but they should not all use the same elevation source:

- Use Cesium ground geometry for visual draping of parcels, public-land boundaries, DNR boundaries, personal lines, and personal polygons.
- Use the Minnesota second-generation lidar DEM for reported elevation values, direct/ground measurements, authoritative threshold shading, line-of-sight tests, and viewsheds.
- Treat the Esri World Elevation terrain provider as the interactive display mesh only. Its current level of detail can be sampled for previews, but it must not become the source of a measurement labeled as Minnesota lidar-derived.
- Ship terrain-clamped overlays and line measurements as normal features. Ship threshold shading as an authoritative DEM imagery layer. Keep viewshed behind an experimental flag until accuracy and mobile performance are benchmarked.

This division follows the repository's existing source model and the state's service metadata. The live Minnesota service is an uncached, single-band, floating-point 0.5 m bare-earth DEM in NAD83(2011) / UTM zone 15N with NAVD88 heights. It advertises analysis and raster-function support but not an elevation tile cache. The service says acquisition occurred from 2021 through 2023 and that the seamless mosaic includes only final-vertical-accuracy-checked data meeting or exceeding USGS QL1. [Minnesota DEM service metadata](https://enterprise.gisdata.mn.gov/agsimg/rest/services/MnTopo/2nd_Generation_Seamless_Lidar_DEM/ImageServer). For context, USGS defines QL1 as 0.5 m DEM cells and 10 cm RMSEz, but that specification is not a promise that every derived value has 10 cm accuracy. [USGS topographic data quality levels](https://www.usgs.gov/3d-elevation-program/topographic-data-quality-levels-qls).

## Version note

`package.json` declares `cesium: ^1.132.0`, while the current lockfile resolves Cesium 1.145.0. The techniques below were checked directly against the official 1.132.0 npm source requested by the ticket; the APIs also remain present in the current Cesium reference documentation. Implementation should either pin the intended minor version or rerun the focused checks against the lockfile version before merging. This matters because the caret range does not actually keep the application on 1.132.

## Ground-clamped vector overlays

### Recommended implementation

Load GeoJSON with `clampToGround: true` and stop assigning `polygon.height = 0`. Cesium 1.132's GeoJSON loader documents that this option clamps polygons and line strings; its source sets line clamping and deliberately omits the ellipsoid-height assignment for clamped polygons. [Cesium GeoJSON API](https://cesium.com/learn/cesiumjs/ref-doc/GeoJsonDataSource.html), [Cesium 1.132 source](https://github.com/CesiumGS/cesium/blob/1.132/packages/engine/Source/DataSources/GeoJsonDataSource.js).

MnMapping currently defeats that path twice: `geoJsonStyle()` passes `clampToGround: false`, then `decorateGeoJson()` assigns every polygon a height of zero. Personal data repeats the same pattern. That explains why fills appear attached to the ellipsoid while the terrain rises above them. Polylines are subsequently clamped, so the current result is internally inconsistent.

Apply these rules across parcels, public lands, DNR boundaries, and My Data:

1. Polygons and line strings without intentional altitude use the GeoJSON ground path.
2. Point billboards/labels use `HeightReference.CLAMP_TO_GROUND` (or the terrain-only reference available in the installed version) rather than a zero-height Cartesian position. Cesium's official draping guide uses this height-reference model. [Cesium vector draping guide](https://cesium.com/learn/cesiumjs-learn/drape-and-style-vector-data-on-terrain-and-3d-tile/).
3. Do not pre-bake terrain heights into administrative boundaries. Ground geometry follows terrain-provider and vertical-exaggeration changes without rewriting every vertex.
4. If polygon outlines still show platform-specific artifacts, render the fill as a ground polygon and its rings as separate clamped polylines. Do not restore a constant polygon height.

The entity layer is the smallest change and preserves selection. If very large static DNR collections later make entity rendering expensive, batch them into `GroundPrimitive` / `GroundPolylinePrimitive` objects by style and viewport. Cesium describes `GroundPrimitive` as geometry draped over terrain or 3D Tiles, creates it asynchronously on a worker by default, compresses vertices by default, and can save GPU memory by disabling picking where selection is unnecessary. [Cesium GroundPrimitive API](https://cesium.com/learn/cesiumjs/ref-doc/GroundPrimitive.html). Keep entity rendering for editable personal geometry.

`globe.depthTestAgainstTerrain` is not the clamping mechanism. It can be enabled selectively so non-ground points and labels are hidden by intervening terrain, but Cesium warns that terrain LOD changes and numerical noise can make surface primitives disappear. [Cesium Globe API](https://cesium.com/learn/cesiumjs/ref-doc/Globe.html).

## Distance definitions and calculations

Store all canonical results in meters and convert only for display. The popup can show feet, yards, miles, meters, and kilometers; the line label uses the configured primary dimension.

| Result | Definition | Technique | Availability |
| --- | --- | --- | --- |
| Horizontal distance | Sum of geodesic segment lengths on the WGS84 ellipsoid, ignoring elevation | `EllipsoidGeodesic.surfaceDistance` for every adjacent vertex pair | Immediate and offline |
| Direct distance | Sum of straight slant distances between adjacent vertices, using sampled endpoint elevations | For normal recreation-scale segments, `hypot(horizontal geodesic distance, elevation difference)` avoids mixing NAVD88 heights with Cesium ellipsoidal Cartesian heights | Async when endpoint elevations are not cached |
| Ground distance | Sum of short 3D steps along a densified terrain profile | Request ordered DEM samples along the polyline, then sum `hypot(horizontal sample spacing, elevation difference)` | Async and resolution-dependent |
| Line of sight | Whether any sampled terrain point rises above the observer-to-target sight ray | Use the same ordered profile, observer height, and target height; report blocked/clear and sampling resolution, not a fourth distance | Experimental analysis |

Cesium's `EllipsoidGeodesic` explicitly exposes surface distance and geodesic interpolation, and `Cartesian3.distance` is available for true 3D Cartesian points. [EllipsoidGeodesic API](https://cesium.com/learn/cesiumjs/ref-doc/EllipsoidGeodesic.html), [Cartesian3 API](https://cesium.com/learn/cesiumjs/ref-doc/Cartesian3.html). Do not put raw NAVD88 heights directly into WGS84 Cartesian coordinates and call that survey-grade 3D distance: NAVD88 is an orthometric vertical datum while Cesium Cartesian conversion expects ellipsoid-relative height. The local `hypot` calculation uses elevation *differences* and avoids importing a geoid-conversion model for the first release.

For analytical profiles, use the Minnesota ImageServer's `getSamples` operation through the existing allowlisted proxy. The ArcGIS operation accepts a polyline plus sample distance or sample count and returns locations, pixel values, and source resolution; its documented approximate default maximum is 1,000 samples. [ArcGIS Get Samples](https://developers.arcgis.com/rest/services-reference/enterprise/get-samples/). Choose sample spacing adaptively and expose it in the result. Prefer native or near-native spacing for short property lines, coarser spacing for long routes, and enforce a sample-count budget; split a line only if benchmarks show multiple requests remain responsive.

Cesium's `sampleTerrainMostDetailed` is useful for a quick visual-mesh preview, not the saved analytical value. It samples the maximum available level of the active terrain provider and throws if that provider lacks tile availability. [Cesium `sampleTerrainMostDetailed` documentation](https://cesium.com/learn/cesiumjs/ref-doc/global.html), [Cesium 1.132 source](https://github.com/CesiumGS/cesium/blob/1.132/packages/engine/Source/Core/sampleTerrainMostDetailed.js). It would also make reported measurements silently depend on whichever display terrain is active.

## Absolute-elevation threshold shading

Two implementations are feasible, but only one should carry an authoritative label.

### Recommended: server-rendered Minnesota DEM mask

Create an imagery layer backed by the Minnesota DEM `exportImage` operation. Convert the user's feet threshold to meters NAVD88, then send a `Remap` + `Colormap` rendering rule that retains values below the threshold and makes unmatched cells transparent. ArcGIS documents `exportImage` rendering rules and the JSON form of nested `Remap` and `Colormap` functions. [Export Image](https://developers.arcgis.com/rest/services-reference/enterprise/export-image/), [raster function objects](https://developers.arcgis.com/rest/services-reference/enterprise/raster-function-objects/).

A live probe against the official service succeeded with a nested `Remap`/`Colormap` rule and returned a transparent PNG. This reuses MnMapping's existing ImageServer-to-`UrlTemplateImageryProvider` route, naturally drapes over terrain, and leaves raster work on the server. Debounce threshold changes, abort superseded requests, impose the same camera-height/zoom limits used for dynamic contours, and cache by rounded threshold plus tile coordinates.

### Preview-only alternative: Cesium globe material

Cesium's `createElevationBandMaterial()` maps color bands to terrain heights and says hundreds of entries are relatively cheap. [Cesium elevation-band material](https://cesium.com/learn/cesiumjs/ref-doc/global.html). This is appropriate for an instant slider preview but reflects the Esri visualization mesh, not the Minnesota 0.5 m NAVD88 DEM. It also replaces the globe's single material slot, so it must be composed with any other globe material. Do not show its threshold as an authoritative Minnesota elevation result.

## Terrain-only viewshed

CesiumJS 1.132 has no public, first-class terrain viewshed API. `Scene.sampleHeightMostDetailed` only samples currently rendered scene geometry and requires 3D mode plus depth-texture support; that makes it view-dependent and unsuitable for a reproducible saved result. [Cesium Scene sampling API](https://cesium.com/learn/cesiumjs/ref-doc/Scene.html). Shadow maps answer illumination from a light, not a bounded observer visibility analysis.

The feasible experiment is a browser-side raster viewshed over a bounded Minnesota DEM window:

1. User drops an observer and sets eye height and maximum range.
2. Request a square floating-point TIFF window from the official DEM with `exportImage`, explicitly choosing an output cell size derived from range and a fixed cell budget. A live probe verified that the service returns F32 TIFF windows. Its live limits are 15,000 pixels wide and 4,100 high, but MnMapping should use a much smaller symmetric cap for predictable phone memory.
3. Decode the raster and run the visibility calculation in a Web Worker. For each radial direction, walk cells outward and track the greatest vertical angle seen so far; a cell is visible when its observer-to-cell angle is not below that horizon. Add the configured observer height to the DEM value at the origin. Optionally include Earth curvature/refraction only after the intended maximum range is fixed and documented.
4. Transfer a compact visibility bitmap back to the UI and display it as a bounded ground imagery overlay. Keep results temporary initially; if saving is later enabled, store observer, height, range, cell size, source/version, and algorithm parameters rather than the generated raster.

This approach is preferable to issuing thousands of `getSamples` requests. It fetches one bounded raster, operates on typed arrays off the UI thread, is independent of current camera tiles, and uses the authoritative DEM. Server-side viewshed would be better at large ranges, but it requires a published ArcGIS geoprocessing/raster-analysis task. Esri's official example explicitly relies on such a GP service, and the Minnesota DEM endpoint advertises only `Catalog,Image,Metadata`; no public viewshed task was found. [Esri geoprocessing viewshed example](https://developers.arcgis.com/javascript/latest/sample-code/geoprocessing-viewshed/index.html), [ArcGIS Create Viewshed REST operation](https://developers.arcgis.com/rest/services-reference/enterprise/create-viewshed/).

Do not hard-code a distance cap before benchmarking. Instead, fix a maximum raster dimension for each device class (start experiments around 1,024 square on phones and 2,048 square on desktop), derive cell size from requested range, show the effective resolution, and reject a request if its resolution would make the answer misleading. Recompute only after the user releases a range/height control, allow cancellation, and retain one decoded DEM window while parameters change.

## Accuracy disclosures

Every terrain-derived popup or analysis should identify:

- Source: **Minnesota Second-Generation Seamless Lidar DEM** for analytical results, or **Esri visualization terrain** for previews.
- Vertical reference: **NAVD88 meters** for Minnesota DEM values; convert to feet only for display.
- Data character: bare-earth terrain. Trees, buildings, stands, and other above-ground obstructions are not modeled.
- Acquisition/source date: the official service currently says **2021–2023**. The repository's `2021–2024` text should be reconciled before release.
- Effective sample or cell spacing and whether the result was resampled.
- Status: `estimate`, not navigation, survey, legal-boundary, safety, or hunting-regulation authority.

Viewshed and line-of-sight disclosures must add that visibility can change between sampled cells; terrain classification, hydro-flattened water, DEM seams/voids, curvature choices, and observer/target height all affect results. Ground distance must state that it follows the sampled bare-earth profile rather than a trail, vegetation, snow, or structures. Parcel and DNR boundary draping changes only rendering height and does not improve horizontal boundary accuracy.

## Browser-performance guardrails

- Keep vector fetches viewport-bounded as they are now; clamp after load and continue unloading replaced extents.
- Prefer entity ground geometry for editable/pickable objects, and batch only static high-volume layers after profiling.
- Calculate horizontal distance immediately; lazy-load authoritative direct/ground/LOS values and cache them by geometry revision plus sampling settings.
- Put TIFF decode and viewshed/profile loops in Web Workers; transfer `ArrayBuffer`s rather than cloning large arrays.
- Cap raster dimensions and profile sample counts, show progress, support abort, and never recompute continuously while dragging.
- Prefer the server-rendered PNG threshold mask to downloading a DEM for simple shading.
- On mobile, consider Cesium's `requestRenderMode` after interaction testing; Cesium documents that it reduces CPU/GPU use and battery consumption when scenes are idle, at the cost of requesting frames after external changes. [Cesium Viewer API](https://cesium.com/learn/cesiumjs/ref-doc/Viewer.html).
- Treat lower visual terrain detail as a display optimization, never as a reason to lower or relabel analytical accuracy. Cesium's globe `maximumScreenSpaceError` explicitly trades visual quality for performance. [Cesium Globe API](https://cesium.com/learn/cesiumjs/ref-doc/Globe.html).

## Acceptance checks for later implementation

1. A parcel polygon, public-land polygon, DNR polygon, personal polygon, and personal line remain attached to slopes while orbiting and while changing vertical exaggeration.
2. A clamped feature remains selectable, and its ID/attributes survive any entity-to-primitive optimization.
3. Horizontal distance matches a known geodesic fixture; direct distance equals horizontal distance when endpoint elevations match; ground distance never falls below horizontal distance within numeric tolerance.
4. Ground distance converges as sample spacing is reduced on a fixed test line, and the UI reports that spacing.
5. A threshold mask tested at known DEM points classifies values on both sides of the threshold and labels the value NAVD88.
6. A synthetic DEM proves viewshed behavior for flat ground, a single blocking ridge, and an observer-height change before testing against Minnesota terrain.
7. Phone benchmarks record fetch bytes, decode time, worker compute time, peak memory, and interaction frame rate for the chosen raster caps.

## Primary sources

- [Minnesota second-generation seamless lidar DEM service](https://enterprise.gisdata.mn.gov/agsimg/rest/services/MnTopo/2nd_Generation_Seamless_Lidar_DEM/ImageServer)
- [Minnesota DNR lidar project](https://www.dnr.state.mn.us/maps/lidar/index.html)
- [USGS topographic data quality levels](https://www.usgs.gov/3d-elevation-program/topographic-data-quality-levels-qls)
- [CesiumJS reference documentation](https://cesium.com/learn/cesiumjs/ref-doc/)
- [CesiumJS 1.132 engine source](https://github.com/CesiumGS/cesium/tree/1.132/packages/engine/Source)
- [ArcGIS Image Service REST API](https://developers.arcgis.com/rest/services-reference/enterprise/image-service/)
