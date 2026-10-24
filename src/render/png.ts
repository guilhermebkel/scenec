import { Resvg } from "@resvg/resvg-js";
import type { BBox } from "../protocols/options.ts";
import { FONT_FAMILY, FONT_FILES } from "./fonts.ts";

export interface Raster {
  width: number;
  height: number;
  pixels: Uint8Array;
  png: Uint8Array;
}

export function renderPng(svg: string, width = 1200): Raster {
  const image = new Resvg(svg, {
    font: { fontFiles: FONT_FILES, loadSystemFonts: false, defaultFontFamily: FONT_FAMILY },
    fitTo: { mode: "width", value: width },
  }).render();
  return { width: image.width, height: image.height, pixels: image.pixels, png: image.asPng() };
}

export function measureSvg(svg: string): BBox | null {
  const box = new Resvg(svg).getBBox();
  return box ? { x: box.x, y: box.y, width: box.width, height: box.height } : null;
}
