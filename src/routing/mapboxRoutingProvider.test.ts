import { describe, expect, it, vi } from "vitest";
import type { JourneyStop } from "../journey/types";
import { createMapboxRoutingProvider, isValidMapboxToken } from "./mapboxRoutingProvider";
import { staticRoutingProvider } from "./staticRoutingProvider";
import type { RoutingPoint } from "./types";

const mockStops: JourneyStop[] = [
  {
    id: "hue:dai-noi",
    name: "Đại Nội Huế",
    coordinates: [107.579, 16.469],
    pointIndex: 1,
  },
  {
    id: "hue:thien-mu",
    name: "Chùa Thiên Mụ",
    coordinates: [107.544, 16.454],
    pointIndex: 2,
  },
  {
    id: "hue:khai-dinh",
    name: "Lăng Khải Định",
    coordinates: [107.590, 16.398],
    pointIndex: 3,
  },
];

const mockFrom: RoutingPoint = {
  id: "hue:start",
  name: "Hue start",
  coordinates: [107.570, 16.460],
  pointIndex: 0,
};

describe("isValidMapboxToken", () => {
  it("returns false for missing, empty, or placeholder tokens", () => {
    expect(isValidMapboxToken(undefined)).toBe(false);
    expect(isValidMapboxToken("")).toBe(false);
    expect(isValidMapboxToken("   ")).toBe(false);
    expect(isValidMapboxToken("pk.sample.12345")).toBe(false);
    expect(isValidMapboxToken("YOUR_MAPBOX_ACCESS_TOKEN")).toBe(false);
  });

  it("returns true for plausible token strings", () => {
    expect(isValidMapboxToken("pk.eyJ1IjoibWFwYm94In0.123456789")).toBe(true);
  });
});

