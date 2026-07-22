import { describe, expect, it } from "vitest";

import {
  createInitialViewport,
  panViewport,
  serializeViewport,
  zoomViewport,
} from "./mapViewport";

const mapSize = { width: 480, height: 720 };

describe("map viewport", () => {
  it("zooms around a focal point and returns to the full map", () => {
    const initial = createInitialViewport(mapSize);
    const zoomed = zoomViewport(mapSize, initial, 2, { x: 240, y: 360 });

    expect(zoomed).toEqual({ x: 120, y: 180, width: 240, height: 360, zoom: 2 });
    expect(zoomViewport(mapSize, zoomed, 1)).toEqual(initial);
  });

  it("clamps zoom and panning to the map bounds", () => {
    const initial = createInitialViewport(mapSize);
    const zoomed = zoomViewport(mapSize, initial, 99, { x: 480, y: 720 });
    const panned = panViewport(mapSize, zoomed, { x: 999, y: -999 });

    expect(zoomed.zoom).toBe(5);
    expect(panned.x).toBe(mapSize.width - zoomed.width);
    expect(panned.y).toBe(0);
    expect(serializeViewport(panned)).toBe("384 0 96 144");
  });
});
