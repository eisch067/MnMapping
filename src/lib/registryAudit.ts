import type { CountyDefinition, LayerDefinition } from "@/config/layers/types";

export interface RegistryAuditResult {
  countyCount: number;
  northCountyCount: number;
  southCountyCount: number;
  layerCount: number;
  issues: string[];
}

export function auditRegistry(
  counties: readonly CountyDefinition[],
  layers: readonly LayerDefinition[],
): RegistryAuditResult {
  const issues: string[] = [];
  reportDuplicates(counties.map((county) => county.id), "county ID", issues);
  reportDuplicates(counties.map((county) => county.name), "county name", issues);
  reportDuplicates(counties.map((county) => county.fips), "county FIPS", issues);
  reportDuplicates(layers.map((layer) => layer.id), "layer ID", issues);

  for (const county of counties) {
    if (!/^\d{3}$/.test(county.fips)) issues.push(`${county.name}: FIPS must contain three digits.`);
    validateBounds(`${county.name}: county bounds`, county.bounds, issues);
    const imagery = county.layers.filter((layer) => layer.category === "imagery");
    const parcels = county.layers.filter((layer) => layer.category === "parcels");
    if (county.parcels.status === "pending" && (county.parcels.sourceType !== "none" || parcels.length > 0)) {
      issues.push(`${county.name}: pending parcel status conflicts with its source or parcel layer.`);
    }
    if (county.parcels.status === "available" && (county.parcels.sourceType === "none" || parcels.length === 0)) {
      issues.push(`${county.name}: available parcel status requires a parcel source and layer.`);
    }
    if (county.parcels.status !== "pending" && !county.parcels.verifiedAt) {
      issues.push(`${county.name}: available parcel source is missing a verification date.`);
    }
    if (!isNewestFirst(imagery)) issues.push(`${county.name}: imagery definitions are not newest-first.`);

    for (const layer of county.layers) {
      if (layer.county !== county.name) issues.push(`${county.name}: ${layer.id} has a mismatched county name.`);
      if (layer.bounds) validateBounds(`${county.name}: ${layer.id} bounds`, layer.bounds, issues);
      if (layer.category === "imagery") {
        if (layer.bounds && !boundsIntersect(county.bounds, layer.bounds)) issues.push(`${county.name}: ${layer.id} does not intersect county bounds.`);
        if (layer.year === undefined) issues.push(`${county.name}: ${layer.id} is missing an imagery year.`);
      }
      if (layer.category === "public-land" && layer.id.endsWith("-county-public-land")) {
        const where = typeof layer.options?.where === "string" ? layer.options.where : "";
        if (!where.includes(`co_code='27${county.fips}'`)) issues.push(`${county.name}: county-land filter does not match FIPS 27${county.fips}.`);
        if (!where.includes("County Fee") || !where.includes("Tax Forfeit")) issues.push(`${county.name}: county-land filter is missing required ownership classes.`);
      }
    }
  }

  const northCountyCount = counties.filter((county) => county.zone === "north").length;
  const southCountyCount = counties.filter((county) => county.zone === "south").length;
  if (counties.length !== 87) issues.push(`Registry has ${counties.length} counties; expected 87.`);
  if (northCountyCount !== 43) issues.push(`North zone has ${northCountyCount} counties; expected 43.`);
  if (southCountyCount !== 44) issues.push(`South zone has ${southCountyCount} counties; expected 44.`);

  return { countyCount: counties.length, northCountyCount, southCountyCount, layerCount: layers.length, issues };
}

function reportDuplicates(values: readonly string[], label: string, issues: string[]) {
  const seen = new Set<string>();
  for (const value of values) {
    if (seen.has(value)) issues.push(`Duplicate ${label}: ${value}.`);
    seen.add(value);
  }
}

function validateBounds(label: string, bounds: CountyDefinition["bounds"], issues: string[]) {
  const values = [bounds.west, bounds.south, bounds.east, bounds.north];
  if (!values.every(Number.isFinite) || bounds.west >= bounds.east || bounds.south >= bounds.north) {
    issues.push(`${label} are invalid.`);
    return;
  }
  if (bounds.west < -98 || bounds.east > -89 || bounds.south < 43 || bounds.north > 50) {
    issues.push(`${label} fall outside the expected Minnesota area.`);
  }
}

function isNewestFirst(layers: readonly LayerDefinition[]): boolean {
  const years = layers.map((layer) => numericYear(layer.year));
  return years.every((year, index) => index === 0 || years[index - 1] >= year);
}

function numericYear(year: LayerDefinition["year"]): number {
  if (typeof year === "number") return year;
  const parsed = Number.parseInt(year ?? "", 10);
  return Number.isFinite(parsed) ? parsed : Number.NEGATIVE_INFINITY;
}

function boundsIntersect(left: CountyDefinition["bounds"], right: CountyDefinition["bounds"]): boolean {
  return left.west < right.east && left.east > right.west && left.south < right.north && left.north > right.south;
}
