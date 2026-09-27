import type { DnrLayerInfo, LayerDefinition, LayerPopupField, LayerSourceType } from "./types";
import {
  brokenRgmaPdfFiles,
  stateTrailPages,
  waterTrailPages,
} from "./dnrTrailLinks";

const mngeoRoot = "/api/gis-proxy/mngeo-features/us_mn_state_dnr";
const mngeoSource = "https://enterprise.gisdata.mn.gov/aghost/rest/services/us_mn_state_dnr";
const cwdService = "Hosted/CWD_Sampling_and_Regulations_for_MN_2020_Deer_Seasons_Public_View";
const cwdSource =
  "https://gis.dnr.state.mn.us/arcgis/sharing/servers/8462b6a81c46461484c68d4bd638134c/rest/services";
const verifiedOn = "2026-09-26";
const waterReferenceVerifiedOn = "2026-09-27";
const attribution = "Minnesota Department of Natural Resources";

type DnrLayerSpec = Omit<LayerDefinition, "category" | "sourceType" | "defaultVisible" | "attribution"> & {
  // Every layer is a feature service unless it says otherwise.
  sourceType?: LayerSourceType;
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
    ...(dnr.nameLinks ?? []).map(({ field }) => field),
    dnr.alertField,
    dnr.lake?.dowField,
    dnr.lake?.nameField,
    dnr.season?.source === "service" ? dnr.season.field : undefined,
  ]);
}

function defineDnrLayer(spec: DnrLayerSpec): LayerDefinition {
  const sourceType = spec.sourceType ?? "arcgis-featureserver";
  return {
    ...spec,
    category: "dnr-recreation",
    sourceType,
    defaultVisible: false,
    attribution,
    agency: attribution,
    options:
      sourceType === "arcgis-featureserver"
        ? { ...spec.options, outFields: requestedFields(spec) }
        : spec.options,
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
      // DNR's own spelling of the field on this service; the deer service spells it specialreg.
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
    lake: { dowField: "dow_lake_number", nameField: "lake_name" },
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
    lake: { dowField: "dow_lake_id", nameField: "lake_name" },
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
    maxCameraHeight: 150_000,
  },
};

const lakeFinderSearch = "https://www.dnr.state.mn.us/lakefind/index.html";

const migratoryWaterfowlAreas: DnrLayerSpec = {
  id: "mndnr-migratory-waterfowl-areas",
  name: "Migratory waterfowl feeding & resting areas",
  url: `${mngeoRoot}/env_migratory_waterfowl_areas/FeatureServer`,
  sourceUrl: `${mngeoSource}/env_migratory_waterfowl_areas/FeatureServer/1`,
  defaultOpacity: 0.75,
  description:
    "Waters designated to protect migratory waterfowl from disturbance. This is a regulation reference, not land ownership or general public access. electric_m is omitted because its service-field meaning is not documented.",
  nameField: "gnis_name",
  popupFields: [
    { field: "county", label: "County" },
    { field: "acres", label: "Acres" },
    { field: "f_and_r_ar", label: "Designated area" },
  ],
  dnr: {
    heading: "hunting-zones-health",
    meaningClass: "regulation-zone",
    verifyUrl: "https://www.dnr.state.mn.us/hunting/waterfowl/index.html",
    verifiedOn,
    links: [{
      label: "About feeding and resting areas",
      href: "https://www.dnr.state.mn.us/wildlife/shallowlakes/mwfra.html",
    }],
  },
  options: { layerId: 1, fillColor: "#4e77aa", strokeColor: "#a9c6e8", fillAlpha: 0.2, strokeWidth: 2 },
};

