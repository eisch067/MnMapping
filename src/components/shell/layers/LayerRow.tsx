import { ChevronDownIcon, ChevronUpIcon } from "@/components/ui/MapIcons";
import { isLayerAvailableAtCameraHeight, type LayerDefinition } from "@/config/layers/types";
import { dnrLicenseParagraphs, dnrLicenseUrl } from "@/lib/dnr/license";
import { evaluateFreshness } from "@/lib/dnr/freshness";
import { meaningStatements } from "@/lib/dnr/meaning";
import type { SeasonGate } from "@/lib/dnr/season";
import type { SeasonGates } from "@/lib/dnr/seasonGate";
import { awaitsZoom } from "@/lib/dnr/zoom";
import type { LayerRuntimeState, LayerRuntimeStateById } from "@/lib/map/layerRuntime";
import type { LayerStateById, SuspendedByGroup } from "@/lib/map/layerState";
import { accessMeaningLabel, metadataLine } from "./layerGrouping";

export interface LayerControls {
  state: LayerStateById;
  suspended: SuspendedByGroup;
  cameraHeight: number;
  runtimeState: LayerRuntimeStateById;
  seasonGates: SeasonGates;
  onVisibilityChange: (id: string, visible: boolean) => void;
  onToggleGroup: (groupId: string, layerIds: readonly string[]) => void;
  onToggleCategory: (groupId: string, layerIds: readonly string[], visible: boolean) => void;
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
  const gate = controls.seasonGates[layer.id];
  return (
    <div className={`layer-row ${unavailable ? "is-scale-locked" : ""}`}>
      <div className="layer-row-heading">
        <LayerToggle
          layer={layer}
          season={gate}
          checked={layerState.visible}
          disabled={unavailable || isSeasonLocked(gate)}
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
      {layer.dnr?.caution && <p className="layer-caution">{layer.dnr.caution}</p>}
      <SeasonNotice gate={gate} />
      <FreshnessNotice layer={layer} />
      <ZoomHint layer={layer} visible={layerState.visible} cameraHeight={controls.cameraHeight} />
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
  season: SeasonGate | undefined;
  checked: boolean;
  disabled: boolean;
  onChange: (visible: boolean) => void;
}

function LayerToggle({ layer, season, checked, disabled, onChange }: LayerToggleProps) {
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
        {season?.status === "current" && (
          <span className="layer-season">Season: {season.label}</span>
        )}
        {layer.dnr?.freshness && (
          <span className="layer-season">
            Freshness: {layer.dnr.freshness.label} · source content {layer.dnr.freshness.contentDate}
          </span>
        )}
        {layer.accessMeaning && (
          <span className="land-meaning">{accessMeaningLabel(layer.accessMeaning)}</span>
        )}
        {layer.dnr && (
          <span className="land-meaning">{meaningStatements[layer.dnr.meaningClass]}</span>
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
      {layer.dnr && <DnrLicense />}
    </details>
  );
}

function isSeasonLocked(gate: SeasonGate | undefined): boolean {
  return gate !== undefined && gate.status !== "current";
}

interface ZoomHintProps {
  layer: LayerDefinition;
  visible: boolean;
  cameraHeight: number;
}

function ZoomHint({ layer, visible, cameraHeight }: ZoomHintProps) {
  if (!awaitsZoom(layer, visible, cameraHeight)) return null;
  return (
    <p className="layer-load-status is-hint" role="status">
      Zoom in to load {layer.name}.
    </p>
  );
}

function SeasonNotice({ gate }: { gate: SeasonGate | undefined }) {
  if (gate === undefined || gate.status === "current") return null;
  if (gate.status === "checking") {
    return (
      <p className="layer-load-status is-loading" role="status">
        Checking season data…
      </p>
    );
  }
  return (
    <div className="layer-season-notice" role="status">
      <strong>Season data not verified</strong>
      <span>Last verified: {gate.lastVerified}</span>
      <a href={gate.officialUrl} target="_blank" rel="noreferrer">
        Check the official DNR source ↗
      </a>
    </div>
  );
}

function FreshnessNotice({ layer }: { layer: LayerDefinition }) {
  if (!layer.dnr?.freshness) return null;
  const status = evaluateFreshness(layer.dnr.freshness);
  if (!status.stale) return null;
  return (
    <div className="layer-season-notice" role="status">
      <strong>Source freshness warning</strong>
      <span>{status.warning}</span>
      <span>The layer remains available.</span>
    </div>
  );
}

function DnrLicense() {
  return (
    <details className="dnr-license">
      <summary>DNR data license</summary>
      {dnrLicenseParagraphs.map((paragraph) => (
        <p key={paragraph}>{paragraph}</p>
      ))}
      <a href={dnrLicenseUrl} target="_blank" rel="noreferrer">
        Official license page
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
