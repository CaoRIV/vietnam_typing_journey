import type { RoutePoint } from "../journey/types";

export type RoutePosition = RoutePoint & {
  angle: number;
  segmentIndex: number;
};

const clampProgress = (progress: number) => Math.min(1, Math.max(0, progress));

const distanceBetween = (from: RoutePoint, to: RoutePoint) =>
  Math.hypot(to.x - from.x, to.y - from.y);

export function getRouteMetrics(points: readonly RoutePoint[]) {
  const segmentLengths = points.slice(1).map((point, index) =>
    distanceBetween(points[index], point),
  );
  const cumulativeLengths = [0];

  for (const segmentLength of segmentLengths) {
    cumulativeLengths.push(cumulativeLengths.at(-1)! + segmentLength);
  }

  return {
    segmentLengths,
    cumulativeLengths,
    totalLength: cumulativeLengths.at(-1) ?? 0,
  };
}

export function getProgressAtPointIndex(
  points: readonly RoutePoint[],
  pointIndex: number,
) {
  const { cumulativeLengths, totalLength } = getRouteMetrics(points);
  if (totalLength === 0) return 0;

  const safeIndex = Math.min(points.length - 1, Math.max(0, pointIndex));
  return cumulativeLengths[safeIndex] / totalLength;
}

export function getPointAtProgress(
  points: readonly RoutePoint[],
  progress: number,
): RoutePosition {
  if (points.length < 2) {
    const point = points[0] ?? { x: 0, y: 0 };
    return { ...point, angle: 0, segmentIndex: 0 };
  }

  const safeProgress = clampProgress(progress);
  const { cumulativeLengths, segmentLengths, totalLength } = getRouteMetrics(points);
  const targetLength = safeProgress * totalLength;
  let segmentIndex = segmentLengths.length - 1;

  for (let index = 0; index < segmentLengths.length; index += 1) {
    if (targetLength <= cumulativeLengths[index + 1]) {
      segmentIndex = index;
      break;
    }
  }

  const from = points[segmentIndex];
  const to = points[segmentIndex + 1];
  const segmentLength = segmentLengths[segmentIndex] || 1;
  const distanceOnSegment = targetLength - cumulativeLengths[segmentIndex];
  const ratio = Math.min(1, Math.max(0, distanceOnSegment / segmentLength));

  return {
    x: from.x + (to.x - from.x) * ratio,
    y: from.y + (to.y - from.y) * ratio,
    angle: (Math.atan2(to.y - from.y, to.x - from.x) * 180) / Math.PI,
    segmentIndex,
  };
}
