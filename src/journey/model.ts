import type { GameConfig } from "../game/types";
import type { ProvinceJourney, TourismPlace } from "./types";

export function createPlaceIndex(
  journey: ProvinceJourney,
): ReadonlyMap<string, TourismPlace> {
  return new Map(journey.places.map((place) => [place.id, place]));
}

export function createGameConfig(journey: ProvinceJourney): GameConfig {
  const placeById = createPlaceIndex(journey);

  return {
    journeyId: journey.id,
    stops: journey.route.stops.map((stop) => {
      const place = placeById.get(stop.id);
      if (!place) {
        throw new Error(
          `Journey "${journey.id}" route references missing place "${stop.id}".`,
        );
      }

      return {
        id: place.id,
        displayName: place.name,
        acceptedAnswers: place.acceptedAnswers,
      };
    }),
  };
}
