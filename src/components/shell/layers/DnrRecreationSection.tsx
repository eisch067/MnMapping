import { dnrHeadings } from "@/config/layers/dnrHeadings";
import type { LayerDefinition } from "@/config/layers/types";
import { GroupHeading } from "./GroupHeading";
import type { SectionState } from "./ImagerySection";
import { LayerRows, type LayerControls } from "./LayerRow";

interface DnrRecreationSectionProps {
  layers: readonly LayerDefinition[];
  controls: LayerControls;
  sections: SectionState;
}

export function dnrHeadingGroupId(headingId: string): string {
  return `dnr-recreation:${headingId}`;
}

// Each heading has its own control, which suspends and restores that heading's active subset the
// same way the DNR Recreation control does for the whole collection.
export function DnrRecreationSection({ layers, controls, sections }: DnrRecreationSectionProps) {
  return (
    <div className="layer-scopes" id="layer-section-dnr-recreation">
      {dnrHeadings.map(({ id, label }) => {
        const groupId = dnrHeadingGroupId(id);
        const headingLayers = layers.filter((layer) => layer.dnr?.heading === id);
        const collapsed = sections.isCollapsed(groupId);
        return (
          <section className="layer-scope" key={id}>
            <div className="layer-scope-heading">
              <GroupHeading
                groupId={groupId}
                label={label}
                layers={headingLayers}
                state={controls.state}
                groupControls={controls}
                showWhenEmpty
                expanded={!collapsed}
                onToggleExpand={() => sections.toggle(groupId)}
              />
            </div>
            {!collapsed && (
              <div className="layer-list" id={`layer-section-${groupId}`}>
                {headingLayers.length > 0 ? (
                  <LayerRows layers={headingLayers} controls={controls} reverse />
                ) : (
                  <p className="layer-availability-note">No layers under this heading yet.</p>
                )}
              </div>
            )}
          </section>
        );
      })}
    </div>
  );
}
