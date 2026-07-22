import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import App from "./App";

describe("App", () => {
  it("shows the initialized Vite foundation", () => {
    render(<App />);

    expect(
      screen.getByRole("heading", { name: "Nền tảng đã sẵn sàng." }),
    ).toBeInTheDocument();
    expect(screen.getByText("Vite + React + TypeScript")).toBeInTheDocument();
  });
});
