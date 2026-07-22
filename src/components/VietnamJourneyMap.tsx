import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

import { centralRoute } from "../data/centralRoute";
import {
  getPointAtProgress,
  getProgressAtPointIndex,
} from "../lib/routeGeometry";

const PLAYBACK_DURATION_MS = 8_000;

const routePointString = centralRoute.points
  .map(({ x, y }) => `${x},${y}`)
  .join(" ");

const stopProgressValues = centralRoute.stops.map((stop) =>
  getProgressAtPointIndex(centralRoute.points, stop.pointIndex),
);

function getActiveStopIndex(progress: number) {
  let activeIndex = 0;
  stopProgressValues.forEach((stopProgress, index) => {
    if (progress + 0.0001 >= stopProgress) activeIndex = index;
  });
  return activeIndex;
}

export function VietnamJourneyMap() {
  const mapStageRef = useRef<HTMLElement>(null);
  const vehicleRef = useRef<SVGGElement>(null);
  const traveledRouteRef = useRef<SVGPolylineElement>(null);
  const progressInputRef = useRef<HTMLInputElement>(null);
  const progressNumberRef = useRef<HTMLOutputElement>(null);
  const coordinateOutputRef = useRef<HTMLOutputElement>(null);
  const progressRef = useRef(0);
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
  }, [updateVisual]);

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
        coordinateSystem: "SVG viewBox 0 0 480 720; origin top-left; x right; y down",
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

    return () => {
      delete window.render_game_to_text;
      delete window.setJourneyProgress;
      delete window.advanceTime;
    };
  }, [advanceProgress, setPlaying, updateVisual]);

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
            id="journey-map-svg"
            className="absolute inset-0 h-full w-full"
            viewBox="0 0 480 720"
            role="img"
            aria-labelledby="map-title map-description"
            preserveAspectRatio="xMidYMid meet"
          >
            <title id="map-title">Bản đồ tuyến miền Trung</title>
            <desc id="map-description">
              Bản đồ Việt Nam cách điệu với sáu điểm từ Huế đến Nha Trang và một xe đang di chuyển theo tiến độ.
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
              d="M194 48 C169 34 136 42 117 61 C93 84 100 108 126 126 C146 140 157 157 154 181 C151 205 164 226 180 242 C190 253 190 272 181 291 C171 310 170 331 178 351 C184 368 184 389 178 409 C173 432 181 456 197 480 C210 500 218 522 225 548 C231 572 247 590 270 607 C293 624 306 647 299 674 C292 699 266 708 238 697 C218 689 199 689 181 700 C155 716 125 705 112 681 C99 657 114 633 139 623 C158 616 169 599 166 575 C162 546 151 519 138 494 C124 467 119 438 126 409 C131 384 128 358 118 334 C109 311 114 288 129 269 C143 251 149 231 139 212 C126 190 117 171 119 151 C120 135 108 122 88 113 C64 102 57 77 70 56 C85 32 112 20 143 23 C163 25 181 34 194 48 Z"
            />

            <g className="map-islands" aria-hidden="true">
              <circle cx="324" cy="310" r="4" />
              <circle cx="348" cy="332" r="2.5" />
              <circle cx="337" cy="532" r="3" />
              <circle cx="363" cy="557" r="2" />
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
                    <circle className="stop-marker-ring" r="10" />
                    <circle className="stop-marker-core" r="3.75" />
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
              transform="translate(178 300) rotate(92)"
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

          <div className="map-legend" aria-hidden="true">
            <span className="legend-line" />
            <span>Tuyến miền Trung</span>
          </div>
          <div className="coordinate-readout">
            <span>PROGRESS</span>
            <output ref={coordinateOutputRef}>x 178.0&nbsp; y 300.0&nbsp; góc 92°</output>
          </div>
          <figcaption className="sr-only">
            Nhấn phím F để bật hoặc tắt chế độ toàn màn hình cho bản đồ.
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
