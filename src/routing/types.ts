import type {
  GeoCoordinates,
  JourneyRoute,
  JourneyStop,
} from "../journey/types";

export type RoutingPoint = {
  id: string;
  name: string;
  coordinates: GeoCoordinates;
  pointIndex?: number;
};

export type RouteLineString = {
  type: "LineString";
  coordinates: GeoCoordinates[];
};

export type NearestStopResult = {
  stop: JourneyStop;
  distanceMeters: number;
  durationSeconds: number | null;
  provider: string;
};

export type RouteGeometryResult = {
  geometry: RouteLineString;
  distanceMeters: number;
  durationSeconds: number | null;
  provider: string;
};

export type GetRouteGeometryInput = {
  from: RoutingPoint;
  to: RoutingPoint;
  route?: JourneyRoute;
};

export type RoutingProvider = {
  getNearestUnvisitedStop: (
    current: GeoCoordinates,
    candidates: readonly JourneyStop[],
  ) => Promise<NearestStopResult | null>;
  getRouteGeometry: (
    input: GetRouteGeometryInput,
  ) => Promise<RouteGeometryResult>;
};
