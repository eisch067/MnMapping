import type { LayerDefinition } from "../types";

const proxyRoot = "/api/gis-proxy/becker";
const sourceRoot = "https://gis-server.co.becker.mn.us/arcgis/rest/services";

const vintages = [
  { service: "BeckerAerial2024", year: 2024 },
  { service: "BeckerAerial2021", year: 2021 },
] as const;

export const beckerLayers: LayerDefinition[] = vintages.map((vintage) => ({
  id: `becker-imagery-${vintage.year}`,
  name: `${vintage.year} Becker County`,
  category: "imagery",
  sourceType: "arcgis-mapserver",
  url: `${proxyRoot}/${vintage.service}/MapServer`,
  sourceUrl: `${sourceRoot}/${vintage.service}/MapServer`,
  defaultVisible: false,
  defaultOpacity: 1,
  attribution: "Becker County GIS",
  agency: "Becker County GIS",
  county: "Becker",
  year: vintage.year,
  resolution: "Not published in service metadata",
  description: "Official county cached aerial imagery service.",
  options: { enablePickFeatures: false },
}));
