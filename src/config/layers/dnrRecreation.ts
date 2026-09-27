import type { DnrLayerInfo, LayerDefinition, LayerPopupField } from "./types";

const mngeoRoot = "/api/gis-proxy/mngeo-features/us_mn_state_dnr";
const mngeoSource = "https://enterprise.gisdata.mn.gov/aghost/rest/services/us_mn_state_dnr";
const cwdService = "Hosted/CWD_Sampling_and_Regulations_for_MN_2020_Deer_Seasons_Public_View";
const cwdSource =
  "https://gis.dnr.state.mn.us/arcgis/sharing/servers/8462b6a81c46461484c68d4bd638134c/rest/services";
const verifiedOn = "2026-09-26";
const attribution = "Minnesota Department of Natural Resources";

type DnrLayerSpec = Omit<LayerDefinition, "category" | "sourceType" | "defaultVisible" | "attribution"> & {
  dnr: DnrLayerInfo;
  nameField: string;
  popupFields: readonly LayerPopupField[];
};

function uniqueFields(fields: readonly (string | undefined)[]): string {
  return [...new Set(fields.filter((field): field is string => Boolean(field)))].join(",");
}

// The layer asks the service for exactly the attributes its results can show.
function requestedFields(spec: DnrLayerSpec): string {
  const { dnr } = spec;
  return uniqueFields([
    spec.nameField,
    ...spec.popupFields.map(({ field }) => field),
    ...(dnr.moreFields ?? []).map(({ field }) => field),
    ...(dnr.linkFields ?? []).map(({ field }) => field),
    dnr.alertField,
    dnr.season?.source === "service" ? dnr.season.field : undefined,
  ]);
}

function defineDnrLayer(spec: DnrLayerSpec): LayerDefinition {
  return {
    ...spec,
    category: "dnr-recreation",
    sourceType: "arcgis-featureserver",
    defaultVisible: false,
    attribution,
    agency: attribution,
    options: { ...spec.options, outFields: requestedFields(spec) },
  };
}

const deerPermitAreas: DnrLayerSpec = {
  id: "mndnr-deer-permit-areas",
  name: "Deer permit areas",
  url: `${mngeoRoot}/bdry_deer_permit_areas/FeatureServer`,
  sourceUrl: `${mngeoSource}/bdry_deer_permit_areas/FeatureServer/0`,
  defaultOpacity: 0.7,
  description:
    "Deer permit area boundaries DNR uses to manage deer hunting. A permit area is a management boundary, not land ownership or permission to enter.",
  nameField: "maptitle",
  popupFields: [
    { field: "management", label: "Management" },
    { field: "designatio", label: "Harvest designation" },
  ],
  dnr: {
    heading: "hunting-zones-health",
    meaningClass: "regulation-zone",
    verifyUrl: "https://www.dnr.state.mn.us/mammals/deer/management/dpas.html",
    verifiedOn,
    season: { source: "service", field: "effperiod", lastVerifiedPeriod: "July 2026 - June 2027" },
    moreFields: [
      { field: "specialreg", label: "Special regulations" },
      { field: "firearmtyp", label: "Firearm type" },
      { field: "disemgmt", label: "Disease management" },
      { field: "disesamp", label: "Disease sampling" },
      { field: "carcmovmt", label: "Carcass movement" },
    ],
    linkFields: [
      { field: "desgpage", label: "Harvest designation" },
      { field: "disepage", label: "CWD testing" },
      { field: "carcpage", label: "Carcass movement rules" },
    ],
  },
  options: { layerId: 0, fillColor: "#c58a3a", strokeColor: "#f0cf95", fillAlpha: 0.18, strokeWidth: 2 },
};

const bearPermitAreas: DnrLayerSpec = {
  id: "mndnr-bear-permit-areas",
  name: "Bear permit areas",
  url: `${mngeoRoot}/bdry_bear_permit_areas/FeatureServer`,
  sourceUrl: `${mngeoSource}/bdry_bear_permit_areas/FeatureServer/0`,
  defaultOpacity: 0.7,
  description:
    "Bear management units. The service publishes no season, so the season label is set here and re-verified against DNR each year. A permit boundary is not access permission.",
  nameField: "bmu_label",
  popupFields: [],
  dnr: {
    heading: "hunting-zones-health",
    meaningClass: "regulation-zone",
    verifyUrl: "https://www.dnr.state.mn.us/hunting/bear/index.html",
    verifiedOn,
    titlePrefix: "Bear management unit ",
    // DNR posts the next season's permit areas in April, so the label is asserted only until then.
    season: { source: "configured", label: "2026 season", verifiedThrough: "2027-03-31" },
  },
  options: { layerId: 0, fillColor: "#7a5638", strokeColor: "#d2ac86", fillAlpha: 0.18, strokeWidth: 2 },
};

