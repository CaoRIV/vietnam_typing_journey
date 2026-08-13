import { describe, expect, it } from "vitest";

import { normalizeVietnameseAnswer } from "../game/normalize";
import { daNangPlaces } from "./daNangProvince";

describe("Da Nang tourism place data", () => {
  it("defines five complete and uniquely identified places", () => {
    expect(daNangPlaces).toHaveLength(5);
    expect(new Set(daNangPlaces.map((place) => place.id)).size).toBe(5);

    daNangPlaces.forEach((place) => {
      expect(place.acceptedAnswers).toContain(place.name);
      expect(place.coordinates[0]).toBeGreaterThan(108.1);
      expect(place.coordinates[0]).toBeLessThan(108.4);
      expect(place.coordinates[1]).toBeGreaterThan(15.9);
      expect(place.coordinates[1]).toBeLessThan(16.2);
      expect(place.shortDescription.length).toBeGreaterThan(60);
      expect(place.image.src).toMatch(/^https:\/\/commons\.wikimedia\.org\//);
      expect(place.image.sourceUrl).toMatch(
        /^https:\/\/commons\.wikimedia\.org\//,
      );
      expect(place.contentSources.length).toBeGreaterThan(0);
    });
  });

  it("provides normalized alternative answers without duplicates", () => {
    daNangPlaces.forEach((place) => {
      const normalizedAnswers = place.acceptedAnswers.map(
        normalizeVietnameseAnswer,
      );
      expect(new Set(normalizedAnswers).size).toBe(normalizedAnswers.length);
    });

    expect(
      daNangPlaces.find((place) => place.id === "marble-mountains")
        ?.acceptedAnswers,
    ).toContain("Non Nước");
    expect(
      daNangPlaces.find((place) => place.id === "museum-of-cham-sculpture")
        ?.acceptedAnswers,
    ).toContain("Bảo tàng Chăm");
  });
});
