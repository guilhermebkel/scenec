import type { TextRect } from "@/Protocols/CompilationProtocol.ts";
import type { Raster, RasterObject } from "@/Protocols/CritiqueProtocol.ts";
import { FormatUtil } from "@/Utils/FormatUtil.ts";
import { OklabUtil, type Lab } from "@/Utils/OklabUtil.ts";
import { PixelUtil } from "@/Utils/PixelUtil.ts";

interface WeightedObject {
  object: RasterObject;
  weight: number;
}

export class BalanceCritiqueService {
  private static readonly WEIGHT_CAP = 0.3;

  private static readonly WEIGHT_FLOOR = 0.02;

  private static readonly MAX_OFF_CENTER = 0.15;

  private static readonly BOXED_TEXT_WEIGHT = 0.25;

  private static readonly PLAIN_TEXT_WEIGHT = 0.12;

  private static readonly LAB_COMPONENTS = 3;

  static critique(raster: Raster, textRects: readonly TextRect[]): string[] {
    const objectWeights = raster.objects.map(() => 0);
    let totalWeight = 0;
    let weightedColumns = 0;
    for (let index = 0; index < raster.pixelCount; index++) {
      const weight = Math.min(BalanceCritiqueService.WEIGHT_CAP, BalanceCritiqueService.difference(raster, index));
      if (weight < BalanceCritiqueService.WEIGHT_FLOOR) {
        continue;
      }
      totalWeight += weight;
      weightedColumns += weight * (index % raster.width);
      const owner = PixelUtil.read(raster.owner, index);
      if (owner >= 0) {
        objectWeights[owner] = (objectWeights[owner] ?? 0) + weight;
      }
    }
    for (const rect of textRects) {
      const isBoxed = rect.hasBox;
      const kindWeight = isBoxed ? BalanceCritiqueService.BOXED_TEXT_WEIGHT : BalanceCritiqueService.PLAIN_TEXT_WEIGHT;
      const weight = (rect.x1 - rect.x0) * (rect.y1 - rect.y0) * raster.factor * raster.factor * kindWeight;
      totalWeight += weight;
      weightedColumns += weight * ((rect.x0 + rect.x1) / 2) * raster.factor;
    }
    if (totalWeight <= 0) {
      return [];
    }
    const center = weightedColumns / totalWeight / raster.width;
    return Math.abs(center - 0.5) > BalanceCritiqueService.MAX_OFF_CENTER
      ? [BalanceCritiqueService.leaning(raster, objectWeights, center)]
      : [];
  }

  private static difference(raster: Raster, index: number): number {
    const offset = index * BalanceCritiqueService.LAB_COMPONENTS;
    const labAt = (lab: Float32Array): Lab => [
      PixelUtil.read(lab, offset), PixelUtil.read(lab, offset + 1), PixelUtil.read(lab, offset + 2),
    ];
    return OklabUtil.distance(labAt(raster.fullLab), labAt(raster.backLab));
  }

  private static leaning(raster: Raster, objectWeights: readonly number[], center: number): string {
    const isLeft = center < 0.5;
    const middle = raster.width / 2;
    const heaviest = raster.objects
      .map((object, index): WeightedObject => ({ object, weight: objectWeights[index] ?? 0 }))
      .filter(({ object }) => {
        const objectCenter = (object.box.left + object.box.right) / 2;
        return isLeft ? objectCenter < middle : objectCenter > middle;
      })
      .sort((first, second) => second.weight - first.weight)[0];
    const side = isLeft ? "left" : "right";
    const opposite = isLeft ? "right" : "left";
    const advice = heaviest ? `move '${heaviest.object.id}' toward the center or ` : "";
    return `visual weight leans ${side} (center of mass at ${FormatUtil.percent(center)} of the width); ${advice}put something on the ${opposite} side`;
  }
}
