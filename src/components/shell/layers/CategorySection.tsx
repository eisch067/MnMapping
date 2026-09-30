import type { LayerCategory, LayerDefinition } from "@/config/layers/types";
import type { RestrictedImagerySource } from "@/config/restrictedImagery";
import { DnrRecreationSection } from "./DnrRecreationSection";
import { GroupHeading } from "./GroupHeading";
import { ImagerySection, type SectionState } from "./ImagerySection";
import { LayerRows, type LayerControls } from "./LayerRow";
import { averageOpacity, categoryLabels } from "./layerGrouping";

interface CategorySectionProps {
  category: LayerCategory;
  layers: readonly LayerDefinition[];
  controls: LayerControls;
  sections: SectionState;
  externalImagery: readonly RestrictedImagerySource[];
  pendingCounties: readonly string[];
}

function CategoryBody(props: CategorySectionProps) {
  const { category, layers, controls, sections, externalImagery, pendingCounties } = props;
  if (category === "imagery") {
    return (
      <ImagerySection
        layers={layers}
        externalImagery={externalImagery}
        controls={controls}
        sections={sections}
      />
    );
  }
  if (category === "dnr-recreation") {
    return (
      <div className="layer-list">
        <GroupOpacity category={category} layers={layers} controls={controls} />
        <DnrRecreationSection layers={layers} controls={controls} sections={sections} />
      </div>
    );
  }
  return (
    <div className="layer-list" id={`layer-section-${category}`}>
      <GroupOpacity category={category} layers={layers} controls={controls} />
      <LayerRows layers={layers} controls={controls} reverse />
      <PendingCountyNotes category={category} counties={pendingCounties} />
    </div>
  );
}

export function CategorySection(props: CategorySectionProps) {
  const { category, layers, controls, sections } = props;
  const collapsed = sections.isCollapsed(category);
  return (
    <section className="layer-category">
      <div className="layer-category-heading">
        <GroupHeading
          groupId={category}
          label={categoryLabels[category]}
          layers={layers}
          state={controls.state}
          groupControls={controls}
          categorySwitch={category === "parcels" || category === "reference" || category === "public-land"}
          seasonGates={controls.seasonGates}
          onToggleCategory={controls.onToggleCategory}
          expanded={!collapsed}
          onToggleExpand={() => sections.toggle(category)}
        />
      </div>
      {!collapsed && <CategoryBody {...props} />}
    </section>
  );
}

const groupOpacityTitle = {
  "public-land": "All public lands",
  "dnr-recreation": "All DNR Recreation",
  parcels: "All parcels",
} as const;

type GroupOpacityProps = Pick<CategorySectionProps, "category" | "layers" | "controls">;

function hasGroupOpacity(category: LayerCategory): category is keyof typeof groupOpacityTitle {
  return Object.hasOwn(groupOpacityTitle, category);
}

function GroupOpacity({ category, layers, controls }: GroupOpacityProps) {
  if (!hasGroupOpacity(category) || layers.length === 0) return null;
  const title = groupOpacityTitle[category];
  const opacity = Math.round(averageOpacity(layers, controls.state) * 100);
  return (
    <label className="opacity-control category-group-opacity">
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
