import type { GeoCoordinates, JourneyRoute, JourneyStop } from "../journey/types";
import { staticRoutingProvider } from "./staticRoutingProvider";
import type { RouteGeometryResult, RoutingPoint, RoutingProvider } from "./types";

export type ResolveNextRouteStepInput = {
  route: JourneyRoute;
  currentStop?: JourneyStop | null;
  currentStopId?: string | null;
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
  currentStop,
  currentStopId = currentStop?.id ?? null,
  visitedStopIds,
  provider = staticRoutingProvider,
}: ResolveNextRouteStepInput): Promise<RouteStep | null> {
  const visited = new Set(visitedStopIds);
  const stop = currentStopId
    ? route.stops.find((s) => s.id === currentStopId) ??
      (currentStop?.id === currentStopId ? currentStop : undefined)
    : undefined;
  const from = stop ? toRoutingPoint(stop) : createStartPoint(route);
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
