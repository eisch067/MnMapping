"use client";

import { useEffect, useState } from "react";
import { MapIcon, PinIcon } from "@/components/ui/MapIcons";

// PROTOTYPE: Three exact-identify and geometry-editing interaction models on the existing map route.
export type InteractionPrototypeVariant = "A" | "B" | "C";

type Tool = "inspect" | "pin" | "line" | "area";
type Selection = "stack" | "pin" | "route" | null;
type Measurement = "distance" | "area" | "both";
type Point = { x: number; y: number };

const variants: readonly InteractionPrototypeVariant[] = ["A", "B", "C"];
const variantNames: Record<InteractionPrototypeVariant, string> = {
  A: "Context sheet",
  B: "Inspector rail",
  C: "Focus workflow",
};
const drawPoints: readonly Point[] = [
  { x: 28, y: 41 },
  { x: 42, y: 31 },
  { x: 59, y: 44 },
  { x: 68, y: 29 },
  { x: 77, y: 48 },
];
const originalRoute: readonly Point[] = [
  { x: 23, y: 62 },
  { x: 39, y: 51 },
  { x: 57, y: 59 },
  { x: 73, y: 45 },
];

interface PrototypeState {
  tool: Tool;
  selection: Selection;
  drawing: Point[];
  editing: boolean;
  editPoints: Point[];
  editHistory: Point[][];
  measurement: Measurement;
}

interface VariantProps extends PrototypeState {
  setTool: (tool: Tool) => void;
  select: (selection: Selection) => void;
  addVertex: () => void;
  beginEdit: () => void;
  insertMidpoint: (index: number) => void;
  undo: () => void;
  cancel: () => void;
  finish: () => void;
  setMeasurement: (measurement: Measurement) => void;
}

export function MapInteractionPrototype({
  variant,
  onVariantChange,
}: {
  variant: InteractionPrototypeVariant;
  onVariantChange: (variant: InteractionPrototypeVariant) => void;
}) {
  const [tool, setToolState] = useState<Tool>("inspect");
  const [selection, setSelection] = useState<Selection>(null);
  const [drawing, setDrawing] = useState<Point[]>([]);
  const [editing, setEditing] = useState(false);
  const [editPoints, setEditPoints] = useState<Point[]>([...originalRoute]);
  const [editHistory, setEditHistory] = useState<Point[][]>([]);
  const [measurement, setMeasurement] = useState<Measurement>("distance");

  const setTool = (nextTool: Tool) => {
    setToolState(nextTool);
    setSelection(null);
    setEditing(false);
    setDrawing([]);
  };
  const select = (nextSelection: Selection) => {
    if (tool !== "inspect") return;
    setSelection(nextSelection);
    setEditing(false);
  };
  const addVertex = () => {
    if (tool !== "line" && tool !== "area") return;
    setDrawing((current) => current.length < drawPoints.length ? [...current, drawPoints[current.length]] : current);
  };
  const beginEdit = () => {
    setSelection("route");
    setEditing(true);
    setEditPoints([...originalRoute]);
    setEditHistory([]);
  };
  const insertMidpoint = (index: number) => {
    setEditHistory((current) => [...current, editPoints]);
    setEditPoints((current) => {
      const first = current[index];
      const second = current[index + 1];
      if (!first || !second) return current;
      const midpoint = { x: (first.x + second.x) / 2, y: (first.y + second.y) / 2 };
      return [...current.slice(0, index + 1), midpoint, ...current.slice(index + 1)];
    });
  };
  const undo = () => {
    if (editing) {
      const previous = editHistory.at(-1);
      if (!previous) return;
      setEditPoints(previous);
      setEditHistory((current) => current.slice(0, -1));
      return;
    }
    setDrawing((current) => current.slice(0, -1));
  };
  const cancel = () => {
    setToolState("inspect");
    setSelection(null);
    setDrawing([]);
    setEditing(false);
    setEditPoints([...originalRoute]);
    setEditHistory([]);
  };
  const finish = () => {
    setToolState("inspect");
    setSelection("route");
    setDrawing([]);
    setEditing(false);
    setEditHistory([]);
  };
  const props: VariantProps = {
    tool,
    selection,
    drawing,
    editing,
    editPoints,
    editHistory,
    measurement,
    setTool,
    select,
    addVertex,
    beginEdit,
    insertMidpoint,
    undo,
    cancel,
    finish,
    setMeasurement,
  };

  return (
    <div className="interaction-prototype" data-tool={tool}>
      <MapGeometry {...props} />
      {variant === "A" && <ContextSheetVariant {...props} />}
      {variant === "B" && <InspectorRailVariant {...props} />}
      {variant === "C" && <FocusWorkflowVariant {...props} />}
      <PrototypeSwitcher current={variant} onChange={onVariantChange} />
    </div>
  );
}

