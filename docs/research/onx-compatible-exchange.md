# OnX-compatible exchange contract

Research for [Verify the OnX-compatible exchange contract](https://github.com/eisch067/MnMapping/issues/6).

## Decision

Treat OnX as a **file handoff**, not an integration API:

- Offer **OnX Web (KML)** as the recommended export for folders containing pins, lines, or polygons. KML represents Point, LineString, and Polygon geometries directly.
- Offer **OnX Mobile (GPX)** for a file that can be selected directly in the Hunt mobile app. Warn that polygons—and, according to OnX, lines—arrive as Tracks rather than editable Area Shapes/Lines.
- Keep **GeoJSON** as MnMapping's loss-minimizing archive and general GIS interchange format, but do not label it OnX-compatible. OnX's current official workflow accepts only GPX and KML.
- Do not call a private or undocumented OnX endpoint.

OnX documents a 4 MB maximum, 3,000-Markup maximum, and paid-membership requirement for imports. Its mobile app imports GPX only; KML import is through the Web Map. [OnX import/export instructions](https://support.onxmaps.com/hc/en-us/articles/115002196452-How-to-import-and-export-Markups)

## Supported contract

| MnMapping concept | KML to OnX Web | GPX to OnX mobile/Web | GeoJSON |
| --- | --- | --- | --- |
| Pin | `Placemark` + `Point`; position and name are expected to transfer | `wpt`; position and name are expected to transfer | Full-fidelity MnMapping/general GIS export, but not accepted by OnX |
| Line | `Placemark` + `LineString`; preferred | `trk`; OnX documents that Lines exported as GPX become Tracks | Preserved as `LineString`; not accepted by OnX |
| Polygon | `Placemark` + `Polygon`; preferred | No native GPX polygon; a closed `trk` can transfer its boundary, but OnX treats it as a Track, not an Area Shape | Preserved as `Polygon`; not accepted by OnX |
| Name | Preserve in KML `<name>` / GPX `<name>`; OnX explicitly identifies name as transferable | Same | Preserve as a Feature property |
| Note | Encode in KML `<description>` / GPX `<desc>` for standards-compliant interchange, but mark as **not guaranteed to survive OnX** | Same | Preserve as a Feature property |
| Folder | Export the folder's contents in one named file; do not promise that OnX recreates a folder | Same | Preserve `folderId`/folder metadata for MnMapping round-trip |
| Symbol, color, line style/weight | Not guaranteed; use safe defaults after import | Not guaranteed; use safe defaults after import | Preserve MnMapping metadata |
| Measurements / primary dimension | Recompute from geometry after import; do not treat display measurements as exchange data | Same | May preserve settings as properties, but consumers may ignore them |

OnX states that transfers preserve position, size, and name but not icon, color, line style, line weight, notes, or photos. Another OnX article similarly says KML/GPX preserve only position and name, and that colors/icons cannot be restored. [OnX cross-product transfer](https://support.onxmaps.com/hc/en-us/articles/4422141473037-Transferring-Markups-between-onX-Offroad-onX-Hunt-and-onX-Backcountry) · [OnX performance and archival guidance](https://support.onxmaps.com/hc/en-us/articles/4402361866253-How-to-improve-performance-in-the-Hunt-App)

OnX supports folders inside its own account, but its import documentation does not promise folder reconstruction from a file. Therefore a MnMapping folder maps to an export selection/file boundary, not a guaranteed OnX folder. Users can create an OnX folder and add the imported Markups afterward. [OnX editing and folder organization](https://support.onxmaps.com/hc/en-us/articles/360028500652-Editing-and-organizing-Markups)

## Format requirements

### KML

Emit uncomplicated KML using the established `http://www.opengis.net/kml/2.2` namespace:

- one `Document` named for the exported MnMapping folder or selection;
- one `Placemark` per item;
- `name`, optional plain-text `description`, and exactly one Point, LineString, or Polygon;
- longitude, latitude coordinate order;
- a Polygon exterior `LinearRing` whose final coordinate equals its first;
- no KMZ compression, NetworkLinks, remote icons, HTML payloads, or proprietary extensions.

KML formally supports hierarchical containers and Point, LineString, and Polygon geometry, but OnX only documents importing the Markups—not retaining the complete KML document hierarchy or styles. The conservative subset above minimizes parser risk. [OGC KML 2.3 standard](https://docs.ogc.org/is/12-007r2/12-007r2.html) · [OnX import troubleshooting](https://support.onxmaps.com/hc/en-us/articles/360028807671-There-was-an-error-when-I-imported-Markups-Waypoints-Routes-Lines-Shapes-or-Tracks)

### GPX

Emit GPX 1.1 in `http://www.topografix.com/GPX/1/1`, using WGS 84 coordinates:

- pins as `wpt`;
- lines as one `trk` with one `trkseg` and ordered `trkpt` elements;
- polygon boundaries only as closed `trk` elements, with a visible export warning that area semantics and fill are lost;
- `name` and optional `desc` where available.

GPX 1.1 defines waypoints, routes, and tracks but no polygon primitive. The standard also specifies WGS 84 coordinates and metric measurements. [Official GPX 1.1 schema documentation](https://www.topografix.com/gpx/1/1/)

### GeoJSON

Emit an RFC 7946 `FeatureCollection`, stable string Feature IDs, WGS 84 longitude/latitude coordinates, and closed Polygon rings. Put name, note, folder identity, symbol, and measurement preferences in `properties`. GeoJSON is the best MnMapping backup because its standard geometry model directly includes Point, LineString, and Polygon, but it is outside OnX's documented import contract. [RFC 7946](https://www.rfc-editor.org/rfc/rfc7946)

## File naming, limits, and validation

- Sanitize the folder/selection name and append a UTC timestamp, for example `North-40_2026-09-24T01-41-06Z.kml`.
- Count each exported item as one prospective Markup. Refuse or split before 3,000 items or 4 MB; use numbered files such as `..._part-01-of-03.kml`.
- Validate generated XML/JSON and reject non-finite or out-of-range coordinates before download.
- Escape names and notes as text. Never place unsanitized markup in KML descriptions.
- Tell users which route to use: GPX via Hunt mobile **My Content → Import**; GPX or KML via Hunt Web Map **My Content → Import**.
- Preserve the full-fidelity GeoJSON export alongside OnX-targeted files when symbols, notes, folders, or per-item display settings matter.

## Round-trip guarantee

MnMapping can promise the following only:

1. A valid export represents each selected item's geometry and name in the chosen standard.
2. OnX's documented importer accepts conforming GPX/KML only within its membership, size, and count limits.
3. Position/shape size and name are the portable OnX subset. Notes, folders, symbols, colors, line styling, photos, and MnMapping measurement/display preferences are lossy or unverified.
4. A polygon sent through GPX is a closed track boundary, not an area. Use KML through OnX Web when area semantics matter.
5. Measurements are derived from geometry by each program and may differ by algorithm; they are not a round-trip field.

Because OnX warns that some otherwise elaborate Google Earth KML data is incompatible, the implementation should add fixture-based manual acceptance tests against the current Hunt Web Map/mobile app before release. Official documentation defines the supported envelope but does not publish a complete importer schema. [OnX import troubleshooting](https://support.onxmaps.com/hc/en-us/articles/360028807671-There-was-an-error-when-I-imported-Markups-Waypoints-Routes-Lines-Shapes-or-Tracks)

## Repository implications

The current exporter already emits basic KML and GPX, but implementation work should later:

- close Polygon rings before KML/GeoJSON serialization;
- make the GPX polygon-to-Track loss explicit rather than silent;
- add file-size/Markup-count preflight and splitting;
- preserve folder and richer metadata in GeoJSON;
- add format-specific validation and round-trip fixtures;
- expose selected, folder, and all-data exports with the target-specific labels above.

These are implementation consequences, not changes made by this research ticket.
