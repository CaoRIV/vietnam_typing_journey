import { describe, expect, it } from "vitest";

import { normalizeVietnameseAnswer } from "../game/normalize";
import { daNangPlaces } from "./daNangProvince";
import { daNangRoute } from "./daNangRoute";

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

  it("projects a complete SVG and GeoJSON route with readable stop labels", () => {
    expect(daNangRoute.id).toBe("da-nang-highlights-prototype");
    expect(daNangRoute.geoPoints).toHaveLength(daNangRoute.points.length);
    expect(daNangRoute.points.length).toBeGreaterThan(daNangRoute.stops.length);
    expect(daNangRoute.stops.map((stop) => stop.id)).toEqual([
      "marble-mountains",
      "museum-of-cham-sculpture",
      "dragon-bridge-da-nang",
      "linh-ung-pagoda-son-tra",
      "son-tra-peninsula",
    ]);

    const placeById = new Map(daNangPlaces.map((place) => [place.id, place]));
    daNangRoute.stops.forEach((stop) => {
      expect(placeById.get(stop.id)?.name).toBe(stop.name);
      expect(daNangRoute.geoPoints[stop.pointIndex]).toEqual(stop.coordinates);
      expect(daNangRoute.points[stop.pointIndex]).toBeDefined();
      expect(stop.label.x).toBeGreaterThan(0);
      expect(stop.label.x).toBeLessThan(480);
      expect(stop.label.y).toBeGreaterThan(0);
      expect(stop.label.y).toBeLessThan(720);
    });

    const labelPositions = daNangRoute.stops.map((stop) => stop.label);
    labelPositions.forEach((label, index) => {
      labelPositions.slice(index + 1).forEach((otherLabel) => {
        expect(Math.hypot(label.x - otherLabel.x, label.y - otherLabel.y)).toBeGreaterThan(24);
      });
    });
  });
});
