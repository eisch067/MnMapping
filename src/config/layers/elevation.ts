import type { LayerDefinition } from "./types";
import { authoritativeElevationSource } from "../elevation";
import { isPersonalMode } from "../appMode";

// A Cesium 3D-mesh terrain layer (Esri World Elevation 3D) is only embedded in the personal
// build. The 2026-09 licensing audit (docs/licensing/RISK-REGISTER.md, item H1) found Esri's
// own terms require an ArcGIS Online subscription for this exact service, which the public
// build doesn't have. The statewide lidar DEM below cannot be substituted directly — its
// ArcGIS Image Service reports capabilities "Catalog,Image,Metadata" with no tile cache, not
// the "Elevation" tile-cache profile Cesium's ArcGISTiledElevationTerrainProvider requires —
// so real mesh-based 3D terrain for the public build needs either a request to MnGeo to
// publish an elevation-capable service, or new tiling infrastructure. The hillshade/contour
// layers below still give a shaded-relief look on the flat globe in the public build, and the
// tilted "Terrain view" camera preset still works without any terrain-provider swap.
const esriWorldElevationTerrainLayer: LayerDefinition = {
  id: "esri-world-elevation-terrain",
  name: "3D Terrain",
  category: "elevation",
  sourceType: "arcgis-terrain",
  url: "https://elevation3d.arcgis.com/arcgis/rest/services/WorldElevation3D/Terrain3D/ImageServer",
  defaultVisible: false,
  defaultOpacity: 1,
  attribution: "Esri World Elevation 3D",
  agency: "Esri and contributing elevation agencies, including USGS",
  resolution: "Multiresolution visualization pyramid",
  description: "Coarser visualization terrain used only for interactive 3D. Minnesota's 0.5 m lidar DEM remains the authoritative analytical source.",
};

export const elevationLayers: LayerDefinition[] = [
  {
    id: "mngeo-lidar-hillshade",
    name: "Second-Generation Lidar Hillshade",
    category: "elevation",
    sourceType: "arcgis-imageserver",
    url: authoritativeElevationSource.browserUrl,
    sourceUrl: authoritativeElevationSource.serviceUrl,
    defaultVisible: false,
    defaultOpacity: 0.72,
    maximumLevel: 18,
    attribution: "Minnesota second-generation lidar DEM",
    agency: authoritativeElevationSource.agency,
    bounds: { west: -97.38, south: 43.37, east: -89.33, north: 49.4 },
    year: authoritativeElevationSource.acquisitionYears,
    resolution: authoritativeElevationSource.resolution,
    description: "A browser-rendered hillshade of the authoritative seamless bare-earth DEM. The analytical source remains separate for future elevation tools.",
    options: { renderingRule: "Hillshade" },
  },
  ...(isPersonalMode ? [esriWorldElevationTerrainLayer] : []),
  {
    id: "mngeo-lidar-contours-10ft",
    name: "Lidar Contours — 10 ft",
    category: "elevation",
    sourceType: "arcgis-imageserver",
    url: authoritativeElevationSource.browserUrl,
    sourceUrl: authoritativeElevationSource.serviceUrl,
    defaultVisible: false,
    defaultOpacity: 0.82,
    maximumLevel: 18,
    attribution: "Minnesota second-generation lidar DEM",
    agency: authoritativeElevationSource.agency,
    bounds: { west: -97.38, south: 43.37, east: -89.33, north: 49.4 },
    year: authoritativeElevationSource.acquisitionYears,
    resolution: "10-foot interval, dynamically derived",
    description: "Ten-foot-equivalent contours generated on demand from the authoritative 0.5 m lidar DEM (3.048 m source interval). Best used at neighborhood and property scales.",
    options: {
      format: "png32",
      transparent: true,
      renderingRuleJson: "{\"rasterFunction\":\"Contour\",\"rasterFunctionArguments\":{\"ContourType\":0,\"ZBase\":0,\"ZFactor\":1,\"ContourInterval\":3.048}}",
    },
  },
  {
    id: "mngeo-lidar-contours-2ft",
    name: "Lidar Contours — 2 ft",
    category: "elevation",
    sourceType: "arcgis-imageserver",
    url: authoritativeElevationSource.browserUrl,
    sourceUrl: authoritativeElevationSource.serviceUrl,
    defaultVisible: false,
    defaultOpacity: 0.88,
    minimumLevel: 14,
    maximumLevel: 18,
    attribution: "Minnesota second-generation lidar DEM",
    agency: authoritativeElevationSource.agency,
    bounds: { west: -97.38, south: 43.37, east: -89.33, north: 49.4 },
    year: authoritativeElevationSource.acquisitionYears,
    resolution: "2-foot interval, dynamically derived",
    description: "Two-foot-equivalent contours generated on demand from the authoritative 0.5 m lidar DEM (0.6096 m source interval). Available only at property scale to limit clutter and rendering cost.",
    unavailableMessage: "zoom in to access 2' contours",
    options: {
      format: "png32",
      transparent: true,
      renderingRuleJson: "{\"rasterFunction\":\"Contour\",\"rasterFunctionArguments\":{\"ContourType\":0,\"ZBase\":0,\"ZFactor\":1,\"ContourInterval\":0.6096}}",
      maxCameraHeight: 10_000,
    },
  },
];
