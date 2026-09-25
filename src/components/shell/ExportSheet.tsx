"use client";

import { useMemo, useState } from "react";
import { buildExport, gpxAreaNotice, type ExportFormat } from "@/lib/exchange/exportFiles";
import type { ResolvedScope } from "@/lib/exchange/scope";
import type { MyDataFolder } from "@/lib/myData";
import { downloadAll, downloadFile } from "./downloadFile";

export interface ExportSheetProps {
  scope: ResolvedScope | null;
  folders: readonly MyDataFolder[];
}

const destinations: readonly { format: ExportFormat; label: string; hint: string }[] = [
  { format: "kml", label: "OnX Web (KML)", hint: "Pins, lines, and areas. One file per folder." },
  {
    format: "gpx",
    label: "OnX Mobile (GPX)",
    hint: "Pins as waypoints; lines and areas as tracks.",
  },
  {
    format: "geojson",
    label: "GeoJSON (GIS)",
    hint: "One file with folders, colors, and symbols.",
  },
];

function sizeLabel(content: string): string {
  const bytes = new Blob([content]).size;
  return bytes < 1024 * 1024
    ? `${Math.max(1, Math.round(bytes / 1024))} KB`
    : `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}

export function ExportSheet({ scope, folders }: ExportSheetProps) {
  const [format, setFormat] = useState<ExportFormat>("kml");
  const files = useMemo(
    () =>
      scope
        ? buildExport({
            items: scope.items,
            folders,
            scopeName: scope.name,
            format,
            exportedAt: new Date(),
          })
        : [],
    [scope, folders, format],
  );
  if (!scope) return <p className="sheet-hint">Choose what to export from My Data.</p>;
  const notice = format === "gpx" ? gpxAreaNotice(scope.items) : null;
  return (
    <div className="exchange-sheet">
      <p className="exchange-scope">{scope.label}</p>
      <div className="tool-buttons" role="group" aria-label="Export destination">
        {destinations.map((destination) => (
          <button
            key={destination.format}
            type="button"
            aria-pressed={format === destination.format}
            onClick={() => setFormat(destination.format)}
          >
            {destination.label}
          </button>
        ))}
      </div>
      <p className="sheet-hint">
        {destinations.find((destination) => destination.format === format)?.hint}
      </p>
      {notice && (
        <p className="exchange-notice" role="note">
          {notice}
        </p>
      )}
      {files.length === 0 ? (
        <p className="sheet-hint">There is nothing to export here.</p>
      ) : (
        <>
          {files.length > 1 && (
            <p className="sheet-hint">
              This is {files.length} files. Import each one; OnX reads them one at a time.
            </p>
          )}
          <ul className="exchange-files" aria-label="Files">
            {files.map((file) => (
              <li key={file.filename}>
                <span>
                  <strong>{file.filename}</strong>
                  <small>
                    {file.itemCount} {file.itemCount === 1 ? "item" : "items"} ·{" "}
                    {sizeLabel(file.content)}
                  </small>
                </span>
                <button type="button" onClick={() => downloadFile(file)}>
                  Download
                </button>
              </li>
            ))}
          </ul>
          {files.length > 1 && (
            <button className="tool-finish" type="button" onClick={() => void downloadAll(files)}>
              Download all {files.length} files
            </button>
          )}
        </>
      )}
      <p className="sheet-hint">
        Trash is never exported. Use Backup and restore to keep a full copy.
      </p>
    </div>
  );
}
