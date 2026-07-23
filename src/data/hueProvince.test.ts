import { describe, expect, it } from "vitest";

import { huePlaceById, hueProvince } from "./hueProvince";

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
    expect(huePlaceById.get("imperial-city-hue")?.acceptedAnswers).toContain(
      "Đại Nội",
    );
    expect(huePlaceById.get("thien-mu-pagoda")?.acceptedAnswers).toContain(
      "Chùa Linh Mụ",
    );
    expect(huePlaceById.get("khai-dinh-tomb")?.acceptedAnswers).toContain(
      "Ứng Lăng",
    );
    expect(huePlaceById.get("minh-mang-tomb")?.acceptedAnswers).toContain(
      "Hiếu Lăng",
    );
  });
});
