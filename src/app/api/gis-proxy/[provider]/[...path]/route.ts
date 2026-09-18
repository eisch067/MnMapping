import type { NextRequest } from "next/server";

const providerRoots = {
  hubbard: "https://gis.co.hubbard.mn.us/arcgis/rest/services/",
  becker: "https://gis-server.co.becker.mn.us/arcgis/rest/services/",
  todd: "https://gis.mytoddcounty.com/toddcounty/rest/services/",
  "mngeo-dem": "https://enterprise.gisdata.mn.gov/agsimg/rest/services/",
  "mngeo-imagery": "https://imageserver.gisdata.mn.gov/cgi-bin/",
  "mngeo-features": "https://enterprise.gisdata.mn.gov/aghost/rest/services/",
  "mngeo-boundaries": "https://feat.gisdata.mn.gov/arcgis/rest/services/",
  "douglas-open": "https://services2.arcgis.com/8iQOd6RvhPL17pJd/arcgis/rest/services/",
  "meeker-open": "https://services2.arcgis.com/pHb2Lre5eSy5plfE/arcgis/rest/services/",
  "goodhue-public": "https://publicmaps.co.goodhue.mn.us/arcgis/rest/services/",
  wadena: "https://gis.co.wadena.mn.us/arcgis/rest/services/",
  beltrami: "https://arcgis.co.beltrami.mn.us/arcgis/rest/services/",
  brown: "https://gis.browncountymn.gov/server/rest/services/",
  "carlton-imagery": "https://svc.pictometry.com/Image/",
  "olmsted-imagery": "https://public.gis.olmstedcounty.gov/arcgis/rest/services/",
  "ramsey-imagery": "https://maps.co.ramsey.mn.us/arcgis/rest/services/",
  "aitkin-imagery": "https://gisweb.co.aitkin.mn.us/arcgis/rest/services/",
  "anoka-imagery": "https://gis.anokacountymn.gov/anoka_gis/rest/services/",
  "big-stone-imagery": "https://gis.bigstonecounty.gov/arcgis/rest/services/",
  "blue-earth-imagery": "https://gis.blueearthcountymn.gov/server/rest/services/",
  "carver-imagery": "https://tiles.arcgis.com/tiles/wMZT8kNwa6tOxhKg/arcgis/rest/services/",
  "cass-imagery": "https://cassweb.casscountymn.gov/arcgis/rest/services/",
  "chippewa-imagery": "https://gis.chippewa.mn/arcgis/rest/services/",
  "chisago-imagery": "https://gis.chisagocounty.us/arcgis/rest/services/",
  "clay-imagery": "https://map.claycountymn.gov/arcgis/rest/services/",
  "clearwater-imagery": "https://map.co.clearwater.mn.us/arcgis/rest/services/",
  "crow-wing-imagery": "https://gis.crowwing.us/cwc_external_main/rest/services/",
  "dakota-imagery": "https://gisimg.co.dakota.mn.us/arcgis/rest/services/",
  "dodge-imagery": "https://maps.co.goodhue.mn.us/server/rest/services/",
  "goodhue-imagery": "https://maps.co.goodhue.mn.us/server/rest/services/",
  "grant-imagery": "https://gis.co.grant.mn.us/arcgis/rest/services/",
  "mille-lacs-imagery": "https://gis.co.mille-lacs.mn.us/arcgis/rest/services/",
  "mcleod-imagery": "https://tiles.arcgis.com/tiles/7sSDkfIZpd2ReAg5/arcgis/rest/services/",
  "mower-imagery": "https://gisweb.co.mower.mn.us/server/rest/services/",
  "otter-tail-imagery": "https://tiles.arcgis.com/tiles/Pg1yLLk3jMuhxBKI/arcgis/rest/services/",
  "pennington-imagery": "https://gismap.co.pennington.mn.us/arcgis/rest/services/",
  "pipestone-imagery": "https://gis.pcmn.us/arcgis/rest/services/",
  "pope-imagery": "https://gis.popecountymn.gov/arcgis/rest/services/",
  "scott-imagery": "https://gis.co.scott.mn.us/arcgis/rest/services/",
  "sherburne-imagery": "https://gis.co.sherburne.mn.us/arcgis3/rest/services/",
  "stearns-imagery": "https://gis.co.stearns.mn.us/arcgis/rest/services/",
  "steele-imagery": "https://gis.steele.mn/server/rest/services/",
  "traverse-imagery": "https://gis.co.traverse.mn.us/arcgis/rest/services/",
  "washington-imagery": "https://maps.co.washington.mn.us/arcgis/rest/services/",
  "wilkin-imagery": "https://gisweb.co.wilkin.mn.us/arcgis/rest/services/",
  "yellow-medicine-imagery": "https://gis.co.ym.mn.gov/arcgis/rest/services/",
} as const;

type Provider = keyof typeof providerRoots;

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ provider: string; path: string[] }> },
) {
  const { provider, path } = await params;
  if (!isProvider(provider) || !isSafePath(path)) {
    return Response.json({ error: "Unsupported GIS proxy target." }, { status: 400 });
  }

  const upstreamUrl = new URL(path.join("/"), providerRoots[provider]);
  upstreamUrl.search = request.nextUrl.search;

  try {
    const upstream = await fetch(upstreamUrl, {
      cache: "no-store",
      headers: { accept: request.headers.get("accept") ?? "*/*" },
    });
    const headers = new Headers();
    for (const name of ["cache-control", "content-disposition", "content-type", "etag", "last-modified"]) {
      const value = upstream.headers.get(name);
      if (value) headers.set(name, value);
    }
    return new Response(upstream.body, { status: upstream.status, headers });
  } catch {
    return Response.json({ error: "The county GIS service did not respond." }, { status: 502 });
  }
}

function isProvider(value: string): value is Provider {
  return Object.hasOwn(providerRoots, value);
}

function isSafePath(path: string[]): boolean {
  return path.length > 0 && path.every((segment) => /^[A-Za-z0-9_.()-]+$/.test(segment));
}
