"use client";

import { useEffect, useRef, useState } from "react";
import type { Position } from "@/lib/geodesy";
import { minnesotaBounds, type ViewportBounds } from "@/lib/location";
import { VIEWSHED_CELL_BUDGET } from "@/lib/terrain/viewshed";
import { useViewshedAnalysis } from "./useViewshedAnalysis";

export interface TerrainAnalysisSheetProps {
  observer: Position | null;
  pickingObserver: boolean;
  thresholdBounds: ViewportBounds | null;
  onPickObserver: () => void;
}

const accuracyDisclosure = "Viewsheds are estimates from sampled Minnesota lidar elevations, not survey-grade measurements. Buildings, vegetation, and features smaller than the sampling interval may be missing.";
const temporaryLabel = "temporary on this device only · not synced, exported, or a My Data item.";

export function TerrainAnalysisSheet({ observer, pickingObserver, thresholdBounds, onPickObserver }: TerrainAnalysisSheetProps) {
  const [tool, setTool] = useState<"threshold" | "viewshed">("threshold");
  const [thresholdFeet, setThresholdFeet] = useState(1450);
  const [observerHeightFeet, setObserverHeightFeet] = useState(6);
  const [rangeMeters, setRangeMeters] = useState(500);
  const [saved, setSaved] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const analysis = useViewshedAnalysis({ enabled: tool === "viewshed", observer, rangeMeters, observerHeightFeet });
  const result = analysis.result;
  const clippedBounds = thresholdBounds ? clipToMinnesota(thresholdBounds) : minnesotaBounds;

  return (
    <section className="terrain-analysis" aria-label="Terrain analysis">
      <div className="tool-buttons" role="group" aria-label="Terrain tools">
        <button type="button" aria-pressed={tool === "threshold"} onClick={() => { setTool("threshold"); setSaved(false); setSaveError(null); }}>Threshold</button>
        <button type="button" aria-pressed={tool === "viewshed"} onClick={() => { setTool("viewshed"); setSaved(false); setSaveError(null); }}>Viewshed</button>
      </div>
      {tool === "threshold" ? (
        <ThresholdControls thresholdFeet={thresholdFeet} bounds={clippedBounds} onThresholdChange={(feet) => { setThresholdFeet(feet); setSaved(false); setSaveError(null); }} />
      ) : (
        <ViewshedControls
          pickingObserver={pickingObserver}
          observerHeightFeet={observerHeightFeet}
          rangeMeters={rangeMeters}
          onPickObserver={onPickObserver}
          onObserverHeightChange={(feet) => { setObserverHeightFeet(feet); setSaved(false); setSaveError(null); }}
          onRangeChange={(meters) => { setRangeMeters(meters); setSaved(false); setSaveError(null); }}
        />
      )}
      {result && !analysis.budgetMessage && <ViewshedPreview visible={result.visible} size={result.size} />}
      {analysis.status === "computing" && !analysis.budgetMessage && <p role="status">Computing terrain analysis…</p>}
      {analysis.budgetMessage && <p role="alert">{analysis.budgetMessage}</p>}
      {analysis.error && <p role="alert">{analysis.error}</p>}
      {saveError && <p role="alert">{saveError}</p>}
      <p className="terrain-accuracy-note">{accuracyDisclosure}</p>
      <p className="terrain-performance-note">Large windows take longer; changing parameters cancels the active computation.</p>
      {tool === "threshold" && clippedBounds && <SaveAnalysis label={`Threshold result · ${temporaryLabel}`} saved={saved} onSave={() => void saveAnalysis({ kind: "threshold", thresholdFeet, bounds: clippedBounds }, setSaved, setSaveError, thresholdImageUrl(thresholdFeet, clippedBounds))} />}
      {tool === "viewshed" && observer && result && !analysis.error && !analysis.budgetMessage && <SaveAnalysis label={`Viewshed result · ${temporaryLabel}`} saved={saved} onSave={() => saveAnalysis({ kind: "viewshed", observer, rangeMeters, observerHeightFeet, visible: Array.from(result.visible), size: result.size }, setSaved, setSaveError)} />}
    </section>
  );
}

