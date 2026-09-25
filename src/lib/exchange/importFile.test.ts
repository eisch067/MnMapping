// @vitest-environment jsdom
import { describe, expect, it } from "vitest";
import { MAX_IMPORT_BYTES, MAX_IMPORT_ITEMS, MAX_ITEM_VERTICES, parseImport } from "./importFile";

function file(name: string, text: string, size = text.length) {
  return { name, text, size };
}

function geojson(...geometries: unknown[]) {
  return JSON.stringify({
    type: "FeatureCollection",
    features: geometries.map((geometry, index) => ({
      type: "Feature",
      properties: { name: `Feature ${index + 1}` },
      geometry,
    })),
  });
}

function parsed(name: string, text: string) {
  const outcome = parseImport(file(name, text));
  if (!outcome.ok) throw new Error(`Expected an import, got refusal: ${outcome.message}`);
  return outcome;
}

const gpx = (body: string) =>
  `<?xml version="1.0"?><gpx version="1.1" creator="t" xmlns="http://www.topografix.com/GPX/1/1">${body}</gpx>`;
const kml = (body: string) =>
  `<?xml version="1.0"?><kml xmlns="http://www.opengis.net/kml/2.2"><Document>${body}</Document></kml>`;

describe("accepted files", () => {
  it("accepts GPX, KML, GeoJSON, and .json", () => {
    expect(parseImport(file("a.gpx", gpx(""))).ok).toBe(true);
    expect(parseImport(file("a.kml", kml(""))).ok).toBe(true);
    expect(parseImport(file("a.geojson", geojson())).ok).toBe(true);
    expect(parseImport(file("A.JSON", geojson())).ok).toBe(true);
  });

  it("refuses KMZ and points to KML", () => {
    const outcome = parseImport(file("trip.kmz", "PK"));
    expect(outcome).toEqual({ ok: false, message: expect.stringMatching(/export.*as KML instead/i) });
  });

  it("refuses other file types without reading them", () => {
    const outcome = parseImport(file("trip.shp", "x"));
    expect(outcome).toEqual({ ok: false, message: expect.stringMatching(/GPX, KML, or GeoJSON/) });
  });

  it("refuses malformed files with a plain message", () => {
    for (const bad of [file("a.geojson", "{nope"), file("a.kml", "<kml><Placemark>"), file("a.gpx", "hello")]) {
      const outcome = parseImport(bad);
      expect(outcome.ok).toBe(false);
    }
  });

  it("refuses XML whose root is the wrong format", () => {
    expect(parseImport(file("a.gpx", kml(""))).ok).toBe(false);
    expect(parseImport(file("a.kml", gpx(""))).ok).toBe(false);
  });
});

describe("limits", () => {
  it("refuses a file over 10 MB using its size, before parsing", () => {
    const outcome = parseImport(file("big.geojson", "{nope", MAX_IMPORT_BYTES + 1));
    expect(outcome).toEqual({ ok: false, message: expect.stringMatching(/10 MB/) });
  });

  it("accepts a file of exactly 10 MB", () => {
    expect(parseImport(file("edge.geojson", geojson(), MAX_IMPORT_BYTES)).ok).toBe(true);
  });

  it("refuses more than 5,000 items and imports nothing", () => {
    const point = { type: "Point", coordinates: [-95, 47] };
    const many = Array.from({ length: MAX_IMPORT_ITEMS + 1 }, () => point);
    const outcome = parseImport(file("many.geojson", geojson(...many)));
    expect(outcome).toEqual({ ok: false, message: expect.stringMatching(/5,000/) });
  });

  it("accepts exactly 5,000 items", () => {
    const point = { type: "Point", coordinates: [-95, 47] };
    const many = Array.from({ length: MAX_IMPORT_ITEMS }, () => point);
    expect(parsed("many.geojson", geojson(...many)).items).toHaveLength(MAX_IMPORT_ITEMS);
  });

  it("simplifies an item over 20,000 vertices to fit and warns", () => {
    const wiggle = Array.from({ length: 30_000 }, (_, index) => [
      -95 + index * 0.0001,
      47 + Math.sin(index / 50) * 0.01,
    ]);
    const outcome = parsed("long.geojson", geojson({ type: "LineString", coordinates: wiggle }));
    const [item] = outcome.items;
    expect(item?.geometry.type).toBe("LineString");
    const vertices = item?.geometry.type === "LineString" ? item.geometry.coordinates : [];
    expect(vertices.length).toBeLessThanOrEqual(MAX_ITEM_VERTICES);
    expect(vertices.length).toBeGreaterThan(MAX_ITEM_VERTICES / 2);
    expect(vertices[0]).toEqual(wiggle[0]);
    expect(vertices.at(-1)).toEqual(wiggle.at(-1));
    expect(outcome.report.warnings.simplified).toBe(1);
    expect(outcome.report.rejected).toEqual([]);
  });

  it("leaves an item at exactly 20,000 vertices untouched", () => {
    const line = Array.from({ length: MAX_ITEM_VERTICES }, (_, index) => [-95 + index * 0.0001, 47]);
    const outcome = parsed("edge.geojson", geojson({ type: "LineString", coordinates: line }));
    expect(outcome.report.warnings.simplified).toBe(0);
  });

  it("keeps a simplified polygon closed within the vertex cap", () => {
    const ring = Array.from({ length: 25_000 }, (_, index) => {
      const angle = (index / 25_000) * Math.PI * 2;
      return [-95 + Math.cos(angle) * 0.1, 47 + Math.sin(angle) * 0.1];
    });
    ring.push(ring[0] as number[]);
    const outcome = parsed("ring.geojson", geojson({ type: "Polygon", coordinates: [ring] }));
    const geometry = outcome.items[0]?.geometry;
    if (geometry?.type !== "Polygon") throw new Error("expected a polygon");
    const outer = geometry.coordinates[0] ?? [];
    expect(outer.length).toBeLessThanOrEqual(MAX_ITEM_VERTICES);
    expect(outer[0]).toEqual(outer.at(-1));
    expect(outcome.report.warnings.simplified).toBe(1);
  });
});