const turkeyPermitAreas: DnrLayerSpec = {
  id: "mndnr-turkey-permit-areas",
  name: "Turkey permit areas",
  url: `${mngeoRoot}/bdry_turkey_permit_areas/FeatureServer`,
  sourceUrl: `${mngeoSource}/bdry_turkey_permit_areas/FeatureServer/0`,
  defaultOpacity: 0.7,
  description:
    "Wild turkey permit areas. The service publishes no season, so the season label is set here and re-verified against DNR each year. A permit boundary is not access permission.",
  nameField: "tpa",
  popupFields: [],
  dnr: {
    heading: "hunting-zones-health",
    meaningClass: "regulation-zone",
    verifyUrl: "https://www.dnr.state.mn.us/gohunting/wild-turkey-hunting.html",
    verifiedOn,
    titlePrefix: "Turkey permit area ",
    // Spring 2027 permit areas may change when DNR posts them, so the label is asserted through 2026.
    season: { source: "configured", label: "Fall 2026 season", verifiedThrough: "2026-12-31" },
  },
  options: { layerId: 0, fillColor: "#a3552f", strokeColor: "#e3a07f", fillAlpha: 0.18, strokeWidth: 2 },
};

const cwdZones: DnrLayerSpec = {
  id: "mndnr-cwd-zones",
  name: "CWD zones",
  url: `/api/gis-proxy/dnr-gis/${cwdService}/FeatureServer`,
  sourceUrl: `${cwdSource}/${cwdService}/FeatureServer/3`,
  defaultOpacity: 0.7,
  description:
    "Chronic wasting disease management zones and the sampling and carcass rules that apply in them this season. Zones regulate hunting and do not show ownership or access.",
  nameField: "cwdzone",
  popupFields: [
    { field: "cwdzone", label: "CWD zone" },
    { field: "disemgmt", label: "Disease management" },
    { field: "disesamp", label: "Sampling" },
    { field: "carcmovmt", label: "Carcass movement" },
    { field: "feedattban", label: "Feeding and attractant ban" },
  ],
  dnr: {
    heading: "hunting-zones-health",
    meaningClass: "regulation-zone",
    verifyUrl: "https://www.dnr.state.mn.us/cwd/index.html",
    verifiedOn,
    season: { source: "service", field: "effperiod", lastVerifiedPeriod: "July 2026 - June 2027" },
    moreFields: [
      { field: "dpa", label: "Deer permit area" },
      { field: "designatio", label: "Harvest designation" },
      { field: "dpecialteg", label: "Special regulations" },
    ],
    linkFields: [
      { field: "cwdhunturl", label: "Current CWD hunt" },
      { field: "disepage", label: "CWD testing" },
      { field: "carcpage", label: "Carcass movement rules" },
      { field: "fdbanpage", label: "Feeding ban" },
    ],
  },
  options: { layerId: 3, fillColor: "#b8443a", strokeColor: "#f0a59d", fillAlpha: 0.2, strokeWidth: 2 },
};

const walkInAccessSites: DnrLayerSpec = {
  id: "mndnr-walk-in-access-sites",
  name: "Walk-In Access sites",
  url: `${mngeoRoot}/bdry_dnr_walk_in_access_sites/FeatureServer`,
  sourceUrl: `${mngeoSource}/bdry_dnr_walk_in_access_sites/FeatureServer/0`,
  defaultOpacity: 0.75,
  description:
    "Private land enrolled in DNR's Walk-In Access program. Enrollment is validated, dated, and can end when a landowner opts out.",
  nameField: "map_title",
  popupFields: [
    { field: "cty_name", label: "County" },
    { field: "acres", label: "Acres" },
    { field: "uses", label: "Uses" },
    { field: "usernotes", label: "Notes" },
  ],
  dnr: {
    heading: "hunting-access-habitat",
    meaningClass: "enrolled-private-land",
    verifyUrl: "https://www.dnr.state.mn.us/walkin/index.html",
    verifiedOn,
    moreFields: [{ field: "wia_id", label: "WIA ID" }],
  },
  options: { layerId: 0, fillColor: "#3f9a63", strokeColor: "#a5e3bd", fillAlpha: 0.28, strokeWidth: 2 },
};

