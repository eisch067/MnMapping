import type { ReactNode } from "react";

export interface SheetDefinition {
  id: string;
  title: string;
  icon: ReactNode;
  // Tall sheets hold long, scrolling content; compact sheets hug their content so the map
  // stays visible.
  size: "tall" | "compact";
  // Sheets that share a tab group appear as tabs of one sheet and can be swiped between.
  tabGroup?: string;
  // The one tool-row action drawn raised above the others on a phone.
  primary?: boolean;
  content: ReactNode;
}

export function tabsFor(
  sheets: readonly SheetDefinition[],
  active: SheetDefinition | undefined,
): SheetDefinition[] {
  const group = active?.tabGroup;
  return group ? sheets.filter((sheet) => sheet.tabGroup === group) : [];
}

export function neighborTab(
  tabs: readonly SheetDefinition[],
  activeId: string,
  direction: 1 | -1,
): SheetDefinition | undefined {
  const index = tabs.findIndex((tab) => tab.id === activeId);
  return index < 0 ? undefined : tabs[index + direction];
}
