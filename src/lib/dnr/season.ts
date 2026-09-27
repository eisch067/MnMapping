import type { DnrSeasonRule } from "@/config/layers/types";

// What a season-specific layer's row and results show. Anything but "current" keeps the layer
// listed but unavailable, because DNR's boundaries for a lapsed season are not the ones in force.
export type SeasonGate =
  | { status: "current"; label: string }
  | { status: "checking" }
  | { status: "unverified"; lastVerified: string; officialUrl: string };

export interface SeasonGateSource {
  officialUrl: string;
}

const monthNames = [
  ["january", "jan"],
  ["february", "feb"],
  ["march", "mar"],
  ["april", "apr"],
  ["may"],
  ["june", "jun"],
  ["july", "jul"],
  ["august", "aug"],
  ["september", "sept", "sep"],
  ["october", "oct"],
  ["november", "nov"],
  ["december", "dec"],
];

const periodPattern = /^([a-z]+)\.?\s+(\d{4})(?:\s*[-–—]\s*([a-z]+)\.?\s+(\d{4}))?$/i;

function monthIndex(name: string): number {
  return monthNames.findIndex((names) => names.includes(name.toLowerCase()));
}

// Periods are whole months, read in UTC; the few hours' difference from Minnesota time does not
// matter at that grain.
function parsePeriod(text: string): { start: number; end: number } | null {
  const match = periodPattern.exec(text.trim());
  if (!match) return null;
  const [, firstMonth, firstYear, lastMonth = firstMonth, lastYear = firstYear] = match;
  const startMonth = monthIndex(firstMonth);
  const endMonth = monthIndex(lastMonth);
  if (startMonth < 0 || endMonth < 0) return null;
  const start = Date.UTC(Number(firstYear), startMonth, 1);
  const end = Date.UTC(Number(lastYear), endMonth + 1, 1);
  return end > start ? { start, end } : null;
}

export function isPeriodCurrent(text: string, now: Date): boolean {
  const period = parsePeriod(text);
  return period !== null && now.getTime() >= period.start && now.getTime() < period.end;
}

function unverified(lastVerified: string, source: SeasonGateSource): SeasonGate {
  return { status: "unverified", lastVerified, officialUrl: source.officialUrl };
}

export function serviceSeasonGate(
  rule: Extract<DnrSeasonRule, { source: "service" }>,
  source: SeasonGateSource,
  periods: readonly string[],
  now: Date,
): SeasonGate {
  const published = [...new Set(periods.map((period) => period.trim()))];
  const allCurrent =
    published.length > 0 && published.every((period) => isPeriodCurrent(period, now));
  return allCurrent
    ? { status: "current", label: published.join(" / ") }
    : unverified(rule.lastVerifiedPeriod, source);
}

const isoDate = /^\d{4}-\d{2}-\d{2}$/;

export function configuredSeasonGate(
  rule: Extract<DnrSeasonRule, { source: "configured" }>,
  source: SeasonGateSource,
  now: Date,
): SeasonGate {
  const through = isoDate.test(rule.verifiedThrough)
    ? Date.parse(rule.verifiedThrough)
    : Number.NaN;
  const dayAfter = through + 24 * 60 * 60 * 1000;
  return now.getTime() < dayAfter
    ? { status: "current", label: rule.label }
    : unverified(rule.label, source);
}
