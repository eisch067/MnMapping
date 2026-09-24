"use client";

import { useEffect, useRef, useState } from "react";
import { CompassIcon, EyeIcon, InfoIcon, TerrainIcon } from "@/components/ui/MapIcons";

// PROTOTYPE: Three terrain-analysis and 3D-guidance workflows on the existing map route.
// Answers: what workflow/visual language governs the live compass, first-use control guide,
// ground-clamped overlay indicator, elevation-threshold shading, observer placement, viewshed
// height/range, accuracy disclosures, performance limits, and the Save analysis action.
export type TerrainPrototypeVariant = "A" | "B" | "C";

type Tool = "threshold" | "viewshed" | null;
type SaveState = "idle" | "computing-save" | "saved";
type Point = { x: number; y: number };

const variants: readonly TerrainPrototypeVariant[] = ["A", "B", "C"];
const variantNames: Record<TerrainPrototypeVariant, string> = {
  A: "Sheet tab",
  B: "Guided workspace",
  C: "Floating cards",
};
const drapedLayers = ["Parcel boundary", "Public land", "DNR deer zone"] as const;

interface TerrainState {
  heading: number;
  guideOpen: boolean;
  guideStep: number;
  tool: Tool;
  thresholdFeet: number;
  observer: Point | null;
  eyeHeightFt: number;
  rangeMi: number;
  computing: boolean;
  resultReady: boolean;
  saveState: SaveState;
}

interface ToolProps extends TerrainState {
  rotate: (delta: number) => void;
  dismissGuide: () => void;
  replayGuide: () => void;
  advanceGuide: () => void;
  chooseTool: (tool: Tool) => void;
  setThreshold: (feet: number) => void;
  placeObserver: (point: Point) => void;
  setEyeHeight: (feet: number) => void;
  setRange: (miles: number) => void;
  computeViewshed: () => void;
  save: () => void;
}

export function TerrainAnalysisPrototype({
  variant,
  onVariantChange,
}: {
  variant: TerrainPrototypeVariant;
  onVariantChange: (variant: TerrainPrototypeVariant) => void;
}) {
  const [heading, setHeading] = useState(24);
  const [guideOpen, setGuideOpen] = useState(true);
  const [guideStep, setGuideStep] = useState(0);
  const [tool, setTool] = useState<Tool>(null);
  const [thresholdFeet, setThresholdFeet] = useState(1450);
  const [observer, setObserver] = useState<Point | null>(null);
  const [eyeHeightFt, setEyeHeightFt] = useState(6);
  const [rangeMi, setRangeMi] = useState(1);
  const [computing, setComputing] = useState(false);
  const [resultReady, setResultReady] = useState(false);
  const [saveState, setSaveState] = useState<SaveState>("idle");
  const computeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => () => { if (computeTimer.current) clearTimeout(computeTimer.current); }, []);

  const runCompute = (afterMs: number) => {
    setResultReady(false);
    setComputing(true);
    if (computeTimer.current) clearTimeout(computeTimer.current);
    computeTimer.current = setTimeout(() => {
      setComputing(false);
      setResultReady(true);
    }, afterMs);
  };

  const chooseTool = (nextTool: Tool) => {
    setTool(nextTool);
    setObserver(null);
    setResultReady(false);
    setComputing(false);
    setSaveState("idle");
    if (nextTool === "threshold") runCompute(500);
  };
  const setThreshold = (feet: number) => {
    setThresholdFeet(feet);
    setSaveState("idle");
    runCompute(400);
  };
  const placeObserver = (point: Point) => {
    if (tool !== "viewshed") return;
    setObserver(point);
    setSaveState("idle");
    runCompute(900);
  };
  const setEyeHeight = (feet: number) => {
    setEyeHeightFt(feet);
    if (observer) runCompute(700);
  };
  const setRange = (miles: number) => {
    setRangeMi(miles);
    if (observer) runCompute(700);
  };
  const computeViewshed = () => { if (observer) runCompute(900); };
  const save = () => {
    setSaveState("computing-save");
    setTimeout(() => setSaveState("saved"), 500);
  };

  const props: ToolProps = {
    heading,
    guideOpen,
    guideStep,
    tool,
    thresholdFeet,
    observer,
    eyeHeightFt,
    rangeMi,
    computing,
    resultReady,
    saveState,
    rotate: (delta) => setHeading((current) => (current + delta + 360) % 360),
    dismissGuide: () => setGuideOpen(false),
    replayGuide: () => { setGuideStep(0); setGuideOpen(true); },
    advanceGuide: () => { if (guideStep < 2) setGuideStep(guideStep + 1); else setGuideOpen(false); },
    chooseTool,
    setThreshold,
    placeObserver,
    setEyeHeight,
    setRange,
    computeViewshed,
    save,
  };

  return (
    <div className="terrain-prototype" data-tool={tool ?? "none"}>
      <MockTerrainMap {...props} />
      {variant === "A" && <SheetTabVariant {...props} />}
      {variant === "B" && <GuidedWorkspaceVariant {...props} />}
      {variant === "C" && <FloatingCardsVariant {...props} />}
      <PrototypeSwitcher current={variant} onChange={onVariantChange} />
    </div>
  );
}