describe("geometry normalization", () => {
  it("splits multi-part geometry into numbered items", () => {
    const outcome = parsed("multi.geojson", geojson({
      type: "MultiPoint",
      coordinates: [[-95, 47], [-94, 46], [-93, 45]],
    }));
    expect(outcome.items.map((item) => item.name)).toEqual(["Feature 1", "Feature 1 (2)", "Feature 1 (3)"]);
    expect(outcome.report.warnings.multiPartSplit).toBe(1);
  });

  it("splits MultiPolygon and MultiLineString and GeometryCollection", () => {
    const square = [[[0, 0], [1, 0], [1, 1], [0, 0]]];
    const outcome = parsed("multi.geojson", geojson(
      { type: "MultiPolygon", coordinates: [square, square] },
      { type: "MultiLineString", coordinates: [[[0, 0], [1, 1]], [[2, 2], [3, 3]]] },
      { type: "GeometryCollection", geometries: [{ type: "Point", coordinates: [0, 0] }, { type: "LineString", coordinates: [[0, 0], [1, 1]] }] },
    ));
    expect(outcome.items).toHaveLength(6);
    expect(outcome.report.warnings.multiPartSplit).toBe(3);
  });

  it("drops polygon holes and counts them", () => {
    const outer = [[0, 0], [4, 0], [4, 4], [0, 4], [0, 0]];
    const hole = [[1, 1], [2, 1], [2, 2], [1, 1]];
    const outcome = parsed("holes.geojson", geojson({ type: "Polygon", coordinates: [outer, hole, hole] }));
    expect(outcome.items[0]?.geometry).toEqual({ type: "Polygon", coordinates: [outer] });
    expect(outcome.report.warnings.holesRemoved).toBe(2);
  });

  it("closes an unclosed ring", () => {
    const outcome = parsed("open.geojson", geojson({
      type: "Polygon",
      coordinates: [[[0, 0], [4, 0], [4, 4]]],
    }));
    expect(outcome.items[0]?.geometry).toEqual({
      type: "Polygon",
      coordinates: [[[0, 0], [4, 0], [4, 4], [0, 0]]],
    });
  });

  it("keeps a closed line as a line", () => {
    const closed = [[0, 0], [1, 0], [1, 1], [0, 0]];
    const outcome = parsed("loop.geojson", geojson({ type: "LineString", coordinates: closed }));
    expect(outcome.items[0]?.geometry).toEqual({ type: "LineString", coordinates: closed });
  });

  it("discards altitude", () => {
    const outcome = parsed("alt.geojson", geojson(
      { type: "Point", coordinates: [-95, 47, 350] },
      { type: "LineString", coordinates: [[0, 0, 5], [1, 1, 6]] },
    ));
    expect(outcome.items[0]?.geometry).toEqual({ type: "Point", coordinates: [-95, 47] });
    expect(outcome.items[1]?.geometry).toEqual({ type: "LineString", coordinates: [[0, 0], [1, 1]] });
  });

  it("accepts any valid WGS 84 coordinate, not only Minnesota", () => {
    const outcome = parsed("world.geojson", geojson({ type: "Point", coordinates: [151.2, -33.9] }));
    expect(outcome.items).toHaveLength(1);
  });
});