function MapGeometry(props: VariantProps) {
  const points = props.editing ? props.editPoints : props.drawing;
  const showExistingRoute = props.drawing.length === 0;
  const path = points.map((point) => `${point.x},${point.y}`).join(" ");
  return (
    <div className="interaction-map-layer" aria-label="Prototype map interaction targets">
      <svg className="interaction-geometry" viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true">
        {showExistingRoute && !props.editing && <polyline className="interaction-existing-line" points={originalRoute.map((point) => `${point.x},${point.y}`).join(" ")} />}
        {points.length > 1 && <polyline className="interaction-active-line" points={path} />}
        {props.tool === "area" && points.length > 2 && <polygon className="interaction-area-fill" points={path} />}
      </svg>
      <button className="interaction-hit interaction-hit-stack" type="button" onClick={() => props.select("stack")} aria-label="Inspect overlapping features">
        <span className="interaction-crosshair" />
        <small>Exact click</small>
      </button>
      <button className="interaction-hit interaction-hit-pin" type="button" onClick={() => props.select("pin")} aria-label="Select saved pin">
        <PinIcon /><small>Camp</small>
      </button>
      <button className="interaction-hit interaction-hit-route" type="button" onClick={() => props.select("route")} aria-label="Select saved route">
        <span />
        <small>Scout route</small>
      </button>
      {(props.tool === "line" || props.tool === "area") && <button className="interaction-add-vertex" type="button" onClick={props.addVertex}>+ Place vertex</button>}
      {points.map((point, index) => (
        <button
          className="interaction-vertex"
          style={{ left: `${point.x}%`, top: `${point.y}%` }}
          type="button"
          key={`${point.x}-${point.y}-${index}`}
          aria-label={`Vertex ${index + 1}`}
        >{index + 1}</button>
      ))}
      {props.editing && props.editPoints.slice(0, -1).map((point, index) => {
        const next = props.editPoints[index + 1];
        return (
          <button
            className="interaction-midpoint"
            style={{ left: `${(point.x + next.x) / 2}%`, top: `${(point.y + next.y) / 2}%` }}
            type="button"
            key={`mid-${index}`}
            onClick={() => props.insertMidpoint(index)}
            aria-label={`Insert point between vertices ${index + 1} and ${index + 2}`}
          >+</button>
        );
      })}
      {points.slice(0, -1).map((point, index) => {
        const next = points[index + 1];
        return <span className="interaction-segment-label" style={{ left: `${(point.x + next.x) / 2}%`, top: `${(point.y + next.y) / 2 - 4}%` }} key={`label-${index}`}>{(0.18 + index * 0.11).toFixed(2)} mi</span>;
      })}
    </div>
  );
}

function ContextSheetVariant(props: VariantProps) {
  return (
    <>
      <header className="interaction-compact-header"><strong>MnMapping</strong><span>Heartland Trail</span></header>
      <div className="interaction-a-tools"><button type="button" aria-pressed={props.tool === "inspect"} onClick={() => props.setTool("inspect")}>Explore</button><button type="button" onClick={() => props.setTool("pin")}>Pin</button><button type="button" onClick={() => props.setTool("line")}>Line</button><button type="button" onClick={() => props.setTool("area")}>Area</button></div>
      {(props.selection || props.editing || props.drawing.length > 0 || props.tool !== "inspect") && <section className="interaction-bottom-sheet">
        <span className="interaction-sheet-handle" />
        <PanelContent {...props} compact />
      </section>}
      <nav className="interaction-a-dock"><button type="button" onClick={() => props.setTool("inspect")}><MapIcon /><span>Explore</span></button><button type="button" onClick={() => props.setTool("pin")}><PinIcon /><span>Add</span></button><button type="button"><span className="interaction-letter-icon">M</span><span>My Data</span></button></nav>
    </>
  );
}

