import { isLayerAvailableAtCameraHeight, type LayerDefinition } from "@/config/layers/types";

// A DNR layer holds more records than one query returns, so it loads only from a close enough
// view. Until the camera reports its height it is not treated as too far away.
export function awaitsZoom(layer: LayerDefinition, visible: boolean, cameraHeight: number): boolean {
  return (
    layer.dnr !== undefined &&
    visible &&
    Number.isFinite(cameraHeight) &&
    !isLayerAvailableAtCameraHeight(layer, cameraHeight)
  );
}
