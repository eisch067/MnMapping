import { describe, expect, it } from "vitest";
import type { DnrSeasonRule } from "@/config/layers/types";
import {
  configuredSeasonGate,
  isPeriodCurrent,
  serviceSeasonGate,
  type SeasonGateSource,
} from "@/lib/dnr/season";

const at = (iso: string) => new Date(`${iso}T12:00:00Z`);

describe("isPeriodCurrent", () => {
  it("is current from the first day of the first month through the last day of the last", () => {
    const period = "July 2026 - June 2027";

    expect(isPeriodCurrent(period, at("2026-06-30"))).toBe(false);
    expect(isPeriodCurrent(period, at("2026-07-01"))).toBe(true);
    expect(isPeriodCurrent(period, at("2027-06-30"))).toBe(true);
    expect(isPeriodCurrent(period, at("2027-07-01"))).toBe(false);
  });

  it("reads en and em dashes, abbreviated months, and uneven spacing", () => {
    expect(isPeriodCurrent("Jul 2026 – Jun 2027", at("2026-10-01"))).toBe(true);
    expect(isPeriodCurrent("July 2026—June 2027", at("2026-10-01"))).toBe(true);
    expect(isPeriodCurrent("  july   2026   -   june 2027 ", at("2026-10-01"))).toBe(true);
  });

  it("reads a single month as a period of that month", () => {
    expect(isPeriodCurrent("November 2026", at("2026-11-15"))).toBe(true);
    expect(isPeriodCurrent("November 2026", at("2026-12-01"))).toBe(false);
  });

  it.each([
    ["an empty value", ""],
    ["a blank value", " "],
    ["a year with no months", "2026-2027"],
    ["an unknown month", "Julember 2026 - June 2027"],
    ["a period that ends before it starts", "June 2027 - July 2026"],
    ["free text", "See the DNR page"],
  ])("is not current for %s", (_label, period) => {
    expect(isPeriodCurrent(period, at("2026-10-01"))).toBe(false);
  });
});

describe("serviceSeasonGate", () => {
  const rule: Extract<DnrSeasonRule, { source: "service" }> = {
    source: "service",
    field: "effperiod",
    lastVerifiedPeriod: "July 2025 - June 2026",
  };
  const source: SeasonGateSource = { officialUrl: "https://www.dnr.state.mn.us/cwd/index.html" };

  it("is current with the service's own period as the season label", () => {
    const gate = serviceSeasonGate(rule, source, ["July 2026 - June 2027"], at("2026-10-01"));

    expect(gate).toEqual({ status: "current", label: "July 2026 - June 2027" });
  });

  it("is unverified when the period has passed, keeping the last verified period and link", () => {
    const gate = serviceSeasonGate(rule, source, ["July 2025 - June 2026"], at("2026-10-01"));

    expect(gate).toEqual({
      status: "unverified",
      lastVerified: "July 2025 - June 2026",
      officialUrl: "https://www.dnr.state.mn.us/cwd/index.html",
    });
  });

  it("is unverified when the service publishes no period", () => {
    expect(serviceSeasonGate(rule, source, [], at("2026-10-01")).status).toBe("unverified");
    expect(serviceSeasonGate(rule, source, [""], at("2026-10-01")).status).toBe("unverified");
  });

  it("is unverified when any feature carries a period that is not current", () => {
    const periods = ["July 2026 - June 2027", "July 2025 - June 2026"];

    expect(serviceSeasonGate(rule, source, periods, at("2026-10-01")).status).toBe("unverified");
  });

  it("names every period when the current features disagree on wording", () => {
    const periods = ["July 2026 - June 2027", "Jul 2026 - Jun 2027"];

    const gate = serviceSeasonGate(rule, source, periods, at("2026-10-01"));

    expect(gate).toEqual({ status: "current", label: "July 2026 - June 2027 / Jul 2026 - Jun 2027" });
  });
});

describe("configuredSeasonGate", () => {
  const rule: Extract<DnrSeasonRule, { source: "configured" }> = {
    source: "configured",
    label: "2026 season",
    verifiedThrough: "2027-03-31",
  };
  const source: SeasonGateSource = {
    officialUrl: "https://www.dnr.state.mn.us/hunting/bear/index.html",
  };

  it("is current through the end of the verified-through day", () => {
    expect(configuredSeasonGate(rule, source, at("2026-09-26"))).toEqual({
      status: "current",
      label: "2026 season",
    });
    expect(configuredSeasonGate(rule, source, at("2027-03-31")).status).toBe("current");
  });

  it("is unverified the day after the verified-through date", () => {
    expect(configuredSeasonGate(rule, source, at("2027-04-01"))).toEqual({
      status: "unverified",
      lastVerified: "2026 season",
      officialUrl: "https://www.dnr.state.mn.us/hunting/bear/index.html",
    });
  });

  it("is unverified when the verified-through date is missing or malformed", () => {
    expect(configuredSeasonGate({ ...rule, verifiedThrough: "" }, source, at("2026-09-26")).status)
      .toBe("unverified");
    expect(
      configuredSeasonGate({ ...rule, verifiedThrough: "next spring" }, source, at("2026-09-26"))
        .status,
    ).toBe("unverified");
  });
});
