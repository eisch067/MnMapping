import type { LayerBounds, LayerDefinition } from "../types";
import { isPersonalMode } from "../../appMode";

const parcelService = "/api/gis-proxy/mngeo-features/us_mn_state_mngeo/plan_parcels_open/FeatureServer";
const parcelSource = "https://enterprise.gisdata.mn.gov/aghost/rest/services/us_mn_state_mngeo/plan_parcels_open/FeatureServer/1";
const verifiedAt = "2026-09-14";

// These counties run their own property-lookup site with an explicit anti-bulk-extraction or
// licensee-only policy for owner/mailing-address/assessed-value data (see the 2026-09 licensing
// audit, docs/licensing/RISK-REGISTER.md item H2, and each county's page under
// docs/licensing/COUNTY-DETAILS/). MnMapping shows parcel shape and boundary for them as normal,
// but omits owner name, mailing address, and assessed value, and links to the county's own site
// for that information instead.
const countiesWithRedactedOwnerFields: Readonly<Record<string, string>> = {
  hennepin: "https://propertyinformation.hennepin.us/",
  wright: "https://propertyaccess.co.wright.mn.us/",
  washington: "https://www.washingtoncountymn.gov/1606/Parcel-Data",
  nicollet: "https://www.nicolletcountymn.gov/581/RecordEASE-Web",
  mcleod: "https://www.mcleodcountymn.gov/departments/public_works/gis_(mapping___surveying)/gis_data.php",
  fillmore: "https://www.co.fillmore.mn.us/departments/gis/disclaimer.php",
  winona: "http://www.winonacounty.gov/245/GIS",
};

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
  const recordsUrl = isPersonalMode ? undefined : countiesWithRedactedOwnerFields[id];
  const redactedText = recordsUrl ? " Owner name, mailing address, and assessed value are intentionally not shown for this county pending confirmation; use the linked county site for that information." : "";
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
    recordsUrl,
    description: `Standardized county parcel geometry and attributes from Minnesota's official Open Parcels service.${countText}${acquiredText} Verified ${verifiedAt}.${redactedText}`,
    nameField: "county_pin",
    parcelFields: recordsUrl
      ? { parcelId: "county_pin", acres: "acres_deed", legalDescription: "abb_legal" }
      : {
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
      outFields: recordsUrl
        ? "county_pin,acres_deed,abb_legal,co_code"
        : "county_pin,owner_name,owner_more,own_add_l1,acres_deed,abb_legal,emv_total,tax_year,co_code",
      fillColor: "#ffffff",
      strokeColor: "#f2d48a",
      fillAlpha: 0.01,
      strokeWidth: 1,
      maxCameraHeight: 35_000,
    },
  };
}
