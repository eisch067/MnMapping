"use client";

import { useEffect, useRef, useState, useSyncExternalStore, type PointerEvent } from "react";

// Keep in step with the desktop media query in globals.css, which lays out the rail.
const desktopQuery = "(min-width: 721px)";
const previewCloseDelayMs = 150;

function subscribeToDesktopLayout(onChange: () => void) {
  const query = window.matchMedia(desktopQuery);
  query.addEventListener("change", onChange);
  return () => query.removeEventListener("change", onChange);
}

function useDesktopLayout(): boolean {
  return useSyncExternalStore(
    subscribeToDesktopLayout,
    () => window.matchMedia(desktopQuery).matches,
    () => false,
  );
}

export interface HoverBindings {
  onPointerEnter: (event: PointerEvent) => void;
  onPointerLeave: (event: PointerEvent) => void;
}

interface SheetState {
  openId: string | null;
  // The sheet on screen: the open one, or the last-used one while the rail is previewed.
  visibleId: string | null;
  pinned: boolean;
  // A pinned rail that has a sheet open docks it beside the map instead of floating over it.
  docked: boolean;
  toggle: (id: string) => void;
  open: (id: string) => void;
  close: () => void;
  // Using a previewed sheet keeps it open after the pointer leaves the rail.
  commit: () => void;
  setPinned: (pinned: boolean) => void;
  hover: HoverBindings;
}

interface SheetStateOptions {
  defaultId: string;
  onChange?: (openId: string | null) => void;
}

// Hovering the desktop rail previews the sheet without opening it; closing a sheet while the
// pointer is still over the rail keeps the preview dismissed until the pointer leaves.
function useRailPreview() {
  const enabled = useDesktopLayout();
  const [previewing, setPreviewing] = useState(false);
  const dismissed = useRef(false);
  const leaveTimer = useRef<number | undefined>(undefined);

  useEffect(() => () => window.clearTimeout(leaveTimer.current), []);

  const hover: HoverBindings = {
    onPointerEnter: (event) => {
      if (!enabled || event.pointerType !== "mouse") return;
      window.clearTimeout(leaveTimer.current);
      if (!dismissed.current) setPreviewing(true);
    },
    onPointerLeave: (event) => {
      if (event.pointerType !== "mouse") return;
      window.clearTimeout(leaveTimer.current);
      leaveTimer.current = window.setTimeout(() => {
        dismissed.current = false;
        setPreviewing(false);
      }, previewCloseDelayMs);
    },
  };
  const dismiss = () => {
    if (!previewing) return;
    dismissed.current = true;
    setPreviewing(false);
  };
  return { previewing: enabled && previewing, dismiss, hover };
}

export function useSheetState({ defaultId, onChange }: SheetStateOptions): SheetState {
  const [openId, setOpenId] = useState<string | null>(null);
  const [lastId, setLastId] = useState(defaultId);
  const [pinned, setPinnedState] = useState(false);
  const preview = useRailPreview();

  const open = (id: string) => {
    setOpenId(id);
    setLastId(id);
    onChange?.(id);
  };
  const close = () => {
    setOpenId(null);
    preview.dismiss();
    onChange?.(null);
  };
  const setPinned = (next: boolean) => {
    setPinnedState(next);
    if (next && openId === null) open(lastId);
  };

  return {
    openId,
    visibleId: openId ?? (preview.previewing ? lastId : null),
    pinned,
    docked: pinned && openId !== null,
    toggle: (id) => (openId === id ? close() : open(id)),
    open,
    close,
    commit: () => {
      if (openId === null && preview.previewing) open(lastId);
    },
    setPinned,
    hover: preview.hover,
  };
}
