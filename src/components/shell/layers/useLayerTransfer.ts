"use client";

import { useEffect, useRef, useState } from "react";
import type { LayerDefinition } from "@/config/layers/types";
import type { LayerStateById } from "@/lib/map/layerState";
import { formatBytes, isLayerVisible } from "./layerGrouping";

export interface LayerTransferUsage {
  bytes: number;
  requests: number;
}

export type LayerTransferById = Record<string, LayerTransferUsage>;

export function usageFor(
  transferByLayer: LayerTransferById,
  layer: LayerDefinition,
): LayerTransferUsage {
  return transferByLayer[layer.id] ?? { bytes: 0, requests: 0 };
}

export function transferLabel(usage: LayerTransferUsage): string {
  if (usage.requests === 0) return "No requests yet";
  const requests = `${usage.requests} ${usage.requests === 1 ? "request" : "requests"}`;
  if (usage.bytes === 0) return `${requests} · size unavailable or cached`;
  return `${formatBytes(usage.bytes)} · ${requests}`;
}

function parseUrl(value: string): URL | undefined {
  try {
    return new URL(value, window.location.origin);
  } catch {
    return undefined;
  }
}

function stringLayerOption(layer: LayerDefinition, key: string): string | undefined {
  const value = layer.options?.[key];
  return typeof value === "string" ? value : undefined;
}

function caseInsensitiveSearchParam(searchParams: URLSearchParams, name: string): string | null {
  const entry = [...searchParams].find(([key]) => key.toLowerCase() === name.toLowerCase());
  return entry?.[1] ?? null;
}

function wmsLayerMatches(request: URL, layer: LayerDefinition): boolean {
  const expected = stringLayerOption(layer, "layers") ?? stringLayerOption(layer, "layer");
  const requested =
    caseInsensitiveSearchParam(request.searchParams, "layers") ??
    caseInsensitiveSearchParam(request.searchParams, "layer");
  return !expected || !requested || requested.split(",").includes(expected);
}

function serviceLayerIdMatches(request: URL, layer: LayerDefinition, basePath: string): boolean {
  const expected = layer.options?.layerId;
  return expected === undefined || request.pathname.startsWith(`${basePath}/${expected}/`);
}

function whereClauseMatches(request: URL, layer: LayerDefinition): boolean {
  const expected = stringLayerOption(layer, "where");
  return !expected || caseInsensitiveSearchParam(request.searchParams, "where") === expected;
}

function renderingRuleMatches(request: URL, layer: LayerDefinition): boolean {
  const expected =
    stringLayerOption(layer, "renderingRule") ?? stringLayerOption(layer, "renderingRuleJson");
  if (!expected) return true;
  const requested = caseInsensitiveSearchParam(request.searchParams, "renderingRule");
  return Boolean(requested?.toLowerCase().includes(expected.toLowerCase().replaceAll('\\"', '"')));
}

function requestBelongsToLayer(request: URL, layer: LayerDefinition): boolean {
  const layerUrl = parseUrl(layer.url);
  if (!layerUrl) return false;
  const basePath = layerUrl.pathname.replace(/\/$/, "");
  const isUnderLayerUrl =
    request.origin === layerUrl.origin &&
    (request.pathname === basePath || request.pathname.startsWith(`${basePath}/`));
  return (
    isUnderLayerUrl &&
    wmsLayerMatches(request, layer) &&
    serviceLayerIdMatches(request, layer, basePath) &&
    whereClauseMatches(request, layer) &&
    renderingRuleMatches(request, layer)
  );
}

function matchLayerRequest(
  requestName: string,
  layers: readonly LayerDefinition[],
  state: LayerStateById,
): LayerDefinition | undefined {
  const request = parseUrl(requestName);
  if (!request) return undefined;
  return layers.find(
    (layer) => isLayerVisible(layer, state) && requestBelongsToLayer(request, layer),
  );
}

function addTransfer(
  entries: readonly PerformanceResourceTiming[],
  layers: readonly LayerDefinition[],
  state: LayerStateById,
): LayerTransferById {
  const additions: LayerTransferById = {};
  for (const entry of entries) {
    const layer = matchLayerRequest(entry.name, layers, state);
    if (!layer) continue;
    const usage = additions[layer.id] ?? { bytes: 0, requests: 0 };
    additions[layer.id] = { bytes: usage.bytes + entry.transferSize, requests: usage.requests + 1 };
  }
  return additions;
}

function mergeTransfer(
  current: LayerTransferById,
  additions: LayerTransferById,
): LayerTransferById {
  const next = { ...current };
  for (const [id, usage] of Object.entries(additions)) {
    const previous = next[id] ?? { bytes: 0, requests: 0 };
    next[id] = {
      bytes: previous.bytes + usage.bytes,
      requests: previous.requests + usage.requests,
    };
  }
  return next;
}

function isResourceTiming(entry: PerformanceEntry): entry is PerformanceResourceTiming {
  return entry.entryType === "resource";
}

// Tallies the bytes the browser reports for each visible layer's requests since the page loaded.
export function useLayerTransfer(
  layers: readonly LayerDefinition[],
  state: LayerStateById,
): LayerTransferById {
  const [transferByLayer, setTransferByLayer] = useState<LayerTransferById>({});
  const layersRef = useRef(layers);
  const stateRef = useRef(state);

  useEffect(() => {
    layersRef.current = layers;
    stateRef.current = state;
  }, [layers, state]);

  useEffect(() => {
    if (typeof PerformanceObserver === "undefined") return;
    performance.setResourceTimingBufferSize(5_000);
    const record = (entries: readonly PerformanceResourceTiming[]) => {
      const additions = addTransfer(entries, layersRef.current, stateRef.current);
      if (Object.keys(additions).length > 0)
        setTransferByLayer((current) => mergeTransfer(current, additions));
    };
    const observer = new PerformanceObserver((list) =>
      record(list.getEntries().filter(isResourceTiming)),
    );
    try {
      observer.observe({ type: "resource", buffered: true });
    } catch {
      // Older browsers reject `type`, so read what exists so far and observe by entry type instead.
      record(performance.getEntriesByType("resource").filter(isResourceTiming));
      observer.observe({ entryTypes: ["resource"] });
    }
    return () => observer.disconnect();
  }, []);

  return transferByLayer;
}
