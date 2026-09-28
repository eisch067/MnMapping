import { describe, expect, it, vi } from "vitest";
import { geodesicDistanceMeters } from "@/lib/geodesy";
import { profilePositions, sampleElevations } from "./elevationSampling";

describe("Minnesota DEM elevation sampling", () => {
  it("builds a bounded geodesic profile with both endpoints", () => {
    const profile = profilePositions([[0, 0], [0.01, 0]]);

    expect(profile[0]).toEqual([0, 0]);
    expect(profile.at(-1)).toEqual([0.01, 0]);
    expect(profile.length).toBeGreaterThan(2);
    expect(profile.length).toBeLessThanOrEqual(2_000);
    expect(geodesicDistanceMeters(profile[0], profile[1])).toBeLessThanOrEqual(10.01);
    const denseLine = Array.from({ length: 2_500 }, (_, index) => [index / 1_000_000, 46] as const);
    expect(profilePositions(denseLine).length).toBeLessThanOrEqual(2_000);
  });

  it("batches positions into stubbed ArcGIS getSamples calls in request order", async () => {
    const requests: URL[] = [];
    const fetcher = vi.fn(async (input: RequestInfo | URL) => {
      const url = new URL(String(input));
      requests.push(url);
      const geometry = JSON.parse(url.searchParams.get("geometry") ?? "{}") as {
        points: number[][];
      };
      return Response.json({
        samples: geometry.points.map((_point, locationId) => ({ locationId, value: 200 + locationId })),
      });
    });
    const positions = Array.from({ length: 81 }, (_, index) => [index / 100, 46] as const);

    const samples = await sampleElevations(positions, fetcher);

    expect(fetcher).toHaveBeenCalledTimes(2);
    expect(requests[0].pathname).toMatch(/ImageServer\/getSamples$/);
    expect(requests[0].searchParams.get("geometryType")).toBe("esriGeometryMultipoint");
    expect(requests[0].searchParams.get("interpolation")).toBe("RSP_BilinearInterpolation");
    expect(samples.map(({ elevationMeters }) => elevationMeters)).toEqual(
      positions.map((_, index) => 200 + index % 80),
    );
  });

  it("propagates an abort signal to active DEM requests", async () => {
    const controller = new AbortController();
    const fetcher = vi.fn(async (_input: RequestInfo | URL, init?: RequestInit) =>
      new Promise<Response>((_resolve, reject) => {
        init?.signal?.addEventListener("abort", () => reject(new DOMException("Aborted", "AbortError")), { once: true });
      }));
    const request = sampleElevations([[0, 46]], fetcher, controller.signal);
    controller.abort();
    await expect(request).rejects.toThrow("Aborted");
    expect(fetcher.mock.calls[0][1]?.signal).toBe(controller.signal);
  });

  it("rejects when any location is outside DEM coverage", async () => {
    const fetcher = vi.fn(async () => Response.json({
      samples: [{ locationId: 0, value: "NoData" }, { locationId: 1, value: 20 }],
    }));

    await expect(sampleElevations([[0, 0], [0.01, 0]], fetcher)).rejects.toThrow(/no elevation value/);
  });
});
