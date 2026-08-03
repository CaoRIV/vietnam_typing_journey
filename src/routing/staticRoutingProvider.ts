import type { GeoCoordinates, JourneyRoute } from "../journey/types";
import type {
  GetRouteGeometryInput,
  RouteGeometryResult,
  RoutingPoint,
  RoutingProvider,
} from "./types";

const EARTH_RADIUS_METERS = 6_371_000;
const FALLBACK_SPEED_METERS_PER_SECOND = 30_000 / 3_600;

const toRadians = (degrees: number) => (degrees * Math.PI) / 180;

export function getGreatCircleDistanceMeters(
  from: GeoCoordinates,
  to: GeoCoordinates,
) {
  const [fromLongitude, fromLatitude] = from;
  const [toLongitude, toLatitude] = to;
  const latitudeDelta = toRadians(toLatitude - fromLatitude);
  const longitudeDelta = toRadians(toLongitude - fromLongitude);
  const fromLatitudeRadians = toRadians(fromLatitude);
  const toLatitudeRadians = toRadians(toLatitude);

  const haversine =
    Math.sin(latitudeDelta / 2) ** 2 +
    Math.cos(fromLatitudeRadians) *
      Math.cos(toLatitudeRadians) *
      Math.sin(longitudeDelta / 2) ** 2;

  return (
    EARTH_RADIUS_METERS *
    2 *
    Math.atan2(Math.sqrt(haversine), Math.sqrt(1 - haversine))
  );
}

const getEstimatedDurationSeconds = (distanceMeters: number) =>
  Math.round(distanceMeters / FALLBACK_SPEED_METERS_PER_SECOND);

const normalizePointIndex = (
  point: RoutingPoint,
  route: JourneyRoute,
  fallbackIndex: number,
) =>
  Math.min(
    route.geoPoints.length - 1,
    Math.max(0, point.pointIndex ?? fallbackIndex),
  );

const getStaticRouteCoordinates = ({
  from,
  to,
  route,
}: GetRouteGeometryInput): GeoCoordinates[] => {
  if (!route || route.geoPoints.length < 2) {
    return [from.coordinates, to.coordinates];
  }

  const fromIndex = normalizePointIndex(from, route, 0);
  const toIndex = normalizePointIndex(to, route, route.geoPoints.length - 1);
  const start = Math.min(fromIndex, toIndex);
  const end = Math.max(fromIndex, toIndex);
  const segment = route.geoPoints.slice(start, end + 1);

  return fromIndex <= toIndex ? segment : [...segment].reverse();
};

const getPolylineDistanceMeters = (coordinates: readonly GeoCoordinates[]) =>
  coordinates
    .slice(1)
    .reduce(
      (total, point, index) =>
        total + getGreatCircleDistanceMeters(coordinates[index], point),
      0,
    );

export const staticRoutingProvider: RoutingProvider = {
  async getNearestUnvisitedStop(current, candidates) {
    if (candidates.length === 0) return null;

    const [nearest] = [...candidates]
      .map((stop) => ({
        stop,
        distanceMeters: getGreatCircleDistanceMeters(
          current,
          stop.coordinates,
        ),
      }))
      .sort((left, right) => {
        if (left.distanceMeters !== right.distanceMeters) {
          return left.distanceMeters - right.distanceMeters;
        }
        return left.stop.pointIndex - right.stop.pointIndex;
      });

    return {
      stop: nearest.stop,
      distanceMeters: nearest.distanceMeters,
      durationSeconds: getEstimatedDurationSeconds(nearest.distanceMeters),
      provider: "static",
    };
  },

  async getRouteGeometry(input): Promise<RouteGeometryResult> {
    const coordinates = getStaticRouteCoordinates(input);
    const distanceMeters = getPolylineDistanceMeters(coordinates);

    return {
      geometry: {
        type: "LineString",
        coordinates,
      },
      distanceMeters,
      durationSeconds: getEstimatedDurationSeconds(distanceMeters),
      provider: "static",
    };
  },
};
