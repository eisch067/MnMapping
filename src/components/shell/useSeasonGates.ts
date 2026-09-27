"use client";

import { useEffect, useState } from "react";
import type { LayerDefinition } from "@/config/layers";
import { initialSeasonGates, loadSeasonGates, type SeasonGates } from "@/lib/dnr/seasonGate";

// Configured seasons are decided at once. A season DNR publishes on the service is unknown until
// the service answers, and stays unavailable if it never does.
export function useSeasonGates(layers: readonly LayerDefinition[]): SeasonGates {
  const [gates, setGates] = useState<SeasonGates>(() => initialSeasonGates(layers, new Date()));

  useEffect(() => {
    const now = new Date();
    if (!Object.values(initialSeasonGates(layers, now)).some((gate) => gate.status === "checking")) {
      return;
    }
    const controller = new AbortController();
    loadSeasonGates(layers, {
      fetcher: (...args) => fetch(...args),
      now,
      signal: controller.signal,
    }).then((loaded) => {
      if (!controller.signal.aborted) setGates(loaded);
    });
    return () => controller.abort();
  }, [layers]);

  return gates;
}
