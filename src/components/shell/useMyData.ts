"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { isPersonalMode } from "@/config/appMode";
import type { SyncStatus } from "@/lib/syncClient";
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

  const refresh = useCallback(async () => {
    const store = await getMyDataStore();
    const snapshot = await store.load();
    const syncState = await store.getState();
    setItems(snapshot.items);
    setFolders(snapshot.folders);
    setSettings(snapshot.settings);
    setConflictCount(syncState.conflictCount ?? 0);
  }, []);

  const syncNow = useCallback(async () => {
    if (!isPersonalMode || syncing.current) return;
    syncing.current = true;
    setSyncStatus("syncing");
    try {
      const store = await getMyDataStore();
      const { synchronize } = await import("@/lib/syncClient");
      await synchronize(store);
      await refresh();
      setSyncStatus("idle");
    } catch (reason) {
      setSyncStatus(reason instanceof Error && reason.name === "SyncPausedError" ? "paused" : "error");
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
    if (!isPersonalMode) return;
    const initialSync = window.setTimeout(() => void syncNow(), 0);
    const interval = window.setInterval(() => void syncNow(), 30_000);
    window.addEventListener("online", syncNow);
    return () => {
      window.clearTimeout(initialSync);
      window.clearInterval(interval);
      window.removeEventListener("online", syncNow);
    };
  }, [syncNow]);

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

  return {
    items: items.filter((item) => !item.deletion),
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
