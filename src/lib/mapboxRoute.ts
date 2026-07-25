import type { GeoCoordinates, RoutePoint } from "../journey/types";
import { getRouteMetrics } from "./routeGeometry";

export type GeoRoutePosition = {
  coordinates: GeoCoordinates;
  bearing: number;
  segmentIndex: number;
};

const clampProgress = (progress: number) => Math.min(1, Math.max(0, progress));

const getBearing = (from: GeoCoordinates, to: GeoCoordinates) => {
  const fromLatitude = (from[1] * Math.PI) / 180;
  const toLatitude = (to[1] * Math.PI) / 180;
  const longitudeDelta = ((to[0] - from[0]) * Math.PI) / 180;
  const y = Math.sin(longitudeDelta) * Math.cos(toLatitude);
  const x =
    Math.cos(fromLatitude) * Math.sin(toLatitude) -
    Math.sin(fromLatitude) * Math.cos(toLatitude) * Math.cos(longitudeDelta);

  return (Math.atan2(y, x) * 180) / Math.PI;
};

export function getGeoRoutePosition(
  projectedPoints: readonly RoutePoint[],
  geoPoints: readonly GeoCoordinates[],
  progress: number,
): GeoRoutePosition {
  if (projectedPoints.length < 2 || geoPoints.length < 2) {
    return {
      coordinates: geoPoints[0] ?? [0, 0],
      bearing: 0,
      segmentIndex: 0,
    };
  }

  const pointCount = Math.min(projectedPoints.length, geoPoints.length);
  const safeProjectedPoints = projectedPoints.slice(0, pointCount);
  const { cumulativeLengths, segmentLengths, totalLength } =
    getRouteMetrics(safeProjectedPoints);
  const targetLength = clampProgress(progress) * totalLength;
  let segmentIndex = segmentLengths.length - 1;

  for (let index = 0; index < segmentLengths.length; index += 1) {
    if (targetLength <= cumulativeLengths[index + 1]) {
      segmentIndex = index;
      break;
    }
  }

  const from = geoPoints[segmentIndex];
  const to = geoPoints[segmentIndex + 1];
  const segmentLength = segmentLengths[segmentIndex] || 1;
  const ratio = Math.min(
    1,
    Math.max(0, (targetLength - cumulativeLengths[segmentIndex]) / segmentLength),
  );

  return {
    coordinates: [
      from[0] + (to[0] - from[0]) * ratio,
      from[1] + (to[1] - from[1]) * ratio,
    ],
    bearing: getBearing(from, to),
    segmentIndex,
  };
}

export function getTraveledGeoCoordinates(
  projectedPoints: readonly RoutePoint[],
  geoPoints: readonly GeoCoordinates[],
  progress: number,
) {
  const position = getGeoRoutePosition(projectedPoints, geoPoints, progress);
  return [
    ...geoPoints.slice(0, position.segmentIndex + 1),
    position.coordinates,
  ];
}
