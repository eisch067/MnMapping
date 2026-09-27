import { describe, expect, it } from "vitest";
import { layerRegistry, type LayerDefinition } from "@/config/layers";
import {
  initialSeasonGates,
  isSeasonAvailable,
  loadSeasonGates,
  maskUnavailableLayers,
} from "@/lib/dnr/seasonGate";
import type { LayerStateById } from "@/lib/map/layerState";

const dnrLayers = layerRegistry.filter((layer) => layer.dnr);
const seasonLayers = dnrLayers.filter((layer) => layer.dnr?.season);
const at = (iso: string) => new Date(`${iso}T12:00:00Z`);

function layerNamed(id: string): LayerDefinition {
  const layer = dnrLayers.find((candidate) => candidate.id === id);
  if (!layer) throw new Error(`No DNR layer ${id}.`);
  return layer;
}

// A service that answers every distinct-period query with the periods given for its layer.
function servicePeriods(periods: Record<string, string[]>, calls: URL[] = []): typeof fetch {
  return async (input) => {
    const url = new URL(String(input));
    calls.push(url);
    const layer = absolute(dnrLayers).find((candidate) => url.href.startsWith(candidate.url));
    const values = periods[layer?.id ?? ""] ?? [];
    return Response.json({
      features: values.map((effperiod) => ({ attributes: { effperiod } })),
    });
  };
}

function absolute(layers: readonly LayerDefinition[]): LayerDefinition[] {
  return layers.map((layer) => ({ ...layer, url: new URL(layer.url, "https://mnmapping.test").href }));
}

const allOn = (layers: readonly LayerDefinition[]): LayerStateById =>
  Object.fromEntries(layers.map((layer) => [layer.id, { visible: true, opacity: 1 }]));

