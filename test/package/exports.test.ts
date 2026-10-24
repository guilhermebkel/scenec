import { describe, expect, it } from "vitest";
import * as core from "../../src/index.ts";
import * as render from "../../src/render.ts";
import * as schema from "../../src/schema.ts";

describe("public API surface", () => {
  it("exports from scenec only what the README promises", () => {
    expect(Object.keys(core).toSorted()).toStrictEqual(["SceneError", "compile", "parseScene"]);
  });

  it("exports from scenec/render the functions that need the native renderer", () => {
    expect(Object.keys(render).toSorted()).toStrictEqual(["check", "createFileReader", "measureSvg", "renderPng"]);
  });

  it("exports from scenec/schema the schema and the vocabulary", () => {
    expect(Object.keys(schema).toSorted()).toStrictEqual([
      "CATALOG_KINDS", "catalog", "listAssets", "listGroups", "listKits", "listThemes", "sceneJsonSchema",
    ]);
  });
});
