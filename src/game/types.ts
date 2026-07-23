export type GameStatus = "ready" | "playing" | "paused" | "completed";
export type InputFeedback = "idle" | "correct" | "incorrect" | "stop-complete";

export type GameStopDefinition = {
  id: string;
  displayName: string;
  acceptedAnswers: readonly string[];
};

export type GameConfig = {
  journeyId: string;
  stops: readonly GameStopDefinition[];
};

export type StopSplit = {
  stopId: string;
  durationMs: number;
  correctInputs: number;
  incorrectInputs: number;
};

export type GameResult = {
  version: 1;
  journeyId: string;
  durationMs: number;
  correctInputs: number;
  incorrectInputs: number;
  totalCharacters: number;
  wpm: number;
  cpm: number;
  accuracy: number;
  stopSplits: StopSplit[];
  completedAt: string;
};

export type GameState = {
  journeyId: string;
  stops: readonly GameStopDefinition[];
  status: GameStatus;
  currentStopIndex: number;
  input: string;
  maxCorrectLength: number;
  correctInputs: number;
  incorrectInputs: number;
  stopIncorrectInputs: number;
  totalCharacters: number;
  elapsedMs: number;
  lastTimestampMs: number | null;
  currentStopStartedElapsedMs: number;
  stopSplits: StopSplit[];
  feedback: InputFeedback;
  result: GameResult | null;
};

export type GameAction =
  | { type: "INPUT"; value: string; now: number; completedAt?: string }
  | { type: "TICK"; now: number }
  | { type: "PAUSE"; now: number }
  | { type: "RESUME"; now: number }
  | { type: "RESET" };

export type GameMetrics = {
  progress: number;
  cpm: number;
  wpm: number;
  accuracy: number;
};
