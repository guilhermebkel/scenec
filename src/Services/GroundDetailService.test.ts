import { describe, expect, it } from "vitest";
import { GroundDetailService } from "@/Services/GroundDetailService.ts";
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

describe("GroundDetailService.groundGradientDef()", () => {
  it("generates vertical ground gradient with far and near stops", () => {
    const def = GroundDetailService.groundGradientDef(MOCK_THEME);
    expect(def).toContain(`id="ground"`);
    expect(def).toContain("<stop offset=\"0\"");
    expect(def).toContain("<stop offset=\"1\"");
  });
});

describe("GroundDetailService.draw()", () => {
  it("returns empty string when detail is none", () => {
    const svg = GroundDetailService.draw({
      detail: "none",
      seed: 42,
      width: 1200,
      height: 630,
      horizonY: 380,
      theme: MOCK_THEME,
    });
    expect(svg).toBe("");
  });

  it("draws blobs and tufts when detail is low or high", () => {
    const low = GroundDetailService.draw({
      detail: "low",
      seed: 42,
      width: 1200,
      height: 630,
      horizonY: 380,
      theme: MOCK_THEME,
    });
    expect(low).toContain("<ellipse");
    expect(low).toContain("<path d=\"M -5 0");

    const high = GroundDetailService.draw({
      detail: "high",
      seed: 42,
      width: 1200,
      height: 630,
      horizonY: 380,
      theme: MOCK_THEME,
    });
    expect(high).toContain("<ellipse");
    expect(high.length).toBeGreaterThan(low.length);
  });

  it("avoids placing tufts near object feet", () => {
    const withoutCollision = GroundDetailService.draw({
      detail: "high",
      seed: 7,
      width: 1000,
      height: 500,
      horizonY: 250,
      theme: MOCK_THEME,
      placements: [],
    });

    const withBlockingPlacement = GroundDetailService.draw({
      detail: "high",
      seed: 7,
      width: 1000,
      height: 500,
      horizonY: 250,
      theme: MOCK_THEME,
      placements: [
        {
          id: "box",
          asset: "crate",
          kind: "ground",
          x: 500,
          y: 350,
          scale: 1,
          width: 800,
          height: 100,
          z: 10,
          depth: "mid",
          svg: "",
          bodySvg: "",
          surfaceTop: undefined,
          hasHaze: false,
          isBackdrop: false,
          isHollow: false,
          hand: undefined,
          boxLeft: 100,
          boxRight: 900,
          boxTop: 300,
          boxBottom: 400,
          related: [],
          isOffView: false,
          isFocus: false,
        },
      ],
    });

    expect(withBlockingPlacement.length).toBeLessThan(withoutCollision.length);
  });
});
