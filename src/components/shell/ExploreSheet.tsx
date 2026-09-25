"use client";

import type { Position } from "./useMapTools";

export function ExploreSheet({ point }: { point: Position | null }) {
  if (!point) return <p className="sheet-hint">Click or tap the map to see coordinates.</p>;
  const coordinates = `${point[1].toFixed(6)}, ${point[0].toFixed(6)}`;
  return (
    <div className="explore-point">
      <strong>Map point</strong>
      <span>{coordinates}</span>
      <button type="button" onClick={() => void navigator.clipboard.writeText(coordinates)}>
        Copy coordinates
      </button>
    </div>
  );
}
