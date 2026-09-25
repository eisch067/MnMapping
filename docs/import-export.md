# Import, export, and My Data archive

How My Data leaves and enters the browser. The contract was chosen in [#12](https://github.com/eisch067/MnMapping/issues/12); this page records what the code does. Everything runs in the browser: no file is uploaded, and nothing here needs a network connection.

Code lives in `src/lib/exchange/` (pure logic, no React) and `src/components/shell/` (`useExchange`, `ExportSheet`, `ImportResultSheet`, `BackupSheet`, `MyDataToolbar`). The store operations (`importItems`, `applyRestore`, `deleteAll`) are in `src/lib/myData.ts`.

## Where each flow lives

| Flow | Entry point | Sheet |
| --- | --- | --- |
| Interoperability export | My Data: **Export this list…**, **Export all…**, or **Select** then **Export selected…** | Export |
| Import | My Data: **Import GPX, KML, or GeoJSON** | Import result |
| My Data archive, restore, delete-all | My Data: **Backup and restore** | Backup and restore |

Export, Import result, and Backup and restore are secondary sheets: they open from a flow and have no tool-row action. Reopen My Data from the tool row to go back.

## Interoperability export

Choices are labelled by destination.

| Choice | Contents |
| --- | --- |
| OnX Web (KML) | Pin, line, and area geometry; name; note as `description` (omitted when empty); no styles. One file per folder. |
| OnX Mobile (GPX) | Pins as `wpt`; lines as one `trk`; areas as closed `trk`; name; note as `desc`. One file per folder. |
| GeoJSON (GIS) | One file with geometry, name, note, folder name, and a `mnmapping` object holding the appearance and primary dimension. Never split. |

- Trash is never included. Only active items are exported.
- Polygon rings are closed before serialization, coordinates are written to 6 decimals, files are UTF-8, and names and notes are escaped as text (characters XML forbids are dropped).
- Filenames are the sanitized folder or selection name plus the local time, for example `North-40_2026-09-23_1841.kml`.
- KML and GPX files split into export parts at 3,000 items or 3.5 MB, whichever comes first. Parts are named `..._part-01-of-03` and never mix folders. A folder is never merged with another, so a selection that spans folders becomes one file per folder.
- Several files are downloaded one after another; the Export sheet lists every file with its own **Download** button and a **Download all** button. There is no ZIP, because OnX needs the files unzipped.
- Choosing GPX shows a notice with the number of areas that will become closed tracks, and points to KML through OnX Web when area shapes matter.

The per-item "export from its detail sheet" scope is not offered yet because no item detail sheet exists; selecting one item in select mode exports it.

## Import

Accepted: `.gpx`, `.kml`, `.geojson`, `.json`. KMZ is refused with "export as KML instead".

| Rule | Behavior |
| --- | --- |
| Size | A file over 10 MB is refused from its size, before it is read. |
| Item count | More than 5,000 items refuses the whole file. |
| Vertices | An item over 20,000 vertices is simplified (Douglas-Peucker, smallest tolerance that fits) and reported as a warning. |
| Multi-part | MultiPoint, MultiLineString, MultiPolygon, GeometryCollection, KML MultiGeometry, and multi-segment GPX tracks become separate items named `Name`, `Name (2)`, and so on. GPX routes import as lines. |
| Holes | Polygon holes are dropped and counted. |
| Closed lines | Closed lines and closed tracks stay lines. Unclosed polygon rings are closed. |
| Altitude, time | Discarded. |
| Invalid | Non-finite or out of range coordinates, lines with fewer than 2 distinct points, and polygons with fewer than 3 distinct vertices are rejected with a reason. Any valid WGS 84 coordinate is accepted. |
| Unsupported | `GroundOverlay`, `ScreenOverlay`, `PhotoOverlay`, `NetworkLink`, `Model`, and `gx:Track` are skipped and counted. |
| Notes | Tags stripped, entities decoded, capped at 2,000 characters (typed notes have the same cap). |
| Styling | Source styling is ignored; items take the My Data settings defaults. |
| KML folders | Flattened into the one Import folder and counted. |
| GeoJSON `mnmapping` | Ignored on import; only the archive restores losslessly. |

Import is atomic. The file is parsed and validated in memory, then the Import folder and all its items are written in one IndexedDB transaction, so a parse error or write failure never leaves a partial import. The folder is named from the filename and the local time (`north40.gpx 2026-09-23 18:41`); importing the same file twice makes two folders.

The Import result sheet shows counts by type, grouped warnings, and rejected items (first 20, expandable). **Show on map** frames the imported items; **Undo import** moves the folder and its items to Trash as one bundle after a confirmation, so they stay recoverable for 30 days. When no item is valid, no folder is created and the reasons are shown.

## My Data archive and restore

The archive is a JSON file (`format: "mnmapping-archive"`, `schemaVersion`) holding every item, folder, and the settings, including Trash and import provenance.

Restore is additive and never changes anything already present:

- Items whose ids are missing are recreated; items already present (active or in Trash) are left untouched.
- Folders are matched by normalized name, otherwise created. A created folder whose id is already taken gets a new id.
- Trashed items return to Trash with their original deletion dates only if their 30 days have not expired; expired ones are skipped.
- Settings are applied only when the current settings have never been changed (revision 1), because a local My Data always has a settings record.
- An archive from a newer schema is refused with an update message. Archives from older schemas do not exist yet.
- Every recreated record is queued for synchronization with a new mutation.

The result lists what was restored, left unchanged, and skipped.

## Delete-all (local half)

**Delete all my data…** offers an archive download first, then requires ticking "I understand this cannot be undone." before **Delete everything** is enabled. It clears items, folders, Trash, and settings from this browser and recreates default settings. The server half arrives with sync.

## Tests

- `src/lib/exchange/*.test.ts` and `src/lib/myData.test.ts` hold the fixture corpus: one test per rule above. The parser tests run under jsdom for `DOMParser`.
- `tests/e2e/exchange.spec.ts` covers import, undo, refusal, KML and GPX export, select mode, archive, delete-all, and restore in the browser.

## Owner-run acceptance

Before release, import fixtures exported from a preview build into OnX Hunt Web Map (KML) and the OnX mobile app (GPX), which needs a paid OnX membership, and walk through select mode, the Export sheet, the Import result sheet, and restore on a preview build. Import limits and OnX behavior are documented at [#6](https://github.com/eisch067/MnMapping/issues/6).
