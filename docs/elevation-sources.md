# Elevation and terrain sources

Verified against live service metadata on September 13, 2026.

## Authoritative analytical elevation

The authoritative source is MnGeo's **Second-Generation Seamless Lidar DEM**:

- Service: `https://enterprise.gisdata.mn.gov/agsimg/rest/services/MnTopo/2nd_Generation_Seamless_Lidar_DEM/ImageServer`
- Resolution: 0.5 meter
- Source acquisition: 2021–2024 statewide lidar program
- Horizontal reference: NAD83(2011) / UTM zone 15N (EPSG:6344)
- Vertical reference: NAVD88 height (EPSG:5703)
- Quality: final-vertical-accuracy-checked data meeting or exceeding USGS QL1
- Maintainers: MnGeo and Minnesota DNR, with federal, state, and county partners

The application displays this service through a server-rendered hillshade. Its analytical service definition is stored separately so future point elevation, profile, slope, aspect, contour, and area-statistics tools can use the authoritative values without treating a visualization tile as measurement data.

The ImageServer does not provide CORS headers, so it uses the same read-only, allowlisted proxy pattern as the county services. No statewide elevation files are downloaded or bundled.

## Interactive terrain geometry

The 3D globe uses Esri WorldElevation3D Terrain3D, an anonymous LERC-tiled elevation service supported directly by Cesium's `ArcGISTiledElevationTerrainProvider`.

This is intentionally identified as a visualization surface, not MnMapping's authoritative elevation source. Its multiresolution pyramid is more practical for interactive terrain than attempting to tessellate Minnesota's raw 0.5 m statewide DEM in the browser. Imagery layers remain separate and are draped by Cesium over whichever terrain provider is active.
