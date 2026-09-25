import { describe, expect, it } from "vitest";
import type { MyDataFolder, MyGeometry, MyMapItem } from "@/lib/myDataModel";
import { countsByType, describeRestore, describeWarnings } from "./summaries";
import { resolveScope } from "./scope";

function item(id: string, name: string, folderId: string | null, deleted = false): MyMapItem {
  const partial: Partial<MyMapItem> = {
    id,
    name,
    folderId,
    geometry: { type: "Point", coordinates: [0, 0] },
    ...(deleted ? { deletion: { deletedAt: "2026-01-01T00:00:00.000Z" } } : {}),
  };
  return partial as MyMapItem;
}

function folder(id: string, name: string): MyDataFolder {
  const partial: Partial<MyDataFolder> = { id, name };
  return partial as MyDataFolder;
}

const none = {
  holesRemoved: 0,
  multiPartSplit: 0,
  simplified: 0,
  notesTruncated: 0,
  unsupportedSkipped: 0,
  foldersFlattened: 0,
};

describe("describeWarnings", () => {
  it("lists only what happened, with singular and plural forms", () => {
    expect(describeWarnings(none)).toEqual([]);
    expect(
      describeWarnings({ ...none, holesRemoved: 1, simplified: 2, foldersFlattened: 1 }),
    ).toEqual([
      "1 area hole removed.",
      "2 items simplified to fit 20,000 points.",
      "1 source folder flattened into this folder.",
    ]);
  });

  it("covers every warning kind", () => {
    const lines = describeWarnings({
      holesRemoved: 2,
      multiPartSplit: 3,
      simplified: 1,
      notesTruncated: 4,
      unsupportedSkipped: 5,
      foldersFlattened: 6,
    });
    expect(lines).toHaveLength(6);
    expect(lines.join(" ")).toMatch(/3 multi-part shapes split/);
    expect(lines.join(" ")).toMatch(/4 notes shortened to 2,000/);
    expect(lines.join(" ")).toMatch(/5 unsupported items skipped/);
  });
});

describe("countsByType", () => {
  it("counts pins, lines, and areas", () => {
    const point: MyGeometry = { type: "Point", coordinates: [0, 0] };
    const line: MyGeometry = {
      type: "LineString",
      coordinates: [
        [0, 0],
        [1, 1],
      ],
    };
    const area: MyGeometry = {
      type: "Polygon",
      coordinates: [
        [
          [0, 0],
          [1, 0],
          [1, 1],
          [0, 0],
        ],
      ],
    };
    expect(countsByType([point, point, line, area])).toEqual({ pins: 2, lines: 1, areas: 1 });
  });
});

describe("describeRestore", () => {
  it("summarizes what was recreated and what was left alone", () => {
    const lines = describeRestore({
      itemsRestored: 3,
      trashRestored: 1,
      alreadyPresent: 2,
      expiredSkipped: 1,
      foldersCreated: 1,
      settingsApplied: true,
    });
    expect(lines).toEqual([
      "3 items restored.",
      "1 item returned to Trash.",
      "2 items were already here and were left unchanged.",
      "1 expired Trash item was skipped.",
      "1 folder created.",
      "Your default settings were restored.",
    ]);
  });

  it("says so when there was nothing to add", () => {
    expect(
      describeRestore({
        itemsRestored: 0,
        trashRestored: 0,
        alreadyPresent: 0,
        expiredSkipped: 0,
        foldersCreated: 0,
        settingsApplied: false,
      }),
    ).toEqual(["Nothing was missing, so nothing changed."]);
  });
});

describe("resolveScope", () => {
  const north = folder("f1", "North 40");
  const items = [item("a", "Stand", "f1"), item("b", "Loose", null), item("c", "Trailhead", "f1")];

  it("resolves a folder, Unfiled, a selection, and everything", () => {
    expect(resolveScope({ kind: "folder", folderId: "f1" }, items, [north])).toMatchObject({
      name: "North 40",
      label: "North 40 (2 items)",
    });
    expect(
      resolveScope({ kind: "folder", folderId: null }, items, [north]).items.map(
        (entry) => entry.id,
      ),
    ).toEqual(["b"]);
    expect(resolveScope({ kind: "selection", itemIds: ["a", "b"] }, items, [north])).toMatchObject({
      name: "Selection",
      label: "2 selected items",
    });
    expect(resolveScope({ kind: "all" }, items, [north])).toMatchObject({
      name: "My Data",
      label: "All My Data (3 items)",
    });
  });

  it("names a single selected item for itself and ignores ids that are gone", () => {
    const one = resolveScope({ kind: "selection", itemIds: ["a", "vanished"] }, items, [north]);
    expect(one).toMatchObject({ name: "Stand", label: "Stand" });
    expect(one.items).toHaveLength(1);
  });

  it("leaves Trash out", () => {
    const withTrash = [...items, item("t", "Gone", null, true)];
    expect(resolveScope({ kind: "all" }, withTrash, [north]).items).toHaveLength(3);
  });
});
