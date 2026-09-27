import { isPersonalMode } from "@/config/appMode";

// The DNR GIS server publishes every hosted service under one host, so the provider is pinned
// to the single server that holds the CWD zones rather than to the host.
export const dnrGisRoot =
  "https://gis.dnr.state.mn.us/arcgis/sharing/servers/8462b6a81c46461484c68d4bd638134c/rest/services/";

// LakeFinder's by-ID API sits beside, not under, the GIS server, so it has its own pinned root.
export const dnrLakeFinderRoot = "https://services.dnr.state.mn.us/api/lakefinder/";

const providerRoots = {
  hubbard: "https://gis.co.hubbard.mn.us/arcgis/rest/services/",
  becker: "https://gis-server.co.becker.mn.us/arcgis/rest/services/",
  todd: "https://gis.mytoddcounty.com/toddcounty/rest/services/",
  "mngeo-dem": "https://enterprise.gisdata.mn.gov/agsimg/rest/services/",
  "mngeo-imagery": "https://imageserver.gisdata.mn.gov/cgi-bin/",
  "mngeo-features": "https://enterprise.gisdata.mn.gov/aghost/rest/services/",
  "mngeo-boundaries": "https://feat.gisdata.mn.gov/arcgis/rest/services/",
  "esri-reference": "https://server.arcgisonline.com/ArcGIS/rest/services/",
  "douglas-open": "https://services2.arcgis.com/8iQOd6RvhPL17pJd/arcgis/rest/services/",
  "meeker-open": "https://services2.arcgis.com/pHb2Lre5eSy5plfE/arcgis/rest/services/",
  "goodhue-public": "https://publicmaps.co.goodhue.mn.us/arcgis/rest/services/",
  wadena: "https://gis.co.wadena.mn.us/arcgis/rest/services/",
  beltrami: "https://arcgis.co.beltrami.mn.us/arcgis/rest/services/",
  brown: "https://gis.browncountymn.gov/server/rest/services/",
  "carlton-imagery": "https://svc.pictometry.com/Image/",
  "olmsted-imagery": "https://public.gis.olmstedcounty.gov/arcgis/rest/services/",
  "ramsey-imagery": "https://maps.co.ramsey.mn.us/arcgis/rest/services/",
  "aitkin-imagery": "https://gisweb.co.aitkin.mn.us/arcgis/rest/services/",
  "anoka-imagery": "https://gis.anokacountymn.gov/anoka_gis/rest/services/",
  "big-stone-imagery": "https://gis.bigstonecounty.gov/arcgis/rest/services/",
  "blue-earth-imagery": "https://gis.blueearthcountymn.gov/server/rest/services/",
  "carver-imagery": "https://tiles.arcgis.com/tiles/wMZT8kNwa6tOxhKg/arcgis/rest/services/",
  "cass-imagery": "https://cassweb.casscountymn.gov/arcgis/rest/services/",
  "chippewa-imagery": "https://gis.chippewa.mn/arcgis/rest/services/",
  "chisago-imagery": "https://gis.chisagocounty.us/arcgis/rest/services/",
  "clay-imagery": "https://map.claycountymn.gov/arcgis/rest/services/",
  "clearwater-imagery": "https://map.co.clearwater.mn.us/arcgis/rest/services/",
  "crow-wing-imagery": "https://gis.crowwing.us/cwc_external_main/rest/services/",
  "dakota-imagery": "https://gisimg.co.dakota.mn.us/arcgis/rest/services/",
  "dodge-imagery": "https://maps.co.goodhue.mn.us/server/rest/services/",
  "goodhue-imagery": "https://maps.co.goodhue.mn.us/server/rest/services/",
  "grant-imagery": "https://gis.co.grant.mn.us/arcgis/rest/services/",
  "mille-lacs-imagery": "https://gis.co.mille-lacs.mn.us/arcgis/rest/services/",
  "mcleod-imagery": "https://tiles.arcgis.com/tiles/7sSDkfIZpd2ReAg5/arcgis/rest/services/",
  "marshall-imagery": "https://gis.co.marshall.mn.us/server/rest/services/",
  "mower-imagery": "https://gisweb.co.mower.mn.us/server/rest/services/",
  "otter-tail-imagery": "https://tiles.arcgis.com/tiles/Pg1yLLk3jMuhxBKI/arcgis/rest/services/",
  "pennington-imagery": "https://gismap.co.pennington.mn.us/arcgis/rest/services/",
  "pipestone-imagery": "https://gis.pcmn.us/arcgis/rest/services/",
  "pope-imagery": "https://gis.popecountymn.gov/arcgis/rest/services/",
  "scott-imagery": "https://gis.co.scott.mn.us/arcgis/rest/services/",
  "sherburne-imagery": "https://gis.co.sherburne.mn.us/arcgis3/rest/services/",
  "stearns-imagery": "https://gis.co.stearns.mn.us/arcgis/rest/services/",
  "steele-imagery": "https://gis.steele.mn/server/rest/services/",
  "stevens-imagery": "https://gis.co.stevens.mn.us/arcgis/rest/services/",
  "traverse-imagery": "https://gis.co.traverse.mn.us/arcgis/rest/services/",
  "washington-imagery": "https://maps.co.washington.mn.us/arcgis/rest/services/",
  "wilkin-imagery": "https://gisweb.co.wilkin.mn.us/arcgis/rest/services/",
  "yellow-medicine-imagery": "https://gis.co.ym.mn.gov/arcgis/rest/services/",
  // DNR data awaits DNR confirmation before any public release, so only the personal build reaches it.
  ...(isPersonalMode ? { "dnr-gis": dnrGisRoot, "dnr-lakefinder": dnrLakeFinderRoot } : {}),
} as const;

type Provider = keyof typeof providerRoots;

function isProvider(value: string): value is Provider {
  return Object.hasOwn(providerRoots, value);
}

// A dot segment would let a request climb out of the provider's root.
function isSafePath(path: readonly string[]): boolean {
  return (
    path.length > 0 &&
    path.every((segment) => segment !== "." && segment !== ".." && /^[A-Za-z0-9_.()-]+$/.test(segment))
  );
}

export function resolveUpstream(provider: string, path: readonly string[]): URL | null {
  if (!isProvider(provider) || !isSafePath(path)) return null;
  if (provider === "mngeo-features" && path[0] === "us_mn_state_dnr" && !isPersonalMode) return null;
  const root = providerRoots[provider];
  if (!root) return null;
  const upstream = new URL(path.join("/"), root);
  return upstream.href.startsWith(root) ? upstream : null;
}
