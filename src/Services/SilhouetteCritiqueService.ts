import type { AssetKind } from "@/Protocols/AssetProtocol.ts";
import type { Raster, RasterObject } from "@/Protocols/CritiqueProtocol.ts";
import type { Theme } from "@/Protocols/ThemeProtocol.ts";
import { FormatUtil } from "@/Utils/FormatUtil.ts";
import { OklabUtil, type Lab, type Rgb } from "@/Utils/OklabUtil.ts";
import { PixelUtil } from "@/Utils/PixelUtil.ts";

type Third = 0 | 1 | 2;

interface Tally {
  edgeCount: [number, number, number];
  lostCount: [number, number, number];
  neighborToCount: [Map<string, number>, Map<string, number>, Map<string, number>];
  colorSum: [number[], number[], number[]];
}

interface EdgePixel {
  objectIndex: number;
  third: Third;
  index: number;
  row: number;
  column: number;
  alpha: Uint8Array;
}

const BACKGROUND_NEIGHBOR = "(background)";

export class SilhouetteCritiqueService {
  private static readonly MIN_AREA = 40;

  private static readonly MIN_EDGE_PIXELS = 24;

  private static readonly MIN_LOST_SHARE = 0.3;

  private static readonly MIN_LOST_PIXELS = 12;

  private static readonly MIN_PART_SHARE = 0.4;

  private static readonly MIN_PART_PIXELS = 10;

  private static readonly SOLID_ALPHA = 25;

  private static readonly PROBE = 2;

  private static readonly SAME_COLOR_DISTANCE = 0.06;

  private static readonly TOKEN_DISTANCE = 0.03;

  private static readonly HEX_COLOR = /^#[0-9a-f]{6}$/i;

  private static readonly LAB_COMPONENTS = 3;

  private static readonly CHANNELS = 4;

  private static readonly COLOR_CHANNELS = 3;

  private static readonly LAST_THIRD = 2;

  private static readonly THIRD_NAMES = ["top", "middle", "bottom"] as const;

  private static readonly THIRDS: readonly Third[] = [0, 1, 2];

  private static readonly NEIGHBOR_OFFSETS: readonly (readonly [number, number])[] = [
    [SilhouetteCritiqueService.PROBE, 0],
    [-SilhouetteCritiqueService.PROBE, 0],
    [0, SilhouetteCritiqueService.PROBE],
    [0, -SilhouetteCritiqueService.PROBE],
  ];

  private static readonly UNJUDGED_KINDS: readonly AssetKind[] = ["sky", "floor"];

  static critique(raster: Raster, theme: Theme): string[] {
    const tokens = Object.entries(theme).filter(
      (entry): entry is [string, string] => typeof entry[1] === "string"
        && SilhouetteCritiqueService.HEX_COLOR.test(entry[1]),
    );
    return raster.objects.flatMap((object, objectIndex) => {
      const isJudged = object.area >= SilhouetteCritiqueService.MIN_AREA
        && !SilhouetteCritiqueService.UNJUDGED_KINDS.includes(object.kind);
      return isJudged ? SilhouetteCritiqueService.critiqueObject(raster, { object, objectIndex }, tokens) : [];
    });
  }

  private static critiqueObject(
    raster: Raster,
    target: { object: RasterObject; objectIndex: number },
    tokens: readonly (readonly [string, string])[],
  ): string[] {
    const tally = SilhouetteCritiqueService.tally(raster, target);
    const edgeTotal = tally.edgeCount[0] + tally.edgeCount[1] + tally.edgeCount[2];
    const lostTotal = tally.lostCount[0] + tally.lostCount[1] + tally.lostCount[2];
    if (edgeTotal < SilhouetteCritiqueService.MIN_EDGE_PIXELS) {
      return [];
    }
    const worst = SilhouetteCritiqueService.worstThird(tally);
    const lostInWorst = tally.lostCount[worst];
    const partShare = lostInWorst / Math.max(1, tally.edgeCount[worst]);
    const isWholeOutlineLost = lostTotal / edgeTotal >= SilhouetteCritiqueService.MIN_LOST_SHARE
      && lostTotal >= SilhouetteCritiqueService.MIN_LOST_PIXELS;
    const isPartLost = partShare >= SilhouetteCritiqueService.MIN_PART_SHARE
      && lostInWorst >= SilhouetteCritiqueService.MIN_PART_PIXELS;
    if (!isWholeOutlineLost && !isPartLost) {
      return [];
    }
    const [redSum = 0, greenSum = 0, blueSum = 0] = tally.colorSum[worst];
    const color: Rgb = [redSum / lostInWorst, greenSum / lostInWorst, blueSum / lostInWorst];
    const token = SilhouetteCritiqueService.tokenOf(color, tokens);
    const neighbor = SilhouetteCritiqueService.mainNeighbor(tally.neighborToCount[worst]);
    const who = neighbor === BACKGROUND_NEIGHBOR ? "the background" : `'${neighbor}'`;
    const part = SilhouetteCritiqueService.THIRD_NAMES[worst];
    return [
      `'${target.object.id}' blends into ${who} in the ${part} part `
      + `(${FormatUtil.percent(partShare)} of this outline has no contrast): `
      + `the color ${OklabUtil.toHex(...color)}${token ? ` (${token})` : ""} is too close; `
      + "change the color of one of the two",
    ];
  }

