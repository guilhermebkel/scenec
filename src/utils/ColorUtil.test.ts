import { ColorUtil } from "@/utils/ColorUtil.ts";
import { describe, expect, it } from "vitest";
describe("ColorUtil.sh()", () => {
  it("darkens halfway to black", () => {
    expect(ColorUtil.sh("#FF8040", -0.5)).toBe("#804020");
  });

  it("lightens halfway to white", () => {
    expect(ColorUtil.sh("#000000", 0.5)).toBe("#808080");
  });

  it("expands a three-digit color", () => {
    expect(ColorUtil.sh("#FFF", -0.5)).toBe("#808080");
  });

  it("returns a value that is not a hex color unchanged", () => {
    expect(ColorUtil.sh("rgba(0,0,0,0.2)", 0.5)).toBe("rgba(0,0,0,0.2)");
  });
});

describe("ColorUtil.luminance()", () => {
  it("is 1 for white, also in the three-digit form", () => {
    expect([ColorUtil.luminance("#FFFFFF"), ColorUtil.luminance("#FFF")]).toStrictEqual([1, 1]);
  });

  it("is 0 for black", () => {
    expect(ColorUtil.luminance("#000000")).toBe(0);
  });

  it("is 1 for a value that is not a hex color, so it never raises a false warning", () => {
    expect(ColorUtil.luminance("rgba(0,0,0,0.2)")).toBe(1);
  });
});

describe("ColorUtil.contrast()", () => {
  it("is 21 for black on white, whatever the order", () => {
    expect([ColorUtil.contrast("#000000", "#FFFFFF"), ColorUtil.contrast("#FFFFFF", "#000000")]).toStrictEqual([21, 21]);
  });

  it("is 1 for the same color", () => {
    expect(ColorUtil.contrast("#336699", "#336699")).toBe(1);
  });

  it("reads white as the three-digit background it is", () => {
    expect(ColorUtil.contrast("#126E86", "#FFF")).toBeCloseTo(5.8, 1);
  });
});
