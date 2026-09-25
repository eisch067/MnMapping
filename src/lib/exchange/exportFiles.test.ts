// @vitest-environment jsdom
import { describe, expect, it } from "vitest";
import {
  createDefaultSettings,
  createFolder,
  createMyDataItem,
  type MyDataFolder,
  type MyGeometry,
  type MyMapItem,
} from "@/lib/myDataModel";
import {
  EXPORT_PART_ITEMS,
  buildExport,
  gpxAreaNotice,
  type ExportFile,
  type ExportFormat,
} from "./exportFiles";
import { parseImport } from "./importFile";

const now = () => new Date("2026-01-01T12:00:00.000Z");
const settings = createDefaultSettings(now, () => "id");
// Local time on purpose: filenames use the user's clock, not UTC.
const exportedAt = new Date(2026, 8, 23, 18, 41);

let counter = 0;
function item(overrides: {
  name?: string;
  note?: string;
  folderId?: string | null;
  geometry?: MyGeometry;
  deleted?: boolean;
}): MyMapItem {
  const created = createMyDataItem(
    {
      name: overrides.name ?? "Pin",
      note: overrides.note,
      folderId: overrides.folderId ?? null,
      geometry: overrides.geometry ?? { type: "Point", coordinates: [-95.5, 47.25] },
    },
    settings,
    now,
    () => `item-${++counter}`,
  );
  return overrides.deleted ? { ...created, deletion: { deletedAt: now().toISOString() } } : created;
}

function folder(name: string): MyDataFolder {
  return createFolder(name, [], now, () => `folder-${name}`);
}

const square: MyGeometry = {
  type: "Polygon",
  coordinates: [
    [
      [0, 0],
      [4, 0],
      [4, 4],
      [0, 0],
    ],
  ],
};
const trail: MyGeometry = {
  type: "LineString",
  coordinates: [
    [-95, 47],
    [-95.1, 47.1],
  ],
};

function build(
  format: ExportFormat,
  items: MyMapItem[],
  folders: MyDataFolder[] = [],
  scopeName = "Selection",
): ExportFile[] {
  return buildExport({ items, folders, scopeName, format, exportedAt });
}

function xml(file: ExportFile) {
  const document = new DOMParser().parseFromString(file.content, "application/xml");
  expect(document.getElementsByTagName("parsererror")).toHaveLength(0);
  return document;
}

describe("filenames", () => {
  it("names a file for its sanitized scope and the local time", () => {
    const [file] = build("kml", [item({})], [], "North 40 / hunting");
    expect(file?.filename).toBe("North-40-hunting_2026-09-23_1841.kml");
  });

  it("falls back to a generic name when nothing usable remains", () => {
    const [file] = build("gpx", [item({})], [], "///");
    expect(file?.filename).toBe("MnMapping_2026-09-23_1841.gpx");
  });

  it("uses the format's extension", () => {
    expect(build("geojson", [item({})])[0]?.filename).toMatch(/\.geojson$/);
    expect(build("gpx", [item({})])[0]?.filename).toMatch(/\.gpx$/);
  });
});

