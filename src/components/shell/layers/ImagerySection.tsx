import type { ReactNode } from "react";
import { ChevronDownIcon } from "@/components/ui/MapIcons";
import type { LayerDefinition } from "@/config/layers/types";
import type { RestrictedImagerySource } from "@/config/restrictedImagery";
import { GroupHeading } from "./GroupHeading";
import { LayerRows, type LayerControls } from "./LayerRow";
import {
  groupByCounty,
  groupExternalImageryByCounty,
  sortImageryNewestFirst,
} from "./layerGrouping";

export interface SectionState {
  isCollapsed: (id: string) => boolean;
  toggle: (id: string) => void;
}

interface ImageryShared {
  controls: LayerControls;
  sections: SectionState;
}

interface ImagerySectionProps extends ImageryShared {
  layers: readonly LayerDefinition[];
  externalImagery: readonly RestrictedImagerySource[];
}

const statewideGroups = [
  { group: "naip", label: "NAIP" },
  { group: "cir", label: "CIR" },
] as const;

export function ImagerySection({
  layers,
  externalImagery,
  controls,
  sections,
}: ImagerySectionProps) {
  const shared = { controls, sections };
  return (
    <div className="layer-scopes" id="layer-section-imagery">
      <CountyImagery layers={layers.filter((layer) => Boolean(layer.county))} {...shared} />
      <StatewideImagery layers={layers.filter((layer) => !layer.county)} {...shared} />
      {externalImagery.length > 0 && (
        <ExternalImagerySection
          sources={externalImagery}
          collapsed={sections.isCollapsed("imagery-external")}
          onToggle={() => sections.toggle("imagery-external")}
        />
      )}
    </div>
  );
}

interface ImageryScopeProps extends ImageryShared {
  id: string;
  label: string;
  layers: readonly LayerDefinition[];
  children: ReactNode;
}

function ImageryScope({ id, label, layers, controls, sections, children }: ImageryScopeProps) {
  const collapsed = sections.isCollapsed(id);
  return (
    <section className="layer-scope">
      <div className="layer-scope-heading">
        <GroupHeading
          id={`layer-section-${id}`}
          label={label}
          layers={layers}
          state={controls.state}
          onVisibilityChange={controls.onVisibilityChange}
          expanded={!collapsed}
          onToggleExpand={() => sections.toggle(id)}
        />
      </div>
      {!collapsed && (
        <div className="layer-list" id={`layer-section-${id}`}>
          {children}
        </div>
      )}
    </section>
  );
}

interface ImageryGroupProps extends ImageryShared {
  layers: readonly LayerDefinition[];
}

function CountyImagery({ layers, controls, sections }: ImageryGroupProps) {
  if (layers.length === 0) return null;
  return (
    <ImageryScope
      id="imagery-county"
      label="County"
      layers={layers}
      controls={controls}
      sections={sections}
    >
      <div className="layer-subscopes">
        {Array.from(groupByCounty(layers), ([countyName, countyLayers]) => (
          <ImageryScope
            key={countyName}
            id={`imagery-county-${countyName.toLowerCase().replaceAll(" ", "-")}`}
            label={countyName}
            layers={countyLayers}
            controls={controls}
            sections={sections}
          >
            <LayerRows layers={sortImageryNewestFirst(countyLayers)} controls={controls} />
          </ImageryScope>
        ))}
      </div>
    </ImageryScope>
  );
}

function StatewideImagery({ layers, controls, sections }: ImageryGroupProps) {
  if (layers.length === 0) return null;
  const ungrouped = layers.filter((layer) => !layer.imageryGroup);
  const undated = ungrouped.filter((layer) => typeof layer.year !== "number");
  const dated = ungrouped.filter((layer) => typeof layer.year === "number");
  return (
    <ImageryScope
      id="imagery-statewide"
      label="Statewide"
      layers={layers}
      controls={controls}
      sections={sections}
    >
      <LayerRows layers={sortImageryNewestFirst(undated)} controls={controls} />
      <div className="layer-subscopes">
        {statewideGroups.map(({ group, label }) => {
          const inGroup = layers.filter((layer) => layer.imageryGroup === group);
          const groupLayers = sortImageryNewestFirst(inGroup);
          if (groupLayers.length === 0) return null;
          return (
            <ImageryScope
              key={group}
              id={`imagery-statewide-${group}`}
              label={label}
              layers={groupLayers}
              controls={controls}
              sections={sections}
            >
              <LayerRows layers={groupLayers} controls={controls} />
            </ImageryScope>
          );
        })}
      </div>
      <LayerRows layers={sortImageryNewestFirst(dated)} controls={controls} />
    </ImageryScope>
  );
}

interface ExternalImagerySectionProps {
  sources: readonly RestrictedImagerySource[];
  collapsed: boolean;
  onToggle: () => void;
}

function ExternalImagerySection({ sources, collapsed, onToggle }: ExternalImagerySectionProps) {
  const counties = groupExternalImageryByCounty(sources);
  return (
    <section className="layer-scope external-imagery-scope">
      <div className="layer-scope-heading">
        <button
          className="layer-heading-collapse"
          type="button"
          aria-expanded={!collapsed}
          aria-controls="layer-section-imagery-external"
          onClick={onToggle}
        >
          <span>External imagery</span>
          <span className="category-summary">
            {sources.length} link{sources.length === 1 ? "" : "s"} <ChevronDownIcon />
          </span>
        </button>
      </div>
      {!collapsed && (
        <div className="external-imagery-list" id="layer-section-imagery-external">
          {Array.from(counties, ([county, countySources]) => (
            <section className="external-imagery-county" key={county}>
              <strong>{county} County</strong>
              {countySources.map((source) => (
                <article key={`${source.name}-${source.year}-${source.url}`}>
                  <span>
                    <b>{source.name}</b>
                    <small>{[source.year, source.detail].filter(Boolean).join(" · ")}</small>
                  </span>
                  <a
                    href={source.url}
                    target="_blank"
                    rel="noreferrer"
                    aria-label={`View ${source.name} imagery in a new tab`}
                  >
                    View imagery ↗
                  </a>
                  <p>{source.reason}</p>
                </article>
              ))}
            </section>
          ))}
          <p className="external-imagery-note">
            These sources open outside MnMapping because licensing, access, or delivery restrictions
            prevent displaying them directly on this map.
          </p>
        </div>
      )}
    </section>
  );
}
