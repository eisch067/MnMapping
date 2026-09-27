import type { LayerDefinition } from "@/config/layers";

export function absoluteBrowserUrl(url: string): string {
  if (/^https?:\/\//.test(url)) return url.replace(/\/$/, "");
  if (typeof window === "undefined") {
    throw new Error("Relative GIS service URLs require a browser context.");
  }
  return new URL(url.replace(/\/$/, ""), window.location.origin).toString();
}

export function stringOption(layer: LayerDefinition, key: string): string | undefined {
  const value = layer.options?.[key];
  return typeof value === "string" ? value : undefined;
}

export function booleanOption(layer: LayerDefinition, key: string): boolean | undefined {
  const value = layer.options?.[key];
  return typeof value === "boolean" ? value : undefined;
}

export function requiredOption(layer: LayerDefinition, key: string): string {
  const value = stringOption(layer, key);
  if (!value) throw new Error(`${layer.name} requires the \"${key}\" option.`);
  return value;
}
