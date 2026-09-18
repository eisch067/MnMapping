import { countyRegistry } from "@/config/counties";
import { restrictedImageryForCounty } from "@/config/restrictedImagery";
import { imageryResearchLeadsForCounty } from "@/config/imageryResearchLeads";
import { displayableImageryForCounty } from "@/lib/countyImagery";
import type { LayerDefinition } from "@/config/layers/types";

export const researchStatuses = ["Not started", "In progress", "Needs review", "Deep research", "Complete"] as const;
export type ResearchStatus = (typeof researchStatuses)[number];
export type ImageryResearchCategory = "statewide" | "county" | "other";

export interface ImageryResearchSource {
  id: string;
  name: string;
  year: string;
  detail: string;
  url: string;
  notes: string;
  best: boolean;
}

export interface CountyImageryResearchRecord {
  countyId: string;
  county: string;
  fips: string;
  zone: "north" | "south";
  status: ResearchStatus;
  lastVerified: string;
  nextAction: string;
  notes: string;
  sourceInbox: string;
  statewide: ImageryResearchSource[];
  countySources: ImageryResearchSource[];
  other: ImageryResearchSource[];
  researchLeads: ImageryResearchSource[];
}

export interface ImageryResearchExport {
  schemaVersion: 1;
  exportedAt: string;
  counties: CountyImageryResearchRecord[];
}

export function createInitialResearchRecords(): CountyImageryResearchRecord[] {
  return countyRegistry
    .toSorted((first, second) => first.name.localeCompare(second.name))
    .map((county) => {
      const imagery = displayableImageryForCounty(county.name);
      const statewide = bestNaturalColorLayer(imagery.filter((layer) => !layer.county));
      const countyLayer = bestNaturalColorLayer(imagery.filter((layer) => Boolean(layer.county)));
      const other = restrictedImageryForCounty(county.name);
      const researchLeads = imageryResearchLeadsForCounty(county.name);
      return {
        countyId: county.id,
        county: county.name,
        fips: county.fips,
        zone: county.zone,
        status: researchLeads.length > 0 ? "Deep research" : "Needs review",
        lastVerified: "",
        nextAction: "",
        notes: county.notes?.join(" ") ?? "",
        sourceInbox: "",
        statewide: statewide ? [sourceFromLayer(statewide, `${county.id}-statewide`)] : [],
        countySources: countyLayer ? [sourceFromLayer(countyLayer, `${county.id}-county`)] : [],
        other: other.map((source, index) => ({
          id: `${county.id}-other-${source.year}-${index}`,
          name: source.name,
          year: String(source.year),
          detail: source.detail ?? "Higher-detail external imagery",
          url: source.url,
          notes: source.reason,
          best: index === 0,
        })),
        researchLeads: researchLeads.map((source, index) => ({
          id: `${county.id}-research-lead-${index}`,
          name: source.name,
          year: "",
          detail: "Official viewer or research lead",
          url: source.url,
          notes: source.notes,
          best: false,
        })),
      };
    });
}

export function mergeResearchExport(value: unknown): CountyImageryResearchRecord[] {
  const seeds = createInitialResearchRecords();
  if (!value || typeof value !== "object") throw new Error("The selected file is not a county imagery export.");
  const candidate = value as Partial<ImageryResearchExport>;
  if (candidate.schemaVersion !== 1 || !Array.isArray(candidate.counties)) throw new Error("Unsupported county imagery export format.");
  const importedById = new Map(candidate.counties.filter(isResearchRecord).map((record) => [record.countyId, record]));
  return seeds.map((seed) => {
    const imported = importedById.get(seed.countyId);
    return imported ? {
      ...seed,
      status: imported.status === "Complete" ? "Complete" : seed.status,
      lastVerified: imported.lastVerified,
      nextAction: imported.nextAction,
      notes: imported.notes,
      sourceInbox: imported.sourceInbox,
    } : seed;
  });
}

export function createResearchExport(counties: CountyImageryResearchRecord[], exportedAt = new Date().toISOString()): ImageryResearchExport {
  return { schemaVersion: 1, exportedAt, counties };
}

export function researchRecordsToCsv(records: readonly CountyImageryResearchRecord[]): string {
  const header = ["County", "FIPS", "Zone", "Status", "Source Inbox", "Category", "Best", "Imagery Name", "Year", "Detail", "Source URL", "Source Notes", "County Notes", "Last Verified", "Next Action"];
  const rows = records.flatMap((record) => ([
    ["Implemented imagery", [...record.statewide, ...record.countySources]] as const,
    ["External imagery—date confirmed", record.other] as const,
    ["Official viewer/research lead—date unknown", record.researchLeads] as const,
  ]).flatMap(([category, sources]) => {
    const values = sources.length ? sources : [{ id: "", name: "", year: "", detail: "", url: "", notes: "", best: false }];
    return values.map((source) => [
      record.county,
      record.fips,
      record.zone,
      record.status,
      record.sourceInbox,
      category,
      source.best ? "Yes" : "No",
      source.name,
      source.year,
      source.detail,
      source.url,
      source.notes,
      record.notes,
      record.lastVerified,
      record.nextAction,
    ]);
  }));
  return [header, ...rows].map((row) => row.map(csvCell).join(",")).join("\r\n");
}

function bestNaturalColorLayer(layers: readonly LayerDefinition[]): LayerDefinition | undefined {
  return layers.find((layer) => typeof layer.year === "number"
    && layer.imageryGroup !== "cir"
    && !/\bCIR\b/i.test(layer.name)
    && !/color infrared/i.test(layer.description ?? ""));
}

function sourceFromLayer(layer: LayerDefinition, id: string): ImageryResearchSource {
  return {
    id,
    name: layer.name,
    year: String(layer.year ?? ""),
    detail: layer.resolution ?? "Not stated",
    url: layer.sourceUrl ?? layer.url,
    notes: layer.description ?? `Available from ${layer.agency ?? layer.attribution}.`,
    best: true,
  };
}

function isResearchRecord(value: unknown): value is CountyImageryResearchRecord {
  if (!value || typeof value !== "object") return false;
  const record = value as Partial<CountyImageryResearchRecord>;
  return typeof record.countyId === "string"
    && typeof record.status === "string"
    && researchStatuses.includes(record.status as ResearchStatus)
    && Array.isArray(record.statewide)
    && Array.isArray(record.countySources)
    && Array.isArray(record.other);
}

function csvCell(value: string): string {
  const safe = /^[=+@]/.test(value) || /^-\D/.test(value) ? `'${value}` : value;
  return `"${safe.replaceAll('"', '""')}"`;
}
