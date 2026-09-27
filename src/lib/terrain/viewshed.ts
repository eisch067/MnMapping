export interface ViewshedRequest {
  width: number;
  height: number;
  elevations: Float32Array;
  cellSizeMeters: number;
  observerX: number;
  observerY: number;
  observerHeightMeters: number;
  targetHeightMeters: number;
  rangeMeters: number;
}

export const VIEWSHED_CELL_BUDGET = 40_000;

export function validateViewshedRequest(request: ViewshedRequest): string | null {
  const cells = request.width * request.height;
  if (!Number.isInteger(request.width) || !Number.isInteger(request.height) || cells <= 0) return "The elevation window is invalid.";
  if (cells > VIEWSHED_CELL_BUDGET) return `This view needs ${cells.toLocaleString()} cells; the device limit is ${VIEWSHED_CELL_BUDGET.toLocaleString()}. Reduce the range or use a wider cell spacing.`;
  if (request.elevations.length !== cells) return "The elevation window is incomplete.";
  if (request.observerX < 0 || request.observerX >= request.width || request.observerY < 0 || request.observerY >= request.height) return "The observer is outside the elevation window.";
  if (!Number.isFinite(request.cellSizeMeters) || request.cellSizeMeters <= 0 || !Number.isFinite(request.rangeMeters) || request.rangeMeters <= 0) return "The cell spacing and range must be positive.";
  return null;
}

export function calculateViewshed(request: ViewshedRequest): Uint8Array {
  const error = validateViewshedRequest(request);
  if (error) throw new Error(error);
  const { width, height, elevations, observerX, observerY } = request;
  const visible = new Uint8Array(width * height);
  const origin = elevations[observerY * width + observerX];
  if (!Number.isFinite(origin)) return visible;
  visible[observerY * width + observerX] = 1;
  for (let y = 0; y < height; y += 1) {
    for (let x = 0; x < width; x += 1) {
      const dx = x - observerX;
      const dy = y - observerY;
      const distance = Math.hypot(dx, dy) * request.cellSizeMeters;
      if (distance === 0 || distance > request.rangeMeters) continue;
      const steps = Math.max(Math.abs(dx), Math.abs(dy));
      const target = elevations[y * width + x];
      if (!Number.isFinite(target)) continue;
      if (isTargetVisible(request, x, y, origin, target, steps)) visible[y * width + x] = 1;
    }
  }
  return visible;
}

function isTargetVisible(request: ViewshedRequest, x: number, y: number, origin: number, target: number, steps: number): boolean {
  const dx = x - request.observerX;
  const dy = y - request.observerY;
  const distance = Math.hypot(dx, dy) * request.cellSizeMeters;
  const targetSlope = (target + request.targetHeightMeters - origin - request.observerHeightMeters) / distance;
  let horizon = Number.NEGATIVE_INFINITY;
  for (let step = 1; step < steps; step += 1) {
    const sampleX = Math.round(request.observerX + dx * step / steps);
    const sampleY = Math.round(request.observerY + dy * step / steps);
    const terrain = request.elevations[sampleY * request.width + sampleX];
    if (!Number.isFinite(terrain)) continue;
    const sampleDistance = Math.hypot(sampleX - request.observerX, sampleY - request.observerY) * request.cellSizeMeters;
    if (sampleDistance > 0) horizon = Math.max(horizon, (terrain - origin - request.observerHeightMeters) / sampleDistance);
  }
  return targetSlope >= horizon;
}
