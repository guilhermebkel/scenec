import { describe, expect, it } from "vitest";
import { FramingService } from "@/Services/FramingService.ts";
import type { CompilationContext } from "@/Protocols/CompilationProtocol.ts";
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

const createMockContext = (framing?: "foliage" | "curtain" | "plants" | "none"): CompilationContext => ({
  canvas: { framing },
  kit: {},
  idToObject: {},
  library: {},
  failedAssets: new Set(),
  theme: MOCK_THEME,
  warnings: [],
  width: 1200,
  height: 630,
  setting: "outdoor",
  lines: { horizon: 0.6, depthToBase: { far: 0.65, mid: 0.75, near: 0.85 } },
  unit: 12,
});

describe("FramingService.render()", () => {
  it("returns empty svg when framing is none or unspecified", () => {
    const none = FramingService.render(createMockContext("none"), [], []);
    expect(none.svg).toBe("");
    expect(none.kind).toBe("none");

    const unspec = FramingService.render(createMockContext(), [], []);
    expect(unspec.svg).toBe("");
    expect(unspec.kind).toBe("none");
  });

  it("renders foliage silhouette in top corner", () => {
    const result = FramingService.render(createMockContext("foliage"), [], []);
    expect(result.svg).toContain("feGaussianBlur");
    expect(result.svg).toContain("frame-repoussoir");
    expect(result.kind).toBe("foliage");
  });

  it("renders curtain silhouette in corner", () => {
    const result = FramingService.render(createMockContext("curtain"), [], []);
    expect(result.svg).toContain("frame-repoussoir");
    expect(result.kind).toBe("curtain");
  });

  it("renders plants silhouette in bottom corner", () => {
    const result = FramingService.render(createMockContext("plants"), [], []);
    expect(result.svg).toContain("frame-repoussoir");
    expect(result.kind).toBe("plants");
  });
});
