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
  south11: preset("south11", "2011 Southern Minnesota Spring", 2011, "0.5 meter", [-96.88, 43.38, -91.12, 45.68]),
  south11ir: preset("south11ir", "2011 Southern Minnesota Spring CIR", 2011, "0.5 meter", [-96.88, 43.38, -91.12, 45.68], "color infrared"),
  fall11: preset("fall11", "2011 Southeast Minnesota Fall", 2011, "0.5 meter", [-94.41, 43.49, -91.07, 47.06]),
  fallcir11: preset("fallcir11", "2011 Southeast Minnesota Fall CIR", 2011, "0.5 meter", [-94.41, 43.49, -91.07, 47.06], "color infrared"),
  met25: preset("met25", "2025 Metro", 2025, "1 foot", [-94.08, 44.43, -92.68, 45.44]),
  met25cir: preset("met25cir", "2025 Metro CIR", 2025, "1 foot", [-94.08, 44.43, -92.68, 45.44], "color infrared"),
  dak23: preset("dak23", "2023 Dakota", 2023, "6 inches", [-93.35, 44.46, -92.71, 44.93]),
  dak21: preset("dak21", "2021 Dakota", 2021, "6 inches", [-93.34, 44.46, -92.72, 44.93]),
  dak19: preset("dak19", "2019 Dakota", 2019, "6 inches", [-93.34, 44.47, -92.73, 44.94]),
  dak19cir: preset("dak19cir", "2019 Dakota CIR", 2019, "6 inches", [-93.34, 44.47, -92.73, 44.94], "color infrared"),
  lesueur21: preset("lesueur21", "2021 Le Sueur", 2021, "3 inches", [-94.03, 44.19, -93.52, 44.55]),
  lyon24: preset("lyon24", "2024 Lyon", 2024, "3–6 inches", [-96.11, 44.18, -95.57, 44.65]),
  lyon20: preset("lyon20", "2020 Lyon", 2020, "3 inches", [-96.12, 44.18, -95.57, 44.65]),
  mcle22: preset("mcle22", "2022 McLeod", 2022, "4 inches", [-94.51, 44.62, -94.00, 44.99]),
  mcle18: preset("mcle18", "2018 McLeod", 2018, "4 inches", [-94.51, 44.62, -94.00, 44.99]),
  mc14: preset("mc14", "2014 McLeod", 2014, "6 inches", [-94.52, 44.62, -93.99, 45.00]),
  meek13: preset("meek13", "2013 Meeker", 2013, "0.5 meter", [-94.83, 44.87, -94.24, 45.45]),
  murray11: preset("murray11", "2011 Murray", 2011, "1 foot", [-96.11, 43.82, -95.43, 44.23]),
  rice23: preset("rice23", "2023 Rice", 2023, "6 inches", [-93.53, 44.19, -93.03, 44.55]),
  rice21: preset("rice21", "2021 Rice", 2021, "6 inches", [-93.53, 44.19, -93.03, 44.55]),
  rice11: preset("rice11", "2011 Rice", 2011, "1 foot", [-93.53, 44.19, -93.04, 44.55]),
  scott13: preset("scott13", "2013 Scott", 2013, "6 inches", [-93.94, 44.51, -93.26, 44.82]),
  scott10: preset("scott10", "2010 Scott", 2010, "6 inches", [-93.93, 44.53, -93.26, 44.82]),
  steele22: preset("steele22", "2022 Steele", 2022, "3 inches", [-93.41, 43.85, -93.04, 44.20]),
  steele19: preset("steele19", "2019 Steele", 2019, "6 inches", [-93.42, 43.84, -93.03, 44.20]),
  wab25: preset("wab25", "2025 Wabasha", 2025, "2 inches", [-92.56, 44.09, -91.84, 44.46]),
} as const;

type ImageryKey = keyof typeof imageryPresets;
type SouthCountyInput = {
  id: string;
  name: string;
  fips: string;
  batch: "S1" | "S2" | "S3" | "S4" | "S5";
  bounds: LayerBounds;
  imagery?: readonly ImageryKey[];
  parcelCount?: number;
  parcelAcquired?: string;
  parcelLayer?: LayerDefinition;
  additionalLayers?: readonly LayerDefinition[];
};

