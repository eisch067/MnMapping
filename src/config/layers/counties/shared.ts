import type { LayerBounds, LayerDefinition } from "../types";

const parcelService = "/api/gis-proxy/mngeo-features/us_mn_state_mngeo/plan_parcels_open/FeatureServer";
const parcelSource = "https://enterprise.gisdata.mn.gov/aghost/rest/services/us_mn_state_mngeo/plan_parcels_open/FeatureServer/1";
const verifiedAt = "2026-09-14";

export function createMnGeoParcelLayer(
  id: string,
  name: string,
  fips: string,
  countyBounds: LayerBounds,
  parcelCount?: number,
  acquired?: string,
): LayerDefinition {
  const countText = parcelCount === undefined ? "" : ` ${parcelCount.toLocaleString("en-US")} county records were present at verification.`;
  const acquiredText = acquired ? ` Source acquisition date: ${acquired}.` : "";
  return {
    id: `${id}-parcels`,
    name: `${name} tax parcels`,
    category: "parcels",
    sourceType: "arcgis-featureserver",
    url: parcelService,
    sourceUrl: parcelSource,
    defaultVisible: false,
    defaultOpacity: 0.8,
    attribution: "Minnesota Geospatial Information Office Open Parcels",
    agency: "Minnesota Geospatial Information Office; contributed county parcel data",
    county: name,
    bounds: countyBounds,
    description: `Standardized county parcel geometry and attributes from Minnesota's official Open Parcels service.${countText}${acquiredText} Verified ${verifiedAt}.`,
    nameField: "county_pin",
    parcelFields: {
      parcelId: "county_pin",
      owner: "owner_name",
      secondaryOwner: "owner_more",
      mailingAddress: "own_add_l1",
      acres: "acres_deed",
      legalDescription: "abb_legal",
      assessedValue: "emv_total",
      taxYear: "tax_year",
    },
    options: {
      layerId: 1,
      where: `co_code='27${fips}'`,
      outFields: "county_pin,owner_name,owner_more,own_add_l1,acres_deed,abb_legal,emv_total,tax_year,co_code",
      fillColor: "#ffffff",
      strokeColor: "#f2d48a",
      fillAlpha: 0.01,
      strokeWidth: 1,
      maxCameraHeight: 35_000,
    },
  };
}
