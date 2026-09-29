import type { GeoJsonDataSource, ImageryLayer, TerrainProvider } from "cesium";
import type { LayerDefinition } from "@/config/layers";
import type { LayerBounds } from "@/config/layers/types";
import { fetchAllArcGisFeatures, type ArcGisQueryProgress } from "@/lib/map/arcgisFeatures";
import {
  absoluteBrowserUrl,
  booleanOption,
  requiredOption,
  stringOption,
} from "@/lib/map/layerOptions";

export type CesiumLayerResource = ImageryLayer | GeoJsonDataSource | TerrainProvider;

interface LayerRequestContext {
  bounds?: LayerBounds;
  signal?: AbortSignal;
  onProgress?: (progress: ArcGisQueryProgress) => void;
}

export async function createLayerResource(layer: LayerDefinition, context: LayerRequestContext = {}): Promise<CesiumLayerResource> {
  const {
    ArcGisMapServerImageryProvider,
    ArcGISTiledElevationTerrainProvider,
    CesiumTerrainProvider,
    Color,
    ConstantProperty,
    GeoJsonDataSource,
    HeightReference,
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
          rectangle,
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
      const renderingRuleJson = stringOption(layer, "renderingRuleJson");
      const exportUrl = new URL(`${absoluteBrowserUrl(layer.url)}/exportImage`);
      exportUrl.searchParams.set("bbox", "{westProjected},{southProjected},{eastProjected},{northProjected}");
      exportUrl.searchParams.set("bboxSR", "3857");
      exportUrl.searchParams.set("imageSR", "3857");
      exportUrl.searchParams.set("size", "{width},{height}");
      exportUrl.searchParams.set("format", stringOption(layer, "format") ?? "png");
      exportUrl.searchParams.set("transparent", String(booleanOption(layer, "transparent") ?? true));
      exportUrl.searchParams.set("f", "image");
      if (renderingRuleJson) {
        exportUrl.searchParams.set("renderingRule", renderingRuleJson);
      } else if (renderingRule) {
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
    case "geojson": {
      const dataSource = await GeoJsonDataSource.load(layer.url, geoJsonStyle(layer, Color));
      decorateGeoJson(dataSource, ConstantProperty, HeightReference);
      return dataSource;
    }
    case "cesium-terrain":
      return CesiumTerrainProvider.fromUrl(layer.url);
    case "arcgis-terrain":
      return ArcGISTiledElevationTerrainProvider.fromUrl(layer.url);
    case "arcgis-featureserver": {
      const layerId = String(layer.options?.layerId ?? "0");
      const serviceUrl = absoluteBrowserUrl(layer.url);
      const queryUrl = new URL(`${serviceUrl}/${layerId}/query`);
      queryUrl.searchParams.set("where", stringOption(layer, "where") ?? "1=1");
      queryUrl.searchParams.set("outFields", stringOption(layer, "outFields") ?? "*");
      queryUrl.searchParams.set("returnGeometry", "true");
      queryUrl.searchParams.set("outSR", "4326");
      queryUrl.searchParams.set("geometryPrecision", "6");
      queryUrl.searchParams.set("f", "geojson");
      const maxAllowableOffset = Number(layer.options?.maxAllowableOffset);
      if (Number.isFinite(maxAllowableOffset) && maxAllowableOffset > 0) {
        queryUrl.searchParams.set("maxAllowableOffset", String(maxAllowableOffset));
      }
      if (context.bounds) {
        queryUrl.searchParams.set("geometry", `${context.bounds.west},${context.bounds.south},${context.bounds.east},${context.bounds.north}`);
        queryUrl.searchParams.set("geometryType", "esriGeometryEnvelope");
        queryUrl.searchParams.set("inSR", "4326");
        queryUrl.searchParams.set("spatialRel", "esriSpatialRelIntersects");
      }
      const featureCollection = await fetchAllArcGisFeatures(queryUrl, {
        signal: context.signal,
        onProgress: context.onProgress,
      });
      const dataSource = await GeoJsonDataSource.load(featureCollection, geoJsonStyle(layer, Color));
      decorateGeoJson(dataSource, ConstantProperty, HeightReference);
      return dataSource;
    }
  }
}

export async function applyGeoJsonOpacity(dataSource: GeoJsonDataSource, layer: LayerDefinition, opacity: number) {
  const { Color, ColorMaterialProperty, ConstantProperty } = await import("cesium");
  const stroke = Color.fromCssColorString(stringOption(layer, "strokeColor") ?? "#3c7550").withAlpha(opacity);
  const fillAlpha = Number(layer.options?.fillAlpha ?? 0.22) * opacity;
  const fill = Color.fromCssColorString(stringOption(layer, "fillColor") ?? "#68a677").withAlpha(fillAlpha);
  for (const entity of dataSource.entities.values) {
    if (entity.polygon) {
      entity.polygon.material = new ColorMaterialProperty(fill);
      entity.polygon.outline = new ConstantProperty(true);
      entity.polygon.outlineColor = new ConstantProperty(stroke);
    }
    if (entity.polyline) {
      entity.polyline.material = new ColorMaterialProperty(stroke);
      entity.polyline.width = new ConstantProperty(Number(layer.options?.strokeWidth ?? 2));
    }
    // A point is a pin drawn in the layer's own color, so opacity only needs to fade it.
    if (entity.billboard) {
      entity.billboard.color = new ConstantProperty(Color.WHITE.withAlpha(opacity));
    }
  }
}

function decodeTemplateBraces(url: string): string {
  return url.replaceAll("%7B", "{").replaceAll("%7D", "}");
}

function geoJsonStyle(layer: LayerDefinition, Color: typeof import("cesium").Color) {
  const opacity = layer.defaultOpacity;
  const stroke = Color.fromCssColorString(stringOption(layer, "strokeColor") ?? "#3c7550").withAlpha(opacity);
  const fillAlpha = Number(layer.options?.fillAlpha ?? 0.22) * opacity;
  const fill = Color.fromCssColorString(stringOption(layer, "fillColor") ?? "#68a677").withAlpha(fillAlpha);
  return {
    clampToGround: true,
    stroke,
    fill,
    strokeWidth: Number(layer.options?.strokeWidth ?? 2),
    markerColor: Color.fromCssColorString(stringOption(layer, "fillColor") ?? "#68a677"),
  };
}

function decorateGeoJson(
  dataSource: GeoJsonDataSource,
  ConstantProperty: typeof import("cesium").ConstantProperty,
  HeightReference: typeof import("cesium").HeightReference,
) {
  for (const entity of dataSource.entities.values) {
    if (entity.polygon) {
      entity.polygon.heightReference = new ConstantProperty(HeightReference.CLAMP_TO_GROUND);
      entity.polygon.outline = new ConstantProperty(true);
    }
    if (entity.polyline) entity.polyline.clampToGround = new ConstantProperty(true);
    if (entity.billboard) entity.billboard.heightReference = new ConstantProperty(HeightReference.CLAMP_TO_GROUND);
    if (entity.point) entity.point.heightReference = new ConstantProperty(HeightReference.CLAMP_TO_GROUND);
  }
}

function levelOptions(layer: LayerDefinition) {
  return { minimumLevel: layer.minimumLevel, maximumLevel: layer.maximumLevel };
}