const southCountyInputs: readonly SouthCountyInput[] = [
  { id: "dakota", name: "Dakota", fips: "037", batch: "S1", bounds: bounds(-93.3296, 44.4712, -92.7323, 44.9233), imagery: ["met25", "met25cir", "dak23", "dak21", "dak19", "dak19cir"], parcelCount: 154_315, parcelAcquired: "2026-08-04" },
  { id: "lyon", name: "Lyon", fips: "083", batch: "S1", bounds: bounds(-96.0935, 44.1951, -95.5933, 44.6308), imagery: ["lyon24", "lyon20", "south11"], parcelCount: 16_402, parcelAcquired: "2026-06-30" },
  { id: "mcleod", name: "McLeod", fips: "085", batch: "S1", bounds: bounds(-94.5024, 44.6299, -94.0099, 44.9798), imagery: ["mcle22", "mcle18", "mc14", "south11"], parcelCount: 20_467, parcelAcquired: "2026-05-19" },
  { id: "rice", name: "Rice", fips: "131", batch: "S1", bounds: bounds(-93.5256, 44.1962, -93.0394, 44.5441), imagery: ["rice23", "rice21", "rice11", "south11"], parcelCount: 28_166, parcelAcquired: "2026-04-22" },
  { id: "steele", name: "Steele", fips: "147", batch: "S1", bounds: bounds(-93.4067, 43.8481, -93.0453, 44.1967), imagery: ["steele22", "steele19", "south11"], parcelCount: 20_207, parcelAcquired: "2026-04-08" },
  { id: "carver", name: "Carver", fips: "019", batch: "S1", bounds: bounds(-94.0125, 44.6346, -93.5203, 44.9786), imagery: ["met25", "met25cir"], parcelCount: 47_886, parcelAcquired: "2026-08-04" },
  { id: "scott", name: "Scott", fips: "139", batch: "S1", bounds: bounds(-93.9116, 44.5431, -93.2779, 44.8125), imagery: ["met25", "met25cir", "scott13", "scott10"], parcelCount: 61_696, parcelAcquired: "2026-08-04" },
  { id: "wabasha", name: "Wabasha", fips: "157", batch: "S1", bounds: bounds(-92.5509, 44.1068, -91.8586, 44.4554), imagery: ["wab25", "south11", "fall11"], parcelCount: 17_323, parcelAcquired: "2026-07-23" },

  { id: "big-stone", name: "Big Stone", fips: "011", batch: "S2", bounds: bounds(-96.8355, 45.1767, -96.1037, 45.5861), imagery: ["south11", "south11ir"], parcelCount: 7_899, parcelAcquired: "2026-07-30" },
  { id: "brown", name: "Brown", fips: "015", batch: "S2", bounds: bounds(-95.1086, 44.1078, -94.3688, 44.4981), imagery: ["south11", "south11ir"], parcelLayer: directParcel("brown", "Brown", bounds(-95.1086, 44.1078, -94.3688, 44.4981), "/api/gis-proxy/brown/GISNEW/Brown_County_Production_Public_Parcels/FeatureServer", "https://gis.browncountymn.gov/server/rest/services/GISNEW/Brown_County_Production_Public_Parcels/FeatureServer/0", 0, "PIN", { parcelId: "PIN" }, "Official public county parcel geometry and parcel identifiers. Brown County labels the public dataset as containing no owner information. The anonymous service, fields, pagination support, and 18,481-record count were verified 2026-09-14."), additionalLayers: [createBrownParksLayer()] },
  { id: "chippewa", name: "Chippewa", fips: "023", batch: "S2", bounds: bounds(-96.0370, 44.7511, -95.2465, 45.1528), imagery: ["south11", "south11ir"], parcelCount: 11_962, parcelAcquired: "2026-03-23" },
  { id: "lac-qui-parle", name: "Lac qui Parle", fips: "073", batch: "S2", bounds: bounds(-96.4530, 44.8048, -95.7366, 45.2694), imagery: ["south11", "south11ir"], parcelCount: 8_876, parcelAcquired: "2025-12-10" },
  { id: "meeker", name: "Meeker", fips: "093", batch: "S2", bounds: bounds(-94.7635, 44.8919, -94.2556, 45.3266), imagery: ["meek13"], parcelLayer: directParcel("meeker", "Meeker", bounds(-94.7635, 44.8919, -94.2556, 45.3266), "/api/gis-proxy/meeker-open/Parcels_hub/FeatureServer", "https://services2.arcgis.com/pHb2Lre5eSy5plfE/arcgis/rest/services/Parcels_hub/FeatureServer/0", 0, "PID", { parcelId: "PID", owner: "NAME", mailingAddress: "MAILING", acres: "DEED_AC", legalDescription: "LEGAL1" }) },
  { id: "mower", name: "Mower", fips: "099", batch: "S2", bounds: bounds(-93.0496, 43.4997, -92.4490, 43.8487), imagery: ["south11", "south11ir"], parcelCount: 22_956, parcelAcquired: "2026-07-10" },
  { id: "pipestone", name: "Pipestone", fips: "117", batch: "S2", bounds: bounds(-96.4535, 43.8486, -96.0637, 44.1975), imagery: ["south11", "south11ir"], parcelCount: 8_359, parcelAcquired: "2026-08-06" },
  { id: "pope", name: "Pope", fips: "121", batch: "S2", bounds: bounds(-95.7587, 45.4119, -95.1314, 45.7599), parcelCount: 14_006, parcelAcquired: "2026-06-22" },
  { id: "renville", name: "Renville", fips: "129", batch: "S2", bounds: bounds(-95.4834, 44.4560, -94.4977, 44.8923), imagery: ["south11", "south11ir"], parcelCount: 16_157, parcelAcquired: "2026-06-09" },
  { id: "stevens", name: "Stevens", fips: "149", batch: "S2", bounds: bounds(-96.2541, 45.4119, -95.7475, 45.7599), parcelCount: 8_146, parcelAcquired: "2026-02-24" },
  { id: "traverse", name: "Traverse", fips: "155", batch: "S2", bounds: bounds(-96.8578, 45.5854, -96.2530, 46.0221), parcelCount: 6_229, parcelAcquired: "2025-06-16" },
  { id: "waseca", name: "Waseca", fips: "161", batch: "S2", bounds: bounds(-93.7684, 43.8479, -93.4062, 44.1964), imagery: ["south11", "south11ir"], parcelCount: 12_327, parcelAcquired: "2026-07-07" },
  { id: "yellow-medicine", name: "Yellow Medicine", fips: "173", batch: "S2", bounds: bounds(-96.4519, 44.5417, -95.3602, 44.9359), imagery: ["south11", "south11ir"], parcelCount: 10_763, parcelAcquired: "2025-11-19" },

  { id: "dodge", name: "Dodge", fips: "039", batch: "S3", bounds: bounds(-93.0460, 43.8484, -92.6779, 44.1970), imagery: ["south11", "south11ir"], parcelLayer: directParcel("dodge", "Dodge", bounds(-93.0460, 43.8484, -92.6779, 44.1970), "/api/gis-proxy/goodhue-public/DodgeCounty/Dodge_Parcels/MapServer", "https://publicmaps.co.goodhue.mn.us/arcgis/rest/services/DodgeCounty/Dodge_Parcels/MapServer/1", 1, "PIN", { parcelId: "PIN", owner: "C0NAME1P", secondaryOwner: "C0NAME2P", siteAddress: "FULL_ADD", mailingAddress: "C0ADRLN1P", acres: "C0ACRES", legalDescription: "SHORTLEGAL" }) },
  { id: "goodhue", name: "Goodhue", fips: "049", batch: "S3", bounds: bounds(-93.0412, 44.1949, -92.2420, 44.7137), imagery: ["south11", "south11ir", "fall11", "fallcir11"], parcelLayer: directParcel("goodhue", "Goodhue", bounds(-93.0412, 44.1949, -92.2420, 44.7137), "/api/gis-proxy/goodhue-public/GoodhueCounty/ParcelsAGOL/MapServer", "https://publicmaps.co.goodhue.mn.us/arcgis/rest/services/GoodhueCounty/ParcelsAGOL/MapServer/0", 0, "PIN", { parcelId: "PIN", owner: "C0NAME1P", secondaryOwner: "C0NAME2P", siteAddress: "FULLSTREET", mailingAddress: "C0ADRLN1P", acres: "C0ACRES", legalDescription: "LEGAL" }) },
  { id: "lincoln", name: "Lincoln", fips: "081", batch: "S3", bounds: bounds(-96.4528, 44.1967, -96.0785, 44.6313), imagery: ["south11", "south11ir"] },
  { id: "olmsted", name: "Olmsted", fips: "109", batch: "S3", bounds: bounds(-92.6894, 43.8338, -92.0789, 44.1956), imagery: ["south11", "south11ir", "fall11", "fallcir11"], parcelCount: 75_579, parcelAcquired: "2026-06-23" },
  { id: "sibley", name: "Sibley", fips: "143", batch: "S3", bounds: bounds(-94.6295, 44.4559, -93.7638, 44.7179), imagery: ["south11", "south11ir"] },
  { id: "kandiyohi", name: "Kandiyohi", fips: "067", batch: "S3", bounds: bounds(-95.2553, 44.8913, -94.7568, 45.4130), imagery: ["south11", "south11ir"] },
  { id: "rock", name: "Rock", fips: "133", batch: "S3", bounds: bounds(-96.4535, 43.5002, -96.0523, 43.8496), imagery: ["south11", "south11ir"] },

  { id: "fillmore", name: "Fillmore", fips: "045", batch: "S4", bounds: bounds(-92.4496, 43.5005, -91.7303, 43.8483), imagery: ["south11", "south11ir", "fall11", "fallcir11"], parcelCount: 20_917, parcelAcquired: "2026-07-09" },
  { id: "houston", name: "Houston", fips: "055", batch: "S4", bounds: bounds(-91.7306, 43.5005, -91.2173, 43.8474), imagery: ["south11", "south11ir", "fall11", "fallcir11"], parcelCount: 16_719, parcelAcquired: "2026-06-29" },
  { id: "winona", name: "Winona", fips: "169", batch: "S4", bounds: bounds(-92.0794, 43.8469, -91.2842, 44.1933), imagery: ["south11", "south11ir", "fall11", "fallcir11"], parcelCount: 25_538, parcelAcquired: "2026-07-06" },
  { id: "le-sueur", name: "Le Sueur", fips: "079", batch: "S4", bounds: bounds(-94.0253, 44.1960, -93.5242, 44.5440), imagery: ["lesueur21", "south11", "south11ir"] },
  { id: "murray", name: "Murray", fips: "101", batch: "S4", bounds: bounds(-96.0646, 43.8479, -95.4621, 44.1966), imagery: ["murray11", "south11", "south11ir"], parcelCount: 10_206, parcelAcquired: "2026-08-31" },

  { id: "blue-earth", name: "Blue Earth", fips: "013", batch: "S5", bounds: bounds(-94.3718, 43.8479, -93.7677, 44.2644), imagery: ["south11", "south11ir"] },
  { id: "cottonwood", name: "Cottonwood", fips: "033", batch: "S5", bounds: bounds(-95.4625, 43.8477, -94.8590, 44.1960), imagery: ["south11", "south11ir"] },
  { id: "faribault", name: "Faribault", fips: "043", batch: "S5", bounds: bounds(-94.2480, 43.4996, -93.6480, 43.8482), imagery: ["south11", "south11ir"] },
  { id: "freeborn", name: "Freeborn", fips: "047", batch: "S5", bounds: bounds(-93.6486, 43.4994, -93.0491, 43.8484), imagery: ["south11", "south11ir"] },
  { id: "jackson", name: "Jackson", fips: "063", batch: "S5", bounds: bounds(-95.4544, 43.5002, -94.8544, 43.8481), imagery: ["south11", "south11ir"], parcelCount: 11_035, parcelAcquired: "2026-07-09" },
  { id: "martin", name: "Martin", fips: "091", batch: "S5", bounds: bounds(-94.8548, 43.5001, -94.2472, 43.8483), imagery: ["south11", "south11ir"] },
  { id: "nicollet", name: "Nicollet", fips: "103", batch: "S5", bounds: bounds(-94.7869, 44.1539, -93.9275, 44.4568), imagery: ["south11", "south11ir"] },
  { id: "nobles", name: "Nobles", fips: "105", batch: "S5", bounds: bounds(-96.0536, 43.4999, -95.4520, 43.8491), imagery: ["south11", "south11ir"] },
  { id: "redwood", name: "Redwood", fips: "127", batch: "S5", bounds: bounds(-95.5947, 44.1952, -94.8655, 44.6986), imagery: ["south11", "south11ir"] },
  { id: "swift", name: "Swift", fips: "151", batch: "S5", bounds: bounds(-96.1185, 45.1512, -95.2465, 45.4128), imagery: ["south11", "south11ir"] },
  { id: "watonwan", name: "Watonwan", fips: "165", batch: "S5", bounds: bounds(-94.8597, 43.8480, -94.3688, 44.1090), imagery: ["south11", "south11ir"] },
];

