import { useEffect, useState } from "react";
import type { Position } from "@/lib/geodesy";
import { sampleElevations } from "@/lib/terrain/elevationSampling";
import { VIEWSHED_CELL_BUDGET, type ViewshedRequest } from "@/lib/terrain/viewshed";

interface UseViewshedAnalysisOptions {
  enabled: boolean;
  observer: Position | null;
  rangeMeters: number;
  observerHeightFeet: number;
}

interface ViewshedResult {
  visible: Uint8Array;
  size: number;
  requestKey: string;
}

export function useViewshedAnalysis({
  enabled,
  observer,
  rangeMeters,
  observerHeightFeet,
}: UseViewshedAnalysisOptions) {
  const [status, setStatus] = useState<"idle" | "computing">("idle");
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<ViewshedResult | null>(null);
  const dimension = Math.ceil(rangeMeters * 2 / 10) + 1;
  const cells = dimension * dimension;
  const requestKey = [enabled, observer?.[0], observer?.[1], rangeMeters, observerHeightFeet].join(":");
  const budgetMessage = cells > VIEWSHED_CELL_BUDGET
    ? `This view needs ${cells.toLocaleString()} cells; the device limit is ${VIEWSHED_CELL_BUDGET.toLocaleString()}. Reduce the range.`
    : null;

  useEffect(() => {
    if (!enabled || !observer || budgetMessage) return;
    const loadingTimer = window.setTimeout(() => {
      setStatus("computing");
      setError(null);
      setResult(null);
    }, 0);
    const controller = new AbortController();
    let worker: Worker | null = null;
    const positions = makeGrid(observer, dimension, 10);
    void sampleElevations(positions, fetch, controller.signal).then((samples) => {
      if (controller.signal.aborted) return;
      worker = new Worker(new URL("../../lib/terrain/viewshed.worker.ts", import.meta.url), { type: "module" });
      worker.onmessage = (event: MessageEvent<{ visible?: Uint8Array; error?: string }>) => {
        if (controller.signal.aborted) return;
        if (event.data.error || !event.data.visible) setError(event.data.error ?? "Viewshed computation failed.");
        else setResult({ visible: event.data.visible, size: dimension, requestKey });
        setStatus("idle");
        worker?.terminate();
      };
      const request: ViewshedRequest = {
        width: dimension,
        height: dimension,
        elevations: samples.map(({ elevationMeters }) => elevationMeters),
        cellSizeMeters: 10,
        observerX: Math.floor(dimension / 2),
        observerY: Math.floor(dimension / 2),
        observerHeightMeters: observerHeightFeet * 0.3048,
        targetHeightMeters: 1.7,
        rangeMeters,
      };
      worker.postMessage(request);
    }).catch((cause: unknown) => {
      if (controller.signal.aborted) return;
      setError(cause instanceof Error ? cause.message : "Unable to load elevations for the viewshed.");
      setStatus("idle");
    });
    return () => {
      window.clearTimeout(loadingTimer);
      controller.abort();
      worker?.terminate();
    };
  }, [enabled, observer, rangeMeters, observerHeightFeet, dimension, budgetMessage, requestKey]);

  return { status, error, result: result?.requestKey === requestKey ? result : null, budgetMessage };
}

function makeGrid(observer: Position, dimension: number, spacingMeters: number): Position[] {
  const latitudeStep = spacingMeters / 111_320;
  const longitudeStep = spacingMeters / (111_320 * Math.max(0.1, Math.cos(observer[1] * Math.PI / 180)));
  const center = Math.floor(dimension / 2);
  return Array.from({ length: dimension * dimension }, (_, index) => {
    const x = index % dimension;
    const y = Math.floor(index / dimension);
    return [observer[0] + (x - center) * longitudeStep, observer[1] + (y - center) * latitudeStep];
  });
}
