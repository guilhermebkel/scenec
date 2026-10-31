import type { Raster, RasterLayer, RasterObject, RasterSource } from "@/Protocols/CritiqueProtocol.ts";
import { OklabUtil } from "@/Utils/OklabUtil.ts";
import { PixelUtil } from "@/Utils/PixelUtil.ts";

export class RasterService {
  private static readonly CHANNELS = 4;

  private static readonly ALPHA_OFFSET = 3;

  private static readonly OPAQUE_ALPHA = 128;

  private static readonly LAB_COMPONENTS = 3;

  static build(source: RasterSource): Raster {
    const { width, height, layers } = source;
    const pixelCount = width * height;
    const objects = layers.map((layer) => RasterService.objectOf(layer, width, height));
    const owner = new Int16Array(pixelCount).fill(-1);
    objects.forEach((object, objectIndex) => {
      for (let index = 0; index < pixelCount; index++) {
        if (PixelUtil.read(object.alpha, index) > RasterService.OPAQUE_ALPHA) {
          owner[index] = objectIndex;
        }
      }
    });
    return {
      width,
      height,
      pixelCount,
      factor: source.factor,
      rgba: source.fullPixels,
      fullLab: RasterService.labOf(source.fullPixels, pixelCount),
      backLab: RasterService.labOf(source.backPixels, pixelCount),
      objects,
      owner,
      horizonRatio: source.horizonRatio,
      setting: source.setting,
      focusId: source.focusId,
    };
  }

  private static objectOf(layer: RasterLayer, width: number, height: number): RasterObject {
    const pixelCount = width * height;
    const alpha = new Uint8Array(pixelCount);
    const box = { left: width, top: height, right: -1, bottom: -1 };
    let area = 0;
    for (let index = 0; index < pixelCount; index++) {
      const value = PixelUtil.read(layer.pixels, index * RasterService.CHANNELS + RasterService.ALPHA_OFFSET);
      alpha[index] = value;
      if (value > RasterService.OPAQUE_ALPHA) {
        area++;
        const column = index % width;
        const row = Math.trunc(index / width);
        box.left = Math.min(box.left, column);
        box.right = Math.max(box.right, column);
        box.top = Math.min(box.top, row);
        box.bottom = Math.max(box.bottom, row);
      }
    }
    return {
      id: layer.id,
      asset: layer.asset,
      kind: layer.kind,
      related: layer.related,
      alpha,
      area,
      box,
      isFocus: layer.isFocus,
      height: layer.height,
      depth: layer.depth,
    };
  }

  private static labOf(pixels: Uint8Array, pixelCount: number): Float32Array {
    const lab = new Float32Array(pixelCount * RasterService.LAB_COMPONENTS);
    for (let index = 0; index < pixelCount; index++) {
      const offset = index * RasterService.CHANNELS;
      const [lightness, greenRed, blueYellow] = OklabUtil.fromRgb(
        PixelUtil.read(pixels, offset),
        PixelUtil.read(pixels, offset + 1),
        PixelUtil.read(pixels, offset + 2),
      );
      const targetIndex = index * RasterService.LAB_COMPONENTS;
      lab[targetIndex] = lightness;
      lab[targetIndex + 1] = greenRed;
      lab[targetIndex + 2] = blueYellow;
    }
    return lab;
  }
}
