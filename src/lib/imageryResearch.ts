import { countyRegistry } from "@/config/counties";
import { restrictedImageryForCounty } from "@/config/restrictedImagery";
import { imageryResearchLeadsForCounty } from "@/config/imageryResearchLeads";
import { displayableImageryForCounty } from "@/lib/countyImagery";
import type { LayerDefinition } from "@/config/layers/types";

export const researchStatuses = ["Not started", "In progress", "Needs review", "Deep research", "Complete"] as const;
export type ResearchStatus = (typeof researchStatuses)[number];
export const outreachStatuses = ["Not contacted", "Drafting", "Sent", "Waiting", "Responded", "Closed"] as const;
export type OutreachStatus = (typeof outreachStatuses)[number];
export const coverageTiers = ["Verified recent", "Older / recency unverified", "Statewide only"] as const;
export type CoverageTier = (typeof coverageTiers)[number];
export type ImageryResearchCategory = "statewide" | "county" | "other";

const statewideOnlyCounties = new Set([
  "Kittson", "Marshall", "Norman", "Red Lake", "Stevens",
]);

const olderOrUnverifiedCounties = new Set([
  "Cottonwood", "Freeborn", "Grant", "Isanti", "Kanabec", "Lac qui Parle", "Lake of the Woods", "Lincoln", "Martin",
  "Meeker", "Murray", "Pine", "Redwood", "Rock", "Roseau", "Waseca", "Winona",
]);

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
  coverageTier: CoverageTier;
  requiresOutreach: boolean;
  outreachStatus: OutreachStatus;
  contactDepartment: string;
  contactName: string;
  contactEmail: string;
  contactPhone: string;
  contactUrl: string;
  requestDate: string;
  followUpDate: string;
  responseNotes: string;
  statewide: ImageryResearchSource[];
  countySources: ImageryResearchSource[];
  other: ImageryResearchSource[];
  researchLeads: ImageryResearchSource[];
}

export interface ImageryResearchExport {
  schemaVersion: 3;
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
      const coverageTier = coverageTierForCounty(county.name);
      return {
        countyId: county.id,
        county: county.name,
        fips: county.fips,
        zone: county.zone,
        status: researchLeads.length > 0 ? "Deep research" : "Needs review",
        lastVerified: "",
        nextAction: defaultNextAction(coverageTier),
        notes: county.notes?.join(" ") ?? "",
        sourceInbox: "",
        coverageTier,
        requiresOutreach: coverageTier !== "Verified recent",
        outreachStatus: "Not contacted",
        contactDepartment: "GIS / Assessor",
        contactName: "",
        contactEmail: "",
        contactPhone: "",
        contactUrl: "",
        requestDate: "",
        followUpDate: "",
        responseNotes: "",
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
  if (![1, 2, 3].includes(candidate.schemaVersion ?? 0) || !Array.isArray(candidate.counties)) throw new Error("Unsupported county imagery export format.");
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
      outreachStatus: validOutreachStatus(imported.outreachStatus) ? imported.outreachStatus : seed.outreachStatus,
      contactDepartment: imported.contactDepartment ?? seed.contactDepartment,
      contactName: imported.contactName ?? seed.contactName,
      contactEmail: imported.contactEmail ?? seed.contactEmail,
      contactPhone: imported.contactPhone ?? seed.contactPhone,
      contactUrl: imported.contactUrl ?? seed.contactUrl,
      requestDate: imported.requestDate ?? seed.requestDate,
      followUpDate: imported.followUpDate ?? seed.followUpDate,
      responseNotes: imported.responseNotes ?? seed.responseNotes,
    } : seed;
  });
}

export function createResearchExport(counties: CountyImageryResearchRecord[], exportedAt = new Date().toISOString()): ImageryResearchExport {
  return { schemaVersion: 3, exportedAt, counties };
}

export function researchRecordsToCsv(records: readonly CountyImageryResearchRecord[]): string {
  const header = ["County", "FIPS", "Zone", "Status", "Coverage Tier", "Needs Outreach", "Outreach Status", "Contact Department", "Contact Name", "Contact Email", "Contact Phone", "Contact URL", "Request Date", "Follow-up Date", "Response Notes", "Source Inbox", "Category", "Best", "Imagery Name", "Year", "Detail", "Source URL", "Source Notes", "County Notes", "Last Verified", "Next Action"];
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
      record.coverageTier,
      record.requiresOutreach ? "Yes" : "No",
      record.outreachStatus,
      record.contactDepartment,
      record.contactName,
      record.contactEmail,
      record.contactPhone,
      record.contactUrl,
      record.requestDate,
      record.followUpDate,
      record.responseNotes,
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

export function countyNeedsImageryOutreach(countyName: string): boolean {
  return coverageTierForCounty(countyName) !== "Verified recent";
}

function coverageTierForCounty(countyName: string): CoverageTier {
  if (statewideOnlyCounties.has(countyName)) return "Statewide only";
  if (olderOrUnverifiedCounties.has(countyName)) return "Older / recency unverified";
  return "Verified recent";
}

function defaultNextAction(tier: CoverageTier): string {
  if (tier === "Statewide only") return "Find a county imagery viewer/service or contact county GIS about its latest acquisition.";
  if (tier === "Older / recency unverified") return "Confirm the newest viewer imagery year and obtain a stable public viewing or service link.";
  return "Review the verified imagery and any published reuse terms.";
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

function validOutreachStatus(value: unknown): value is OutreachStatus {
  return typeof value === "string" && outreachStatuses.includes(value as OutreachStatus);
}

function csvCell(value: string): string {
  const safe = /^[=+@]/.test(value) || /^-\D/.test(value) ? `'${value}` : value;
  return `"${safe.replaceAll('"', '""')}"`;
}
