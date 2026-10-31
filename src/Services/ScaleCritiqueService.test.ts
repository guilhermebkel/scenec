import { describe, expect, it } from "vitest";
import type { CritiqueInput, CritiqueObject } from "@/Protocols/CompilationProtocol.ts";
import type { SettingName } from "@/Protocols/SceneProtocol.ts";
import type { Theme } from "@/Protocols/ThemeProtocol.ts";
import { ScaleCritiqueService } from "@/Services/ScaleCritiqueService.ts";

function createObject(id: string, height: number, depth?: "near" | "mid" | "far"): CritiqueObject {
  return {
    id,
    asset: "tree",
    kind: "ground",
    z: 0,
    body: `<rect width="100" height="${height}"/>`,
    related: [],
    isIgnored: false,
    height,
    depth: depth ?? "mid",
  };
}

function createInput(objects: CritiqueObject[], setting: SettingName = "outdoor"): CritiqueInput {
  return {
    width: 1000,
    height: 1000,
    head: "<svg>",
    bg: "<rect/>",
    scene: "<svg/>",
    theme: { paper: "#FFF", ink: "#000" } as Theme,
    scale: 1,
    textRects: [],
    skip: [],
    setting,
    objects,
  };
}

describe("ScaleCritiqueService.critique()", () => {
  it("warns when three objects have similar sizes", () => {
    const objects = [
      createObject("first", 100),
      createObject("second", 110),
      createObject("third", 120),
    ];
    const messages = ScaleCritiqueService.critique(createInput(objects, "indoor"));

    expect(messages).toContain("objects have similar sizes; make the focus larger or add a small object for scale");
  });

  it("passes when objects have distinct scale hierarchy", () => {
    const objects = [
      createObject("small", 60),
      createObject("medium", 120),
      createObject("large", 200),
    ];
    const messages = ScaleCritiqueService.critique(createInput(objects, "indoor"));

    expect(messages).toStrictEqual([]);
  });

  it("warns when all outdoor objects share a single depth layer", () => {
    const objects = [
      createObject("first", 50, "far"),
      createObject("second", 100, "far"),
      createObject("third", 150, "far"),
      createObject("fourth", 200, "far"),
    ];
    const messages = ScaleCritiqueService.critique(createInput(objects, "outdoor"));

    expect(messages).toContain("everything is at depth 'far'; move something to 'near' or 'mid'");
  });

  it("passes when outdoor objects are distributed across different depth layers", () => {
    const objects = [
      createObject("first", 50, "far"),
      createObject("second", 100, "mid"),
      createObject("third", 150, "near"),
      createObject("fourth", 200, "mid"),
    ];
    const messages = ScaleCritiqueService.critique(createInput(objects, "outdoor"));

    expect(messages).toStrictEqual([]);
  });
});
