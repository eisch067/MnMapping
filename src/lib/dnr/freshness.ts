import type { DnrFreshness } from "@/config/layers/types";

export interface FreshnessStatus {
  label: string;
  contentDate: string;
  stale: boolean;
  warning?: string;
}

export function evaluateFreshness(
  freshness: DnrFreshness,
  now: Date = new Date(),
): FreshnessStatus {
  const today = now.toISOString().slice(0, 10);
  const stale = today > freshness.freshThrough;
  return {
    label: freshness.label,
    contentDate: freshness.contentDate,
    stale,
    warning: stale ? freshness.staleWarning : undefined,
  };
}