const walkInAccessTrails: DnrLayerSpec = {
  id: "mndnr-walk-in-access-trails",
  name: "Walk-In Access trails",
  url: `${mngeoRoot}/struc_dnr_walk_in_access_trails/FeatureServer`,
  sourceUrl: `${mngeoSource}/struc_dnr_walk_in_access_trails/FeatureServer/0`,
  defaultOpacity: 0.9,
  description:
    "Access routes serving private land enrolled in Walk-In Access. Enrollment and access can change when a landowner opts out.",
  nameField: "traildescr",
  popupFields: [{ field: "type", label: "Trail type" }],
  dnr: {
    heading: "hunting-access-habitat",
    meaningClass: "enrolled-private-land",
    verifyUrl: "https://www.dnr.state.mn.us/walkin/index.html",
    verifiedOn,
  },
  options: { layerId: 0, fillColor: "#47a36b", strokeColor: "#b2e8c4", fillAlpha: 0, strokeWidth: 3, identifyNearby: true },
};

const stateForestRoads: DnrLayerSpec = {
  id: "mndnr-state-forest-roads",
  name: "State forest roads",
  url: `${mngeoRoot}/trans_state_forest_roads/FeatureServer`,
  sourceUrl: `${mngeoSource}/trans_state_forest_roads/FeatureServer/0`,
  defaultOpacity: 0.9,
  description:
    "DNR state forest roads. Road class is shown verbatim and does not establish which vehicles may use a road; check current closures and posted signs.",
  nameField: "road_name",
  popupFields: [
    { field: "road_num", label: "Road number" },
    { field: "road_class", label: "DNR road class" },
    { field: "forest_area", label: "Forest area" },
    { field: "miles", label: "Miles" },
  ],
  dnr: {
    heading: "recreation-trails",
    meaningClass: "access-varies",
    verifyUrl: "https://www.dnr.state.mn.us/state_forests/rules.html",
    verifiedOn,
    links: [{
      label: "Current forest road conditions",
      href: "https://www.dnr.state.mn.us/trailconditions/listing.html",
    }],
  },
  options: { layerId: 0, fillColor: "#906f52", strokeColor: "#dbc1a6", fillAlpha: 0, strokeWidth: 2, identifyNearby: true },
};

const stateForestCampgrounds: DnrLayerSpec = {
  id: "mndnr-state-forest-campgrounds",
  name: "State forest campgrounds & day-use areas",
  url: `${mngeoRoot}/struc_state_forest_campgrounds/FeatureServer`,
  sourceUrl: `${mngeoSource}/struc_state_forest_campgrounds/FeatureServer/1`,
  defaultOpacity: 0.95,
  description:
    "Current Parks and Trails Enterprise Information System facilities (layer 1). The legacy layer 0 named Orig is intentionally not used. Open dates and amenities vary by site.",
  nameField: "facility_name",
  popupFields: [
    { field: "site_type", label: "Site type" },
    { field: "state_forest", label: "State forest" },
    { field: "county", label: "County" },
  ],
  dnr: {
    heading: "recreation-trails",
    meaningClass: "facility",
    verifyUrl: "https://www.dnr.state.mn.us/state_forests/camping.html",
    verifiedOn,
  },
  options: { layerId: 1, fillColor: "#a76b34", strokeColor: "#f0c28e", fillAlpha: 0.9, strokeWidth: 2, identifyNearby: true },
};

const listedInfestedWaters: DnrLayerSpec = {
  id: "mndnr-listed-infested-waters",
  name: "Listed infested waters",
  url: `${mngeoRoot}/env_listed_infested_waters/FeatureServer`,
  sourceUrl: `${mngeoSource}/env_listed_infested_waters/FeatureServer/0`,
  defaultOpacity: 0.7,
  description:
    "DNR-listed infested-water records. A waterbody can appear once per listed species; use DNR's current list for regulatory or permitting decisions.",
  nameField: "waterbodydisplayname",
  popupFields: [
    { field: "counties", label: "County" },
    { field: "commonname", label: "Listed species" },
    { field: "designateddate", label: "Designated" },
    { field: "confirmdate", label: "Confirmed" },
  ],
  dnr: {
    heading: "fishing-water-access",
    meaningClass: "regulation-zone",
    verifyUrl: "https://www.dnr.state.mn.us/invasives/ais/infested.html",
    verifiedOn,
    moreFields: [
      { field: "connectednote", label: "Connected-water note" },
      { field: "note", label: "Note" },
    ],
    dateFields: ["designateddate", "confirmdate"],
    notes: ["DNR-listed infested water — special rules may apply. Verify the current official list."],
  },
  options: { layerId: 0, fillColor: "#b34f75", strokeColor: "#efabc4", fillAlpha: 0.18, strokeWidth: 2 },
};

