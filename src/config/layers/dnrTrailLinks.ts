const dnrRoot = "https://www.dnr.state.mn.us";

function dnrPages(paths: Readonly<Record<string, string>>): Readonly<Record<string, string>> {
  return Object.fromEntries(
    Object.entries(paths).map(([name, path]) => [name, `${dnrRoot}${path}`]),
  );
}

// Exact live-service names reconciled to the DNR State Trails A-Z list on 2026-09-26.
export const stateTrailPages = dnrPages({
  "Alex Laveau Memorial State Trail": "/state_trails/alex-laveau/index.html",
  "Blazing Star State Trail": "/state_trails/blazingstar/index.html",
  "Brown's Creek State Trail": "/state_trails/browns_creek/index.html",
  "Camp Ripley/Veterans Memorial State Trail": "/state_trails/camp-ripley-veterans/index.html",
  "Casey Jones State Trail": "/state_trails/casey_jones/index.html",
  "Central Lakes State Trail": "/state_trails/central_lakes/index.html",
  "Chester Woods State Trail": "/state_trails/chester-woods/index.html",
  "C.J. Ramstad/North Shore State Trail": "/state_trails/north_shore/index.html",
  "Cuyuna Lakes State Trail": "/state_trails/cuyuna_lakes/index.html",
  "David Dill-Arrowhead State Trail": "/state_trails/arrowhead/index.html",
  "David Dill-Taconite State Trail": "/state_trails/taconite/index.html",
  "Douglas State Trail": "/state_trails/douglas/index.html",
  "Gateway State Trail": "/state_trails/gateway/index.html",
  "Gitchi-Gami State Trail": "/state_trails/gitchigami/index.html",
  "Glacial Lakes State Trail": "/state_trails/glacial_lakes/index.html",
  "Goodhue Pioneer State Trail": "/state_trails/goodhue_pioneer/index.html",
  "Great River Ridge State Trail": "/state_trails/great_river_ridge/index.html",
  "Harmony-Preston Valley State Trail": "/state_trails/harmony_preston/index.html",
  "Heartland State Trail": "/state_trails/heartland/index.html",
  "Luce Line State Trail": "/state_trails/luce_line/index.html",
  "Matthew Lourey State Trail": "/state_trails/matthew_lourey/index.html",
  "Mill Towns State Trail": "/state_trails/mill_towns/index.html",
  "Minnesota River State Trail": "/state_trails/minnesota-river/index.html",
  "Minnesota Valley State Trail": "/state_trails/minnesota_valley/index.html",
  "Paul Bunyan State Trail": "/state_trails/paul_bunyan/index.html",
  "Root River State Trail": "/state_trails/root_river/index.html",
  "Sakatah Singing Hills State Trail": "/state_trails/sakatah/index.html",
  "Shooting Star State Trail": "/state_trails/shootingstar/index.html",
  "Taconite State Trail": "/state_trails/taconite/index.html",
  "Willard Munger State Trail": "/state_trails/munger/index.html",
  "Willard Munger State Trail, Hinkley-Duluth Fire Segment": "/state_trails/munger/index.html",
});

export const unreconciledStateTrailNames = [
  "Alborn-Pengilly Railroad State Trail MS84.029",
  "Blue Ox State Trail MS84.029",
  "Blufflands State Trail, Preston to Forestville",
  "Cloquet-Saginaw State Trail",
  "Dakota Rail State Trail MS84.029",
  "Gandy Dancer State Trail MS84.029",
  "OHV access to Taconite State Trail via USFS Rd 11404",
] as const;

// All 35 live-service names reconciled to the DNR State Water Trails A-Z list on 2026-09-26.
export const waterTrailPages = dnrPages({
  "Big Fork River": "/state-water-trails/big-fork-river/index.html",
  "Blue Earth River": "/state-water-trails/blue-earth-river/index.html",
  "Cannon River": "/state-water-trails/cannon-river/index.html",
  "Cedar River": "/state-water-trails/cedar-river/index.html",
  "Chippewa River": "/state-water-trails/chippewa-river/index.html",
  "Cloquet River": "/state-water-trails/cloquet-river/index.html",
  "Cottonwood River": "/state-water-trails/cottonwood-river/index.html",
  "Crow River, North Fork": "/state-water-trails/crow-river-north-fork/index.html",
  "Crow River, South Fork": "/state-water-trails/crow-river-south-fork/index.html",
  "Crow Wing River": "/state-water-trails/crow-wing-river/index.html",
  "Des Moines River": "/state-water-trails/des-moines-river/index.html",
  "Kettle River": "/state-water-trails/kettle-river/index.html",
  "Lake Superior Water Trail": "/kayaking/lswt/index.html",
  "Little Fork River": "/state-water-trails/little-fork-river/index.html",
  "Long Prairie River": "/state-water-trails/long-prairie-river/index.html",
  "Minnesota River": "/state-water-trails/minnesota-river/index.html",
  "Mississippi River": "/state-water-trails/mississippi-river/index.html",
  "Otter Tail River": "/state-water-trails/otter-tail-river/index.html",
  "Pine River": "/state-water-trails/pine-river/index.html",
  "Pomme de Terre River": "/state-water-trails/pomme-de-terre-river/index.html",
  "Red Lake River": "/state-water-trails/red-lake-river/index.html",
  "Red River of the North": "/state-water-trails/red-river/index.html",
  "Redwood River": "/state-water-trails/redwood-river/index.html",
  "Root River": "/state-water-trails/root-river/index.html",
  "Rum River": "/state-water-trails/rum-river/index.html",
  "Sauk River": "/state-water-trails/sauk-river/index.html",
  "Shell Rock River": "/state-water-trails/shell-rock-river/index.html",
  "Snake River": "/state-water-trails/snake-river/index.html",
  "St. Croix River": "/state-water-trails/st-croix-river/index.html",
  "St. Louis River": "/state-water-trails/st-louis-river/index.html",
  "Straight River": "/state-water-trails/straight-river/index.html",
  "Vermilion River": "/state-water-trails/vermilion-river/index.html",
  "Watonwan River": "/state-water-trails/watonwan-river/index.html",
  "Whitewater River": "/state-water-trails/whitewater-river/index.html",
  "Zumbro River": "/state-water-trails/zumbro-river/index.html",
});

export const unreconciledWaterTrailNames: readonly string[] = [];

export const brokenRgmaPdfFiles = [
  "7mile_rgma.pdf",
  "hwy115_rgma.pdf",
  "moose_line_rgma.pdf",
  "morehouse_road.pdf",
  "st_louis_river_rgma.pdf",
] as const;