describe("rejected items", () => {
  it("rejects out-of-range and non-finite coordinates with reasons", () => {
    const outcome = parsed("bad.geojson", geojson(
      { type: "Point", coordinates: [200, 47] },
      { type: "Point", coordinates: [-95, 91] },
      { type: "Point", coordinates: [-95, null] },
      { type: "Point", coordinates: [-95, 47] },
    ));
    expect(outcome.items.map((item) => item.name)).toEqual(["Feature 4"]);
    expect(outcome.report.rejected.map((entry) => entry.name)).toEqual(["Feature 1", "Feature 2", "Feature 3"]);
    expect(outcome.report.rejected[0]?.reason).toMatch(/longitude/i);
    expect(outcome.report.rejected[1]?.reason).toMatch(/latitude/i);
    expect(outcome.report.rejected[2]?.reason).toMatch(/coordinate/i);
  });

  it("rejects lines with fewer than 2 distinct points", () => {
    const outcome = parsed("lines.geojson", geojson(
      { type: "LineString", coordinates: [[1, 1]] },
      { type: "LineString", coordinates: [[1, 1], [1, 1]] },
    ));
    expect(outcome.items).toEqual([]);
    expect(outcome.report.rejected).toHaveLength(2);
    expect(outcome.report.rejected[0]?.reason).toMatch(/2 distinct points/);
  });

  it("rejects polygons with fewer than 3 distinct vertices", () => {
    const outcome = parsed("polys.geojson", geojson({
      type: "Polygon",
      coordinates: [[[0, 0], [1, 1], [0, 0]]],
    }));
    expect(outcome.items).toEqual([]);
    expect(outcome.report.rejected[0]?.reason).toMatch(/3 distinct vertices/);
  });

  it("returns no items and no error when nothing is valid", () => {
    const outcome = parsed("none.geojson", geojson({ type: "Point", coordinates: [500, 500] }));
    expect(outcome.items).toEqual([]);
    expect(outcome.report.rejected).toHaveLength(1);
  });
});

describe("notes", () => {
  it("strips tags, decodes entities, and caps at 2,000 characters", () => {
    const note = `<p>Hello &amp; <b>welcome</b></p>${"x".repeat(2_500)}`;
    const outcome = parsed("n.geojson", JSON.stringify({
      type: "Feature",
      properties: { name: "N", description: note },
      geometry: { type: "Point", coordinates: [0, 0] },
    }));
    const text = outcome.items[0]?.note ?? "";
    expect(text.startsWith("Hello & welcome")).toBe(true);
    expect(text).toHaveLength(2_000);
    expect(outcome.report.warnings.notesTruncated).toBe(1);
  });

  it("leaves an absent note absent", () => {
    const outcome = parsed("n.geojson", geojson({ type: "Point", coordinates: [0, 0] }));
    expect(outcome.items[0]?.note).toBeUndefined();
  });

  it("ignores the mnmapping archive properties in GeoJSON", () => {
    const outcome = parsed("n.geojson", JSON.stringify({
      type: "Feature",
      properties: { name: "N", mnmapping: { appearance: { kind: "point", symbolId: "x", color: "#000" } } },
      geometry: { type: "Point", coordinates: [0, 0] },
    }));
    expect(Object.keys(outcome.items[0] ?? {}).sort()).toEqual(["geometry", "name", "note"].sort());
  });
});