const ruffedGrouseManagementAreas: DnrLayerSpec = {
  id: "mndnr-ruffed-grouse-management-areas",
  name: "Ruffed Grouse Management Areas",
  url: `${mngeoRoot}/bdry_ruffed_grouse_mgmt_areas/FeatureServer`,
  sourceUrl: `${mngeoSource}/bdry_ruffed_grouse_mgmt_areas/FeatureServer/1`,
  defaultOpacity: 0.75,
  description:
    "Incomplete DNR habitat-designation coverage in 13 northern counties. Boundaries are edited as needed and do not show ownership, public access, or hunting eligibility.",
  nameField: "unit_name",
  popupFields: [
    { field: "county", label: "County" },
    { field: "area_name", label: "Area" },
    { field: "acres", label: "Acres" },
    { field: "miles_hwt", label: "Hunter-walking-trail miles" },
  ],
  dnr: {
    heading: "hunting-access-habitat",
    meaningClass: "managed-land",
    verifyUrl: "https://www.dnr.state.mn.us/regulations/hunting/index.html",
    verifiedOn,
    moreFields: [
      { field: "admin", label: "Administrator" },
      { field: "cooperator", label: "Cooperator" },
      { field: "nearest_to", label: "Nearest to" },
      { field: "directions", label: "Directions" },
      { field: "editdate", label: "Boundary last edited" },
    ],
    dateFields: ["editdate"],
    links: [{ label: "RGMA program", href: "https://www.dnr.state.mn.us/rgma/index.html" }],
    linkFields: [{
      field: "pdf_file",
      label: "Unit map PDF",
      baseUrl: "https://files.dnr.state.mn.us/hunting/rgma/",
      excludedValues: brokenRgmaPdfFiles,
    }],
  },
  options: { layerId: 1, fillColor: "#7d8f3c", strokeColor: "#c9dc82", fillAlpha: 0.22, strokeWidth: 2 },
};

const stateWaterTrails: DnrLayerSpec = {
  id: "mndnr-state-water-trails",
  name: "State Water Trails",
  url: `${mngeoRoot}/trans_water_trails_minnesota/FeatureServer`,
  sourceUrl: `${mngeoSource}/trans_water_trails_minnesota/FeatureServer/0`,
  defaultOpacity: 0.9,
  description:
    "Approximate river centerlines interpreted from 2009 imagery. They are not for navigation or legal use, and much adjoining shoreland is private.",
  nameField: "trail_name",
  popupFields: [{ field: "lengthmile", label: "Segment miles" }],
  dnr: {
    heading: "fishing-water-access",
    meaningClass: "facility",
    verifyUrl: "https://www.dnr.state.mn.us/state-water-trails/safety-rules.html",
    verifiedOn,
    nameLinks: [{ field: "trail_name", label: "DNR water-trail page", pages: waterTrailPages }],
    links: [{ label: "River levels", href: "https://www.dnr.state.mn.us/river_levels/index.html" }],
    notes: ["Approximate river centerline, not for navigation. Stop only at designated sites."],
  },
  options: { layerId: 0, fillColor: "#2c91bc", strokeColor: "#8fd8f0", fillAlpha: 0, strokeWidth: 3, identifyNearby: true },
};

