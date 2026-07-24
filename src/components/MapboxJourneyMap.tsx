import { useEffect, useRef } from "react";
import * as mapboxgl from "mapbox-gl/esm";
import type { ExpressionSpecification } from "mapbox-gl";
import "mapbox-gl/dist/mapbox-gl.css";

import {
  centralRoute,
  type GeoCoordinates,
} from "../data/centralRoute";
import {
  getGeoRoutePosition,
  getTraveledGeoCoordinates,
} from "../lib/mapboxRoute";

export type MapStopState = "completed" | "current" | "upcoming";

export type MapboxCameraState = {
  longitude: number;
  latitude: number;
  zoom: number;
};

type MapboxJourneyMapProps = {
  accessToken: string;
  progress: number;
  stopStates: readonly MapStopState[];
  onReady: () => void;
  onError: (error: Error) => void;
  onVisualProgressChange: (progress: number) => void;
  onCameraChange: (camera: MapboxCameraState) => void;
};

type MutableGeoJsonSource = {
  setData: (data: ReturnType<typeof createLineFeature> | ReturnType<typeof createStopCollection>) => void;
};

const hasSetData = (source: unknown): source is MutableGeoJsonSource =>
  typeof source === "object" &&
  source !== null &&
  "setData" in source &&
  typeof (source as { setData?: unknown }).setData === "function";

const firstRouteCoordinate = centralRoute.geoPoints[0] ?? [108, 16];
const toLngLat = ([longitude, latitude]: GeoCoordinates): [number, number] => [
  longitude,
  latitude,
];
const initialPosition = getGeoRoutePosition(
  centralRoute.points,
  centralRoute.geoPoints,
  0,
);
const routeBounds = centralRoute.geoPoints.reduce(
  (bounds, coordinates) => bounds.extend(toLngLat(coordinates)),
  new mapboxgl.LngLatBounds(
    toLngLat(firstRouteCoordinate),
    toLngLat(firstRouteCoordinate),
  ),
);

const createLineFeature = (coordinates: readonly GeoCoordinates[]) => ({
  type: "Feature" as const,
  properties: {},
  geometry: {
    type: "LineString" as const,
    coordinates: coordinates.map(([longitude, latitude]) => [
      longitude,
      latitude,
    ]),
  },
});

const createStopCollection = (stopStates: readonly MapStopState[]) => ({
  type: "FeatureCollection" as const,
  features: centralRoute.stops.map((stop, index) => ({
    type: "Feature" as const,
    properties: {
      id: stop.id,
      name: stop.name,
      state: stopStates[index] ?? "upcoming",
    },
    geometry: {
      type: "Point" as const,
      coordinates: [...stop.coordinates],
    },
  })),
});

const stopColorExpression: ExpressionSpecification = [
  "match",
  ["get", "state"],
  "completed",
  "#0c4a3b",
  "current",
  "#f2665f",
  "#fffaf0",
];

const stopStrokeExpression: ExpressionSpecification = [
  "match",
  ["get", "state"],
  "upcoming",
  "#5f6c68",
  "#ffffff",
];

const VEHICLE_ANIMATION_MS = 760;
const CAMERA_LOOK_AHEAD = 0.035;

const smoothStep = (progress: number) =>
  progress * progress * (3 - 2 * progress);

function createVehicleElement() {
  const vehicle = document.createElement("div");
  vehicle.className = "mapbox-journey-vehicle";
  vehicle.setAttribute("aria-hidden", "true");

  const svgNamespace = "http://www.w3.org/2000/svg";
  const icon = document.createElementNS(svgNamespace, "svg");
  icon.classList.add("mapbox-journey-motorbike");
  icon.setAttribute("viewBox", "0 0 44 58");
  icon.setAttribute("focusable", "false");

  const shadow = document.createElementNS(svgNamespace, "ellipse");
  shadow.classList.add("motorbike-shadow");
  shadow.setAttribute("cx", "22");
  shadow.setAttribute("cy", "31");
  shadow.setAttribute("rx", "11");
  shadow.setAttribute("ry", "22");

  const rearWheel = document.createElementNS(svgNamespace, "rect");
  rearWheel.classList.add("motorbike-wheel");
  rearWheel.setAttribute("x", "18.5");
  rearWheel.setAttribute("y", "42");
  rearWheel.setAttribute("width", "7");
  rearWheel.setAttribute("height", "13");
  rearWheel.setAttribute("rx", "3.5");

  const frontWheel = rearWheel.cloneNode() as SVGRectElement;
  frontWheel.setAttribute("y", "3");
  frontWheel.setAttribute("height", "12");

  const body = document.createElementNS(svgNamespace, "path");
  body.classList.add("motorbike-body");
  body.setAttribute(
    "d",
    "M22 11 C28 11 31 16 30 22 L27 39 C26.4 44 17.6 44 17 39 L14 22 C13 16 16 11 22 11 Z",
  );

  const seat = document.createElementNS(svgNamespace, "rect");
  seat.classList.add("motorbike-seat");
  seat.setAttribute("x", "17");
  seat.setAttribute("y", "27");
  seat.setAttribute("width", "10");
  seat.setAttribute("height", "15");
  seat.setAttribute("rx", "5");

  const handlebar = document.createElementNS(svgNamespace, "path");
  handlebar.classList.add("motorbike-handlebar");
  handlebar.setAttribute("d", "M10 17 Q22 12 34 17");

  const rider = document.createElementNS(svgNamespace, "circle");
  rider.classList.add("motorbike-rider");
  rider.setAttribute("cx", "22");
  rider.setAttribute("cy", "24");
  rider.setAttribute("r", "5");

  const light = document.createElementNS(svgNamespace, "circle");
  light.classList.add("motorbike-light");
  light.setAttribute("cx", "22");
  light.setAttribute("cy", "13");
  light.setAttribute("r", "2.4");

  icon.append(
    shadow,
    rearWheel,
    frontWheel,
    handlebar,
    body,
    seat,
    rider,
    light,
  );
  vehicle.append(icon);
  return vehicle;
}

