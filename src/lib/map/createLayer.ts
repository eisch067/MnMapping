import type { DataSource, ImageryLayer, TerrainProvider } from "cesium";
import type { LayerDefinition } from "@/config/layers";

export type CesiumLayerResource = ImageryLayer | DataSource | TerrainProvider;

export async function createLayerResource(layer: LayerDefinition): Promise<CesiumLayerResource> {
  const {
    ArcGisMapServerImageryProvider,
    ArcGISTiledElevationTerrainProvider,
    CesiumTerrainProvider,
    GeoJsonDataSource,
    ImageryLayer,
    Rectangle,
    TileMapServiceImageryProvider,
    UrlTemplateImageryProvider,
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
    case "arcgis-imageserver": {
      const renderingRule = stringOption(layer, "renderingRule");
      const exportUrl = new URL(`${absoluteBrowserUrl(layer.url)}/exportImage`);
      exportUrl.searchParams.set("bbox", "{westProjected},{southProjected},{eastProjected},{northProjected}");
      exportUrl.searchParams.set("bboxSR", "3857");
      exportUrl.searchParams.set("imageSR", "3857");
      exportUrl.searchParams.set("size", "{width},{height}");
      exportUrl.searchParams.set("format", stringOption(layer, "format") ?? "png");
      exportUrl.searchParams.set("f", "image");
      if (renderingRule) {
        exportUrl.searchParams.set("renderingRule", JSON.stringify({ rasterFunction: renderingRule }));
      }
      const templateUrl = decodeTemplateBraces(exportUrl.toString());
      return new ImageryLayer(
        new UrlTemplateImageryProvider({
          url: templateUrl,
          credit: layer.attribution,
          enablePickFeatures: false,
          hasAlphaChannel: true,
          rectangle,
          ...levelOptions(layer),
        }),
        common,
      );
    }
    case "geojson":
      return GeoJsonDataSource.load(layer.url, { clampToGround: true });
    case "cesium-terrain":
      return CesiumTerrainProvider.fromUrl(layer.url);
    case "arcgis-terrain":
      return ArcGISTiledElevationTerrainProvider.fromUrl(layer.url);
    case "arcgis-featureserver":
      throw new Error("ArcGIS FeatureServer rendering will be implemented with vector layers when first needed.");
  }
}

function absoluteBrowserUrl(url: string): string {
  if (/^https?:\/\//.test(url)) return url.replace(/\/$/, "");
  if (typeof window === "undefined") throw new Error("Relative GIS service URLs require a browser context.");
  return new URL(url.replace(/\/$/, ""), window.location.origin).toString();
}

function decodeTemplateBraces(url: string): string {
  return url.replaceAll("%7B", "{").replaceAll("%7D", "}");
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