describe("createMapboxRoutingProvider", () => {
  it("falls back to staticRoutingProvider when token is invalid", async () => {
    const fetchFn = vi.fn();
    const provider = createMapboxRoutingProvider({
      accessToken: "pk.sample.test",
      fetchFn,
    });

    const nearest = await provider.getNearestUnvisitedStop(
      mockFrom.coordinates,
      mockStops,
    );

    const staticNearest = await staticRoutingProvider.getNearestUnvisitedStop(
      mockFrom.coordinates,
      mockStops,
    );

    expect(fetchFn).not.toHaveBeenCalled();
    expect(nearest).toEqual(staticNearest);

    const geometry = await provider.getRouteGeometry({
      from: mockFrom,
      to: {
        id: mockStops[0].id,
        name: mockStops[0].name,
        coordinates: mockStops[0].coordinates,
      },
    });

    const staticGeometry = await staticRoutingProvider.getRouteGeometry({
      from: mockFrom,
      to: {
        id: mockStops[0].id,
        name: mockStops[0].name,
        coordinates: mockStops[0].coordinates,
      },
    });

    expect(geometry).toEqual(staticGeometry);
  });

  it("calls Matrix API and returns nearest stop when token is valid", async () => {
    const fetchFn = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        code: "Ok",
        distances: [[0, 5000, 1200, 8000]],
        durations: [[0, 600, 150, 900]],
      }),
    });

    const provider = createMapboxRoutingProvider({
      accessToken: "pk.eyJ1IjoibWFwYm94In0.validtoken",
      fetchFn,
    });

    const result = await provider.getNearestUnvisitedStop(
      mockFrom.coordinates,
      mockStops,
    );

    expect(fetchFn).toHaveBeenCalledTimes(1);
    const [url] = fetchFn.mock.calls[0];
    expect(url).toContain("directions-matrix/v5/mapbox/driving");
    expect(url).toContain("sources=0");

    // mockStops[1] (Chùa Thiên Mụ) has distance 1200 at index 2 (1+1)
    expect(result).toEqual({
      stop: mockStops[1],
      distanceMeters: 1200,
      durationSeconds: 150,
      provider: "mapbox",
    });
  });

  it("caches Matrix API responses for identical requests", async () => {
    const fetchFn = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        code: "Ok",
        distances: [[0, 2000, 3000, 4000]],
        durations: [[0, 200, 300, 400]],
      }),
    });

    const provider = createMapboxRoutingProvider({
      accessToken: "pk.eyJ1IjoibWFwYm94In0.validtoken",
      fetchFn,
    });

    await provider.getNearestUnvisitedStop(mockFrom.coordinates, mockStops);
    await provider.getNearestUnvisitedStop(mockFrom.coordinates, mockStops);

    expect(fetchFn).toHaveBeenCalledTimes(1);
  });

  it("calls Directions API and returns route geometry", async () => {
    const mockCoordinates: [number, number][] = [
      [107.570, 16.460],
      [107.575, 16.465],
      [107.579, 16.469],
    ];

    const fetchFn = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        code: "Ok",
        routes: [
          {
            geometry: {
              type: "LineString",
              coordinates: mockCoordinates,
            },
            distance: 1450.4,
            duration: 180.2,
          },
        ],
      }),
    });

    const provider = createMapboxRoutingProvider({
      accessToken: "pk.eyJ1IjoibWFwYm94In0.validtoken",
      fetchFn,
    });

    const toPoint: RoutingPoint = {
      id: mockStops[0].id,
      name: mockStops[0].name,
      coordinates: mockStops[0].coordinates,
    };

    const result = await provider.getRouteGeometry({
      from: mockFrom,
      to: toPoint,
    });

    expect(fetchFn).toHaveBeenCalledTimes(1);
    const [url] = fetchFn.mock.calls[0];
    expect(url).toContain("directions/v5/mapbox/driving");
    expect(url).toContain("geometries=geojson");

    expect(result).toEqual({
      geometry: {
        type: "LineString",
        coordinates: mockCoordinates,
      },
      distanceMeters: 1450,
      durationSeconds: 180,
      provider: "mapbox",
    });
  });

  it("caches Directions API responses", async () => {
    const fetchFn = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        code: "Ok",
        routes: [
          {
            geometry: {
              type: "LineString",
              coordinates: [mockFrom.coordinates, mockStops[0].coordinates],
            },
            distance: 1000,
            duration: 100,
          },
        ],
      }),
    });

    const provider = createMapboxRoutingProvider({
      accessToken: "pk.eyJ1IjoibWFwYm94In0.validtoken",
      fetchFn,
    });

    const toPoint: RoutingPoint = {
      id: mockStops[0].id,
      name: mockStops[0].name,
      coordinates: mockStops[0].coordinates,
    };

    await provider.getRouteGeometry({ from: mockFrom, to: toPoint });
    await provider.getRouteGeometry({ from: mockFrom, to: toPoint });

    expect(fetchFn).toHaveBeenCalledTimes(1);
  });

  it("falls back to static routing if Mapbox HTTP response fails or throws", async () => {
    const fetchFn = vi.fn().mockRejectedValue(new Error("Network offline"));

    const provider = createMapboxRoutingProvider({
      accessToken: "pk.eyJ1IjoibWFwYm94In0.validtoken",
      fetchFn,
    });

    const nearest = await provider.getNearestUnvisitedStop(
      mockFrom.coordinates,
      mockStops,
    );

    const staticNearest = await staticRoutingProvider.getNearestUnvisitedStop(
      mockFrom.coordinates,
      mockStops,
    );

    expect(nearest).toEqual(staticNearest);
  });

  it("returns null for empty candidates", async () => {
    const provider = createMapboxRoutingProvider({
      accessToken: "pk.eyJ1IjoibWFwYm94In0.validtoken",
    });

    const result = await provider.getNearestUnvisitedStop(
      mockFrom.coordinates,
      [],
    );
    expect(result).toBeNull();
  });
});