function MockTerrainMap(props: ToolProps) {
  const showMask = props.tool === "threshold";
  const maskLevel = 1 - (props.thresholdFeet - 1000) / 1200;
  return (
    <div
      className="terrain-map-layer"
      aria-label="Prototype terrain map"
      onClick={(event) => {
        if (props.tool !== "viewshed") return;
        const bounds = event.currentTarget.getBoundingClientRect();
        props.placeObserver({
          x: ((event.clientX - bounds.left) / bounds.width) * 100,
          y: ((event.clientY - bounds.top) / bounds.height) * 100,
        });
      }}
    >
      <svg className="terrain-contours" viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true">
        <path d="M-5 70 Q 25 50 50 66 T 105 55" />
        <path d="M-5 80 Q 25 62 50 78 T 105 68" />
        <path d="M-5 90 Q 25 74 50 88 T 105 80" />
        <polygon className="terrain-drape-parcel" points="12,30 30,24 34,40 14,44" />
        <polygon className="terrain-drape-public" points="55,18 78,22 74,38 52,36" />
      </svg>
      {showMask && !props.computing && props.resultReady && (
        <div className="terrain-threshold-mask" style={{ opacity: 0.15 + Math.max(0, Math.min(1, maskLevel)) * 0.45 }} />
      )}
      {props.tool === "viewshed" && !props.observer && <div className="terrain-observer-hint">Tap the map to place your observer</div>}
      {props.observer && (
        <>
          <span className="terrain-observer-pin" style={{ left: `${props.observer.x}%`, top: `${props.observer.y}%` }}>
            <EyeIcon />
          </span>
          {props.resultReady && !props.computing && (
            <svg className="terrain-viewshed-fan" viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true">
              <polygon
                className="terrain-viewshed-visible"
                points={`${props.observer.x},${props.observer.y} ${props.observer.x - 6 - props.rangeMi * 8},${props.observer.y - 22 - props.rangeMi * 6} ${props.observer.x + 8 + props.rangeMi * 9},${props.observer.y - 18 - props.rangeMi * 5} ${props.observer.x + 4 + props.rangeMi * 6},${props.observer.y + 14 + props.rangeMi * 4}`}
              />
            </svg>
          )}
        </>
      )}
    </div>
  );
}

function AccuracyNote({ compact }: { compact?: boolean }) {
  return (
    <div className="terrain-accuracy-note">
      <InfoIcon />
      <p>
        Minnesota 0.5 m lidar DEM, NAVD88, acquired 2021&ndash;2023. Bare-earth only &mdash; trees, buildings, and stands
        are not modeled. {compact ? "Estimate, not a safety or legal guarantee." : "This is an estimate for planning, not a survey, navigation, or hunting-regulation authority."}
      </p>
    </div>
  );
}

function PerformanceNote({ computing }: { computing: boolean }) {
  return (
    <div className="terrain-performance-note" aria-live="polite">
      {computing ? (
        <><span className="terrain-spinner" /> Computing at a capped resolution to stay responsive on phones&hellip;</>
      ) : (
        "Resolution capped for phone memory. Effective cell spacing: 4 m."
      )}
    </div>
  );
}

function ThresholdControls(props: ToolProps) {
  return (
    <div className="terrain-tool-controls">
      <span className="terrain-kicker">Elevation-threshold shading</span>
      <label className="terrain-slider-row">
        <span>Shade below {props.thresholdFeet.toLocaleString()} ft</span>
        <input
          type="range"
          min={1000}
          max={2200}
          step={10}
          value={props.thresholdFeet}
          onChange={(event) => props.setThreshold(Number(event.target.value))}
        />
      </label>
      <PerformanceNote computing={props.computing} />
      <AccuracyNote />
    </div>
  );
}

