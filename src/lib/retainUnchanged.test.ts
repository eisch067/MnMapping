import { describe, expect, it } from "vitest";
import { retainUnchanged } from "./retainUnchanged";

describe("retainUnchanged", () => {
  it("keeps the previous list when refreshed records are unchanged", () => {
    const previous = [{ id: "item-1", geometry: { type: "Point", coordinates: [-95, 47] } }];
    const refreshed = [{ id: "item-1", geometry: { type: "Point", coordinates: [-95, 47] } }];

    expect(retainUnchanged(previous, refreshed)).toBe(previous);
  });

  it("keeps the previous list when equivalent records have different key order", () => {
    const previous = [{ id: "item-1", name: "Pin", geometry: { type: "Point", coordinates: [-95, 47] } }];
    const refreshed = [{ geometry: { coordinates: [-95, 47], type: "Point" }, name: "Pin", id: "item-1" }];

    expect(retainUnchanged(previous, refreshed)).toBe(previous);
  });

  it("returns a new list when a record changes", () => {
    const previous = [{ id: "item-1", name: "Old name" }];
    const refreshed = [{ id: "item-1", name: "Updated name" }];

    expect(retainUnchanged(previous, refreshed)).toBe(refreshed);
  });

  it("returns a new list when records are added or removed", () => {
    const previous = [{ id: "item-1" }];
    const refreshed = [{ id: "item-1" }, { id: "item-2" }];

    expect(retainUnchanged(previous, refreshed)).toBe(refreshed);
  });
});
