import { describe, expect, it } from "vitest";
import {
  createDefaultSettings,
  createFolder,
  createMyDataItem,
  generatedItemName,
  isTrashExpired,
  MAX_NOTE_LENGTH,
  normalizeFolderName,
  restoreFolderBundle,
  restoreItem,
  trashFolderBundle,
  type IdFactory,
  type MyGeometry,
} from "./myDataModel";
import { builtInSymbol, fallbackSymbol } from "./myDataSymbols";

const now = () => new Date("2026-01-01T12:00:00.000Z");
function ids(): IdFactory {
  let value = 0;
  return () => `id-${++value}`;
}

describe("folder names", () => {
  it("trims names and enforces case-folded uniqueness", () => {
    const idFactory = ids();
    const first = createFolder("  Hunting Spots  ", [], now, idFactory);
    expect(first.name).toBe("Hunting Spots");
    expect(normalizeFolderName(" HUNTING SPOTS ")).toBe("hunting spots");
    expect(() => createFolder("hunting spots", [first], now, idFactory)).toThrow(/unique/i);
    expect(() => createFolder("   ", [], now, idFactory)).toThrow(/blank/i);
  });
});

describe("generated item names", () => {
  const cases: [MyGeometry, string][] = [
    [{ type: "Point", coordinates: [0, 0] }, "Pin"],
    [{ type: "LineString", coordinates: [[0, 0], [1, 1]] }, "Line"],
    [{ type: "Polygon", coordinates: [[[0, 0], [1, 0], [0, 0]]] }, "Polygon"],
  ];

  it.each(cases)("names unnamed geometry", (geometry, expected) => {
    expect(generatedItemName(geometry)).toBe(expected);
    const item = createMyDataItem(
      { name: "  ", geometry },
      createDefaultSettings(now, ids()),
      now,
      ids(),
    );
    expect(item.name).toBe(expected);
  });
});

describe("folder bundles and restore", () => {
  it("trashes a folder and its items as one bundle, then restores only that bundle", () => {
    const idFactory = ids();
    const settings = createDefaultSettings(now, idFactory);
    const folder = createFolder("Cabins", [], now, idFactory);
    const bundled = createMyDataItem(
      { folderId: folder.id, geometry: { type: "Point", coordinates: [0, 0] } },
      settings,
      now,
      idFactory,
    );
    const separatelyDeleted = { ...bundled, id: "separate", deletion: { deletedAt: now().toISOString() } };
    const trashed = trashFolderBundle(folder, [bundled, separatelyDeleted], now, idFactory);
    expect(trashed.items).toHaveLength(1);
    expect(trashed.items[0].deletion?.bundleId).toBe(trashed.folder.deletion?.bundleId);

    const collision = createFolder("cabins", [], now, idFactory);
    const restored = restoreFolderBundle(
      trashed.folder,
      [...trashed.items, separatelyDeleted],
      [trashed.folder, collision],
      now,
      idFactory,
    );
    expect(restored.folder.name).toBe("Cabins (restored)");
    expect(restored.items.map((item) => item.id)).toEqual([bundled.id]);
  });

  it("restores an item to Unfiled while its folder remains trashed", () => {
    const idFactory = ids();
    const folder = createFolder("Trips", [], now, idFactory);
    const settings = createDefaultSettings(now, idFactory);
    const item = createMyDataItem(
      { folderId: folder.id, geometry: { type: "Point", coordinates: [0, 0] } },
      settings,
      now,
      idFactory,
    );
    const trashed = trashFolderBundle(folder, [item], now, idFactory);
    const restored = restoreItem(trashed.items[0], [trashed.folder], now, idFactory);
    expect(restored.folderId).toBeNull();
    expect(restored.deletion).toBeUndefined();
  });
});

describe("Trash expiry", () => {
  const deletedAt = "2026-01-01T00:00:00.000Z";

  it("keeps content through day 29", () => {
    expect(isTrashExpired(deletedAt, () => new Date("2026-01-30T23:59:59.999Z"))).toBe(false);
  });

  it("expires content at day 30", () => {
    expect(isTrashExpired(deletedAt, () => new Date("2026-01-31T00:00:00.000Z"))).toBe(true);
  });
});

describe("built-in symbols", () => {
  it("keeps stable ids and falls back visually without discarding the saved id", () => {
    expect(builtInSymbol("star").id).toBe("star");
    expect(builtInSymbol("future-symbol")).toBe(fallbackSymbol);
  });
});

describe("note length", () => {
  it("caps typed notes at 2,000 characters", () => {
    const item = createMyDataItem(
      { note: "n".repeat(MAX_NOTE_LENGTH + 50), geometry: { type: "Point", coordinates: [0, 0] } },
      createDefaultSettings(now, ids()),
      now,
      ids(),
    );
    expect(item.note).toHaveLength(2_000);
  });
});
