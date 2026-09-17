export type LayerLoadStatus = "idle" | "loading" | "ready" | "error";

export interface LayerRuntimeState {
  status: LayerLoadStatus;
  message?: string;
  featureCount?: number;
}

export type LayerRuntimeStateById = Record<string, LayerRuntimeState>;
