"use client";

import { useEffect, type RefObject } from "react";
import type { Entity, Viewer } from "cesium";

// A dark outline under a white stroke keeps the mark visible over both aerial imagery and the
// pale basemap. The image's center is the clicked point.
const crosshairShape = `<circle cx="20" cy="20" r="11"/><path d="M20 3v10M20 27v10M3 20h10M27 20h10"/>`;
const crosshairStroke = (color: string, width: number) =>
  `<g stroke="${color}" stroke-width="${width}" stroke-linecap="round">${crosshairShape}</g>`;
const crosshairSvg =
  `<svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" viewBox="0 0 40 40" fill="none">` +
  `${crosshairStroke("#07041f", 5)}${crosshairStroke("#fff", 2.4)}</svg>`;
const crosshairImage = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(crosshairSvg)}`;

// Marks the exact point identified on the map. Pass the same object until the point changes.
export function useCrosshair(
  viewerRef: RefObject<Viewer | null>,
  mapReady: boolean,
  point: { longitude: number; latitude: number } | null,
) {
  useEffect(() => {
    const viewer = viewerRef.current;
    if (!mapReady || !viewer || !point) return;
    let cancelled = false;
    let crosshair: Entity | undefined;
    void import("cesium").then(({ Cartesian3 }) => {
      if (cancelled || viewer.isDestroyed()) return;
      crosshair = viewer.entities.add({
        position: Cartesian3.fromDegrees(point.longitude, point.latitude),
        billboard: {
          image: crosshairImage,
          disableDepthTestDistance: Number.POSITIVE_INFINITY,
        },
      });
    });
    return () => {
      cancelled = true;
      if (crosshair && !viewer.isDestroyed()) viewer.entities.remove(crosshair);
    };
  }, [viewerRef, mapReady, point]);
}
