import { describe, expect, it } from "vitest";
import { fetchAllArcGisFeatures } from "@/lib/map/arcgisFeatures";

function queryUrl(id: string): URL {
  const query = "where=1%3D1&geometry=1%2C2%2C3%2C4&f=geojson";
  return new URL(`https://example.test/${id}/FeatureServer/0/query?${query}`);
}

function featureCollection(ids: number[], exceededTransferLimit: boolean) {
  return {
    type: "FeatureCollection",
    features: ids.map((id) => ({ type: "Feature", id, properties: {}, geometry: null })),
    exceededTransferLimit,
  };
}

// Answers layer metadata requests with `metadata` and /query requests with `respondToQuery`,
// recording every requested URL in `calls`.
function serviceFetcher(
  metadata: unknown,
  respondToQuery: (url: URL) => unknown,
  calls: URL[] = [],
) {
  return async (input: string | URL | Request) => {
    const url = new URL(String(input));
    calls.push(url);
    return Response.json(url.pathname.endsWith("/query") ? respondToQuery(url) : metadata);
  };
}

describe("fetchAllArcGisFeatures", () => {
  it("pages through results by offset when the service supports pagination", async () => {
    const calls: URL[] = [];
    const progress: number[] = [];
    const fetcher = serviceFetcher(
      {
        maxRecordCount: 2,
        objectIdField: "OBJECTID",
        advancedQueryCapabilities: { supportsPagination: true, supportsOrderBy: true },
      },
      (url) => Number(url.searchParams.get("resultOffset")) === 0
        ? featureCollection([1, 2], true)
        : featureCollection([3], false),
      calls,
    );

    const result = await fetchAllArcGisFeatures(queryUrl("offset-test"), {
      fetcher,
      onProgress: ({ loaded }) => progress.push(loaded),
    });

    expect(result.features.map((feature) => feature.id)).toStrictEqual([1, 2, 3]);
    expect(progress).toStrictEqual([2, 3]);
    expect(calls[1]?.searchParams.get("resultRecordCount")).toBe("2");
    expect(calls[2]?.searchParams.get("resultOffset")).toBe("2");
    expect(calls[1]?.searchParams.get("orderByFields")).toBe("OBJECTID ASC");
    expect(result.exceededTransferLimit).toBe(false);
  });

  it("falls back to object id batches when the service does not support pagination", async () => {
    const calls: URL[] = [];
    const fetcher = serviceFetcher(
      {
        maxRecordCount: 2,
        objectIdFieldName: "FID",
        advancedQueryCapabilities: { supportsPagination: false },
      },
      (url) => {
        if (url.searchParams.get("returnIdsOnly") === "true") {
          return { objectIds: [8, 9, 10], objectIdFieldName: "FID" };
        }
        const ids = (url.searchParams.get("objectIds") ?? "").split(",").map(Number);
        return featureCollection(ids, false);
      },
      calls,
    );

    const result = await fetchAllArcGisFeatures(queryUrl("ids-test"), { fetcher });

    expect(result.features.map((feature) => feature.id)).toStrictEqual([8, 9, 10]);
    const featureCalls = calls.filter((url) => url.searchParams.has("objectIds"));
    expect(featureCalls).toHaveLength(2);
    expect(featureCalls[0]?.searchParams.has("geometry")).toBe(false);
    expect(result.exceededTransferLimit).toBe(false);
  });

  it("rejects with the ArcGIS error code and message", async () => {
    const fetcher = serviceFetcher(
      { maxRecordCount: 10 },
      () => ({ error: { code: 400, message: "Bad query" } }),
    );

    await expect(fetchAllArcGisFeatures(queryUrl("error-test"), { fetcher }))
      .rejects.toThrow(/ArcGIS error 400: Bad query/);
  });

  it("rejects when the service keeps returning the same page", async () => {
    const fetcher = serviceFetcher({ maxRecordCount: 2 }, () => featureCollection([1, 2], true));

    await expect(fetchAllArcGisFeatures(queryUrl("repeat-test"), { fetcher }))
      .rejects.toThrow(/repeated page/);
  });
});
