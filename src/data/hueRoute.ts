import { generatedMapGeometry } from "./mapGeometry.generated";
import type {
  GeoCoordinates,
  JourneyRoute,
  JourneyStop,
  RoutePoint,
} from "../journey/types";

export const hueRoutePoints: readonly RoutePoint[] =
  generatedMapGeometry.route.points;

export const hueRouteGeoPoints: readonly GeoCoordinates[] =
  generatedMapGeometry.route.geoPoints;

export const hueRouteStops: readonly JourneyStop[] =
  generatedMapGeometry.route.stops;

export const hueRoute: JourneyRoute = {
  id: generatedMapGeometry.route.id,
  name: generatedMapGeometry.route.name,
  region: generatedMapGeometry.route.region,
  geoPoints: hueRouteGeoPoints,
  points: hueRoutePoints,
  stops: hueRouteStops,
};