function ViewshedControls(props: ToolProps) {
  return (
    <div className="terrain-tool-controls">
      <span className="terrain-kicker">Terrain viewshed &middot; experimental</span>
      {!props.observer && <p className="terrain-hint-text">Tap the map to drop an observer.</p>}
      {props.observer && (
        <>
          <label className="terrain-slider-row">
            <span>Eye height {props.eyeHeightFt} ft</span>
            <input type="range" min={3} max={30} step={1} value={props.eyeHeightFt} onChange={(event) => props.setEyeHeight(Number(event.target.value))} />
          </label>
          <label className="terrain-slider-row">
            <span>Max range {props.rangeMi.toFixed(1)} mi</span>
            <input type="range" min={0.25} max={3} step={0.25} value={props.rangeMi} onChange={(event) => props.setRange(Number(event.target.value))} />
          </label>
          <PerformanceNote computing={props.computing} />
          <AccuracyNote compact />
        </>
      )}
    </div>
  );
}

function DrapedLayersList() {
  return (
    <ul className="terrain-drape-list">
      {drapedLayers.map((name) => <li key={name}><span className="terrain-drape-dot" />{name} &middot; draped to terrain</li>)}
    </ul>
  );
}

function SaveRow(props: ToolProps) {
  if (!props.resultReady) return null;
  return (
    <div className="terrain-save-row">
      {props.saveState === "saved" ? (
        <span className="terrain-save-status">Saved &middot; temporary until validated</span>
      ) : (
        <button type="button" className="is-primary" disabled={props.saveState === "computing-save"} onClick={props.save}>
          {props.saveState === "computing-save" ? "Saving…" : "Save analysis"}
        </button>
      )}
    </div>
  );
}

function CompassDial({ heading, rotate, className }: { heading: number; rotate: (delta: number) => void; className?: string }) {
  return (
    <div className={`terrain-compass ${className ?? ""}`}>
      <button type="button" aria-label="Rotate counter-clockwise" onClick={() => rotate(-15)}>&#8634;</button>
      <div className="terrain-compass-face" style={{ transform: `rotate(${heading}deg)` }}><CompassIcon /></div>
      <span className="terrain-compass-heading">{String(Math.round(heading)).padStart(3, "0")}&deg;</span>
      <button type="button" aria-label="Rotate clockwise" onClick={() => rotate(15)}>&#8635;</button>
    </div>
  );
}

function SheetTabVariant(props: ToolProps) {
  return (
    <>
      <header className="terrain-compact-header"><strong>MnMapping</strong><span>Terrain analysis</span><button type="button" aria-label="Replay guide" onClick={props.replayGuide}>?</button></header>
      <CompassDial heading={props.heading} rotate={props.rotate} className="terrain-compass-a" />
      <div className="terrain-a-tools">
        <button type="button" aria-pressed={props.tool === null} onClick={() => props.chooseTool(null)}><TerrainIcon />Explore</button>
        <button type="button" aria-pressed={props.tool === "threshold"} onClick={() => props.chooseTool("threshold")}>Threshold</button>
        <button type="button" aria-pressed={props.tool === "viewshed"} onClick={() => props.chooseTool("viewshed")}>Viewshed</button>
      </div>
      {props.tool && (
        <section className="terrain-bottom-sheet">
          <span className="terrain-sheet-handle" />
          {props.tool === "threshold" ? <ThresholdControls {...props} /> : <ViewshedControls {...props} />}
          <DrapedLayersList />
          <SaveRow {...props} />
        </section>
      )}
      {props.guideOpen && (
        <div className="terrain-guide-overlay">
          {props.guideStep === 0 && <GuideCallout className="terrain-guide-compass" text="The compass shows the camera's true-north heading and stays live as you tilt or rotate the view." onNext={props.advanceGuide} onSkip={props.dismissGuide} />}
          {props.guideStep === 1 && <GuideCallout className="terrain-guide-tools" text="Choose Threshold or Viewshed to start an analysis. Results are ground-clamped over the live terrain." onNext={props.advanceGuide} onSkip={props.dismissGuide} />}
          {props.guideStep === 2 && <GuideCallout className="terrain-guide-sheet" text="Adjust parameters here. Every result carries its source and accuracy limits before you save it." onNext={props.dismissGuide} onSkip={props.dismissGuide} lastStep />}
        </div>
      )}
    </>
  );
}

