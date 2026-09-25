import type { LayerDefinition } from "@/config/layers";
import { isLayerAvailableAtCameraHeight, isTerrainLayer } from "@/config/layers/types";
import type { LayerStateById } from "@/lib/map/layerState";
import { topmostFirst } from "@/lib/map/layerStack";
import { identifyAdapters } from "./adapters";
import { identifyMyData, type IdentifiableItem } from "./myData";
import type {
  IdentifyFailure,
  IdentifyPoint,
  IdentifyResult,
  LayerIdentifyAdapter,
} from "./types";

export interface IdentifyRequest {
  point: IdentifyPoint;
  // In the order the map draws them, bottom first.
  layers: readonly LayerDefinition[];
  layerState: LayerStateById;
  cameraHeight: number;
  // Only the saved items the map is showing.
  myData: readonly IdentifiableItem[];
  signal?: AbortSignal;
  fetcher?: typeof fetch;
  adapters?: Partial<Record<LayerDefinition["sourceType"], LayerIdentifyAdapter | null>>;
}

export interface IdentifyOutcome {
  results: IdentifyResult[];
  failures: IdentifyFailure[];
}

function failureMessage(reason: unknown): string {
  return reason instanceof Error && reason.message ? reason.message : "The layer did not respond.";
}

// Saved My Data is always drawn above the layers, then the layers from the topmost down.
export async function identifyAt(request: IdentifyRequest): Promise<IdentifyOutcome> {
  const { point, layers, layerState, cameraHeight, signal } = request;
  const fetcher = request.fetcher ?? ((...args) => fetch(...args));
  const adapters = { ...identifyAdapters, ...request.adapters };
  const queried = topmostFirst(layers).flatMap((layer) => {
    const adapter = adapters[layer.sourceType];
    const isShown =
      layerState[layer.id]?.visible &&
      !isTerrainLayer(layer) &&
      isLayerAvailableAtCameraHeight(layer, cameraHeight);
    return adapter && isShown ? [{ layer, adapter }] : [];
  });

  const settled = await Promise.allSettled(
    queried.map(({ layer, adapter }) => adapter(layer, { point, signal, fetcher })),
  );

  const results = identifyMyData(request.myData, point);
  const failures: IdentifyFailure[] = [];
  settled.forEach((outcome, index) => {
    if (outcome.status === "fulfilled") {
      results.push(...outcome.value);
    } else {
      failures.push({
        layerName: queried[index].layer.name,
        message: failureMessage(outcome.reason),
      });
    }
  });
  return { results, failures };
}
