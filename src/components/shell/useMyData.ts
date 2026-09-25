"use client";

import { useCallback, useEffect, useState } from "react";
import { exportText, parseMapFile } from "@/lib/mapFormats";
import { clearMyData, deleteMyItem, loadMyData, saveMyItem, type MyMapItem } from "@/lib/myData";

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
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    void loadMyData().then(setItems);
  }, []);

  const add = useCallback(async (item: MyMapItem) => {
    setItems((current) => [...current, item]);
    await saveMyItem(item);
  }, []);

  const onDelete = useCallback((id: string) => {
    void deleteMyItem(id);
    setItems((current) => current.filter((item) => item.id !== id));
  }, []);

  const onClear = useCallback(() => {
    void clearMyData();
    setItems([]);
  }, []);

  const onImport = useCallback(async (file: File) => {
    const extension = file.name.split(".").pop()?.toLowerCase() ?? "";
    const imported = parseMapFile(await file.text(), extension);
    for (const item of imported) await saveMyItem(item);
    setItems((current) => [...current, ...imported]);
  }, []);

  const onExport = (format: ExportFormat) => {
    downloadText(exportText(items, format), `mnmapping-data.${format}`);
  };

  return {
    items,
    visible,
    onVisibleChange: setVisible,
    add,
    onDelete,
    onClear,
    onImport,
    onExport,
  };
}
