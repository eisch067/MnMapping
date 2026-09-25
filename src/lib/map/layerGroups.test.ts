import { describe, expect, it } from "vitest";
import {
  forgetSuspended,
  groupStatus,
  restoreGroup,
  setLayerVisible,
  suspendGroup,
  toggleGroup,
} from "@/lib/map/layerGroups";
import type { LayerSelection } from "@/lib/map/layerState";

const group = "public-land";
const members = ["wma", "forest", "county"];

function selection(visibleIds: readonly string[], suspended: LayerSelection["suspended"] = {}) {
  const layers = Object.fromEntries(
    [...members, "outside"].map((id) => [id, { visible: visibleIds.includes(id), opacity: 0.6 }]),
  );
  return { layers, suspended } satisfies LayerSelection;
}

function visibleIds(state: LayerSelection): string[] {
  return Object.entries(state.layers)
    .filter(([, layer]) => layer.visible)
    .map(([id]) => id);
}

describe("suspendGroup", () => {
  it("hides every layer in the group and remembers the active subset", () => {
    const next = suspendGroup(selection(["wma", "county", "outside"]), group, members);

    expect(visibleIds(next)).toEqual(["outside"]);
    expect(next.suspended[group]).toEqual(["wma", "county"]);
  });

  it("keeps each layer's opacity", () => {
    const next = suspendGroup(selection(["wma"]), group, members);

    expect(next.layers.wma?.opacity).toBe(0.6);
  });

  it("does nothing for an empty subset", () => {
    const start = selection([]);

    expect(suspendGroup(start, group, members)).toBe(start);
  });

  it("remembers layers switched on while suspended along with the earlier subset", () => {
    const suspended = suspendGroup(selection(["wma"]), group, members);
    const peeked = setLayerVisible(suspended, "forest", true);

    expect(suspendGroup(peeked, group, members).suspended[group]).toEqual(["wma", "forest"]);
  });
});

describe("restoreGroup", () => {
  it("returns exactly the remembered subset", () => {
    const suspended = suspendGroup(selection(["wma", "county"]), group, members);
    const restored = restoreGroup(suspended, group);

    expect(visibleIds(restored)).toEqual(["wma", "county"]);
    expect(restored.suspended[group]).toBeUndefined();
  });

  it("does nothing when the group is not suspended", () => {
    const start = selection(["wma"]);

    expect(restoreGroup(start, group)).toBe(start);
  });

  it("ignores unknown or retired layer ids", () => {
    const start = selection([], { [group]: ["wma", "retired-layer"] });
    const restored = restoreGroup(start, group);

    expect(visibleIds(restored)).toEqual(["wma"]);
    expect(restored.layers).not.toHaveProperty("retired-layer");
    expect(restored.suspended[group]).toBeUndefined();
  });

  it("leaves other groups suspended", () => {
    const start = selection([], { [group]: ["wma"], parcels: ["outside"] });

    expect(restoreGroup(start, group).suspended).toEqual({ parcels: ["outside"] });
  });
});

describe("toggling a layer while its group is suspended", () => {
  const suspended = suspendGroup(selection(["wma", "county"]), group, members);

  it("shows only that layer and leaves the remembered subset alone", () => {
    const next = setLayerVisible(suspended, "forest", true);

    expect(visibleIds(next)).toEqual(["forest"]);
    expect(next.suspended[group]).toEqual(["wma", "county"]);
  });

  it("restores the remembered subset together with the layer", () => {
    const next = restoreGroup(setLayerVisible(suspended, "forest", true), group);

    expect(visibleIds(next)).toEqual(["wma", "forest", "county"]);
  });

  it("does not add the layer to the subset once it is switched off again", () => {
    const peeked = setLayerVisible(suspended, "forest", true);
    const next = restoreGroup(setLayerVisible(peeked, "forest", false), group);

    expect(visibleIds(next)).toEqual(["wma", "county"]);
  });
});

