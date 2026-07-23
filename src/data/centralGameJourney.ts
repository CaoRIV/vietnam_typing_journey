import type { GameConfig } from "../game/types";
import { centralRoute } from "./centralRoute";
import { huePlaceById } from "./hueProvince";

export const centralGameJourney: GameConfig = {
  journeyId: centralRoute.id,
  stops: centralRoute.stops.map((stop) => {
    const place = huePlaceById.get(stop.id);

    return {
      id: stop.id,
      displayName: place?.name ?? stop.name,
      acceptedAnswers: place?.acceptedAnswers ?? [stop.name],
    };
  }),
};
