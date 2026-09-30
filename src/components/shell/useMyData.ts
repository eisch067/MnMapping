"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { isPersonalMode } from "@/config/appMode";
import type { SyncStatus } from "@/lib/syncClient";
import { startSyncPolling } from "@/lib/syncPolling";
import { retainUnchanged, sameValue } from "@/lib/retainUnchanged";
import {
  getMyDataStore,
  type MyDataFolder,
  type MyDataSettings,
  type MyMapItem,
  type NewMyDataItem,
} from "@/lib/myData";

export function useMyData() {
  const [items, setItems] = useState<MyMapItem[]>([]);
  const [folders, setFolders] = useState<MyDataFolder[]>([]);
  const [settings, setSettings] = useState<MyDataSettings | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [visible, setVisible] = useState(true);
  const [syncStatus, setSyncStatus] = useState<SyncStatus>(isPersonalMode ? "syncing" : "idle");
  const [conflictCount, setConflictCount] = useState(0);
  const syncing = useRef(false);
  const refreshRequest = useRef(0);
  const signInNeededRef = useRef(false);
  const signInNeeded = syncStatus === "sign-in-needed";

  const refresh = useCallback(async () => {
    const request = ++refreshRequest.current;
    const store = await getMyDataStore();
    const snapshot = await store.load();
    const syncState = await store.getState();
    if (request !== refreshRequest.current) return;
    setItems((previous) => retainUnchanged(previous, snapshot.items));
    setFolders((previous) => retainUnchanged(previous, snapshot.folders));
    setSettings((previous) =>
      previous && sameValue(previous, snapshot.settings) ? previous : snapshot.settings,
    );
    setConflictCount(syncState.conflictCount ?? 0);
  }, []);

  const syncNow = useCallback(async () => {
    if (!isPersonalMode) return "idle";
    if (signInNeededRef.current) return "sign-in-needed";
    if (syncing.current) return "syncing";
    syncing.current = true;
    setSyncStatus("syncing");
    try {
      const store = await getMyDataStore();
      const { synchronize } = await import("@/lib/syncClient");
      await synchronize(store);
      await refresh();
      signInNeededRef.current = false;
      setSyncStatus("idle");
      return "idle";
    } catch (reason) {
      const status: SyncStatus = reason instanceof Error && reason.name === "SyncAuthenticationError"
        ? "sign-in-needed"
        : reason instanceof Error && reason.name === "SyncPausedError" ? "paused" : "error";
      signInNeededRef.current = status === "sign-in-needed";
      setSyncStatus(status);
      return status;
    } finally {
      syncing.current = false;
    }
  }, [refresh]);

  useEffect(() => {
    const initialLoad = window.setTimeout(() => {
      void refresh().catch((reason: unknown) => {
        setError(reason instanceof Error ? reason.message : "Unable to load My Data.");
      });
    }, 0);
    return () => window.clearTimeout(initialLoad);
  }, [refresh]);

  useEffect(() => {
    if (!isPersonalMode || signInNeeded) return;
    const stopPolling = startSyncPolling(syncNow, setSyncStatus);
    window.addEventListener("online", syncNow);
    return () => {
      stopPolling();
      window.removeEventListener("online", syncNow);
    };
  }, [syncNow, signInNeeded]);

  const mutate = useCallback(async (operation: () => Promise<unknown>) => {
    try {
      setError(null);
      await operation();
      await refresh();
      void syncNow();
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Unable to update My Data.");
      throw reason;
    }
  }, [refresh, syncNow]);

  const add = useCallback(async (item: NewMyDataItem) => {
    await mutate(async () => (await getMyDataStore()).addItem(item));
  }, [mutate]);

  const visibleItems = useMemo(() => items.filter((item) => !item.deletion), [items]);

  return {
    items: visibleItems,
    allItems: items,
    folders,
    settings,
    error,
    syncStatus,
    conflictCount,
    onSyncRetry: syncNow,
    visible,
    onVisibleChange: setVisible,
    add,
    refresh,
    mutate,
    onCreateFolder: (name: string) => mutate(async () => (await getMyDataStore()).createFolder(name)),
    onMoveItem: (itemId: string, folderId: string | null) => mutate(
      async () => (await getMyDataStore()).moveItem(itemId, folderId),
    ),
    onUpdateItemGeometry: (
      itemId: string,
      geometry: MyMapItem["geometry"],
      primaryDimension: MyMapItem["primaryDimension"],
    ) => mutate(
      async () => (await getMyDataStore()).updateItemGeometry(itemId, geometry, primaryDimension),
    ),
    onDeleteItem: (itemId: string) => mutate(async () => (await getMyDataStore()).trashItem(itemId)),
    onDeleteFolder: (folderId: string) => mutate(
      async () => (await getMyDataStore()).trashFolder(folderId),
    ),
    onRestoreItem: (itemId: string) => mutate(
      async () => (await getMyDataStore()).restoreItem(itemId),
    ),
    onRestoreFolder: (folderId: string) => mutate(
      async () => (await getMyDataStore()).restoreFolder(folderId),
    ),
    onUpdateSettings: (changes: Partial<MyDataSettings>) => mutate(
      async () => (await getMyDataStore()).updateSettings(changes),
    ),
  };
}
