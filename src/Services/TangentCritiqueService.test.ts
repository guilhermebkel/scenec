import { describe, expect, it } from "vitest";
import { Resvg } from "@resvg/resvg-js";
import { RasterService } from "@/Services/RasterService.ts";
import { TangentCritiqueService } from "@/Services/TangentCritiqueService.ts";

const WIDTH = 320;
const HEIGHT = 320;

function renderSvg(elements: string): Uint8Array {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${WIDTH}" height="${HEIGHT}" viewBox="0 0 ${WIDTH} ${HEIGHT}">${elements}</svg>`;
  return new Resvg(svg, {
    fitTo: { mode: "width", value: WIDTH },
    font: { loadSystemFonts: false },
  }).render().pixels;
}

function circleLayer(id: string, centerX: number, centerY: number, radius: number) {
  const body = `<circle cx="${centerX}" cy="${centerY}" r="${radius}" fill="#202020"/>`;
  return {
    id,
    asset: "circle",
    kind: "ground" as const,
    related: [] as string[],
    isFocus: false,
    height: radius * 2,
    depth: "mid" as const,
    pixels: renderSvg(body),
  };
}

function buildRaster(layers: ReturnType<typeof circleLayer>[], horizonRatio?: number) {
  const full = renderSvg(layers.map((_, index) => `<circle id="c_${index}" cx="0" cy="0" r="0"/>`).join(""));
  const back = renderSvg("<rect width=\"320\" height=\"320\" fill=\"#FFFFFF\"/>");
  return RasterService.build({
    width: WIDTH,
    height: HEIGHT,
    factor: 1,
    fullPixels: full,
    backPixels: back,
    horizonRatio,
    layers,
  });
}

describe("TangentCritiqueService.critique()", () => {
  it("warns when two circles just touch at distance 0", () => {
    const firstCircle = circleLayer("first", 100, 100, 50);
    const secondCircle = circleLayer("second", 200, 100, 50);
    const raster = buildRaster([firstCircle, secondCircle]);
    const messages = TangentCritiqueService.critique(raster);

    expect(messages).toContain(
      "'first' just touches 'second' (tangent); overlap them clearly or leave a gap of at least 8 px",
    );
  });

  it("warns when two circles almost touch at distance 2 px", () => {
    const firstCircle = circleLayer("first", 100, 100, 50);
    const secondCircle = circleLayer("second", 201, 100, 50);
    const raster = buildRaster([firstCircle, secondCircle]);
    const messages = TangentCritiqueService.critique(raster);

    expect(messages).toContain(
      "'first' just touches 'second' (tangent); overlap them clearly or leave a gap of at least 8 px",
    );
  });

  it("does not warn when two circles clearly overlap", () => {
    const firstCircle = circleLayer("first", 100, 100, 50);
    const secondCircle = circleLayer("second", 185, 100, 50);
    const raster = buildRaster([firstCircle, secondCircle]);
    const messages = TangentCritiqueService.critique(raster);

    expect(messages.filter((message) => message.includes("just touches"))).toStrictEqual([]);
  });

  it("warns when an object touches the horizon line", () => {
    const boxLayer = {
      id: "groundObject",
      asset: "box",
      kind: "ground" as const,
      related: [] as string[],
      isFocus: false,
      height: 80,
      depth: "mid" as const,
      pixels: renderSvg("<rect x=\"50\" y=\"160\" width=\"80\" height=\"80\" fill=\"#202020\"/>"),
    };
    const raster = buildRaster([boxLayer], 0.5);
    const messages = TangentCritiqueService.critique(raster);

    expect(messages).toContain("'groundObject' touches the horizon; move it above or below");
  });
});
