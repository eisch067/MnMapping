export interface ElevationAnalysisSource {
  id: string;
  name: string;
  serviceUrl: string;
  browserUrl: string;
  resolution: string;
  horizontalReference: string;
  verticalReference: string;
  acquisitionYears: string;
  capabilities: readonly ("point-elevation" | "profile" | "slope" | "aspect" | "contours" | "area-statistics")[];
  agency: string;
}

export const authoritativeElevationSource: ElevationAnalysisSource = {
  id: "mngeo-second-generation-lidar-dem",
  name: "Minnesota Second-Generation Seamless Lidar DEM",
  serviceUrl: "https://enterprise.gisdata.mn.gov/agsimg/rest/services/MnTopo/2nd_Generation_Seamless_Lidar_DEM/ImageServer",
  browserUrl: "/api/gis-proxy/mngeo-dem/MnTopo/2nd_Generation_Seamless_Lidar_DEM/ImageServer",
  resolution: "0.5 meter",
  horizontalReference: "NAD83(2011) / UTM zone 15N (EPSG:6344)",
  verticalReference: "NAVD88 height (EPSG:5703)",
  acquisitionYears: "2021–2024",
  capabilities: ["point-elevation", "profile", "slope", "aspect", "contours", "area-statistics"],
  agency: "Minnesota Geospatial Information Office and Minnesota Department of Natural Resources",
};
