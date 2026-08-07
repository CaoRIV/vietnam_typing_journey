import {
  type KeyboardEvent as ReactKeyboardEvent,
  type PointerEvent as ReactPointerEvent,
  type WheelEvent as ReactWheelEvent,
  lazy,
  Suspense,
  useCallback,
  useEffect,
  useMemo,
  useReducer,
  useRef,
  useState,
} from "react";

import { vietnamMapGeometry } from "../data/vietnamMap";
import { getGameMetrics } from "../game/metrics";
import { normalizeVietnameseAnswer } from "../game/normalize";
import { createInitialGameState, gameReducer } from "../game/reducer";
import type { GameState } from "../game/types";
import { createGameConfig, createPlaceIndex } from "../journey/model";
import type { JourneyProgressUpdate } from "../journey/progress";
import type { ProvinceJourney } from "../journey/types";
import {
  createInitialViewport,
  MAX_MAP_ZOOM,
  MIN_MAP_ZOOM,
  panViewport,
  serializeViewport,
  zoomViewport,
  type MapPoint,
  type MapViewport,
} from "../lib/mapViewport";
import {
  getPointAtProgress,
  getProgressAtPointIndex,
} from "../lib/routeGeometry";
import { getGeoRoutePosition } from "../lib/mapboxRoute";
import { resolveNextRouteStep, type RouteStep } from "../routing/routeStep";
import type { MapboxCameraState } from "./MapboxJourneyMap";

const MapboxJourneyMap = lazy(async () => {
  const module = await import("./MapboxJourneyMap");
  return { default: module.MapboxJourneyMap };
});

const mapViewBox = `0 0 ${vietnamMapGeometry.viewBox.width} ${vietnamMapGeometry.viewBox.height}`;
const mapSize = vietnamMapGeometry.viewBox;
const initialViewport = createInitialViewport(mapSize);
const ZOOM_STEP = 1.5;
const mapboxAccessToken = import.meta.env.VITE_MAPBOX_ACCESS_TOKEN?.trim();
const hasMapboxAccessToken = Boolean(
  mapboxAccessToken?.startsWith("pk.") &&
    !mapboxAccessToken.includes("replace_with_your"),
);

