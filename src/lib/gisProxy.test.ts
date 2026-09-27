import { afterEach, describe, expect, it, vi } from "vitest";
import { dnrGisRoot, dnrLakeFinderRoot, resolveUpstream } from "@/lib/gisProxy";

const cwdPath = [
  "Hosted",
  "CWD_Sampling_and_Regulations_for_MN_2020_Deer_Seasons_Public_View",
  "FeatureServer",
  "3",
  "query",
];

afterEach(() => {
  vi.unstubAllEnvs();
  vi.resetModules();
});

describe("resolveUpstream", () => {
  it("joins a known provider's root and the requested path", () => {
    const upstream = resolveUpstream("mngeo-features", [
      "us_mn_state_dnr",
      "bdry_deer_permit_areas",
      "FeatureServer",
      "0",
    ]);

    expect(upstream?.href).toBe(
      "https://enterprise.gisdata.mn.gov/aghost/rest/services/us_mn_state_dnr/bdry_deer_permit_areas/FeatureServer/0",
    );
  });

  it("refuses a provider it does not list", () => {
    expect(resolveUpstream("evil", ["anything"])).toBeNull();
    expect(resolveUpstream("constructor", ["anything"])).toBeNull();
  });

  it("refuses an empty path and characters outside a service name", () => {
    expect(resolveUpstream("mngeo-features", [])).toBeNull();
    expect(resolveUpstream("mngeo-features", ["a b"])).toBeNull();
    expect(resolveUpstream("mngeo-features", ["a?b=c"])).toBeNull();
    expect(resolveUpstream("mngeo-features", ["a/b"])).toBeNull();
  });

  it("refuses dot segments that would climb out of the provider's root", () => {
    expect(resolveUpstream("mngeo-features", ["..", "other"])).toBeNull();
    expect(resolveUpstream("mngeo-features", [".", "other"])).toBeNull();
  });

  describe("the DNR GIS provider", () => {
    it("reaches the pinned CWD service", () => {
      const upstream = resolveUpstream("dnr-gis", cwdPath);

      expect(upstream?.href).toBe(`${dnrGisRoot}${cwdPath.join("/")}`);
      expect(upstream?.hostname).toBe("gis.dnr.state.mn.us");
    });

    it("is pinned to one server's services and cannot reach the rest of the host", () => {
      expect(dnrGisRoot).toBe(
        "https://gis.dnr.state.mn.us/arcgis/sharing/servers/8462b6a81c46461484c68d4bd638134c/rest/services/",
      );
      expect(resolveUpstream("dnr-gis", ["..", "..", "admin"])).toBeNull();
      expect(resolveUpstream("dnr-gis", ["Hosted", "..", "..", "..", "admin"])).toBeNull();
    });
  });

  describe("the DNR LakeFinder provider", () => {
    it("reaches the by-ID API and nothing else on the host", () => {
      const upstream = resolveUpstream("dnr-lakefinder", ["by_id", "v1"]);

      expect(dnrLakeFinderRoot).toBe("https://services.dnr.state.mn.us/api/lakefinder/");
      expect(upstream?.href).toBe("https://services.dnr.state.mn.us/api/lakefinder/by_id/v1");
      expect(resolveUpstream("dnr-lakefinder", ["..", "..", "other"])).toBeNull();
    });
  });

  it("gives the public build no route to the DNR GIS server or LakeFinder", async () => {
    vi.stubEnv("NEXT_PUBLIC_APP_MODE", "public");
    vi.resetModules();

    const publicProxy = await import("@/lib/gisProxy");

    expect(publicProxy.resolveUpstream("dnr-gis", cwdPath)).toBeNull();
    expect(publicProxy.resolveUpstream("dnr-lakefinder", ["by_id", "v1"])).toBeNull();
    expect(publicProxy.resolveUpstream("mngeo-features", ["us_mn_state_dnr"])).not.toBeNull();
  });
});
