"use client";

import { useState, type ChangeEvent, type FormEvent } from "react";
import { builtInSymbols } from "@/lib/myDataSymbols";
import {
  TRASH_VIEW_ID,
  UNFILED_VIEW_ID,
  type MyDataFolder,
  type MyDataSettings,
  type MyMapItem,
} from "@/lib/myData";
import type { ExportFormat } from "./useMyData";

export interface MyDataSlotProps {
  items: readonly MyMapItem[];
  allItems: readonly MyMapItem[];
  folders: readonly MyDataFolder[];
  settings: MyDataSettings | null;
  error: string | null;
  visible: boolean;
  onVisibleChange: (visible: boolean) => void;
  onImport: (file: File) => Promise<void>;
  onExport: (format: ExportFormat) => void;
  onCreateFolder: (name: string) => Promise<unknown>;
  onMoveItem: (itemId: string, folderId: string | null) => Promise<unknown>;
  onDeleteItem: (itemId: string) => Promise<unknown>;
  onDeleteFolder: (folderId: string) => Promise<unknown>;
  onRestoreItem: (itemId: string) => Promise<unknown>;
  onRestoreFolder: (folderId: string) => Promise<unknown>;
  onUpdateSettings: (changes: Partial<MyDataSettings>) => Promise<unknown>;
}

const exportFormats: readonly { format: ExportFormat; label: string }[] = [
  { format: "gpx", label: "GPX" },
  { format: "kml", label: "KML" },
  { format: "geojson", label: "GeoJSON" },
];

function FolderNavigation(props: {
  folders: readonly MyDataFolder[];
  viewId: string;
  onViewChange: (id: string) => void;
  onCreateFolder: (name: string) => Promise<unknown>;
}) {
  const [name, setName] = useState("");
  const activeFolders = props.folders.filter((folder) => !folder.deletion);
  const submit = async (event: FormEvent) => {
    event.preventDefault();
    await props.onCreateFolder(name);
    setName("");
  };
  return (
    <div className="my-data-folders">
      <div className="my-data-view-buttons" aria-label="My Data views">
        <button type="button" aria-pressed={props.viewId === UNFILED_VIEW_ID} onClick={() => props.onViewChange(UNFILED_VIEW_ID)}>Unfiled</button>
        {activeFolders.map((folder) => (
          <button key={folder.id} type="button" aria-pressed={props.viewId === folder.id} onClick={() => props.onViewChange(folder.id)}>{folder.name}</button>
        ))}
        <button type="button" aria-pressed={props.viewId === TRASH_VIEW_ID} onClick={() => props.onViewChange(TRASH_VIEW_ID)}>Trash</button>
      </div>
      <form className="folder-create" onSubmit={(event) => void submit(event)}>
        <input aria-label="New folder name" value={name} onChange={(event) => setName(event.target.value)} placeholder="New folder" />
        <button type="submit" disabled={!name.trim()}>Create folder</button>
      </form>
    </div>
  );
}

function ItemRow(props: {
  item: MyMapItem;
  folders: readonly MyDataFolder[];
  onMove: (folderId: string | null) => Promise<unknown>;
  onDelete: () => Promise<unknown>;
}) {
  return (
    <div className="my-data-item">
      <span><strong>{props.item.name}</strong><small>{props.item.note ?? props.item.geometry.type}</small></span>
      <select aria-label={`Folder for ${props.item.name}`} value={props.item.folderId ?? ""} onChange={(event) => void props.onMove(event.target.value || null)}>
        <option value="">Unfiled</option>
        {props.folders.filter((folder) => !folder.deletion).map((folder) => <option key={folder.id} value={folder.id}>{folder.name}</option>)}
      </select>
      <button type="button" aria-label={`Move ${props.item.name} to Trash`} onClick={() => void props.onDelete()}>×</button>
    </div>
  );
}

function TrashView(props: Pick<MyDataSlotProps, "allItems" | "folders" | "onRestoreFolder" | "onRestoreItem">) {
  const folders = props.folders.filter((folder) => folder.deletion);
  const items = props.allItems.filter((item) => item.deletion);
  if (!folders.length && !items.length) return <p>Trash is empty.</p>;
  return (
    <div className="my-data-list">
      {folders.map((folder) => (
        <div key={folder.id} className="my-data-item">
          <span><strong>{folder.name}</strong><small>Folder</small></span>
          <button type="button" onClick={() => void props.onRestoreFolder(folder.id)}>Restore folder</button>
        </div>
      ))}
      {items.map((item) => (
        <div key={item.id} className="my-data-item">
          <span><strong>{item.name}</strong><small>{item.geometry.type}</small></span>
          <button type="button" onClick={() => void props.onRestoreItem(item.id)}>Restore item</button>
        </div>
      ))}
    </div>
  );
}

