"use client";

import { useSyncExternalStore } from "react";
import { isPersonalMode } from "@/config/appMode";

const guideStorageKey = "mnmapping.terrain-guide-dismissed";
const guideChangeEvent = "mnmapping-terrain-guide-change";

interface TerrainCoachMarkProps {
  onOpenLayers: () => void;
}

function subscribe(onChange: () => void) {
  window.addEventListener(guideChangeEvent, onChange);
  window.addEventListener("storage", onChange);
  return () => {
    window.removeEventListener(guideChangeEvent, onChange);
    window.removeEventListener("storage", onChange);
  };
}

function shouldShowGuide(): boolean {
  if (!isPersonalMode) return false;
  try {
    return localStorage.getItem(guideStorageKey) !== "true";
  } catch {
    return false;
  }
}

function dismissGuide() {
  try {
    localStorage.setItem(guideStorageKey, "true");
  } catch {
    // The guide remains dismissible for this visit if storage is unavailable.
  }
  window.dispatchEvent(new Event(guideChangeEvent));
}

export function TerrainCoachMark({ onOpenLayers }: TerrainCoachMarkProps) {
  const visible = useSyncExternalStore(subscribe, shouldShowGuide, () => false);
  if (!visible) return null;
  return (
    <aside className="terrain-coach-mark" aria-label="First-use terrain guide">
      <button className="terrain-coach-close" type="button" aria-label="Dismiss terrain guide" onClick={dismissGuide}>×</button>
      <strong>Explore Minnesota’s terrain</strong>
      <p>Open Layers, expand 3D Terrain, and turn it on; the compass resets north. Direct and ground measurements use the statewide NAVD88 lidar DEM.</p>
      <div>
        <button type="button" onClick={onOpenLayers}>Open Layers</button>
        <button type="button" onClick={dismissGuide}>Got it</button>
      </div>
    </aside>
  );
}
