import type { NextRequest } from "next/server";
import { resolveUpstream } from "@/lib/gisProxy";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ provider: string; path: string[] }> },
) {
  const { provider, path } = await params;
  const upstreamUrl = resolveUpstream(provider, path);
  if (!upstreamUrl) {
    return Response.json({ error: "Unsupported GIS proxy target." }, { status: 400 });
  }
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
