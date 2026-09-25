import { describe, expect, it } from "vitest";
import { restrictedImageryForCounty } from "@/config/restrictedImagery";
import { displayableImageryForCounty, latestDisplayableImagery } from "@/lib/countyImagery";

const latestImageryIds: Array<[county: string, layerId: string]> = [
  ["Hubbard", "hubbard-imagery-2026"],
  ["Brown", "mngeo-naip-2025"],
  ["Anoka", "anoka-arcgis-imagery-2026-spring"],
  ["McLeod", "mcleod-arcgis-imagery-2026"],
  ["Wadena", "wadena-arcgis-imagery-2025-eagleview"],
  ["Wilkin", "wilkin-arcgis-imagery-2026-eagleview"],
  ["Lincoln", "lincoln-imagery-2026-eagleview"],
];

const displayableImageryIds: Array<[county: string, layerId: string]> = [
  ["Cass", "cass-arcgis-imagery-2024-pictometry"],
  ["Hubbard", "hubbard-imagery-2026"],
  ["Carlton", "carlton-imagery-2024"],
  ["Beltrami", "beltrami-imagery-2023"],
  ["Olmsted", "olmsted-imagery-2023"],
  ["Ramsey", "ramsey-imagery-2022"],
  ["Grant", "grant-arcgis-imagery-2024-eagleview"],
  ["Meeker", "meeker-imagery-2024-eagleview"],
  ["Lac qui Parle", "lac-qui-parle-imagery-2024-eagleview"],
  ["Marshall", "marshall-arcgis-imagery-2024-eagleview"],
  ["Stevens", "stevens-arcgis-imagery-2020-pictometry"],
];

const restrictedImageryYears: Array<[county: string, years: number[]]> = [
  ["Brown", [2026, 2023]],
  ["Anoka", []],
  ["Benton", [2023]],
  ["Cook", [2024]],
  ["Dakota", []],
  ["Dodge", []],
  ["Douglas", [2026]],
  ["Faribault", [2025]],
  ["Fillmore", [2022]],
  ["Goodhue", []],
  ["Grant", []],
  ["Houston", [2023]],
  ["Itasca", [2023]],
  ["Jackson", [2021]],
  ["Kandiyohi", [2024]],
  ["Le Sueur", [2025]],
  ["Mahnomen", [2020]],
  ["Mille Lacs", []],
  ["Morrison", [2020]],
  ["Mower", []],
  ["Nicollet", [2020]],
  ["Nobles", [2024]],
  ["Otter Tail", []],
  ["Pennington", []],
  ["Pipestone", []],
  ["Polk", []],
  ["Pope", []],
  ["Redwood", [2026, 2023, 2020, 2016]],
  ["Renville", [2024]],
  ["Scott", []],
  ["Sherburne", []],
  ["Sibley", [2023]],
  ["St. Louis", [2023]],
  ["Stearns", []],
  ["Steele", []],
  ["Swift", [2024]],
  ["Traverse", []],
  ["Washington", []],
  ["Wright", [2025]],
  ["Yellow Medicine", []],
  ["McLeod", []],
  ["Todd", [2023]],
  ["Wadena", []],
  ["Watonwan", [2022]],
  ["Wilkin", []],
  ["Beltrami", []],
  ["Kittson", [2024, 2019]],
  ["Marshall", []],
  ["Norman", [2025, 2022]],
  ["Stevens", [2026, 2023]],
  ["Freeborn", [2020]],
  ["Isanti", [2025, 2025, 2023, 2023, 2022, 2021, 2020]],
  ["Kanabec", [2024, 2021, 2018]],
  ["Lake of the Woods", [2024, 2021, 2018]],
  ["Martin", [2026, 2023, 2020, 2019]],
  ["Meeker", [2021]],
  ["Murray", [2024, 2022, 2019]],
  ["Pine", [2023, 2018]],
  ["Rock", [2025, 2022, 2019]],
  ["Waseca", [2025, 2021]],
  ["Winona", [2026, 2022, 2020]],
];

describe("latestDisplayableImagery", () => {
  it.each(latestImageryIds)("picks the newest displayable imagery for %s", (county, layerId) => {
    expect(latestDisplayableImagery(county)?.id).toBe(layerId);
  });

  it("describes Polk's 2025 imagery as a WMTS layer", () => {
    const polk2025 = latestDisplayableImagery("Polk");

    expect(polk2025?.id).toBe("polk-imagery-2025-eagleview");
    expect(polk2025?.sourceType).toBe("wmts");
    expect(polk2025?.options?.layer).toBe("PICT-MNPOLK25-bwELhvEqES");
    expect(polk2025?.options?.tileMatrixSetID).toBe("GoogleMapsCompatible");
  });
});

describe("displayableImageryForCounty", () => {
  it("lists the statewide best-available imagery first for Brown", () => {
    expect(displayableImageryForCounty("Brown")[0]?.id).toBe("mngeo-best-available");
  });

  it.each(displayableImageryIds)("includes %s's %s", (county, layerId) => {
    expect(displayableImageryForCounty(county).some((layer) => layer.id === layerId)).toBe(true);
  });
});

describe("restrictedImageryForCounty", () => {
  it.each(restrictedImageryYears)("lists the restricted imagery years for %s", (county, years) => {
    expect(restrictedImageryForCounty(county).map((source) => source.year)).toStrictEqual(years);
  });
});
