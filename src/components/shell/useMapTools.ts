"use client";

import { useState } from "react";
import type { InteractionMode } from "@/components/map/CesiumMap";
import {
  roughAreaSquareMeters,
  roughLengthMeters,
  type MyMapItem,
  type NewMyDataItem,
} from "@/lib/myData";

export type Position = [number, number];
type DrawMode = "line" | "polygon";

export function isDrawMode(mode: InteractionMode): mode is DrawMode {
  return mode === "line" || mode === "polygon";
}

export function minimumVertices(mode: DrawMode): number {
  return mode === "polygon" ? 3 : 2;
}

function newItem(name: string, geometry: MyMapItem["geometry"], note?: string): NewMyDataItem {
  return { name, note, geometry };
}

function promptForPin(position: Position): NewMyDataItem {
  const name = window.prompt("Pin name", "Dropped pin")?.trim() || "Dropped pin";
  const note = window.prompt("Optional note")?.trim() || undefined;
  return newItem(name, { type: "Point", coordinates: position }, note);
}

function promptForDrawing(mode: DrawMode, draft: Position[]): NewMyDataItem {
  const isPolygon = mode === "polygon";
  const measurement = isPolygon
    ? `${(roughAreaSquareMeters(draft) / 4046.856).toFixed(2)} acres`
    : `${(roughLengthMeters(draft) / 1609.344).toFixed(2)} miles`;
  const geometry: MyMapItem["geometry"] = isPolygon
    ? { type: "Polygon", coordinates: [[...draft, draft[0]]] }
    : { type: "LineString", coordinates: draft };
  const name = window.prompt("Drawing name", isPolygon ? "Area" : "Route")?.trim() || "Drawing";
  return newItem(name, geometry, `Approx. ${measurement}`);
}

export function useMapTools(addItem: (item: NewMyDataItem) => Promise<void>) {
  const [mode, setMode] = useState<InteractionMode>("inspect");
  const [draft, setDraft] = useState<Position[]>([]);
  const [inspection, setInspection] = useState<Position | null>(null);

  const selectMode = (next: InteractionMode) => {
    setMode(next);
    setDraft([]);
  };

  const handleCoordinateClick = (longitude: number, latitude: number) => {
    setInspection([longitude, latitude]);
    if (mode === "pin") {
      void addItem(promptForPin([longitude, latitude]));
      setMode("inspect");
    } else if (isDrawMode(mode)) {
      setDraft((current) => [...current, [longitude, latitude]]);
    }
  };

  const finishDrawing = async () => {
    if (!isDrawMode(mode) || draft.length < minimumVertices(mode)) return;
    await addItem(promptForDrawing(mode, draft));
    selectMode("inspect");
  };

  return {
    mode,
    draft,
    inspection,
    selectMode,
    reset: () => selectMode("inspect"),
    handleCoordinateClick,
    finishDrawing,
  };
}
