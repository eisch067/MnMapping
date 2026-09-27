import { isPersonalMode } from "@/config/appMode";
import { authoritativeElevationSource } from "@/config/elevation";

const minElevationFeet = 600;
const maxElevationFeet = 2_300;

export async function GET(request: Request) {
  if (!isPersonalMode) return new Response("Not found.", { status: 404 });
  const minimumFeet = Number(new URL(request.url).searchParams.get("minimum"));
  if (!Number.isFinite(minimumFeet) || minimumFeet < minElevationFeet || minimumFeet > maxElevationFeet) {
    return Response.json({ error: "Elevation threshold is outside the supported range." }, { status: 400 });
  }
  const minimumMeters = minimumFeet * 0.3048;
  const remap = {
    rasterFunction: "Remap",
    rasterFunctionArguments: {
      InputRanges: [minimumMeters, 8848],
      OutputValues: [1],
      NoDataRanges: [],
      AllowUnmatched: false,
    },
  };
  const renderingRule = {
    rasterFunction: "Colormap",
    rasterFunctionArguments: {
      Colormap: [[0, 0, 0, 0], [1, 255, 105, 65]],
      Raster: remap,
    },
  };
  const upstreamUrl = new URL(`${authoritativeElevationSource.serviceUrl}/exportImage`);
  upstreamUrl.searchParams.set("bbox", "-97.24,43.5,-89.49,49.38");
  upstreamUrl.searchParams.set("bboxSR", "4326");
  upstreamUrl.searchParams.set("imageSR", "4326");
  upstreamUrl.searchParams.set("size", "1024,768");
  upstreamUrl.searchParams.set("format", "png32");
  upstreamUrl.searchParams.set("f", "image");
  upstreamUrl.searchParams.set("renderingRule", JSON.stringify(renderingRule));
  try {
    const upstream = await fetch(upstreamUrl, { cache: "no-store" });
    if (!upstream.ok || !upstream.headers.get("content-type")?.startsWith("image/")) {
      return Response.json({ error: "The MnGeo threshold renderer is unavailable." }, { status: 502 });
    }
    return new Response(upstream.body, {
      status: 200,
      headers: { "content-type": upstream.headers.get("content-type") ?? "image/png", "cache-control": "no-store" },
    });
  } catch {
    return Response.json({ error: "The MnGeo threshold renderer did not respond." }, { status: 502 });
  }
}
