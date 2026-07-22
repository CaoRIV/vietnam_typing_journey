export type MapViewport = {
  x: number;
  y: number;
  width: number;
  height: number;
  zoom: number;
};

export type MapSize = {
  width: number;
  height: number;
};

export type MapPoint = {
  x: number;
  y: number;
};

export const MIN_MAP_ZOOM = 1;
export const MAX_MAP_ZOOM = 5;

const clamp = (value: number, minimum: number, maximum: number) =>
  Math.min(maximum, Math.max(minimum, value));

export function createInitialViewport(size: MapSize): MapViewport {
  return { x: 0, y: 0, width: size.width, height: size.height, zoom: 1 };
}

export function zoomViewport(
  size: MapSize,
  viewport: MapViewport,
  requestedZoom: number,
  focalPoint: MapPoint = {
    x: viewport.x + viewport.width / 2,
    y: viewport.y + viewport.height / 2,
  },
): MapViewport {
  const zoom = clamp(requestedZoom, MIN_MAP_ZOOM, MAX_MAP_ZOOM);
  const width = size.width / zoom;
  const height = size.height / zoom;
  const focalRatioX = clamp(
    (focalPoint.x - viewport.x) / viewport.width,
    0,
    1,
  );
  const focalRatioY = clamp(
    (focalPoint.y - viewport.y) / viewport.height,
    0,
    1,
  );

  return {
    x: clamp(focalPoint.x - width * focalRatioX, 0, size.width - width),
    y: clamp(focalPoint.y - height * focalRatioY, 0, size.height - height),
    width,
    height,
    zoom,
  };
}

export function panViewport(
  size: MapSize,
  viewport: MapViewport,
  delta: MapPoint,
): MapViewport {
  return {
    ...viewport,
    x: clamp(viewport.x + delta.x, 0, size.width - viewport.width),
    y: clamp(viewport.y + delta.y, 0, size.height - viewport.height),
  };
}

export function serializeViewport(viewport: MapViewport) {
  return [viewport.x, viewport.y, viewport.width, viewport.height]
    .map((value) => Number(value.toFixed(2)))
    .join(" ");
}
