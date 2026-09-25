import type { MyDataFolder, MyMapItem } from "@/lib/myDataModel";

export type ExportScope =
  | { kind: "folder"; folderId: string | null }
  | { kind: "selection"; itemIds: readonly string[] }
  | { kind: "all" };

export interface ResolvedScope {
  items: MyMapItem[];
  // Names a file that holds the whole scope.
  name: string;
  // Shown to the person choosing what to export.
  label: string;
}

function countLabel(count: number): string {
  return `${count} ${count === 1 ? "item" : "items"}`;
}

export function resolveScope(
  scope: ExportScope,
  items: readonly MyMapItem[],
  folders: readonly MyDataFolder[],
): ResolvedScope {
  const active = items.filter((item) => !item.deletion);
  if (scope.kind === "all") {
    return { items: active, name: "My Data", label: `All My Data (${countLabel(active.length)})` };
  }
  if (scope.kind === "folder") {
    const inFolder = active.filter((item) => item.folderId === scope.folderId);
    const name = folders.find((folder) => folder.id === scope.folderId)?.name ?? "Unfiled";
    return { items: inFolder, name, label: `${name} (${countLabel(inFolder.length)})` };
  }
  const chosen = new Set(scope.itemIds);
  const selected = active.filter((item) => chosen.has(item.id));
  const only = selected.length === 1 ? selected[0] : undefined;
  if (only) return { items: selected, name: only.name, label: only.name };
  return { items: selected, name: "Selection", label: `${selected.length} selected items` };
}