describe("groupStatus", () => {
  it("is active while a layer in the group is on", () => {
    expect(groupStatus(selection(["wma", "forest"]), group, members)).toEqual({
      mode: "active",
      on: 2,
      suspended: 0,
    });
  });

  it("is empty when nothing is on and nothing is remembered", () => {
    expect(groupStatus(selection([]), group, members)).toEqual({
      mode: "empty",
      on: 0,
      suspended: 0,
    });
  });

  it("is suspended, counting the hidden remembered layers, until restored", () => {
    const suspended = suspendGroup(selection(["wma", "county"]), group, members);
    const peeked = setLayerVisible(suspended, "county", true);

    expect(groupStatus(suspended, group, members)).toEqual({
      mode: "suspended",
      on: 0,
      suspended: 2,
    });
    expect(groupStatus(peeked, group, members)).toEqual({
      mode: "suspended",
      on: 1,
      suspended: 1,
    });
  });
});

describe("switching a remembered layer back on", () => {
  const suspended = suspendGroup(selection(["wma", "county"]), group, members);

  it("takes it out of the remembered subset", () => {
    const next = setLayerVisible(suspended, "wma", true);

    expect(next.suspended[group]).toEqual(["county"]);
  });

  it("keeps it off after it is switched off again, when the group is restored", () => {
    const peeked = setLayerVisible(suspended, "wma", true);
    const next = restoreGroup(setLayerVisible(peeked, "wma", false), group);

    expect(visibleIds(next)).toEqual(["county"]);
  });

  it("makes the group active once every remembered layer is back on", () => {
    const backOn = setLayerVisible(setLayerVisible(suspended, "wma", true), "county", true);

    expect(backOn.suspended).toEqual({});
    expect(groupStatus(backOn, group, members).mode).toBe("active");
    expect(visibleIds(toggleGroup(backOn, group, members))).toEqual([]);
  });

  it("does not bring a layer back that was switched off after they were all back on", () => {
    const backOn = setLayerVisible(setLayerVisible(suspended, "wma", true), "county", true);
    const oneOff = setLayerVisible(backOn, "county", false);

    expect(groupStatus(oneOff, group, members).mode).toBe("active");
    expect(toggleGroup(oneOff, group, members).suspended[group]).toEqual(["wma"]);
  });
});

describe("toggleGroup", () => {
  it("suspends an active group", () => {
    const next = toggleGroup(selection(["wma"]), group, members);

    expect(visibleIds(next)).toEqual([]);
    expect(next.suspended[group]).toEqual(["wma"]);
  });

  it("restores a suspended group", () => {
    const suspended = toggleGroup(selection(["wma"]), group, members);

    expect(visibleIds(toggleGroup(suspended, group, members))).toEqual(["wma"]);
  });

  it("never turns on a layer that was not in the active subset", () => {
    const start = selection(["wma"]);
    const suspended = toggleGroup(start, group, members);
    const restored = toggleGroup(suspended, group, members);

    expect(visibleIds(restored)).not.toContain("forest");
    expect(visibleIds(restored)).not.toContain("county");
  });

  it("does nothing for an empty group", () => {
    const start = selection([]);

    expect(toggleGroup(start, group, members)).toBe(start);
  });

  it("cycles through suspend and restore without drifting", () => {
    let state = selection(["forest", "county"]);
    for (let cycle = 0; cycle < 3; cycle++) {
      state = toggleGroup(toggleGroup(state, group, members), group, members);
    }

    expect(visibleIds(state)).toEqual(["forest", "county"]);
    expect(state.suspended).toEqual({});
  });
});

describe("forgetSuspended", () => {
  it("removes matching layers from every remembered subset and drops emptied groups", () => {
    const start = selection([], { a: ["wma", "forest"], b: ["forest"], c: ["county"] });
    const next = forgetSuspended(start, (id) => id === "forest");

    expect(next.suspended).toEqual({ a: ["wma"], c: ["county"] });
  });

  it("returns the same state when nothing matches", () => {
    const start = selection([], { a: ["wma"] });

    expect(forgetSuspended(start, () => false)).toBe(start);
  });
});
