import { aitkinLayers } from "./layers/counties/aitkin";
import { beckerLayers } from "./layers/counties/becker";
import { beltramiLayers } from "./layers/counties/beltrami";
import { douglasLayers } from "./layers/counties/douglas";
import { hubbardLayers } from "./layers/counties/hubbard";
import { toddLayers } from "./layers/counties/todd";
import { northExpansionCounties } from "./layers/counties/northExpansion";
import { createMnGeoCountyPublicLandLayer } from "./layers/counties/publicLand";
import { createMnGeoParcelLayer } from "./layers/counties/shared";
import { southExpansionCounties } from "./layers/counties/southExpansion";
import type { CountyDefinition, LayerBounds } from "./layers/types";

const counties = [
  county("aitkin", "Aitkin", "001", { west: -93.82, south: 46.15, east: -93.04, north: 47.03 }, aitkinLayers, "available", "arcgis-feature", ["First county in north-expansion Batch N1."]),
  county("becker", "Becker", "005", { west: -96.05, south: 46.56, east: -95.30, north: 47.31 }, [...beckerLayers, createMnGeoParcelLayer("becker", "Becker", "005", { west: -96.05, south: 46.56, east: -95.30, north: 47.31 }, 35_718)], "available", "mngeo-open"),
  county("beltrami", "Beltrami", "007", { west: -95.52, south: 47.39, east: -94.35, north: 48.56 }, beltramiLayers, "available", "arcgis-feature", ["Official Beltrami Open Data provides anonymous tax parcels and county parks."]),
  county("douglas", "Douglas", "041", { west: -95.70, south: 45.68, east: -95.20, north: 46.19 }, douglasLayers, "available", "arcgis-feature"),
  county("hubbard", "Hubbard", "057", { west: -95.21, south: 46.80, east: -94.63, north: 47.40 }, hubbardLayers, "available", "arcgis-feature"),
  county("todd", "Todd", "153", { west: -95.18, south: 45.79, east: -94.62, north: 46.35 }, toddLayers, "available", "arcgis-feature"),
  ...northExpansionCounties,
  ...southExpansionCounties,
] as const satisfies readonly CountyDefinition[];

export const countyRegistry = counties.map((entry): CountyDefinition => {
  const publicLand = createMnGeoCountyPublicLandLayer(entry.id, entry.name, entry.fips, entry.bounds);
  return publicLand ? { ...entry, layers: [...entry.layers, publicLand] } : entry;
});

export type SupportedCounty = (typeof countyRegistry)[number]["name"];

function county(
  id: string,
  name: string,
  fips: string,
  bounds: LayerBounds,
  layers: CountyDefinition["layers"],
  status: CountyDefinition["parcels"]["status"],
  sourceType: CountyDefinition["parcels"]["sourceType"],
  notes?: readonly string[],
): CountyDefinition {
  return {
    id,
    name,
    fips,
    zone: "north",
    bounds,
    layers,
    parcels: { status, sourceType, verifiedAt: status === "available" ? "2026-09-14" : undefined },
    notes,
  };
}
