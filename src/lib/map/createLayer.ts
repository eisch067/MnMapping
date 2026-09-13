import type { DataSource, ImageryLayer, TerrainProvider } from "cesium";
import type { LayerDefinition } from "@/config/layers";

export type CesiumLayerResource = ImageryLayer | DataSource | TerrainProvider;

export async function createLayerResource(layer: LayerDefinition): Promise<CesiumLayerResource> {
  const {
    ArcGisMapServerImageryProvider,
    CesiumTerrainProvider,
    GeoJsonDataSource,
    ImageryLayer,
    Rectangle,
    TileMapServiceImageryProvider,
    WebMapServiceImageryProvider,
    WebMapTileServiceImageryProvider,
  } = await import("cesium");
  const common = {
    alpha: layer.defaultOpacity,
    show: layer.defaultVisible,
  };
  const rectangle = layer.bounds
    ? Rectangle.fromDegrees(layer.bounds.west, layer.bounds.south, layer.bounds.east, layer.bounds.north)
    : undefined;

  switch (layer.sourceType) {
    case "tms":
      return ImageryLayer.fromProviderAsync(
        TileMapServiceImageryProvider.fromUrl(layer.url, levelOptions(layer)),
        common,
      );
    case "wms":
      return new ImageryLayer(
        new WebMapServiceImageryProvider({
          url: layer.url,
          layers: requiredOption(layer, "layers"),
          parameters: {
            transparent: booleanOption(layer, "transparent") ?? true,
            format: stringOption(layer, "format") ?? "image/png",
            version: stringOption(layer, "version") ?? "1.1.1",
          },
          enablePickFeatures: false,
          rectangle,
          ...levelOptions(layer),
        }),
        common,
      );
    case "wmts":
      return new ImageryLayer(
        new WebMapTileServiceImageryProvider({
          url: layer.url,
          layer: requiredOption(layer, "layer"),
          style: stringOption(layer, "style") ?? "default",
          format: stringOption(layer, "format") ?? "image/png",
          tileMatrixSetID: requiredOption(layer, "tileMatrixSetID"),
          ...levelOptions(layer),
        }),
        common,
      );
    case "arcgis-mapserver":
    case "arcgis-imageserver":
      return ImageryLayer.fromProviderAsync(
        ArcGisMapServerImageryProvider.fromUrl(layer.url, {
          credit: layer.attribution,
          enablePickFeatures: booleanOption(layer, "enablePickFeatures") ?? false,
          layers: stringOption(layer, "layers"),
          rectangle,
          usePreCachedTilesIfAvailable: booleanOption(layer, "usePreCachedTilesIfAvailable") ?? true,
        }),
        common,
      );
    case "geojson":
      return GeoJsonDataSource.load(layer.url, { clampToGround: true });
    case "cesium-terrain":
      return CesiumTerrainProvider.fromUrl(layer.url);
    case "arcgis-featureserver":
      throw new Error("ArcGIS FeatureServer rendering will be implemented with vector layers when first needed.");
  }
}

function levelOptions(layer: LayerDefinition) {
  return { minimumLevel: layer.minimumLevel, maximumLevel: layer.maximumLevel };
}

function stringOption(layer: LayerDefinition, key: string): string | undefined {
  const value = layer.options?.[key];
  return typeof value === "string" ? value : undefined;
}

function booleanOption(layer: LayerDefinition, key: string): boolean | undefined {
  const value = layer.options?.[key];
  return typeof value === "boolean" ? value : undefined;
}

function requiredOption(layer: LayerDefinition, key: string): string {
  const value = stringOption(layer, key);
  if (!value) throw new Error(`${layer.name} requires the \"${key}\" option.`);
  return value;
}
