import type { InteractionMode } from "@/components/map/CesiumMap";
import { isDrawMode, minimumVertices } from "./useMapTools";

export interface AddSheetProps {
  mode: InteractionMode;
  vertexCount: number;
  onModeChange: (mode: InteractionMode) => void;
  onFinish: () => void;
}

const drawTools = [
  { mode: "pin", label: "Pin", hint: "Click or tap the map to drop a pin." },
  { mode: "line", label: "Line", hint: "Click or tap the map to add points, then choose Finish." },
  {
    mode: "polygon",
    label: "Area",
    hint: "Click or tap the map to add corners, then choose Finish.",
  },
] as const;

export function AddSheet({ mode, vertexCount, onModeChange, onFinish }: AddSheetProps) {
  const activeTool = drawTools.find((tool) => tool.mode === mode);
  const canFinish = isDrawMode(mode) && vertexCount >= minimumVertices(mode);
  return (
    <div className="sheet-tools">
      <div className="tool-buttons" role="group" aria-label="Drawing tools">
        {drawTools.map((tool) => (
          <button
            key={tool.mode}
            type="button"
            aria-pressed={mode === tool.mode}
            onClick={() => onModeChange(mode === tool.mode ? "inspect" : tool.mode)}
          >
            {tool.label}
          </button>
        ))}
      </div>
      {isDrawMode(mode) && (
        <button className="tool-finish" type="button" disabled={!canFinish} onClick={onFinish}>
          Finish ({vertexCount})
        </button>
      )}
      <p className="sheet-hint">
        {activeTool?.hint ?? "Choose a tool, then click or tap the map."}
      </p>
    </div>
  );
}
