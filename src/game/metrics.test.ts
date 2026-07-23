import { describe, expect, it } from "vitest";

import { calculateMetrics } from "./metrics";

describe("game metrics", () => {
  it("calculates progress, speed and accuracy", () => {
    expect(calculateMetrics(25, 5, 60_000, 50)).toEqual({
      progress: 0.5,
      cpm: 25,
      wpm: 5,
      accuracy: 83.3,
    });
  });

  it("returns safe values before the timer starts", () => {
    expect(calculateMetrics(0, 0, 0, 0)).toEqual({
      progress: 0,
      cpm: 0,
      wpm: 0,
      accuracy: 100,
    });
  });
});
