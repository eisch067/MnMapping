"use client";

import { useEffect, useRef, type PointerEvent } from "react";
import { CloseIcon } from "@/components/ui/MapIcons";
import { neighborTab, tabsFor, type SheetDefinition } from "./sheets";
import type { HoverBindings } from "./useSheetState";

const minimumSwipeDistance = 45;

interface SheetHostProps {
  sheets: readonly SheetDefinition[];
  visibleId: string | null;
  docked: boolean;
  onSelect: (id: string) => void;
  onClose: () => void;
  onEngage: () => void;
  hover: HoverBindings;
}

// Touch-only: a mouse drag across the tabs should never change the sheet.
function useHorizontalSwipe(onSwipe: (direction: 1 | -1) => void) {
  const start = useRef<{ x: number; y: number } | null>(null);
  return {
    onPointerDown: (event: PointerEvent) => {
      start.current = event.pointerType === "mouse" ? null : { x: event.clientX, y: event.clientY };
    },
    onPointerUp: (event: PointerEvent) => {
      const origin = start.current;
      start.current = null;
      if (!origin) return;
      const distance = event.clientX - origin.x;
      const isHorizontal = Math.abs(distance) > Math.abs(event.clientY - origin.y);
      const isFarEnough = Math.abs(distance) >= minimumSwipeDistance;
      if (isFarEnough && isHorizontal) onSwipe(distance < 0 ? 1 : -1);
    },
    onPointerCancel: () => {
      start.current = null;
    },
  };
}

function useEscapeToClose(open: boolean, onClose: () => void) {
  useEffect(() => {
    if (!open) return;
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    window.addEventListener("keydown", closeOnEscape);
    return () => window.removeEventListener("keydown", closeOnEscape);
  }, [onClose, open]);
}

export function SheetHost(props: SheetHostProps) {
  const { sheets, visibleId, docked, onSelect, onClose, onEngage, hover } = props;
  const active = sheets.find((sheet) => sheet.id === visibleId);
  const tabs = tabsFor(sheets, active);
  const swipe = useHorizontalSwipe((direction) => {
    const next = active && neighborTab(tabs, active.id, direction);
    if (next) onSelect(next.id);
  });
  useEscapeToClose(Boolean(active), onClose);

  return (
    <aside
      className={`sheet-host ${active ? "is-open" : ""} ${docked ? "is-docked" : ""}`}
      data-size={active?.size ?? "tall"}
      aria-label="Map sheet"
      aria-hidden={!active}
      inert={!active}
      onPointerDownCapture={onEngage}
      {...hover}
    >
      <header className="sheet-header" {...swipe}>
        <span className="sheet-handle" aria-hidden="true" />
        {tabs.length > 1 ? (
          <div className="sheet-tabs" role="tablist" aria-label="Sheets">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                id={`sheet-tab-${tab.id}`}
                type="button"
                role="tab"
                aria-selected={tab.id === active?.id}
                aria-controls={`sheet-${tab.id}`}
                onClick={() => onSelect(tab.id)}
              >
                {tab.title}
              </button>
            ))}
          </div>
        ) : (
          <h2 className="sheet-title">{active?.title}</h2>
        )}
        <button className="panel-close" type="button" onClick={onClose} aria-label="Close sheet">
          <CloseIcon />
        </button>
      </header>
      {sheets.map((sheet) => (
        <section
          key={sheet.id}
          id={`sheet-${sheet.id}`}
          className="sheet-body"
          role={sheet.tabGroup ? "tabpanel" : undefined}
          aria-labelledby={sheet.tabGroup ? `sheet-tab-${sheet.id}` : undefined}
          aria-label={sheet.tabGroup ? undefined : sheet.title}
          hidden={sheet.id !== active?.id}
        >
          {sheet.content}
        </section>
      ))}
    </aside>
  );
}
