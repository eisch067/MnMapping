"use client";

import { useState } from "react";
import type { InteractionMode } from "@/components/map/CesiumMap";
import type { NewMyDataItem } from "@/lib/myData";

export type Position = [number, number];
function promptForPin(position: Position): NewMyDataItem {
  const name = window.prompt("Pin name", "Dropped pin")?.trim() || "Dropped pin";
  const note = window.prompt("Optional note")?.trim() || undefined;
  return { name, note, geometry: { type: "Point", coordinates: position } };
}

export function useMapTools(addItem: (item: NewMyDataItem) => Promise<void>) {
  const [mode, setMode] = useState<InteractionMode>("inspect");

  const selectMode = (next: InteractionMode) => {
    setMode(next);
  };

  const handleCoordinateClick = (longitude: number, latitude: number) => {
    if (mode === "pin") {
      void addItem(promptForPin([longitude, latitude]));
      setMode("inspect");
    }
  };

  return {
    mode,
    selectMode,
    reset: () => selectMode("inspect"),
    handleCoordinateClick,
  };
}
