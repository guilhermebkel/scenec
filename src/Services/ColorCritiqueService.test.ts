import { describe, expect, it } from "vitest";
import { Resvg } from "@resvg/resvg-js";
import { ColorCritiqueService } from "@/Services/ColorCritiqueService.ts";
import { RasterService } from "@/Services/RasterService.ts";

const WIDTH = 320;
const HEIGHT = 320;

function renderSvg(elements: string): Uint8Array {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${WIDTH}" height="${HEIGHT}" viewBox="0 0 ${WIDTH} ${HEIGHT}">${elements}</svg>`;
  return new Resvg(svg, {
    fitTo: { mode: "width", value: WIDTH },
    font: { loadSystemFonts: false },
  }).render().pixels;
}

function objectLayer(id: string, body: string) {
  return {
    id,
    asset: "box",
    kind: "ground" as const,
    related: [] as string[],
    isFocus: false,
    height: 100,
    depth: "mid" as const,
    pixels: renderSvg(body),
  };
}

describe("ColorCritiqueService.critique()", () => {
  it("warns about lack of value structure when image is all mid-tones", () => {
    const obj = objectLayer("block", "<rect x=\"40\" y=\"40\" width=\"240\" height=\"240\" fill=\"#808080\"/>");
    const full = renderSvg("<rect width=\"320\" height=\"320\" fill=\"#787878\"/><rect x=\"40\" y=\"40\" width=\"240\" height=\"240\" fill=\"#808080\"/>");
    const back = renderSvg("<rect width=\"320\" height=\"320\" fill=\"#787878\"/>");
    const raster = RasterService.build({
      width: WIDTH,
      height: HEIGHT,
      factor: 1,
      fullPixels: full,
      backPixels: back,
      layers: [obj],
    });
    const messages = ColorCritiqueService.critique(raster);

    expect(messages.some((message) => message.includes("the picture has no darks"))).toBe(true);
  });

  it("warns about color harmony clash when an isolated hue discordantly sits in palette", () => {
    const lia = objectLayer("lia", "<rect x=\"120\" y=\"140\" width=\"80\" height=\"100\" fill=\"#D94F70\"/>");
    const full = renderSvg(
      "<rect width=\"320\" height=\"200\" fill=\"#2E6BE6\"/>"
      + "<rect y=\"200\" width=\"320\" height=\"120\" fill=\"#3D8B37\"/>"
      + "<rect x=\"120\" y=\"140\" width=\"80\" height=\"100\" fill=\"#D94F70\"/>",
    );
    const back = renderSvg("<rect width=\"320\" height=\"200\" fill=\"#2E6BE6\"/><rect y=\"200\" width=\"320\" height=\"120\" fill=\"#3D8B37\"/>");
    const raster = RasterService.build({
      width: WIDTH,
      height: HEIGHT,
      factor: 1,
      fullPixels: full,
      backPixels: back,
      layers: [lia],
    });
    const messages = ColorCritiqueService.critique(raster);

    expect(messages.some((message) => message.includes("clashes with the palette"))).toBe(true);
  });
});