describe("KML", () => {
  it("writes name, optional note, geometry, closed rings, and 6 decimals", () => {
    const [file] = build("kml", [
      item({
        name: "Stand",
        note: "Big oak",
        geometry: { type: "Point", coordinates: [-95.5, 47.25] },
      }),
      item({ name: "Trail", geometry: trail }),
      item({
        name: "Field",
        geometry: {
          type: "Polygon",
          coordinates: [
            [
              [0, 0],
              [4, 0],
              [4, 4],
            ],
          ],
        },
      }),
    ]);
    const document = xml(file as ExportFile);
    const marks = Array.from(document.getElementsByTagName("Placemark"));
    expect(marks.map((mark) => mark.getElementsByTagName("name")[0]?.textContent)).toEqual([
      "Stand",
      "Trail",
      "Field",
    ]);
    expect(marks[0]?.getElementsByTagName("description")[0]?.textContent).toBe("Big oak");
    expect(marks[1]?.getElementsByTagName("description")).toHaveLength(0);
    expect(marks[0]?.getElementsByTagName("coordinates")[0]?.textContent).toBe(
      "-95.500000,47.250000",
    );
    expect(marks[2]?.getElementsByTagName("coordinates")[0]?.textContent).toBe(
      "0.000000,0.000000 4.000000,0.000000 4.000000,4.000000 0.000000,0.000000",
    );
    expect(file?.content).not.toMatch(/<Style/);
  });

  it("escapes names and notes as text and drops characters XML forbids", () => {
    const [file] = build("kml", [
      item({ name: `A & <B> "C"`, note: "x\u0000y</description><Point/>" }),
    ]);
    const document = xml(file as ExportFile);
    expect(document.getElementsByTagName("name")[1]?.textContent).toBe(`A & <B> "C"`);
    expect(document.getElementsByTagName("description")[0]?.textContent).toBe(
      "xy</description><Point/>",
    );
    expect(document.getElementsByTagName("Point")).toHaveLength(1);
  });

  it("names the Document for its folder", () => {
    const north = folder("North 40");
    const [file] = build("kml", [item({ folderId: north.id })], [north], "North 40");
    expect(xml(file as ExportFile).getElementsByTagName("name")[0]?.textContent).toBe("North 40");
  });

  it("names the Document for its folder even when the file is named for the selection", () => {
    const north = folder("North 40");
    const [file] = build("kml", [item({ folderId: north.id })], [north], "Selection");
    expect(file?.filename).toMatch(/^Selection_/);
    expect(xml(file as ExportFile).getElementsByTagName("name")[0]?.textContent).toBe("North 40");
  });

  it("never includes Trash", () => {
    const [file] = build("kml", [item({ name: "Keep" }), item({ name: "Gone", deleted: true })]);
    expect(file?.itemCount).toBe(1);
    expect(file?.content).not.toContain("Gone");
  });
});

describe("GPX", () => {
  it("writes pins as waypoints, lines as one track, areas as closed tracks", () => {
    const [file] = build("gpx", [
      item({
        name: "Camp",
        note: "Flat",
        geometry: { type: "Point", coordinates: [-95.5, 47.25] },
      }),
      item({ name: "Trail", geometry: trail }),
      item({
        name: "Field",
        geometry: {
          type: "Polygon",
          coordinates: [
            [
              [0, 0],
              [4, 0],
              [4, 4],
            ],
          ],
        },
      }),
    ]);
    const document = xml(file as ExportFile);
    const waypoint = document.getElementsByTagName("wpt")[0];
    expect(waypoint?.getAttribute("lat")).toBe("47.250000");
    expect(waypoint?.getAttribute("lon")).toBe("-95.500000");
    expect(waypoint?.getElementsByTagName("desc")[0]?.textContent).toBe("Flat");
    const tracks = Array.from(document.getElementsByTagName("trk"));
    expect(tracks.map((track) => track.getElementsByTagName("trkseg").length)).toEqual([1, 1]);
    const area = tracks[1]?.getElementsByTagName("trkpt") ?? [];
    expect(area).toHaveLength(4);
    expect(area[0]?.getAttribute("lat")).toBe(area[3]?.getAttribute("lat"));
    expect(area[0]?.getAttribute("lon")).toBe(area[3]?.getAttribute("lon"));
    expect(tracks[1]?.getElementsByTagName("name")[0]?.textContent).toBe("Field");
  });

  it("states how many areas become tracks", () => {
    expect(
      gpxAreaNotice([item({ geometry: square }), item({ geometry: square }), item({})]),
    ).toMatch(/2 areas.*closed tracks.*KML/);
    expect(gpxAreaNotice([item({ geometry: square })])).toMatch(/1 area\b.*closed track\b/);
    expect(gpxAreaNotice([item({}), item({ geometry: trail })])).toBeNull();
    expect(gpxAreaNotice([item({ geometry: square, deleted: true })])).toBeNull();
  });
});

describe("GeoJSON", () => {
  it("writes one file with folder name and a namespaced mnmapping object", () => {
    const north = folder("North 40");
    const files = build(
      "geojson",
      [
        item({ name: "Stand", note: "Oak", folderId: north.id }),
        item({ name: "Loose", geometry: trail }),
      ],
      [north],
    );
    expect(files).toHaveLength(1);
    const collection = JSON.parse(files[0]?.content ?? "");
    expect(collection.type).toBe("FeatureCollection");
    const [stand, loose] = collection.features;
    expect(stand.properties).toMatchObject({ name: "Stand", note: "Oak", folder: "North 40" });
    expect(stand.properties.mnmapping.appearance).toMatchObject({ kind: "point", symbolId: "pin" });
    expect(stand.properties.mnmapping).toHaveProperty("primaryDimension");
    expect(loose.properties.folder).toBe("Unfiled");
    expect(stand.geometry.coordinates).toEqual([-95.5, 47.25]);
  });

  it("never splits, even above the part limits", () => {
    const many = Array.from({ length: EXPORT_PART_ITEMS + 5 }, () => item({}));
    expect(build("geojson", many)).toHaveLength(1);
  });
});

