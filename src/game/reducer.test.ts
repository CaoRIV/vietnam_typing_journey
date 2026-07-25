import { describe, expect, it } from "vitest";

import { hueProvince } from "../data/hueProvince";
import { createGameConfig } from "../journey/model";
import { getGameMetrics } from "./metrics";
import { createInitialGameState, gameReducer } from "./reducer";

describe("game reducer", () => {
  const hueGameJourney = createGameConfig(hueProvince);

  it("starts on the first correct character and ignores an incorrect advance", () => {
    let state = createInitialGameState(hueGameJourney);

    state = gameReducer(state, { type: "INPUT", value: "x", now: 100 });
    expect(state.status).toBe("ready");
    expect(state.incorrectInputs).toBe(1);
    expect(getGameMetrics(state).progress).toBe(0);

    state = gameReducer(state, { type: "INPUT", value: "h", now: 200 });
    expect(state.status).toBe("playing");
    expect(state.correctInputs).toBe(1);
    expect(getGameMetrics(state).progress).toBeGreaterThan(0);
  });

  it("accepts accented and unaccented answers and advances stops", () => {
    let state = createInitialGameState(hueGameJourney);

    state = gameReducer(state, { type: "INPUT", value: "Đại Nội", now: 0 });
    expect(state.currentStopIndex).toBe(1);
    expect(state.stopSplits[0]).toMatchObject({
      stopId: "imperial-city-hue",
      correctInputs: 9,
    });

    state = gameReducer(state, {
      type: "INPUT",
      value: "chua linh mu",
      now: 1_000,
    });
    expect(state.currentStopIndex).toBe(2);
    expect(state.correctInputs).toBe(20);
  });

  it("allows backspace without counting the same character twice", () => {
    let state = createInitialGameState(hueGameJourney);
    state = gameReducer(state, { type: "INPUT", value: "da", now: 0 });
    state = gameReducer(state, { type: "INPUT", value: "d", now: 100 });
    state = gameReducer(state, { type: "INPUT", value: "da", now: 200 });

    expect(state.correctInputs).toBe(3);
    expect(state.incorrectInputs).toBe(0);
  });

  it("excludes paused time and creates a complete versioned result", () => {
    let state = createInitialGameState(hueGameJourney);
    state = gameReducer(state, { type: "INPUT", value: "h", now: 0 });
    state = gameReducer(state, { type: "TICK", now: 1_000 });
    state = gameReducer(state, { type: "PAUSE", now: 1_000 });
    state = gameReducer(state, { type: "TICK", now: 9_000 });
    state = gameReducer(state, { type: "RESUME", now: 10_000 });
    state = gameReducer(state, {
      type: "INPUT",
      value: "Đại Nội Huế",
      now: 11_000,
    });

    const remainingAnswers = [
      "Chùa Thiên Mụ",
      "Lăng Khải Định",
      "Lăng Minh Mạng",
      "Đồi Vọng Cảnh",
    ];
    remainingAnswers.forEach((answer, index) => {
      state = gameReducer(state, {
        type: "INPUT",
        value: answer,
        now: 12_000 + index * 1_000,
        completedAt: "2026-07-22T00:00:00.000Z",
      });
    });

    expect(state.status).toBe("completed");
    expect(state.elapsedMs).toBe(6_000);
    expect(state.result).toMatchObject({
      version: 1,
      journeyId: hueGameJourney.journeyId,
      correctInputs: 55,
      totalCharacters: 55,
      completedAt: "2026-07-22T00:00:00.000Z",
    });
    expect(state.result?.stopSplits).toHaveLength(5);
  });
});
