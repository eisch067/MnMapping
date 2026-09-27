# Elevation and terrain sources

Verified against live service metadata on September 27, 2026.

## Authoritative analytical elevation

The authoritative source is MnGeo's **Second-Generation Seamless Lidar DEM**:

- Service: `https://enterprise.gisdata.mn.gov/agsimg/rest/services/MnTopo/2nd_Generation_Seamless_Lidar_DEM/ImageServer`
- Resolution: 0.5 meter
- Source acquisition: 2021–2023 statewide lidar program
- Horizontal reference: NAD83(2011) / UTM zone 15N (EPSG:6344)
- Vertical reference: NAVD88 height (EPSG:5703)
- Quality: final-vertical-accuracy-checked data meeting or exceeding USGS QL1
- Maintainers: MnGeo and Minnesota DNR, with federal, state, and county partners

The application displays this service through a server-rendered hillshade. In the personal build, direct line distance combines ellipsoidal horizontal distance with NAVD88 elevation change, while ground distance sums short geodesic profile segments over bilinearly sampled DEM elevations. Profiles are capped at 2,000 samples and make no persistent copy of source data. These values are estimates: the service's 0.5 m raster resolution and interpolation do not replace survey-grade measurements. MNDNR must be acknowledged as having contributed data to the product. The service definition is stored separately so future point elevation, slope, aspect, contour, and area-statistics tools can use authoritative values without treating visualization tiles as measurements.

The contour overlays are generated on demand from the same source and are visualizations derived from the DEM rather than separately surveyed contour datasets. The 10-foot layer uses a 3.048-meter interval for neighborhood and property-scale interpretation and is restricted to views below a 40-kilometer camera height, since each visible tile triggers a server-side raster computation rather than a cached tile. The 2-foot layer uses a 0.6096-meter interval and is restricted to property-scale views below a 10-kilometer camera height. Both are kept disabled with a zoom prompt in the Layers panel at broader scales.

The ImageServer does not provide CORS headers, so the browser uses the same read-only, allowlisted proxy pattern as county services. The app requests samples in batches of at most 80 points; no statewide elevation files are downloaded or bundled.

In the personal build, the Terrain sheet offers an elevation threshold mask rendered on the server with the ImageServer Remap and Colormap raster functions, plus a terrain viewshed computed in a Web Worker from a bounded 10 m sample window. Viewsheds cap the input at 40,000 cells, support observer height and range, and cancel in-flight sampling and worker work when parameters change. They are estimates based on terrain only: buildings, vegetation, and smaller terrain features are not modeled. Saving writes the mask and parameters to this browser's local storage only; it is temporary, is not synchronized or exported, and is not a My Data item. The sheet and rendering route are omitted from the public build.

## Interactive terrain geometry

The personal build uses Esri WorldElevation3D Terrain3D, an anonymous LERC-tiled elevation service supported directly by Cesium's `ArcGISTiledElevationTerrainProvider`. The terrain layer is omitted from the public build.

This is intentionally identified as a visualization surface, not MnMapping's authoritative elevation source. Its multiresolution pyramid is more practical for interactive terrain than attempting to tessellate Minnesota's raw 0.5 m statewide DEM in the browser. Imagery is draped by Cesium; vector overlays, polygons, and My Data lines are clamped to the active surface. The Layers sheet lists visible overlays and My Data in its draping status.
