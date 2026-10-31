import type { Raster, RasterObject } from "@/Protocols/CritiqueProtocol.ts";
import { IdUtil } from "@/Utils/IdUtil.ts";
import { PixelUtil } from "@/Utils/PixelUtil.ts";

export class ColorCritiqueService {
  // Why: OKLab lightness below 0.33 represents deep dark tones.
  private static readonly DARK_BAND_MAX = 0.33;

  // Why: OKLab lightness above 0.67 represents light highlights and sky tones.
  private static readonly LIGHT_BAND_MIN = 0.67;

  // Why: when more than 85% of pixels fall into a single value band, the scene lacks value structure.
  private static readonly MAX_SINGLE_BAND_SHARE = 0.85;

  // Why: whiteout scenes with over 95% in highlights look washed out without dark anchors.
  private static readonly MAX_LIGHT_BAND_SHARE = 0.95;

  // Why: chroma below 0.04 represents neutral grays/whites/blacks which harmonize universally.
  private static readonly NEUTRAL_CHROMA = 0.04;

  // Why: chroma of 0.14 or higher represents vivid, saturated color capable of creating jarring harmony clashes.
  private static readonly CLASH_CHROMA_THRESHOLD = 0.14;

  // Why: analogous colors sit within 80 degrees on the color wheel.
  private static readonly ANALOGOUS_MAX_DEG = 80;

  // Why: complementary colors sit between 150 and 210 degrees on the color wheel.
  private static readonly COMPLEMENTARY_MIN_DEG = 150;

  private static readonly COMPLEMENTARY_MAX_DEG = 210;

  // Why: minimum pixel count for an object's clashing color patch to be visually disruptive.
  private static readonly MIN_CLASH_PIXELS = 15;

  // Why: a hue family must carry at least 8% of the total chromatic weight to be a recognized palette pillar.
  private static readonly MIN_DOMINANT_WEIGHT_SHARE = 0.08;

  // Why: when placed objects cover under 5% of the frame, the scene is empty and color harmony checks are premature.
  private static readonly MIN_SCENE_COVERAGE = 0.05;

  // Why: 12 bins of 30 degrees each divide the color wheel into standard color families.
  private static readonly HUE_BIN_COUNT = 12;

  // Why: 360 degrees in a full color wheel circle.
  private static readonly FULL_CIRCLE_DEG = 360;

  // Why: half circle for wrap-around distance.
  private static readonly HALF_CIRCLE_DEG = 180;

  // Why: radix 16 for hexadecimal string conversions.
  private static readonly HEX_RADIX = 16;

  // Why: sky and floor environments don't represent placed objects capable of clashing with their own scene.
  private static readonly BACKGROUND_KINDS = ["floor", "sky", "ceiling"] as const;

  // Why: RGBA channels and offsets.
  private static readonly CHANNELS = 4;

  private static readonly RED_OFFSET = 0;

  private static readonly GREEN_OFFSET = 1;

  private static readonly BLUE_OFFSET = 2;

  private static readonly OPAQUE_ALPHA = 128;

  // Why: LAB component offsets.
  private static readonly LAB_L_OFFSET = 0;

  private static readonly LAB_A_OFFSET = 1;

  private static readonly LAB_B_OFFSET = 2;

  private static readonly LAB_CHANNELS = 3;

  static critique(raster: Raster): string[] {
    const totalObjectArea = raster.objects.reduce((sum, object) => sum + object.area, 0);
    if (totalObjectArea / raster.pixelCount < ColorCritiqueService.MIN_SCENE_COVERAGE) {
      return [];
    }
    return [
      ...ColorCritiqueService.checkValueStructure(raster),
      ...ColorCritiqueService.checkHarmony(raster),
    ];
  }

  private static countValueBands(raster: Raster): { darkShare: number; lightShare: number; midShare: number } {
    let darkCount = 0;
    let lightCount = 0;
    let midCount = 0;
    for (let index = 0; index < raster.pixelCount; index++) {
      const offset = index * ColorCritiqueService.LAB_CHANNELS + ColorCritiqueService.LAB_L_OFFSET;
      const lightness = raster.fullLab[offset] ?? 0;
      if (lightness < ColorCritiqueService.DARK_BAND_MAX) {
        darkCount++;
      } else if (lightness > ColorCritiqueService.LIGHT_BAND_MIN) {
        lightCount++;
      } else {
        midCount++;
      }
    }
    return {
      darkShare: darkCount / raster.pixelCount,
      lightShare: lightCount / raster.pixelCount,
      midShare: midCount / raster.pixelCount,
    };
  }

