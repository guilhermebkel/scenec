import type { Raster, RasterObject } from "@/Protocols/CritiqueProtocol.ts";
import { PixelUtil } from "@/Utils/PixelUtil.ts";

interface Pair {
  first: RasterObject;
  second: RasterObject;
  firstDilated: Uint8Array;
}

export class TangentCritiqueService {
  // Why: objects with fewer pixels than an icon are details or props and cannot form a prominent tangent.
  private static readonly MIN_AREA = 30;

  // Why: shapes whose bounding boxes are further apart than 4 px cannot touch after dilation.
  private static readonly NEAR_DISTANCE_PX = 4;

  // Why: a 2 px dilation radius detects edges that sit within a 2 px gap of each other.
  private static readonly DILATION_PX = 2;

  // Why: alpha above 128 defines the perceived solid boundary of an antialiased SVG element.
  private static readonly OPAQUE_ALPHA = 128;

  // Why: at least 4 meeting pixels are required to avoid single-pixel antialiasing noise.
  private static readonly MIN_NEAR_PIXELS = 4;

  // Why: accidental edge touches overlap by only 1 to 2 pixels.
  private static readonly MAX_ALMOST_TOUCH_PIXELS = 2;

  // Why: sky elements touching ground crowns with under 8% overlap create visual ambiguity.
  private static readonly MAX_SKY_OVERLAP_SHARE = 0.08;

  // Why: a 2 px gap to the horizon creates an awkward tangent resting right on the horizon line.
  private static readonly HORIZON_GAP_PX = 2;

  // Why: an object stopping 1 to 2 px short of the frame edge creates an accidental edge tangent.
  private static readonly MAX_EDGE_GAP_PX = 2;

  // Why: a gap under 8 px looks like an accidental touch rather than deliberate composition spacing.
  private static readonly MIN_GAP_PX = 8;

  static critique(raster: Raster): string[] {
    const candidates = raster.objects.filter(
      (object) => object.area >= TangentCritiqueService.MIN_AREA && object.kind !== "floor",
    );
    return [
      ...TangentCritiqueService.tangencies(raster, candidates),
      ...candidates.flatMap((object) => TangentCritiqueService.horizonTouches(raster, object)),
      ...candidates.flatMap((object) => TangentCritiqueService.edgeTouches(raster, object)),
    ];
  }

  private static tangencies(raster: Raster, candidates: readonly RasterObject[]): string[] {
    const dilated = candidates.map((object) => TangentCritiqueService.dilate(raster, object));
    const messages: string[] = [];
    candidates.forEach((first, firstIndex) => {
      const firstDilated = dilated[firstIndex] ?? new Uint8Array(0);
      for (const second of candidates.slice(firstIndex + 1)) {
        if (TangentCritiqueService.isTangent(raster, { first, second, firstDilated })) {
          messages.push(
            `'${first.id}' just touches '${second.id}' (tangent); overlap them clearly or leave a gap of at least ${TangentCritiqueService.MIN_GAP_PX} px`,
          );
        }
      }
    });
    return messages;
  }

  private static isTangent(raster: Raster, pair: Pair): boolean {
    const { first, second } = pair;
    if (TangentCritiqueService.isIgnoredPair(first, second) || !TangentCritiqueService.boxesAreClose(first, second)) {
      return false;
    }
    const { near, overlap } = TangentCritiqueService.countContacts(raster, pair);
    const minArea = Math.min(first.area, second.area);
    const isNearTouch = near >= TangentCritiqueService.MIN_NEAR_PIXELS
      && overlap <= TangentCritiqueService.MAX_ALMOST_TOUCH_PIXELS;
    const hasSky = first.kind === "sky" || second.kind === "sky";
    const isSkyTouch = hasSky
      && near > 0
      && overlap <= TangentCritiqueService.MAX_SKY_OVERLAP_SHARE * minArea;
    return isNearTouch || isSkyTouch;
  }

