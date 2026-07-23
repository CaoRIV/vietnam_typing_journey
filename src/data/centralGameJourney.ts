import type { GameConfig } from "../game/types";
import { centralRoute } from "./centralRoute";

export const centralGameJourney: GameConfig = {
  journeyId: centralRoute.id,
  stops: centralRoute.stops.map((stop) => ({
    id: stop.id,
    displayName: stop.name,
    acceptedAnswers: [stop.name],
  })),
};
