import { describe, expect, it } from "vitest";
import {
  MY_DATA_SCHEMA_VERSION,
  createDefaultSettings,
  createFolder,
  createMyDataItem,
  reviseRecord,
  type MyDataFolder,
  type MyDataSnapshot,
  type MyMapItem,
} from "@/lib/myDataModel";
import { buildArchive, planRestore, type RestorePlan } from "./archive";

const now = () => new Date("2026-06-15T12:00:00.000Z");
const daysAgo = (days: number) => new Date(now().getTime() - days * 86_400_000).toISOString();

function ids(prefix: string) {
  let value = 0;
  return () => `${prefix}-${++value}`;
}

const emptyBase = (): MyDataSnapshot => ({
  items: [],
  folders: [],
  settings: createDefaultSettings(now, ids("s")),
});

function makeItem(id: string, folderId: string | null = null, name = id): MyMapItem {
  return createMyDataItem(
    { id, name, folderId, geometry: { type: "Point", coordinates: [-95, 47] } },
    createDefaultSettings(now, ids("x")),
    now,
    ids(`m-${id}`),
  );
}

function makeFolder(id: string, name: string): MyDataFolder {
  return { ...createFolder(name, [], now, ids(`f-${id}`)), id };
}

const trashed = (item: MyMapItem, days: number): MyMapItem => ({
  ...item,
  deletion: { deletedAt: daysAgo(days) },
});

function restore(archived: MyDataSnapshot, current: MyDataSnapshot): Extract<RestorePlan, { ok: true }> {
  const file = buildArchive(archived, new Date(2026, 5, 15, 7, 5));
  const plan = planRestore(file.content, current, now, ids("new"));
  if (!plan.ok) throw new Error(plan.message);
  return plan;
}

describe("archive file", () => {
  it("names the file for the local time and carries active and trashed data", () => {
    const north = makeFolder("north", "North");
    const gone = trashed(makeItem("gone"), 2);
    const file = buildArchive({ ...emptyBase(), items: [makeItem("a", north.id), gone], folders: [north] }, new Date(2026, 5, 15, 7, 5));
    expect(file.filename).toBe("MnMapping-archive_2026-06-15_0705.json");
    const body = JSON.parse(file.content);
    expect(body).toMatchObject({ format: "mnmapping-archive", schemaVersion: MY_DATA_SCHEMA_VERSION });
    expect(body.items.map((item: MyMapItem) => item.id)).toEqual(["a", "gone"]);
    expect(body.folders).toHaveLength(1);
    expect(body.settings.id).toBe("settings");
  });

  it("round-trips items exactly into an empty My Data, including import provenance", () => {
    const north = makeFolder("north", "North");
    const imported = {
      ...makeItem("a", north.id),
      importProvenance: { filename: "x.gpx", format: "gpx", importedAt: daysAgo(1), timezone: "America/Chicago" },
    };
    const plan = restore({ ...emptyBase(), items: [imported], folders: [north] }, emptyBase());
    expect(plan.foldersToAdd).toHaveLength(1);
    expect(plan.itemsToAdd).toHaveLength(1);
    const [item] = plan.itemsToAdd;
    expect(item).toMatchObject({
      id: "a",
      name: "a",
      geometry: imported.geometry,
      appearance: imported.appearance,
      importProvenance: imported.importProvenance,
      folderId: plan.foldersToAdd[0]?.id,
    });
    expect(plan.summary).toMatchObject({ itemsRestored: 1, foldersCreated: 1 });
  });
});

