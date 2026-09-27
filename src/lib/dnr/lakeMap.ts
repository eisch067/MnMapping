// The DNR-hosted lake map PDF that supplements the Lake depth map. DNR names a sheet from the
// lake's map ID and a three-digit issue, and 010 is the first issue every lake checked has. The
// PDF is passed through and never stored, so it is not cached here, by the browser, or by the
// platform; DNR's own page stays linked beside it for a lake whose sheets differ.

const sheetPattern = /^[a-z]\d{7}\.pdf$/;
const firstIssue = "010";
const sheetRoot = "https://files.dnr.state.mn.us/lakefind/data/lakemaps/";
export const lakeMapRoute = "/api/lake-map/";

export function lakeMapPath(mapId: string): string {
  return `${lakeMapRoute}${mapId.toLowerCase()}${firstIssue}.pdf`;
}

export function isLakeMapFile(file: string): boolean {
  return sheetPattern.test(file);
}

function refusal(message: string, status: number): Response {
  return Response.json({ error: message }, { status, headers: { "cache-control": "no-store" } });
}

export async function streamLakeMap(
  file: string,
  fetcher: typeof fetch = (...args) => fetch(...args),
): Promise<Response> {
  if (!isLakeMapFile(file)) return refusal("Unsupported lake map.", 400);
  try {
    const upstream = await fetcher(`${sheetRoot}${file}`, { cache: "no-store" });
    if (upstream.status === 404) return refusal("DNR has no lake map by that name.", 404);
    if (!upstream.ok) return refusal("The DNR lake map did not load.", 502);
    // A page that is not a PDF would otherwise be served inline as one.
    if (!upstream.headers.get("content-type")?.includes("application/pdf")) {
      return refusal("DNR did not return a PDF for that lake map.", 502);
    }
    return new Response(upstream.body, {
      status: 200,
      headers: {
        "content-type": "application/pdf",
        "content-disposition": `inline; filename="${file}"`,
        "cache-control": "no-store",
      },
    });
  } catch {
    return refusal("The DNR lake map did not respond.", 502);
  }
}
