import { describe, expect, it, vi } from "vitest";
import { isLakeMapFile, lakeMapPath, streamLakeMap } from "./lakeMap";

const upstreamUrl = "https://files.dnr.state.mn.us/lakefind/data/lakemaps/b0025010.pdf";

function pdfResponse(init?: ResponseInit) {
  return new Response("%PDF-1.3", {
    headers: {
      "content-type": "application/pdf",
      "cache-control": "max-age=2592000",
      etag: '"33a01"',
      "last-modified": "Fri, 14 Jan 2000 21:31:16 GMT",
    },
    ...init,
  });
}

describe("lakeMapPath", () => {
  it("names the first published sheet for a map ID, in DNR's lower-case file naming", () => {
    expect(lakeMapPath("B0025")).toBe("/api/lake-map/b0025010.pdf");
  });
});

describe("isLakeMapFile", () => {
  it("accepts only a lake map sheet name", () => {
    expect(isLakeMapFile("b0025010.pdf")).toBe(true);
    expect(isLakeMapFile("B0025010.pdf")).toBe(false);
    expect(isLakeMapFile("b0025010.tif")).toBe(false);
    expect(isLakeMapFile("../b0025010.pdf")).toBe(false);
    expect(isLakeMapFile("lakemap_legend1.pdf")).toBe(false);
  });
});

describe("streamLakeMap", () => {
  it("streams DNR's PDF and forbids every cache from keeping it", async () => {
    const fetcher = vi.fn<typeof fetch>().mockResolvedValue(pdfResponse());

    const response = await streamLakeMap("b0025010.pdf", fetcher);

    expect(String(fetcher.mock.calls[0]?.[0])).toBe(upstreamUrl);
    expect(fetcher.mock.calls[0]?.[1]).toMatchObject({ cache: "no-store" });
    expect(response.status).toBe(200);
    expect(response.headers.get("content-type")).toBe("application/pdf");
    expect(response.headers.get("cache-control")).toBe("no-store");
    expect(response.headers.get("content-disposition")).toBe('inline; filename="b0025010.pdf"');
    expect(await response.text()).toBe("%PDF-1.3");
  });

  it("does not pass on validators a cache could revalidate with", async () => {
    const response = await streamLakeMap("b0025010.pdf", async () => pdfResponse());

    expect(response.headers.get("etag")).toBeNull();
    expect(response.headers.get("last-modified")).toBeNull();
  });

  it("refuses a name that is not a lake map sheet without asking DNR", async () => {
    const fetcher = vi.fn<typeof fetch>();

    const response = await streamLakeMap("../secret.pdf", fetcher);

    expect(response.status).toBe(400);
    expect(fetcher).not.toHaveBeenCalled();
  });

  it("reports a sheet DNR does not have as not found, uncached", async () => {
    const response = await streamLakeMap(
      "b0025010.pdf",
      async () => new Response("missing", { status: 404 }),
    );

    expect(response.status).toBe(404);
    expect(response.headers.get("cache-control")).toBe("no-store");
  });

  it("refuses to serve a response that is not a PDF", async () => {
    const response = await streamLakeMap(
      "b0025010.pdf",
      async () => new Response("<html>Maintenance</html>", { headers: { "content-type": "text/html" } }),
    );

    expect(response.status).toBe(502);
    expect(response.headers.get("content-type")).not.toMatch(/pdf/);
  });

  it("reports DNR not answering as a bad gateway, uncached", async () => {
    const response = await streamLakeMap("b0025010.pdf", async () => {
      throw new TypeError("Failed to fetch");
    });

    expect(response.status).toBe(502);
    expect(response.headers.get("cache-control")).toBe("no-store");
  });
});
