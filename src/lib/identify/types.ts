import type { LayerDefinition } from "@/config/layers";

export interface IdentifyPoint {
  longitude: number;
  latitude: number;
  // How far from the click, in meters, a line or a pin still counts as under it.
  toleranceMeters: number;
}

export interface IdentifyRow {
  label: string;
  value: string;
}

export interface IdentifyLink {
  label: string;
  href: string;
}

export interface IdentifyResult {
  id: string;
  // The layer name, or "My Data" for a saved item.
  sourceName: string;
  title: string;
  kind: "layer" | "my-data";
  // Words such as "Pin" or "Line" that tell saved items apart in the list.
  detailLabel?: string;
  rows: IdentifyRow[];
  notes: string[];
  links: IdentifyLink[];
}

export interface IdentifyFailure {
  layerName: string;
  message: string;
}

export interface IdentifyContext {
  point: IdentifyPoint;
  signal?: AbortSignal;
  fetcher: typeof fetch;
}

// One adapter per layer source type. A later slice that can identify another source type
// (DNR services, for one) supplies its adapter in adapters.ts and nothing else changes.
export type LayerIdentifyAdapter = (
  layer: LayerDefinition,
  context: IdentifyContext,
) => Promise<IdentifyResult[]>;