const hunterWalkingTrails: DnrLayerSpec = {
  id: "mndnr-hunter-walking-trails",
  name: "Hunter Walking Trails",
  url: `${mngeoRoot}/trans_hunter_walking_trails/FeatureServer`,
  sourceUrl: `${mngeoSource}/trans_hunter_walking_trails/FeatureServer/0`,
  defaultOpacity: 0.9,
  description:
    "Trails that give hunters foot access across state and cooperating land. A trail can cross several ownerships, and rules can change from one segment to the next.",
  nameField: "trail_name",
  popupFields: [
    { field: "unit_name", label: "Unit" },
    { field: "owner", label: "Owner" },
    { field: "admin", label: "Administrator" },
    { field: "cooperator", label: "Cooperator" },
    { field: "lmiles", label: "Miles" },
    { field: "comments", label: "Comments" },
  ],
  dnr: {
    heading: "hunting-access-habitat",
    meaningClass: "access-varies",
    verifyUrl: "https://www.dnr.state.mn.us/hunting/hwt/index.html",
    verifiedOn,
    moreFields: [
      { field: "area_name", label: "Area" },
      { field: "editdate", label: "Last edited" },
      { field: "phone", label: "Phone" },
    ],
    linkFields: [
      { field: "pdf_file", label: "Trail GeoPDF", baseUrl: "https://files.dnr.state.mn.us/hunting/hwt/" },
    ],
    dateFields: ["editdate"],
  },
  options: { layerId: 0, fillColor: "#e0a13a", strokeColor: "#ffd27a", fillAlpha: 0, strokeWidth: 3, identifyNearby: true },
};

const fishingSites: DnrLayerSpec = {
  id: "mndnr-fishing-sites",
  name: "Fishing piers & shore-fishing sites",
  url: `${mngeoRoot}/struc_fishing_sites_in_minnesota/FeatureServer`,
  sourceUrl: `${mngeoSource}/struc_fishing_sites_in_minnesota/FeatureServer/0`,
  defaultOpacity: 0.95,
  description:
    "DNR's inventory of fishing piers and shore-fishing sites. A point marks a facility, not access to the shore beside it or permission to take any species.",
  nameField: "facility_name",
  popupFields: [
    { field: "fishing_site_type", label: "Site type" },
    { field: "lake_name", label: "Lake" },
    { field: "county_name", label: "County" },
    { field: "managing_party", label: "Managing party" },
    { field: "ada_accessible_flag", label: "ADA accessible" },
  ],
  dnr: {
    heading: "fishing-water-access",
    meaningClass: "facility",
    verifyUrl: "https://www.dnr.state.mn.us/regulations/fishing/index.html",
    verifiedOn,
    moreFields: [
      { field: "facility_descrip", label: "Description" },
      { field: "directions", label: "Directions" },
    ],
    links: [{ label: "About fishing piers", href: "https://www.dnr.state.mn.us/fishing_piers/index.html" }],
  },
  options: { layerId: 0, fillColor: "#2f8fbf", strokeColor: "#9bd6f2", fillAlpha: 0.9, strokeWidth: 2, identifyNearby: true },
};

// The service holds more sites than one query returns, so the layer waits for a closer view
// rather than draw part of them.
const waterAccessSites: DnrLayerSpec = {
  id: "mndnr-public-water-access",
  name: "Public-water access",
  url: `${mngeoRoot}/struc_water_access_sites/FeatureServer`,
  sourceUrl: `${mngeoSource}/struc_water_access_sites/FeatureServer/0`,
  defaultOpacity: 0.95,
  description:
    "DNR's inventory of public water accesses. A point marks a facility, not access to the shore beside it or permission to take any species. Closures and conditions appear as alerts.",
  nameField: "access_name",
  popupFields: [
    { field: "administrator", label: "Administrator" },
    { field: "county_name", label: "County" },
    { field: "launch_type", label: "Launch type" },
    { field: "lake_name", label: "Lake" },
    { field: "state_water_trail_name", label: "State water trail" },
  ],
  dnr: {
    heading: "fishing-water-access",
    meaningClass: "facility",
    verifyUrl: "https://www.dnr.state.mn.us/water_access/index.html",
    verifiedOn,
    alertField: "alerts",
    moreFields: [
      { field: "directions", label: "Directions" },
      { field: "ramp_surface", label: "Ramp surface" },
      { field: "number_of_ramps", label: "Ramps" },
      { field: "number_of_docks", label: "Docks" },
      { field: "car_parking_spaces_non_ada", label: "Car parking spaces" },
      { field: "trailer_parking_spaces_non_ada", label: "Trailer parking spaces" },
      { field: "accessible_parking_spaces", label: "Accessible parking spaces" },
      { field: "number_of_toilets", label: "Toilets" },
    ],
  },
  options: {
    layerId: 0,
    fillColor: "#3a6fd8",
    strokeColor: "#a9c2f5",
    fillAlpha: 0.9,
    strokeWidth: 2,
    identifyNearby: true,
    maxCameraHeight: 300_000,
  },
};

// Drawn bottom to top, so the drawer, which lists the topmost first, reads in the order below it.
// The annotation lets a public build drop the whole collection: without it the bundler must keep
// the call, and with it the specs and every service address in them.
export const dnrRecreationLayers: readonly LayerDefinition[] = /* @__PURE__ */ [
  cwdZones,
  turkeyPermitAreas,
  bearPermitAreas,
  deerPermitAreas,
  walkInAccessSites,
  hunterWalkingTrails,
  fishingSites,
  waterAccessSites,
].map(defineDnrLayer);
