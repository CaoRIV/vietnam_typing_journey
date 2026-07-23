import { describe, expect, it } from "vitest";

import { getGeoRoutePosition, getTraveledGeoCoordinates } from "./mapboxRoute";

const projected = [
  { x: 0, y: 0 },
  { x: 10, y: 0 },
  { x: 10, y: 30 },
] as const;
const geographic = [
  [100, 10],
  [101, 10],
  [101, 13],
] as const;

describe("Mapbox route geometry", () => {
  it("uses the same projected route progress as the SVG renderer", () => {
    expect(getGeoRoutePosition(projected, geographic, 0).coordinates).toEqual([
      100, 10,
    ]);
    expect(getGeoRoutePosition(projected, geographic, 0.5).coordinates).toEqual([
      101, 11,
    ]);
    expect(getGeoRoutePosition(projected, geographic, 1).coordinates).toEqual([
      101, 13,
    ]);
  });

  it("returns only the traveled part of the route", () => {
    expect(getTraveledGeoCoordinates(projected, geographic, 0.5)).toEqual([
      [100, 10],
      [101, 10],
      [101, 11],
    ]);
  });
});
