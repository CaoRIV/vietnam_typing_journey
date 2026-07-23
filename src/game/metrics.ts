import type { GameMetrics, GameResult, GameState } from "./types";

const round = (value: number, digits = 1) =>
  Number(value.toFixed(digits));

export function calculateMetrics(
  correctInputs: number,
  incorrectInputs: number,
  elapsedMs: number,
  totalCharacters: number,
): GameMetrics {
  const minutes = elapsedMs / 60_000;
  const attempts = correctInputs + incorrectInputs;

  return {
    progress:
      totalCharacters > 0
        ? Math.min(1, Math.max(0, correctInputs / totalCharacters))
        : 0,
    cpm: minutes > 0 ? round(correctInputs / minutes) : 0,
    wpm: minutes > 0 ? round(correctInputs / 5 / minutes) : 0,
    accuracy: attempts > 0 ? round((correctInputs / attempts) * 100) : 100,
  };
}

export function getGameMetrics(state: GameState) {
  return calculateMetrics(
    state.correctInputs,
    state.incorrectInputs,
    state.elapsedMs,
    state.totalCharacters,
  );
}

export function createGameResult(
  state: GameState,
  completedAt: string,
): GameResult {
  const metrics = getGameMetrics(state);

  return {
    version: 1,
    journeyId: state.journeyId,
    durationMs: Math.round(state.elapsedMs),
    correctInputs: state.correctInputs,
    incorrectInputs: state.incorrectInputs,
    totalCharacters: state.totalCharacters,
    wpm: metrics.wpm,
    cpm: metrics.cpm,
    accuracy: metrics.accuracy,
    stopSplits: state.stopSplits,
    completedAt,
  };
}
