"use client";

import { useEffect, useRef } from "react";
import type { InteractionMode } from "./CesiumMap";
import { LayersIcon, LocateIcon, MapIcon, PinIcon, SearchIcon, TerrainIcon } from "@/components/ui/MapIcons";

// PROTOTYPE: Three mobile-first map-shell variants, switchable via ?variant=, on the existing map route.
export type PrototypeVariant = "A" | "B" | "C";
export type PrototypePanel = "layers" | "data" | null;

const variants: readonly PrototypeVariant[] = ["A", "B", "C"];
const variantNames: Record<PrototypeVariant, string> = {
  A: "Sheet + dock",
  B: "Edge tabs",
  C: "Map-first orb",
};

interface VariantProps {
  panel: PrototypePanel;
  locationLabel: string;
  county?: string;
  mode: InteractionMode;
  railPinned: boolean;
  onPanelChange: (panel: PrototypePanel) => void;
  onModeChange: (mode: InteractionMode) => void;
  onMapView: () => void;
  onTerrain: () => void;
  onRecenter: () => void;
  onChangeArea: () => void;
  onRailPinnedChange: (pinned: boolean) => void;
}

export function MobileMapShellPrototype({
  variant,
  onVariantChange,
  ...props
}: VariantProps & { variant: PrototypeVariant; onVariantChange: (variant: PrototypeVariant) => void }) {
  return (
    <>
      {variant === "A" && <VariantA {...props} />}
      {variant === "B" && <VariantB {...props} />}
      {variant === "C" && <VariantC {...props} />}
      <SheetTabs panel={props.panel} onPanelChange={props.onPanelChange} />
      <DesktopRail {...props} />
      <PrototypeSwitcher current={variant} onChange={onVariantChange} />
    </>
  );
}

export function VariantA(props: VariantProps) {
  return (
    <>
      <header className="prototype-mobile-header prototype-a-header">
        <span className="prototype-brand"><PinIcon /><strong>MnMapping</strong></span>
        <button type="button" onClick={props.onChangeArea}><span>{props.county ?? "Minnesota"}</span><SearchIcon /></button>
      </header>
      <nav className="prototype-tool-stack" aria-label="Map view tools">
        <button type="button" onClick={props.onRecenter} aria-label="Recenter map"><LocateIcon /></button>
        <button type="button" onClick={props.onTerrain} aria-label="Show terrain"><TerrainIcon /></button>
      </nav>
      <nav className="prototype-bottom-dock" aria-label="Primary map tools">
        <button type="button" aria-pressed={props.mode === "inspect"} onClick={() => props.onModeChange("inspect")}><MapIcon /><span>Explore</span></button>
        <button type="button" aria-pressed={props.panel === "layers"} onClick={() => props.onPanelChange(props.panel === "layers" ? null : "layers")}><LayersIcon /><span>Layers</span></button>
        <button className="prototype-primary-action" type="button" aria-pressed={props.mode === "pin"} onClick={() => props.onModeChange("pin")}><PinIcon /><span>Add</span></button>
        <button type="button" aria-pressed={props.panel === "data"} onClick={() => props.onPanelChange(props.panel === "data" ? null : "data")}><span className="prototype-letter-icon">M</span><span>My Data</span></button>
        <button type="button" onClick={props.onMapView}><span className="prototype-letter-icon">2D</span><span>Map</span></button>
      </nav>
    </>
  );
}

export function VariantB(props: VariantProps) {
  return (
    <>
      <header className="prototype-location-chip">
        <PinIcon />
        <span><strong>{props.locationLabel}</strong><small>{props.county ?? "Minnesota"}</small></span>
        <button type="button" onClick={props.onChangeArea} aria-label="Change area"><SearchIcon /></button>
      </header>
      <nav className="prototype-edge-tabs" aria-label="Map drawers">
        <button type="button" aria-pressed={props.panel === "layers"} onClick={() => props.onPanelChange(props.panel === "layers" ? null : "layers")}><LayersIcon /><span>Layers</span></button>
        <button type="button" aria-pressed={props.panel === "data"} onClick={() => props.onPanelChange(props.panel === "data" ? null : "data")}><PinIcon /><span>My Data</span></button>
      </nav>
      <nav className="prototype-tool-belt" aria-label="Map tools">
        <button type="button" aria-pressed={props.mode === "inspect"} onClick={() => props.onModeChange("inspect")}><MapIcon />Inspect</button>
        <button type="button" aria-pressed={props.mode === "pin"} onClick={() => props.onModeChange("pin")}><PinIcon />Pin</button>
        <button type="button" aria-pressed={props.mode === "line"} onClick={() => props.onModeChange("line")}>Line</button>
        <button type="button" aria-pressed={props.mode === "polygon"} onClick={() => props.onModeChange("polygon")}>Area</button>
      </nav>
    </>
  );
}

