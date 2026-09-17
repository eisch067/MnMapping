export interface RestrictedImagerySource {
  county: string;
  name: string;
  year: number;
  url: string;
  reason: string;
}

export const restrictedImagerySources: readonly RestrictedImagerySource[] = [
  {
    county: "Brown",
    name: "Brown County GIS EagleView mosaic",
    year: 2026,
    url: "https://gis.browncountymn.gov/portal/home/item.html?id=6abb304efc674371b52c255b11b027bd",
    reason: "Brown County's EagleView agreement limits Connect Image Service use to the county's organization, and the public catalog does not grant third-party reuse rights.",
  },
  {
    county: "Brown",
    name: "Brown County GIS EagleView mosaic",
    year: 2023,
    url: "https://gis.browncountymn.gov/portal/home/item.html?id=7c66b91ebb53409a8a7f68628305a89c",
    reason: "The imagery is publicly viewable, but EagleView retains copyright and no license authorizes MnMapping to embed it.",
  },
] as const;

export function restrictedImageryForCounty(countyName: string): readonly RestrictedImagerySource[] {
  return restrictedImagerySources
    .filter((source) => source.county === countyName)
    .toSorted((first, second) => second.year - first.year);
}