describe("the DNR season gate", () => {
  it("gates the four season-specific layers and no others", () => {
    expect(seasonLayers.map((layer) => layer.name).toSorted()).toEqual([
      "Bear permit areas",
      "CWD zones",
      "Deer permit areas",
      "Turkey permit areas",
    ]);
  });

  it("decides bear and turkey from their verified-through date without asking a service", () => {
    const gates = initialSeasonGates(dnrLayers, at("2026-10-01"));

    expect(gates["mndnr-bear-permit-areas"]).toEqual({ status: "current", label: "2026 season" });
    expect(gates["mndnr-turkey-permit-areas"]).toEqual({
      status: "current",
      label: "Fall 2026 season",
    });
    expect(gates["mndnr-deer-permit-areas"]).toEqual({ status: "checking" });
    expect(gates["mndnr-hunter-walking-trails"]).toBeUndefined();
  });

  it("fails bear closed the day after its verified-through date, and turkey after its own", () => {
    const afterTurkey = initialSeasonGates(dnrLayers, at("2027-01-01"));
    const afterBear = initialSeasonGates(dnrLayers, at("2027-04-01"));

    expect(afterTurkey["mndnr-turkey-permit-areas"]?.status).toBe("unverified");
    expect(afterTurkey["mndnr-bear-permit-areas"]?.status).toBe("current");
    expect(afterBear["mndnr-bear-permit-areas"]).toMatchObject({
      status: "unverified",
      lastVerified: "2026 season",
      officialUrl: "https://www.dnr.state.mn.us/hunting/bear/index.html",
    });
  });

  it("makes deer and CWD current from the period each service publishes", async () => {
    const calls: URL[] = [];
    const layers = absolute(dnrLayers);
    const fetcher = servicePeriods(
      {
        "mndnr-deer-permit-areas": ["July 2026 - June 2027"],
        "mndnr-cwd-zones": ["July 2026 - June 2027"],
      },
      calls,
    );

    const gates = await loadSeasonGates(layers, { fetcher, now: at("2026-10-01") });

    expect(gates["mndnr-deer-permit-areas"]).toEqual({
      status: "current",
      label: "July 2026 - June 2027",
    });
    expect(gates["mndnr-cwd-zones"]?.status).toBe("current");
    expect(calls).toHaveLength(2);
    expect(calls[0].searchParams.get("returnDistinctValues")).toBe("true");
    expect(calls[0].searchParams.get("outFields")).toBe("effperiod");
  });

  it("makes a layer unverified when its service's period has lapsed", async () => {
    const fetcher = servicePeriods({
      "mndnr-deer-permit-areas": ["July 2025 - June 2026"],
      "mndnr-cwd-zones": ["July 2026 - June 2027"],
    });

    const gates = await loadSeasonGates(absolute(dnrLayers), { fetcher, now: at("2026-10-01") });

    expect(gates["mndnr-deer-permit-areas"]).toEqual({
      status: "unverified",
      lastVerified: "July 2026 - June 2027",
      officialUrl: "https://www.dnr.state.mn.us/mammals/deer/management/dpas.html",
    });
    expect(gates["mndnr-cwd-zones"]?.status).toBe("current");
  });

  it("makes a layer unverified when its service publishes no period", async () => {
    const gates = await loadSeasonGates(absolute(dnrLayers), {
      fetcher: servicePeriods({}),
      now: at("2026-10-01"),
    });

    expect(gates["mndnr-deer-permit-areas"]?.status).toBe("unverified");
    expect(gates["mndnr-cwd-zones"]?.status).toBe("unverified");
  });

  it.each([
    ["an unreachable service", () => Promise.reject(new TypeError("Failed to fetch"))],
    ["a failed request", async () => new Response("no", { status: 502 })],
    ["an ArcGIS error", async () => Response.json({ error: { code: 400, message: "bad query" } })],
    ["a response that is not JSON", async () => new Response("<html>")],
  ])("fails closed for %s", async (_label, respond) => {
    const gates = await loadSeasonGates(absolute(dnrLayers), {
      fetcher: respond as typeof fetch,
      now: at("2026-10-01"),
    });

    expect(gates["mndnr-deer-permit-areas"]?.status).toBe("unverified");
    expect(gates["mndnr-bear-permit-areas"]?.status).toBe("current");
  });

  describe("masking what the user left on", () => {
    const gates = initialSeasonGates(dnrLayers, at("2027-04-01"));

    it("hides a stored-on layer whose season is not current, and leaves the rest as chosen", () => {
      const state = allOn(dnrLayers);

      const masked = maskUnavailableLayers(state, gates);

      expect(masked["mndnr-bear-permit-areas"].visible).toBe(false);
      expect(masked["mndnr-deer-permit-areas"].visible).toBe(false);
      expect(masked["mndnr-hunter-walking-trails"].visible).toBe(true);
      expect(state["mndnr-bear-permit-areas"].visible).toBe(true);
    });

    it("keeps a layer's opacity while it is hidden", () => {
      const state = { "mndnr-bear-permit-areas": { visible: true, opacity: 0.4 } };

      expect(maskUnavailableLayers(state, gates)["mndnr-bear-permit-areas"]).toEqual({
        visible: false,
        opacity: 0.4,
      });
    });

    it("shows a layer once its season is current", () => {
      const current = initialSeasonGates(dnrLayers, at("2026-10-01"));

      expect(maskUnavailableLayers(allOn(dnrLayers), current)["mndnr-bear-permit-areas"].visible)
        .toBe(true);
    });

    it("cannot be switched on while its season is not current", () => {
      expect(isSeasonAvailable(gates, layerNamed("mndnr-bear-permit-areas").id)).toBe(false);
      expect(isSeasonAvailable(gates, layerNamed("mndnr-deer-permit-areas").id)).toBe(false);
      expect(isSeasonAvailable(gates, layerNamed("mndnr-walk-in-access-sites").id)).toBe(true);
    });

    it("counts a layer still being checked as unavailable", () => {
      const checking = initialSeasonGates(dnrLayers, at("2026-10-01"));

      expect(isSeasonAvailable(checking, "mndnr-deer-permit-areas")).toBe(false);
    });
  });
});