describe("additive restore", () => {
  it("leaves items already present untouched, even when they differ", () => {
    const current = { ...emptyBase(), items: [reviseRecord(makeItem("a"), { name: "Renamed here" })] };
    const plan = restore({ ...emptyBase(), items: [makeItem("a"), makeItem("b")] }, current);
    expect(plan.itemsToAdd.map((item) => item.id)).toEqual(["b"]);
    expect(plan.summary).toMatchObject({ itemsRestored: 1, alreadyPresent: 1 });
  });

  it("treats an item that is in Trash here as present", () => {
    const current = { ...emptyBase(), items: [trashed(makeItem("a"), 1)] };
    const plan = restore({ ...emptyBase(), items: [makeItem("a")] }, current);
    expect(plan.itemsToAdd).toEqual([]);
    expect(plan.summary.alreadyPresent).toBe(1);
  });

  it("matches folders by normalized name instead of duplicating them", () => {
    const here = makeFolder("here", "North 40");
    const there = makeFolder("there", "  north 40 ");
    const plan = restore(
      { ...emptyBase(), items: [makeItem("a", there.id)], folders: [there] },
      { ...emptyBase(), folders: [here] },
    );
    expect(plan.foldersToAdd).toEqual([]);
    expect(plan.itemsToAdd[0]?.folderId).toBe(here.id);
  });

  it("gives a created folder a fresh id when its id is already used by a trashed folder", () => {
    const clash = { ...makeFolder("same", "Old"), deletion: { deletedAt: daysAgo(1), bundleId: "b" } };
    const incoming = makeFolder("same", "Different");
    const plan = restore(
      { ...emptyBase(), items: [makeItem("a", incoming.id)], folders: [incoming] },
      { ...emptyBase(), folders: [clash] },
    );
    expect(plan.foldersToAdd).toHaveLength(1);
    expect(plan.foldersToAdd[0]?.id).not.toBe("same");
    expect(plan.itemsToAdd[0]?.folderId).toBe(plan.foldersToAdd[0]?.id);
  });

  it("returns trashed items to Trash with their original deletion dates", () => {
    const item = trashed(makeItem("a"), 10);
    const plan = restore({ ...emptyBase(), items: [item] }, emptyBase());
    expect(plan.itemsToAdd[0]?.deletion).toEqual(item.deletion);
    expect(plan.summary).toMatchObject({ trashRestored: 1, itemsRestored: 0 });
  });

  it("skips Trash whose 30 days have expired", () => {
    const plan = restore(
      { ...emptyBase(), items: [trashed(makeItem("old"), 31), trashed(makeItem("edge"), 30), trashed(makeItem("fresh"), 29)] },
      emptyBase(),
    );
    expect(plan.itemsToAdd.map((item) => item.id)).toEqual(["fresh"]);
    expect(plan.summary.expiredSkipped).toBe(2);
  });

  it("restores a trashed folder as trashed, and skips an expired one with its items", () => {
    const deletion = (days: number) => ({ deletedAt: daysAgo(days), bundleId: `b${days}` });
    const fresh = { ...makeFolder("fresh", "Fresh"), deletion: deletion(3) };
    const stale = { ...makeFolder("stale", "Stale"), deletion: deletion(40) };
    const freshItem = { ...makeItem("in-fresh", fresh.id), deletion: deletion(3) };
    const staleItem = { ...makeItem("in-stale", stale.id), deletion: deletion(40) };
    const plan = restore(
      { ...emptyBase(), items: [freshItem, staleItem], folders: [fresh, stale] },
      emptyBase(),
    );
    expect(plan.foldersToAdd.map((folder) => folder.name)).toEqual(["Fresh"]);
    expect(plan.foldersToAdd[0]?.deletion).toEqual(fresh.deletion);
    expect(plan.itemsToAdd.map((item) => item.id)).toEqual(["in-fresh"]);
  });

  it("files an item under Unfiled when its folder is not in the archive", () => {
    const plan = restore({ ...emptyBase(), items: [makeItem("a", "missing-folder")] }, emptyBase());
    expect(plan.itemsToAdd[0]?.folderId).toBeNull();
  });

  it("queues every recreated record for sync with a new mutation", () => {
    const north = makeFolder("north", "North");
    const item = makeItem("a", north.id);
    const plan = restore({ ...emptyBase(), items: [item], folders: [north] }, emptyBase());
    expect(plan.itemsToAdd[0]?.outbox.mutationId).not.toBe(item.outbox.mutationId);
    expect(plan.foldersToAdd[0]?.outbox.mutationId).not.toBe(north.outbox.mutationId);
    expect(plan.itemsToAdd[0]?.outbox.queuedAt).toBe(now().toISOString());
  });

  it("restoring the same archive twice adds nothing the second time", () => {
    const north = makeFolder("north", "North");
    const archived = { ...emptyBase(), items: [makeItem("a", north.id)], folders: [north] };
    const first = restore(archived, emptyBase());
    const after = { ...emptyBase(), items: first.itemsToAdd, folders: first.foldersToAdd };
    const second = restore(archived, after);
    expect(second.itemsToAdd).toEqual([]);
    expect(second.foldersToAdd).toEqual([]);
  });
});

describe("settings", () => {
  const custom = () => reviseRecord(emptyBase().settings, {
    point: { symbolId: "star", color: "#ff0000" },
  });

  it("applies archived settings when this My Data has never changed its own", () => {
    const plan = restore({ ...emptyBase(), settings: custom() }, emptyBase());
    expect(plan.settingsToApply?.point).toEqual({ symbolId: "star", color: "#ff0000" });
    expect(plan.summary.settingsApplied).toBe(true);
  });

  it("keeps settings the user has already changed", () => {
    const changed = reviseRecord(emptyBase().settings, { point: { symbolId: "flag", color: "#00ff00" } });
    const plan = restore({ ...emptyBase(), settings: custom() }, { ...emptyBase(), settings: changed });
    expect(plan.settingsToApply).toBeNull();
    expect(plan.summary.settingsApplied).toBe(false);
  });
});

describe("refusals", () => {
  const plan = (text: string) => planRestore(text, emptyBase(), now, ids("n"));

  it("refuses an archive from a newer schema with an update message", () => {
    const file = buildArchive(emptyBase(), now());
    const newer = JSON.stringify({ ...JSON.parse(file.content), schemaVersion: MY_DATA_SCHEMA_VERSION + 1 });
    expect(plan(newer)).toEqual({ ok: false, message: expect.stringMatching(/newer version.*update/i) });
  });

  it("refuses files that are not an archive", () => {
    expect(plan("not json").ok).toBe(false);
    expect(plan(JSON.stringify({ type: "FeatureCollection", features: [] })).ok).toBe(false);
    expect(plan(JSON.stringify({ format: "mnmapping-archive", schemaVersion: 2 })).ok).toBe(false);
  });

  it("refuses an archive whose items are damaged, changing nothing", () => {
    const file = buildArchive({ ...emptyBase(), items: [makeItem("a")] }, now());
    const body = JSON.parse(file.content);
    body.items[0].geometry = { type: "Circle" };
    expect(plan(JSON.stringify(body))).toEqual({ ok: false, message: expect.stringMatching(/damaged/i) });
  });
});
