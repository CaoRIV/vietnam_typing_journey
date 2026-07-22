import {
  type KeyboardEvent as ReactKeyboardEvent,
  type PointerEvent as ReactPointerEvent,
  type WheelEvent as ReactWheelEvent,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

import { centralRoute, vietnamMapGeometry } from "../data/centralRoute";
import {
  getPointAtProgress,
  getProgressAtPointIndex,
} from "../lib/routeGeometry";
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

const PLAYBACK_DURATION_MS = 8_000;

const routePointString = centralRoute.points
  .map(({ x, y }) => `${x},${y}`)
  .join(" ");

const stopProgressValues = centralRoute.stops.map((stop) =>
  getProgressAtPointIndex(centralRoute.points, stop.pointIndex),
);

const initialVehicle = getPointAtProgress(centralRoute.points, 0);
const mapViewBox = `0 0 ${vietnamMapGeometry.viewBox.width} ${vietnamMapGeometry.viewBox.height}`;
const mapSize = vietnamMapGeometry.viewBox;
const initialViewport = createInitialViewport(mapSize);
const ZOOM_STEP = 1.5;

function getActiveStopIndex(progress: number) {
  let activeIndex = 0;
  stopProgressValues.forEach((stopProgress, index) => {
    if (progress + 0.0001 >= stopProgress) activeIndex = index;
  });
  return activeIndex;
}

export function VietnamJourneyMap() {
  const mapStageRef = useRef<HTMLElement>(null);
  const mapSvgRef = useRef<SVGSVGElement>(null);
  const vehicleRef = useRef<SVGGElement>(null);
  const traveledRouteRef = useRef<SVGPolylineElement>(null);
  const progressInputRef = useRef<HTMLInputElement>(null);
  const progressNumberRef = useRef<HTMLOutputElement>(null);
  const coordinateOutputRef = useRef<HTMLOutputElement>(null);
  const zoomOutputRef = useRef<HTMLOutputElement>(null);
  const zoomInRef = useRef<HTMLButtonElement>(null);
  const zoomOutRef = useRef<HTMLButtonElement>(null);
  const progressRef = useRef(0);
  const viewportRef = useRef<MapViewport>({ ...initialViewport });
  const dragRef = useRef<{
    pointerId: number;
    clientX: number;
    clientY: number;
    scale: number;
    viewport: MapViewport;
  } | null>(null);
  const playingRef = useRef(false);
  const manualTimeRef = useRef(false);
  const completeRef = useRef(false);
  const activeStopIndexRef = useRef(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isComplete, setIsComplete] = useState(false);
  const [activeStopIndex, setActiveStopIndex] = useState(0);

  const setPlaying = useCallback((nextPlaying: boolean) => {
    playingRef.current = nextPlaying;
    setIsPlaying(nextPlaying);
  }, []);

  const updateMapViewport = useCallback((nextViewport: MapViewport) => {
    viewportRef.current = nextViewport;
    const zoomed = nextViewport.zoom > MIN_MAP_ZOOM + 0.001;

    mapSvgRef.current?.setAttribute("viewBox", serializeViewport(nextViewport));
    mapSvgRef.current?.setAttribute("data-zoomed", String(zoomed));

    if (zoomOutputRef.current) {
      const zoomLabel = Number(nextViewport.zoom.toFixed(2));
      zoomOutputRef.current.textContent = `${zoomLabel}×`;
    }
    if (zoomInRef.current) {
      zoomInRef.current.disabled = nextViewport.zoom >= MAX_MAP_ZOOM - 0.001;
    }
    if (zoomOutRef.current) {
      zoomOutRef.current.disabled = !zoomed;
    }
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

  const updateVisual = useCallback((nextProgress: number) => {
    const progress = Math.min(1, Math.max(0, nextProgress));
    const vehicle = getPointAtProgress(centralRoute.points, progress);
    const nextStopIndex = getActiveStopIndex(progress);
    const nextComplete = progress >= 1;

    progressRef.current = progress;
    vehicleRef.current?.setAttribute(
      "transform",
      `translate(${vehicle.x.toFixed(2)} ${vehicle.y.toFixed(2)}) rotate(${vehicle.angle.toFixed(2)})`,
    );
    traveledRouteRef.current?.style.setProperty(
      "stroke-dashoffset",
      String(1 - progress),
    );

    if (progressInputRef.current) {
      progressInputRef.current.value = String(progress);
      progressInputRef.current.setAttribute("aria-valuenow", progress.toFixed(3));
    }
    if (progressNumberRef.current) {
      progressNumberRef.current.textContent = `${Math.round(progress * 100)}%`;
    }
    if (coordinateOutputRef.current) {
      coordinateOutputRef.current.textContent = `x ${vehicle.x.toFixed(1)}  y ${vehicle.y.toFixed(1)}  góc ${vehicle.angle.toFixed(0)}°`;
    }

    if (nextStopIndex !== activeStopIndexRef.current) {
      activeStopIndexRef.current = nextStopIndex;
      setActiveStopIndex(nextStopIndex);
    }
    if (nextComplete !== completeRef.current) {
      completeRef.current = nextComplete;
      setIsComplete(nextComplete);
    }
  }, []);

  const advanceProgress = useCallback(
    (elapsedMs: number) => {
      const nextProgress = progressRef.current + elapsedMs / PLAYBACK_DURATION_MS;
      updateVisual(nextProgress);

      if (nextProgress >= 1) setPlaying(false);
    },
    [setPlaying, updateVisual],
  );

  useEffect(() => {
    updateVisual(0);
    updateMapViewport({ ...initialViewport });
  }, [updateMapViewport, updateVisual]);

  useEffect(() => {
    if (!isPlaying) return;

    let animationFrame = 0;
    let previousTime = performance.now();

    const tick = (time: number) => {
      const elapsed = Math.min(100, time - previousTime);
      previousTime = time;
      if (!manualTimeRef.current) advanceProgress(elapsed);

      if (playingRef.current && progressRef.current < 1) {
        animationFrame = requestAnimationFrame(tick);
      }
    };

    animationFrame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(animationFrame);
  }, [advanceProgress, isPlaying]);

  useEffect(() => {
    const renderGameToText = () => {
      const progress = progressRef.current;
      const stopIndex = getActiveStopIndex(progress);
      const vehicle = getPointAtProgress(centralRoute.points, progress);

      return JSON.stringify({
        mode: playingRef.current ? "playing" : progress >= 1 ? "completed" : "paused",
        coordinateSystem: `Projected GeoJSON in SVG viewBox ${mapViewBox}; origin top-left; x right; y down`,
        projection: vietnamMapGeometry.projection.type,
        mapViewport: {
          zoom: Number(viewportRef.current.zoom.toFixed(3)),
          x: Number(viewportRef.current.x.toFixed(2)),
          y: Number(viewportRef.current.y.toFixed(2)),
          width: Number(viewportRef.current.width.toFixed(2)),
          height: Number(viewportRef.current.height.toFixed(2)),
        },
        route: centralRoute.name,
        progress: Number(progress.toFixed(4)),
        vehicle: {
          x: Number(vehicle.x.toFixed(2)),
          y: Number(vehicle.y.toFixed(2)),
          angle: Number(vehicle.angle.toFixed(2)),
        },
        currentStop: centralRoute.stops[stopIndex].name,
        nextStop: centralRoute.stops[stopIndex + 1]?.name ?? null,
        stops: centralRoute.stops.map((stop, index) => ({
          name: stop.name,
          longitude: stop.coordinates[0],
          latitude: stop.coordinates[1],
          progress: Number(stopProgressValues[index].toFixed(4)),
          state:
            progress >= 1 || index < stopIndex
              ? "completed"
              : index === stopIndex
                ? "current"
                : "upcoming",
        })),
      });
    };

    const setJourneyProgress = (progress: number) => {
      setPlaying(false);
      updateVisual(progress);
    };

    const advanceTime = (elapsedMs: number) => {
      manualTimeRef.current = true;
      if (playingRef.current) advanceProgress(Math.max(0, elapsedMs));
    };

    window.render_game_to_text = renderGameToText;
    window.setJourneyProgress = setJourneyProgress;
    window.advanceTime = advanceTime;
    window.setMapZoom = setMapZoom;
    window.resetMapView = resetMapView;

    return () => {
      delete window.render_game_to_text;
      delete window.setJourneyProgress;
      delete window.advanceTime;
      delete window.setMapZoom;
      delete window.resetMapView;
    };
  }, [advanceProgress, resetMapView, setMapZoom, setPlaying, updateVisual]);

  useEffect(() => {
    const toggleFullscreen = (event: KeyboardEvent) => {
      if (event.key.toLowerCase() !== "f" || event.repeat) return;
      const target = event.target as HTMLElement | null;
      if (target?.matches("input, textarea, select, button")) return;

      if (document.fullscreenElement) {
        void document.exitFullscreen();
      } else {
        void mapStageRef.current?.requestFullscreen().catch(() => undefined);
      }
    };

    window.addEventListener("keydown", toggleFullscreen);
    return () => window.removeEventListener("keydown", toggleFullscreen);
  }, []);

  const handlePlayToggle = () => {
    if (isPlaying) {
      setPlaying(false);
      return;
    }

    if (progressRef.current >= 1) updateVisual(0);
    manualTimeRef.current = false;

    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduceMotion) {
      updateVisual(1);
      return;
    }

    setPlaying(true);
  };

  const handleReset = () => {
    setPlaying(false);
    manualTimeRef.current = false;
    updateVisual(0);
  };

  const handleMapWheel = (event: ReactWheelEvent<SVGSVGElement>) => {
    if (!event.ctrlKey && viewportRef.current.zoom <= MIN_MAP_ZOOM) return;

    event.preventDefault();
    const focalPoint = getMapPoint(event.clientX, event.clientY);
    const zoomMultiplier = Math.exp(-event.deltaY * 0.002);
    setMapZoom(viewportRef.current.zoom * zoomMultiplier, focalPoint);
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
    if (["+", "=", "-", "0", "ArrowLeft", "ArrowRight", "ArrowUp", "ArrowDown"].includes(key)) {
      event.preventDefault();
    } else {
      return;
    }

    if (key === "+" || key === "=") {
      setMapZoom(viewportRef.current.zoom * ZOOM_STEP);
      return;
    }
    if (key === "-") {
      setMapZoom(viewportRef.current.zoom / ZOOM_STEP);
      return;
    }
    if (key === "0") {
      resetMapView();
      return;
    }

    const viewport = viewportRef.current;
    const xStep = viewport.width * 0.1;
    const yStep = viewport.height * 0.1;
    updateMapViewport(
      panViewport(mapSize, viewport, {
        x: key === "ArrowLeft" ? -xStep : key === "ArrowRight" ? xStep : 0,
        y: key === "ArrowUp" ? -yStep : key === "ArrowDown" ? yStep : 0,
      }),
    );
  };

  const currentStop = centralRoute.stops[activeStopIndex];
  const nextStop = centralRoute.stops[activeStopIndex + 1];
  const markerStates = useMemo(
    () =>
      centralRoute.stops.map((_, index) => {
        if (isComplete || index < activeStopIndex) return "completed";
        if (index === activeStopIndex) return "current";
        return "upcoming";
      }),
    [activeStopIndex, isComplete],
  );

  return (
    <main className="min-h-[100dvh] px-4 py-5 sm:px-6 lg:px-8 lg:py-7">
      <header className="mx-auto flex max-w-[1400px] items-end justify-between gap-5 pb-5 lg:pb-6">
        <div>
          <p className="font-mono text-[0.7rem] font-semibold uppercase tracking-[0.16em] text-accent">
            Gõ Xuyên Việt
          </p>
          <h1 className="mt-2 text-2xl font-extrabold tracking-[-0.035em] text-foreground sm:text-3xl">
            Tuyến miền Trung thử nghiệm
          </h1>
        </div>
        <p className="hidden max-w-[31ch] text-right text-sm leading-6 text-muted md:block">
          Điều khiển progress để kiểm tra xe trên toàn tuyến.
        </p>
      </header>

      <div className="mx-auto grid max-w-[1400px] gap-4 lg:grid-cols-[minmax(0,1.62fr)_minmax(20rem,0.78fr)] lg:gap-5">
        <figure
          ref={mapStageRef}
          className="map-stage relative m-0 min-h-[31rem] overflow-hidden rounded-[var(--radius-panel)] border border-map-border bg-map lg:min-h-[calc(100dvh-8rem)]"
        >
          <svg
            ref={mapSvgRef}
            id="journey-map-svg"
            className="absolute inset-0 h-full w-full"
            viewBox={mapViewBox}
            data-zoomed="false"
            role="img"
            aria-labelledby="map-title map-description"
            aria-describedby="map-navigation-help"
            preserveAspectRatio="xMidYMid meet"
            tabIndex={0}
            onWheel={handleMapWheel}
            onDoubleClick={(event) => {
              setMapZoom(
                viewportRef.current.zoom * ZOOM_STEP,
                getMapPoint(event.clientX, event.clientY),
              );
            }}
            onPointerDown={handleMapPointerDown}
            onPointerMove={handleMapPointerMove}
            onPointerUp={endMapDrag}
            onPointerCancel={endMapDrag}
            onKeyDown={handleMapKeyDown}
          >
            <title id="map-title">Bản đồ tuyến miền Trung</title>
            <desc id="map-description">
              Đường biên Việt Nam từ dữ liệu Natural Earth được chiếu cùng sáu điểm tọa độ địa lý từ Huế đến Nha Trang và một xe đang di chuyển theo tiến độ.
            </desc>

            <defs>
              <linearGradient id="land-wash" x1="0" y1="0" x2="1" y2="1">
                <stop offset="0" stopColor="var(--map-land-top)" />
                <stop offset="1" stopColor="var(--map-land-bottom)" />
              </linearGradient>
              <filter id="land-shadow" x="-30%" y="-20%" width="160%" height="160%">
                <feDropShadow dx="0" dy="8" stdDeviation="10" floodColor="var(--map-shadow)" floodOpacity="0.22" />
              </filter>
            </defs>

            <g className="map-contours" aria-hidden="true">
              <path d="M34 154 C92 126 127 132 166 149" />
              <path d="M302 244 C350 226 402 231 451 267" />
              <path d="M294 471 C351 447 410 458 455 499" />
              <path d="M25 608 C79 577 121 582 155 605" />
            </g>

            <path
              className="vietnam-land"
              filter="url(#land-shadow)"
              fill="url(#land-wash)"
              d={vietnamMapGeometry.path}
            />

            <g className="archipelago-markers" aria-label="Vị trí địa lý của hai quần đảo">
              {vietnamMapGeometry.archipelagos.map((place) => (
                <g key={place.id} className="archipelago-marker">
                  <circle
                    className="archipelago-marker-ring"
                    cx={place.point.x}
                    cy={place.point.y}
                    r="6"
                  />
                  <circle
                    className="archipelago-marker-core"
                    cx={place.point.x}
                    cy={place.point.y}
                    r="2"
                  />
                  <text
                    className="archipelago-label"
                    x={place.label.x}
                    y={place.label.y}
                    textAnchor={place.label.anchor}
                  >
                    {place.name}
                  </text>
                </g>
              ))}
            </g>

            <polyline
              className="journey-route-base"
              points={routePointString}
              fill="none"
            />
            <polyline
              ref={traveledRouteRef}
              className="journey-route-traveled"
              points={routePointString}
              pathLength="1"
              strokeDasharray="1"
              strokeDashoffset="1"
              fill="none"
            />

            {centralRoute.stops.map((stop, index) => {
              const point = centralRoute.points[stop.pointIndex];
              const state = markerStates[index];
              const lineEndX =
                stop.label.anchor === "end" ? stop.label.x + 8 : stop.label.x - 8;

              return (
                <g key={stop.id} data-stop-id={stop.id} data-state={state}>
                  <line
                    className="stop-leader"
                    x1={point.x}
                    y1={point.y}
                    x2={lineEndX}
                    y2={stop.label.y - 4}
                  />
                  <g className="stop-marker" transform={`translate(${point.x} ${point.y})`}>
                    <circle className="stop-marker-ring" r="7.5" />
                    <circle className="stop-marker-core" r="2.75" />
                  </g>
                  <text
                    className="stop-label"
                    x={stop.label.x}
                    y={stop.label.y}
                    textAnchor={stop.label.anchor}
                  >
                    {stop.name}
                  </text>
                </g>
              );
            })}

            <g
              ref={vehicleRef}
              className="journey-vehicle"
              transform={`translate(${initialVehicle.x} ${initialVehicle.y}) rotate(${initialVehicle.angle})`}
              aria-hidden="true"
            >
              <ellipse className="vehicle-shadow" cx="0" cy="8" rx="22" ry="7" />
              <g transform="translate(-19 -12)">
                <rect className="vehicle-body" x="3" y="4" width="31" height="17" rx="5" />
                <path className="vehicle-cabin" d="M20 4 L25 -3 H33 L38 9 H20 Z" />
                <path className="vehicle-window" d="M24 3 L27 0 H32 L34 7 H23 Z" />
                <circle className="vehicle-wheel" cx="11" cy="22" r="5" />
                <circle className="vehicle-wheel" cx="31" cy="22" r="5" />
                <circle className="vehicle-hub" cx="11" cy="22" r="2" />
                <circle className="vehicle-hub" cx="31" cy="22" r="2" />
                <rect className="vehicle-light" x="35" y="11" width="4" height="5" rx="1" />
              </g>
            </g>
          </svg>

          <div className="map-zoom-panel">
            <div
              className="map-zoom-controls"
              role="group"
              aria-label="Điều khiển thu phóng bản đồ"
            >
              <button
                ref={zoomOutRef}
                id="map-zoom-out"
                type="button"
                aria-label="Thu nhỏ bản đồ"
                title="Thu nhỏ bản đồ"
                disabled
                onClick={() => setMapZoom(viewportRef.current.zoom / ZOOM_STEP)}
              >
                −
              </button>
              <button
                id="map-zoom-reset"
                type="button"
                aria-label="Hiển thị toàn bộ Việt Nam"
                title="Hiển thị toàn bộ Việt Nam"
                onClick={resetMapView}
              >
                <output ref={zoomOutputRef} aria-live="polite">1×</output>
              </button>
              <button
                ref={zoomInRef}
                id="map-zoom-in"
                type="button"
                aria-label="Phóng to bản đồ"
                title="Phóng to bản đồ"
                onClick={() => setMapZoom(viewportRef.current.zoom * ZOOM_STEP)}
              >
                +
              </button>
            </div>
            <span id="map-navigation-help" className="map-zoom-hint">
              Phóng to rồi kéo để xem từng vùng
            </span>
          </div>

          <div className="map-legend" aria-hidden="true">
            <span className="legend-line" />
            <span>Tuyến miền Trung</span>
          </div>
          <div className="coordinate-readout">
            <span>PROGRESS</span>
            <output ref={coordinateOutputRef}>
              x {initialVehicle.x.toFixed(1)}&nbsp; y {initialVehicle.y.toFixed(1)}&nbsp; góc {initialVehicle.angle.toFixed(0)}°
            </output>
          </div>
          <figcaption className="sr-only">
            Hình học bản đồ lấy từ Natural Earth 1:10m. Dùng các nút thu phóng, kéo khi đã phóng to, phím mũi tên để di chuyển và phím 0 để trở về toàn cảnh. Nhấn phím F để bật hoặc tắt chế độ toàn màn hình.
          </figcaption>
        </figure>

        <aside className="control-panel rounded-[var(--radius-panel)] border border-border bg-surface p-5 sm:p-6 lg:flex lg:min-h-[calc(100dvh-8rem)] lg:flex-col lg:p-7">
          <div>
            <h2 className="text-2xl font-extrabold tracking-[-0.03em] text-foreground">
              {centralRoute.name}
            </h2>
            <p className="mt-3 max-w-[38ch] text-sm leading-6 text-muted">
              Sáu điểm dừng, một cung đường từ Huế đến Nha Trang.
            </p>
          </div>

          <section aria-labelledby="progress-heading" className="mt-7">
            <div className="flex items-end justify-between gap-5">
              <div>
                <h3 id="progress-heading" className="text-sm font-semibold text-muted">
                  Tiến độ hành trình
                </h3>
                <output
                  ref={progressNumberRef}
                  htmlFor="journey-progress"
                  className="mt-1 block font-mono text-4xl font-bold tracking-[-0.06em] text-foreground"
                  aria-live="polite"
                >
                  0%
                </output>
              </div>
              <div className="pb-1 text-right text-sm leading-5">
                <p className="font-semibold text-foreground">
                  {isComplete ? "Đã đến Nha Trang" : currentStop.name}
                </p>
                <p className="text-muted">
                  {isComplete ? "Hoàn tất tuyến" : nextStop ? `Tiếp theo: ${nextStop.name}` : "Điểm cuối"}
                </p>
              </div>
            </div>

            <label className="sr-only" htmlFor="journey-progress">
              Tiến độ hành trình từ 0 đến 1
            </label>
            <input
              ref={progressInputRef}
              id="journey-progress"
              className="journey-slider mt-5 w-full"
              type="range"
              min="0"
              max="1"
              step="0.001"
              defaultValue="0"
              onInput={(event) => {
                setPlaying(false);
                updateVisual(Number(event.currentTarget.value));
              }}
            />

            <div className="mt-4 grid grid-cols-[1fr_auto] gap-3">
              <button
                id="journey-play-toggle"
                type="button"
                className="min-h-12 rounded-[var(--radius-control)] bg-action px-5 font-semibold text-accent-contrast transition-transform duration-200 hover:-translate-y-0.5 active:translate-y-px"
                onClick={handlePlayToggle}
              >
                {isPlaying ? "Tạm dừng" : isComplete ? "Chạy lại" : "Chạy thử"}
              </button>
              <button
                type="button"
                className="min-h-12 rounded-[var(--radius-control)] border border-border bg-surface-strong px-4 font-semibold text-foreground transition-transform duration-200 hover:-translate-y-0.5 active:translate-y-px"
                onClick={handleReset}
              >
                Đặt lại
              </button>
            </div>
          </section>

          <section aria-labelledby="stops-heading" className="mt-7 lg:mt-auto lg:pt-8">
            <h3 id="stops-heading" className="text-sm font-bold text-foreground">
              Các điểm dừng
            </h3>
            <ol className="route-board mt-3 grid grid-cols-2 gap-x-4 gap-y-2 p-0 sm:grid-cols-3 lg:grid-cols-2">
              {centralRoute.stops.map((stop, index) => (
                <li
                  key={stop.id}
                  data-state={markerStates[index]}
                  className="route-board-stop grid grid-cols-[1.7rem_1fr] items-center gap-2"
                >
                  <span className="route-stop-number font-mono text-xs font-bold">
                    {String(index + 1).padStart(2, "0")}
                  </span>
                  <span className="text-sm font-semibold">{stop.name}</span>
                </li>
              ))}
            </ol>
          </section>
        </aside>
      </div>
    </main>
  );
}
