import { isPersonalMode } from "@/config/appMode";
import { authoritativeElevationSource } from "@/config/elevation";
import { minnesotaBounds, type ViewportBounds } from "@/lib/location";

const minElevationFeet = 600;
const maxElevationFeet = 2_300;

export async function GET(request: Request) {
  if (!isPersonalMode) return new Response("Not found.", { status: 404 });
  const params = new URL(request.url).searchParams;
  const minimumFeet = Number(params.get("minimum"));
  const bounds = clippedMinnesotaBounds(params);
  if (!Number.isFinite(minimumFeet) || minimumFeet < minElevationFeet || minimumFeet > maxElevationFeet) {
    return Response.json({ error: "Elevation threshold is outside the supported range." }, { status: 400 });
  }
  if (!bounds) return Response.json({ error: "Threshold bounds must intersect Minnesota." }, { status: 400 });
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
  upstreamUrl.searchParams.set("bbox", [bounds.west, bounds.south, bounds.east, bounds.north].join(","));
  upstreamUrl.searchParams.set("bboxSR", "4326");
  upstreamUrl.searchParams.set("imageSR", "4326");
  const [width, height] = imageSize(bounds);
  upstreamUrl.searchParams.set("size", `${width},${height}`);
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

function clippedMinnesotaBounds(params: URLSearchParams): ViewportBounds | null {
  const requested = {
    west: Number(params.get("west")),
    south: Number(params.get("south")),
    east: Number(params.get("east")),
    north: Number(params.get("north")),
  };
  if (Object.values(requested).some((value) => !Number.isFinite(value))
    || requested.west >= requested.east || requested.south >= requested.north) return null;
  const bounds = {
    west: Math.max(requested.west, minnesotaBounds.west),
    south: Math.max(requested.south, minnesotaBounds.south),
    east: Math.min(requested.east, minnesotaBounds.east),
    north: Math.min(requested.north, minnesotaBounds.north),
  };
  return bounds.west < bounds.east && bounds.south < bounds.north ? bounds : null;
}

function imageSize(bounds: ViewportBounds): [number, number] {
  const aspect = (bounds.east - bounds.west) / (bounds.north - bounds.south);
  return aspect >= 4 / 3
    ? [1024, Math.max(1, Math.round(1024 / aspect))]
    : [Math.max(1, Math.round(768 * aspect)), 768];
}
