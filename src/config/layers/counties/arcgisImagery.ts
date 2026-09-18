import type { CountyDefinition, LayerBounds, LayerDefinition, LayerSourceType } from "../types";

const verifiedAt = "2026-09-18";

type ArcGisImagerySpec = {
  countyId: string;
  serviceId: string;
  name: string;
  year: number;
  sourceType: Extract<LayerSourceType, "arcgis-mapserver" | "arcgis-imageserver">;
  proxyUrl: string;
  sourceUrl: string;
  resolution: string;
  detail: string;
  dynamic?: boolean;
};

const specs: readonly ArcGisImagerySpec[] = [
  map("aitkin", "2024-pictometry", "2024 Aitkin County Pictometry", 2024, "aitkin-imagery/2024PictometryImagery/MapServer", "https://gisweb.co.aitkin.mn.us/arcgis/rest/services/2024PictometryImagery/MapServer", "Not published", "Official county aerial mosaic."),
  map("anoka", "2026-spring", "2026 Anoka County spring", 2026, "anoka-imagery/Aerials/MapServer", "https://gis.anokacountymn.gov/anoka_gis/rest/services/Aerials/MapServer", "6 inches", "Spring county aerial mosaic.", true),
  map("anoka", "2025-fall", "2025 Anoka County fall", 2025, "anoka-imagery/Aerials_Fall/MapServer", "https://gis.anokacountymn.gov/anoka_gis/rest/services/Aerials_Fall/MapServer", "6 inches", "Fall county aerial mosaic.", true),
  map("anoka", "2024-spring", "2024 Anoka County spring", 2024, "anoka-imagery/Aerials_2024/MapServer", "https://gis.anokacountymn.gov/anoka_gis/rest/services/Aerials_2024/MapServer", "6 inches", "Spring county aerial mosaic.", true),
  map("anoka", "2020", "2020 Anoka County", 2020, "anoka-imagery/Aerials_2020/MapServer", "https://gis.anokacountymn.gov/anoka_gis/rest/services/Aerials_2020/MapServer", "Approximately 6 inches", "County aerial mosaic.", true),
  map("anoka", "2017", "2017 Anoka County", 2017, "anoka-imagery/Aerials_2017/MapServer", "https://gis.anokacountymn.gov/anoka_gis/rest/services/Aerials_2017/MapServer", "Approximately 6 inches", "County aerial mosaic.", true),
  map("big-stone", "2026-eagleview", "2026 Big Stone County EagleView", 2026, "big-stone-imagery/Imagery/2026Eagleview/MapServer", "https://gis.bigstonecounty.gov/arcgis/rest/services/Imagery/2026Eagleview/MapServer", "Not published", "Official county aerial mosaic."),
  map("blue-earth", "2025", "2025 Blue Earth County", 2025, "blue-earth-imagery/Basemap/Imagery2025TileService/MapServer", "https://gis.blueearthcountymn.gov/server/rest/services/Basemap/Imagery2025TileService/MapServer", "Not published", "Official county aerial mosaic."),
  map("carver", "2026", "2026 Carver County", 2026, "carver-imagery/2026_Tiled_Imagery/MapServer", "https://tiles.arcgis.com/tiles/wMZT8kNwa6tOxhKg/arcgis/rest/services/2026_Tiled_Imagery/MapServer", "Not published", "Official county tiled imagery."),
  map("cass", "2024-pictometry", "2024 Cass County Pictometry", 2024, "cass-imagery/2024_Pictometry/MapServer", "https://cassweb.casscountymn.gov/arcgis/rest/services/2024_Pictometry/MapServer", "Not published", "Spring county aerial mosaic."),
  map("chippewa", "2025-eagleview", "2025 Chippewa County EagleView", 2025, "chippewa-imagery/ChippewaPictometry2025/MapServer", "https://gis.chippewa.mn/arcgis/rest/services/ChippewaPictometry2025/MapServer", "Not published", "Official county aerial mosaic."),
  map("chisago", "2025-eagleview", "2025 Chisago County EagleView", 2025, "chisago-imagery/2025Aerials/MapServer", "https://gis.chisagocounty.us/arcgis/rest/services/2025Aerials/MapServer", "Not published", "April county aerial mosaic.", true),
  image("clay", "2025-eagleview", "2025 Clay County EagleView", 2025, "clay-imagery/Clay_2025Imagery/ImageServer", "https://map.claycountymn.gov/arcgis/rest/services/Clay_2025Imagery/ImageServer", "Approximately 6 inches", "May county aerial mosaic."),
  map("clearwater", "2019-pictometry", "2019 Clearwater County Pictometry", 2019, "clearwater-imagery/Imagery/Pictometry_2019/MapServer", "https://map.co.clearwater.mn.us/arcgis/rest/services/Imagery/Pictometry_2019/MapServer", "6 inches", "Official county aerial mosaic."),
  map("crow-wing", "2025", "2025 Crow Wing County", 2025, "crow-wing-imagery/CWC_2025_WebMercator/MapServer", "https://gis.crowwing.us/cwc_external_main/rest/services/CWC_2025_WebMercator/MapServer", "Not published", "Official county aerial mosaic."),
  image("dakota", "2025-spring", "2025 Dakota County spring", 2025, "dakota-imagery/AerialPhotography/2025AirPhotoLeafOff6Inch_Spring/ImageServer", "https://gisimg.co.dakota.mn.us/arcgis/rest/services/AerialPhotography/2025AirPhotoLeafOff6Inch_Spring/ImageServer", "6 inches", "Spring leaf-off county imagery."),
  image("dakota", "2025-fall", "2025 Dakota County fall", 2025, "dakota-imagery/AerialPhotography/2025AirPhotoLeafOn6Inch_Fall/ImageServer", "https://gisimg.co.dakota.mn.us/arcgis/rest/services/AerialPhotography/2025AirPhotoLeafOn6Inch_Fall/ImageServer", "6 inches", "Fall leaf-on county imagery."),
  map("dodge", "2026", "2026 Dodge County", 2026, "dodge-imagery/ImageryDC/Dodge_County_2026/MapServer", "https://maps.co.goodhue.mn.us/server/rest/services/ImageryDC/Dodge_County_2026/MapServer", "Not published", "Official county aerial mosaic.", true),
  map("goodhue", "2025-eagleview", "2025 Goodhue County EagleView", 2025, "goodhue-imagery/ImageryGC/T2025/MapServer", "https://maps.co.goodhue.mn.us/server/rest/services/ImageryGC/T2025/MapServer", "Not published", "Official county aerial mosaic.", true),
  map("grant", "2017-pictometry", "2017 Grant County Pictometry", 2017, "grant-imagery/Grant/Pictometry2017/MapServer", "https://gis.co.grant.mn.us/arcgis/rest/services/Grant/Pictometry2017/MapServer", "Approximately 6 inches", "Official county aerial mosaic."),
  map("marshall", "2024-eagleview", "2024 Marshall County EagleView", 2024, "marshall-imagery/Marshall/Marshall_2024_Eagleview_Imagery/MapServer", "https://gis.co.marshall.mn.us/server/rest/services/Marshall/Marshall_2024_Eagleview_Imagery/MapServer", "Not published", "Official county aerial mosaic."),
  map("marshall", "2020", "2020 Marshall County", 2020, "marshall-imagery/Marshall/2020_Aerial/MapServer", "https://gis.co.marshall.mn.us/server/rest/services/Marshall/2020_Aerial/MapServer", "Not published", "Official county aerial mosaic."),
  map("mcleod", "2026", "2026 McLeod County", 2026, "mcleod-imagery/2026_McLeod_County/MapServer", "https://tiles.arcgis.com/tiles/7sSDkfIZpd2ReAg5/arcgis/rest/services/2026_McLeod_County/MapServer", "Not published", "Official county aerial mosaic."),
  map("mille-lacs", "2026", "2026 Mille Lacs County", 2026, "mille-lacs-imagery/MilleLacs_2026CountyFlyover/MapServer", "https://gis.co.mille-lacs.mn.us/arcgis/rest/services/MilleLacs_2026CountyFlyover/MapServer", "Not published", "Official county flyover mosaic.", true),
  map("mower", "2023-spring", "2023 Mower County spring", 2023, "mower-imagery/Imagery/County_Imagery_2023_Spring/MapServer", "https://gisweb.co.mower.mn.us/server/rest/services/Imagery/County_Imagery_2023_Spring/MapServer", "6 inches", "Spring four-band county orthophotography."),
  map("otter-tail", "2024", "2024 Otter Tail County", 2024, "otter-tail-imagery/Photo2024_0/MapServer", "https://tiles.arcgis.com/tiles/Pg1yLLk3jMuhxBKI/arcgis/rest/services/Photo2024_0/MapServer", "Not published", "Official county photo basemap."),
  map("pennington", "2023", "2023 Pennington County", 2023, "pennington-imagery/Pennington/PenningtonImagery2023/MapServer", "https://gismap.co.pennington.mn.us/arcgis/rest/services/Pennington/PenningtonImagery2023/MapServer", "Not published", "Official county aerial mosaic.", true),
  map("pipestone", "2020-pictometry", "2020 Pipestone County Pictometry", 2020, "pipestone-imagery/Imagery/2020_Aerial/MapServer", "https://gis.pcmn.us/arcgis/rest/services/Imagery/2020_Aerial/MapServer", "Not published", "Official county aerial mosaic."),
  map("pope", "2023-pictometry", "2023 Pope County Pictometry", 2023, "pope-imagery/Imagery/2023_Pictometry/MapServer", "https://gis.popecountymn.gov/arcgis/rest/services/Imagery/2023_Pictometry/MapServer", "Not published", "Official county aerial mosaic."),
  map("scott", "2026-spring", "2026 Scott County spring", 2026, "scott-imagery/Imagery/ORTHO2026/MapServer", "https://gis.co.scott.mn.us/arcgis/rest/services/Imagery/ORTHO2026/MapServer", "Approximately 3 inches", "Spring county orthophotography."),
  map("sherburne", "2024", "2024 Sherburne County", 2024, "sherburne-imagery/Imagery/Aerials2024/MapServer", "https://gis.co.sherburne.mn.us/arcgis3/rest/services/Imagery/Aerials2024/MapServer", "Not published", "Official county aerial mosaic.", true),
  map("stearns", "2024-spring", "2024 Stearns County spring", 2024, "stearns-imagery/Raster/Aerial2024/MapServer", "https://gis.co.stearns.mn.us/arcgis/rest/services/Raster/Aerial2024/MapServer", "Not published", "Spring county aerial mosaic."),
  map("steele", "2025", "2025 Steele County", 2025, "steele-imagery/Portal_BaseData/2025_Imagery_cache/MapServer", "https://gis.steele.mn/server/rest/services/Portal_BaseData/2025_Imagery_cache/MapServer", "Not published", "Official county aerial mosaic."),
  map("stevens", "2020-pictometry", "2020 Stevens County Pictometry", 2020, "stevens-imagery/2020Pictometry/MapServer", "https://gis.co.stevens.mn.us/arcgis/rest/services/2020Pictometry/MapServer", "Not published", "Official county aerial mosaic."),
  map("traverse", "2022-pictometry", "2022 Traverse County Pictometry", 2022, "traverse-imagery/2022_Pictometry_Traverse/MapServer", "https://gis.co.traverse.mn.us/arcgis/rest/services/2022_Pictometry_Traverse/MapServer", "Not published", "Official county aerial mosaic."),
  map("wadena", "2025-eagleview", "2025 Wadena County EagleView", 2025, "wadena/Pictometry/2025Eagleview/MapServer", "https://gis.co.wadena.mn.us/arcgis/rest/services/Pictometry/2025Eagleview/MapServer", "Not published", "Official county aerial mosaic.", true),
  map("washington", "2026", "2026 Washington County", 2026, "washington-imagery/Aerials/Aerials2026/MapServer", "https://maps.co.washington.mn.us/arcgis/rest/services/Aerials/Aerials2026/MapServer", "Not published", "Official county aerial mosaic."),
  map("wilkin", "2026-eagleview", "2026 Wilkin County EagleView", 2026, "wilkin-imagery/EagleView_2026/MapServer", "https://gisweb.co.wilkin.mn.us/arcgis/rest/services/EagleView_2026/MapServer", "Not published", "Official county aerial mosaic."),
  map("yellow-medicine", "2025-eagleview", "2025 Yellow Medicine County EagleView", 2025, "yellow-medicine-imagery/Pictometry/2025_Eagleview/MapServer", "https://gis.co.ym.mn.gov/arcgis/rest/services/Pictometry/2025_Eagleview/MapServer", "Not published", "Official county aerial mosaic."),
] as const;