  private static mainNeighbor(neighborToCount: ReadonlyMap<string, number>): string {
    const ranked = [...neighborToCount].sort((first, second) => second[1] - first[1]);
    return ranked[0]?.[0] ?? BACKGROUND_NEIGHBOR;
  }

  private static worstThird(tally: Tally): Third {
    const lostShare = (third: Third): number => tally.lostCount[third] / Math.max(1, tally.edgeCount[third]);
    const ranked = SilhouetteCritiqueService.THIRDS.toSorted((first, second) => lostShare(second) - lostShare(first));
    return ranked[0] ?? 0;
  }

  private static tally(raster: Raster, target: { object: RasterObject; objectIndex: number }): Tally {
    const { object, objectIndex } = target;
    const tally: Tally = {
      edgeCount: [0, 0, 0],
      lostCount: [0, 0, 0],
      neighborToCount: [new Map<string, number>(), new Map<string, number>(), new Map<string, number>()],
      colorSum: [[0, 0, 0], [0, 0, 0], [0, 0, 0]],
    };
    const height = Math.max(1, object.box.bottom - object.box.top + 1);
    const margin = SilhouetteCritiqueService.PROBE;
    for (let row = margin; row < raster.height - margin; row++) {
      const share = (row - object.box.top) / height;
      const scaled = Math.floor(share * SilhouetteCritiqueService.THIRD_NAMES.length);
      const third = Math.min(SilhouetteCritiqueService.LAST_THIRD, scaled) as Third;
      for (let column = margin; column < raster.width - margin; column++) {
        const index = row * raster.width + column;
        if (PixelUtil.read(raster.owner, index) === objectIndex) {
          const pixel: EdgePixel = { objectIndex, third, index, row, column, alpha: object.alpha };
          SilhouetteCritiqueService.visit(raster, tally, pixel);
        }
      }
    }
    return tally;
  }

  private static visit(raster: Raster, tally: Tally, pixel: EdgePixel): void {
    for (const [columnOffset, rowOffset] of SilhouetteCritiqueService.NEIGHBOR_OFFSETS) {
      const neighborIndex = (pixel.row + rowOffset) * raster.width + pixel.column + columnOffset;
      const neighborOwner = PixelUtil.read(raster.owner, neighborIndex);
      const isCovered = PixelUtil.read(pixel.alpha, neighborIndex) > SilhouetteCritiqueService.SOLID_ALPHA;
      if (isCovered || neighborOwner > pixel.objectIndex) {
        continue;
      }
      tally.edgeCount[pixel.third]++;
      const distance = SilhouetteCritiqueService.colorDistance(raster, pixel.index, neighborIndex);
      if (distance < SilhouetteCritiqueService.SAME_COLOR_DISTANCE) {
        SilhouetteCritiqueService.recordLoss(raster, tally, { pixel, neighborOwner });
      }
      return;
    }
  }

  private static recordLoss(raster: Raster, tally: Tally, loss: { pixel: EdgePixel; neighborOwner: number }): void {
    const { pixel, neighborOwner } = loss;
    tally.lostCount[pixel.third]++;
    const neighborId = raster.objects[neighborOwner]?.id ?? BACKGROUND_NEIGHBOR;
    const counts = tally.neighborToCount[pixel.third];
    counts.set(neighborId, (counts.get(neighborId) ?? 0) + 1);
    const sums = tally.colorSum[pixel.third];
    for (let channel = 0; channel < SilhouetteCritiqueService.COLOR_CHANNELS; channel++) {
      const value = PixelUtil.read(raster.rgba, pixel.index * SilhouetteCritiqueService.CHANNELS + channel);
      sums[channel] = (sums[channel] ?? 0) + value;
    }
  }

  private static colorDistance(raster: Raster, first: number, second: number): number {
    const labAt = (index: number): Lab => {
      const offset = index * SilhouetteCritiqueService.LAB_COMPONENTS;
      return [
        PixelUtil.read(raster.fullLab, offset),
        PixelUtil.read(raster.fullLab, offset + 1),
        PixelUtil.read(raster.fullLab, offset + 2),
      ];
    };
    return OklabUtil.distance(labAt(first), labAt(second));
  }

  private static tokenOf(color: Rgb, tokens: readonly (readonly [string, string])[]): string | null {
    // Why: an averaged color is rarely whole-numbered and only whole channels can name a theme token, as in the first version.
    if (!color.every(Number.isInteger)) {
      return null;
    }
    const target = OklabUtil.fromRgb(...color);
    let closest: string | null = null;
    let closestDistance = SilhouetteCritiqueService.TOKEN_DISTANCE;
    for (const [name, hex] of tokens) {
      const distance = OklabUtil.distance(target, OklabUtil.fromRgb(...OklabUtil.rgbOfHex(hex)));
      if (distance < closestDistance) {
        closestDistance = distance;
        closest = name;
      }
    }
    return closest;
  }
}
