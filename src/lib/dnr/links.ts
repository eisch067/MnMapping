// Only https pages on DNR's own domain are linked from DNR data or checked as a verify link.
export function isDnrPage(href: string | undefined): boolean {
  if (!href) return false;
  try {
    const url = new URL(href);
    return url.protocol === "https:" && /(^|\.)dnr\.state\.mn\.us$/.test(url.hostname);
  } catch {
    return false;
  }
}
