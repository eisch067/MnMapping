import { describe, expect, it } from "vitest";
import { layerRegistry } from "@/config/layers";
import { loadCwdSamplingGate } from "@/lib/dnr/cwdSamplingGate";

const itemId = "8462b6a81c46461484c68d4bd638134c";
const configuredLayer = layerRegistry.find(({ id }) => id === "mndnr-cwd-sampling-sites");
if (!configuredLayer) throw new Error("CWD sampling layer is not registered");
const layer = { ...configuredLayer, url: new URL(configuredLayer.url, "https://mnmapping.test").href };
const fields = [
  "sitename", "nearestcity", "servicetype", "cwdareas", "dpa", "sampletime", "selfsrtime",
  "address", "directions", "notes", "admin", "last_edited_date", "moredetail", "show",
];

function stubbedSource(change?: (url: URL, body: Record<string, unknown>) => Record<string, unknown>): typeof fetch {
  return async (input) => {
    const url = new URL(String(input));
    let body: Record<string, unknown> = {};
    if (url.pathname.endsWith(`/dnr-gis-item/${itemId}`)) {
      body = { title: "CWD_Sampling_and_Regulations_for_MN_2026_Deer_Seasons_Public_View_SC" };
    } else if (url.pathname.endsWith("/FeatureServer")) {
      body = {
        layers: [
          { id: 1, name: "wld_cwd_hunter_resource_sites_web" },
          { id: 3, name: "wld_cwd_dpa_sampling_area_web" },
        ],
      };
    } else if (url.pathname.endsWith("/3/query")) {
      body = { features: [{ attributes: { effperiod: "July 2026 - June 2027" } }] };
    } else if (url.pathname.endsWith("/1/query")) {
      body = { features: [{ attributes: { last_edited_date: Date.UTC(2026, 8, 20) } }] };
    } else if (url.pathname.endsWith("/FeatureServer/1")) {
      body = {
        name: "wld_cwd_hunter_resource_sites_web",
        fields: fields.map((name) => ({ name })),
      };
    }
    return Response.json(change?.(url, body) ?? body);
  };
}

const request = {
  fetcher: stubbedSource(),
  now: new Date("2026-10-01T12:00:00Z"),
};

describe("CWD sampling season verification", () => {
  it("is current only when all five source checks pass", async () => {
    await expect(loadCwdSamplingGate(layer, request)).resolves.toEqual({
      status: "current",
      label: "July 2026 - June 2027",
    });
  });

  it.each([
    ["effective period", (url: URL, body: Record<string, unknown>) =>
      url.pathname.endsWith("/3/query") ? { features: [{ attributes: { effperiod: "July 2025 - June 2026" } }] } : body],
    ["item title year", (url: URL, body: Record<string, unknown>) =>
      url.pathname.endsWith(`/dnr-gis-item/${itemId}`) ? { title: "CWD 20260" } : body],
    ["shown sites", (url: URL, body: Record<string, unknown>) =>
      url.pathname.endsWith("/1/query") && url.searchParams.get("where") === layer.options?.where ? { features: [] } : body],
    ["latest edit date", (url: URL, body: Record<string, unknown>) =>
      url.pathname.endsWith("/1/query") && url.searchParams.get("where") === "1=1" ? { features: [{ attributes: { last_edited_date: Date.UTC(2026, 5, 30) } }] } : body],
    ["layer schema", (url: URL, body: Record<string, unknown>) =>
      url.pathname.endsWith("/FeatureServer/1") ? { ...body, name: "unexpected layer" } : body],
    ["season layer name", (url: URL, body: Record<string, unknown>) =>
      url.pathname.endsWith("/FeatureServer")
        ? { layers: [{ id: 1, name: "wld_cwd_hunter_resource_sites_web" }, { id: 3, name: "unexpected layer" }] }
        : body],
    ["edit date", (url: URL, body: Record<string, unknown>) =>
      url.pathname.endsWith("/1/query") && url.searchParams.get("where") === "1=1"
        ? { features: [{ attributes: { last_edited_date: "Infinity" } }] }
        : body],
  ])("fails closed when %s fails", async (_name, change) => {
    await expect(loadCwdSamplingGate(layer, {
      ...request,
      fetcher: stubbedSource(change),
    })).resolves.toMatchObject({ status: "unverified", lastVerified: "July 2026 - June 2027" });
  });

  it("queries without cache and requests only the filtered public-site record shape", async () => {
    const urls: URL[] = [];
    await loadCwdSamplingGate(layer, {
      ...request,
      fetcher: async (input, init) => {
        const url = new URL(String(input));
        urls.push(url);
        expect(init?.cache).toBe("no-store");
        return stubbedSource()(input);
      },
    });
    const siteQuery = urls.find((url) => url.pathname.endsWith("/1/query") && url.searchParams.get("where") === layer.options?.where);
    const freshnessQuery = urls.find((url) => url.pathname.endsWith("/1/query") && url.searchParams.get("where") === "1=1");
    expect(siteQuery?.searchParams.get("where")).toBe(layer.options?.where);
    expect(freshnessQuery?.searchParams.get("outFields")).toBe("last_edited_date");
    expect(freshnessQuery?.searchParams.get("where")).toBe("1=1");
    expect(freshnessQuery?.searchParams.get("orderByFields")).toBe("last_edited_date DESC");
    expect(freshnessQuery?.searchParams.get("resultRecordCount")).toBe("1");
  });
});
