import { describe, expect, it } from "vitest";

import {
  hueRoutePoints,
  hueRouteStops,
} from "../data/hueRoute";
import { vietnamMapGeometry } from "../data/vietnamMap";
import { getPointAtProgress, getProgressAtPointIndex } from "./routeGeometry";

describe("route geometry", () => {
  it("clamps the vehicle to the first and last route points", () => {
    expect(getPointAtProgress(hueRoutePoints, -1)).toMatchObject(
      hueRoutePoints[0]!,
    );
    expect(getPointAtProgress(hueRoutePoints, 2)).toMatchObject(
      hueRoutePoints.at(-1)!,
    );
  });

  it("places each stop at an increasing progress after the journey origin", () => {
    const progressValues = hueRouteStops.map((stop) =>
      getProgressAtPointIndex(hueRoutePoints, stop.pointIndex),
    );

    expect(progressValues[0]).toBeGreaterThan(0);
    expect(progressValues.at(-1)).toBe(1);
    expect(progressValues).toEqual([...progressValues].sort((a, b) => a - b));
  });

  it("keeps geographic source data and projected route geometry aligned", () => {
    expect(vietnamMapGeometry.path.startsWith("M")).toBe(true);
    expect(vietnamMapGeometry.path.length).toBeGreaterThan(10_000);
    expect(vietnamMapGeometry.source.license).toBe("Public domain");

    hueRouteStops.forEach((stop) => {
      const point = hueRoutePoints[stop.pointIndex];
      expect(point).toBeDefined();
      expect(stop.coordinates[0]).toBeGreaterThan(102);
      expect(stop.coordinates[0]).toBeLessThan(110);
      expect(stop.coordinates[1]).toBeGreaterThan(8);
      expect(stop.coordinates[1]).toBeLessThan(24);
    });
  });
});
