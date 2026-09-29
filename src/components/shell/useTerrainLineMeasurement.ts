"use client";

import { useEffect, useState } from "react";
import type { ActiveShape } from "./useShapeDrawing";
import type { ElevationSample } from "@/lib/measurements";
import { primaryDimensionLabel } from "@/lib/measurements";
import { isPersonalMode } from "@/config/appMode";
import { profilePositions, sampleElevations } from "@/lib/terrain/elevationSampling";

export function useTerrainLineMeasurement(active: ActiveShape | null) {
  const [sampleState, setSampleState] = useState<{
    key: string;
    samples?: ElevationSample[];
    error?: string;
  } | null>(null);
  const activeLine = active?.kind === "line" ? active.state.vertices : null;
  const dimension = active?.primaryDimension?.kind === "direct" || active?.primaryDimension?.kind === "ground"
    ? active.primaryDimension
    : null;
  const key = activeLine && activeLine.length >= 2 && dimension
    ? JSON.stringify([activeLine, dimension.kind])
    : null;

  useEffect(() => {
    if (!isPersonalMode || !activeLine || !dimension || !key) return;
    let cancelled = false;
    const positions = dimension.kind === "ground" ? profilePositions(activeLine) : activeLine;
    void sampleElevations(positions).then((samples) => {
      if (!cancelled) setSampleState({ key, samples });
    }).catch((error: unknown) => {
      if (!cancelled) setSampleState({
        key,
        error: error instanceof Error ? error.message : "Unable to sample the Minnesota DEM.",
      });
    });
    return () => { cancelled = true; };
  }, [activeLine, dimension, key]);

  return {
    elevationMeasurement: dimension !== null,
    measurement: active ? measurementForActive(active, key, sampleState) : null,
  };
}

function measurementForActive(
  active: ActiveShape,
  key: string | null,
  sampleState: { key: string; samples?: ElevationSample[]; error?: string } | null,
): string | null {
  if ((active.primaryDimension?.kind === "direct" || active.primaryDimension?.kind === "ground")
    && key && sampleState?.key !== key) return "Sampling Minnesota DEM…";
  if (sampleState?.key === key && sampleState.error) return `DEM sample unavailable: ${sampleState.error}`;
  return primaryDimensionLabel(
    active.state.vertices,
    active.primaryDimension,
    sampleState?.key === key ? sampleState.samples : [],
  );
}
