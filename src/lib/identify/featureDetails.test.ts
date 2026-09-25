import { describe, expect, it } from "vitest";
import type { LayerDefinition } from "@/config/layers";
import { describeFeature } from "@/lib/identify/featureDetails";

const wma: LayerDefinition = {
  id: "wma",
  name: "Publicly Accessible WMAs",
  category: "public-land",
  sourceType: "arcgis-featureserver",
  url: "https://example.test/FeatureServer",
  defaultVisible: false,
  defaultOpacity: 1,
  attribution: "Minnesota DNR Wildlife",
  agency: "Minnesota Department of Natural Resources",
  accessMeaning: "public-access",
  nameField: "unit_name",
  popupFields: [
    { field: "unit_name", label: "WMA" },
    { field: "gis_area_acres", label: "GIS acres" },
    { field: "special_restrictions", label: "Restrictions" },
  ],
};

const parcels: LayerDefinition = {
  ...wma,
  id: "parcels",
  name: "Hubbard tax parcels",
  category: "parcels",
  county: "Hubbard",
  agency: "Hubbard County GIS",
  accessMeaning: undefined,
  nameField: "PIN",
  popupFields: undefined,
  recordsUrl: "https://records.example.test/",
  parcelFields: { parcelId: "PIN", siteAddress: "SITE", acres: "ACRES" },
};

describe("describeFeature", () => {
  it("titles a feature from the layer's name field and lists its popup fields", () => {
    const details = describeFeature(wma, {
      unit_name: "Straight River WMA",
      gis_area_acres: 812.5,
      special_restrictions: "",
    });

    expect(details.title).toBe("Straight River WMA");
    expect(details.rows).toEqual([
      { label: "WMA", value: "Straight River WMA" },
      { label: "GIS acres", value: "812.5" },
      { label: "Source", value: "Minnesota Department of Natural Resources" },
    ]);
  });

  it("states what a boundary does and does not mean", () => {
    const details = describeFeature(wma, { unit_name: "Straight River WMA" });

    expect(details.notes).toEqual([
      "Published as publicly accessible; verify current site rules.",
    ]);
  });

  it("lists a parcel's fields and links to the county records", () => {
    const details = describeFeature(parcels, { PIN: "24.31.02040", SITE: "1 Main St", ACRES: 40 });

    expect(details.title).toBe("24.31.02040");
    expect(details.rows.map((row) => row.label)).toEqual([
      "Parcel ID",
      "Site address",
      "Acres",
      "Source",
    ]);
    expect(details.links).toEqual([
      {
        label: "Look up ownership & tax records on the county site",
        href: "https://records.example.test/",
      },
    ]);
  });

  it("titles a parcel with no name field by its parcel id", () => {
    const details = describeFeature({ ...parcels, nameField: undefined }, { PIN: "24.31.02040" });

    expect(details.title).toBe("Parcel 24.31.02040");
  });

  it("falls back to the layer name when the feature has no usable name", () => {
    const details = describeFeature(wma, { unit_name: "  " });

    expect(details.title).toBe("Publicly Accessible WMAs");
  });

  it("skips null and empty values and never invents rows for missing fields", () => {
    const details = describeFeature(wma, { unit_name: null, gis_area_acres: undefined });

    expect(details.rows).toEqual([
      { label: "Source", value: "Minnesota Department of Natural Resources" },
    ]);
  });

  it("names the attribution when the layer has no agency", () => {
    const details = describeFeature({ ...wma, agency: undefined }, {});

    expect(details.rows).toContainEqual({ label: "Source", value: "Minnesota DNR Wildlife" });
  });
});