const stateTrails: DnrLayerSpec = {
  id: "mndnr-state-trails",
  name: "State Trails",
  url: `${mngeoRoot}/trans_state_trails_minnesota/FeatureServer`,
  sourceUrl: `${mngeoSource}/trans_state_trails_minnesota/FeatureServer/0`,
  defaultOpacity: 0.9,
  description:
    "Constructed state-trail segments; proposed alignments are excluded. Recorded uses can be incomplete or stale, so this layer does not render the service's use flags.",
  nameField: "trail_name",
  popupFields: [
    { field: "surfacetyp", label: "Surface" },
    { field: "width", label: "Width" },
    { field: "lengthmile", label: "Segment miles" },
  ],
  dnr: {
    heading: "recreation-trails",
    meaningClass: "access-varies",
    verifyUrl: "https://www.dnr.state.mn.us/state-trails/rules.html",
    verifiedOn,
    nameLinks: [{ field: "trail_name", label: "DNR state-trail page", pages: stateTrailPages }],
    links: [{ label: "Temporary closures", href: "https://www.dnr.state.mn.us/trailconditions/index.html" }],
    notes: ["Recorded uses may not be current or complete. Check the DNR trail page for alerts and closures."],
  },
  options: { layerId: 0, fillColor: "#8f5db7", strokeColor: "#d5afe9", fillAlpha: 0, strokeWidth: 3, identifyNearby: true },
};

const snowmobileTrails: DnrLayerSpec = {
  id: "mndnr-snowmobile-trails",
  name: "Snowmobile trails",
  url: `${mngeoRoot}/trans_snowmobile_trails_mn/FeatureServer`,
  sourceUrl: `${mngeoSource}/trans_snowmobile_trails_mn/FeatureServer/0`,
  defaultOpacity: 0.9,
  description:
    "Seasonal reference layer, not grooming or open/closed status. Some trails cross private land. Volunteer names, phone numbers, and email addresses are intentionally omitted.",
  nameField: "trail_name",
  popupFields: [
    { field: "trail_num", label: "Trail number" },
    { field: "owner_type", label: "Program category" },
    { field: "maint_by", label: "Maintained by" },
    { field: "miles", label: "Miles" },
  ],
  dnr: {
    heading: "recreation-trails",
    meaningClass: "access-varies",
    verifyUrl: "https://www.dnr.state.mn.us/regulations/snowmobile/index.html",
    verifiedOn,
    freshness: {
      label: "2026–27 season",
      contentDate: "2026-09-23",
      freshThrough: "2027-08-31",
      staleWarning: "DNR has not been re-verified for the current snowmobile season. Check conditions before riding.",
    },
    links: [
      { label: "Trail contacts", href: "https://www.dnr.state.mn.us/snowmobiling/trailcontacts.html" },
      { label: "Snow depth & trail conditions", href: "https://www.dnr.state.mn.us/snow_depth/index.html" },
    ],
    notes: ["Grant-in-aid trails are seasonal and may cross private land. This is not grooming or open/closed status."],
  },
  options: {
    layerId: 0,
    fillColor: "#4b79bd",
    strokeColor: "#9dc2ef",
    fillAlpha: 0,
    strokeWidth: 3,
    identifyNearby: true,
    maxCameraHeight: 150_000,
    maxAllowableOffset: 0.0005,
  },
};

