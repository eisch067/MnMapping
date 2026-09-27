import type { LayerDefinition } from "@/config/layers/types";
import { dnrHeadings } from "@/config/layers/dnrHeadings";
import { meaningStatements } from "./meaning";

const officialSourceHosts = ["enterprise.gisdata.mn.gov", "gis.dnr.state.mn.us"];
const isoDate = /^\d{4}-\d{2}-\d{2}$/;

function hostOf(href: string | undefined): string | null {
  if (!href) return null;
  try {
    const url = new URL(href);
    return url.protocol === "https:" ? url.hostname : null;
  } catch {
    return null;
  }
}

function isDnrPage(href: string | undefined): boolean {
  const host = hostOf(href);
  return host !== null && /(^|\.)dnr\.state\.mn\.us$/.test(host);
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

function layerIssues(layer: LayerDefinition): string[] {
  const { dnr } = layer;
  const checks: [boolean, string][] = [
    [layer.category !== "dnr-recreation", "must be in the dnr-recreation category"],
    [layer.defaultVisible, "must default off"],
    [!officialSourceHosts.includes(hostOf(layer.sourceUrl) ?? ""), "must name its source on an official DNR or MnGeo host"],
    [!layer.attribution.trim(), "must name its attribution"],
    [!dnr, "must carry DNR Recreation metadata"],
    [!!dnr && !Object.hasOwn(meaningStatements, dnr.meaningClass), "must have a known meaning class"],
    [!!dnr && !dnrHeadings.some(({ id }) => id === dnr.heading), "must have a known heading"],
    [!!dnr && !isDnrPage(dnr.verifyUrl), "must have a verify link on a DNR page over https"],
    [!!dnr && !isoDate.test(dnr.verifiedOn), "must record the date it was verified as YYYY-MM-DD"],
  ];
  const season = seasonIssue(layer);
  return [...checks.filter(([failed]) => failed).map(([, message]) => message), ...(season ? [season] : [])]
    .map((message) => `${layer.id}: ${message}.`);
}

function membershipIssues(
  dnrLayers: readonly LayerDefinition[],
  registry: readonly LayerDefinition[],
  personal: boolean,
): string[] {
  const registered = new Set(registry.filter(isDnrLayer).map((layer) => layer.id));
  if (!personal) {
    return [...registered].map((id) => `The public registry must contain no DNR layer, but lists ${id}.`);
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
