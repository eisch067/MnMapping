import { describe, expect, it } from "vitest";
import type { LayerDefinition } from "@/config/layers";
import type { IdentifyContext } from "@/lib/identify/types";
import { identifyWetlandBuffer } from "./wetlandBuffer";

function layer(id: string): LayerDefinition {
  return {
    id,
    name: id,
    category: "dnr-recreation",
    sourceType: "arcgis-mapserver",
    url: "https://example.test/MapServer",
    defaultVisible: false,
    defaultOpacity: 1,
    attribution: "Minnesota Department of Natural Resources",
  };
}

function contextFor(attributes: Record<string, unknown>[], calls: URL[] = []): IdentifyContext {
  return {
    point: { longitude: -93.2, latitude: 45.1, toleranceMeters: 15 },
    fetcher: async (input) => {
      calls.push(new URL(String(input)));
      return Response.json({ features: attributes.map((entry) => ({ attributes: entry })) });
    },
  };
}

describe("identifyWetlandBuffer", () => {
  it("queries the NWI polygon at the clicked point with only known fields", async () => {
    const calls: URL[] = [];
    await identifyWetlandBuffer(layer("mndnr-national-wetlands-inventory"), contextFor([], calls));

    expect(calls[0]?.pathname).toBe("/MapServer/0/query");
    expect(calls[0]?.searchParams.get("geometry")).toBe("-93.2,45.1");
    expect(calls[0]?.searchParams.get("outFields")).toBe(
      "attribute,wetland_type,acres,hgm_desc,spcc_desc,cow_class1,circ39_class",
    );
    expect(calls[0]?.searchParams.get("distance")).toBeNull();
  });

  it("identifies buffer lines within 15 m and reports their attributes", async () => {
    const calls: URL[] = [];
    const [result] = await identifyWetlandBuffer(
      layer("mndnr-buffer-protection-lines"),
      contextFor([{ description: "Public ditch", buffer_ft: 16.5, dnr_sl_cla: "Public ditch" }], calls),
    );

    expect(calls[0]?.pathname).toBe("/MapServer/1/query");
    expect(calls[0]?.searchParams.get("distance")).toBe("15");
    expect(calls[0]?.searchParams.get("units")).toBe("esriSRUnit_Meter");
    expect(result).toMatchObject({
      title: "Public ditch",
      rows: [
        { label: "Water", value: "Public ditch" },
        { label: "Minimum state buffer", value: "16.5" },
        { label: "DNR classification", value: "Public ditch" },
      ],
      notes: expect.arrayContaining([expect.stringMatching(/general guide/)]),
    });
  });

  it("queries buffer basin polygons without a line tolerance", async () => {
    const calls: URL[] = [];
    await identifyWetlandBuffer(layer("mndnr-buffer-protection-basins"), contextFor([], calls));

    expect(calls[0]?.pathname).toBe("/MapServer/2/query");
    expect(calls[0]?.searchParams.get("distance")).toBeNull();
  });

  it("states that NWI has no legal or regulatory status and links to official information", async () => {
    const [result] = await identifyWetlandBuffer(
      layer("mndnr-national-wetlands-inventory"),
      contextFor([{ wetland_type: "Freshwater Emergent Wetland", attribute: "PEM1A" }]),
    );

    expect(result?.notes.join(" ")).toMatch(/no legal or regulatory status/);
    expect(result?.notes.join(" ")).toMatch(/not a wetland boundary/);
    expect(result?.links.some(({ href }) => href.includes("dnr.state.mn.us"))).toBe(true);
  });

  it("reports ArcGIS errors rather than presenting them as empty identify results", async () => {
    const context: IdentifyContext = {
      ...contextFor([]),
      fetcher: async () => Response.json({ error: { code: 400, message: "Invalid query" } }),
    };

    await expect(
      identifyWetlandBuffer(layer("mndnr-buffer-protection-lines"), context),
    ).rejects.toThrow(/Invalid query/);
  });
});
