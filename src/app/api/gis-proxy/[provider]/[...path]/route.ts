import type { NextRequest } from "next/server";

const providerRoots = {
  hubbard: "https://gis.co.hubbard.mn.us/arcgis/rest/services/",
  becker: "https://gis-server.co.becker.mn.us/arcgis/rest/services/",
  todd: "https://gis.mytoddcounty.com/toddcounty/rest/services/",
  "mngeo-dem": "https://enterprise.gisdata.mn.gov/agsimg/rest/services/",
  "mngeo-imagery": "https://imageserver.gisdata.mn.gov/cgi-bin/",
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