  private static checkValueStructure(raster: Raster): string[] {
    const { darkShare, lightShare, midShare } = ColorCritiqueService.countValueBands(raster);
    const candidate = ColorCritiqueService.largestGroundObject(raster);
    if (midShare >= ColorCritiqueService.MAX_SINGLE_BAND_SHARE) {
      const target = candidate ? `'${candidate.id}' or the ground` : "the ground";
      return darkShare > lightShare
        ? [`the picture has no lights; brighten ${target}`]
        : [`the picture has no darks; darken ${target}`];
    }
    if (lightShare >= ColorCritiqueService.MAX_LIGHT_BAND_SHARE) {
      const target = candidate ? `'${candidate.id}' or the ground` : "the ground";
      return [`the picture has no darks; darken ${target}`];
    }
    if (darkShare >= ColorCritiqueService.MAX_SINGLE_BAND_SHARE) {
      const target = candidate ? `'${candidate.id}' or the sky` : "the sky";
      return [`the picture has no lights; brighten ${target}`];
    }
    return [];
  }

  private static checkHarmony(raster: Raster): string[] {
    const dominantHues = ColorCritiqueService.dominantHueClusters(raster);
    if (dominantHues.length === 0) {
      return [];
    }
    const messages: string[] = [];
    for (const object of raster.objects) {
      if (IdUtil.isOneOf(ColorCritiqueService.BACKGROUND_KINDS, object.kind)) {
        continue;
      }
      const clash = ColorCritiqueService.clashOnObject(raster, object, dominantHues);
      if (clash) {
        messages.push(clash);
      }
    }
    return messages;
  }

  private static dominantHueClusters(raster: Raster): number[] {
    const bins = new Float32Array(ColorCritiqueService.HUE_BIN_COUNT);
    const binDegrees = ColorCritiqueService.FULL_CIRCLE_DEG / ColorCritiqueService.HUE_BIN_COUNT;
    let totalChroma = 0;
    for (let index = 0; index < raster.pixelCount; index++) {
      const offset = index * ColorCritiqueService.LAB_CHANNELS;
      const componentA = raster.fullLab[offset + ColorCritiqueService.LAB_A_OFFSET] ?? 0;
      const componentB = raster.fullLab[offset + ColorCritiqueService.LAB_B_OFFSET] ?? 0;
      const chroma = Math.hypot(componentA, componentB);
      if (chroma >= ColorCritiqueService.NEUTRAL_CHROMA) {
        const hue = ColorCritiqueService.hueOf(componentA, componentB);
        const binIndex = Math.trunc(hue / binDegrees) % ColorCritiqueService.HUE_BIN_COUNT;
        bins[binIndex] = (bins[binIndex] ?? 0) + chroma;
        totalChroma += chroma;
      }
    }
    if (totalChroma === 0) {
      return [];
    }
    const dominant: number[] = [];
    bins.forEach((weight, binIndex) => {
      if (weight / totalChroma >= ColorCritiqueService.MIN_DOMINANT_WEIGHT_SHARE) {
        dominant.push(Math.round(binIndex * binDegrees + binDegrees / 2));
      }
    });
    return dominant;
  }

  private static closestDominant(hue: number, dominantHues: readonly number[]): { distance: number; nearHue: number } {
    let minDistance = ColorCritiqueService.FULL_CIRCLE_DEG;
    let nearHue = dominantHues[0] ?? 0;
    for (const dominant of dominantHues) {
      const distance = ColorCritiqueService.circularDistance(hue, dominant);
      if (distance < minDistance) {
        minDistance = distance;
        nearHue = dominant;
      }
    }
    return { distance: minDistance, nearHue };
  }

