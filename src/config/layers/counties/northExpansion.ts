import type { CountyDefinition, LayerBounds, LayerDefinition } from "../types";
import { createMnGeoParcelLayer } from "./shared";

const imageryUrl = "/api/gis-proxy/mngeo-imagery/wmsll?";
const imagerySourceUrl = "https://imageserver.gisdata.mn.gov/cgi-bin/wmsll?";
const verifiedAt = "2026-09-14";

type ImageryPreset = {
  layer: string;
  label: string;
  year: number;
  resolution: string;
  bounds: LayerBounds;
  color?: "natural color" | "color infrared";
};

const imageryPresets = {
  fall11: preset("fall11", "2011 Fall", 2011, "0.5 meter", [-94.41, 43.49, -91.07, 47.06]),
  fallcir11: preset("fallcir11", "2011 Fall CIR", 2011, "0.5 meter", [-94.41, 43.49, -91.07, 47.06], "color infrared"),
  fall12: preset("fall12", "2012 Fall", 2012, "0.5 meter", [-96.10, 46.03, -93.73, 47.65]),
  fallcir12: preset("fallcir12", "2012 Fall CIR", 2012, "0.5 meter", [-96.10, 46.03, -93.73, 47.65], "color infrared"),
  nc13ft: preset("nc13ft", "2013 North 1 ft", 2013, "1 foot", [-96.95, 45.44, -92.22, 47.94]),
  nc13ftcir: preset("nc13ftcir", "2013 North 1 ft CIR", 2013, "1 foot", [-96.95, 45.44, -92.22, 47.94], "color infrared"),
  polk: preset("polk", "2014 Polk–Beltrami", 2014, "1 foot", [-97.23, 47.31, -94.28, 48.59]),
  polkcir: preset("polkcir", "2014 Polk–Beltrami CIR", 2014, "1 foot", [-97.23, 47.31, -94.28, 48.59], "color infrared"),
  bord15: preset("bord15", "2015 Northern Border", 2015, "Resolution not published", [-96.07, 47.74, -92.18, 49.56]),
  carl15_9: preset("carl15_9", "2015 Carlton", 2015, "9 inches", [-93.08, 46.41, -92.28, 46.78]),
  itas18: preset("itas18", "2018 Itasca", 2018, "1 foot", [-94.45, 46.99, -93.02, 47.92]),
  itas18cir: preset("itas18cir", "2018 Itasca CIR", 2018, "1 foot", [-94.45, 46.99, -93.02, 47.92], "color infrared"),
  hen18: preset("hen18", "2018 Hennepin", 2018, "3 inches", [-93.78, 44.78, -93.17, 45.25]),
  carl19: preset("carl19", "2019 Carlton", 2019, "6 inches", [-93.07, 46.41, -92.29, 46.77]),
  carl19cir: preset("carl19cir", "2019 Carlton CIR", 2019, "6 inches", [-93.07, 46.41, -92.29, 46.77], "color infrared"),
  lake19: preset("lake19", "2019 Lake", 2019, "6 inches", [-91.84, 46.91, -90.98, 48.21]),
  kooc20: preset("kooc20", "2020 Koochiching", 2020, "1 foot", [-94.46, 47.82, -93.06, 48.73]),
  rams20: preset("rams20", "2020 Ramsey", 2020, "6 inches", [-93.23, 44.88, -92.96, 45.14]),
  rams20cir: preset("rams20cir", "2020 Ramsey CIR", 2020, "6 inches", [-93.23, 44.88, -92.96, 45.14], "color infrared"),
  carlton21: preset("carlton21", "2021 Carlton", 2021, "6 inches", [-93.07, 46.41, -92.29, 46.77]),
  hen21: preset("hen21", "2021 Hennepin", 2021, "6 inches", [-93.77, 44.78, -93.18, 45.25]),
  hen22: preset("hen22", "2022 Hennepin", 2022, "6 inches", [-93.77, 44.78, -93.18, 45.25]),
  lake24: preset("lake24", "2024 Lake", 2024, "6 inches", [-91.84, 46.91, -90.97, 48.21]),
  met25: preset("met25", "2025 Metro", 2025, "1 foot", [-94.08, 44.43, -92.68, 45.44]),
  met25cir: preset("met25cir", "2025 Metro CIR", 2025, "1 foot", [-94.08, 44.43, -92.68, 45.44], "color infrared"),
  neclr2009: preset("neclr2009", "2009 Arrowhead", 2009, "Resolution not published", [-93.13, 46.57, -89.39, 48.69]),
  neir2009: preset("neir2009", "2009 Arrowhead CIR", 2009, "Resolution not published", [-93.13, 46.57, -89.39, 48.69], "color infrared"),
  ncclr09: preset("ncclr09", "2009 North Central", 2009, "Resolution not published", [-94.40, 47.36, -91.79, 48.69]),
  ncir09: preset("ncir09", "2009 North Central CIR", 2009, "Resolution not published", [-94.40, 47.36, -91.79, 48.69], "color infrared"),
  bwca09: preset("bwca09", "2009 BWCA Border", 2009, "Resolution not published", [-92.21, 47.57, -89.94, 48.52]),
  smet10: preset("smet10", "2010 North Metro", 2010, "0.5 meter", [-94.34, 44.93, -92.62, 45.75]),
  smet10cir: preset("smet10cir", "2010 North Metro CIR", 2010, "0.5 meter", [-94.34, 44.93, -92.62, 45.75], "color infrared"),
  wash13: preset("wash13", "2013 Washington", 2013, "6 inches", [-93.05, 44.73, -92.72, 45.30]),
} as const;

