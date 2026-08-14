import type {
  GeoCoordinates,
  JourneyRoute,
  JourneyStop,
  RoutePoint,
} from "../journey/types";
import { generatedDaNangRoute } from "./daNangRoute.generated";

export const daNangRoutePoints: readonly RoutePoint[] =
  generatedDaNangRoute.points;

export const daNangRouteGeoPoints: readonly GeoCoordinates[] =
  generatedDaNangRoute.geoPoints;

export const daNangRouteStops: readonly JourneyStop[] =
  generatedDaNangRoute.stops;

export const daNangRoute: JourneyRoute = {
  id: generatedDaNangRoute.id,
  name: generatedDaNangRoute.name,
  region: generatedDaNangRoute.region,
  geoPoints: daNangRouteGeoPoints,
  points: daNangRoutePoints,
  stops: daNangRouteStops,
};
