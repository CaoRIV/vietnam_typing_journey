import { describe, expect, it } from "vitest";

import { createGameConfig, createPlaceIndex } from "../journey/model";
import { hueProvince } from "./hueProvince";

describe("hue province prototype data", () => {
  it("defines five complete and uniquely identified tourism places", () => {
    expect(hueProvince.places).toHaveLength(5);
    expect(new Set(hueProvince.places.map((place) => place.id)).size).toBe(5);

    hueProvince.places.forEach((place) => {
      expect(place.name).not.toHaveLength(0);
      expect(place.acceptedAnswers).toContain(place.name);
      expect(place.coordinates[0]).toBeGreaterThan(107);
      expect(place.coordinates[0]).toBeLessThan(108);
      expect(place.coordinates[1]).toBeGreaterThan(16);
      expect(place.coordinates[1]).toBeLessThan(17);
      expect(place.shortDescription.length).toBeGreaterThan(40);
      expect(place.image.src).toMatch(/^https:\/\/commons\.wikimedia\.org\//);
      expect(place.image.sourceUrl).toMatch(
        /^https:\/\/commons\.wikimedia\.org\//,
      );
      expect(place.contentSources.length).toBeGreaterThan(0);
    });
  });

  it("provides common alternative answers for the typing engine", () => {
    const placeById = createPlaceIndex(hueProvince);

    expect(placeById.get("imperial-city-hue")?.acceptedAnswers).toContain(
      "Đại Nội",
    );
    expect(placeById.get("thien-mu-pagoda")?.acceptedAnswers).toContain(
      "Chùa Linh Mụ",
    );
    expect(placeById.get("khai-dinh-tomb")?.acceptedAnswers).toContain(
      "Ứng Lăng",
    );
    expect(placeById.get("minh-mang-tomb")?.acceptedAnswers).toContain(
      "Hiếu Lăng",
    );
  });

  it("builds a game config from the route without Hue-specific engine code", () => {
    const gameConfig = createGameConfig(hueProvince);

    expect(gameConfig.journeyId).toBe(hueProvince.id);
    expect(gameConfig.stops).toHaveLength(hueProvince.route.stops.length);
    expect(gameConfig.stops[0]).toMatchObject({
      id: "imperial-city-hue",
      displayName: "Đại Nội Huế",
    });
  });

  it("fails fast when a route references missing place content", () => {
    const invalidJourney = {
      ...hueProvince,
      id: "invalid-journey",
      route: {
        ...hueProvince.route,
        stops: [
          {
            ...hueProvince.route.stops[0]!,
            id: "missing-place",
          },
        ],
      },
    };

    expect(() => createGameConfig(invalidJourney)).toThrow(
      'route references missing place "missing-place"',
    );
  });
});
