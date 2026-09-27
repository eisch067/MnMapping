"use client";

import { useState, type ChangeEvent, type FormEvent } from "react";
import { builtInSymbols } from "@/lib/myDataSymbols";
import { isPersonalMode } from "@/config/appMode";
import {
  TRASH_VIEW_ID,
  UNFILED_VIEW_ID,
  type MyDataFolder,
  type MyDataSettings,
  type MyMapItem,
} from "@/lib/myData";
import type { ExportScope } from "@/lib/exchange/scope";
import { MyDataToolbar } from "./MyDataToolbar";

export interface MyDataSlotProps {
  items: readonly MyMapItem[];
  allItems: readonly MyMapItem[];
  folders: readonly MyDataFolder[];
  settings: MyDataSettings | null;
  error: string | null;
  visible: boolean;
  onVisibleChange: (visible: boolean) => void;
  onImportFile: (file: File) => Promise<void>;
  onExportScope: (scope: ExportScope) => void;
  onOpenBackup: () => void;
  onCreateFolder: (name: string) => Promise<unknown>;
  onMoveItem: (itemId: string, folderId: string | null) => Promise<unknown>;
  onDeleteItem: (itemId: string) => Promise<unknown>;
  onDeleteFolder: (folderId: string) => Promise<unknown>;
  onRestoreItem: (itemId: string) => Promise<unknown>;
  onRestoreFolder: (folderId: string) => Promise<unknown>;
  onUpdateSettings: (changes: Partial<MyDataSettings>) => Promise<unknown>;
  onEditItem?: (item: MyMapItem) => void;
}

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
  selecting: boolean;
  selected: boolean;
  onSelectedChange: (selected: boolean) => void;
  onMove: (folderId: string | null) => Promise<unknown>;
  onDelete: () => Promise<unknown>;
  onEdit?: () => void;
}) {
  return (
    <div className={`my-data-item ${props.selecting ? "is-selecting" : ""}`}>
      {props.selecting && (
        <input
          type="checkbox"
          aria-label={`Select ${props.item.name}`}
          checked={props.selected}
          onChange={(event) => props.onSelectedChange(event.target.checked)}
        />
      )}
      <span><strong>{props.item.name}</strong><small>{props.item.note ?? props.item.geometry.type}</small></span>
      <select aria-label={`Folder for ${props.item.name}`} value={props.item.folderId ?? ""} onChange={(event) => void props.onMove(event.target.value || null)}>
        <option value="">Unfiled</option>
        {props.folders.filter((folder) => !folder.deletion).map((folder) => <option key={folder.id} value={folder.id}>{folder.name}</option>)}
      </select>
      {props.onEdit && <button type="button" onClick={props.onEdit}>Edit shape</button>}
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
  const updatePoint = (changes: Partial<MyDataSettings["point"]>) => (
    props.onUpdateSettings({ point: { ...settings.point, ...changes } })
  );
  const updateLine = (changes: Partial<MyDataSettings["line"]>) => (
    props.onUpdateSettings({ line: { ...settings.line, ...changes } })
  );
  const updatePolygon = (changes: Partial<MyDataSettings["polygon"]>) => (
    props.onUpdateSettings({ polygon: { ...settings.polygon, ...changes } })
  );
  return (
    <details className="my-data-settings">
      <summary>My Data settings</summary>
      <div>
        <label>Default pin symbol<select value={settings.point.symbolId} onChange={(event) => void updatePoint({ symbolId: event.target.value })}>{builtInSymbols.map((symbol) => <option key={symbol.id} value={symbol.id}>{symbol.glyph} {symbol.label}</option>)}</select></label>
        <label>Pin color<input type="color" value={settings.point.color} onChange={(event) => void updatePoint({ color: event.target.value })} /></label>
        <label>Line color<input type="color" value={settings.line.color} onChange={(event) => void updateLine({ color: event.target.value })} /></label>
        <label>Line width<input type="range" min="1" max="10" step="1" value={settings.line.width} onChange={(event) => void updateLine({ width: event.target.valueAsNumber })} /><output>{settings.line.width}px</output></label>
        <label>Line distance<select value={settings.line.dimensionKind} onChange={(event) => void updateLine({ dimensionKind: event.target.value as MyDataSettings["line"]["dimensionKind"] })}><option value="horizontal">Horizontal</option>{isPersonalMode && <><option value="direct">Direct (DEM)</option><option value="ground">Ground (DEM)</option></>}</select></label>
        <label>Line unit<select value={settings.line.unit} onChange={(event) => void updateLine({ unit: event.target.value as MyDataSettings["line"]["unit"] })}><option value="miles">Miles</option><option value="feet">Feet</option><option value="kilometers">Kilometers</option><option value="meters">Meters</option></select></label>
        <label>Polygon outline<input type="color" value={settings.polygon.outlineColor} onChange={(event) => void updatePolygon({ outlineColor: event.target.value })} /></label>
        <label>Polygon fill<input type="color" value={settings.polygon.fillColor} onChange={(event) => void updatePolygon({ fillColor: event.target.value })} /></label>
        <label>Fill opacity<input type="range" min="0" max="1" step="0.05" value={settings.polygon.opacity} onChange={(event) => void updatePolygon({ opacity: event.target.valueAsNumber })} /><output>{Math.round(settings.polygon.opacity * 100)}%</output></label>
        <label>Polygon dimension<select value={settings.polygon.dimensionKind} onChange={(event) => void updatePolygon({ dimensionKind: event.target.value as MyDataSettings["polygon"]["dimensionKind"] })}><option value="area">Area</option><option value="perimeter">Perimeter</option><option value="both">Both</option></select></label>
        <label>Area unit<select value={settings.polygon.areaUnit} onChange={(event) => void updatePolygon({ areaUnit: event.target.value as MyDataSettings["polygon"]["areaUnit"] })}><option value="acres">Acres</option><option value="square-feet">Square feet</option><option value="square-miles">Square miles</option><option value="hectares">Hectares</option></select></label>
        <label>Perimeter unit<select value={settings.polygon.perimeterUnit} onChange={(event) => void updatePolygon({ perimeterUnit: event.target.value as MyDataSettings["polygon"]["perimeterUnit"] })}><option value="miles">Miles</option><option value="feet">Feet</option><option value="kilometers">Kilometers</option><option value="meters">Meters</option></select></label>
      </div>
      <small>Changes apply to new items only.</small>
      {isPersonalMode && <small>Direct and ground distances are estimates from Minnesota’s 0.5 m NAVD88 lidar DEM (2021–2023); MNDNR contributed data. They are not survey measurements.</small>}
    </details>
  );
}

export function MyDataSlot(props: MyDataSlotProps) {
  const [viewId, setViewId] = useState<string>(UNFILED_VIEW_ID);
  const [selecting, setSelecting] = useState(false);
  const [selectedIds, setSelectedIds] = useState<ReadonlySet<string>>(new Set());
  const activeFolders = props.folders.filter((folder) => !folder.deletion);
  const selectedFolder = activeFolders.find((folder) => folder.id === viewId);
  const shownItems = props.items.filter((item) => item.folderId === (selectedFolder?.id ?? null));
  const inTrash = viewId === TRASH_VIEW_ID;
  const importSelectedFile = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (file) void props.onImportFile(file);
  };
  const changeView = (id: string) => {
    setViewId(id);
    setSelectedIds(new Set());
  };
  const setSelected = (itemId: string, selected: boolean) => {
    const next = new Set(selectedIds);
    if (selected) next.add(itemId);
    else next.delete(itemId);
    setSelectedIds(next);
  };
  const finishSelecting = () => {
    setSelecting(false);
    setSelectedIds(new Set());
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
      <FolderNavigation
        folders={props.folders}
        viewId={viewId}
        onViewChange={changeView}
        onCreateFolder={props.onCreateFolder}
      />
      {props.error && <p role="alert" className="my-data-error">{props.error}</p>}
      {inTrash ? <TrashView {...props} /> : (
        <>
          <MyDataToolbar
            selecting={selecting}
            selectedCount={selectedIds.size}
            shownCount={shownItems.length}
            totalCount={props.items.length}
            onStartSelecting={() => setSelecting(true)}
            onFinishSelecting={finishSelecting}
            onSelectAll={() => setSelectedIds(new Set(shownItems.map((item) => item.id)))}
            onClearSelection={() => setSelectedIds(new Set())}
            onExportSelection={() =>
              props.onExportScope({ kind: "selection", itemIds: [...selectedIds] })}
            onExportView={() =>
              props.onExportScope({ kind: "folder", folderId: selectedFolder?.id ?? null })}
            onExportAll={() => props.onExportScope({ kind: "all" })}
          />
          {selectedFolder && <button className="delete-folder" type="button" onClick={deleteSelectedFolder}>Move folder to Trash</button>}
          <div className="my-data-list">
            {shownItems.map((item) => (
              <ItemRow
                key={item.id}
                item={item}
                folders={props.folders}
                selecting={selecting}
                selected={selectedIds.has(item.id)}
                onSelectedChange={(selected) => setSelected(item.id, selected)}
                onMove={(folderId) => props.onMoveItem(item.id, folderId)}
                onDelete={() => props.onDeleteItem(item.id)}
                onEdit={item.geometry.type === "Point" ? undefined : () => props.onEditItem?.(item)}
              />
            ))}
            {!shownItems.length && <p>No items in this view.</p>}
          </div>
        </>
      )}
      <SettingsEditor settings={props.settings} onUpdateSettings={props.onUpdateSettings} />
      <label className="file-import">Import GPX, KML, or GeoJSON<input type="file" accept=".gpx,.kml,.geojson,.json" onChange={importSelectedFile} /></label>
      <button type="button" onClick={props.onOpenBackup}>Backup and restore</button>
      <p>Stored only in this browser unless you export it. Trash is removed after 30 days.</p>
    </div>
  );
}
