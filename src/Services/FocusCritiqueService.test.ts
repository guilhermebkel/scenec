import { describe, expect, it } from "vitest";
import { Resvg } from "@resvg/resvg-js";
import { FocusCritiqueService } from "@/Services/FocusCritiqueService.ts";
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

function objectLayer(id: string, body: string, isFocus = false) {
  return {
    id,
    asset: "box",
    kind: "ground" as const,
    related: [] as string[],
    isFocus,
    height: 100,
    depth: "mid" as const,
    pixels: renderSvg(body),
  };
}

describe("FocusCritiqueService.critique()", () => {
  it("warns when a background object is much more saturated than the focus", () => {
    const focus = objectLayer("personFocus", "<rect x=\"40\" y=\"80\" width=\"80\" height=\"120\" fill=\"#757778\"/>", true);
    const bgObject = objectLayer("vividProp", "<rect x=\"180\" y=\"80\" width=\"80\" height=\"120\" fill=\"#FF0055\"/>");
    const full = renderSvg(
      "<rect width=\"320\" height=\"320\" fill=\"#EEE\"/>"
      + "<rect x=\"40\" y=\"80\" width=\"80\" height=\"120\" fill=\"#757778\"/>"
      + "<rect x=\"180\" y=\"80\" width=\"80\" height=\"120\" fill=\"#FF0055\"/>",
    );
    const back = renderSvg("<rect width=\"320\" height=\"320\" fill=\"#EEE\"/>");
    const raster = RasterService.build({
      width: WIDTH,
      height: HEIGHT,
      factor: 1,
      fullPixels: full,
      backPixels: back,
      focusId: "personFocus",
      layers: [focus, bgObject],
    });
    const messages = FocusCritiqueService.critique(raster, "personFocus");

    expect(messages.some((message) => message.includes("'vividProp' draws more attention than the focus 'personFocus'"))).toBe(true);
  });

  it("warns when too much area is highly saturated (saturation budget)", () => {
    const hugeVivid = objectLayer("hugeVivid", "<rect x=\"0\" y=\"0\" width=\"320\" height=\"200\" fill=\"#FF0055\"/>");
    const full = renderSvg("<rect x=\"0\" y=\"0\" width=\"320\" height=\"200\" fill=\"#FF0055\"/>");
    const back = renderSvg("<rect width=\"320\" height=\"320\" fill=\"#EEE\"/>");
    const raster = RasterService.build({
      width: WIDTH,
      height: HEIGHT,
      factor: 1,
      fullPixels: full,
      backPixels: back,
      layers: [hugeVivid],
    });
    const messages = FocusCritiqueService.critique(raster);

    expect(messages.some((message) => message.includes("too much saturated color"))).toBe(true);
  });
});