export const southExpansionCounties: readonly CountyDefinition[] = southCountyInputs.map((input) => {
  const hasParcels = input.parcelCount !== undefined || input.parcelLayer !== undefined;
  const layers = [
    ...(input.imagery ?? []).map((key) => createImageryLayer(input.id, input.name, imageryPresets[key])),
    ...(input.additionalLayers ?? []),
    ...(input.parcelLayer ? [input.parcelLayer] : input.parcelCount !== undefined ? [createMnGeoParcelLayer(input.id, input.name, input.fips, input.bounds, input.parcelCount, input.parcelAcquired)] : []),
  ];
  return {
    id: input.id,
    name: input.name,
    fips: input.fips,
    zone: "south",
    bounds: input.bounds,
    layers,
    parcels: { status: hasParcels ? "available" : "pending", sourceType: input.parcelLayer ? "arcgis-feature" : hasParcels ? "mngeo-open" : "none", verifiedAt },
    notes: hasParcels
      ? [input.parcelLayer ? `Batch ${input.batch}. Official direct parcel service supports repeatable anonymous bounded GeoJSON queries.` : `Batch ${input.batch}. MnGeo Open Parcels contained ${input.parcelCount!.toLocaleString("en-US")} records at verification.`]
      : [`Batch ${input.batch}. Parcel support deferred: the statewide polygon layer returned no county records and no other repeatable anonymous query service was verified.`],
  };
});