type ImageryKey = keyof typeof imageryPresets;

type NorthCountyInput = {
  id: string;
  name: string;
  fips: string;
  batch: "N1" | "N2" | "N3" | "N4" | "N5";
  bounds: LayerBounds;
  imagery?: readonly ImageryKey[];
  parcelCount?: number;
  parcelAcquired?: string;
  directParcel?: LayerDefinition;
  additionalLayers?: readonly LayerDefinition[];
};

const northCountyInputs: readonly NorthCountyInput[] = [
  { id: "benton", name: "Benton", fips: "009", batch: "N1", bounds: bounds(-94.3531, 45.5590, -93.7593, 45.8243), imagery: ["fall11"], parcelCount: 20_313, parcelAcquired: "2026-02-17" },
  { id: "carlton", name: "Carlton", fips: "017", batch: "N1", bounds: bounds(-93.0645, 46.4173, -92.2916, 46.7691), imagery: ["carlton21", "carl19", "carl19cir", "carl15_9", "nc13ft"], additionalLayers: [createCarlton2024ImageryLayer()], parcelCount: 34_068, parcelAcquired: "2026-07-16" },
  { id: "crow-wing", name: "Crow Wing", fips: "035", batch: "N1", bounds: bounds(-94.3952, 46.1559, -93.7760, 46.8054), imagery: ["fall12", "fallcir12"], parcelCount: 76_486, parcelAcquired: "2026-07-19" },
  { id: "itasca", name: "Itasca", fips: "061", batch: "N1", bounds: bounds(-94.4192, 47.0253, -93.0557, 47.8991), imagery: ["itas18", "itas18cir", "nc13ft", "nc13ftcir"], parcelCount: 80_651, parcelAcquired: "2026-06-26" },
  { id: "mille-lacs", name: "Mille Lacs", fips: "095", batch: "N1", bounds: bounds(-93.8108, 45.5587, -93.4297, 46.2472), imagery: ["nc13ft", "nc13ftcir", "fall11", "fallcir11"], parcelCount: 20_928, parcelAcquired: "2026-02-24" },
  { id: "morrison", name: "Morrison", fips: "097", batch: "N1", bounds: bounds(-94.6533, 45.7739, -93.7635, 46.3486), imagery: ["nc13ft", "nc13ftcir"], parcelCount: 30_117, parcelAcquired: "2026-07-09" },
  { id: "otter-tail", name: "Otter Tail", fips: "111", batch: "N1", bounds: bounds(-96.2813, 46.1068, -95.1457, 46.7182), parcelCount: 67_033, parcelAcquired: "2026-02-25" },

  { id: "clay", name: "Clay", fips: "027", batch: "N2", bounds: bounds(-96.8402, 46.6286, -96.1725, 47.1515), imagery: ["nc13ft", "nc13ftcir"], parcelCount: 31_368, parcelAcquired: "2026-08-06" },
  { id: "polk", name: "Polk", fips: "119", batch: "N2", bounds: bounds(-97.1475, 47.4986, -95.5514, 48.1741), imagery: ["polk", "polkcir"], additionalLayers: [createPolk2025ImageryLayer()], parcelCount: 28_885, parcelAcquired: "2026-06-16" },
  { id: "wilkin", name: "Wilkin", fips: "167", batch: "N2", bounds: bounds(-96.7914, 46.0216, -96.2649, 46.6308), imagery: ["nc13ft", "nc13ftcir"], parcelCount: 8_572, parcelAcquired: "2026-07-20" },
  { id: "grant", name: "Grant", fips: "051", batch: "N2", bounds: bounds(-96.2665, 45.7592, -95.7584, 46.1087), parcelCount: 7_726, parcelAcquired: "2026-08-04" },
  { id: "cook", name: "Cook", fips: "031", batch: "N2", bounds: bounds(-91.0320, 47.4650, -89.4918, 48.2460), imagery: ["neclr2009", "neir2009", "bwca09"], parcelCount: 12_695, parcelAcquired: "2026-02-03" },

  { id: "anoka", name: "Anoka", fips: "003", batch: "N3", bounds: bounds(-93.5125, 45.0355, -93.0185, 45.4148), imagery: ["met25", "met25cir", "fall11", "fallcir11"], parcelCount: 140_221, parcelAcquired: "2026-08-04" },
  { id: "hennepin", name: "Hennepin", fips: "053", batch: "N3", bounds: bounds(-93.7678, 44.7853, -93.1767, 45.2470), imagery: ["met25", "met25cir", "hen22", "hen21", "hen18"], parcelCount: 447_044, parcelAcquired: "2026-08-04" },
  { id: "ramsey", name: "Ramsey", fips: "123", batch: "N3", bounds: bounds(-93.2279, 44.8873, -92.9841, 45.1245), imagery: ["met25", "met25cir", "rams20", "rams20cir"], additionalLayers: [createRamsey2022ImageryLayer()], parcelCount: 172_178, parcelAcquired: "2026-08-04" },
  { id: "washington", name: "Washington", fips: "163", batch: "N3", bounds: bounds(-93.0226, 44.7457, -92.7409, 45.2969), imagery: ["met25", "met25cir", "wash13", "fall11"], parcelCount: 119_096, parcelAcquired: "2026-08-04" },
  { id: "wright", name: "Wright", fips: "171", batch: "N3", bounds: bounds(-94.2615, 44.9777, -93.5147, 45.4238), imagery: ["smet10", "smet10cir"], parcelCount: 75_691, parcelAcquired: "2026-07-01" },
  { id: "sherburne", name: "Sherburne", fips: "141", batch: "N3", bounds: bounds(-94.1504, 45.2461, -93.5098, 45.5602), imagery: ["fall11", "fallcir11", "smet10", "smet10cir"], parcelCount: 44_573, parcelAcquired: "2026-04-08" },
  { id: "isanti", name: "Isanti", fips: "059", batch: "N3", bounds: bounds(-93.5136, 45.4117, -93.0196, 45.7344), imagery: ["fall11", "fallcir11", "smet10", "smet10cir"], parcelCount: 23_889, parcelAcquired: "2026-07-01" },
  { id: "chisago", name: "Chisago", fips: "025", batch: "N3", bounds: bounds(-93.1423, 45.2962, -92.6465, 45.7311), imagery: ["fall11", "fallcir11", "smet10", "smet10cir"], parcelCount: 29_949, parcelAcquired: "2026-08-06" },
  { id: "stearns", name: "Stearns", fips: "145", batch: "N3", bounds: bounds(-95.1398, 45.2824, -94.0465, 45.7754), parcelCount: 73_181, parcelAcquired: "2026-07-15" },

  { id: "st-louis", name: "St. Louis", fips: "137", batch: "N4", bounds: bounds(-93.0980, 46.6492, -91.7879, 48.6315), imagery: ["neclr2009", "neir2009", "ncclr09", "ncir09", "bwca09"], parcelCount: 186_455, parcelAcquired: "2026-02-05" },
  { id: "lake", name: "Lake", fips: "075", batch: "N4", bounds: bounds(-91.8002, 46.9397, -91.0208, 48.2060), imagery: ["lake24", "lake19", "neclr2009", "neir2009"], parcelCount: 47_116, parcelAcquired: "2026-04-15" },
  { id: "cass", name: "Cass", fips: "021", batch: "N4", bounds: bounds(-94.7871, 46.2766, -93.7727, 47.4807), imagery: ["fall12", "fallcir12"], parcelCount: 51_689, parcelAcquired: "2026-07-23" },
  { id: "clearwater", name: "Clearwater", fips: "029", batch: "N4", bounds: bounds(-95.5828, 47.1512, -95.1691, 48.0209), imagery: ["fall12", "fallcir12"], parcelCount: 9_778, parcelAcquired: "2026-04-15" },
  { id: "mahnomen", name: "Mahnomen", fips: "087", batch: "N4", bounds: bounds(-96.0676, 47.1502, -95.5503, 47.5001), imagery: ["fall12", "fallcir12"], directParcel: createMahnomenParcelLayer() },
  { id: "red-lake", name: "Red Lake", fips: "125", batch: "N4", bounds: bounds(-96.4828, 47.7597, -95.7090, 47.9649), parcelCount: 4_200, parcelAcquired: "2025-10-22" },

  { id: "kanabec", name: "Kanabec", fips: "065", batch: "N5", bounds: bounds(-93.5190, 45.7305, -93.0540, 46.1594), imagery: ["fall11", "fallcir11"] },
  { id: "kittson", name: "Kittson", fips: "069", batch: "N5", bounds: bounds(-97.2392, 48.5432, -96.3866, 49.0005) },
  { id: "koochiching", name: "Koochiching", fips: "071", batch: "N5", bounds: bounds(-94.4304, 47.8458, -93.0808, 48.7120), imagery: ["kooc20", "ncclr09", "ncir09"], parcelCount: 55_291, parcelAcquired: "2026-01-14" },
  { id: "lake-of-the-woods", name: "Lake of the Woods", fips: "077", batch: "N5", bounds: bounds(-95.3426, 48.3660, -94.4289, 49.3845), imagery: ["bord15"], parcelCount: 8_957, parcelAcquired: "2025-07-15" },
  { id: "marshall", name: "Marshall", fips: "089", batch: "N5", bounds: bounds(-97.1634, 48.1716, -95.5933, 48.5451), parcelCount: 15_374, parcelAcquired: "2024-05-20" },
  { id: "norman", name: "Norman", fips: "107", batch: "N5", bounds: bounds(-96.8718, 47.1506, -96.0668, 47.4999), parcelCount: 9_705, parcelAcquired: "2026-06-16" },
  { id: "pennington", name: "Pennington", fips: "113", batch: "N5", bounds: bounds(-96.5010, 47.9338, -95.5824, 48.1751), parcelCount: 10_470, parcelAcquired: "2024-11-12" },
  { id: "pine", name: "Pine", fips: "115", batch: "N5", bounds: bounds(-93.1428, 45.7301, -92.2928, 46.4193), imagery: ["fall11", "fallcir11"] },
  { id: "roseau", name: "Roseau", fips: "135", batch: "N5", bounds: bounds(-96.4055, 48.5386, -95.0899, 49.0001), imagery: ["bord15"] },
  { id: "wadena", name: "Wadena", fips: "159", batch: "N5", bounds: bounds(-95.1641, 46.3684, -94.7280, 46.8055), imagery: ["fall12", "fallcir12"], directParcel: createWadenaParcelLayer() },
];

