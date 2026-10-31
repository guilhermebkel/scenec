import { ColorUtil } from "@/Utils/ColorUtil.ts";
import { OklabUtil } from "@/Utils/OklabUtil.ts";
import { describe, expect, it } from "vitest";

describe("ColorUtil.sh()", () => {
  it("rotates hue toward cool for negative amounts", () => {
    const original = "#4E9E5C";
    const shaded = ColorUtil.sh(original, -0.4);
    const [, , originalHue] = OklabUtil.labToLch(OklabUtil.fromRgb(...OklabUtil.rgbOfHex(original)));
    const [, , shadedHue] = OklabUtil.labToLch(OklabUtil.fromRgb(...OklabUtil.rgbOfHex(shaded)));
    // Why: shadow hue pulls toward cool blue-violet (~4.6 rad), so green (~2.4 rad) increases toward 4.6.
    expect(shadedHue).toBeGreaterThan(originalHue);
  });

  it("rotates hue toward warm for positive amounts", () => {
    const original = "#4E9E5C";
    const lighted = ColorUtil.sh(original, 0.4);
    const [, , originalHue] = OklabUtil.labToLch(OklabUtil.fromRgb(...OklabUtil.rgbOfHex(original)));
    const [, , lightedHue] = OklabUtil.labToLch(OklabUtil.fromRgb(...OklabUtil.rgbOfHex(lighted)));
    // Why: light hue pulls toward warm yellow (~1.4 rad), so green (~2.4 rad) decreases toward 1.4.
    expect(lightedHue).toBeLessThan(originalHue);
  });

  it("keeps neutral greys strictly neutral without hue cast", () => {
    const grey = "#808080";
    const darkGrey = ColorUtil.sh(grey, -0.4);
    const lightGrey = ColorUtil.sh(grey, 0.4);
    const [darkR, darkG, darkB] = OklabUtil.rgbOfHex(darkGrey);
    const [lightR, lightG, lightB] = OklabUtil.rgbOfHex(lightGrey);
    expect(darkR).toBe(darkG);
    expect(darkG).toBe(darkB);
    expect(lightR).toBe(lightG);
    expect(lightG).toBe(lightB);
  });

  it("always returns a valid 6-digit hex", () => {
    expect(ColorUtil.sh("#FF8040", -0.5)).toMatch(/^#[0-9A-F]{6}$/);
    expect(ColorUtil.sh("#FF8040", 0.5)).toMatch(/^#[0-9A-F]{6}$/);
  });

  it("expands a three-digit color", () => {
    const shaded = ColorUtil.sh("#FFF", -0.5);
    expect(shaded).toMatch(/^#[0-9A-F]{6}$/);
    const [red, green, blue] = OklabUtil.rgbOfHex(shaded);
    expect(red).toBe(green);
    expect(green).toBe(blue);
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
