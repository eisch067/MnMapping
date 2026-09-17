import { countyRegistry } from "@/config/counties";
import { imageryLayers } from "@/config/layers/imagery";
import type { LayerDefinition } from "@/config/layers/types";

export function latestDisplayableImagery(countyName: string): LayerDefinition | undefined {
  const candidates = displayableImageryForCounty(countyName).filter(isDatedNaturalColorImagery);

  return candidates.toSorted((first, second) => {
    const yearDifference = numericYear(second) - numericYear(first);
    if (yearDifference !== 0) return yearDifference;
    return Number(Boolean(second.county)) - Number(Boolean(first.county));
  })[0];
}

export function displayableImageryForCounty(countyName: string): readonly LayerDefinition[] {
  const county = countyRegistry.find((candidate) => candidate.name === countyName);
  return [
    ...imageryLayers,
    ...(county?.layers.filter((layer) => layer.category === "imagery") ?? []),
  ].toSorted((first, second) => {
    if (first.year === "Dynamic") return -1;
    if (second.year === "Dynamic") return 1;
    const yearDifference = numericYear(second) - numericYear(first);
    if (yearDifference !== 0) return yearDifference;
    return Number(Boolean(second.county)) - Number(Boolean(first.county));
  });
}

function isDatedNaturalColorImagery(layer: LayerDefinition): boolean {
  return layer.category === "imagery"
    && typeof layer.year === "number"
    && layer.imageryGroup !== "cir"
    && !/\bCIR\b/i.test(layer.name)
    && !/color infrared/i.test(layer.description ?? "");
}

function numericYear(layer: LayerDefinition): number {
  return typeof layer.year === "number" ? layer.year : Number.NEGATIVE_INFINITY;
}