export const northExpansionCounties: readonly CountyDefinition[] = northCountyInputs.map((input) => {
  const hasParcels = input.parcelCount !== undefined || input.directParcel !== undefined;
  const imageryLayers = [
    ...(input.additionalLayers ?? []),
    ...(input.imagery ?? []).map((key) => createImageryLayer(input.id, input.name, imageryPresets[key])),
  ].toSorted((first, second) => Number(second.year ?? 0) - Number(first.year ?? 0));
  const layers = [
    ...imageryLayers,
    ...(input.directParcel ? [input.directParcel] : input.parcelCount !== undefined ? [createMnGeoParcelLayer(input.id, input.name, input.fips, input.bounds, input.parcelCount, input.parcelAcquired)] : []),
  ];
  const notes = hasParcels
    ? [input.directParcel
      ? `Batch ${input.batch}. A stable anonymous county parcel service was verified ${verifiedAt}.`
      : `Batch ${input.batch}. MnGeo Open Parcels contained ${input.parcelCount!.toLocaleString("en-US")} records at verification.`]
    : [`Batch ${input.batch}. Parcel support deferred: MnGeo metadata lists the county, but the polygon layer returned no county records; no other repeatable query service was verified.`];
  return {
    id: input.id,
    name: input.name,
    fips: input.fips,
    zone: "north",
    bounds: input.bounds,
    layers,
    parcels: {
      status: hasParcels ? "available" : "pending",
      sourceType: input.directParcel ? "arcgis-feature" : hasParcels ? "mngeo-open" : "none",
      verifiedAt,
    },
    notes,
  };
});