const formatDuration = (elapsedMs: number) => {
  const totalSeconds = Math.floor(elapsedMs / 1_000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
};

function getMapProgressForGame(
  state: GameState,
  stopMapProgressValues: readonly number[],
) {
  if (state.status === "completed") return 1;
  const stop = state.stops[state.currentStopIndex];
  if (!stop) return 0;

  const targetLength = normalizeVietnameseAnswer(stop.displayName).length || 1;
  const localProgress = Math.min(1, state.maxCorrectLength / targetLength);
  const fromProgress =
    state.currentStopIndex === 0
      ? 0
      : stopMapProgressValues[state.currentStopIndex - 1];
  const toProgress = stopMapProgressValues[state.currentStopIndex] ?? 1;
  return fromProgress + (toProgress - fromProgress) * localProgress;
}

function PromptCharacters({
  displayName,
  correctLength,
  completed,
}: {
  displayName: string;
  correctLength: number;
  completed: boolean;
}) {
  let normalizedIndex = 0;

  return (
    <span className="prompt-characters" aria-hidden="true">
      {Array.from(displayName).map((character, index) => {
        const isCharacter = normalizeVietnameseAnswer(character).length > 0;
        const characterIndex = normalizedIndex;
        if (isCharacter) normalizedIndex += 1;
        const state = !isCharacter
          ? "separator"
          : completed || characterIndex < correctLength
            ? "correct"
            : characterIndex === correctLength
              ? "current"
              : "pending";

        return (
          <span key={`${character}-${index}`} data-character-state={state}>
            {character}
          </span>
        );
      })}
    </span>
  );
}

type VietnamJourneyMapProps = {
  journey: ProvinceJourney;
  onExit?: () => void;
  onProgressChange?: (update: JourneyProgressUpdate) => void;
};

export function VietnamJourneyMap({
  journey,
  onExit,
  onProgressChange,
}: VietnamJourneyMapProps) {
  return (
    <JourneyGameSession
      key={journey.id}
      journey={journey}
      onExit={onExit}
      onProgressChange={onProgressChange}
    />
  );
}

function JourneyGameSession({
  journey,
  onExit,
  onProgressChange,
}: VietnamJourneyMapProps) {
  const route = journey.route;
  const gameConfig = useMemo(() => createGameConfig(journey), [journey]);
  const placeById = useMemo(() => createPlaceIndex(journey), [journey]);
  const routePointString = useMemo(
    () => route.points.map(({ x, y }) => `${x},${y}`).join(" "),
    [route],
  );
  const initialVehicle = useMemo(
    () => getPointAtProgress(route.points, 0),
    [route],
  );
  const stopMapProgressValues = useMemo(
    () =>
      route.stops.map((stop) =>
        getProgressAtPointIndex(route.points, stop.pointIndex),
      ),
    [route],
  );
  const [gameState, dispatch] = useReducer(
    gameReducer,
    gameConfig,
    createInitialGameState,
  );
  const gameStateRef = useRef(gameState);
  const [mapRenderer, setMapRenderer] = useState<
    "svg" | "mapbox-loading" | "mapbox"
  >(hasMapboxAccessToken ? "mapbox-loading" : "svg");
  const [nextRouteStep, setNextRouteStep] = useState<RouteStep | null>(null);

  const mapStageRef = useRef<HTMLElement>(null);
  const mapSvgRef = useRef<SVGSVGElement>(null);
  const vehicleRef = useRef<SVGGElement>(null);
  const traveledRouteRef = useRef<SVGPolylineElement>(null);
  const coordinateOutputRef = useRef<HTMLOutputElement>(null);
  const zoomOutputRef = useRef<HTMLOutputElement>(null);
  const zoomInRef = useRef<HTMLButtonElement>(null);
  const zoomOutRef = useRef<HTMLButtonElement>(null);
  const typingInputRef = useRef<HTMLInputElement>(null);
  const viewportRef = useRef<MapViewport>({ ...initialViewport });
  const visualProgressRef = useRef(0);
  const mapboxCameraRef = useRef<MapboxCameraState | null>(null);
  const dragRef = useRef<{
    pointerId: number;
    clientX: number;
    clientY: number;
    scale: number;
    viewport: MapViewport;
  } | null>(null);

  const metrics = useMemo(() => getGameMetrics(gameState), [gameState]);
  const mapProgress = getMapProgressForGame(
    gameState,
    stopMapProgressValues,
  );
  const currentStop = gameState.stops[gameState.currentStopIndex];
  const nextStop = gameState.stops[gameState.currentStopIndex + 1];
  const lastVisitedIndex =
    gameState.status === "completed"
      ? gameState.currentStopIndex
      : gameState.currentStopIndex - 1;
  const lastVisitedStop =
    lastVisitedIndex >= 0 ? gameState.stops[lastVisitedIndex] : undefined;
  const lastVisitedPlace = lastVisitedStop
    ? placeById.get(lastVisitedStop.id)
    : undefined;
  const visitedStopIds = useMemo(
    () =>
      gameState.stops
        .filter(
          (_, index) =>
            gameState.status === "completed" ||
            index < gameState.currentStopIndex,
        )
        .map((stop) => stop.id),
    [gameState.currentStopIndex, gameState.status, gameState.stops],
  );
  const currentRouteStopId =
    gameState.status === "completed"
      ? gameState.stops[gameState.currentStopIndex]?.id
      : gameState.currentStopIndex > 0
        ? gameState.stops[gameState.currentStopIndex - 1]?.id
        : null;

  useEffect(() => {
    gameStateRef.current = gameState;
  }, [gameState]);

  useEffect(() => {
    onProgressChange?.({
      journeyId: journey.id,
      visitedPlaceIds: visitedStopIds,
      completed: gameState.status === "completed",
      result: gameState.result,
    });
  }, [
    gameState.result,
    gameState.status,
    journey.id,
    onProgressChange,
    visitedStopIds,
  ]);

  useEffect(() => {
    let cancelled = false;

    void resolveNextRouteStep({
      route,
      currentStop: lastVisitedStop ?? null,
      currentStopId: currentRouteStopId,
      visitedStopIds,
    }).then((step) => {
      if (!cancelled) setNextRouteStep(step);
    });

    return () => {
      cancelled = true;
    };
  }, [currentRouteStopId, lastVisitedStop, route, visitedStopIds]);

  const markerStates = useMemo(
    () =>
      route.stops.map((_, index) => {
        if (gameState.status === "completed" || index < gameState.currentStopIndex) {
          return "completed";
        }
        if (index === gameState.currentStopIndex) return "current";
        return "upcoming";
      }),
    [gameState.currentStopIndex, gameState.status, route.stops],
  );

  const updateMapViewport = useCallback((nextViewport: MapViewport) => {
    viewportRef.current = nextViewport;
    const zoomed = nextViewport.zoom > MIN_MAP_ZOOM + 0.001;
    mapSvgRef.current?.setAttribute("viewBox", serializeViewport(nextViewport));
    mapSvgRef.current?.setAttribute("data-zoomed", String(zoomed));

    if (zoomOutputRef.current) {
      zoomOutputRef.current.textContent = `${Number(nextViewport.zoom.toFixed(2))}×`;
    }
    if (zoomInRef.current) {
      zoomInRef.current.disabled = nextViewport.zoom >= MAX_MAP_ZOOM - 0.001;
    }
    if (zoomOutRef.current) zoomOutRef.current.disabled = !zoomed;
  }, []);

  const setMapZoom = useCallback(
    (zoom: number, focalPoint?: MapPoint) => {
      updateMapViewport(
        zoomViewport(mapSize, viewportRef.current, zoom, focalPoint),
      );
    },
    [updateMapViewport],
  );

  const resetMapView = useCallback(() => {
    updateMapViewport({ ...initialViewport });
  }, [updateMapViewport]);

  const getMapPoint = useCallback((clientX: number, clientY: number) => {
    const svg = mapSvgRef.current;
    const matrix = svg?.getScreenCTM();
    if (!svg || !matrix) return undefined;
    const point = svg.createSVGPoint();
    point.x = clientX;
    point.y = clientY;
    const transformed = point.matrixTransform(matrix.inverse());
    return { x: transformed.x, y: transformed.y };
  }, []);

  const updateMapProgress = useCallback(
    (nextProgress: number, publishVisualProgress = true) => {
      const progress = Math.min(1, Math.max(0, nextProgress));
      const vehicle = getPointAtProgress(route.points, progress);
      if (publishVisualProgress) {
        visualProgressRef.current = progress;
      }
      vehicleRef.current?.setAttribute(
        "transform",
        `translate(${vehicle.x.toFixed(2)} ${vehicle.y.toFixed(2)}) rotate(${vehicle.angle.toFixed(2)})`,
      );
      traveledRouteRef.current?.style.setProperty(
        "stroke-dashoffset",
        String(1 - progress),
      );
      if (coordinateOutputRef.current) {
        coordinateOutputRef.current.textContent = `x ${vehicle.x.toFixed(1)}  y ${vehicle.y.toFixed(1)}  góc ${vehicle.angle.toFixed(0)}°`;
      }
    },
    [route.points],
  );

  const handleMapboxVisualProgress = useCallback((progress: number) => {
    visualProgressRef.current = progress;
  }, []);

  const handleMapboxCameraChange = useCallback(
    (camera: MapboxCameraState) => {
      mapboxCameraRef.current = camera;
    },
    [],
  );

  useEffect(() => {
    updateMapProgress(mapProgress, mapRenderer !== "mapbox");
  }, [mapProgress, mapRenderer, updateMapProgress]);

  useEffect(() => {
    updateMapViewport({ ...initialViewport });
  }, [updateMapViewport]);

  useEffect(() => {
    if (gameState.status !== "playing") return;
    const timer = window.setInterval(() => {
      dispatch({ type: "TICK", now: performance.now() });
    }, 250);
    return () => window.clearInterval(timer);
  }, [gameState.status]);

  useEffect(() => {
    if (gameState.status === "completed") return;
    typingInputRef.current?.focus({ preventScroll: true });
  }, [gameState.currentStopIndex, gameState.status]);

  useEffect(() => {
    const pauseWhenHidden = () => {
      if (
        document.visibilityState === "hidden" &&
        gameStateRef.current.status === "playing"
      ) {
        dispatch({ type: "PAUSE", now: performance.now() });
      }
    };
    document.addEventListener("visibilitychange", pauseWhenHidden);
    return () => document.removeEventListener("visibilitychange", pauseWhenHidden);
  }, []);

  useEffect(() => {
    const renderGameToText = () => {
      const state = gameStateRef.current;
      const liveMetrics = getGameMetrics(state);
      const liveMapProgress = visualProgressRef.current;
      const vehicle = getPointAtProgress(route.points, liveMapProgress);
      const geoVehicle = getGeoRoutePosition(
        route.points,
        route.geoPoints,
        liveMapProgress,
      );
      const targetMapProgress = getMapProgressForGame(
        state,
        stopMapProgressValues,
      );
      const usesMapbox = mapRenderer === "mapbox";

      return JSON.stringify({
        mode: state.status,
        mapRenderer:
          mapRenderer === "mapbox-loading"
            ? "mapbox-loading"
            : usesMapbox
              ? "mapbox"
              : "svg-fallback",
        coordinateSystem: usesMapbox
          ? "WGS84 longitude/latitude rendered by Mapbox GL JS"
          : `Projected GeoJSON in SVG viewBox ${mapViewBox}; origin top-left; x right; y down`,
        projection: usesMapbox ? "webMercator" : vietnamMapGeometry.projection.type,
        mapViewport: {
          zoom: Number(viewportRef.current.zoom.toFixed(3)),
          x: Number(viewportRef.current.x.toFixed(2)),
          y: Number(viewportRef.current.y.toFixed(2)),
          width: Number(viewportRef.current.width.toFixed(2)),
          height: Number(viewportRef.current.height.toFixed(2)),
        },
        journey: {
          id: journey.id,
          slug: journey.slug,
          name: journey.name,
          province: journey.shortName,
        },
        route: route.name,
        nextStopId: nextRouteStep?.to.id ?? null,
        routingProvider: nextRouteStep?.geometry.provider ?? null,
        currentRouteSegment: nextRouteStep?.geometry.geometry ?? null,
        routing: nextRouteStep
          ? {
              provider: nextRouteStep.geometry.provider,
              routingProvider: nextRouteStep.geometry.provider,
              fromStopId: nextRouteStep.from.id,
              toStopId: nextRouteStep.to.id,
              nextStopId: nextRouteStep.to.id,
              distanceMeters: Math.round(nextRouteStep.geometry.distanceMeters),
              routePointCount:
                nextRouteStep.geometry.geometry.coordinates.length,
              currentRouteSegment: nextRouteStep.geometry.geometry,
            }
          : null,
        progress: Number(liveMetrics.progress.toFixed(4)),
        mapProgress: Number(liveMapProgress.toFixed(4)),
        targetMapProgress: Number(targetMapProgress.toFixed(4)),
        camera:
          usesMapbox && mapboxCameraRef.current
            ? {
                longitude: Number(
                  mapboxCameraRef.current.longitude.toFixed(5),
                ),
                latitude: Number(mapboxCameraRef.current.latitude.toFixed(5)),
                zoom: Number(mapboxCameraRef.current.zoom.toFixed(3)),
              }
            : null,
        vehicle: usesMapbox
          ? {
              longitude: Number(geoVehicle.coordinates[0].toFixed(5)),
              latitude: Number(geoVehicle.coordinates[1].toFixed(5)),
              bearing: Number(geoVehicle.bearing.toFixed(2)),
            }
          : {
              x: Number(vehicle.x.toFixed(2)),
              y: Number(vehicle.y.toFixed(2)),
              angle: Number(vehicle.angle.toFixed(2)),
            },
        game: {
          input: state.input,
          feedback: state.feedback,
          elapsedMs: Math.round(state.elapsedMs),
          correctInputs: state.correctInputs,
          incorrectInputs: state.incorrectInputs,
          cpm: liveMetrics.cpm,
          wpm: liveMetrics.wpm,
          accuracy: liveMetrics.accuracy,
        },
        currentStop: state.stops[state.currentStopIndex]?.displayName ?? null,
        nextStop: state.stops[state.currentStopIndex + 1]?.displayName ?? null,
        lastVisitedPlace:
          state.status === "completed"
            ? state.stops[state.currentStopIndex]?.displayName ?? null
            : state.stops[state.currentStopIndex - 1]?.displayName ?? null,
        stops: state.stops.map((stop, index) => ({
          name: stop.displayName,
          state:
            state.status === "completed" || index < state.currentStopIndex
              ? "completed"
              : index === state.currentStopIndex
                ? "current"
                : "upcoming",
        })),
        result: state.result,
      });
    };

    window.render_game_to_text = renderGameToText;
    window.advanceTime = (elapsedMs: number) => {
      const state = gameStateRef.current;
      const baseTime = state.lastTimestampMs ?? performance.now();
      dispatch({ type: "TICK", now: baseTime + Math.max(0, elapsedMs) });
    };
    window.setJourneyProgress = (progress: number) =>
      updateMapProgress(progress);
    window.setMapZoom = setMapZoom;
    window.resetMapView = resetMapView;
    window.typeJourneyText = (value: string) => {
      dispatch({
        type: "INPUT",
        value,
        now: performance.now(),
        completedAt: new Date().toISOString(),
      });
    };
    window.resetJourneyGame = () => dispatch({ type: "RESET" });

    return () => {
      delete window.render_game_to_text;
      delete window.advanceTime;
      delete window.setJourneyProgress;
      delete window.setMapZoom;
      delete window.resetMapView;
      delete window.typeJourneyText;
      delete window.resetJourneyGame;
    };
  }, [
    journey,
    mapRenderer,
    nextRouteStep,
    resetMapView,
    route,
    setMapZoom,
    stopMapProgressValues,
    updateMapProgress,
  ]);

  useEffect(() => {
    const toggleFullscreen = (event: KeyboardEvent) => {
      if (event.key.toLowerCase() !== "f" || event.repeat) return;
      const target = event.target as HTMLElement | null;
      if (target?.matches("input, textarea, select, button")) return;
      if (document.fullscreenElement) void document.exitFullscreen();
      else void mapStageRef.current?.requestFullscreen().catch(() => undefined);
    };
    window.addEventListener("keydown", toggleFullscreen);
    return () => window.removeEventListener("keydown", toggleFullscreen);
  }, []);

  const handleMapWheel = (event: ReactWheelEvent<SVGSVGElement>) => {
    if (!event.ctrlKey && viewportRef.current.zoom <= MIN_MAP_ZOOM) return;
    event.preventDefault();
    setMapZoom(
      viewportRef.current.zoom * Math.exp(-event.deltaY * 0.002),
      getMapPoint(event.clientX, event.clientY),
    );
  };

  const handleMapPointerDown = (event: ReactPointerEvent<SVGSVGElement>) => {
    if (viewportRef.current.zoom <= MIN_MAP_ZOOM) return;
    const rect = event.currentTarget.getBoundingClientRect();
    const scale = Math.min(
      rect.width / viewportRef.current.width,
      rect.height / viewportRef.current.height,
    );
    dragRef.current = {
      pointerId: event.pointerId,
      clientX: event.clientX,
      clientY: event.clientY,
      scale,
      viewport: { ...viewportRef.current },
    };
    event.currentTarget.setPointerCapture(event.pointerId);
    event.currentTarget.setAttribute("data-dragging", "true");
  };

  const handleMapPointerMove = (event: ReactPointerEvent<SVGSVGElement>) => {
    const drag = dragRef.current;
    if (!drag || drag.pointerId !== event.pointerId) return;
    updateMapViewport(
      panViewport(mapSize, drag.viewport, {
        x: -(event.clientX - drag.clientX) / drag.scale,
        y: -(event.clientY - drag.clientY) / drag.scale,
      }),
    );
  };

  const endMapDrag = (event: ReactPointerEvent<SVGSVGElement>) => {
    if (dragRef.current?.pointerId !== event.pointerId) return;
    dragRef.current = null;
    event.currentTarget.removeAttribute("data-dragging");
    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId);
    }
  };

  const handleMapKeyDown = (event: ReactKeyboardEvent<SVGSVGElement>) => {
    const key = event.key;
    if (!["+", "=", "-", "0", "ArrowLeft", "ArrowRight", "ArrowUp", "ArrowDown"].includes(key)) return;
    event.preventDefault();
    if (key === "+" || key === "=") return setMapZoom(viewportRef.current.zoom * ZOOM_STEP);
    if (key === "-") return setMapZoom(viewportRef.current.zoom / ZOOM_STEP);
    if (key === "0") return resetMapView();
    const viewport = viewportRef.current;
    updateMapViewport(
      panViewport(mapSize, viewport, {
        x: key === "ArrowLeft" ? -viewport.width * 0.1 : key === "ArrowRight" ? viewport.width * 0.1 : 0,
        y: key === "ArrowUp" ? -viewport.height * 0.1 : key === "ArrowDown" ? viewport.height * 0.1 : 0,
      }),
    );
  };

  const feedbackText =
    gameState.status === "completed"
      ? `Bạn đã tham quan đủ ${journey.places.length} điểm của hành trình ${journey.shortName}.`
      : gameState.status === "paused"
        ? "Hành trình đang tạm dừng."
        : gameState.feedback === "incorrect"
          ? "Ký tự chưa đúng. Xe đang chờ bạn sửa lại."
          : gameState.feedback === "stop-complete"
            ? `Đã qua ${gameState.stops[gameState.currentStopIndex - 1]?.displayName}. Tiếp tục với ${currentStop.displayName}.`
            : gameState.status === "ready"
              ? "Đồng hồ bắt đầu ở ký tự đúng đầu tiên."
              : "Đúng rồi, tiếp tục gõ để xe tiến lên.";

  return (
    <main className="min-h-[100dvh] px-4 py-5 sm:px-6 lg:px-8 lg:py-7">
      <header className="mx-auto flex max-w-[1400px] items-end justify-between gap-5 pb-5 lg:pb-6">
        <div className="flex items-end gap-4">
          {onExit ? (
            <button
              id="back-to-province-map"
              type="button"
              className="journey-back-button"
              aria-label="Trở về bản đồ hành trình"
              onClick={onExit}
            >
              <span aria-hidden="true">←</span>
            </button>
          ) : null}
          <div>
          <p className="font-mono text-[0.7rem] font-semibold uppercase tracking-[0.16em] text-accent">Gõ Xuyên Việt</p>
          <h1 className="mt-2 text-2xl font-extrabold tracking-[-0.035em] text-foreground sm:text-3xl">Tỉnh thí điểm: {journey.shortName}</h1>
          </div>
        </div>
        <p className="hidden max-w-[42ch] text-right text-sm leading-6 text-muted md:block">{journey.description}</p>
      </header>

      <div className="mx-auto grid max-w-[1400px] gap-4 lg:grid-cols-[minmax(0,1.62fr)_minmax(20rem,0.78fr)] lg:gap-5">
        <figure ref={mapStageRef} className="map-stage relative m-0 min-h-[31rem] overflow-hidden rounded-[var(--radius-panel)] border border-map-border bg-map lg:min-h-[calc(100dvh-8rem)]">
          <svg
            ref={mapSvgRef}
            id="journey-map-svg"
            className="absolute inset-0 h-full w-full"
            viewBox={mapViewBox}
            data-zoomed="false"
            role="img"
            aria-hidden={mapRenderer === "mapbox"}
            aria-labelledby="map-title map-description"
            aria-describedby="map-navigation-help"
            preserveAspectRatio="xMidYMid meet"
            tabIndex={mapRenderer === "mapbox" ? -1 : 0}
            onWheel={handleMapWheel}
            onDoubleClick={(event) => setMapZoom(viewportRef.current.zoom * ZOOM_STEP, getMapPoint(event.clientX, event.clientY))}
            onPointerDown={handleMapPointerDown}
            onPointerMove={handleMapPointerMove}
            onPointerUp={endMapDrag}
            onPointerCancel={endMapDrag}
            onKeyDown={handleMapKeyDown}
          >
            <title id="map-title">Bản đồ {journey.name}</title>
            <desc id="map-description">{journey.places.length} điểm tham quan tại {journey.shortName}. Xe tiến lên theo số ký tự người chơi gõ đúng.</desc>
            <defs>
              <linearGradient id="land-wash" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stopColor="var(--map-land-top)" /><stop offset="1" stopColor="var(--map-land-bottom)" /></linearGradient>
              <filter id="land-shadow" x="-30%" y="-20%" width="160%" height="160%"><feDropShadow dx="0" dy="8" stdDeviation="10" floodColor="var(--map-shadow)" floodOpacity="0.22" /></filter>
            </defs>
            <g className="map-contours" aria-hidden="true"><path d="M34 154 C92 126 127 132 166 149" /><path d="M302 244 C350 226 402 231 451 267" /><path d="M294 471 C351 447 410 458 455 499" /><path d="M25 608 C79 577 121 582 155 605" /></g>
            <path className="vietnam-land" filter="url(#land-shadow)" fill="url(#land-wash)" d={vietnamMapGeometry.path} />
            <g className="archipelago-markers" aria-label="Vị trí địa lý của hai quần đảo">
              {vietnamMapGeometry.archipelagos.map((place) => <g key={place.id} className="archipelago-marker"><circle className="archipelago-marker-ring" cx={place.point.x} cy={place.point.y} r="6" /><circle className="archipelago-marker-core" cx={place.point.x} cy={place.point.y} r="2" /><text className="archipelago-label" x={place.label.x} y={place.label.y} textAnchor={place.label.anchor}>{place.name}</text></g>)}
            </g>
            <polyline className="journey-route-base" points={routePointString} fill="none" />
            <polyline ref={traveledRouteRef} className="journey-route-traveled" points={routePointString} pathLength="1" strokeDasharray="1" strokeDashoffset="1" fill="none" />
            {route.stops.map((stop, index) => {
              const point = route.points[stop.pointIndex];
              const lineEndX = stop.label.anchor === "end" ? stop.label.x + 8 : stop.label.x - 8;
              return <g key={stop.id} data-stop-id={stop.id} data-state={markerStates[index]}><line className="stop-leader" x1={point.x} y1={point.y} x2={lineEndX} y2={stop.label.y - 4} /><g className="stop-marker" transform={`translate(${point.x} ${point.y})`}><circle className="stop-marker-ring" r="7.5" /><circle className="stop-marker-core" r="2.75" /></g><text className="stop-label" x={stop.label.x} y={stop.label.y} textAnchor={stop.label.anchor}>{stop.name}</text></g>;
            })}
            <g ref={vehicleRef} className="journey-vehicle" transform={`translate(${initialVehicle.x} ${initialVehicle.y}) rotate(${initialVehicle.angle})`} aria-hidden="true"><ellipse className="vehicle-shadow" cx="0" cy="8" rx="22" ry="7" /><g transform="translate(-19 -12)"><rect className="vehicle-body" x="3" y="4" width="31" height="17" rx="5" /><path className="vehicle-cabin" d="M20 4 L25 -3 H33 L38 9 H20 Z" /><path className="vehicle-window" d="M24 3 L27 0 H32 L34 7 H23 Z" /><circle className="vehicle-wheel" cx="11" cy="22" r="5" /><circle className="vehicle-wheel" cx="31" cy="22" r="5" /><circle className="vehicle-hub" cx="11" cy="22" r="2" /><circle className="vehicle-hub" cx="31" cy="22" r="2" /><rect className="vehicle-light" x="35" y="11" width="4" height="5" rx="1" /></g></g>
          </svg>

          {hasMapboxAccessToken && mapRenderer !== "svg" ? (
            <Suspense fallback={null}>
              <MapboxJourneyMap
                accessToken={mapboxAccessToken!}
                route={route}
                progress={mapProgress}
                stopStates={markerStates}
                onVisualProgressChange={handleMapboxVisualProgress}
                onCameraChange={handleMapboxCameraChange}
                onReady={() => setMapRenderer("mapbox")}
                onError={() => setMapRenderer("svg")}
              />
            </Suspense>
          ) : null}

          {mapRenderer !== "mapbox" ? <div className="map-zoom-panel"><div className="map-zoom-controls" role="group" aria-label="Điều khiển thu phóng bản đồ"><button ref={zoomOutRef} id="map-zoom-out" type="button" aria-label="Thu nhỏ bản đồ" title="Thu nhỏ bản đồ" disabled onClick={() => setMapZoom(viewportRef.current.zoom / ZOOM_STEP)}>−</button><button id="map-zoom-reset" type="button" aria-label="Hiển thị toàn bộ Việt Nam" title="Hiển thị toàn bộ Việt Nam" onClick={resetMapView}><output ref={zoomOutputRef} aria-live="polite">1×</output></button><button ref={zoomInRef} id="map-zoom-in" type="button" aria-label="Phóng to bản đồ" title="Phóng to bản đồ" onClick={() => setMapZoom(viewportRef.current.zoom * ZOOM_STEP)}>+</button></div><span id="map-navigation-help" className="map-zoom-hint">Phóng to rồi kéo để xem từng vùng</span></div> : null}
          <div className="map-legend" aria-hidden="true"><span className="legend-line" /><span>{journey.shortName}</span></div>
          {mapRenderer !== "mapbox" ? <div className="coordinate-readout"><span>PROGRESS</span><output ref={coordinateOutputRef}>x {initialVehicle.x.toFixed(1)}&nbsp; y {initialVehicle.y.toFixed(1)}&nbsp; góc {initialVehicle.angle.toFixed(0)}°</output></div> : null}
          <figcaption className="sr-only">Xe tiến theo ký tự gõ đúng. Dùng nút thu phóng và kéo để xem bản đồ. Nhấn F để bật hoặc tắt toàn màn hình.</figcaption>
        </figure>

        <aside className="control-panel rounded-[var(--radius-panel)] border border-border bg-surface p-5 sm:p-6 lg:flex lg:min-h-[calc(100dvh-8rem)] lg:flex-col lg:p-7">
          <div className="flex items-start justify-between gap-4">
            <div><h2 className="text-2xl font-extrabold tracking-[-0.03em] text-foreground">{journey.name}</h2><p className="mt-2 text-sm leading-6 text-muted">Điểm {Math.min(gameState.currentStopIndex + 1, gameState.stops.length)} / {gameState.stops.length}</p></div>
            <span className="game-status-label" data-game-status={gameState.status}>{gameState.status === "ready" ? "Sẵn sàng" : gameState.status === "playing" ? "Đang đi" : gameState.status === "paused" ? "Tạm dừng" : "Hoàn thành"}</span>
          </div>

          <section className="game-stats mt-5" aria-label="Số liệu hành trình">
            <div><span>Thời gian</span><output>{formatDuration(gameState.elapsedMs)}</output></div>
            <div><span>WPM</span><output>{metrics.wpm}</output></div>
            <div><span>Chính xác</span><output>{metrics.accuracy}%</output></div>
          </section>

          <section className="mt-6" aria-labelledby="typing-heading">
            {gameState.status === "completed" ? (
              <div className="completion-panel" role="status"><p className="text-sm font-bold text-accent">Đã khám phá {journey.shortName}</p><h3 id="typing-heading" className="mt-2 text-2xl font-extrabold tracking-[-0.03em] text-foreground">Hoàn thành hành trình</h3><p className="mt-2 text-sm leading-6 text-muted">{gameState.result?.correctInputs} ký tự đúng, {gameState.result?.incorrectInputs} lần gõ sai trong {formatDuration(gameState.result?.durationMs ?? 0)}.</p></div>
            ) : (
              <>
                <p className="text-xs font-bold uppercase tracking-[0.12em] text-muted">Điểm đến hiện tại</p>
                <h3 id="typing-heading" className="sr-only">Gõ {currentStop.displayName}</h3>
                <div className="mt-2" aria-label={currentStop.displayName}><PromptCharacters displayName={currentStop.displayName} correctLength={gameState.maxCorrectLength} completed={false} /></div>
                <label className="mt-5 block text-sm font-bold text-foreground" htmlFor="journey-typing-input">Gõ tên địa danh</label>
                <div className="typing-input-shell mt-2" data-feedback={gameState.feedback} data-paused={gameState.status === "paused"}>
                  <input ref={typingInputRef} id="journey-typing-input" value={gameState.input} type="text" inputMode="text" autoComplete="off" autoCapitalize="none" enterKeyHint="next" spellCheck={false} disabled={gameState.status === "paused"} placeholder={`Ví dụ: ${normalizeVietnameseAnswer(currentStop.displayName)}`} aria-describedby="typing-feedback" onChange={(event) => dispatch({ type: "INPUT", value: event.currentTarget.value, now: performance.now(), completedAt: new Date().toISOString() })} />
                </div>
              </>
            )}
            <p id="typing-feedback" className="typing-feedback mt-2" data-feedback={gameState.feedback} aria-live="polite">{feedbackText}</p>

            <div className="mt-4 grid grid-cols-[1fr_auto] gap-3">
              {gameState.status === "completed" ? <button id="journey-restart" type="button" className="game-primary-button" onClick={() => dispatch({ type: "RESET" })}>Chơi lại</button> : <button id="journey-pause-toggle" type="button" className="game-primary-button" disabled={gameState.status === "ready"} onClick={() => dispatch({ type: gameState.status === "paused" ? "RESUME" : "PAUSE", now: performance.now() })}>{gameState.status === "paused" ? "Tiếp tục" : "Tạm dừng"}</button>}
              <button id="journey-reset" type="button" className="game-secondary-button" onClick={() => dispatch({ type: "RESET" })}>Đặt lại</button>
            </div>
          </section>

          {lastVisitedPlace ? (
            <article className="visited-place mt-6" aria-labelledby="visited-place-heading">
              <div className="visited-place-image">
                <img
                  src={lastVisitedPlace.image.src}
                  alt={lastVisitedPlace.image.alt}
                  loading="lazy"
                  decoding="async"
                />
              </div>
              <div className="visited-place-copy">
                <p className="text-xs font-bold uppercase tracking-[0.12em] text-accent">Vừa ghé thăm</p>
                <h3 id="visited-place-heading" className="mt-1 text-lg font-extrabold tracking-[-0.025em] text-foreground">{lastVisitedPlace.name}</h3>
                <p className="mt-2 text-sm leading-6 text-muted">{lastVisitedPlace.shortDescription}</p>
                <p className="mt-3 text-xs leading-5 text-muted">
                  Ảnh: {lastVisitedPlace.image.author},{" "}
                  <a href={lastVisitedPlace.image.licenseUrl} target="_blank" rel="noreferrer">{lastVisitedPlace.image.license}</a>
                  {" · "}
                  <a href={lastVisitedPlace.image.sourceUrl} target="_blank" rel="noreferrer">nguồn ảnh</a>
                  {" · "}
                  <a href={lastVisitedPlace.contentSources[0].url} target="_blank" rel="noreferrer">nguồn nội dung</a>
                </p>
              </div>
            </article>
          ) : null}

          <section aria-labelledby="progress-heading" className="mt-6">
            <div className="flex items-center justify-between gap-4"><h3 id="progress-heading" className="text-sm font-bold text-foreground">Tiến độ hành trình</h3><output className="font-mono text-sm font-bold text-accent">{Math.round(metrics.progress * 100)}%</output></div>
            <div className="game-progress-track mt-3" role="progressbar" aria-label="Tiến độ hành trình" aria-valuemin={0} aria-valuemax={100} aria-valuenow={Math.round(metrics.progress * 100)}><span style={{ transform: `scaleX(${metrics.progress})` }} /></div>
          </section>

          <section aria-labelledby="stops-heading" className="mt-6 lg:mt-auto lg:pt-6">
            <div className="flex items-baseline justify-between gap-4"><h3 id="stops-heading" className="text-sm font-bold text-foreground">Điểm tham quan</h3>{nextStop && gameState.status !== "completed" ? <p className="text-xs text-muted">Tiếp theo: {nextStop.displayName}</p> : null}</div>
            <ol className="route-board mt-3 grid grid-cols-2 gap-x-4 gap-y-2 p-0 sm:grid-cols-3 lg:grid-cols-2">{route.stops.map((stop, index) => <li key={stop.id} data-state={markerStates[index]} className="route-board-stop grid grid-cols-[1.7rem_1fr] items-center gap-2"><span className="route-stop-number font-mono text-xs font-bold">{String(index + 1).padStart(2, "0")}</span><span className="text-sm font-semibold">{stop.name}</span></li>)}</ol>
          </section>
        </aside>
      </div>
    </main>
  );
}
