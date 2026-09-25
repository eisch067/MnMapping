import { ChevronDownIcon, ChevronUpIcon } from "@/components/ui/MapIcons";
import { isLayerAvailableAtCameraHeight, type LayerDefinition } from "@/config/layers/types";
import type { LayerRuntimeState, LayerRuntimeStateById } from "@/lib/map/layerRuntime";
import type { LayerStateById } from "@/lib/map/layerState";
import { accessMeaningLabel, metadataLine } from "./layerGrouping";

export interface LayerControls {
  state: LayerStateById;
  cameraHeight: number;
  runtimeState: LayerRuntimeStateById;
  onVisibilityChange: (id: string, visible: boolean) => void;
  onOpacityChange: (id: string, opacity: number) => void;
  onMoveLayer: (id: string, direction: "up" | "down") => void;
  onRetryLayer: (id: string) => void;
}

interface LayerRowsProps {
  layers: readonly LayerDefinition[];
  controls: LayerControls;
  // The sheet lists the topmost layer first, so stacks stored bottom-to-top are shown reversed.
  reverse?: boolean;
}

export function LayerRows({ layers, controls, reverse = false }: LayerRowsProps) {
  return (reverse ? [...layers].reverse() : layers).map((layer) => (
    <LayerRow key={layer.id} layer={layer} controls={controls} />
  ));
}

function LayerRow({ layer, controls }: { layer: LayerDefinition; controls: LayerControls }) {
  const layerState = controls.state[layer.id] ?? {
    visible: layer.defaultVisible,
    opacity: layer.defaultOpacity,
  };
  const unavailable =
    Boolean(layer.unavailableMessage) &&
    !isLayerAvailableAtCameraHeight(layer, controls.cameraHeight);
  return (
    <div className={`layer-row ${unavailable ? "is-scale-locked" : ""}`}>
      <div className="layer-row-heading">
        <LayerToggle
          layer={layer}
          checked={layerState.visible}
          disabled={unavailable}
          onChange={(visible) => controls.onVisibilityChange(layer.id, visible)}
        />
        <span className="layer-order-controls" aria-label={`${layer.name} display order`}>
          <button
            type="button"
            title="Move above"
            aria-label={`Move ${layer.name} above`}
            onClick={() => controls.onMoveLayer(layer.id, "up")}
          >
            <ChevronUpIcon />
          </button>
          <button
            type="button"
            title="Move below"
            aria-label={`Move ${layer.name} below`}
            onClick={() => controls.onMoveLayer(layer.id, "down")}
          >
            <ChevronDownIcon />
          </button>
        </span>
      </div>
      <label className="opacity-control">
        <span>Opacity</span>
        <input
          aria-label={`${layer.name} opacity`}
          type="range"
          min="0"
          max="100"
          step="1"
          value={Math.round(layerState.opacity * 100)}
          onChange={(event) => controls.onOpacityChange(layer.id, Number(event.target.value) / 100)}
        />
        <output>{Math.round(layerState.opacity * 100)}%</output>
      </label>
      <LayerInfo layer={layer} />
      {layerState.visible && (
        <LayerLoadStatus
          runtime={controls.runtimeState[layer.id]}
          onRetry={() => controls.onRetryLayer(layer.id)}
        />
      )}
      {unavailable && <div className="layer-scale-overlay">{layer.unavailableMessage}</div>}
    </div>
  );
}

interface LayerToggleProps {
  layer: LayerDefinition;
  checked: boolean;
  disabled: boolean;
  onChange: (visible: boolean) => void;
}

function LayerToggle({ layer, checked, disabled, onChange }: LayerToggleProps) {
  return (
    <label className="layer-toggle">
      <input
        type="checkbox"
        checked={checked}
        disabled={disabled}
        onChange={(event) => onChange(event.target.checked)}
      />
      <span>
        <span className="layer-name-line">
          {layer.category === "public-land" && (
            <span
              className="legend-swatch"
              aria-hidden="true"
              style={{
                background: String(layer.options?.fillColor ?? "#8654E0"),
                borderColor: String(layer.options?.strokeColor ?? "#D6C6FF"),
              }}
            />
          )}
          <span className="layer-name">{layer.name}</span>
        </span>
        <span className="layer-meta">{metadataLine(layer)}</span>
        {layer.accessMeaning && (
          <span className="land-meaning">{accessMeaningLabel(layer.accessMeaning)}</span>
        )}
      </span>
    </label>
  );
}

function LayerInfo({ layer }: { layer: LayerDefinition }) {
  return (
    <details className="layer-details">
      <summary>Info</summary>
      <p>{layer.description ?? "No additional source notes."}</p>
      <p>{layer.agency ?? layer.attribution}</p>
      <a href={layer.sourceUrl ?? layer.url} target="_blank" rel="noreferrer">
        Service metadata
      </a>
    </details>
  );
}

function LayerLoadStatus({
  runtime,
  onRetry,
}: {
  runtime: LayerRuntimeState | undefined;
  onRetry: () => void;
}) {
  if (runtime?.status === "loading") {
    return (
      <p className="layer-load-status is-loading" role="status">
        {runtime.message ?? "Loading…"}
      </p>
    );
  }
  if (runtime?.status === "error") {
    return (
      <div className="layer-load-status is-error" role="alert">
        <span>{runtime.message ?? "This layer could not be loaded."}</span>
        <button type="button" onClick={onRetry}>
          Retry
        </button>
      </div>
    );
  }
  return null;
}
