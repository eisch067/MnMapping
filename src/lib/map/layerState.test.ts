import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { LayerCategory, LayerDefinition } from "@/config/layers/types";
import { restoreLayerPreferences, saveLayerPreferences } from "@/lib/map/layerState";

const currentKey = "mnmapping.layer-preferences";
const legacyKey = "mnmapping.layer-preferences.v1";

function layer(id: string, category: LayerCategory, defaultVisible = false): LayerDefinition {
  return {
    id,
    name: id,
    category,
    sourceType: "tms",
    url: `https://example.test/${id}`,
    defaultVisible,
    defaultOpacity: 0.8,
    attribution: "test",
  };
}

const registry = [
  layer("basemap", "basemap", true),
  layer("wma", "public-land"),
  layer("forest", "public-land"),
  layer("parcels", "parcels"),
];

class MemoryStorage {
  readonly items = new Map<string, string>();
  getItem(key: string) {
    return this.items.get(key) ?? null;
  }
  setItem(key: string, value: string) {
    this.items.set(key, value);
  }
  removeItem(key: string) {
    this.items.delete(key);
  }
}

let storage: MemoryStorage;

beforeEach(() => {
  storage = new MemoryStorage();
  vi.stubGlobal("window", { localStorage: storage });
});

afterEach(() => {
  vi.unstubAllGlobals();
});

function storeLegacy(preferences: unknown) {
  storage.setItem(legacyKey, JSON.stringify(preferences));
}

describe("restoreLayerPreferences", () => {
  it("uses each layer's defaults when nothing is stored", () => {
    const restored = restoreLayerPreferences(registry);

    expect(restored.layers.basemap).toEqual({ visible: true, opacity: 0.8 });
    expect(restored.layers.wma).toEqual({ visible: false, opacity: 0.8 });
    expect(restored.suspended).toEqual({});
    expect(restored.order).toEqual(["basemap", "wma", "forest", "parcels"]);
    expect(restored.verticalExaggeration).toBe(1);
  });

  it("uses defaults when the stored value is not JSON", () => {
    storage.setItem(currentKey, "{not json");

    expect(restoreLayerPreferences(registry).layers.wma?.visible).toBe(false);
  });

  it("ignores a stored version it does not know", () => {
    const future = { version: 99, layers: { wma: { visible: true, opacity: 1 } } };
    storage.setItem(currentKey, JSON.stringify(future));

    expect(restoreLayerPreferences(registry).layers.wma?.visible).toBe(false);
  });

  it("clamps a stored opacity into range", () => {
    storeLegacy({
      layers: { wma: { visible: true, opacity: 4 }, forest: { visible: true, opacity: -1 } },
    });

    const { layers } = restoreLayerPreferences(registry);

    expect(layers.wma?.opacity).toBe(1);
    expect(layers.forest?.opacity).toBe(0);
  });

  it("ignores unknown or retired layer ids and appends newly registered layers", () => {
    storage.setItem(
      currentKey,
      JSON.stringify({
        version: 2,
        layers: { wma: { visible: true, opacity: 0.5 }, retired: { visible: true, opacity: 1 } },
        suspended: { "public-land": ["forest", "retired"], gone: ["retired"], broken: "forest" },
        order: ["retired", "parcels", "wma"],
        verticalExaggeration: 2,
      }),
    );

    const restored = restoreLayerPreferences(registry);

    expect(restored.layers).not.toHaveProperty("retired");
    expect(restored.layers.wma).toEqual({ visible: true, opacity: 0.5 });
    expect(restored.layers.forest).toEqual({ visible: false, opacity: 0.8 });
    expect(restored.suspended).toEqual({ "public-land": ["forest"] });
    expect(restored.order).toEqual(["parcels", "wma", "basemap", "forest"]);
    expect(restored.verticalExaggeration).toBe(2);
  });

  describe("migrating the current preferences", () => {
    it("reads visibility, opacity, order, and exaggeration", () => {
      storeLegacy({
        layers: { wma: { visible: true, opacity: 0.3 } },
        order: ["parcels", "forest", "wma", "basemap"],
        orderVersion: 2,
        verticalExaggeration: 3,
      });

      const restored = restoreLayerPreferences(registry);

      expect(restored.layers.wma).toEqual({ visible: true, opacity: 0.3 });
      expect(restored.order).toEqual(["parcels", "forest", "wma", "basemap"]);
      expect(restored.verticalExaggeration).toBe(3);
      expect(restored.suspended).toEqual({});
    });

    it("drops an order saved by an older ordering scheme", () => {
      storeLegacy({ order: ["parcels", "forest", "wma", "basemap"], orderVersion: 1 });

      expect(restoreLayerPreferences(registry).order).toEqual([
        "basemap",
        "wma",
        "forest",
        "parcels",
      ]);
    });

    it("prefers the versioned preferences when both are stored", () => {
      storeLegacy({ layers: { wma: { visible: true, opacity: 1 } } });
      storage.setItem(
        currentKey,
        JSON.stringify({ version: 2, layers: { wma: { visible: false, opacity: 0.2 } } }),
      );

      const { layers } = restoreLayerPreferences(registry);

      expect(layers.wma).toEqual({ visible: false, opacity: 0.2 });
    });
  });
});

describe("saveLayerPreferences", () => {
  it("round-trips the layers, suspended subsets, order, and exaggeration", () => {
    const preferences = {
      layers: {
        basemap: { visible: true, opacity: 0.8 },
        wma: { visible: false, opacity: 0.4 },
        forest: { visible: false, opacity: 0.8 },
        parcels: { visible: true, opacity: 0.8 },
      },
      suspended: { "public-land": ["wma", "forest"] },
      order: ["parcels", "forest", "wma", "basemap"],
      verticalExaggeration: 1.5,
    };

    saveLayerPreferences(preferences);

    expect(restoreLayerPreferences(registry)).toEqual(preferences);
  });

  it("stores the versioned format and removes the legacy entry", () => {
    storeLegacy({ layers: { wma: { visible: true, opacity: 1 } } });

    saveLayerPreferences(restoreLayerPreferences(registry));

    expect(storage.getItem(legacyKey)).toBeNull();
    expect(JSON.parse(storage.getItem(currentKey) ?? "null")).toMatchObject({ version: 2 });
  });

  it("does not throw when storage is unavailable", () => {
    vi.stubGlobal("window", {
      localStorage: {
        getItem: () => null,
        setItem: () => {
          throw new Error("QuotaExceededError");
        },
        removeItem: () => undefined,
      },
    });

    expect(() => saveLayerPreferences(restoreLayerPreferences(registry))).not.toThrow();
  });
});
