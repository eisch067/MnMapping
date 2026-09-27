import type { LayerDefinition } from "@/config/layers/types";
import { fetchJson, throwForArcGisError, type ArcGisError } from "@/lib/map/arcgisFeatures";
import { absoluteBrowserUrl } from "@/lib/map/layerOptions";
import type { LayerStateById } from "@/lib/map/layerState";
import { configuredSeasonGate, serviceSeasonGate, type SeasonGate } from "./season";
import { loadCwdSamplingGate } from "./cwdSamplingGate";

// Only layers with a season rule appear. A layer with no entry has no season to verify.
export type SeasonGates = Record<string, SeasonGate>;

interface GateRequest {
  fetcher: typeof fetch;
  now: Date;
  signal?: AbortSignal;
}

interface DistinctPeriodResponse {
  features?: Array<{ attributes?: Record<string, unknown> }>;
  error?: ArcGisError;
}

function seasonLayers(layers: readonly LayerDefinition[]) {
  return layers.flatMap((layer) =>
    layer.dnr?.season ? [{ layer, dnr: layer.dnr, rule: layer.dnr.season }] : [],
  );
}

// The gates that need no service: a configured season is current or not from its date alone,
// and a service's period is unknown until it answers.
export function initialSeasonGates(layers: readonly LayerDefinition[], now: Date): SeasonGates {
  return Object.fromEntries(
    seasonLayers(layers).map(({ layer, dnr, rule }): [string, SeasonGate] => [
      layer.id,
      layer.id === "mndnr-cwd-sampling-sites"
        ? { status: "checking" }
        : rule.source === "configured"
          ? configuredSeasonGate(rule, { officialUrl: dnr.verifyUrl }, now)
          : { status: "checking" },
    ]),
  );
}

function distinctPeriodsUrl(layer: LayerDefinition, field: string): URL {
  const layerId = String(layer.options?.layerId ?? "0");
  const url = new URL(`${absoluteBrowserUrl(layer.url)}/${layerId}/query`);
  url.searchParams.set("where", "1=1");
  url.searchParams.set("outFields", field);
  url.searchParams.set("returnDistinctValues", "true");
  url.searchParams.set("returnGeometry", "false");
  url.searchParams.set("f", "json");
  return url;
}

async function publishedPeriods(layer: LayerDefinition, field: string, request: GateRequest) {
  const url = distinctPeriodsUrl(layer, field);
  const response = await fetchJson<DistinctPeriodResponse>(url, request.fetcher, request.signal);
  throwForArcGisError(response.error, url);
  return (response.features ?? []).flatMap((feature) => {
    const value = feature.attributes?.[field];
    return typeof value === "string" ? [value] : [];
  });
}

// A service that cannot be reached or read leaves its layer unverified: the gate never assumes a
// season is current.
export async function loadSeasonGates(
  layers: readonly LayerDefinition[],
  request: GateRequest,
): Promise<SeasonGates> {
  const initial = initialSeasonGates(layers, request.now);
  const resolved = await Promise.all(
    seasonLayers(layers).flatMap(({ layer, dnr, rule }) => {
      if (layer.id === "mndnr-cwd-sampling-sites") {
        return [loadCwdSamplingGate(layer, request).then(
          (gate): [string, SeasonGate] => [layer.id, gate],
          (): [string, SeasonGate] => [layer.id, {
            status: "unverified",
            lastVerified: rule.source === "service" ? rule.lastVerifiedPeriod : "July 2026 - June 2027",
            officialUrl: dnr.verifyUrl,
          }],
        )];
      }
      if (rule.source !== "service") return [];
      return [
        publishedPeriods(layer, rule.field, request).then(
          (periods): [string, SeasonGate] => [
            layer.id,
            serviceSeasonGate(rule, { officialUrl: dnr.verifyUrl }, periods, request.now),
          ],
          (error: unknown): [string, SeasonGate] => {
            console.error(`Unable to read the season of ${layer.name}`, error);
            return [
              layer.id,
              serviceSeasonGate(rule, { officialUrl: dnr.verifyUrl }, [], request.now),
            ];
          },
        ),
      ];
    }),
  );
  return { ...initial, ...Object.fromEntries(resolved) };
}

export function isSeasonAvailable(gates: SeasonGates, layerId: string): boolean {
  const gate = gates[layerId];
  return gate === undefined || gate.status === "current";
}

// A stored "on" for a layer whose season is not current is ignored, not erased, so the layer
// returns as the user left it once DNR's period is current again.
export function maskUnavailableLayers(state: LayerStateById, gates: SeasonGates): LayerStateById {
  return Object.fromEntries(
    Object.entries(state).map(([id, layerState]) => [
      id,
      isSeasonAvailable(gates, id) ? layerState : { ...layerState, visible: false },
    ]),
  );
}
