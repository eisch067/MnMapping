"use client";

import type { ChangeEvent } from "react";
import type { MyMapItem } from "@/lib/myData";
import type { ExportFormat } from "./useMyData";

export interface MyDataSlotProps {
  items: readonly MyMapItem[];
  visible: boolean;
  onVisibleChange: (visible: boolean) => void;
  onImport: (file: File) => Promise<void>;
  onExport: (format: ExportFormat) => void;
  onDelete: (id: string) => void;
  onClear: () => void;
}

const exportFormats: readonly { format: ExportFormat; label: string }[] = [
  { format: "gpx", label: "GPX" },
  { format: "kml", label: "KML" },
  { format: "geojson", label: "GeoJSON" },
];

export function MyDataSlot(props: MyDataSlotProps) {
  const { items, visible, onVisibleChange, onImport, onExport, onDelete, onClear } = props;
  const importSelectedFile = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) void onImport(file);
  };
  const clearAfterConfirmation = () => {
    if (window.confirm("Delete all locally saved map data?")) onClear();
  };

  return (
    <div className="my-data-slot">
      <label className="my-data-visibility">
        <input
          type="checkbox"
          checked={visible}
          onChange={(event) => onVisibleChange(event.target.checked)}
        />
        Show My Data on the map
      </label>
      <label className="file-import">
        Import GPX, KML, or GeoJSON
        <input type="file" accept=".gpx,.kml,.geojson,.json" onChange={importSelectedFile} />
      </label>
      <div className="export-buttons">
        {exportFormats.map(({ format, label }) => (
          <button key={format} type="button" onClick={() => onExport(format)}>
            {label}
          </button>
        ))}
      </div>
      <div className="my-data-list">
        {items.map((item) => (
          <div key={item.id}>
            <span>
              <strong>{item.name}</strong>
              <small>{item.note ?? item.geometry.type}</small>
            </span>
            <button
              type="button"
              aria-label={`Delete ${item.name}`}
              onClick={() => onDelete(item.id)}
            >
              ×
            </button>
          </div>
        ))}
      </div>
      {items.length > 0 && (
        <button className="delete-all" type="button" onClick={clearAfterConfirmation}>
          Delete all local data
        </button>
      )}
      <p>Stored only in this browser unless you export it.</p>
    </div>
  );
}
