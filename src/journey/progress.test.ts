import { describe, expect, it } from "vitest";

import type { GameResult } from "../game/types";
import {
  emptyJourneyProgress,
  mergeJourneyProgress,
  parseJourneyProgress,
} from "./progress";

const result: GameResult = {
  version: 1,
  journeyId: "hue-heritage-prototype",
  durationMs: 60_000,
  correctInputs: 55,
  incorrectInputs: 1,
  totalCharacters: 55,
  wpm: 11,
  cpm: 55,
  accuracy: 98.2,
  stopSplits: [],
  completedAt: "2026-07-26T10:00:00.000Z",
};

describe("journey progress", () => {
  it("keeps visited places when a session restarts", () => {
    const journeyId = "hue-heritage-prototype";
    const progressed = mergeJourneyProgress(emptyJourneyProgress(), {
      journeyId,
      visitedPlaceIds: ["imperial-city-hue"],
      completed: false,
      result: null,
    });
    const restarted = mergeJourneyProgress(progressed, {
      journeyId,
      visitedPlaceIds: [],
      completed: false,
      result: null,
    });

    expect(restarted).toBe(progressed);
    expect(restarted.journeys[journeyId].visitedPlaceIds).toEqual([
      "imperial-city-hue",
    ]);
  });

  it("stores completion and the best result", () => {
    const progress = mergeJourneyProgress(emptyJourneyProgress(), {
      journeyId: result.journeyId,
      visitedPlaceIds: ["imperial-city-hue", "thien-mu-pagoda"],
      completed: true,
      result,
    });

    expect(progress.journeys[result.journeyId]).toMatchObject({
      visitedPlaceIds: ["imperial-city-hue", "thien-mu-pagoda"],
      completedAt: result.completedAt,
      bestResult: result,
    });
  });

  it("recovers safely from malformed persisted data", () => {
    expect(parseJourneyProgress("{broken")).toEqual(emptyJourneyProgress());
    expect(parseJourneyProgress('{"version":2,"journeys":{}}')).toEqual(
      emptyJourneyProgress(),
    );
  });
});
