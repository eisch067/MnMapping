import type { GeoJsonDataSource, ImageryLayer, TerrainProvider } from "cesium";
import type { LayerDefinition } from "@/config/layers";
import type { LayerBounds } from "@/config/layers/types";
import { normalizeParcel } from "@/lib/parcels";
import { fetchAllArcGisFeatures, type ArcGisQueryProgress } from "@/lib/map/arcgisFeatures";

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
    case "geojson":
      return GeoJsonDataSource.load(layer.url, geoJsonStyle(layer, Color));
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
      decorateGeoJson(dataSource, layer, ConstantProperty);
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

function geoJsonStyle(layer: LayerDefinition, Color: typeof import("cesium").Color) {
  const opacity = layer.defaultOpacity;
  const stroke = Color.fromCssColorString(stringOption(layer, "strokeColor") ?? "#3c7550").withAlpha(opacity);
  const fillAlpha = Number(layer.options?.fillAlpha ?? 0.22) * opacity;
  const fill = Color.fromCssColorString(stringOption(layer, "fillColor") ?? "#68a677").withAlpha(fillAlpha);
  return {
    clampToGround: false,
    stroke,
    fill,
    strokeWidth: Number(layer.options?.strokeWidth ?? 2),
  };
}

function decorateGeoJson(
  dataSource: GeoJsonDataSource,
  layer: LayerDefinition,
  ConstantProperty: typeof import("cesium").ConstantProperty,
) {
  for (const entity of dataSource.entities.values) {
    if (entity.polygon) {
      entity.polygon.height = new ConstantProperty(0);
      entity.polygon.outline = new ConstantProperty(true);
    }
    if (entity.polyline) entity.polyline.clampToGround = new ConstantProperty(true);
    const values = entity.properties?.getValue() as Record<string, unknown> | undefined;
    if (values && layer.parcelFields && layer.county) {
      const parcel = normalizeParcel(layer.county, layer.parcelFields, values);
      entity.name = `Parcel ${parcel.parcelId}`;
    }
    const name = layer.nameField ? values?.[layer.nameField] : undefined;
    if (typeof name === "string" && name.trim()) entity.name = name;
    const popupFields = layer.parcelFields ? parcelPopupFields(layer.parcelFields) : layer.popupFields ?? [];
    const rows = popupFields.flatMap(({ field, label }) => {
      const value = values?.[field];
      if (value === null || value === undefined || value === "") return [];
      return [`<tr><th>${escapeHtml(label)}</th><td>${escapeHtml(String(value))}</td></tr>`];
    });
    rows.push(`<tr><th>Source</th><td>${escapeHtml(layer.agency ?? layer.attribution)}</td></tr>`);
    if (layer.recordsUrl) rows.push(`<tr><th>Ownership &amp; tax records</th><td><a href="${escapeHtml(layer.recordsUrl)}" target="_blank" rel="noreferrer">Look up on the county site ↗</a></td></tr>`);
    const accessNote = accessMeaningLabel(layer.accessMeaning);
    if (accessNote) rows.push(`<tr><th>Boundary meaning</th><td>${escapeHtml(accessNote)}</td></tr>`);
    entity.description = new ConstantProperty(`<table class="cesium-infoBox-defaultTable"><tbody>${rows.join("")}</tbody></table>`);
  }
}

function parcelPopupFields(fields: NonNullable<LayerDefinition["parcelFields"]>) {
  return [
    { field: fields.parcelId, label: "Parcel ID" },
    fields.owner && { field: fields.owner, label: "Owner" },
    fields.secondaryOwner && { field: fields.secondaryOwner, label: "Secondary owner" },
    fields.siteAddress && { field: fields.siteAddress, label: "Site address" },
    fields.mailingAddress && { field: fields.mailingAddress, label: "Mailing address" },
    fields.acres && { field: fields.acres, label: "Acres" },
    fields.legalDescription && { field: fields.legalDescription, label: "Legal description" },
    fields.assessedValue && { field: fields.assessedValue, label: "Assessed value" },
    fields.taxYear && { field: fields.taxYear, label: "Tax year" },
  ].filter((entry): entry is { field: string; label: string } => Boolean(entry));
}

function accessMeaningLabel(value: LayerDefinition["accessMeaning"]): string | null {
  if (value === "public-access") return "Published as publicly accessible; verify current site rules.";
  if (value === "managed-land") return "Managed land; access restrictions may apply.";
  if (value === "administrative-boundary") return "Administrative or management boundary, not proof that every acre is publicly owned.";
  if (value === "access-varies") return "Ownership interest and public access vary by parcel; verify before entering.";
  return null;
}

function escapeHtml(value: string): string {
  return value.replace(/[&<>'"]/g, (character) => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    "'": "&#39;",
    "\"": "&quot;",
  })[character] ?? character);
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
