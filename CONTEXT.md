# MnMapping

MnMapping is a Minnesota-focused map for comparing public geospatial information and managing a person's private map annotations across their devices.

## Language

**Layer**:
An independently displayable map dataset with its own visibility, opacity, ordering, and source information.
_Avoid_: Overlay, feed

**Layer group**:
A named collection of related layers whose group control suspends and restores the user's active subset.
_Avoid_: Master layer, all-layers toggle

**Active subset**:
The layers within a layer group that the user has individually selected and expects the group control to restore.
_Avoid_: All layers, group default

**My Data item**:
A private, user-owned pin, line, polygon, or imported geometry together with its descriptive information, synchronized across that user's devices.
_Avoid_: Marker, drawing, feature when referring to all personal geometry types

**Folder**:
A non-nested collection containing My Data items; each item belongs to exactly one folder.
_Avoid_: Tag, layer

**Unfiled**:
The automatic folder for My Data items that have not been assigned to another folder.
_Avoid_: Root folder, uncategorized layer

**Import folder**:
A folder created for one import operation and named from the source filename and the user's local import date and time so separate imports remain distinguishable.
_Avoid_: Upload folder, source file

**My Data settings**:
The user's synchronized defaults for newly created My Data items, including their initial symbols and primary dimensions; changing a default does not change existing items.
_Avoid_: Program defaults, global item settings

**Built-in symbol**:
A point symbol supplied by MnMapping and referenced by a stable identifier so its selection synchronizes without uploading an image.
_Avoid_: Custom symbol, uploaded icon

**My Data archive**:
A versioned, lossless download of the user's active and trashed My Data items, folders, settings, and import provenance for backup or recovery.
_Avoid_: Account archive, interoperability export

**Interoperability export**:
A GPX, KML, or GeoJSON file of active My Data items made for another program, carrying only what that format and destination can represent; it never includes Trash and is not a backup.
_Avoid_: Archive, backup, OnX sync

**Export part**:
One numbered file produced when an OnX-targeted folder export is split to stay within OnX's import limits; parts never mix folders.
_Avoid_: Chunk, page, batch

**Archive restore**:
Recreating, in the current My Data, the items from a My Data archive that are missing, without changing or overwriting anything already present.
_Avoid_: Import, sync, reset

**Conflict copy**:
An active copy of a My Data item that preserves an edit which could not be merged automatically with a concurrent edit or deletion from another device.
_Avoid_: Duplicate, backup

**Trash**:
The recoverable collection holding deleted My Data items and folders for 30 days before permanent deletion, counted from the server-accepted deletion time when synchronized and from the device's clock in local-only mode.
_Avoid_: Archive, deleted folder

**Personal build**:
The Access-protected deployment for the owner and their invited group; it carries content and features not cleared for open sharing and synchronizes My Data.
_Avoid_: Private version, admin build

**Public build**:
The open sharing deployment, which omits personal-only content and never synchronizes My Data.
_Avoid_: Free version, demo

**Local-only mode**:
My Data kept on a single device with no synchronization, as in the public build.
_Avoid_: Offline mode, guest mode

**Primary dimension**:
The user's chosen unit and measurement displayed directly on a line or polygon; its details may also show equivalent measurements in other units.
_Avoid_: Default unit, only measurement

**Horizontal distance**:
Distance over the earth between mapped positions without accounting for terrain height.
_Avoid_: Flat distance, line of sight

**Direct distance**:
Straight three-dimensional distance between measured positions, including their elevation difference.
_Avoid_: Line of sight, ground distance

**Ground distance**:
Distance following the mapped terrain surface between measured positions.
_Avoid_: Walking time, direct distance

**DNR Recreation**:
The curated collection of verified Minnesota DNR datasets useful for hunting, fishing, and public outdoor access.
_Avoid_: All DNR data

**Hunting zone**:
A permit, management, or regulation boundary for hunting that does not establish land ownership or permission to enter; one that changes by season carries a Season label.
_Avoid_: Hunting land, public-access boundary

**Season label**:
The effective period shown with a season-specific hunting layer, taken from the DNR service when it publishes one and from a MnMapping-verified label otherwise; a layer whose season label is not current is unavailable rather than drawn.
_Avoid_: Layer year, version

**LakeFinder summary**:
An embedded summary of official DNR lake identity, surveyed species, special fishing regulations, invasive species, and morphology joined through a Public Waters Basin's DOW lake number.
_Avoid_: Fishing forecast, bowfishing eligibility

**Listed infested water**:
A water body DNR has designated as infested with a named aquatic invasive species, which carries legal restrictions; it is a designation, not merely an invasive species observed in a lake.
_Avoid_: Invasive species list, infested lake

**Lake depth map**:
A live DNR bathymetry layer showing mapped lake outlines, depth contours, and an elevation model where official coverage exists; a historical DNR PDF may supplement it for an individual lake.
_Avoid_: LakeFinder summary, statewide depth coverage

**Terrain viewshed**:
An estimated area visible from an observer location based only on mapped terrain, observer height, and maximum distance.
_Avoid_: Line of sight, visibility guarantee

**Sheet**:
A panel of related controls or details that opens over the map: a bottom sheet on a phone and a side panel on a desktop, one at a time. Layers and My Data are sheets that share tabs; identify, drawing, DNR results, and terrain use the same host.
_Avoid_: Modal, popup

**Tool row**:
The primary actions of the map, one per sheet: a dock along the bottom of a phone and a rail down the left of a desktop. A desktop rail can be pinned, which docks the open sheet beside the map and resizes it.
_Avoid_: Toolbar, menu bar
