import type { InteractionMode } from "@/components/map/CesiumMap";
import type { DistanceKind, PolygonDimensionKind } from "@/lib/myData";
import { ShapeActionPanel } from "./ShapeActionPanel";

interface ActiveShapeProps {
  editing: boolean;
  kind: "line" | "polygon";
  itemName?: string;
  vertexCount: number;
  minimumVertices: number;
  canUndo: boolean;
  measurement: string | null;
  elevationMeasurement: boolean;
  allowElevationMeasurements: boolean;
  lineDimension?: DistanceKind;
  onLineDimensionChange: (kind: DistanceKind) => void;
  polygonDimension?: PolygonDimensionKind;
  onDimensionChange: (kind: PolygonDimensionKind) => void;
  onUndo: () => void;
  onCancel: () => void;
  onSave: () => void;
}

export interface AddSheetProps {
  mode: InteractionMode;
  settingsReady: boolean;
  shape: ActiveShapeProps | null;
  onPinToggle: () => void;
  onStartShape: (kind: "line" | "polygon") => void;
}

export function AddSheet(props: AddSheetProps) {
  if (props.shape) return <ShapeActionPanel {...props.shape} />;
  return (
    <div className="sheet-tools">
      <div className="tool-buttons" role="group" aria-label="Drawing tools">
        <button type="button" aria-pressed={props.mode === "pin"} onClick={props.onPinToggle}>Pin</button>
        <button type="button" disabled={!props.settingsReady} onClick={() => props.onStartShape("line")}>Line</button>
        <button type="button" disabled={!props.settingsReady} onClick={() => props.onStartShape("polygon")}>Area</button>
      </div>
      <p className="sheet-hint">Choose a tool, then click or tap the map.</p>
    </div>
  );
}