describe("KML", () => {
  it("reads points, lines, polygons, names, and notes", () => {
    const outcome = parsed("t.kml", kml(`
      <Placemark><name>Stand</name><description><![CDATA[<b>Big</b> oak &amp; birch]]></description>
        <Point><coordinates>-95.5,47.25,300</coordinates></Point></Placemark>
      <Placemark><name>Trail</name><LineString><coordinates>-95,47,0 -95.1,47.1,0</coordinates></LineString></Placemark>
      <Placemark><name>Field</name><Polygon><outerBoundaryIs><LinearRing><coordinates>
        0,0 4,0 4,4 0,0</coordinates></LinearRing></outerBoundaryIs></Polygon></Placemark>`));
    expect(outcome.items).toEqual([
      { name: "Stand", note: "Big oak & birch", geometry: { type: "Point", coordinates: [-95.5, 47.25] } },
      { name: "Trail", note: undefined, geometry: { type: "LineString", coordinates: [[-95, 47], [-95.1, 47.1]] } },
      { name: "Field", note: undefined, geometry: { type: "Polygon", coordinates: [[[0, 0], [4, 0], [4, 4], [0, 0]]] } },
    ]);
  });

  it("drops inner boundaries and splits MultiGeometry", () => {
    const outcome = parsed("t.kml", kml(`<Placemark><name>Both</name><MultiGeometry>
      <Point><coordinates>1,1</coordinates></Point>
      <Polygon><outerBoundaryIs><LinearRing><coordinates>0,0 4,0 4,4 0,0</coordinates></LinearRing></outerBoundaryIs>
        <innerBoundaryIs><LinearRing><coordinates>1,1 2,1 2,2 1,1</coordinates></LinearRing></innerBoundaryIs></Polygon>
      </MultiGeometry></Placemark>`));
    expect(outcome.items.map((item) => item.name)).toEqual(["Both", "Both (2)"]);
    expect(outcome.report.warnings.holesRemoved).toBe(1);
    expect(outcome.report.warnings.multiPartSplit).toBe(1);
  });

  it("flattens folders into one list and counts them", () => {
    const outcome = parsed("t.kml", kml(`
      <Folder><name>A</name><Placemark><name>One</name><Point><coordinates>1,1</coordinates></Point></Placemark></Folder>
      <Folder><name>B</name><Folder><name>C</name>
        <Placemark><name>Two</name><Point><coordinates>2,2</coordinates></Point></Placemark></Folder></Folder>`));
    expect(outcome.items.map((item) => item.name)).toEqual(["One", "Two"]);
    expect(outcome.report.warnings.foldersFlattened).toBe(3);
  });

  it("skips and counts unsupported content", () => {
    const outcome = parsed("t.kml", kml(`
      <GroundOverlay><name>Map</name></GroundOverlay>
      <NetworkLink><name>Live</name></NetworkLink>
      <Placemark><name>Model</name><Model><Location><longitude>1</longitude></Location></Model></Placemark>
      <PhotoOverlay><name>Photo</name></PhotoOverlay>
      <Placemark xmlns:gx="http://www.google.com/kml/ext/2.2"><name>Track</name><gx:Track/></Placemark>
      <Placemark><name>Fine</name><Point><coordinates>1,1</coordinates></Point></Placemark>`));
    expect(outcome.items.map((item) => item.name)).toEqual(["Fine"]);
    expect(outcome.report.warnings.unsupportedSkipped).toBe(5);
    expect(outcome.report.rejected).toEqual([]);
  });

  it("ignores source styling", () => {
    const outcome = parsed("t.kml", kml(`<Style id="s"><IconStyle><color>ff0000ff</color></IconStyle></Style>
      <Placemark><styleUrl>#s</styleUrl><name>P</name><Point><coordinates>1,1</coordinates></Point></Placemark>`));
    expect(Object.keys(outcome.items[0] ?? {}).sort()).toEqual(["geometry", "name", "note"]);
  });

  it("rejects placemarks with invalid coordinates", () => {
    const outcome = parsed("t.kml", kml(`<Placemark><name>Bad</name><Point><coordinates>abc,47</coordinates></Point></Placemark>`));
    expect(outcome.report.rejected).toEqual([{ name: "Bad", reason: expect.stringMatching(/coordinate/i) }]);
  });
});

describe("GPX", () => {
  it("reads waypoints, routes, and tracks, discarding elevation and time", () => {
    const outcome = parsed("t.gpx", gpx(`
      <wpt lat="47.25" lon="-95.5"><ele>300</ele><time>2026-01-01T00:00:00Z</time><name>Camp</name><desc>Flat</desc></wpt>
      <rte><name>Route</name><rtept lat="47" lon="-95"/><rtept lat="47.1" lon="-95.1"/></rte>
      <trk><name>Track</name><trkseg><trkpt lat="1" lon="1"><time>x</time></trkpt><trkpt lat="2" lon="2"/></trkseg></trk>`));
    expect(outcome.items).toEqual([
      { name: "Camp", note: "Flat", geometry: { type: "Point", coordinates: [-95.5, 47.25] } },
      { name: "Route", note: undefined, geometry: { type: "LineString", coordinates: [[-95, 47], [-95.1, 47.1]] } },
      { name: "Track", note: undefined, geometry: { type: "LineString", coordinates: [[1, 1], [2, 2]] } },
    ]);
  });

  it("splits multi-segment tracks and keeps closed tracks as lines", () => {
    const outcome = parsed("t.gpx", gpx(`<trk><name>Loop</name>
      <trkseg><trkpt lat="0" lon="0"/><trkpt lat="0" lon="1"/><trkpt lat="1" lon="1"/><trkpt lat="0" lon="0"/></trkseg>
      <trkseg><trkpt lat="5" lon="5"/><trkpt lat="6" lon="6"/></trkseg></trk>`));
    expect(outcome.items.map((item) => item.name)).toEqual(["Loop", "Loop (2)"]);
    expect(outcome.items.every((item) => item.geometry.type === "LineString")).toBe(true);
    expect(outcome.report.warnings.multiPartSplit).toBe(1);
  });

  it("rejects out-of-range waypoints with a reason", () => {
    const outcome = parsed("t.gpx", gpx(`<wpt lat="95" lon="0"><name>Far</name></wpt>`));
    expect(outcome.report.rejected).toEqual([{ name: "Far", reason: expect.stringMatching(/latitude/i) }]);
  });
});