const ohvTrails: DnrLayerSpec = {
  id: "mndnr-ohv-trails",
  name: "OHV trails",
  url: `${mngeoRoot}/trans_ohv_trails_mn/FeatureServer`,
  sourceUrl: `${mngeoSource}/trans_ohv_trails_mn/FeatureServer/0`,
  defaultOpacity: 0.9,
  description:
    "DNR-listed state, grant-in-aid, and club OHV trails; federal routes are excluded. Vehicle classes are copied from DNR and do not establish that a segment is currently open.",
  nameField: "trail_name",
  popupFields: [
    { field: "segment_name", label: "Segment" },
    { field: "surface_type", label: "Surface" },
    { field: "funding_type", label: "Program category" },
    { field: "trail_width", label: "Width" },
    { field: "atv_class_1", label: "ATV class 1" },
    { field: "atv_class_2", label: "ATV class 2" },
    { field: "off_highway_motorcycle", label: "Off-highway motorcycle" },
    { field: "off_road_vehicle", label: "Off-road vehicle" },
    { field: "road_class", label: "Road class" },
    { field: "miles", label: "Miles" },
  ],
  dnr: {
    heading: "recreation-trails",
    meaningClass: "access-varies",
    verifyUrl: "https://www.dnr.state.mn.us/regulations/ohv/index.html",
    verifiedOn,
    freshness: {
      label: "2026 season",
      contentDate: "2026-09-23",
      freshThrough: "2026-12-31",
      staleWarning: "DNR's OHV season label is stale. The layer remains available; check current closures before riding.",
    },
    linkFields: [{ field: "web_site", label: "DNR trail page" }],
    links: [{ label: "Current OHV closures", href: "https://www.dnr.state.mn.us/ohv/closures.html" }],
    notes: ["Vehicle classes are as recorded by DNR. Check the DNR closures page before riding."],
  },
  options: {
    layerId: 0,
    fillColor: "#d16935",
    strokeColor: "#f4b087",
    fillAlpha: 0,
    strokeWidth: 3,
    identifyNearby: true,
    maxCameraHeight: 150_000,
    maxAllowableOffset: 0.0005,
  },
};

const lakes: DnrLayerSpec = {
  id: "mndnr-lakes-lakefinder",
  name: "Lakes & LakeFinder",
  url: `${mngeoRoot}/water_mn_public_waters/FeatureServer`,
  sourceUrl: `${mngeoSource}/water_mn_public_waters/FeatureServer/1`,
  defaultOpacity: 0.7,
  description:
    "Public Waters basin outlines, keyed by DNR's DOW lake number. Select a lake to open its LakeFinder summary: official identity, special regulations, and depth. An outline is a basin boundary, not a survey of the shore or of where the public may go.",
  nameField: "pw_basin_name",
  popupFields: [
    { field: "dowlknum", label: "DOW number" },
    { field: "acres", label: "Acres" },
  ],
  dnr: {
    heading: "fishing-water-access",
    meaningClass: "reference",
    verifyUrl: "https://www.dnr.state.mn.us/regulations/fishing/index.html",
    verifiedOn,
    lake: { dowField: "dowlknum", nameField: "pw_basin_name" },
    links: [{ label: "Search LakeFinder", href: lakeFinderSearch }],
  },
  // The service holds about 22,000 basins, so the layer waits for a view of a few hundred.
  options: {
    layerId: 1,
    fillColor: "#5aa9d6",
    strokeColor: "#9fd3ee",
    fillAlpha: 0.04,
    strokeWidth: 1,
    maxCameraHeight: 40_000,
  },
};

// A live display: the service's tiles cannot be exported, so nothing here is stored. The metadata
// footprints (layer 2) are left out, and the shaded-relief image service is token-gated.
const lakeDepthMap: DnrLayerSpec = {
  id: "mndnr-lake-depth-map",
  name: "Lake depth map",
  sourceType: "arcgis-mapserver",
  url: `${mngeoRoot}/water_lake_bathymetry/MapServer`,
  sourceUrl: `${mngeoSource}/water_lake_bathymetry/MapServer`,
  defaultOpacity: 0.8,
  description:
    "DNR's bathymetry service, drawn live: mapped lake outlines, depth contours, and an elevation model. Select a lake to see its name, DOW number, and the contour depth under the point. Only some lakes are mapped.",
  nameField: "lake_name",
  popupFields: [],
  dnr: {
    heading: "fishing-water-access",
    meaningClass: "reference",
    verifyUrl: "https://www.dnr.state.mn.us/lakemapping/description.html",
    verifiedOn,
    caution:
      "Official coverage is incomplete and historical: not every lake is mapped, and depths may have changed since a survey. Not for navigation.",
  },
  options: {
    layers: "0,1,3",
    enablePickFeatures: false,
    usePreCachedTilesIfAvailable: false,
  },
};