function createImageryLayer(countyId: string, countyName: string, imagery: ImageryPreset): LayerDefinition {
  return {
    id: `${countyId}-imagery-${imagery.layer}`,
    name: imagery.label,
    category: "imagery",
    sourceType: "wms",
    url: imageryUrl,
    sourceUrl: imagerySourceUrl,
    defaultVisible: false,
    defaultOpacity: 1,
    minimumLevel: 5,
    bounds: imagery.bounds,
    attribution: "Minnesota imagery via MnGeo",
    agency: "Minnesota Geospatial Information Office and contributing agencies",
    county: countyName,
    year: imagery.year,
    resolution: imagery.resolution,
    description: `${imagery.color ?? "natural color"} imagery intersecting ${countyName} County. Layer name and published coverage verified ${verifiedAt}.`,
    options: { layers: imagery.layer, format: "image/jpeg", transparent: false, version: "1.1.1" },
  };
}

function preset(
  layer: string,
  label: string,
  year: number,
  resolution: string,
  [west, south, east, north]: readonly [number, number, number, number],
  color: ImageryPreset["color"] = "natural color",
): ImageryPreset {
  return { layer, label, year, resolution, bounds: { west, south, east, north }, color };
}

function bounds(west: number, south: number, east: number, north: number): LayerBounds {
  return { west, south, east, north };
}

