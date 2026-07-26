import { fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import App from "./App";
import { VietnamJourneyMap } from "./components/VietnamJourneyMap";
import { hueProvince } from "./data/hueProvince";
import type { ProvinceJourney } from "./journey/types";

const demoJourney: ProvinceJourney = {
  id: "demo-journey",
  slug: "demo",
  name: "Hành trình thử nghiệm",
  shortName: "Demo",
  description: "Dữ liệu hành trình độc lập dùng để kiểm tra engine tổng quát.",
  center: [106, 11],
  route: {
    id: "demo-route",
    name: "Tuyến Demo",
    region: "Test",
    points: [
      { x: 100, y: 100 },
      { x: 140, y: 140 },
    ],
    geoPoints: [
      [106, 11],
      [106.1, 11.1],
    ],
    stops: [
      {
        id: "demo-place",
        name: "Điểm Demo",
        coordinates: [106.1, 11.1],
        pointIndex: 1,
        label: { x: 150, y: 150, anchor: "start" },
      },
    ],
  },
  places: [
    {
      id: "demo-place",
      name: "Điểm Demo",
      acceptedAnswers: ["Điểm Demo", "Demo"],
      coordinates: [106.1, 11.1],
      shortDescription: "Một địa điểm giả lập dành riêng cho kiểm thử.",
      image: {
        src: "https://example.com/demo.jpg",
        alt: "Ảnh kiểm thử",
        author: "Test",
        license: "Test",
        licenseUrl: "https://example.com/license",
        sourceUrl: "https://example.com/source",
      },
      contentSources: [
        { label: "Nguồn kiểm thử", url: "https://example.com/content" },
      ],
    },
  ],
};

beforeEach(() => {
  window.history.replaceState({}, "", "/");
  window.localStorage.clear();
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe("Hue tourism map prototype", () => {
  it("navigates from the national selector to Hue and back", () => {
    const { container } = render(<App />);

    expect(
      screen.getByRole("heading", { name: "Chọn hành trình" }),
    ).toBeInTheDocument();
    expect(screen.getByText("34 tỉnh, thành phố")).toBeInTheDocument();
    expect(JSON.parse(window.render_game_to_text!())).toMatchObject({
      mode: "province-select",
      totalProvinces: 34,
    });
    expect(
      container.querySelectorAll(".selector-province-shape"),
    ).toHaveLength(34);

    fireEvent.click(screen.getByRole("button", { name: /Bắt đầu/ }));
    expect(window.location.pathname).toBe("/hanh-trinh/hue");
    expect(
      screen.getByRole("heading", { name: "Tỉnh thí điểm: Huế" }),
    ).toBeInTheDocument();

    fireEvent.click(
      screen.getByRole("button", { name: "Trở về bản đồ hành trình" }),
    );
    expect(window.location.pathname).toBe("/ban-do");
    expect(
      screen.getByRole("heading", { name: "Chọn hành trình" }),
    ).toBeInTheDocument();
  });

  it("selects every province polygon while keeping unavailable journeys closed", () => {
    const { container } = render(<App />);
    const daNang = container.querySelector(
      '[data-province-code="48"]',
    ) as SVGPathElement;

    fireEvent.click(daNang);

    expect(daNang).toHaveAttribute("data-selected", "true");
    expect(
      screen.getByRole("heading", { name: "Hành trình Đà Nẵng" }),
    ).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Sắp mở" })).toBeDisabled();
    expect(JSON.parse(window.render_game_to_text!())).toMatchObject({
      selectedProvince: {
        code: "48",
        name: "Đà Nẵng",
        status: "coming-soon",
      },
    });
  });

  it("persists Hue completion after returning to the map and remounting", () => {
    window.history.replaceState({}, "", "/hanh-trinh/hue");
    const firstRender = render(<App />);
    const input = screen.getByLabelText("Gõ tên địa danh");

    for (const answer of [
      "dai noi",
      "thien mu",
      "ung lang",
      "minh mang",
      "vong canh",
    ]) {
      fireEvent.change(input, { target: { value: answer } });
    }

    expect(
      screen.getByRole("heading", { name: "Hoàn thành hành trình" }),
    ).toBeInTheDocument();
    fireEvent.click(
      screen.getByRole("button", { name: "Trở về bản đồ hành trình" }),
    );
    expect(
      firstRender.container.querySelector('[data-province-code="46"]'),
    ).toHaveAttribute("data-status", "completed");

    firstRender.unmount();
    window.history.replaceState({}, "", "/ban-do");
    const secondRender = render(<App />);
    expect(
      secondRender.container.querySelector('[data-province-code="46"]'),
    ).toHaveAttribute("data-status", "completed");
    expect(JSON.parse(window.render_game_to_text!())).toMatchObject({
      completedJourneys: ["hue-heritage-prototype"],
      selectedProvince: { code: "46", status: "completed" },
    });
  });

  it("runs a different province journey without changing the engine", () => {
    render(<VietnamJourneyMap journey={demoJourney} />);

    expect(
      screen.getByRole("heading", { name: "Tỉnh thí điểm: Demo" }),
    ).toBeInTheDocument();
    expect(screen.getByText("Hành trình thử nghiệm")).toBeInTheDocument();

    fireEvent.change(screen.getByLabelText("Gõ tên địa danh"), {
      target: { value: "demo" },
    });

    const state = JSON.parse(window.render_game_to_text!());
    expect(state.mode).toBe("completed");
    expect(state.journey).toMatchObject({
      id: "demo-journey",
      slug: "demo",
      province: "Demo",
    });
    expect(
      screen.getByText("Đã khám phá Demo"),
    ).toBeInTheDocument();
  });

  it("renders all five places and exposes the map state", () => {
    const { container } = render(
      <VietnamJourneyMap journey={hueProvince} />,
    );

    expect(
      screen.getByRole("heading", { name: "Tỉnh thí điểm: Huế" }),
    ).toBeInTheDocument();
    expect(container.querySelectorAll("[data-stop-id]")).toHaveLength(5);
    expect(
      container.querySelector('[data-stop-id="imperial-city-hue"]'),
    ).toHaveTextContent("Đại Nội Huế");
    expect(
      container.querySelector('[data-stop-id="vong-canh-hill"]'),
    ).toHaveTextContent(
      "Đồi Vọng Cảnh",
    );
    expect(window.render_game_to_text).toBeTypeOf("function");

    const state = JSON.parse(window.render_game_to_text!());
    expect(["svg-fallback", "mapbox-loading"]).toContain(state.mapRenderer);
    expect(state.journey).toMatchObject({
      id: "hue-heritage-prototype",
      slug: "hue",
      province: "Huế",
    });
    expect(state.progress).toBe(0);
    expect(state.stops).toHaveLength(5);
  });

  it("moves the route progress and reveals the visited place after a correct answer", () => {
    render(<VietnamJourneyMap journey={hueProvince} />);

    const typingInput = screen.getByLabelText("Gõ tên địa danh");
    fireEvent.change(typingInput, { target: { value: "x" } });
    let state = JSON.parse(window.render_game_to_text!());
    expect(state.progress).toBe(0);
    expect(state.game.incorrectInputs).toBe(1);

    fireEvent.change(typingInput, { target: { value: "dai noi" } });
    state = JSON.parse(window.render_game_to_text!());

    expect(state.progress).toBeCloseTo(9 / 55, 3);
    expect(state.currentStop).toBe("Chùa Thiên Mụ");
    expect(state.lastVisitedPlace).toBe("Đại Nội Huế");
    expect(state.game.correctInputs).toBe(9);
    expect(screen.getByRole("heading", { name: "Đại Nội Huế" })).toBeInTheDocument();
  });

  it("zooms the map and restores the full Vietnam view", () => {
    const { container } = render(
      <VietnamJourneyMap journey={hueProvince} />,
    );
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