export function arcgisImageryLayersForCounty(county: Pick<CountyDefinition, "id" | "name" | "bounds">): readonly LayerDefinition[] {
  return specs
    .filter((spec) => spec.countyId === county.id)
    .map((spec) => createLayer(spec, county.name, county.bounds))
    .toSorted((first, second) => Number(second.year) - Number(first.year));
}

export function isIntegratedArcgisImagery(county: string, year: number, sourceUrl: string): boolean {
  return specs.some((spec) => spec.year === year && spec.sourceUrl === sourceUrl)
    || specs.some((spec) => spec.year === year && countyIdFromName(county) === spec.countyId);
}

function createLayer(spec: ArcGisImagerySpec, county: string, bounds: LayerBounds): LayerDefinition {
  return {
    id: `${spec.countyId}-arcgis-imagery-${spec.serviceId}`,
    name: spec.name,
    category: "imagery",
    sourceType: spec.sourceType,
    url: `/api/gis-proxy/${spec.proxyUrl}`,
    sourceUrl: spec.sourceUrl,
    defaultVisible: false,
    defaultOpacity: 1,
    minimumLevel: 5,
    bounds,
    attribution: `${county} County GIS`,
    agency: `${county} County GIS`,
    county,
    year: spec.year,
    resolution: spec.resolution,
    description: `${spec.detail} Streamed from the county's public ArcGIS REST service; metadata and an anonymous image response were verified ${verifiedAt}.`,
    options: spec.sourceType === "arcgis-imageserver"
      ? { format: "jpg", transparent: false }
      : { enablePickFeatures: false, ...(spec.dynamic ? { usePreCachedTilesIfAvailable: false } : {}) },
  };
}

function map(
  countyId: string,
  serviceId: string,
  name: string,
  year: number,
  proxyUrl: string,
  sourceUrl: string,
  resolution: string,
  detail: string,
  dynamic = false,
): ArcGisImagerySpec {
  return { countyId, serviceId, name, year, sourceType: "arcgis-mapserver", proxyUrl, sourceUrl, resolution, detail, dynamic };
}

function image(
  countyId: string,
  serviceId: string,
  name: string,
  year: number,
  proxyUrl: string,
  sourceUrl: string,
  resolution: string,
  detail: string,
): ArcGisImagerySpec {
  return { countyId, serviceId, name, year, sourceType: "arcgis-imageserver", proxyUrl, sourceUrl, resolution, detail };
}

function countyIdFromName(county: string): string {
  return county.toLowerCase().replaceAll(".", "").replaceAll(" ", "-");
}
