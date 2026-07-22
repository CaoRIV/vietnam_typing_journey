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
    expect(state.progress).toBe(0);
    expect(state.stops).toHaveLength(6);
  });

  it("moves the route progress with the range control", () => {
    render(<App />);

    const progressControl = screen.getByLabelText("Tiến độ hành trình từ 0 đến 1");
    fireEvent.input(progressControl, { target: { value: "0.5" } });

    const state = JSON.parse(window.render_game_to_text!());
    expect(state.progress).toBe(0.5);
    expect(screen.getByText("50%")).toBeInTheDocument();
  });
});
