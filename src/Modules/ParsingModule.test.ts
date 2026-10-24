import { ParsingModule } from "@/Modules/ParsingModule.ts";
import { describe, expect, it } from "vitest";
import { SceneError } from "@/Errors/SceneError.ts";

function errorsOf(input: unknown): string[] {
  try {
    ParsingModule.parseScene(input);
  } catch (error) {
    return (error as SceneError).errors;
  }
  return [];
}

describe("ParsingModule.parseScene()", () => {
  it("reads a scene from YAML text", () => {
    const { scene, warnings } = ParsingModule.parseScene("canvas:\n  width: 800\nobjects:\n  tree:\n    at: left\n");

    expect([scene, warnings]).toStrictEqual([{ canvas: { width: 800 }, objects: { tree: { at: "left" } } }, []]);
  });

  it("reads a scene that is already an object", () => {
    expect(ParsingModule.parseScene({ canvas: { theme: "night" } }).scene).toStrictEqual({ canvas: { theme: "night" } });
  });

  it("reports broken YAML with the position", () => {
    expect(errorsOf("canvas: [")).toStrictEqual([
      "invalid YAML: unexpected end of the stream within a flow collection (1:10)\n\n 1 | canvas: [\n--------------^",
    ]);
  });

  it("reports a scene that is not an object", () => {
    expect(errorsOf("hello")).toStrictEqual(["(scene): Invalid input: expected object, received string"]);
  });

  it("suggests the right name for a misspelled option", () => {
    expect(errorsOf({ canvas: { mode: "mapp" } })).toStrictEqual([
      "canvas.mode: Invalid option: expected one of \"classic\"|\"2.5d\"|\"board\"|\"map\"; did you mean 'map'?",
    ]);
  });

  it("suggests a slot name for a misspelled position", () => {
    expect(errorsOf({ objects: { tree: { at: "centre" } } })).toStrictEqual([
      "objects.tree.at: use a position name (far-left, left, center-left, center, center-right, right, far-right), "
      + "a number from 0 to 1 or [x, z] in 2.5d mode; did you mean 'center'?",
    ]);
  });

  it("lists the accepted sizes when none is close", () => {
    expect(errorsOf({ objects: { tree: { size: "gigante" } } })).toStrictEqual([
      "objects.tree.size: Invalid input; accepted values: tiny, small, medium, large, huge",
    ]);
  });

  it("refuses a frame larger than 4096 px", () => {
    expect(errorsOf({ canvas: { width: 5000 } })).toStrictEqual([
      "canvas.width: Too big: expected number to be <=4096",
    ]);
  });

  it("refuses more than 200 objects and says the limit", () => {
    const objects = Object.fromEntries(Array.from({ length: 201 }, (_, index) => [`o${index}`, { asset: "tree" }]));

    expect(errorsOf({ objects })).toStrictEqual(["objects: 201 objects; the limit is 200"]);
  });

  it("warns about an unknown field and suggests the close name, without refusing the scene", () => {
    const { warnings } = ParsingModule.parseScene({ objects: { tree: { asset: "tree", siz: "small" } } });

    expect(warnings).toStrictEqual(["unknown field 'siz' in objects.tree; did you mean 'size'?"]);
  });

  it("warns that an unknown field with no close name will be ignored", () => {
    const { warnings } = ParsingModule.parseScene({ canvas: { zzzzzzzz: 1 } });

    expect(warnings).toStrictEqual(["unknown field 'zzzzzzzz' in canvas; it will be ignored"]);
  });
});
