"use client";

import { useCallback, useEffect, useState } from "react";
import { exportText, parseMapFile } from "@/lib/mapFormats";
import {
  getMyDataStore,
  type MyDataFolder,
  type MyDataSettings,
  type MyMapItem,
  type NewMyDataItem,
} from "@/lib/myData";

export type ExportFormat = "geojson" | "kml" | "gpx";

function downloadText(text: string, filename: string) {
  const anchor = document.createElement("a");
  anchor.href = URL.createObjectURL(new Blob([text], { type: "text/plain" }));
  anchor.download = filename;
  anchor.click();
  URL.revokeObjectURL(anchor.href);
}

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

  const onImport = useCallback(async (file: File) => {
    const extension = file.name.split(".").pop()?.toLowerCase() ?? "";
    const imported = parseMapFile(await file.text(), extension);
    await mutate(async () => {
      const store = await getMyDataStore();
      for (const item of imported) await store.addItem(item);
    });
  }, [mutate]);

  const onExport = (format: ExportFormat) => {
    const activeItems = items.filter((item) => !item.deletion);
    downloadText(exportText(activeItems, format), `mnmapping-data.${format}`);
  };

  return {
    items: items.filter((item) => !item.deletion),
    allItems: items,
    folders,
    settings,
    error,
    visible,
    onVisibleChange: setVisible,
    add,
    onImport,
    onExport,
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