function createCarlton2024ImageryLayer(): LayerDefinition {
  return {
    id: "carlton-imagery-2024",
    name: "2024 Carlton EagleView",
    category: "imagery",
    sourceType: "wms",
    url: "/api/gis-proxy/carlton-imagery/F244BDF4-3688-1040-2C2F-33486C6D4B05/wms?",
    sourceUrl: "https://svc.pictometry.com/Image/F244BDF4-3688-1040-2C2F-33486C6D4B05/wms",
    defaultVisible: false,
    defaultOpacity: 1,
    minimumLevel: 5,
    bounds: bounds(-93.0679, 46.4166, -92.2893, 46.7709),
    attribution: "Carlton County and EagleView (Pictometry)",
    agency: "Carlton County GIS",
    county: "Carlton",
    year: 2024,
    resolution: "Resolution not published",
    description: "Spring 2024 countywide natural-color mosaic captured April 10–May 3. Carlton County explicitly publishes this service for GIS software; its WMS capabilities report no fees or access constraints. Service metadata and access terms verified 2026-09-17.",
    options: { layers: "PICT-MNCARL24-uXwUjeOUhi", format: "image/jpeg", transparent: false, version: "1.3.0" },
  };
}

function createPolk2025ImageryLayer(): LayerDefinition {
  return {
    id: "polk-imagery-2025-eagleview",
    name: "2025 Polk County EagleView",
    category: "imagery",
    sourceType: "wmts",
    url: "https://svc.pictometry.com/Image/98AF9924-7080-15F7-B6F4-685FAB863751/wmts",
    sourceUrl: "https://svc.pictometry.com/Image/98AF9924-7080-15F7-B6F4-685FAB863751/wmts?SERVICE=WMTS&REQUEST=GetCapabilities",
    defaultVisible: false,
    defaultOpacity: 1,
    minimumLevel: 5,
    maximumLevel: 30,
    bounds: bounds(-97.14934298, 47.494481814, -95.544672003, 48.177524112),
    attribution: "Polk County and EagleView (Pictometry)",
    agency: "Polk County GIS",
    county: "Polk",
    year: 2025,
    resolution: "Resolution not published",
    description: "Countywide natural-color EagleView mosaic. The public WMTS capabilities report no fees or access constraints, and an anonymous PNG tile response was verified 2026-09-18.",
    options: { layer: "PICT-MNPOLK25-bwELhvEqES", style: "default", format: "image/png", tileMatrixSetID: "GoogleMapsCompatible" },
  };
}

