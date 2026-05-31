import { describe, expect, it } from "vitest";
import { computeCoverCrop } from "./image-resize";

describe("computeCoverCrop", () => {
  it("crops the sides of a landscape image to a square", () => {
    const c = computeCoverCrop(200, 100);
    expect(c).toEqual({ sx: 50, sy: 0, size: 100 });
  });

  it("crops the top/bottom of a portrait image to a square", () => {
    const c = computeCoverCrop(100, 200);
    expect(c).toEqual({ sx: 0, sy: 50, size: 100 });
  });

  it("returns the whole image when already square", () => {
    const c = computeCoverCrop(120, 120);
    expect(c).toEqual({ sx: 0, sy: 0, size: 120 });
  });
});