const nationalWetlandsInventory: DnrLayerSpec = {
  id: "mndnr-national-wetlands-inventory",
  name: "National Wetlands Inventory",
  sourceType: "arcgis-mapserver",
  url: `${mngeoRoot}/water_nat_wetlands_inv_2009_2014/MapServer`,
  sourceUrl: `${mngeoSource}/water_nat_wetlands_inv_2009_2014/MapServer/0`,
  defaultOpacity: 0.65,
  description:
    "Minnesota NWI inventory mapped from 2009–2014 imagery. This is a planning reference, not current conditions, a wetland boundary, or a jurisdictional determination.",
  nameField: "wetland_type",
  popupFields: [],
  dnr: {
    heading: "water-regulatory-reference",
    meaningClass: "inventory-reference",
    verifyUrl: "https://www.dnr.state.mn.us/wetlands/index.html",
    verifiedOn: waterReferenceVerifiedOn,
    caution: "Mapped from 2009–2014 imagery; not current conditions.",
    notes: [
      "The NWI has no legal or regulatory status. It is not a jurisdictional wetland determination.",
      "Contact your local government or the Army Corps of Engineers before work near water.",
    ],
    links: [{ label: "DNR wetlands information", href: "https://www.dnr.state.mn.us/wetlands/index.html" }],
  },
  options: { layers: "0", enablePickFeatures: false, maxCameraHeight: 20_000 },
};

const bufferProtectionLines: DnrLayerSpec = {
  id: "mndnr-buffer-protection-lines",
  name: "Buffer Protection — public waters & ditches",
  sourceType: "arcgis-mapserver",
  url: `${mngeoRoot}/env_buffer_protection_mn/MapServer`,
  sourceUrl: `${mngeoSource}/env_buffer_protection_mn/MapServer/1`,
  defaultOpacity: 0.9,
  description:
    "Water features used as a general guide to minimum state buffer requirements. Buffer strips are not drawn because source positional accuracy is similar to the buffer width.",
  nameField: "description",
  popupFields: [],
  dnr: {
    heading: "water-regulatory-reference",
    meaningClass: "regulatory-guide",
    verifyUrl: "https://www.dnr.state.mn.us/buffers/index.html",
    verifiedOn: waterReferenceVerifiedOn,
    caution: "Statewide revision of August 2019; confirm site conditions and local requirements.",
    notes: [
      "This is a general guide, not parcel ownership or a compliance determination. Exemptions and stricter local rules are not shown. Confirm with your SWCD.",
      "Statewide revision of August 2019.",
    ],
    links: [
      { label: "DNR Buffer Mapping Project", href: "https://www.dnr.state.mn.us/buffers/index.html" },
      { label: "BWSR Minnesota Buffer Law", href: "https://bwsr.state.mn.us/minnesota-buffer-law" },
      { label: "Minn. Stat. 103F.48", href: "https://www.revisor.mn.gov/statutes/cite/103F.48" },
    ],
  },
  options: { layers: "1", enablePickFeatures: false, maxCameraHeight: 40_000 },
};

const bufferProtectionBasins: DnrLayerSpec = {
  ...bufferProtectionLines,
  id: "mndnr-buffer-protection-basins",
  name: "Buffer Protection — lakes & basins",
  sourceUrl: `${mngeoSource}/env_buffer_protection_mn/MapServer/2`,
  options: { layers: "2", enablePickFeatures: false, maxCameraHeight: 40_000 },
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
  walkInAccessTrails,
  hunterWalkingTrails,
  ruffedGrouseManagementAreas,
  migratoryWaterfowlAreas,
  lakeDepthMap,
  nationalWetlandsInventory,
  bufferProtectionLines,
  bufferProtectionBasins,
  lakes,
  fishingSites,
  waterAccessSites,
  listedInfestedWaters,
  stateWaterTrails,
  stateForestRoads,
  stateForestCampgrounds,
  stateTrails,
  snowmobileTrails,
  ohvTrails,
].map(defineDnrLayer);
