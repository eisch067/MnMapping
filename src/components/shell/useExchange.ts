"use client";

import { useCallback, useMemo, useState } from "react";
import { buildArchive, planRestore } from "@/lib/exchange/archive";
import { boundsOf, type Bounds } from "@/lib/exchange/bounds";
import { MAX_IMPORT_BYTES, parseImport, type ImportReport } from "@/lib/exchange/importFile";
import { resolveScope, type ExportScope, type ResolvedScope } from "@/lib/exchange/scope";
import { countsByType, describeRestore } from "@/lib/exchange/summaries";
import { getMyDataStore } from "@/lib/myData";
import { downloadFile } from "./downloadFile";
import { sheetIds } from "./shellSheets";
import type { useMyData } from "./useMyData";

export type ImportResultState =
  | { status: "refused"; filename: string; message: string }
  | { status: "nothing"; filename: string; report: ImportReport }
  | {
    status: "imported";
    filename: string;
    report: ImportReport;
    counts: { pins: number; lines: number; areas: number };
    folder: { id: string; name: string };
    bounds: Bounds | null;
    undone: boolean;
  };

export type RestoreResultState =
  | { status: "refused"; message: string }
  | { status: "restored"; lines: string[] };

interface ExchangeOptions {
  myData: ReturnType<typeof useMyData>;
  openSheet: (id: string) => void;
  closeSheet: () => void;
  showBounds: (bounds: Bounds) => void;
}

function reasonText(reason: unknown, fallback: string): string {
  return reason instanceof Error ? reason.message : fallback;
}

function fileExtension(filename: string): string {
  return filename.split(".").pop()?.toLowerCase() ?? "";
}

export function useExchange({ myData, openSheet, closeSheet, showBounds }: ExchangeOptions) {
  const { items, folders, refresh, mutate, onVisibleChange } = myData;
  const [exportScope, setExportScope] = useState<ExportScope | null>(null);
  const [importResult, setImportResult] = useState<ImportResultState | null>(null);
  const [restoreResult, setRestoreResult] = useState<RestoreResultState | null>(null);

  const resolvedScope: ResolvedScope | null = useMemo(
    () => (exportScope ? resolveScope(exportScope, items, folders) : null),
    [exportScope, items, folders],
  );

  const startExport = useCallback((scope: ExportScope) => {
    setExportScope(scope);
    openSheet(sheetIds.export);
  }, [openSheet]);

  const importFile = useCallback(async (file: File) => {
    const show = (result: ImportResultState) => {
      setImportResult(result);
      openSheet(sheetIds.importResult);
    };
    try {
      const text = file.size > MAX_IMPORT_BYTES ? "" : await file.text();
      const outcome = parseImport({ name: file.name, size: file.size, text });
      if (!outcome.ok) return show({ status: "refused", filename: file.name, message: outcome.message });
      if (outcome.items.length === 0) {
        return show({ status: "nothing", filename: file.name, report: outcome.report });
      }
      const store = await getMyDataStore();
      const { folder } = await store.importItems(outcome.items, {
        filename: file.name,
        format: fileExtension(file.name),
      });
      await refresh();
      const geometries = outcome.items.map((item) => item.geometry);
      show({
        status: "imported",
        filename: file.name,
        report: outcome.report,
        counts: countsByType(geometries),
        folder: { id: folder.id, name: folder.name },
        bounds: boundsOf(geometries),
        undone: false,
      });
    } catch (reason) {
      show({
        status: "refused",
        filename: file.name,
        message: `Nothing was imported. ${reasonText(reason, "The file could not be read.")}`,
      });
    }
  }, [openSheet, refresh]);

  const undoImport = useCallback(async () => {
    if (importResult?.status !== "imported" || importResult.undone) return;
    const { folder, counts } = importResult;
    const total = counts.pins + counts.lines + counts.areas;
    const confirmed = window.confirm(
      `Move ${folder.name} and its ${total} ${total === 1 ? "item" : "items"} to Trash? `
        + "You can restore them from Trash for 30 days.",
    );
    if (!confirmed) return;
    await mutate(async () => (await getMyDataStore()).trashFolder(folder.id));
    setImportResult({ ...importResult, undone: true });
  }, [importResult, mutate]);

  const showImportOnMap = useCallback(() => {
    if (importResult?.status !== "imported") return;
    onVisibleChange(true);
    if (importResult.bounds) showBounds(importResult.bounds);
    closeSheet();
  }, [closeSheet, importResult, onVisibleChange, showBounds]);

  const archiveNow = useCallback(async () => {
    const snapshot = await (await getMyDataStore()).load();
    downloadFile(buildArchive(snapshot, new Date()));
  }, []);

  const restoreFile = useCallback(async (file: File) => {
    try {
      const text = await file.text();
      const store = await getMyDataStore();
      const plan = planRestore(text, await store.load());
      if (!plan.ok) return setRestoreResult({ status: "refused", message: plan.message });
      await store.applyRestore(plan);
      await refresh();
      setRestoreResult({ status: "restored", lines: describeRestore(plan.summary) });
    } catch (reason) {
      setRestoreResult({
        status: "refused",
        message: `Nothing was restored. ${reasonText(reason, "The file could not be read.")}`,
      });
    }
  }, [refresh]);

  const deleteAll = useCallback(async () => {
    await mutate(async () => (await getMyDataStore()).deleteAll());
    setExportScope(null);
    setImportResult(null);
    setRestoreResult(null);
  }, [mutate]);

  return {
    resolvedScope,
    importResult,
    restoreResult,
    startExport,
    importFile,
    undoImport,
    showImportOnMap,
    archiveNow,
    restoreFile,
    deleteAll,
    openBackup: () => openSheet(sheetIds.backup),
  };
}
