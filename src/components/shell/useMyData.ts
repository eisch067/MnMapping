"use client";

import { useCallback, useEffect, useState } from "react";
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

  const refresh = useCallback(async () => {
    const snapshot = await (await getMyDataStore()).load();
    setItems(snapshot.items);
    setFolders(snapshot.folders);
    setSettings(snapshot.settings);
  }, []);

  useEffect(() => {
    void getMyDataStore()
      .then((store) => store.load())
      .then((snapshot) => {
        setItems(snapshot.items);
        setFolders(snapshot.folders);
        setSettings(snapshot.settings);
      })
      .catch((reason: unknown) => {
        setError(reason instanceof Error ? reason.message : "Unable to load My Data.");
      });
  }, []);

  const mutate = useCallback(async (operation: () => Promise<unknown>) => {
    try {
      setError(null);
      await operation();
      await refresh();
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Unable to update My Data.");
      throw reason;
    }
  }, [refresh]);

  const add = useCallback(async (item: NewMyDataItem) => {
    await mutate(async () => (await getMyDataStore()).addItem(item));
  }, [mutate]);

  return {
    items: items.filter((item) => !item.deletion),
    allItems: items,
    folders,
    settings,
    error,
    visible,
    onVisibleChange: setVisible,
    add,
    refresh,
    mutate,
    onCreateFolder: (name: string) => mutate(async () => (await getMyDataStore()).createFolder(name)),
    onMoveItem: (itemId: string, folderId: string | null) => mutate(
      async () => (await getMyDataStore()).moveItem(itemId, folderId),
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
