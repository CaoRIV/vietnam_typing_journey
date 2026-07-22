import { generatedMapGeometry } from "./mapGeometry.generated";

export type RoutePoint = {
  x: number;
  y: number;
};

export type GeoCoordinates = readonly [longitude: number, latitude: number];

export type JourneyStop = {
  id: string;
  name: string;
  coordinates: GeoCoordinates;
  pointIndex: number;
  label: {
    x: number;
    y: number;
    anchor: "start" | "end";
  };
};

export const centralRoutePoints: readonly RoutePoint[] =
  generatedMapGeometry.route.points;

export const centralRouteStops: readonly JourneyStop[] =
  generatedMapGeometry.route.stops;

export const centralRoute = {
  id: generatedMapGeometry.route.id,
  name: generatedMapGeometry.route.name,
  region: generatedMapGeometry.route.region,
  points: centralRoutePoints,
  stops: centralRouteStops,
} as const;

export const vietnamMapGeometry = {
  source: generatedMapGeometry.source,
  viewBox: generatedMapGeometry.viewBox,
  fitExtent: generatedMapGeometry.fitExtent,
  projection: generatedMapGeometry.projection,
  path: generatedMapGeometry.mapPath,
  archipelagos: generatedMapGeometry.archipelagos,
} as const;
