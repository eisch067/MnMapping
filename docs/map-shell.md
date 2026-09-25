# Map shell

The map shell is the chrome around the Cesium map: a header, a **tool row**, and a **sheet** host. One layout serves both phones and desktops, split at 721 px wide.

| | Phone (720 px and narrower) | Desktop (721 px and wider) |
| --- | --- | --- |
| Header | Brand, the chosen location, and a Change area button | The same, with the Change area label shown |
| Tool row | A dock floating along the bottom, with Add raised in the middle | A rail down the left edge, with a Dock panel button at the bottom |
| Sheet | A bottom sheet that slides over the map, above the dock | A panel beside the rail. Hovering the rail previews the last sheet used, and using the previewed sheet keeps it open; Dock panel pins the sheet beside the map |
| Map | Fills the viewport under the header and dock | Fills the viewport under the header and rail. A docked sheet shrinks the map so nothing sits underneath it |

The map's own credits stay visible above the dock (phone) or beside the rail (desktop) while no sheet covers them.

## Sheets

Every tool-row action opens one sheet, and the sheet host shows one sheet at a time. Choosing the open sheet's action closes it.

| Action | Sheet | Holds |
| --- | --- | --- |
| Explore | Compact | The last point clicked: its coordinates with a copy button, and the [identify](identify.md) results under it. Clicking the map while no sheet is open opens it |
| Layers | Tall, tabbed with My Data | Layer visibility, opacity, ordering, and transfer totals |
| Add | Compact | Pin, Line, and Area drawing tools |
| My Data | Tall, tabbed with Layers | Import, export, list, and delete |
| Map | Compact | Map view and Terrain view |

A drawing tool is armed only while the Add sheet is open. Closing it, or opening another sheet, returns the map to inspecting.

Layers and My Data are separate sheets that share a tab group, so they appear as two tabs of one sheet. On a phone, swiping left or right across the sheet header switches between them; on any screen the tabs are buttons. A swipe must move at least 45 px and more sideways than up or down, and only touch and pen input counts.

## Adding a sheet

1. Write the sheet's body as a component in `src/components/shell/`.
2. Add one entry to `shellSheets` in `src/components/shell/shellSheets.tsx` with an `id`, `title`, `icon`, and `size` (`tall` for long scrolling content, `compact` for content that should leave the map visible). Give it the `tabGroup` of an existing sheet to show the two as tabs of one sheet.
3. The tool row shows the action and the sheet host shows the sheet, with no change to either. Give the sheet its own hook for its state, as `useMyData` and `useMapTools` do, and pass what it needs through `shellSheets` from `MapShell`. The tool row has five slots on a phone, so a sixth action needs a layout decision first.

The state that decides which sheet is open, whether the rail is pinned, and whether it is being previewed lives in `useSheetState`. Pass `onChange` to react when the open sheet changes.

## Tests

`tests/e2e/shell.spec.ts` covers the shell at 390×844 and 1280×800: each action opens its sheet, swiping and the tabs switch sheets, the map fills the viewport around the header and tool row, and pinning the rail resizes the map. `tests/e2e/identify.spec.ts` covers identify. `tests/e2e/layers.spec.ts` and `tests/e2e/location.spec.ts` cover layer toggles, opacity, ordering, and the location gate. These tests stub every remote service, so they run offline.
