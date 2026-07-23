import { createGameResult } from "./metrics";
import {
  getAcceptedNormalizedAnswers,
  normalizeVietnameseAnswer,
} from "./normalize";
import type { GameAction, GameConfig, GameState } from "./types";

const getStopCharacterCount = (displayName: string) =>
  normalizeVietnameseAnswer(displayName).length;

export function createInitialGameState(config: GameConfig): GameState {
  return {
    journeyId: config.journeyId,
    stops: config.stops,
    status: "ready",
    currentStopIndex: 0,
    input: "",
    maxCorrectLength: 0,
    correctInputs: 0,
    incorrectInputs: 0,
    stopIncorrectInputs: 0,
    totalCharacters: config.stops.reduce(
      (total, stop) => total + getStopCharacterCount(stop.displayName),
      0,
    ),
    elapsedMs: 0,
    lastTimestampMs: null,
    currentStopStartedElapsedMs: 0,
    stopSplits: [],
    feedback: "idle",
    result: null,
  };
}

function advanceClock(state: GameState, now: number): GameState {
  if (state.status !== "playing" || state.lastTimestampMs === null) return state;

  return {
    ...state,
    elapsedMs:
      state.elapsedMs + Math.max(0, now - state.lastTimestampMs),
    lastTimestampMs: now,
  };
}

function handleInput(state: GameState, action: Extract<GameAction, { type: "INPUT" }>) {
  if (state.status === "paused" || state.status === "completed") return state;

  const clockedState = advanceClock(state, action.now);
  const currentStop = clockedState.stops[clockedState.currentStopIndex];
  if (!currentStop) return clockedState;

  const previousAnswer = normalizeVietnameseAnswer(clockedState.input);
  const nextAnswer = normalizeVietnameseAnswer(action.value);
  const acceptedAnswers = getAcceptedNormalizedAnswers([
    currentStop.displayName,
    ...currentStop.acceptedAnswers,
  ]);
  const matchesPrefix = acceptedAnswers.some((answer) =>
    answer.startsWith(nextAnswer),
  );

  if (!matchesPrefix) {
    return {
      ...clockedState,
      incorrectInputs: clockedState.incorrectInputs + 1,
      stopIncorrectInputs: clockedState.stopIncorrectInputs + 1,
      feedback: "incorrect" as const,
    };
  }

  const isNewCorrectCharacter = nextAnswer.length > clockedState.maxCorrectLength;
  const addedCorrectCharacters = isNewCorrectCharacter
    ? nextAnswer.length - clockedState.maxCorrectLength
    : 0;
  const startedState: GameState =
    clockedState.status === "ready" && addedCorrectCharacters > 0
      ? { ...clockedState, status: "playing", lastTimestampMs: action.now }
      : clockedState;
  const maxCorrectLength = Math.max(
    startedState.maxCorrectLength,
    nextAnswer.length,
  );
  const correctInputs = startedState.correctInputs + addedCorrectCharacters;
  const completedAnswer = acceptedAnswers.includes(nextAnswer);
  const feedback: GameState["feedback"] =
    addedCorrectCharacters > 0 ? "correct" : "idle";

  if (!completedAnswer || nextAnswer === previousAnswer) {
    return {
      ...startedState,
      input: action.value,
      maxCorrectLength,
      correctInputs,
      feedback,
    };
  }

  const split = {
    stopId: currentStop.id,
    durationMs: Math.round(
      startedState.elapsedMs - startedState.currentStopStartedElapsedMs,
    ),
    correctInputs: getStopCharacterCount(currentStop.displayName),
    incorrectInputs: startedState.stopIncorrectInputs,
  };
  const stopSplits = [...startedState.stopSplits, split];
  const isLastStop =
    startedState.currentStopIndex >= startedState.stops.length - 1;
  const completedState: GameState = {
    ...startedState,
    input: "",
    maxCorrectLength: 0,
    correctInputs,
    stopIncorrectInputs: 0,
    stopSplits,
    feedback: "stop-complete",
    currentStopStartedElapsedMs: startedState.elapsedMs,
    currentStopIndex: isLastStop
      ? startedState.currentStopIndex
      : startedState.currentStopIndex + 1,
    status: isLastStop ? "completed" : startedState.status,
    lastTimestampMs: isLastStop ? null : startedState.lastTimestampMs,
    result: null,
  };

  return isLastStop
    ? {
        ...completedState,
        result: createGameResult(
          completedState,
          action.completedAt ?? new Date().toISOString(),
        ),
      }
    : completedState;
}

export function gameReducer(state: GameState, action: GameAction): GameState {
  switch (action.type) {
    case "INPUT":
      return handleInput(state, action);
    case "TICK":
      return advanceClock(state, action.now);
    case "PAUSE": {
      if (state.status !== "playing") return state;
      const clockedState = advanceClock(state, action.now);
      return { ...clockedState, status: "paused", lastTimestampMs: null };
    }
    case "RESUME":
      return state.status === "paused"
        ? { ...state, status: "playing", lastTimestampMs: action.now }
        : state;
    case "RESET":
      return createInitialGameState({
        journeyId: state.journeyId,
        stops: state.stops,
      });
    default:
      return state;
  }
}
