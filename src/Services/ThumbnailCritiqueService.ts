import type { CritiqueTitle } from "@/Protocols/CompilationProtocol.ts";
import { OklabUtil } from "@/Utils/OklabUtil.ts";
import { PixelUtil } from "@/Utils/PixelUtil.ts";

export interface ThumbnailCritiqueInput {
  thumbnailPixels: Uint8Array;
  thumbnailWidth: number;
  thumbnailHeight: number;
  sceneWidth: number;
  focusObject?: {
    id: string;
    pixels: Uint8Array;
  };
  title?: CritiqueTitle;
}

export class ThumbnailCritiqueService {
  // Why: alpha above 128 marks the solid perceived shape of an SVG element.
  private static readonly OPAQUE_ALPHA = 128;

  // Why: dilating by 2 px isolates the immediate background boundary around the thumbnail silhouette.
  private static readonly DILATION_PX = 2;

  // Why: at 96 px wide, a focal subject must cover at least 20 pixels to be clearly recognizable.
  private static readonly MIN_FOCUS_PIXELS = 20;

  // Why: local lightness contrast below 0.035 causes the focal silhouette to blend into its background at thumbnail size.
  private static readonly MIN_CONTRAST = 0.035;

  // Why: Poppins font capital letter height is approximately 70% of the em-box font size.
  private static readonly CAP_HEIGHT_RATIO = 0.70;

  // Why: text with cap height below ~4 px cannot be resolved on mobile feeds or grid thumbnails.
  private static readonly MIN_CAP_HEIGHT_PX = 3.8;

  // Why: RGBA channels and offsets.
  private static readonly CHANNELS = 4;

  private static readonly ALPHA_OFFSET = 3;

  private static readonly RED_OFFSET = 0;

  private static readonly GREEN_OFFSET = 1;

  private static readonly BLUE_OFFSET = 2;

  static critique(input: ThumbnailCritiqueInput): string[] {
    return [
      ...ThumbnailCritiqueService.checkFocus(input),
      ...ThumbnailCritiqueService.checkTitle(input),
    ];
  }

  private static checkTitle(input: ThumbnailCritiqueInput): string[] {
    const { title, thumbnailWidth, sceneWidth } = input;
    if (!title) {
      return [];
    }
    const factor = thumbnailWidth / sceneWidth;
    const capHeight = title.fontSize * factor * ThumbnailCritiqueService.CAP_HEIGHT_RATIO;
    if (capHeight < ThumbnailCritiqueService.MIN_CAP_HEIGHT_PX) {
      return [`title is too small to read at thumbnail size (cap height ${capHeight.toFixed(1)} px); increase title size`];
    }
    return [];
  }

  private static checkFocus(input: ThumbnailCritiqueInput): string[] {
    const { focusObject, thumbnailPixels, thumbnailWidth, thumbnailHeight } = input;
    if (!focusObject) {
      return [];
    }
    const pixelCount = thumbnailWidth * thumbnailHeight;
    let focusPixelCount = 0;
    let sumL = 0;
    for (let index = 0; index < pixelCount; index++) {
      const alphaOffset = index * ThumbnailCritiqueService.CHANNELS + ThumbnailCritiqueService.ALPHA_OFFSET;
      const alpha = PixelUtil.read(focusObject.pixels, alphaOffset);
      if (alpha > ThumbnailCritiqueService.OPAQUE_ALPHA) {
        focusPixelCount++;
        const offset = index * ThumbnailCritiqueService.CHANNELS;
        const [lightness] = OklabUtil.fromRgb(
          PixelUtil.read(thumbnailPixels, offset + ThumbnailCritiqueService.RED_OFFSET),
          PixelUtil.read(thumbnailPixels, offset + ThumbnailCritiqueService.GREEN_OFFSET),
          PixelUtil.read(thumbnailPixels, offset + ThumbnailCritiqueService.BLUE_OFFSET),
        );
        sumL += lightness;
      }
    }
    if (focusPixelCount < ThumbnailCritiqueService.MIN_FOCUS_PIXELS) {
      return [`'${focusObject.id}' is lost at thumbnail size (${focusPixelCount} px); increase its contrast or make it larger`];
    }
    const meanFocusL = sumL / focusPixelCount;
    const surroundContrast = ThumbnailCritiqueService.surroundContrast(input, meanFocusL);
    if (surroundContrast < ThumbnailCritiqueService.MIN_CONTRAST) {
      return [`'${focusObject.id}' is lost at thumbnail size; increase its contrast against the background`];
    }
    return [];
  }

  private static surroundContrast(input: ThumbnailCritiqueInput, meanFocusL: number): number {
    const { focusObject, thumbnailPixels, thumbnailWidth, thumbnailHeight } = input;
    if (!focusObject) {
      return 1;
    }
    const pixelCount = thumbnailWidth * thumbnailHeight;
    const dilated = ThumbnailCritiqueService.dilate(focusObject.pixels, thumbnailWidth, thumbnailHeight);
    let sumSurroundL = 0;
    let surroundCount = 0;
    for (let index = 0; index < pixelCount; index++) {
      const isSurround = dilated[index] === 1 && PixelUtil.read(
        focusObject.pixels,
        index * ThumbnailCritiqueService.CHANNELS + ThumbnailCritiqueService.ALPHA_OFFSET,
      ) <= ThumbnailCritiqueService.OPAQUE_ALPHA;
      if (isSurround) {
        const offset = index * ThumbnailCritiqueService.CHANNELS;
        const [lightness] = OklabUtil.fromRgb(
          PixelUtil.read(thumbnailPixels, offset + ThumbnailCritiqueService.RED_OFFSET),
          PixelUtil.read(thumbnailPixels, offset + ThumbnailCritiqueService.GREEN_OFFSET),
          PixelUtil.read(thumbnailPixels, offset + ThumbnailCritiqueService.BLUE_OFFSET),
        );
        sumSurroundL += lightness;
        surroundCount++;
      }
    }
    if (surroundCount === 0) {
      return 1;
    }
    const meanSurroundL = sumSurroundL / surroundCount;
    return Math.abs(meanFocusL - meanSurroundL);
  }

  private static dilate(pixels: Uint8Array, width: number, height: number): Uint8Array {
    const pixelCount = width * height;
    const dilated = new Uint8Array(pixelCount);
    const reach = ThumbnailCritiqueService.DILATION_PX;
    for (let index = 0; index < pixelCount; index++) {
      const alphaOffset = index * ThumbnailCritiqueService.CHANNELS + ThumbnailCritiqueService.ALPHA_OFFSET;
      const alpha = PixelUtil.read(pixels, alphaOffset);
      if (alpha > ThumbnailCritiqueService.OPAQUE_ALPHA) {
        const centerRow = Math.trunc(index / width);
        const centerCol = index % width;
        const firstRow = Math.max(0, centerRow - reach);
        const lastRow = Math.min(height - 1, centerRow + reach);
        const firstCol = Math.max(0, centerCol - reach);
        const lastCol = Math.min(width - 1, centerCol + reach);
        for (let row = firstRow; row <= lastRow; row++) {
          dilated.fill(1, row * width + firstCol, row * width + lastCol + 1);
        }
      }
    }
    return dilated;
  }
}
