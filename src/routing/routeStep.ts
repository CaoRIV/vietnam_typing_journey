import type { GeoCoordinates, JourneyRoute, JourneyStop } from "../journey/types";
import { staticRoutingProvider } from "./staticRoutingProvider";
import type { RouteGeometryResult, RoutingPoint, RoutingProvider } from "./types";

export type ResolveNextRouteStepInput = {
  route: JourneyRoute;
  currentStopId: string | null;
  visitedStopIds: readonly string[];
  provider?: RoutingProvider;
};

export type RouteStep = {
  from: RoutingPoint;
  to: JourneyStop;
  geometry: RouteGeometryResult;
};

const getRouteStartCoordinates = (route: JourneyRoute): GeoCoordinates =>
  route.geoPoints[0] ?? route.stops[0]?.coordinates ?? [0, 0];

const toRoutingPoint = (stop: JourneyStop): RoutingPoint => ({
  id: stop.id,
  name: stop.name,
  coordinates: stop.coordinates,
  pointIndex: stop.pointIndex,
});

const createStartPoint = (route: JourneyRoute): RoutingPoint => ({
  id: `${route.id}:start`,
  name: `${route.name} start`,
  coordinates: getRouteStartCoordinates(route),
  pointIndex: 0,
});

export async function resolveNextRouteStep({
  route,
  currentStopId,
  visitedStopIds,
  provider = staticRoutingProvider,
}: ResolveNextRouteStepInput): Promise<RouteStep | null> {
  const visited = new Set(visitedStopIds);
  const currentStop = currentStopId
    ? route.stops.find((stop) => stop.id === currentStopId)
    : undefined;
  const from = currentStop ? toRoutingPoint(currentStop) : createStartPoint(route);
  const candidates = route.stops.filter((stop) => !visited.has(stop.id));
  const nearest = await provider.getNearestUnvisitedStop(
    from.coordinates,
    candidates,
  );

  if (!nearest) return null;

  return {
    from,
    to: nearest.stop,
    geometry: await provider.getRouteGeometry({
      from,
      to: toRoutingPoint(nearest.stop),
      route,
    }),
  };
}