export function MapboxJourneyMap({
  accessToken,
  progress,
  stopStates,
  onReady,
  onError,
  onVisualProgressChange,
  onCameraChange,
}: MapboxJourneyMapProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<mapboxgl.Map | null>(null);
  const vehicleRef = useRef<mapboxgl.Marker | null>(null);
  const animationFrameRef = useRef<number | null>(null);
  const displayedProgressRef = useRef(progress);
  const progressRef = useRef(progress);
  const stopStatesRef = useRef(stopStates);
  const callbacksRef = useRef({
    onReady,
    onError,
    onVisualProgressChange,
    onCameraChange,
  });
  useEffect(() => {
    progressRef.current = progress;
  }, [progress]);

  useEffect(() => {
    stopStatesRef.current = stopStates;
  }, [stopStates]);

  useEffect(() => {
    callbacksRef.current = {
      onReady,
      onError,
      onVisualProgressChange,
      onCameraChange,
    };
  }, [onCameraChange, onError, onReady, onVisualProgressChange]);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;
    if (!mapboxgl.supported()) {
      callbacksRef.current.onError(
        new Error("This browser does not support the WebGL features Mapbox needs."),
      );
      return;
    }

    let disposed = false;
    try {
      const map = new mapboxgl.Map({
        accessToken,
        container,
        style: "mapbox://styles/mapbox/streets-v12",
        center: toLngLat(initialPosition.coordinates),
        zoom: 5.4,
        minZoom: 4,
        maxZoom: 17,
        attributionControl: false,
        cooperativeGestures: true,
      });
      mapRef.current = map;
      map.addControl(
        new mapboxgl.NavigationControl({ showCompass: false }),
        "top-right",
      );
      map.addControl(new mapboxgl.AttributionControl({ compact: true }));

      const publishCamera = () => {
        const center = map.getCenter();
        callbacksRef.current.onCameraChange({
          longitude: center.lng,
          latitude: center.lat,
          zoom: map.getZoom(),
        });
      };

      const handleError = (event: mapboxgl.ErrorEvent) => {
        if (disposed) return;
        const error =
          event.error instanceof Error
            ? event.error
            : new Error("Mapbox could not load the map style or tiles.");
        callbacksRef.current.onError(error);
      };

      map.on("error", handleError);
      map.on("move", publishCamera);
      map.once("load", () => {
        if (disposed) return;
        const currentProgress = progressRef.current;
        displayedProgressRef.current = currentProgress;
        const position = getGeoRoutePosition(
          centralRoute.points,
          centralRoute.geoPoints,
          currentProgress,
        );

        map.addSource("journey-route", {
          type: "geojson",
          data: createLineFeature(centralRoute.geoPoints),
        });
        map.addSource("journey-traveled-route", {
          type: "geojson",
          data: createLineFeature(
            getTraveledGeoCoordinates(
              centralRoute.points,
              centralRoute.geoPoints,
              currentProgress,
            ),
          ),
        });
        map.addSource("journey-stops", {
          type: "geojson",
          data: createStopCollection(stopStatesRef.current),
        });

        map.addLayer({
          id: "journey-route-shadow",
          type: "line",
          source: "journey-route",
          paint: {
            "line-color": "rgba(21, 60, 46, 0.2)",
            "line-width": 8,
            "line-blur": 1.5,
          },
        });
        map.addLayer({
          id: "journey-route-line",
          type: "line",
          source: "journey-route",
          paint: {
            "line-color": "#fffaf0",
            "line-width": 4,
            "line-opacity": 0.95,
          },
        });
        map.addLayer({
          id: "journey-traveled-line",
          type: "line",
          source: "journey-traveled-route",
          paint: {
            "line-color": "#e3483e",
            "line-width": 5,
          },
        });
        map.addLayer({
          id: "journey-stop-circles",
          type: "circle",
          source: "journey-stops",
          paint: {
            "circle-radius": 7,
            "circle-color": stopColorExpression,
            "circle-stroke-color": stopStrokeExpression,
            "circle-stroke-width": 2.5,
          },
        });
        map.addLayer({
          id: "journey-stop-labels",
          type: "symbol",
          source: "journey-stops",
          layout: {
            "text-field": ["get", "name"],
            "text-font": ["DIN Pro Medium", "Arial Unicode MS Regular"],
            "text-size": 13,
            "text-offset": [0, 1.35],
            "text-anchor": "top",
            "text-allow-overlap": false,
          },
          paint: {
            "text-color": "#153c2e",
            "text-halo-color": "rgba(255, 250, 240, 0.96)",
            "text-halo-width": 1.5,
          },
        });

        vehicleRef.current = new mapboxgl.Marker({
          element: createVehicleElement(),
          anchor: "center",
          rotation: position.bearing,
          rotationAlignment: "map",
        })
          .setLngLat(toLngLat(position.coordinates))
          .addTo(map);

        map.fitBounds(routeBounds, {
          padding: { top: 72, right: 68, bottom: 72, left: 68 },
          maxZoom: 12.5,
          duration: 0,
        });
        callbacksRef.current.onVisualProgressChange(currentProgress);
        publishCamera();
        callbacksRef.current.onReady();
      });

      return () => {
        disposed = true;
        if (animationFrameRef.current !== null) {
          window.cancelAnimationFrame(animationFrameRef.current);
          animationFrameRef.current = null;
        }
        map.off("error", handleError);
        map.off("move", publishCamera);
        vehicleRef.current?.remove();
        vehicleRef.current = null;
        mapRef.current = null;
        map.remove();
        container.replaceChildren();
      };
    } catch (error) {
      callbacksRef.current.onError(
        error instanceof Error ? error : new Error("Mapbox initialization failed."),
      );
    }
  }, [accessToken]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map?.isStyleLoaded()) return;
    if (animationFrameRef.current !== null) {
      window.cancelAnimationFrame(animationFrameRef.current);
    }

    const targetProgress = Math.min(1, Math.max(0, progress));
    const startProgress = displayedProgressRef.current;
    const reducedMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;
    const duration =
      reducedMotion || Math.abs(targetProgress - startProgress) < 0.00001
        ? 0
        : VEHICLE_ANIMATION_MS;
    const startedAt = performance.now();

    const lookAheadProgress = Math.min(
      1,
      targetProgress + CAMERA_LOOK_AHEAD,
    );
    const lookAheadPosition = getGeoRoutePosition(
      centralRoute.points,
      centralRoute.geoPoints,
      lookAheadProgress,
    );
    map.easeTo({
      center: toLngLat(lookAheadPosition.coordinates),
      duration,
      easing: smoothStep,
      essential: true,
    });

    const renderFrame = (now: number) => {
      const timeProgress =
        duration === 0 ? 1 : Math.min(1, (now - startedAt) / duration);
      const easedProgress = smoothStep(timeProgress);
      const visualProgress =
        startProgress + (targetProgress - startProgress) * easedProgress;
      const position = getGeoRoutePosition(
        centralRoute.points,
        centralRoute.geoPoints,
        visualProgress,
      );
      const traveledSource = map.getSource("journey-traveled-route");
      if (hasSetData(traveledSource)) {
        traveledSource.setData(
          createLineFeature(
            getTraveledGeoCoordinates(
              centralRoute.points,
              centralRoute.geoPoints,
              visualProgress,
            ),
          ),
        );
      }
      vehicleRef.current
        ?.setLngLat(toLngLat(position.coordinates))
        .setRotation(position.bearing);
      displayedProgressRef.current = visualProgress;
      callbacksRef.current.onVisualProgressChange(visualProgress);

      if (timeProgress < 1) {
        animationFrameRef.current = window.requestAnimationFrame(renderFrame);
      } else {
        animationFrameRef.current = null;
      }
    };

    animationFrameRef.current = window.requestAnimationFrame(renderFrame);

    return () => {
      if (animationFrameRef.current !== null) {
        window.cancelAnimationFrame(animationFrameRef.current);
        animationFrameRef.current = null;
      }
    };
  }, [progress]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map?.isStyleLoaded()) return;
    const stopSource = map.getSource("journey-stops");
    if (hasSetData(stopSource)) {
      stopSource.setData(createStopCollection(stopStates));
    }
  }, [stopStates]);

  return (
    <div
      ref={containerRef}
      id="journey-mapbox-map"
      className="mapbox-map absolute inset-0 z-[1]"
      role="region"
      aria-label="Bản đồ tương tác Mapbox của hành trình di sản Huế"
    />
  );
}
