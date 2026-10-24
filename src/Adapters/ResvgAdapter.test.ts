import { ResvgAdapter } from "@/Adapters/ResvgAdapter.ts";
import { describe, expect, it } from "vitest";
const SQUARE = "<svg xmlns=\"http://www.w3.org/2000/svg\" width=\"100\" height=\"50\" viewBox=\"0 0 100 50\"><rect x=\"10\" y=\"5\" width=\"30\" height=\"20\" fill=\"#FF0000\"/></svg>";

describe("ResvgAdapter.renderPng()", () => {
  it("renders at the requested width and keeps the proportion", () => {
    const raster = ResvgAdapter.renderPng(SQUARE, 200);

    expect([raster.width, raster.height, raster.pixels.length]).toStrictEqual([200, 100, 200 * 100 * 4]);
  });

  it("writes a PNG file signature", () => {
    const raster = ResvgAdapter.renderPng(SQUARE, 100);

    expect(Array.from(raster.png.slice(0, 8))).toStrictEqual([137, 80, 78, 71, 13, 10, 26, 10]);
  });

  it("paints the rectangle in red", () => {
    const raster = ResvgAdapter.renderPng(SQUARE, 100);
    const insideAt = (10 * 100 + 20) * 4;

    expect(Array.from(raster.pixels.slice(insideAt, insideAt + 4))).toStrictEqual([255, 0, 0, 255]);
  });
});

describe("ResvgAdapter.measureSvg()", () => {
  it("returns the box the drawing really covers", () => {
    expect(ResvgAdapter.measureSvg(SQUARE)).toStrictEqual({ x: 10, y: 5, width: 30, height: 20 });
  });
});
