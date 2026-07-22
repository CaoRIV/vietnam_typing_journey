import { describe, expect, it } from "vitest";

import { centralRoutePoints } from "../data/centralRoute";
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
    const indexes = [0, 1, 2, 3, 4, 9];
    const progressValues = indexes.map((index) =>
      getProgressAtPointIndex(centralRoutePoints, index),
    );

    expect(progressValues[0]).toBe(0);
    expect(progressValues.at(-1)).toBe(1);
    expect(progressValues).toEqual([...progressValues].sort((a, b) => a - b));
  });
});