function createRamsey2022ImageryLayer(): LayerDefinition {
  return {
    id: "ramsey-imagery-2022",
    name: "2022 Ramsey County",
    category: "imagery",
    sourceType: "arcgis-imageserver",
    url: "/api/gis-proxy/ramsey-imagery/OrthoPhotos/Aerial2022/ImageServer",
    sourceUrl: "https://maps.co.ramsey.mn.us/arcgis/rest/services/OrthoPhotos/Aerial2022/ImageServer",
    defaultVisible: false,
    defaultOpacity: 1,
    minimumLevel: 5,
    bounds: bounds(-93.2279, 44.8873, -92.9841, 45.1245),
    attribution: "Ramsey County GIS",
    agency: "Ramsey County GIS",
    county: "Ramsey",
    year: 2022,
    resolution: "3 inches",
    description: "Spring 2022 aerial imagery. Ramsey County explicitly makes the imagery available for public download and use without fee or licensure; ImageServer metadata and anonymous image export were verified 2026-09-17.",
    options: { format: "jpg", transparent: false },
  };
}

function createMahnomenParcelLayer(): LayerDefinition {
  return {
    id: "mahnomen-parcels",
    name: "Mahnomen tax parcels",
    category: "parcels",
    sourceType: "arcgis-featureserver",
    url: "https://services8.arcgis.com/eORKbx5CWReJmkoa/ArcGIS/rest/services/TaxParcels/FeatureServer",
    sourceUrl: "https://services8.arcgis.com/eORKbx5CWReJmkoa/ArcGIS/rest/services/TaxParcels/FeatureServer/0",
    defaultVisible: false,
    defaultOpacity: 0.8,
    attribution: "Mahnomen County, Minnesota",
    agency: "Mahnomen County GIS",
    county: "Mahnomen",
    bounds: bounds(-96.0676, 47.1502, -95.5503, 47.5001),
    description: `Official county tax-parcel polygons with owner, address, acreage, legal-description, and tax-year attributes. Anonymous GeoJSON queries, 6,222-record count, service metadata, fields, and data freshness were verified ${verifiedAt}; data last edited 2026-07-10.`,
    nameField: "Parcel_Num",
    parcelFields: { parcelId: "Parcel_Num", owner: "OWNER_NAME", siteAddress: "PROPERTY_ADDRESS", mailingAddress: "OWNER_ADDRESS_1", acres: "DEEDED_ACRES", legalDescription: "LEGAL", taxYear: "TAX_YEAR" },
    options: { layerId: 0, outFields: "Parcel_Num,OWNER_NAME,PROPERTY_ADDRESS,OWNER_ADDRESS_1,DEEDED_ACRES,LEGAL,TAX_YEAR", fillColor: "#ffffff", strokeColor: "#f2d48a", fillAlpha: 0.01, strokeWidth: 1, maxCameraHeight: 35_000 },
  };
}

function createWadenaParcelLayer(): LayerDefinition {
  return {
    id: "wadena-parcels",
    name: "Wadena tax parcels",
    category: "parcels",
    sourceType: "arcgis-featureserver",
    url: "/api/gis-proxy/wadena/LinkPublic/MapServer",
    sourceUrl: "https://gis.co.wadena.mn.us/arcgis/rest/services/LinkPublic/MapServer/0",
    defaultVisible: false,
    defaultOpacity: 0.8,
    attribution: "Wadena County, Minnesota",
    agency: "Wadena County GIS",
    county: "Wadena",
    bounds: bounds(-95.1641, 46.3684, -94.7280, 46.8055),
    description: `Official public parcel polygons with parcel number, owner/taxpayer, address, acreage, and legal-description attributes. Anonymous GeoJSON queries, 11,821-record count, pagination support, and fields were verified ${verifiedAt}.`,
    nameField: "PARCEL_NUM",
    parcelFields: { parcelId: "PARCEL_NUM", owner: "OWNER_NAME", secondaryOwner: "TAXPAYER_NAME", siteAddress: "PHYSICAL_ADDRESS", mailingAddress: "OWNER_ADDRESS1", acres: "DEEDED_ACRES", legalDescription: "LEGAL_DESCRIPTION" },
    options: { layerId: 0, outFields: "PARCEL_NUM,OWNER_NAME,TAXPAYER_NAME,PHYSICAL_ADDRESS,OWNER_ADDRESS1,DEEDED_ACRES,LEGAL_DESCRIPTION", fillColor: "#ffffff", strokeColor: "#f2d48a", fillAlpha: 0.01, strokeWidth: 1, maxCameraHeight: 35_000 },
  };
}
