import { describe, expect, it } from "vitest";
import { PlaneModule } from "@/Modules/PlaneModule.ts";
import type { Scene } from "@/Protocols/SceneProtocol.ts";
import { AssetService } from "@/Services/AssetService.ts";
import { ThemeService } from "@/Services/ThemeService.ts";

const THEME = ThemeService.THEME_ID_TO_THEME["flat-cool"];

function compile(scene: Scene): { svg: string; warnings: string[]; description: string } {
  const warnings: string[] = [];
  const input = { library: AssetService.ASSET_ID_TO_ASSET, theme: THEME, warnings, width: 1000, height: 700 };
  const result = PlaneModule.compilePlane(scene, input);
  return { svg: result.svg, warnings: result.warnings, description: result.description };
}

const JOURNEY: Scene = {
  canvas: { mode: "2.5d" },
  path: {
    width: 0.08,
    points: [
      { id: "start", at: [0.2, 0.2], label: "Start", zone: "school" },
      { id: "end", at: [0.7, 0.8], label: "End", finish: true },
    ],
  },
  objects: { walker: { asset: "person", near: "start" }, oak: { asset: "tree", near: "end" } },
};

describe("PlaneModule.compilePlane()", () => {
  it("draws the road, the numbered labels and the objects in one svg", () => {
    const { svg } = compile(JOURNEY);

    expect(svg.startsWith("<svg")).toBe(true);
    expect(svg).toContain(">Start</text>");
    expect(svg).toContain(">End</text>");
    expect(svg).toContain("★");
  });

  it("is deterministic: the same scene gives the same svg", () => {
    expect(compile(JOURNEY).svg).toStrictEqual(compile(JOURNEY).svg);
  });

  it("warns when an object points to a path point that does not exist", () => {
    const scene: Scene = { ...JOURNEY, objects: { walker: { asset: "person", near: "nowhere" } } };

    expect(compile(scene).warnings.join("\n")).toContain("nowhere");
  });

  it("warns when an object lies outside the frame", () => {
    const scene: Scene = { ...JOURNEY, objects: { walker: { asset: "person", at: [3, 0.5] } } };

    expect(compile(scene).warnings.some((warning) => warning.includes("outside the frame"))).toBe(true);
  });

  it("draws a scene without a path", () => {
    const { svg } = compile({ canvas: { mode: "2.5d" }, objects: { oak: { asset: "tree", at: [0.5, 0.5] } } });

    expect(svg.startsWith("<svg")).toBe(true);
  });
});
