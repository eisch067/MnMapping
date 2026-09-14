import type { LayerDefinition } from "./types";
import { authoritativeElevationSource } from "../elevation";

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
  {
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
  },
];