  private static isHarmonious(hue: number, dominantHues: readonly number[]): boolean {
    return dominantHues.some((dominant) => {
      const distance = ColorCritiqueService.circularDistance(hue, dominant);
      const isAnalogous = distance <= ColorCritiqueService.ANALOGOUS_MAX_DEG;
      const isComplementary = distance >= ColorCritiqueService.COMPLEMENTARY_MIN_DEG
        && distance <= ColorCritiqueService.COMPLEMENTARY_MAX_DEG;
      return isAnalogous || isComplementary;
    });
  }

  private static clashOnObject(raster: Raster, object: RasterObject, dominantHues: readonly number[]): string | null {
    const clashingPixels: number[] = [];
    let bestDistance = ColorCritiqueService.FULL_CIRCLE_DEG;
    let closestHue = dominantHues[0] ?? 0;
    for (let index = 0; index < raster.pixelCount; index++) {
      if (PixelUtil.read(object.alpha, index) <= ColorCritiqueService.OPAQUE_ALPHA) {
        continue;
      }
      const offset = index * ColorCritiqueService.LAB_CHANNELS;
      const componentA = raster.fullLab[offset + ColorCritiqueService.LAB_A_OFFSET] ?? 0;
      const componentB = raster.fullLab[offset + ColorCritiqueService.LAB_B_OFFSET] ?? 0;
      const chroma = Math.hypot(componentA, componentB);
      if (chroma < ColorCritiqueService.CLASH_CHROMA_THRESHOLD) {
        continue;
      }
      const hue = ColorCritiqueService.hueOf(componentA, componentB);
      if (ColorCritiqueService.isHarmonious(hue, dominantHues)) {
        continue;
      }
      clashingPixels.push(index);
      const { distance, nearHue } = ColorCritiqueService.closestDominant(hue, dominantHues);
      if (distance < bestDistance) {
        bestDistance = distance;
        closestHue = nearHue;
      }
    }
    if (clashingPixels.length < ColorCritiqueService.MIN_CLASH_PIXELS) {
      return null;
    }
    const hex = ColorCritiqueService.modalHex(raster, clashingPixels);
    return `'${hex}' on '${object.id}' clashes with the palette; try a hue near ${closestHue}° or lower its saturation`;
  }

  private static modalHex(raster: Raster, pixels: readonly number[]): string {
    const hexToCount = new Map<string, number>();
    for (const pixelIndex of pixels) {
      const offset = pixelIndex * ColorCritiqueService.CHANNELS;
      const red = PixelUtil.read(raster.rgba, offset + ColorCritiqueService.RED_OFFSET);
      const green = PixelUtil.read(raster.rgba, offset + ColorCritiqueService.GREEN_OFFSET);
      const blue = PixelUtil.read(raster.rgba, offset + ColorCritiqueService.BLUE_OFFSET);
      const hex = `#${ColorCritiqueService.hexByte(red)}${ColorCritiqueService.hexByte(green)}${ColorCritiqueService.hexByte(blue)}`;
      hexToCount.set(hex, (hexToCount.get(hex) ?? 0) + 1);
    }
    let bestHex = "#000000";
    let highestCount = 0;
    for (const [hex, count] of hexToCount.entries()) {
      if (count > highestCount) {
        highestCount = count;
        bestHex = hex;
      }
    }
    return bestHex;
  }

  private static hexByte(value: number): string {
    return value.toString(ColorCritiqueService.HEX_RADIX).padStart(2, "0").toUpperCase();
  }

  private static hueOf(componentA: number, componentB: number): number {
    const degrees = (Math.atan2(componentB, componentA) * ColorCritiqueService.HALF_CIRCLE_DEG) / Math.PI;
    return (degrees + ColorCritiqueService.FULL_CIRCLE_DEG) % ColorCritiqueService.FULL_CIRCLE_DEG;
  }

  private static circularDistance(first: number, second: number): number {
    const diff = Math.abs(first - second) % ColorCritiqueService.FULL_CIRCLE_DEG;
    return diff > ColorCritiqueService.HALF_CIRCLE_DEG ? ColorCritiqueService.FULL_CIRCLE_DEG - diff : diff;
  }

  private static largestGroundObject(raster: Raster): RasterObject | undefined {
    const candidates = raster.objects.filter(
      (candidate) => !IdUtil.isOneOf(ColorCritiqueService.BACKGROUND_KINDS, candidate.kind),
    );
    return candidates.toSorted((first, second) => second.area - first.area)[0];
  }
}