function directParcel(
  id: string,
  name: string,
  countyBounds: LayerBounds,
  url: string,
  sourceUrl: string,
  layerId: number,
  nameField: string,
  parcelFields: NonNullable<LayerDefinition["parcelFields"]>,
  description = `Official public county parcel geometry and published tax attributes. Anonymous metadata and bounded GeoJSON queries verified ${verifiedAt}.`,
): LayerDefinition {
  return {
    id: `${id}-parcels`,
    name: `${name} tax parcels`,
    category: "parcels",
    sourceType: "arcgis-featureserver",
    url,
    sourceUrl,
    defaultVisible: false,
    defaultOpacity: 0.8,
    attribution: `${name} County GIS`,
    agency: `${name} County GIS`,
    county: name,
    bounds: countyBounds,
    description,
    nameField,
    parcelFields,
    options: {
      layerId,
      outFields: [...new Set(Object.values(parcelFields).filter((field): field is string => Boolean(field)))].join(","),
      fillColor: "#ffffff",
      strokeColor: "#f2d48a",
      fillAlpha: 0.01,
      strokeWidth: 1,
      maxCameraHeight: 35_000,
    },
  };
}

function createBrownParksLayer(): LayerDefinition {
  return {
    id: "brown-local-parks",
    name: "Brown County local parks",
    category: "public-land",
    sourceType: "arcgis-featureserver",
    url: "/api/gis-proxy/brown/Hosted/Parks/FeatureServer",
    sourceUrl: "https://gis.browncountymn.gov/server/rest/services/Hosted/Parks/FeatureServer/4",
    defaultVisible: false,
    defaultOpacity: 0.82,
    attribution: "Brown County GIS",
    agency: "Brown County GIS",
    county: "Brown",
    bounds: bounds(-95.1086, 44.1078, -94.3688, 44.4981),
    description: "Fifty-two city, county, and state park polygons published by Brown County GIS. Two features classified as private-city parks are excluded. Layer fields, geometry, anonymous query support, and grouped counts were verified 2026-09-14. Verify current ownership, rules, and access before visiting.",
    accessMeaning: "access-varies",
    nameField: "name",
    popupFields: [{ field: "name", label: "Park" }, { field: "park_type", label: "Type" }, { field: "city", label: "City" }, { field: "address", label: "Address" }],
    options: { layerId: 4, where: "park_type IN ('CITY','COUNTY','STATE')", outFields: "name,park_type,city,address", fillColor: "#65b96e", strokeColor: "#c9f2cf", fillAlpha: 0.24, strokeWidth: 2 },
  };
}

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