function InspectorRailVariant(props: VariantProps) {
  return (
    <>
      <nav className="interaction-b-toolbar" aria-label="Interaction tools">
        {(["inspect", "pin", "line", "area"] as const).map((tool) => <button type="button" key={tool} aria-pressed={props.tool === tool} onClick={() => props.setTool(tool)}>{tool.slice(0, 1).toUpperCase()}<span>{tool}</span></button>)}
      </nav>
      <aside className="interaction-side-inspector">
        <header><small>Map inspector</small><strong>{panelTitle(props)}</strong></header>
        <PanelContent {...props} />
      </aside>
      {(props.editing || props.drawing.length > 0) && <ActionBar {...props} />}
    </>
  );
}

function FocusWorkflowVariant(props: VariantProps) {
  const activeTask = props.editing ? "Edit route" : props.tool === "inspect" ? "Explore map" : `Add ${props.tool}`;
  return (
    <>
      <header className="interaction-focus-header"><button type="button" onClick={props.cancel}>Cancel</button><span><small>Current task</small><strong>{activeTask}</strong></span><button type="button" onClick={props.finish}>Done</button></header>
      {!props.selection && props.tool === "inspect" && <section className="interaction-focus-prompt"><strong>Tap one exact point</strong><span>Results from every visible layer will appear here.</span></section>}
      <section className="interaction-command-tray">
        <PanelContent {...props} compact />
        {!props.selection && props.tool === "inspect" && <div className="interaction-tool-cards"><button type="button" onClick={() => props.setTool("pin")}><PinIcon /><span><strong>Drop a pin</strong><small>Save one exact location</small></span></button><button type="button" onClick={() => props.setTool("line")}><span className="interaction-line-glyph" /><span><strong>Draw a route</strong><small>Show distance as you draw</small></span></button><button type="button" onClick={() => props.setTool("area")}><span className="interaction-area-glyph" /><span><strong>Draw an area</strong><small>Choose area or perimeter</small></span></button></div>}
      </section>
    </>
  );
}

function PanelContent(props: VariantProps & { compact?: boolean }) {
  if (props.editing) return <EditPanel {...props} />;
  if (props.drawing.length > 0 || props.tool === "line" || props.tool === "area") return <DrawingPanel {...props} />;
  if (props.selection) return <ResultsPanel {...props} />;
  return <div className="interaction-empty-state"><MapIcon /><strong>Inspect the map</strong><span>Select the crosshair, pin, or route to try the workflow.</span></div>;
}

function ResultsPanel(props: VariantProps) {
  if (props.selection === "pin") {
    return <div className="interaction-results"><span className="interaction-kicker">My Data pin</span><h2>North camp</h2><p>47.008214, -95.106483</p><div className="interaction-result-actions"><button type="button">Directions</button><button type="button">Move pin</button></div></div>;
  }
  if (props.selection === "route") {
    return <div className="interaction-results"><span className="interaction-kicker">My Data line</span><h2>Scout route</h2><p>1.42 mi horizontal distance</p><div className="interaction-result-actions"><button type="button" onClick={props.beginEdit}>Edit shape</button><button type="button">Details</button></div></div>;
  }
  return (
    <div className="interaction-results">
      <span className="interaction-kicker">3 results at exact point</span>
      <h2>47.006381, -95.082144</h2>
      <button className="interaction-result-row is-selected" type="button"><span className="interaction-result-swatch parcel" /><span><strong>Parcel 24.31.02040</strong><small>Hubbard County parcels</small></span><b>›</b></button>
      <button className="interaction-result-row" type="button"><span className="interaction-result-swatch public" /><span><strong>State forest land</strong><small>Public land ownership</small></span><b>›</b></button>
      <button className="interaction-result-row" type="button" onClick={() => props.select("pin")}><span className="interaction-result-swatch personal" /><span><strong>North camp</strong><small>My Data pin</small></span><b>›</b></button>
      <p className="interaction-source-note">Topmost visible layer first. Select a row for its details and official source link.</p>
    </div>
  );
}

