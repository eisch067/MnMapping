import type { PolygonDimensionKind } from "@/lib/myData";

interface ShapeActionPanelProps {
  editing: boolean;
  kind: "line" | "polygon";
  itemName?: string;
  vertexCount: number;
  minimumVertices: number;
  canUndo: boolean;
  measurement: string | null;
  polygonDimension?: PolygonDimensionKind;
  onDimensionChange: (kind: PolygonDimensionKind) => void;
  onUndo: () => void;
  onCancel: () => void;
  onSave: () => void;
}

export function ShapeActionPanel(props: ShapeActionPanelProps) {
  const title = props.editing ? `Editing ${props.itemName ?? "shape"}` : `Drawing ${props.kind}`;
  const canSave = props.vertexCount >= props.minimumVertices;
  return (
    <div className="shape-action-panel">
      <span className="shape-kicker">{title}</span>
      <strong>{props.vertexCount} {props.vertexCount === 1 ? "vertex" : "vertices"}</strong>
      <p>{props.measurement ?? "Place vertices on the map. Segment labels update live."}</p>
      {props.kind === "polygon" && (
        <fieldset className="shape-dimension-picker">
          <legend>Primary dimension</legend>
          {(["area", "perimeter", "both"] as const).map((kind) => (
            <button key={kind} type="button" aria-pressed={props.polygonDimension === kind} onClick={() => props.onDimensionChange(kind)}>
              {kind === "both" ? "Both" : kind[0].toUpperCase() + kind.slice(1)}
            </button>
          ))}
        </fieldset>
      )}
      {props.editing && <p>Select a + midpoint on the map to insert a vertex.</p>}
      <div className="shape-actions">
        <button type="button" disabled={!props.canUndo} onClick={props.onUndo}>Undo</button>
        <button type="button" onClick={props.onCancel}>Cancel</button>
        <button className="is-primary" type="button" disabled={!canSave} onClick={props.onSave}>
          {props.editing ? "Save shape" : "Finish"}
        </button>
      </div>
    </div>
  );
}
