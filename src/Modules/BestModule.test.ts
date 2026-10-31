import { BestModule } from "@/Modules/BestModule.ts";
import { CheckModule } from "@/Modules/CheckModule.ts";
import { SceneError } from "@/Errors/SceneError.ts";
import { describe, expect, it } from "vitest";

const FRAME = { width: 1000, height: 500, setting: "outdoor" as const };

describe("BestModule.best()", () => {
  it("picks the best variant and returns the winning parameters", () => {
    const scene = {
      canvas: FRAME,
      objects: {
        a: { asset: "tree", at: "left" },
        b: { asset: "tree", at: "right" },
      },
    };
    const result = BestModule.best(scene, { count: 4 });

    expect(result.winner.variant).toBeGreaterThanOrEqual(0);
    expect(result.winner.score).toBeGreaterThan(0);
    expect(typeof result.winner.parameters).toBe("object");
    expect(result.svg.startsWith("<svg xmlns=\"http://www.w3.org/2000/svg\"")).toBe(true);
  });

  it("does not change parameters that the author already set", () => {
    const scene = {
      canvas: {
        ...FRAME,
        seed: 42,
        light: { from: "right" },
        frame: "left" as const,
        clouds: "few" as const,
        ridges: 2,
      },
      objects: {
        a: { asset: "tree", at: "center" },
      },
    };
    const result = BestModule.best(scene, { count: 3 });

    expect(result.winner.parameters.seed).toBeUndefined();
    expect(result.winner.parameters.light).toBeUndefined();
    expect(result.winner.parameters.frame).toBeUndefined();
    expect(result.winner.parameters.clouds).toBeUndefined();
    expect(result.winner.parameters.ridges).toBeUndefined();
  });

  it("writes updated YAML that parses and compiles deterministically to the same SVG", () => {
    const scene = {
      canvas: FRAME,
      objects: {
        a: { asset: "tree", at: "center" },
      },
    };
    const result = BestModule.best(scene, { count: 4 });
    const directCheck = CheckModule.check(result.updatedSceneYaml);

    expect(directCheck.svg).toBe(result.svg);
  });

  it("respects the count option and defaults to 8 when omitted", () => {
    const scene = {
      canvas: FRAME,
      objects: {
        a: { asset: "tree", at: "center" },
      },
    };
    const resultSingle = BestModule.best(scene, { count: 1 });
    expect(resultSingle.winner.variant).toBe(0);

    const resultDefault = BestModule.best(scene);
    expect(resultDefault.winner.variant).toBeLessThan(8);
  });

  it("throws SceneError when the scene is invalid", () => {
    expect(() => BestModule.best("not: [valid: yaml", { count: 2 })).toThrow(SceneError);
    expect(() => BestModule.best(12345, { count: 2 })).toThrow(SceneError);
    expect(() => BestModule.best({ canvas: { width: "huge" } }, { count: 2 })).toThrow(SceneError);
  });

  it("handles YAML string input seamlessly", () => {
    const yamlString = `
canvas:
  width: 800
  height: 600
  setting: outdoor
objects:
  t:
    asset: tree
    at: center
`;
    const result = BestModule.best(yamlString, { count: 3 });
    expect(result.winner.variant).toBeGreaterThanOrEqual(0);
    expect(result.updatedSceneYaml).toContain("seed:");
  });

  it("varies harmony when a generated theme palette is used", () => {
    const scene = {
      canvas: {
        ...FRAME,
        theme: { from: "#2F6BFF" },
      },
      objects: {
        a: { asset: "tree", at: "center" },
      },
    };
    const result = BestModule.best(scene, { count: 4 });
    expect(result.winner.score).toBeGreaterThan(0);
  });
});
