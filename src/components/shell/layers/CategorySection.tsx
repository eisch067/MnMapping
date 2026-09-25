import type { LayerCategory, LayerDefinition } from "@/config/layers/types";
import type { RestrictedImagerySource } from "@/config/restrictedImagery";
import { GroupHeading } from "./GroupHeading";
import { ImagerySection, type SectionState } from "./ImagerySection";
import { LayerRows, type LayerControls } from "./LayerRow";
import { averageOpacity, categoryLabels, isLayerVisible } from "./layerGrouping";

interface CategorySectionProps {
  category: LayerCategory;
  layers: readonly LayerDefinition[];
  controls: LayerControls;
  sections: SectionState;
  externalImagery: readonly RestrictedImagerySource[];
  pendingCounties: readonly string[];
}

export function CategorySection(props: CategorySectionProps) {
  const { category, layers, controls, sections, externalImagery, pendingCounties } = props;
  const collapsed = sections.isCollapsed(category);
  return (
    <section className="layer-category">
      <div className="layer-category-heading">
        <GroupHeading
          id={`layer-section-${category}`}
          label={categoryLabels[category]}
          layers={layers}
          state={controls.state}
          onVisibilityChange={controls.onVisibilityChange}
          expanded={!collapsed}
          onToggleExpand={() => sections.toggle(category)}
        />
      </div>
      {!collapsed &&
        (category === "imagery" ? (
          <ImagerySection
            layers={layers}
            externalImagery={externalImagery}
            controls={controls}
            sections={sections}
          />
        ) : (
          <div className="layer-list" id={`layer-section-${category}`}>
            <MasterControls category={category} layers={layers} controls={controls} />
            <LayerRows layers={layers} controls={controls} reverse />
            <PendingCountyNotes category={category} counties={pendingCounties} />
          </div>
        ))}
    </section>
  );
}

const masterControlText = {
  "public-land": { title: "All public lands", noun: "public-land" },
  parcels: { title: "All parcels", noun: "parcel" },
} as const;

type MasterControlsProps = Pick<CategorySectionProps, "category" | "layers" | "controls">;

function MasterControls({ category, layers, controls }: MasterControlsProps) {
  if ((category !== "public-land" && category !== "parcels") || layers.length === 0) return null;
  const { title, noun } = masterControlText[category];
  const enabled = layers.filter((layer) => isLayerVisible(layer, controls.state)).length;
  const opacity = Math.round(averageOpacity(layers, controls.state) * 100);
  return (
    <>
      <label className="category-master-toggle">
        <input
          type="checkbox"
          checked={enabled === layers.length}
          ref={(input) => {
            if (input) input.indeterminate = enabled > 0 && enabled < layers.length;
          }}
          onChange={(event) => {
            layers.forEach((layer) => controls.onVisibilityChange(layer.id, event.target.checked));
          }}
        />
        <span>
          <strong>{title}</strong>
          <small>
            Turn every {noun} layer in the current area on or off. New layers that come into view
            while every layer is on will join them automatically.
          </small>
        </span>
      </label>
      <label className="opacity-control category-master-opacity">
        <span>All opacities</span>
        <input
          aria-label={`${title} opacity`}
          type="range"
          min="0"
          max="100"
          step="1"
          value={opacity}
          onChange={(event) => {
            const next = Number(event.target.value) / 100;
            layers.forEach((layer) => controls.onOpacityChange(layer.id, next));
          }}
        />
        <output>{opacity}%</output>
      </label>
    </>
  );
}

interface PendingCountyNotesProps {
  category: LayerCategory;
  counties: readonly string[];
}

function PendingCountyNotes({ category, counties }: PendingCountyNotesProps) {
  if (category === "parcels") {
    return counties.map((county) => (
      <p className="layer-availability-note" key={county}>
        <strong>{county} County parcels pending.</strong> No stable, repeatable public query source
        has been verified yet.
      </p>
    ));
  }
  if (category === "public-land") {
    return counties.map((county) => (
      <p className="layer-availability-note" key={county}>
        <strong>{county} County public-land data pending.</strong> Minnesota&apos;s statewide
        government-ownership service does not include this county yet.
      </p>
    ));
  }
  return null;
}
