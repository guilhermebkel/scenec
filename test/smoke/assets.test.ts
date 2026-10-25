import { check, renderPng } from "../../src/render.ts";
import { SanitizeUtil } from "../../src/Utils/SanitizeUtil.ts";
import { describe, expect, it } from "vitest";
import { listAssets, listKits } from "../../src/schema.ts";
const SMOKE_WIDTH = 200;
const kits = listKits().map((kit) => kit.id);
const cases = listAssets().flatMap((asset) => kits.map((kit) => ({ asset: asset.id, kit })));

function elementNames(svg: string): string[] {
  return [...new Set([...svg.matchAll(/<([a-zA-Z][a-zA-Z0-9]*)/g)].map((match) => match[1] ?? ""))];
}

describe("asset smoke", () => {
  it.each(cases)("$asset in the $kit kit draws only allowed elements and renders without a panic", ({ asset, kit }) => {
    const scene = { canvas: { width: 600, height: 400, kit, setting: "indoor" }, objects: { only: { asset } } };
    const result = check(scene);
    const raster = renderPng(result.svg, SMOKE_WIDTH);
    const forbidden = elementNames(result.svg).filter((name) => !SanitizeUtil.isAllowedElement(name));

    expect([forbidden, /\son\w+=/.test(result.svg), raster.width]).toStrictEqual([[], false, SMOKE_WIDTH]);
  });
});