function GuidedWorkspaceVariant(props: ToolProps) {
  const step = props.tool === null ? 1 : props.tool === "threshold" && !props.resultReady && props.computing ? 2 : props.observer && !props.resultReady ? 2 : 3;
  return (
    <>
      <header className="terrain-workspace-header">
        <button type="button" onClick={() => props.chooseTool(null)}>Cancel</button>
        <span><small>Step {step} of 3</small><strong>{step === 1 ? "Choose analysis" : step === 2 ? "Set parameters" : "Review result"}</strong></span>
        <CompassDial heading={props.heading} rotate={props.rotate} className="terrain-compass-b" />
      </header>
      {step === 1 && (
        <section className="terrain-workspace-panel">
          <p className="terrain-hint-text">First time here? Threshold shading and viewshed both use Minnesota&apos;s official lidar terrain, draped live under Parcel, Public land, and DNR overlays.</p>
          <div className="terrain-choice-cards">
            <button type="button" onClick={() => props.chooseTool("threshold")}><span><strong>Elevation threshold</strong><small>Shade ground below a chosen elevation</small></span></button>
            <button type="button" onClick={() => props.chooseTool("viewshed")}><span><strong>Viewshed</strong><small>Estimate what an observer could see</small></span></button>
          </div>
        </section>
      )}
      {step >= 2 && props.tool && (
        <section className="terrain-workspace-panel">
          {props.tool === "threshold" ? <ThresholdControls {...props} /> : <ViewshedControls {...props} />}
        </section>
      )}
      {step === 3 && (
        <section className="terrain-workspace-panel terrain-workspace-review">
          <DrapedLayersList />
          <SaveRow {...props} />
        </section>
      )}
    </>
  );
}

function FloatingCardsVariant(props: ToolProps) {
  return (
    <>
      <CompassDial heading={props.heading} rotate={props.rotate} className="terrain-compass-c" />
      <nav className="terrain-c-toolbar">
        <button type="button" aria-pressed={props.tool === "threshold"} onClick={() => props.chooseTool(props.tool === "threshold" ? null : "threshold")}>Threshold</button>
        <button type="button" aria-pressed={props.tool === "viewshed"} onClick={() => props.chooseTool(props.tool === "viewshed" ? null : "viewshed")}>Viewshed</button>
      </nav>
      {props.tool === "threshold" && (
        <div className="terrain-floating-card terrain-floating-threshold">
          <ThresholdControls {...props} />
          <SaveRow {...props} />
        </div>
      )}
      {props.tool === "viewshed" && props.observer && (
        <div className="terrain-floating-card terrain-floating-viewshed" style={{ left: `${props.observer.x}%`, top: `${props.observer.y}%` }}>
          <ViewshedControls {...props} />
          <SaveRow {...props} />
        </div>
      )}
      {props.guideOpen && <div className="terrain-guide-pulse" onClick={props.dismissGuide} role="presentation" />}
    </>
  );
}

function GuideCallout({ text, onNext, onSkip, className, lastStep }: { text: string; onNext: () => void; onSkip: () => void; className: string; lastStep?: boolean }) {
  return (
    <div className={`terrain-guide-callout ${className}`}>
      <p>{text}</p>
      <div className="terrain-guide-actions">
        <button type="button" onClick={onSkip}>Skip</button>
        <button type="button" className="is-primary" onClick={onNext}>{lastStep ? "Got it" : "Next"}</button>
      </div>
    </div>
  );
}

function PrototypeSwitcher({ current, onChange }: { current: TerrainPrototypeVariant; onChange: (variant: TerrainPrototypeVariant) => void }) {
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
    <nav className="terrain-prototype-switcher" aria-label="Terrain analysis prototype variants">
      <button type="button" onClick={() => cycle(-1)} aria-label="Previous variant">&larr;</button>
      <span><small>Terrain prototype</small><strong>{current} &middot; {variantNames[current]}</strong></span>
      <button type="button" onClick={() => cycle(1)} aria-label="Next variant">&rarr;</button>
    </nav>
  );
}
