import { FontAdapter } from "@/render/FontAdapter.ts";
import { Resvg } from "@resvg/resvg-js";
import type { BBox } from "@/protocols/options.ts";

export interface Raster {
  width: number;
  height: number;
  pixels: Uint8Array;
  png: Uint8Array;
}
export class ResvgAdapter {
  static renderPng(svg: string, width = 1200): Raster {
    const image = new Resvg(svg, {
      font: { fontFiles: FontAdapter.FONT_FILES, loadSystemFonts: false, defaultFontFamily: FontAdapter.FONT_FAMILY },
      fitTo: { mode: "width", value: width },
    }).render();
    return { width: image.width, height: image.height, pixels: image.pixels, png: image.asPng() };
  }

  static measureSvg(svg: string): BBox | null {
    const box = new Resvg(svg).getBBox();
    return box ? { x: box.x, y: box.y, width: box.width, height: box.height } : null;
  }
}
