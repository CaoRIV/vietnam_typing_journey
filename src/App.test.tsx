import { fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import App from "./App";

afterEach(() => {
  vi.restoreAllMocks();
});

describe("central route map prototype", () => {
  it("renders all six stops and exposes the map state", () => {
    const { container } = render(<App />);

    expect(
      screen.getByRole("heading", { name: "Tuyến miền Trung thử nghiệm" }),
    ).toBeInTheDocument();
    expect(container.querySelectorAll("[data-stop-id]")).toHaveLength(6);
    expect(container.querySelector('[data-stop-id="hue"]')).toHaveTextContent("Huế");
    expect(container.querySelector('[data-stop-id="nha-trang"]')).toHaveTextContent(
      "Nha Trang",
    );
    expect(window.render_game_to_text).toBeTypeOf("function");

    const state = JSON.parse(window.render_game_to_text!());
    expect(["svg-fallback", "mapbox-loading"]).toContain(state.mapRenderer);
    expect(state.progress).toBe(0);
    expect(state.stops).toHaveLength(6);
  });

  it("moves the route progress only when the answer is correct", () => {
    render(<App />);

    const typingInput = screen.getByLabelText("Gõ tên địa danh");
    fireEvent.change(typingInput, { target: { value: "x" } });
    let state = JSON.parse(window.render_game_to_text!());
    expect(state.progress).toBe(0);
    expect(state.game.incorrectInputs).toBe(1);

    fireEvent.change(typingInput, { target: { value: "hue" } });
    state = JSON.parse(window.render_game_to_text!());

    expect(state.progress).toBeCloseTo(3 / 33, 3);
    expect(state.currentStop).toBe("Hải Vân");
    expect(state.game.correctInputs).toBe(3);
  });

  it("zooms the map and restores the full Vietnam view", () => {
    const { container } = render(<App />);
    const map = container.querySelector("#journey-map-svg");

    fireEvent.click(screen.getByRole("button", { name: "Phóng to bản đồ" }));
    let state = JSON.parse(window.render_game_to_text!());

    expect(state.mapViewport.zoom).toBe(1.5);
    expect(map).toHaveAttribute("viewBox", "80 120 320 480");

    fireEvent.click(
      screen.getByRole("button", { name: "Hiển thị toàn bộ Việt Nam" }),
    );
    state = JSON.parse(window.render_game_to_text!());

    expect(state.mapViewport.zoom).toBe(1);
    expect(map).toHaveAttribute("viewBox", "0 0 480 720");
  });
});
