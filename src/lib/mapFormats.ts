import type { MyMapItem } from "./myData";
import { toGeoJson } from "./myData";

export function exportText(items: readonly MyMapItem[], format: "geojson" | "kml" | "gpx"): string {
  if (format === "geojson") return JSON.stringify(toGeoJson(items), null, 2);
  if (format === "kml") return `<?xml version="1.0"?><kml xmlns="http://www.opengis.net/kml/2.2"><Document>${items.map(kmlItem).join("")}</Document></kml>`;
  return `<?xml version="1.0"?><gpx version="1.1" creator="MnMapping" xmlns="http://www.topografix.com/GPX/1/1">${items.map(gpxItem).join("")}</gpx>`;
}

export function parseMapFile(text: string, extension: string): MyMapItem[] {
  if (extension === "geojson" || extension === "json") {
    const value = JSON.parse(text) as { features?: Array<{ properties?: { name?: string; note?: string }; geometry: MyMapItem["geometry"] }> };
    return (value.features ?? []).map((feature, index) => item(feature.geometry, feature.properties?.name ?? `Imported ${index + 1}`, feature.properties?.note));
  }
  const document = new DOMParser().parseFromString(text, "application/xml");
  if (extension === "gpx") {
    const points = [...document.querySelectorAll("wpt")].map((node, index) => item({ type: "Point", coordinates: [Number(node.getAttribute("lon")), Number(node.getAttribute("lat"))] }, node.querySelector("name")?.textContent ?? `Waypoint ${index + 1}`, node.querySelector("desc")?.textContent ?? undefined));
    const tracks = [...document.querySelectorAll("trk")].map((node, index) => item({ type: "LineString", coordinates: [...node.querySelectorAll("trkpt")].map((point) => [Number(point.getAttribute("lon")), Number(point.getAttribute("lat"))]) }, node.querySelector("name")?.textContent ?? `Track ${index + 1}`));
    return [...points, ...tracks];
  }
  return [...document.querySelectorAll("Placemark")].flatMap((node, index) => {
    const coordinateText = node.querySelector("coordinates")?.textContent?.trim();
    if (!coordinateText) return [];
    const coordinates = coordinateText.split(/\s+/).map((coordinate) => coordinate.split(",").slice(0, 2).map(Number) as [number, number]);
    const geometry = node.querySelector("Point") ? { type: "Point" as const, coordinates: coordinates[0] } : node.querySelector("Polygon") ? { type: "Polygon" as const, coordinates: [coordinates] } : { type: "LineString" as const, coordinates };
    return [item(geometry, node.querySelector("name")?.textContent ?? `Imported ${index + 1}`, node.querySelector("description")?.textContent ?? undefined)];
  });
}

function item(geometry: MyMapItem["geometry"], name: string, note?: string): MyMapItem { return { id: crypto.randomUUID(), name, note, geometry, createdAt: new Date().toISOString() }; }
function xml(value?: string) { return (value ?? "").replace(/[&<>"']/g, (character) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&apos;" })[character]!); }
function coordinates(item: MyMapItem) { return item.geometry.type === "Point" ? [item.geometry.coordinates] : item.geometry.type === "Polygon" ? item.geometry.coordinates[0] : item.geometry.coordinates; }
function kmlItem(item: MyMapItem) {
  const values = coordinates(item).map((point) => `${point[0]},${point[1]}`).join(" ");
  const geometry = item.geometry.type === "Point"
    ? `<Point><coordinates>${values}</coordinates></Point>`
    : item.geometry.type === "Polygon"
      ? `<Polygon><outerBoundaryIs><LinearRing><coordinates>${values}</coordinates></LinearRing></outerBoundaryIs></Polygon>`
      : `<LineString><coordinates>${values}</coordinates></LineString>`;
  return `<Placemark><name>${xml(item.name)}</name><description>${xml(item.note)}</description>${geometry}</Placemark>`;
}
function gpxItem(item: MyMapItem) { if (item.geometry.type === "Point") return `<wpt lat="${item.geometry.coordinates[1]}" lon="${item.geometry.coordinates[0]}"><name>${xml(item.name)}</name><desc>${xml(item.note)}</desc></wpt>`; return `<trk><name>${xml(item.name)}</name><trkseg>${coordinates(item).map((point) => `<trkpt lat="${point[1]}" lon="${point[0]}"/>`).join("")}</trkseg></trk>`; }
