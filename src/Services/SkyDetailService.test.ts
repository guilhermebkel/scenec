import { describe, expect, it } from "vitest";
import { SkyDetailService } from "@/Services/SkyDetailService.ts";
import type { Theme } from "@/Protocols/ThemeProtocol.ts";

const MOCK_THEME: Theme = {
  skyTop: "#1A4B75",
  skyBottom: "#87CEEB",
  ground: "#4B6B3C",
  groundDark: "#2D4424",
  wall: "#F0F0EE",
  floor: "#8B5A2B",
  wood: "#A0522D",
  woodDark: "#5C2E14",
  paper: "#FAFAFA",
  ink: "#222222",
  primary: "#D35400",
  secondary: "#2980B9",
  accent: "#F39C12",
  foliage: ["#336633", "#448844", "#55aa55"],
  trunk: "#8B5A2B",
  shadow: "rgba(0,0,0,0.2)",
  sea: "#2980B9",
  seaLight: "#5DADE2",
  metal: "#95A5A6",
  glass: "#AED6F1",
  text: "#222222",
  textOnDark: "#FFFFFF",
};

describe("SkyDetailService.skyGradientStops()", () => {
  it("generates 4 gradient stops with lighter, warmer band above horizon", () => {
    const stops = SkyDetailService.skyGradientStops(MOCK_THEME);
    const stopMatches = stops.match(/<stop/g) ?? [];
    expect(stopMatches).toHaveLength(4);
    expect(stops).toContain(`stop-color="${MOCK_THEME.skyTop}"`);
    expect(stops).toContain(`stop-color="${MOCK_THEME.skyBottom}"`);
  });
});

describe("SkyDetailService.ambientClouds()", () => {
  it("returns empty string when density is none or undefined", () => {
    expect(SkyDetailService.ambientClouds({
      density: "none",
      seed: 42,
      width: 1000,
      horizonY: 500,
      paperColor: "#FFF",
    })).toBe("");

    expect(SkyDetailService.ambientClouds({
      seed: 42,
      width: 1000,
      horizonY: 500,
      paperColor: "#FFF",
    })).toBe("");
  });

  it("draws clouds when density is few or many", () => {
    const few = SkyDetailService.ambientClouds({
      density: "few",
      seed: 12,
      width: 1200,
      horizonY: 450,
      paperColor: "#FFF",
    });
    expect(few).toContain("<g transform=");

    const many = SkyDetailService.ambientClouds({
      density: "many",
      seed: 12,
      width: 1200,
      horizonY: 450,
      paperColor: "#FFF",
    });
    expect(many).toContain("<g transform=");
  });

  it("omits clouds that collide with text rectangles", () => {
    const withText = SkyDetailService.ambientClouds({
      density: "many",
      seed: 5,
      width: 1200,
      horizonY: 450,
      paperColor: "#FFF",
      textRects: [{ x0: 0, y0: 0, x1: 1200, y1: 450, hasBox: true }],
    });
    expect(withText).toBe("");
  });
});
