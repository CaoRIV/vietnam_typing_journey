import { describe, expect, it } from "vitest";

import { hueProvince } from "../data/hueProvince";
import { staticRoutingProvider } from "./staticRoutingProvider";

describe("staticRoutingProvider", () => {
  it("selects the nearest unvisited stop by geographic distance", async () => {
    const stops = hueProvince.route.stops;
    const result = await staticRoutingProvider.getNearestUnvisitedStop(
      hueProvince.places[0].coordinates,
      stops.slice(1),
    );

    expect(result).toMatchObject({
      provider: "static",
      stop: { id: "thien-mu-pagoda" },
    });
    expect(result?.distanceMeters).toBeGreaterThan(0);
    expect(result?.durationSeconds).toBeGreaterThan(0);
  });

  it("returns null when there are no unvisited stops", async () => {
    await expect(
      staticRoutingProvider.getNearestUnvisitedStop(
        hueProvince.center,
        [],
      ),
    ).resolves.toBeNull();
  });

  it("returns existing route coordinates between two route stops", async () => {
    const [fromStop, toStop] = hueProvince.route.stops;
    const result = await staticRoutingProvider.getRouteGeometry({
      from: fromStop,
      to: toStop,
      route: hueProvince.route,
    });

    expect(result.provider).toBe("static");
    expect(result.geometry.type).toBe("LineString");
    expect(result.geometry.coordinates[0]).toEqual(
      hueProvince.route.geoPoints[fromStop.pointIndex],
    );
    expect(result.geometry.coordinates.at(-1)).toEqual(
      hueProvince.route.geoPoints[toStop.pointIndex],
    );
    expect(result.distanceMeters).toBeGreaterThan(0);
  });

  it("falls back to a direct line when route data is missing", async () => {
    const [fromStop, toStop] = hueProvince.route.stops;
    const result = await staticRoutingProvider.getRouteGeometry({
      from: fromStop,
      to: toStop,
    });

    expect(result.geometry.coordinates).toEqual([
      fromStop.coordinates,
      toStop.coordinates,
    ]);
    expect(result.durationSeconds).toBeGreaterThan(0);
  });
});
