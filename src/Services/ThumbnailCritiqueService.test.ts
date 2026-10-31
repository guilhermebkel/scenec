import { describe, expect, it } from "vitest";
import { Resvg } from "@resvg/resvg-js";
import { ThumbnailCritiqueService } from "@/Services/ThumbnailCritiqueService.ts";

const THUMBNAIL_WIDTH = 96;
const THUMBNAIL_HEIGHT = 96;

function renderThumbnail(elements: string): Uint8Array {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${THUMBNAIL_WIDTH}" height="${THUMBNAIL_HEIGHT}" viewBox="0 0 ${THUMBNAIL_WIDTH} ${THUMBNAIL_HEIGHT}">${elements}</svg>`;
  return new Resvg(svg, {
    fitTo: { mode: "width", value: THUMBNAIL_WIDTH },
    font: { loadSystemFonts: false },
  }).render().pixels;
}

describe("ThumbnailCritiqueService.critique()", () => {
  it("warns when a focal subject is too small at thumbnail size", () => {
    const focusPixels = renderThumbnail("<rect x=\"40\" y=\"40\" width=\"2\" height=\"3\" fill=\"#000\"/>");
    const scenePixels = renderThumbnail("<rect width=\"96\" height=\"96\" fill=\"#FFF\"/><rect x=\"40\" y=\"40\" width=\"2\" height=\"3\" fill=\"#000\"/>");
    const messages = ThumbnailCritiqueService.critique({
      thumbnailPixels: scenePixels,
      thumbnailWidth: THUMBNAIL_WIDTH,
      thumbnailHeight: THUMBNAIL_HEIGHT,
      sceneWidth: 1000,
      focusObject: { id: "tinyFocus", pixels: focusPixels },
    });

    expect(messages.some((message) => message.includes("'tinyFocus' is lost at thumbnail size"))).toBe(true);
  });

  it("warns when a focal subject blends into its background at thumbnail size", () => {
    const focusPixels = renderThumbnail("<rect x=\"30\" y=\"30\" width=\"30\" height=\"30\" fill=\"#F5F5F5\"/>");
    const scenePixels = renderThumbnail("<rect width=\"96\" height=\"96\" fill=\"#FFFFFF\"/><rect x=\"30\" y=\"30\" width=\"30\" height=\"30\" fill=\"#F5F5F5\"/>");
    const messages = ThumbnailCritiqueService.critique({
      thumbnailPixels: scenePixels,
      thumbnailWidth: THUMBNAIL_WIDTH,
      thumbnailHeight: THUMBNAIL_HEIGHT,
      sceneWidth: 1000,
      focusObject: { id: "ghostFocus", pixels: focusPixels },
    });

    expect(messages).toContain("'ghostFocus' is lost at thumbnail size; increase its contrast against the background");
  });

  it("warns when the title is too small to read at thumbnail size", () => {
    const scenePixels = renderThumbnail("<rect width=\"96\" height=\"96\" fill=\"#FFF\"/>");
    const messages = ThumbnailCritiqueService.critique({
      thumbnailPixels: scenePixels,
      thumbnailWidth: THUMBNAIL_WIDTH,
      thumbnailHeight: THUMBNAIL_HEIGHT,
      sceneWidth: 1000,
      title: { content: "Too Small Title", fontSize: 30 },
    });

    expect(messages.some((message) => message.includes("title is too small to read at thumbnail size"))).toBe(true);
  });

  it("passes when title is sufficiently large", () => {
    const scenePixels = renderThumbnail("<rect width=\"96\" height=\"96\" fill=\"#FFF\"/>");
    const messages = ThumbnailCritiqueService.critique({
      thumbnailPixels: scenePixels,
      thumbnailWidth: THUMBNAIL_WIDTH,
      thumbnailHeight: THUMBNAIL_HEIGHT,
      sceneWidth: 720,
      title: { content: "Readable Title", fontSize: 64 },
    });

    expect(messages).toStrictEqual([]);
  });
});
