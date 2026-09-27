declare module "geographiclib-geodesic" {
  interface InverseResult {
    s12: number;
    azi1: number;
  }

  interface DirectResult {
    lat2: number;
    lon2: number;
  }

  interface PolygonResult {
    number: number;
    perimeter: number;
    area: number;
  }

  interface PolygonAccumulator {
    AddPoint(latitude: number, longitude: number): void;
    Compute(reverse: boolean, sign: boolean): PolygonResult;
  }

  interface GeodesicModel {
    Inverse(latitude1: number, longitude1: number, latitude2: number, longitude2: number): InverseResult;
    Direct(latitude: number, longitude: number, azimuth: number, distance: number): DirectResult;
    Polygon(polyline: boolean): PolygonAccumulator;
  }

  export const Geodesic: { WGS84: GeodesicModel };
}
