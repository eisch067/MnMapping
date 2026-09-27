# Identify

Clicking or tapping the map asks one question: what is here? The Explore sheet answers it for the exact point, and a crosshair on the map marks the point.

## What the sheet shows

- **Coordinates.** Latitude and longitude to six decimals, with a Copy coordinates button. Clear removes the point and its crosshair.
- **Results, topmost first.** Saved My Data first, then the visible layers from the one drawn on top down. Selecting a result opens its details; Results goes back to the list.
- **A layer that cannot be checked.** It is named in a notice and does not hide the other results.

Only layers that are turned on, and within the camera height they load at, are asked. Imagery, basemap, and terrain layers report nothing.

Saved pins and lines are found within 20 screen pixels of the click, so a fingertip can select them. A pin is measured to its tip, the point it marks. Areas are found when the click falls inside them or within the same distance of their edge. Saved items are listed pins, then lines, then areas, newest first.

Only the Inspect mode identifies. While a drawing tool is armed in the Add sheet, clicks place points instead.

The map shows no Cesium infobox and no selection frame; the sheet is the only place details appear.

## Where the code is

| File | Role |
| --- | --- |
| `src/lib/identify/identify.ts` | `identifyAt` picks the layers to ask, runs their adapters together, and orders the results |
| `src/lib/identify/adapters.ts` | The adapter for each layer source type |
| `src/lib/identify/featureServer.ts` | The adapter for ArcGIS feature services: a point query using the layer's own `where` and `outFields` |
| `src/lib/identify/featureDetails.ts` | Turns a feature's attributes into a title, rows, notes, and links from the layer's `nameField`, `popupFields`, or `parcelFields` |
| `src/lib/identify/myData.ts` | Finds saved items under a point |
| `src/lib/map/layerStack.ts` | The order the map draws layers, which identify reads top down |
| `src/components/shell/useIdentify.ts` | Holds the point, the results, and the selection; cancels a request that a newer click replaces |
| `src/components/shell/IdentifySheet.tsx` | The sheet |
| `src/components/map/useCrosshair.ts` | The crosshair |

## Adding identify to a layer source type

`identifyAdapters` lists every `LayerSourceType`. A `null` entry means the source has nothing to report at a point. To identify a new kind of source, such as the DNR services, write a function of type `LayerIdentifyAdapter` that takes the layer and the point and returns `IdentifyResult` values, and put it in that table. Nothing else changes: the ordering, the failure notice, and the sheet already handle its results.

The feature-service adapter asks for the exact point, which suits the polygon layers there are today. A layer of lines or points needs its adapter to add a search distance from `IdentifyPoint.toleranceMeters`.

An adapter should send only the fields the layer's own configuration allows, so the identify never shows an attribute the layer is set up to hide. In the public build that includes the owner and mailing fields removed from county parcel layers.

## Tests

`src/lib/identify/*.test.ts` cover the ordering, the layers skipped, a failing layer, the point query sent to a feature service, the feature titles and rows, and the saved-item hit tests. `tests/e2e/identify.spec.ts` runs at 390×844 and 1280×800 with the layer services mocked: results listed topmost first, details, copying coordinates, a touch tap, a saved pin, a failing layer, and no Cesium infobox.
