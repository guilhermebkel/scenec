import type { Raster, RasterObject } from "@/Protocols/CritiqueProtocol.ts";
import { PixelUtil } from "@/Utils/PixelUtil.ts";

interface Pair {
  first: RasterObject;
  second: RasterObject;
  firstDilated: Uint8Array;
}

export class ContactCritiqueService {
  private static readonly MIN_AREA = 30;

  private static readonly NEAR_DISTANCE = 3;

  private static readonly DILATION = 2;

  private static readonly OPAQUE_ALPHA = 128;

  private static readonly MIN_NEAR_PIXELS = 4;

  private static readonly MAX_OVERLAP_PIXELS = 2;

  private static readonly MAX_OVERLAP_SHARE = 0.01;

  private static readonly MAX_EDGE_GAP = 2;

  static critique(raster: Raster): string[] {
    const candidates = raster.objects.filter(
      (object) => object.area >= ContactCritiqueService.MIN_AREA && object.kind !== "floor",
    );
    return [
      ...ContactCritiqueService.tangencies(raster, candidates),
      ...candidates.flatMap((object) => ContactCritiqueService.edgeTouches(raster, object)),
    ];
  }

  private static tangencies(raster: Raster, candidates: readonly RasterObject[]): string[] {
    const dilated = candidates.map((object) => ContactCritiqueService.dilate(raster, object));
    const messages: string[] = [];
    candidates.forEach((first, firstIndex) => {
      const firstDilated = dilated[firstIndex] ?? new Uint8Array(0);
      for (const second of candidates.slice(firstIndex + 1)) {
        if (ContactCritiqueService.isTangent(raster, { first, second, firstDilated })) {
          messages.push(
            `'${first.id}' and '${second.id}' almost touch (tangency); move them apart a little or overlap them on purpose`,
          );
        }
      }
    });
    return messages;
  }

  private static isTangent(raster: Raster, pair: Pair): boolean {
    const { first, second } = pair;
    const isRelated = first.related.includes(second.id) || second.related.includes(first.id);
    if (isRelated || !ContactCritiqueService.boxesAreClose(first, second)) {
      return false;
    }
    const { near, overlap } = ContactCritiqueService.countContacts(raster, pair);
    const allowedOverlap = Math.max(
      ContactCritiqueService.MAX_OVERLAP_PIXELS,
      ContactCritiqueService.MAX_OVERLAP_SHARE * Math.min(first.area, second.area),
    );
    return near >= ContactCritiqueService.MIN_NEAR_PIXELS && overlap <= allowedOverlap;
  }

  private static boxesAreClose(first: RasterObject, second: RasterObject): boolean {
    const distance = ContactCritiqueService.NEAR_DISTANCE;
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
      if (PixelUtil.read(second.alpha, index) <= ContactCritiqueService.OPAQUE_ALPHA) {
        continue;
      }
      if (PixelUtil.read(first.alpha, index) > ContactCritiqueService.OPAQUE_ALPHA) {
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
      if (PixelUtil.read(object.alpha, index) > ContactCritiqueService.OPAQUE_ALPHA) {
        const center = { row: Math.trunc(index / raster.width), column: index % raster.width };
        ContactCritiqueService.stamp(dilated, raster, center);
      }
    }
    return dilated;
  }

  private static stamp(dilated: Uint8Array, raster: Raster, center: { row: number; column: number }): void {
    const reach = ContactCritiqueService.DILATION;
    const firstRow = Math.max(0, center.row - reach);
    const lastRow = Math.min(raster.height - 1, center.row + reach);
    const firstColumn = Math.max(0, center.column - reach);
    const lastColumn = Math.min(raster.width - 1, center.column + reach);
    for (let row = firstRow; row <= lastRow; row++) {
      dilated.fill(1, row * raster.width + firstColumn, row * raster.width + lastColumn + 1);
    }
  }

  private static edgeTouches(raster: Raster, object: RasterObject): string[] {
    const gaps: [string, number][] = [
      ["left", object.box.left],
      ["right", raster.width - 1 - object.box.right],
      ["top", object.box.top],
    ];
    return gaps
      .filter(([, gap]) => gap > 0 && gap <= ContactCritiqueService.MAX_EDGE_GAP)
      .map(([side]) => `'${object.id}' touches the edge (${side}); move it away from the edge or let it crop on purpose`);
  }
}
