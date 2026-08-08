import type { GeoCoordinates, JourneyStop } from "../journey/types";
import { staticRoutingProvider } from "./staticRoutingProvider";
import type {
  GetRouteGeometryInput,
  NearestStopResult,
  RouteGeometryResult,
  RoutingProvider,
} from "./types";

export type MapboxRoutingProviderOptions = {
  accessToken?: string;
  fetchFn?: typeof fetch;
  fallbackProvider?: RoutingProvider;
  baseUrl?: string;
};

const DEFAULT_BASE_URL = "https://api.mapbox.com";

export function isValidMapboxToken(token?: string): boolean {
  if (!token) return false;
  const trimmed = token.trim();
  if (trimmed.length === 0) return false;
  if (
    trimmed.includes("sample") ||
    trimmed.includes("YOUR_MAPBOX") ||
    trimmed.includes("placeholder")
  ) {
    return false;
  }
  return true;
}

interface MapboxMatrixResponse {
  code: string;
  distances?: (number | null)[][];
  durations?: (number | null)[][];
  message?: string;
}

interface MapboxDirectionsResponse {
  code: string;
  routes?: Array<{
    geometry?: {
      type: "LineString";
      coordinates: GeoCoordinates[];
    };
    distance?: number;
    duration?: number;
  }>;
  message?: string;
}

export function createMapboxRoutingProvider(
  options: MapboxRoutingProviderOptions = {},
): RoutingProvider {
  const accessToken =
    options.accessToken ?? import.meta.env.VITE_MAPBOX_ACCESS_TOKEN;
  const fetchFn =
    options.fetchFn ??
    ((...args: Parameters<typeof fetch>) => globalThis.fetch(...args));
  const fallbackProvider = options.fallbackProvider ?? staticRoutingProvider;
  const baseUrl = options.baseUrl ?? DEFAULT_BASE_URL;

  const matrixCache = new Map<string, NearestStopResult>();
  const directionsCache = new Map<string, RouteGeometryResult>();

  return {
    async getNearestUnvisitedStop(
      current: GeoCoordinates,
      candidates: readonly JourneyStop[],
    ): Promise<NearestStopResult | null> {
      if (candidates.length === 0) return null;

      if (!isValidMapboxToken(accessToken)) {
        return fallbackProvider.getNearestUnvisitedStop(current, candidates);
      }

      const cacheKey = `matrix:${current.join(",")}:${candidates
        .map((c) => `${c.id}:${c.coordinates.join(",")}`)
        .join(";")}`;

      if (matrixCache.has(cacheKey)) {
        return matrixCache.get(cacheKey)!;
      }

      try {
        const coordsString = [
          current.join(","),
          ...candidates.map((c) => c.coordinates.join(",")),
        ].join(";");

        const url = `${baseUrl}/directions-matrix/v5/mapbox/driving/${coordsString}?sources=0&annotations=distance,duration&access_token=${encodeURIComponent(
          accessToken!,
        )}`;

        const response = await fetchFn(url);
        if (!response.ok) {
          return fallbackProvider.getNearestUnvisitedStop(current, candidates);
        }

        const data = (await response.json()) as MapboxMatrixResponse;
        if (data.code !== "Ok" || !data.distances?.[0]) {
          return fallbackProvider.getNearestUnvisitedStop(current, candidates);
        }

        const distances = data.distances[0];
        const durations = data.durations?.[0];

        let bestIndex = -1;
        let minDistance = Infinity;

        candidates.forEach((_, index) => {
          // Candidate index i corresponds to index i + 1 in distances[0]
          const dist = distances[index + 1];
          if (dist !== null && dist !== undefined && dist < minDistance) {
            minDistance = dist;
            bestIndex = index;
          }
        });

        if (bestIndex === -1) {
          return fallbackProvider.getNearestUnvisitedStop(current, candidates);
        }

        const bestCandidate = candidates[bestIndex];
        const rawDuration = durations?.[bestIndex + 1];
        const durationSeconds =
          rawDuration !== null && rawDuration !== undefined
            ? Math.round(rawDuration)
            : null;

        const result: NearestStopResult = {
          stop: bestCandidate,
          distanceMeters: Math.round(minDistance),
          durationSeconds,
          provider: "mapbox",
        };

        matrixCache.set(cacheKey, result);
        return result;
      } catch {
        return fallbackProvider.getNearestUnvisitedStop(current, candidates);
      }
    },

    async getRouteGeometry(
      input: GetRouteGeometryInput,
    ): Promise<RouteGeometryResult> {
      if (!isValidMapboxToken(accessToken)) {
        return fallbackProvider.getRouteGeometry(input);
      }

      const cacheKey = `directions:${input.from.coordinates.join(
        ",",
      )}:${input.to.coordinates.join(",")}`;

      if (directionsCache.has(cacheKey)) {
        return directionsCache.get(cacheKey)!;
      }

      try {
        const coordsString = `${input.from.coordinates.join(
          ",",
        )};${input.to.coordinates.join(",")}`;

        const url = `${baseUrl}/directions/v5/mapbox/driving/${coordsString}?geometries=geojson&overview=full&access_token=${encodeURIComponent(
          accessToken!,
        )}`;

        const response = await fetchFn(url);
        if (!response.ok) {
          return fallbackProvider.getRouteGeometry(input);
        }

        const data = (await response.json()) as MapboxDirectionsResponse;
        const route = data.routes?.[0];

        if (data.code !== "Ok" || !route?.geometry?.coordinates) {
          return fallbackProvider.getRouteGeometry(input);
        }

        const result: RouteGeometryResult = {
          geometry: {
            type: "LineString",
            coordinates: route.geometry.coordinates,
          },
          distanceMeters: Math.round(route.distance ?? 0),
          durationSeconds:
            route.duration !== undefined ? Math.round(route.duration) : null,
          provider: "mapbox",
        };

        directionsCache.set(cacheKey, result);
        return result;
      } catch {
        return fallbackProvider.getRouteGeometry(input);
      }
    },
  };
}

export const mapboxRoutingProvider = createMapboxRoutingProvider();
