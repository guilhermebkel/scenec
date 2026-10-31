import { check, renderPng } from "../../src/render.ts";
import { describe, expect, it } from "vitest";

const SMOKE_WIDTH = 200;

describe("asset variants", () => {
  it.each(["tree", "sofa", "chair"])("%s renders distinct SVGs for different variants", (asset) => {
    const defaultScene = { canvas: { width: 600, height: 400, setting: "indoor" }, objects: { item: { asset } } };
    const variant2Scene = {
      canvas: { width: 600, height: 400, setting: "indoor" },
      objects: { item: { asset, variant: 2 } },
    };
    const variant3Scene = {
      canvas: { width: 600, height: 400, setting: "indoor" },
      objects: { item: { asset, variant: 3 } },
    };

    const res1 = check(defaultScene);
    const res2 = check(variant2Scene);
    const res3 = check(variant3Scene);

    expect(res1.svg !== res2.svg).toBe(true);
    expect(res2.svg !== res3.svg).toBe(true);
    expect(res1.svg !== res3.svg).toBe(true);

    const raster1 = renderPng(res1.svg, SMOKE_WIDTH);
    const raster2 = renderPng(res2.svg, SMOKE_WIDTH);
    const raster3 = renderPng(res3.svg, SMOKE_WIDTH);
    expect([raster1.width, raster2.width, raster3.width]).toStrictEqual([SMOKE_WIDTH, SMOKE_WIDTH, SMOKE_WIDTH]);
  });
});
