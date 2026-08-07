import { describe, expect, it } from "vitest";

import { hueProvince } from "../data/hueProvince";
import { resolveNextRouteStep } from "./routeStep";

describe("resolveNextRouteStep", () => {
  it("starts from the route origin and selects the first unvisited stop", async () => {
    const step = await resolveNextRouteStep({
      route: hueProvince.route,
      currentStopId: null,
      visitedStopIds: [],
    });

    expect(step?.from).toMatchObject({
      id: `${hueProvince.route.id}:start`,
      pointIndex: 0,
    });
    expect(step?.to.id).toBe("imperial-city-hue");
    expect(step?.geometry.provider).toBe("static");
    expect(step?.geometry.geometry.coordinates[0]).toEqual(
      hueProvince.route.geoPoints[0],
    );
  });

  it("selects the nearest stop that has not been visited yet", async () => {
    const step = await resolveNextRouteStep({
      route: hueProvince.route,
      currentStopId: "imperial-city-hue",
      visitedStopIds: ["imperial-city-hue"],
    });

    expect(step?.from.id).toBe("imperial-city-hue");
    expect(step?.to.id).toBe("thien-mu-pagoda");
    expect(step?.geometry.geometry.coordinates[0]).toEqual(
      hueProvince.route.geoPoints[hueProvince.route.stops[0].pointIndex],
    );
    expect(step?.geometry.geometry.coordinates.at(-1)).toEqual(
      hueProvince.route.geoPoints[hueProvince.route.stops[1].pointIndex],
    );
  });

  it("accepts currentStop object directly to select the next stop", async () => {
    const currentStop = hueProvince.route.stops[0];
    const step = await resolveNextRouteStep({
      route: hueProvince.route,
      currentStop,
      visitedStopIds: [currentStop.id],
    });

    expect(step?.from.id).toBe("imperial-city-hue");
    expect(step?.to.id).toBe("thien-mu-pagoda");
  });

  it("returns null when every stop has already been visited", async () => {
    const step = await resolveNextRouteStep({
      route: hueProvince.route,
      currentStopId: hueProvince.route.stops.at(-1)?.id ?? null,
      visitedStopIds: hueProvince.route.stops.map((stop) => stop.id),
    });

    expect(step).toBeNull();
  });
});
