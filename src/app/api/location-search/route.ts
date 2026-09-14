import type { MapLocation, LocationKind } from "@/lib/location";
import { isInMinnesota } from "@/lib/location";

const geocoderRoot = "https://geocode.arcgis.com/arcgis/rest/services/World/GeocodeServer";

interface CandidateResponse {
  candidates?: Array<{
    address: string;
    location: { x: number; y: number };
    score: number;
    attributes: Record<string, string>;
  }>;
  error?: { message?: string };
}

interface ReverseResponse {
  address?: Record<string, string>;
  location?: { x: number; y: number };
  error?: { message?: string };
}

export async function GET(request: Request) {
  const params = new URL(request.url).searchParams;
  const query = params.get("q")?.trim();
  const latitude = Number(params.get("lat"));
  const longitude = Number(params.get("lon"));

  try {
    if (query) {
      if (query.length > 160) return Response.json({ error: "Location query is too long." }, { status: 400 });
      return Response.json({ results: await searchLocations(query) });
    }
    if (Number.isFinite(latitude) && Number.isFinite(longitude)) {
      if (!isInMinnesota(latitude, longitude)) {
        return Response.json({ error: "Choose a location within Minnesota." }, { status: 400 });
      }
      const result = await reverseLocation(latitude, longitude);
      if (!result) return Response.json({ error: "Choose a location within Minnesota." }, { status: 400 });
      return Response.json({ results: [result] });
    }
    return Response.json({ error: "Enter a location or provide a latitude and longitude." }, { status: 400 });
  } catch {
    return Response.json({ error: "The location service is temporarily unavailable." }, { status: 502 });
  }
}

async function searchLocations(query: string): Promise<MapLocation[]> {
  const url = new URL(`${geocoderRoot}/findAddressCandidates`);
  url.searchParams.set("SingleLine", query);
  url.searchParams.set("searchExtent", "-97.38,43.37,-89.33,49.4");
  url.searchParams.set("outFields", "PlaceName,Type,City,Subregion,Region,RegionAbbr,Postal");
  url.searchParams.set("maxLocations", "8");
  url.searchParams.set("outSR", "4326");
  url.searchParams.set("f", "json");

  const response = await fetch(url, { cache: "no-store", signal: AbortSignal.timeout(8_000) });
  if (!response.ok) throw new Error("Geocoder request failed.");
  const data = await response.json() as CandidateResponse;
  if (data.error) throw new Error(data.error.message ?? "Geocoder returned an error.");

  const seen = new Set<string>();
  return (data.candidates ?? [])
    .filter((candidate) => candidate.score >= 75)
    .filter((candidate) => candidate.attributes.RegionAbbr === "MN" || candidate.attributes.Region === "Minnesota")
    .filter((candidate) => isInMinnesota(candidate.location.y, candidate.location.x))
    .map((candidate) => candidateToLocation(candidate))
    .filter((location) => {
      const key = `${location.label.toLowerCase()}|${location.county?.toLowerCase() ?? ""}`;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    })
    .slice(0, 6);
}

async function reverseLocation(latitude: number, longitude: number): Promise<MapLocation | null> {
  const url = new URL(`${geocoderRoot}/reverseGeocode`);
  url.searchParams.set("location", `${longitude},${latitude}`);
  url.searchParams.set("outSR", "4326");
  url.searchParams.set("f", "json");
  const response = await fetch(url, { cache: "no-store", signal: AbortSignal.timeout(8_000) });
  if (!response.ok) throw new Error("Reverse geocoder request failed.");
  const data = await response.json() as ReverseResponse;
  if (data.error) throw new Error(data.error.message ?? "Reverse geocoder returned an error.");
  const address = data.address ?? {};
  if (address.RegionAbbr !== "MN" && address.Region !== "Minnesota") return null;
  const location = data.location ?? { x: longitude, y: latitude };
  return {
    id: `${location.y.toFixed(6)},${location.x.toFixed(6)}`,
    label: address.LongLabel || address.Match_addr || `${latitude.toFixed(5)}, ${longitude.toFixed(5)}`,
    latitude: location.y,
    longitude: location.x,
    county: address.Subregion,
    kind: kindFromType(address.Type || address.Addr_type),
  };
}

function candidateToLocation(candidate: NonNullable<CandidateResponse["candidates"]>[number]): MapLocation {
  return {
    id: `${candidate.location.y.toFixed(6)},${candidate.location.x.toFixed(6)}`,
    label: candidate.address,
    latitude: candidate.location.y,
    longitude: candidate.location.x,
    county: candidate.attributes.Subregion,
    kind: kindFromType(candidate.attributes.Type),
  };
}

function kindFromType(type = ""): LocationKind {
  const normalized = type.toLowerCase();
  if (normalized.includes("county")) return "county";
  if (normalized.includes("city") || normalized.includes("locality")) return "city";
  if (normalized.includes("address") || normalized.includes("street")) return "address";
  return "place";
}
