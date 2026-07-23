import { describe, expect, it } from "vitest";

import { normalizeVietnameseAnswer } from "./normalize";

describe("normalizeVietnameseAnswer", () => {
  it.each([
    ["Đà Nẵng", "danang"],
    ["đà nẵng", "danang"],
    ["DA-NANG", "danang"],
    ["  Hội   An ", "hoian"],
    ["Mỹ Sơn", "myson"],
  ])("normalizes %s to %s", (input, expected) => {
    expect(normalizeVietnameseAnswer(input)).toBe(expected);
  });
});