function ThresholdControls({ thresholdFeet, bounds, onThresholdChange }: {
  thresholdFeet: number;
  bounds: ViewportBounds | null;
  onThresholdChange: (feet: number) => void;
}) {
  const imageUrl = bounds ? thresholdImageUrl(thresholdFeet, bounds) : null;
  const aspectRatio = bounds ? (bounds.east - bounds.west) / (bounds.north - bounds.south) : 4 / 3;
  return (
    <>
      <label>Minimum elevation: {thresholdFeet.toLocaleString()} ft
        <input type="range" min="600" max="2300" step="10" value={thresholdFeet} onChange={(event) => onThresholdChange(Number(event.target.value))} />
        <small>Threshold mask uses server-side Remap and Colormap on the MnGeo lidar DEM.</small>
      </label>
      {imageUrl
        ? <div className="terrain-threshold-result" role="img" aria-label={`Elevation threshold mask above ${thresholdFeet.toLocaleString()} feet`} style={{ aspectRatio, backgroundImage: `url("${imageUrl}")` }} />
        : <p role="status">Threshold analysis is available only within Minnesota.</p>}

    </>
  );
}

function ViewshedControls({ pickingObserver, observerHeightFeet, rangeMeters, onPickObserver, onObserverHeightChange, onRangeChange }: {
  pickingObserver: boolean;
  observerHeightFeet: number;
  rangeMeters: number;
  onPickObserver: () => void;
  onObserverHeightChange: (feet: number) => void;
  onRangeChange: (meters: number) => void;
}) {
  return (
    <>
      <button type="button" onClick={onPickObserver}>{pickingObserver ? "Tap map to place observer…" : "Place observer on map"}</button>
      <label>Observer height: {observerHeightFeet} ft
        <input type="range" min="1" max="30" step="1" value={observerHeightFeet} onChange={(event) => onObserverHeightChange(Number(event.target.value))} />
      </label>
      <label>Range: {rangeMeters} m
        <input type="range" min="100" max="1000" step="25" value={rangeMeters} onChange={(event) => onRangeChange(Number(event.target.value))} />
      </label>
      <small>Cell spacing: 10 m · cell budget: {VIEWSHED_CELL_BUDGET.toLocaleString()}</small>

    </>
  );
}

function SaveAnalysis({ label, saved, onSave }: { label: string; saved: boolean; onSave: () => void }) {
  return (
    <div>
      <p>{label}</p>
      <button type="button" onClick={onSave}>Save analysis</button>
      {saved && <p role="status">Saved temporarily on this device.</p>}
    </div>
  );
}

function ViewshedPreview({ visible, size }: { visible: Uint8Array; size: number }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const context = canvasRef.current?.getContext("2d");
    if (!context) return;
    context.canvas.width = size;
    context.canvas.height = size;
    const image = context.createImageData(size, size);
    visible.forEach((cell, index) => {
      image.data[index * 4] = 255;
      image.data[index * 4 + 1] = 215;
      image.data[index * 4 + 2] = 106;
      image.data[index * 4 + 3] = cell ? 210 : 0;
    });
    context.putImageData(image, 0, 0);
  }, [visible, size]);
  return <canvas ref={canvasRef} className="viewshed-preview" role="img" aria-label="Computed viewshed result" />;
}

function thresholdImageUrl(thresholdFeet: number, bounds: ViewportBounds): string {
  const query = new URLSearchParams({
    west: String(bounds.west), south: String(bounds.south), east: String(bounds.east),
    north: String(bounds.north), minimum: String(thresholdFeet),
  });
  return `/api/terrain/threshold?${query}`;
}

function clipToMinnesota(bounds: ViewportBounds): ViewportBounds | null {
  const clipped = {
    west: Math.max(bounds.west, minnesotaBounds.west),
    south: Math.max(bounds.south, minnesotaBounds.south),
    east: Math.min(bounds.east, minnesotaBounds.east),
    north: Math.min(bounds.north, minnesotaBounds.north),
  };
  return clipped.west < clipped.east && clipped.south < clipped.north ? clipped : null;
}

async function saveAnalysis(
  data: object,
  onSaved: (saved: boolean) => void,
  onError: (error: string | null) => void,
  imageUrl?: string,
) {
  try {
    const imageData = imageUrl ? await fetchThresholdImage(imageUrl) : undefined;
    localStorage.setItem("mnmapping.temporary-terrain-analysis", JSON.stringify({ ...data, imageData, savedAt: Date.now() }));
    onSaved(true);
    onError(null);
  } catch {
    onSaved(false);
    onError("This browser could not save the temporary analysis.");
  }
}

async function fetchThresholdImage(imageUrl: string): Promise<string> {
  const response = await fetch(imageUrl);
  if (!response.ok) throw new Error("Threshold image unavailable.");
  return readBlobAsDataUrl(await response.blob());
}

function readBlobAsDataUrl(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => typeof reader.result === "string" ? resolve(reader.result) : reject(new Error("Invalid image data."));
    reader.onerror = () => reject(reader.error ?? new Error("Unable to read threshold image."));
    reader.readAsDataURL(blob);
  });
}
