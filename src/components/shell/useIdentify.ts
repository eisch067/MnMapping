"use client";

import { useEffect, useRef, useState } from "react";
import type { LayerDefinition } from "@/config/layers";
import { identifyAt } from "@/lib/identify/identify";
import type { IdentifyFailure, IdentifyPoint, IdentifyResult } from "@/lib/identify/types";
import type { LayerStateById } from "@/lib/map/layerState";
import type { MyMapItem } from "@/lib/myData";

export interface IdentifyState {
  point: IdentifyPoint | null;
  status: "idle" | "loading" | "done";
  results: IdentifyResult[];
  failures: IdentifyFailure[];
  selectedId: string | null;
}

interface IdentifySources {
  layers: readonly LayerDefinition[];
  layerState: LayerStateById;
  cameraHeight: number;
  myData: readonly MyMapItem[];
  myDataVisible: boolean;
}

const idle: IdentifyState = {
  point: null,
  status: "idle",
  results: [],
  failures: [],
  selectedId: null,
};

export function useIdentify(sources: IdentifySources) {
  const [state, setState] = useState<IdentifyState>(idle);
  const pending = useRef<AbortController | null>(null);

  useEffect(() => () => pending.current?.abort(), []);

  const identify = async (point: IdentifyPoint) => {
    pending.current?.abort();
    const controller = new AbortController();
    pending.current = controller;
    setState({ ...idle, point, status: "loading" });
    const outcome = await identifyAt({
      point,
      layers: sources.layers,
      layerState: sources.layerState,
      cameraHeight: sources.cameraHeight,
      myData: sources.myDataVisible ? sources.myData : [],
      signal: controller.signal,
    });
    if (controller.signal.aborted) return;
    for (const failure of outcome.failures) {
      console.error(`Unable to identify ${failure.layerName}: ${failure.message}`);
    }
    setState({ ...idle, ...outcome, point, status: "done" });
  };

  const clear = () => {
    pending.current?.abort();
    setState(idle);
  };

  const select = (selectedId: string | null) => {
    setState((current) => ({ ...current, selectedId }));
  };

  return { ...state, identify, clear, select };
}
