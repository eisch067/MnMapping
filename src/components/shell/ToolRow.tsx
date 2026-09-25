import { SidebarIcon } from "@/components/ui/MapIcons";
import type { SheetDefinition } from "./sheets";
import type { HoverBindings } from "./useSheetState";

interface ToolRowProps {
  sheets: readonly SheetDefinition[];
  openId: string | null;
  pinned: boolean;
  onToggle: (id: string) => void;
  onPinnedChange: (pinned: boolean) => void;
  hover: HoverBindings;
}

// One action per sheet: the dock along the bottom of a phone, the rail down the left of a desktop.
export function ToolRow({ sheets, openId, pinned, onToggle, onPinnedChange, hover }: ToolRowProps) {
  return (
    <nav className="tool-row" aria-label="Map tools" {...hover}>
      {sheets.map((sheet) => (
        <button
          key={sheet.id}
          className={`tool-row-action ${sheet.primary ? "is-primary" : ""}`}
          type="button"
          aria-pressed={openId === sheet.id}
          onClick={() => onToggle(sheet.id)}
        >
          {sheet.icon}
          <span>{sheet.title}</span>
        </button>
      ))}
      <button
        className="tool-row-action tool-row-pin"
        type="button"
        aria-pressed={pinned}
        onClick={() => onPinnedChange(!pinned)}
      >
        <SidebarIcon />
        <span>Dock panel</span>
      </button>
    </nav>
  );
}
