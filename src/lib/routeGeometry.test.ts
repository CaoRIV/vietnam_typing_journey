import { describe, expect, it } from "vitest";

import {
  centralRoutePoints,
  centralRouteStops,
  vietnamMapGeometry,
} from "../data/centralRoute";
import { getPointAtProgress, getProgressAtPointIndex } from "./routeGeometry";

describe("route geometry", () => {
  it("clamps the vehicle to the first and last route points", () => {
    expect(getPointAtProgress(centralRoutePoints, -1)).toMatchObject(
      centralRoutePoints[0]!,
    );
    expect(getPointAtProgress(centralRoutePoints, 2)).toMatchObject(
      centralRoutePoints.at(-1)!,
    );
  });

  it("places each stop at an increasing progress", () => {
    const progressValues = centralRouteStops.map((stop) =>
      getProgressAtPointIndex(centralRoutePoints, stop.pointIndex),
    );

    expect(progressValues[0]).toBe(0);
    expect(progressValues.at(-1)).toBe(1);
    expect(progressValues).toEqual([...progressValues].sort((a, b) => a - b));
  });

  it("keeps geographic source data and projected route geometry aligned", () => {
    expect(vietnamMapGeometry.path.startsWith("M")).toBe(true);
    expect(vietnamMapGeometry.path.length).toBeGreaterThan(10_000);
    expect(vietnamMapGeometry.source.license).toBe("Public domain");

    centralRouteStops.forEach((stop) => {
      const point = centralRoutePoints[stop.pointIndex];
      expect(point).toBeDefined();
      expect(stop.coordinates[0]).toBeGreaterThan(102);
      expect(stop.coordinates[0]).toBeLessThan(110);
      expect(stop.coordinates[1]).toBeGreaterThan(8);
      expect(stop.coordinates[1]).toBeLessThan(24);
    });
  });
});