export function VariantC(props: VariantProps) {
  return (
    <>
      <button className="prototype-map-title" type="button" onClick={props.onChangeArea}>
        <span><strong>{props.county ?? "Minnesota"}</strong><small>{props.locationLabel}</small></span><SearchIcon />
      </button>
      <nav className="prototype-orb-actions" aria-label="Map actions">
        <button type="button" onClick={props.onRecenter} aria-label="Recenter"><LocateIcon /></button>
        <button type="button" aria-pressed={props.panel === "layers"} onClick={() => props.onPanelChange(props.panel === "layers" ? null : "layers")} aria-label="Layers"><LayersIcon /></button>
        <button className="prototype-orb" type="button" aria-pressed={props.mode === "pin"} onClick={() => props.onModeChange(props.mode === "pin" ? "inspect" : "pin")}><PinIcon /><span>{props.mode === "pin" ? "Cancel" : "Add"}</span></button>
        <button type="button" aria-pressed={props.panel === "data"} onClick={() => props.onPanelChange(props.panel === "data" ? null : "data")} aria-label="My Data"><span className="prototype-letter-icon">M</span></button>
        <button type="button" onClick={props.onTerrain} aria-label="Terrain"><TerrainIcon /></button>
      </nav>
    </>
  );
}

function SheetTabs({ panel, onPanelChange }: Pick<VariantProps, "panel" | "onPanelChange">) {
  const startX = useRef<number | null>(null);
  if (!panel) return null;
  return (
    <div
      className="prototype-sheet-tabs"
      onTouchStart={(event) => { startX.current = event.touches[0]?.clientX ?? null; }}
      onTouchEnd={(event) => {
        if (startX.current === null) return;
        const distance = (event.changedTouches[0]?.clientX ?? startX.current) - startX.current;
        if (Math.abs(distance) > 45) onPanelChange(distance < 0 ? "data" : "layers");
        startX.current = null;
      }}
    >
      <span className="prototype-sheet-handle" aria-hidden="true" />
      <button type="button" aria-pressed={panel === "layers"} onClick={() => onPanelChange("layers")}>Layers</button>
      <button type="button" aria-pressed={panel === "data"} onClick={() => onPanelChange("data")}>My Data</button>
      <button className="prototype-sheet-close" type="button" onClick={() => onPanelChange(null)} aria-label="Close drawer">×</button>
    </div>
  );
}

function DesktopRail(props: VariantProps) {
  return (
    <aside className="prototype-desktop-rail" aria-label="Map workspace rail">
      <span className="prototype-rail-brand"><PinIcon /></span>
      <button type="button" aria-pressed={props.panel === "layers"} onClick={() => props.onPanelChange("layers")}><LayersIcon /><span>Layers</span></button>
      <button type="button" aria-pressed={props.panel === "data"} onClick={() => props.onPanelChange("data")}><PinIcon /><span>My Data</span></button>
      <button type="button" onClick={props.onTerrain}><TerrainIcon /><span>Terrain</span></button>
      <button type="button" onClick={props.onRecenter}><LocateIcon /><span>Recenter</span></button>
      <button className="prototype-rail-pin" type="button" aria-pressed={props.railPinned} onClick={() => props.onRailPinnedChange(!props.railPinned)}>
        <span className="prototype-letter-icon">{props.railPinned ? "←" : "→"}</span><span>{props.railPinned ? "Unpin panel" : "Dock panel"}</span>
      </button>
    </aside>
  );
}

function PrototypeSwitcher({ current, onChange }: { current: PrototypeVariant; onChange: (variant: PrototypeVariant) => void }) {
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
    <nav className="prototype-switcher" aria-label="Prototype variants">
      <button type="button" onClick={() => cycle(-1)} aria-label="Previous variant">←</button>
      <span><small>Prototype</small><strong>{current} · {variantNames[current]}</strong></span>
      <button type="button" onClick={() => cycle(1)} aria-label="Next variant">→</button>
    </nav>
  );
}
