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

type MapboxJourneyMapProps = {
  accessToken: string;
  progress: number;
  stopStates: readonly MapStopState[];
  onReady: () => void;
  onError: (error: Error) => void;
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

function createVehicleElement() {
  const vehicle = document.createElement("div");
  vehicle.className = "mapbox-journey-vehicle";
  vehicle.setAttribute("aria-hidden", "true");

  const arrow = document.createElement("span");
  arrow.className = "mapbox-journey-vehicle-arrow";
  vehicle.append(arrow);
  return vehicle;
}

export function MapboxJourneyMap({
  accessToken,
  progress,
  stopStates,
  onReady,
  onError,
}: MapboxJourneyMapProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<mapboxgl.Map | null>(null);
  const vehicleRef = useRef<mapboxgl.Marker | null>(null);
  const progressRef = useRef(progress);
  const stopStatesRef = useRef(stopStates);
  const callbacksRef = useRef({ onReady, onError });
  useEffect(() => {
    progressRef.current = progress;
  }, [progress]);

  useEffect(() => {
    stopStatesRef.current = stopStates;
  }, [stopStates]);

  useEffect(() => {
    callbacksRef.current = { onReady, onError };
  }, [onError, onReady]);

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

      const handleError = (event: mapboxgl.ErrorEvent) => {
        if (disposed) return;
        const error =
          event.error instanceof Error
            ? event.error
            : new Error("Mapbox could not load the map style or tiles.");
        callbacksRef.current.onError(error);
      };

      map.on("error", handleError);
      map.once("load", () => {
        if (disposed) return;
        const currentProgress = progressRef.current;
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
          maxZoom: 7.3,
          duration: 0,
        });
        callbacksRef.current.onReady();
      });

      return () => {
        disposed = true;
        map.off("error", handleError);
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
    const position = getGeoRoutePosition(
      centralRoute.points,
      centralRoute.geoPoints,
      progress,
    );
    const traveledSource = map.getSource("journey-traveled-route");
    if (hasSetData(traveledSource)) {
      traveledSource.setData(
        createLineFeature(
          getTraveledGeoCoordinates(
            centralRoute.points,
            centralRoute.geoPoints,
            progress,
          ),
        ),
      );
    }
    vehicleRef.current
      ?.setLngLat(toLngLat(position.coordinates))
      .setRotation(position.bearing);
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
      aria-label="Bản đồ tương tác Mapbox của hành trình miền Trung"
    />
  );
}