function SettingsEditor(props: Pick<MyDataSlotProps, "settings" | "onUpdateSettings">) {
  const settings = props.settings;
  if (!settings) return null;
  return (
    <details className="my-data-settings">
      <summary>My Data settings</summary>
      <div>
        <label>Default pin symbol<select value={settings.point.symbolId} onChange={(event) => void props.onUpdateSettings({ point: { ...settings.point, symbolId: event.target.value } })}>{builtInSymbols.map((symbol) => <option key={symbol.id} value={symbol.id}>{symbol.glyph} {symbol.label}</option>)}</select></label>
        <label>Pin color<input type="color" value={settings.point.color} onChange={(event) => void props.onUpdateSettings({ point: { ...settings.point, color: event.target.value } })} /></label>
        <label>Line distance<select value={settings.line.dimensionKind} onChange={(event) => void props.onUpdateSettings({ line: { ...settings.line, dimensionKind: event.target.value as MyDataSettings["line"]["dimensionKind"] } })}><option value="horizontal">Horizontal</option><option value="direct">Direct</option><option value="ground">Ground</option></select></label>
        <label>Polygon dimension<select value={settings.polygon.dimensionKind} onChange={(event) => void props.onUpdateSettings({ polygon: { ...settings.polygon, dimensionKind: event.target.value as MyDataSettings["polygon"]["dimensionKind"] } })}><option value="area">Area</option><option value="perimeter">Perimeter</option><option value="both">Both</option></select></label>
      </div>
      <small>Changes apply to new items only.</small>
    </details>
  );
}

export function MyDataSlot(props: MyDataSlotProps) {
  const [viewId, setViewId] = useState<string>(UNFILED_VIEW_ID);
  const activeFolders = props.folders.filter((folder) => !folder.deletion);
  const selectedFolder = activeFolders.find((folder) => folder.id === viewId);
  const shownItems = props.items.filter((item) => item.folderId === (selectedFolder?.id ?? null));
  const importSelectedFile = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) void props.onImport(file);
  };
  const deleteSelectedFolder = () => {
    if (!selectedFolder) return;
    const count = props.items.filter((item) => item.folderId === selectedFolder.id).length;
    const itemLabel = count === 1 ? "item" : "items";
    if (window.confirm(`Move ${selectedFolder.name} and its ${count} ${itemLabel} to Trash?`)) {
      void props.onDeleteFolder(selectedFolder.id).then(() => setViewId(TRASH_VIEW_ID));
    }
  };
  return (
    <div className="my-data-slot">
      <label className="my-data-visibility"><input type="checkbox" checked={props.visible} onChange={(event) => props.onVisibleChange(event.target.checked)} />Show My Data on the map</label>
      <FolderNavigation folders={props.folders} viewId={viewId} onViewChange={setViewId} onCreateFolder={props.onCreateFolder} />
      {props.error && <p role="alert" className="my-data-error">{props.error}</p>}
      {viewId === TRASH_VIEW_ID ? <TrashView {...props} /> : (
        <>
          {selectedFolder && <button className="delete-folder" type="button" onClick={deleteSelectedFolder}>Move folder to Trash</button>}
          <div className="my-data-list">
            {shownItems.map((item) => <ItemRow key={item.id} item={item} folders={props.folders} onMove={(folderId) => props.onMoveItem(item.id, folderId)} onDelete={() => props.onDeleteItem(item.id)} />)}
            {!shownItems.length && <p>No items in this view.</p>}
          </div>
        </>
      )}
      <SettingsEditor settings={props.settings} onUpdateSettings={props.onUpdateSettings} />
      <label className="file-import">Import GPX, KML, or GeoJSON<input type="file" accept=".gpx,.kml,.geojson,.json" onChange={importSelectedFile} /></label>
      <div className="export-buttons">{exportFormats.map(({ format, label }) => <button key={format} type="button" onClick={() => props.onExport(format)}>{label}</button>)}</div>
      <p>Stored only in this browser unless you export it. Trash is removed after 30 days.</p>
    </div>
  );
}
