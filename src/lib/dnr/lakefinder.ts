// The adapter for DNR's LakeFinder by-ID API, documented at
// https://services.dnr.state.mn.us/api/lakefinder/by_id/v1/usage.html. DNR's own notes on its
// response are unfinished, so every field is checked here and nothing outside this file reads the
// raw body. A response that cannot be read safely becomes an outcome that falls back to links.

export interface LakeRegulation {
  species: string[];
  // DNR's wording, unaltered.
  text: string;
  // DNR's qualifier, such as a connected lake the rule also covers; empty when there is none.
  location: string;
}

export interface LakeResources {
  waterLevels: boolean;
  lakeSurvey: boolean;
  fishStocking: boolean;
  lakeMap: boolean;
}

export interface LakeRecord {
  dow: string;
  name: string;
  county?: string;
  nearestTown?: string;
  acres?: number;
  maxDepthFeet?: number;
  meanDepthFeet?: number;
  regulations: LakeRegulation[];
  invasiveSpecies: string[];
  notes?: string;
  surveyedSpecies: string[];
  resources: LakeResources;
  // Lake map sheet identifiers such as "B0025".
  mapIds: string[];
}

// "none" is a lake DNR has no record of, which is ordinary; "unavailable" is a service that did
// not answer; "changed" is an answer this adapter cannot read safely.
export type LakeFinderOutcome =
  | { status: "found"; lake: LakeRecord }
  | { status: "none" }
  | { status: "unavailable" }
  | { status: "changed" };

export interface LakeFinderRequest {
  fetcher?: typeof fetch;
  signal?: AbortSignal;
}

const apiPath = "/api/gis-proxy/dnr-lakefinder/by_id/v1";
const mapIdPattern = /^[A-Za-z]\d{4}$/;

// Leading zeros are part of the number, so it is only ever handled as text.
export function isDow(value: string): boolean {
  return /^\d{8}$/.test(value);
}

type JsonRecord = Record<string, unknown>;

function isRecord(value: unknown): value is JsonRecord {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function textOf(value: unknown): string | undefined {
  if (typeof value !== "string") return undefined;
  const trimmed = value.trim();
  return trimmed === "" ? undefined : trimmed;
}

// DNR reports an unmeasured depth as zero, which no lake has.
function positiveNumber(value: unknown): number | undefined {
  return typeof value === "number" && Number.isFinite(value) && value > 0 ? value : undefined;
}

function textList(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value.flatMap((entry) => {
    const text = textOf(entry);
    return text === undefined ? [] : [text];
  });
}

// DNR sends the survey list as one comma-joined string inside an array.
function surveyedSpeciesOf(value: unknown): string[] {
  const names = textList(value).flatMap((entry) => entry.split(","));
  return [...new Set(names.map((name) => name.trim()).filter((name) => name !== ""))];
}

function regulationsOf(value: unknown): LakeRegulation[] | undefined {
  if (!Array.isArray(value)) return undefined;
  const regulations: LakeRegulation[] = [];
  for (const group of value) {
    if (!isRecord(group) || !Array.isArray(group.regs)) return undefined;
    const location = textOf(group.location) ?? "";
    for (const reg of group.regs) {
      if (!isRecord(reg) || !Array.isArray(reg.species)) return undefined;
      if (typeof reg.text !== "string" || reg.text.trim() === "") return undefined;
      regulations.push({ species: textList(reg.species), text: reg.text, location });
    }
  }
  return regulations;
}

function isFlagged(resources: unknown, key: string): boolean {
  return isRecord(resources) && (resources[key] === 1 || resources[key] === true);
}

function resourcesOf(value: unknown): LakeResources {
  return {
    waterLevels: isFlagged(value, "waterLevels"),
    lakeSurvey: isFlagged(value, "lakeSurvey"),
    fishStocking: isFlagged(value, "fishStocking"),
    lakeMap: isFlagged(value, "lakeMap"),
  };
}

function recordOf(dow: string, source: JsonRecord): LakeRecord | undefined {
  const name = textOf(source.name);
  const regulations = regulationsOf(source.specialFishingRegs);
  if (name === undefined || regulations === undefined) return undefined;
  const morphology = isRecord(source.morphology) ? source.morphology : {};
  return {
    dow,
    name,
    county: textOf(source.county),
    nearestTown: textOf(source.nearest_town),
    acres: positiveNumber(morphology.area),
    maxDepthFeet: positiveNumber(morphology.max_depth),
    meanDepthFeet: positiveNumber(morphology.mean_depth),
    regulations,
    invasiveSpecies: textList(source.invasiveSpecies),
    notes: textOf(source.notes),
    surveyedSpecies: surveyedSpeciesOf(source.fishSpecies),
    resources: resourcesOf(source.resources),
    mapIds: textList(source.mapid).filter((id) => mapIdPattern.test(id)),
  };
}

function isNoMatch(body: JsonRecord): boolean {
  const empty = body.results === null || (Array.isArray(body.results) && body.results.length === 0);
  const message = typeof body.message === "string" ? body.message : "";
  return empty && (body.status === "OK" || /no results/i.test(message));
}

export function parseLakeFinder(dow: string, body: unknown): LakeFinderOutcome {
  if (!isRecord(body) || typeof body.status !== "string") return { status: "changed" };
  if (isNoMatch(body)) return { status: "none" };
  if (!Array.isArray(body.results)) return { status: "changed" };
  const source = body.results.find((entry) => isRecord(entry) && entry.id === dow);
  const lake = isRecord(source) ? recordOf(dow, source) : undefined;
  return lake ? { status: "found", lake } : { status: "changed" };
}

export async function fetchLakeFinder(
  dow: string,
  { fetcher = (...args) => fetch(...args), signal }: LakeFinderRequest = {},
): Promise<LakeFinderOutcome> {
  if (!isDow(dow)) return { status: "none" };
  try {
    const response = await fetcher(`${apiPath}?id=${dow}`, { signal });
    // DNR labels the JSON text/plain, so the body is parsed whatever its type says.
    return response.ok ? parseLakeFinder(dow, JSON.parse(await response.text())) : { status: "unavailable" };
  } catch (error) {
    // A caller that aborted has moved on, so the answer is dropped rather than shown.
    if (signal?.aborted) throw error;
    return { status: "unavailable" };
  }
}
