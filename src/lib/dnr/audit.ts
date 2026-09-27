import type { LayerDefinition } from "@/config/layers/types";
import { dnrHeadings } from "@/config/layers/dnrHeadings";
import { isDnrPage } from "./links";
import { meaningStatements } from "./meaning";

const officialSourceHosts = ["enterprise.gisdata.mn.gov", "gis.dnr.state.mn.us"];
const isoDate = /^\d{4}-\d{2}-\d{2}$/;
const generalizedTrailIds = new Set(["mndnr-ohv-trails", "mndnr-snowmobile-trails"]);

function isOfficialSource(href: string | undefined): boolean {
  try {
    return href !== undefined && officialSourceHosts.includes(new URL(href).hostname);
  } catch {
    return false;
  }
}

function isDnrLayer(layer: LayerDefinition): boolean {
  return layer.category === "dnr-recreation" || layer.dnr !== undefined;
}

function seasonIssue(layer: LayerDefinition): string | undefined {
  const season = layer.dnr?.season;
  if (!season) return undefined;
  if (season.source === "service") {
    return season.field && season.lastVerifiedPeriod
      ? undefined
      : "season rule needs the service field and the last verified period";
  }
  if (!season.label) return "season rule needs a label";
  return isoDate.test(season.verifiedThrough) && !Number.isNaN(Date.parse(season.verifiedThrough))
    ? undefined
    : "season rule needs a verified-through date as YYYY-MM-DD";
}

function metadataIssues(layer: LayerDefinition): string[] {
  const { dnr } = layer;
  if (!dnr) return ["must carry DNR Recreation metadata"];
  const issues: string[] = [];
  if (!Object.hasOwn(meaningStatements, dnr.meaningClass)) {
    issues.push("must have a known meaning class");
  }
  if (!dnrHeadings.some(({ id }) => id === dnr.heading)) issues.push("must have a known heading");
  if (!isDnrPage(dnr.verifyUrl)) issues.push("must have a verify link on a DNR page over https");
  if (dnr.lake && !/^\w+$/.test(dnr.lake.dowField)) {
    issues.push("must name the attribute that holds its lake's DOW number");
  }
  if (!isoDate.test(dnr.verifiedOn)) {
    issues.push("must record the date it was verified as YYYY-MM-DD");
  }
  const season = seasonIssue(layer);
  if (season) issues.push(season);
  if (dnr.freshness) {
    if (!dnr.freshness.label || !dnr.freshness.staleWarning) {
      issues.push("freshness metadata needs a label and stale warning");
    }
    if (!isoDate.test(dnr.freshness.contentDate) || !isoDate.test(dnr.freshness.freshThrough)) {
      issues.push("freshness dates must use YYYY-MM-DD");
    }
  }
  const programLinks = [
    ...(dnr.links ?? []).map(({ href }) => href),
    ...(dnr.nameLinks ?? []).flatMap(({ pages }) => Object.values(pages)),
  ];
  if (programLinks.some((href) => !isDnrPage(href))) {
    issues.push("program links must use an official DNR page over https");
  }
  if (generalizedTrailIds.has(layer.id)) {
    const height = Number(layer.options?.maxCameraHeight);
    const offset = Number(layer.options?.maxAllowableOffset);
    if (!(Number.isFinite(height) && height > 0 && Number.isFinite(offset) && offset > 0)) {
      issues.push("large trail layers need a zoom gate and generalized viewport queries");
    }
  }
  return issues;
}

// A live map service draws whatever DNR has mapped, so its row and results must say how far that
// coverage goes.
function coverageIssue(layer: LayerDefinition): string | undefined {
  const isLiveMap = layer.sourceType === "arcgis-mapserver";
  return isLiveMap && !layer.dnr?.caution?.trim()
    ? "must warn about the limits of its coverage"
    : undefined;
}

function layerIssues(layer: LayerDefinition): string[] {
  const issues: string[] = [];
  const coverage = coverageIssue(layer);
  if (coverage) issues.push(coverage);
  if (layer.category !== "dnr-recreation") issues.push("must be in the dnr-recreation category");
  if (layer.defaultVisible) issues.push("must default off");
  if (!isOfficialSource(layer.sourceUrl)) {
    issues.push("must name its source on an official DNR or MnGeo host");
  }
  if (!layer.attribution.trim()) issues.push("must name its attribution");
  return [...issues, ...metadataIssues(layer)].map((message) => `${layer.id}: ${message}.`);
}

function membershipIssues(
  dnrLayers: readonly LayerDefinition[],
  registry: readonly LayerDefinition[],
  personal: boolean,
): string[] {
  const registered = new Set(registry.filter(isDnrLayer).map((layer) => layer.id));
  if (!personal) {
    return [...registered].map(
      (id) => `The public registry must contain no DNR layer, but lists ${id}.`,
    );
  }
  return dnrLayers
    .filter((layer) => !registered.has(layer.id))
    .map((layer) => `The personal registry is missing DNR layer ${layer.id}.`);
}

export function auditDnrLayers(
  dnrLayers: readonly LayerDefinition[],
  registry: readonly LayerDefinition[],
  { personal }: { personal: boolean },
): string[] {
  return [...dnrLayers.flatMap(layerIssues), ...membershipIssues(dnrLayers, registry, personal)];
}
