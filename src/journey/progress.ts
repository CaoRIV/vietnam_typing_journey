import type { GameResult } from "../game/types";

export const JOURNEY_PROGRESS_STORAGE_KEY = "go-xuyen-viet.progress.v1";

export type JourneyProgressEntry = {
  visitedPlaceIds: string[];
  completedAt?: string;
  bestResult?: GameResult;
};

export type JourneyProgress = {
  version: 1;
  journeys: Record<string, JourneyProgressEntry>;
};

export type JourneyProgressUpdate = {
  journeyId: string;
  visitedPlaceIds: readonly string[];
  completed: boolean;
  result: GameResult | null;
};

export const emptyJourneyProgress = (): JourneyProgress => ({
  version: 1,
  journeys: {},
});

const isGameResult = (value: unknown): value is GameResult =>
  Boolean(
    value &&
      typeof value === "object" &&
      "version" in value &&
      value.version === 1 &&
      "journeyId" in value &&
      typeof value.journeyId === "string",
  );

export function parseJourneyProgress(value: string | null): JourneyProgress {
  if (!value) return emptyJourneyProgress();

  try {
    const parsed = JSON.parse(value) as {
      version?: unknown;
      journeys?: Record<string, unknown>;
    };
    if (parsed.version !== 1 || !parsed.journeys) {
      return emptyJourneyProgress();
    }

    const journeys = Object.fromEntries(
      Object.entries(parsed.journeys).flatMap(([journeyId, entry]) => {
        if (!entry || typeof entry !== "object") return [];
        const candidate = entry as {
          visitedPlaceIds?: unknown;
          completedAt?: unknown;
          bestResult?: unknown;
        };
        const visitedPlaceIds = Array.isArray(candidate.visitedPlaceIds)
          ? [
              ...new Set(
                candidate.visitedPlaceIds.filter(
                  (id): id is string => typeof id === "string",
                ),
              ),
            ]
          : [];

        return [
          [
            journeyId,
            {
              visitedPlaceIds,
              ...(typeof candidate.completedAt === "string"
                ? { completedAt: candidate.completedAt }
                : {}),
              ...(isGameResult(candidate.bestResult)
                ? { bestResult: candidate.bestResult }
                : {}),
            },
          ],
        ];
      }),
    );

    return { version: 1, journeys };
  } catch {
    return emptyJourneyProgress();
  }
}

export function loadJourneyProgress(
  storage: Pick<Storage, "getItem"> = window.localStorage,
): JourneyProgress {
  try {
    return parseJourneyProgress(storage.getItem(JOURNEY_PROGRESS_STORAGE_KEY));
  } catch {
    return emptyJourneyProgress();
  }
}

const isBetterResult = (next: GameResult, previous?: GameResult) =>
  !previous ||
  next.accuracy > previous.accuracy ||
  (next.accuracy === previous.accuracy &&
    next.durationMs < previous.durationMs);

export function mergeJourneyProgress(
  progress: JourneyProgress,
  update: JourneyProgressUpdate,
): JourneyProgress {
  const previous = progress.journeys[update.journeyId];
  const visitedPlaceIds = [
    ...new Set([
      ...(previous?.visitedPlaceIds ?? []),
      ...update.visitedPlaceIds,
    ]),
  ];
  const result =
    update.result && isBetterResult(update.result, previous?.bestResult)
      ? update.result
      : previous?.bestResult;
  const completedAt =
    previous?.completedAt ??
    (update.completed
      ? update.result?.completedAt ?? new Date().toISOString()
      : undefined);

  if (
    visitedPlaceIds.length === (previous?.visitedPlaceIds.length ?? 0) &&
    result === previous?.bestResult &&
    completedAt === previous?.completedAt
  ) {
    return progress;
  }

  return {
    version: 1,
    journeys: {
      ...progress.journeys,
      [update.journeyId]: {
        visitedPlaceIds,
        ...(completedAt ? { completedAt } : {}),
        ...(result ? { bestResult: result } : {}),
      },
    },
  };
}

export function saveJourneyProgress(
  progress: JourneyProgress,
  storage: Pick<Storage, "setItem"> = window.localStorage,
) {
  try {
    storage.setItem(JOURNEY_PROGRESS_STORAGE_KEY, JSON.stringify(progress));
  } catch {
    // A blocked or full localStorage should never prevent the game from running.
  }
}