function DrawingPanel(props: VariantProps) {
  const minimum = props.tool === "area" ? 3 : 2;
  return (
    <div className="interaction-drawing-panel">
      <span className="interaction-kicker">Drawing {props.tool}</span>
      <h2>{props.drawing.length ? `${props.drawing.length} live vertices` : "Place the first vertex"}</h2>
      <p>{props.drawing.length > 1 ? `${(props.drawing.length * 0.31).toFixed(2)} mi horizontal distance` : "Tap + Place vertex on the map. Segment labels update live."}</p>
      <MeasurementPicker value={props.measurement} onChange={props.setMeasurement} area={props.tool === "area"} />
      <div className="interaction-result-actions"><button type="button" disabled={props.drawing.length === 0} onClick={props.undo}>Undo</button><button type="button" onClick={props.cancel}>Cancel</button><button className="is-primary" type="button" disabled={props.drawing.length < minimum} onClick={props.finish}>Finish</button></div>
    </div>
  );
}

function EditPanel(props: VariantProps) {
  return (
    <div className="interaction-edit-panel">
      <span className="interaction-kicker">Editing Scout route</span>
      <h2>{props.editPoints.length} vertices · 1.42 mi</h2>
      <p>Drag numbered vertices. Select a + midpoint to insert a new vertex.</p>
      <MeasurementPicker value={props.measurement} onChange={props.setMeasurement} area={false} />
      <div className="interaction-result-actions"><button type="button" disabled={props.editHistory.length === 0} onClick={props.undo}>Undo</button><button type="button" onClick={props.cancel}>Cancel</button><button className="is-primary" type="button" onClick={props.finish}>Save shape</button></div>
    </div>
  );
}

function MeasurementPicker({ value, onChange, area }: { value: Measurement; onChange: (measurement: Measurement) => void; area: boolean }) {
  return (
    <fieldset className="interaction-measurement-picker"><legend>Primary dimension</legend><button type="button" aria-pressed={value === "distance"} onClick={() => onChange("distance")}>{area ? "Perimeter" : "Distance"}</button>{area && <button type="button" aria-pressed={value === "area"} onClick={() => onChange("area")}>Area</button>}<button type="button" aria-pressed={value === "both"} onClick={() => onChange("both")}>Both</button></fieldset>
  );
}

function ActionBar(props: VariantProps) {
  return <div className="interaction-action-bar"><button type="button" onClick={props.undo}>Undo</button><button type="button" onClick={props.cancel}>Cancel</button><button type="button" onClick={props.finish}>Done</button></div>;
}

function panelTitle(props: VariantProps) {
  if (props.editing) return "Edit Scout route";
  if (props.tool === "line" || props.tool === "area") return `Draw ${props.tool}`;
  if (props.selection === "stack") return "Results at point";
  if (props.selection === "pin") return "North camp";
  if (props.selection === "route") return "Scout route";
  return "Nothing selected";
}

function PrototypeSwitcher({ current, onChange }: { current: InteractionPrototypeVariant; onChange: (variant: InteractionPrototypeVariant) => void }) {
  const cycle = (direction: -1 | 1) => {
    const index = variants.indexOf(current);
    onChange(variants[(index + direction + variants.length) % variants.length]);
  };
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement | null;
      if (target?.matches("input, textarea, [contenteditable]")) return;
      if (event.key === "ArrowLeft") cycle(-1);
      if (event.key === "ArrowRight") cycle(1);
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  });
  return (
    <nav className="interaction-prototype-switcher" aria-label="Interaction prototype variants">
      <button type="button" onClick={() => cycle(-1)} aria-label="Previous variant">←</button>
      <span><small>Interaction prototype</small><strong>{current} · {variantNames[current]}</strong></span>
      <button type="button" onClick={() => cycle(1)} aria-label="Next variant">→</button>
    </nav>
  );
}
