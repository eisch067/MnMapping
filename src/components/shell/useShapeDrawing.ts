"use client";

import { useState } from "react";
import {
  addVertex,
  closeRing,
  createShapeEditState,
  insertMidpoint,
  undoShapeEdit,
  type ShapeEditState,
} from "@/lib/drawingState";
import type { DrawingOverlayState } from "@/lib/map/drawingOverlay";
import { primaryDimensionLabel } from "@/lib/measurements";
import type {
  MyDataSettings,
  MyGeometry,
  MyMapItem,
  NewMyDataItem,
  PolygonDimensionKind,
  PrimaryDimension,
} from "@/lib/myData";

type ShapeKind = "line" | "polygon";

export interface ActiveShape {
  kind: ShapeKind;
  item: MyMapItem | null;
  state: ShapeEditState;
  overlay: Omit<DrawingOverlayState, "vertices">;
  primaryDimension: PrimaryDimension;
}

export function useShapeDrawing(
  addItem: (item: NewMyDataItem) => Promise<void>,
  updateGeometry: (
    itemId: string,
    geometry: MyGeometry,
    primaryDimension: PrimaryDimension,
  ) => Promise<unknown>,
) {
  const [active, setActive] = useState<ActiveShape | null>(null);

  const startDrawing = (kind: ShapeKind, settings: MyDataSettings | null) => {
    if (!settings) return;
    setActive(drawingActive(kind, settings));
  };

  const startEditing = (item: MyMapItem) => {
    setActive(editingActive(item));
  };

  const addPoint = (longitude: number, latitude: number) => {
    setActive((current) => current && !current.item
      ? { ...current, state: addVertex(current.state, [longitude, latitude]) }
      : current);
  };
  const undo = () => setActive((current) => current
    ? { ...current, state: undoShapeEdit(current.state) }
    : current);
  const insert = (segmentIndex: number) => setActive((current) => current
    ? { ...current, state: insertMidpoint(current.state, segmentIndex) }
    : current);
  const setPolygonDimension = (kind: PolygonDimensionKind) => setActive((current) => {
    if (!current?.primaryDimension || !("areaUnit" in current.primaryDimension)) return current;
    return { ...current, primaryDimension: { ...current.primaryDimension, kind } };
  });
  const close = () => setActive(null);

  const save = async () => {
    if (!active) return;
    const geometry = geometryFromActive(active);
    if (active.item) await updateGeometry(active.item.id, geometry, active.primaryDimension);
    else {
      const fallback = active.kind === "line" ? "Line" : "Area";
      const name = window.prompt("Drawing name", fallback)?.trim() || fallback;
      await addItem({ name, geometry, primaryDimension: active.primaryDimension });
    }
    close();
  };

  return {
    active,
    overlay: active ? { ...active.overlay, vertices: active.state.vertices } : null,
    measurement: active
      ? primaryDimensionLabel(active.state.vertices, active.primaryDimension)
      : null,
    minimumVertices: active?.kind === "polygon" ? 3 : 2,
    startDrawing,
    startEditing,
    addPoint,
    undo,
    insertMidpoint: insert,
    setPolygonDimension,
    cancel: close,
    close,
    save,
  };
}

function drawingActive(kind: ShapeKind, settings: MyDataSettings): ActiveShape {
  if (kind === "line") {
    return {
      kind,
      item: null,
      state: createShapeEditState([], false),
      overlay: {
        closed: false,
        editing: false,
        appearance: { kind: "line", color: settings.line.color, width: settings.line.width },
        segmentUnit: settings.line.unit,
      },
      primaryDimension: { kind: "horizontal", unit: settings.line.unit },
    };
  }
  return {
    kind,
    item: null,
    state: createShapeEditState([], true),
    overlay: {
      closed: true,
      editing: false,
      appearance: {
        kind: "polygon",
        outlineColor: settings.polygon.outlineColor,
        fillColor: settings.polygon.fillColor,
        opacity: settings.polygon.opacity,
      },
      segmentUnit: settings.polygon.perimeterUnit,
    },
    primaryDimension: {
      kind: settings.polygon.dimensionKind,
      areaUnit: settings.polygon.areaUnit,
      perimeterUnit: settings.polygon.perimeterUnit,
    },
  };
}

function editingActive(item: MyMapItem): ActiveShape | null {
  const coordinates = item.geometry.type === "LineString"
    ? item.geometry.coordinates
    : item.geometry.type === "Polygon" ? item.geometry.coordinates[0] : null;
  if (!coordinates || item.appearance.kind === "point") return null;
  const kind = item.geometry.type === "LineString" ? "line" : "polygon";
  const dimension = item.primaryDimension ?? (kind === "line"
    ? { kind: "horizontal" as const, unit: "miles" as const }
    : { kind: "area" as const, areaUnit: "acres" as const, perimeterUnit: "miles" as const });
  const segmentUnit = "perimeterUnit" in dimension ? dimension.perimeterUnit : dimension.unit;
  return {
    kind,
    item,
    state: createShapeEditState(coordinates, kind === "polygon"),
    overlay: { closed: kind === "polygon", editing: true, appearance: item.appearance, segmentUnit },
    primaryDimension: dimension,
  };
}

function geometryFromActive(active: ActiveShape): MyGeometry {
  const coordinates = active.state.vertices.map((point) => [point[0], point[1]] as [number, number]);
  if (active.kind === "line") {
    return { type: "LineString", coordinates };
  }
  const ring = closeRing(active.state.vertices).map((point) => [point[0], point[1]] as [number, number]);
  return { type: "Polygon", coordinates: [ring] };
}