  private static isIgnoredPair(first: RasterObject, second: RasterObject): boolean {
    if (first.related.includes(second.id) || second.related.includes(first.id)) {
      return true;
    }
    const firstPrefix = first.id.includes("_") ? first.id.slice(0, first.id.indexOf("_")) : null;
    const secondPrefix = second.id.includes("_") ? second.id.slice(0, second.id.indexOf("_")) : null;
    return firstPrefix !== null && firstPrefix === secondPrefix;
  }

  private static boxesAreClose(first: RasterObject, second: RasterObject): boolean {
    const distance = TangentCritiqueService.NEAR_DISTANCE_PX;
    const isApartHorizontally = first.box.right + distance < second.box.left
      || second.box.right + distance < first.box.left;
    const isApartVertically = first.box.bottom + distance < second.box.top
      || second.box.bottom + distance < first.box.top;
    return !isApartHorizontally && !isApartVertically;
  }

  private static countContacts(raster: Raster, pair: Pair): { near: number; overlap: number } {
    const { first, second, firstDilated } = pair;
    let near = 0;
    let overlap = 0;
    for (let index = 0; index < raster.pixelCount; index++) {
      if (PixelUtil.read(second.alpha, index) <= TangentCritiqueService.OPAQUE_ALPHA) {
        continue;
      }
      if (PixelUtil.read(first.alpha, index) > TangentCritiqueService.OPAQUE_ALPHA) {
        overlap++;
      } else if (PixelUtil.read(firstDilated, index) > 0) {
        near++;
      }
    }
    return { near, overlap };
  }

  private static dilate(raster: Raster, object: RasterObject): Uint8Array {
    const dilated = new Uint8Array(raster.pixelCount);
    for (let index = 0; index < raster.pixelCount; index++) {
      if (PixelUtil.read(object.alpha, index) > TangentCritiqueService.OPAQUE_ALPHA) {
        const center = { row: Math.trunc(index / raster.width), column: index % raster.width };
        TangentCritiqueService.stamp(dilated, raster, center);
      }
    }
    return dilated;
  }

  private static stamp(dilated: Uint8Array, raster: Raster, center: { row: number; column: number }): void {
    const reach = TangentCritiqueService.DILATION_PX;
    const firstRow = Math.max(0, center.row - reach);
    const lastRow = Math.min(raster.height - 1, center.row + reach);
    const firstColumn = Math.max(0, center.column - reach);
    const lastColumn = Math.min(raster.width - 1, center.column + reach);
    for (let row = firstRow; row <= lastRow; row++) {
      dilated.fill(1, row * raster.width + firstColumn, row * raster.width + lastColumn + 1);
    }
  }

  private static horizonTouches(raster: Raster, object: RasterObject): string[] {
    if (raster.horizonRatio == null || object.kind === "sky") {
      return [];
    }
    const horizonY = Math.round(raster.height * raster.horizonRatio);
    const tolerancePx = TangentCritiqueService.HORIZON_GAP_PX;
    const isTopAtHorizon = Math.abs(object.box.top - horizonY) <= tolerancePx;
    const isBottomAtHorizon = Math.abs(object.box.bottom - horizonY) <= tolerancePx;
    const isSpanningAcross = object.box.top < horizonY - 1
      && object.box.bottom > horizonY + 1;
    if ((isTopAtHorizon || isBottomAtHorizon) && !isSpanningAcross) {
      return [`'${object.id}' touches the horizon; move it above or below`];
    }
    return [];
  }

  private static edgeTouches(raster: Raster, object: RasterObject): string[] {
    const maxEdgeGap = TangentCritiqueService.MAX_EDGE_GAP_PX;
    const gaps: [string, number][] = [
      ["left", object.box.left],
      ["right", raster.width - 1 - object.box.right],
      ["top", object.box.top],
    ];
    return gaps
      .filter(([, gap]) => gap > 0 && gap <= maxEdgeGap)
      .map(([side]) => `'${object.id}' touches the edge (${side}); move it away from the edge or let it crop on purpose`);
  }
}