describe("export parts", () => {
  const many = (count: number, folderId: string | null = null) =>
    Array.from({ length: count }, () => item({ folderId }));

  it("keeps a folder of exactly 3,000 items in one file", () => {
    const files = build("kml", many(EXPORT_PART_ITEMS));
    expect(files).toHaveLength(1);
    expect(files[0]?.filename).not.toMatch(/part/);
  });

  it("splits at 3,000 items and numbers the parts", () => {
    const files = build("gpx", many(EXPORT_PART_ITEMS * 2 + 1), [], "North 40");
    expect(files.map((file) => file.filename)).toEqual([
      "North-40_2026-09-23_1841_part-01-of-03.gpx",
      "North-40_2026-09-23_1841_part-02-of-03.gpx",
      "North-40_2026-09-23_1841_part-03-of-03.gpx",
    ]);
    expect(files.map((file) => file.itemCount)).toEqual([3000, 3000, 1]);
  });

  it("splits at 3.5 MB even below 3,000 items", () => {
    const big = Array.from({ length: 30 }, (_, index) =>
      item({ name: `N${index}`, note: "n".repeat(1_900) }),
    );
    const bulky = big.map((entry) => ({
      ...entry,
      geometry: {
        type: "LineString" as const,
        coordinates: Array.from({ length: 9_000 }, (_, index): [number, number] => [
          -95 + index * 0.0001,
          47,
        ]),
      },
    }));
    const files = build("kml", bulky);
    expect(files.length).toBeGreaterThan(1);
    for (const file of files) {
      expect(new TextEncoder().encode(file.content).byteLength).toBeLessThanOrEqual(
        3.5 * 1024 * 1024,
      );
    }
    expect(files.reduce((sum, file) => sum + file.itemCount, 0)).toBe(30);
  });

  it("makes separate files per folder and never splits across folders", () => {
    const a = folder("Alpha");
    const b = folder("Beta");
    const files = build("kml", [...many(2, a.id), ...many(1, b.id), ...many(1)], [a, b]);
    expect(files.map((file) => file.filename)).toEqual([
      "Unfiled_2026-09-23_1841.kml",
      "Alpha_2026-09-23_1841.kml",
      "Beta_2026-09-23_1841.kml",
    ]);
    expect(files.map((file) => file.itemCount)).toEqual([1, 2, 1]);
  });

  it("numbers each folder's parts on their own", () => {
    const a = folder("Alpha");
    const b = folder("Beta");
    const files = build("kml", [...many(EXPORT_PART_ITEMS + 1, a.id), ...many(1, b.id)], [a, b]);
    expect(files.map((file) => file.filename)).toEqual([
      "Alpha_2026-09-23_1841_part-01-of-02.kml",
      "Alpha_2026-09-23_1841_part-02-of-02.kml",
      "Beta_2026-09-23_1841.kml",
    ]);
  });

  it("keeps filenames unique when folder names sanitize alike", () => {
    const a = folder("Deer Stand");
    const b = folder("Deer-Stand");
    const files = build("kml", [...many(1, a.id), ...many(1, b.id)], [a, b]);
    expect(new Set(files.map((file) => file.filename)).size).toBe(2);
  });
});

describe("round trip through the importer", () => {
  it.each<ExportFormat>(["kml", "gpx", "geojson"])("re-imports its own %s", (format) => {
    const items = [
      item({
        name: "Camp",
        note: "Flat & dry",
        geometry: { type: "Point", coordinates: [-95.5, 47.25] },
      }),
      item({ name: "Trail", geometry: trail }),
    ];
    const [file] = build(format, items);
    const outcome = parseImport({
      name: file?.filename ?? "",
      size: file?.content.length ?? 0,
      text: file?.content ?? "",
    });
    if (!outcome.ok) throw new Error(outcome.message);
    expect(outcome.items.map((entry) => [entry.name, entry.geometry])).toEqual(
      items.map((entry) => [entry.name, entry.geometry]),
    );
    expect(outcome.items[0]?.note).toBe("Flat & dry");
  });
});
