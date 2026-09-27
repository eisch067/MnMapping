# Parcels and local data

Parcel services are queried by viewport only at parcel-scale camera heights. County adapters map source fields into the shared `Parcel` model, keeping geometry transport separate from normalized identify attributes. Thirty-one north-expansion counties and Becker use the official statewide MnGeo Open Parcels layer with a county-code filter and 35 km camera-height threshold. Aitkin, Beltrami, Hubbard, Todd, Douglas, Mahnomen, and Wadena use verified direct public services. Douglas County emphasizes that its parcel layer is a reference compilation, not a survey.

The South expansion adds 25 counties through the statewide adapter plus direct official services for Brown, Meeker, Dodge, and Goodhue. Across Minnesota, 68 counties currently expose repeatable parcel layers and 19 remain pending. Brown County's public service contains 18,481 parcel polygons and parcel identifiers but intentionally publishes no owner information. The full South decision record is in [`south-region-status.md`](south-region-status.md).

Aitkin uses the county's public `ParcelTaxData` FeatureServer, which supports bounded GeoJSON queries and publishes parcel ID, owner, physical address, deeded acres, legal description, assessed value, and tax year. The direct service, field mapping, CORS behavior, and a bounded geometry query were verified on 2026-09-14. MnGeo's statewide Open Parcels metadata also listed Aitkin with 43,024 parcel records at verification time; the county service was selected because it is direct and exposes richer current assessment attributes.

Kanabec, Kittson, Pine, and Roseau remain pending because the statewide metadata lists them but the parcel polygon layer returned no matching records, and no other repeatable query service was verified. Beltrami, Mahnomen, and Wadena moved from pending to direct county sources after their anonymous services were re-audited on 2026-09-14. See [`north-region-status.md`](north-region-status.md) for the batch record.

Map inspection shows live desktop coordinates. Clicking or tapping the map identifies the point: the [Explore sheet](identify.md) lists the coordinates, which can be copied, and every visible public-land, parcel, and saved item under the point.

Pins and drawings use GeoJSON-compatible geometry and are stored in IndexedDB v2. Existing v1 items migrate in place to **Unfiled** with their IDs preserved. My Data folders are non-nested and unique after trimming and case folding; **Unfiled** and **Trash** are system views rather than editable folder records.

Deleting a folder confirms the number of contained items and moves the folder and those items to Trash as one recoverable bundle. Restoring the folder restores only that bundle. Restoring an item while its folder remains in Trash sends the item to Unfiled, and restoring a folder whose name is already active adds `(restored)` to its name. Local-only Trash expires after 30 days using the device clock.

Items save their appearance, primary-dimension choice, optional import provenance, timestamps, revision, deletion metadata, and a pending outbox mutation. Folders and My Data settings carry the same synchronization-ready metadata even though this slice has no sync adapter. All writes pass through the shared My Data store. Built-in point symbols use stable identifiers and fall back to the standard pin when an identifier is unavailable. Preferences unrelated to My Data remain in localStorage. No personal geometry is uploaded by MnMapping.

The My Data sheet can hide personal geometry, create folders, move items, restore Trash, change defaults for future items, select items, import GPX/KML/GeoJSON into an Import folder, and export active items to GPX/KML/GeoJSON. Its Backup and restore sheet downloads and restores a My Data archive and deletes everything in this browser. The rules for each are in [import-export.md](import-export.md).

GPX represents polygons as closed tracks because GPX has no polygon primitive, and the export sheet says how many. KML and GeoJSON preserve areas. Measurements are deliberately labeled approximate.
