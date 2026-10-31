import type { Raster, RasterObject } from "@/Protocols/CritiqueProtocol.ts";
import { PixelUtil } from "@/Utils/PixelUtil.ts";

interface ObjectMetrics {
  object: RasterObject;
  meanChroma: number;
  localContrast: number;
}

export class FocusCritiqueService {
  // Why: alpha above 128 marks the solid perceived shape of an SVG element.
  private static readonly OPAQUE_ALPHA = 128;

  // Why: dilating by 3 px isolates the immediate background ring surrounding an object silhouette.
  private static readonly SURROUND_DILATION_PX = 3;

  // Why: objects smaller than 30 px are minor decorative props that do not establish focal dominance.
  private static readonly MIN_AREA = 30;

  // Why: a non-focus element with chroma exceeding the focus by 0.08 draws attention away from the story focus.
  private static readonly CHROMA_MARGIN = 0.08;

  // Why: chroma below 0.16 is muted and cannot overpower a focal subject.
  private static readonly MIN_PROMINENT_CHROMA = 0.16;

  // Why: a contrast difference of 0.15 lightness units creates a noticeably stronger visual pop.
  private static readonly CONTRAST_MARGIN = 0.15;

  // Why: a focus that already has high local contrast (0.28) remains distinct even if other objects also contrast.
  private static readonly MAX_FOCUS_CONTRAST_TO_WARN = 0.28;

  // Why: chroma at or above 0.15 in OKLab represents vivid, intense color.
  private static readonly HIGH_CHROMA_THRESHOLD = 0.15;

  // Why: when more than 30% of the image has vivid saturation, the viewer suffers visual fatigue and hierarchy collapses.
  private static readonly MAX_SATURATION_AREA_SHARE = 0.30;

  // Why: LAB component index offsets for lightness, a and b channels.
  private static readonly LAB_A_OFFSET = 1;

  private static readonly LAB_B_OFFSET = 2;

  private static readonly LAB_CHANNELS = 3;

  static critique(raster: Raster, focusId?: string): string[] {
    const messages: string[] = [];
    const budgetWarning = FocusCritiqueService.saturationBudget(raster);
    if (budgetWarning) {
      messages.push(budgetWarning);
    }
    const focusObject = FocusCritiqueService.findFocus(raster, focusId);
    if (!focusObject) {
      return messages;
    }
    const candidates = raster.objects.filter(
      (candidate) => candidate.area >= FocusCritiqueService.MIN_AREA && candidate.kind !== "floor",
    );
    const focusMetrics = FocusCritiqueService.metricsOf(raster, focusObject);
    for (const candidate of candidates) {
      if (FocusCritiqueService.isIgnoredCandidate(candidate, focusObject)) {
        continue;
      }
      const otherMetrics = FocusCritiqueService.metricsOf(raster, candidate);
      const comparison = FocusCritiqueService.compare(focusMetrics, otherMetrics);
      if (comparison) {
        messages.push(comparison);
      }
    }
    return messages;
  }

  private static isIgnoredCandidate(candidate: RasterObject, focus: RasterObject): boolean {
    if (candidate.id === focus.id || candidate.related.includes(focus.id) || focus.related.includes(candidate.id)) {
      return true;
    }
    const candidatePrefix = candidate.id.includes("_") ? candidate.id.slice(0, candidate.id.indexOf("_")) : null;
    const focusPrefix = focus.id.includes("_") ? focus.id.slice(0, focus.id.indexOf("_")) : null;
    return candidatePrefix !== null && candidatePrefix === focusPrefix;
  }

  private static findFocus(raster: Raster, focusId?: string): RasterObject | undefined {
    const targetId = focusId ?? raster.focusId;
    if (targetId) {
      const match = raster.objects.find((candidate) => candidate.id === targetId || candidate.id.startsWith(`${targetId}_`));
      if (match) {
        return match;
      }
    }
    const flagged = raster.objects.find((candidate) => candidate.isFocus);
    if (flagged) {
      return flagged;
    }
    const people = raster.objects.filter(
      (candidate) => candidate.asset === "person" && candidate.area >= FocusCritiqueService.MIN_AREA,
    );
    return people.toSorted((first, second) => second.area - first.area)[0];
  }

  private static metricsOf(raster: Raster, object: RasterObject): ObjectMetrics {
    let sumL = 0;
    let sumChroma = 0;
    let count = 0;
    for (let index = 0; index < raster.pixelCount; index++) {
      if (PixelUtil.read(object.alpha, index) > FocusCritiqueService.OPAQUE_ALPHA) {
        const offset = index * FocusCritiqueService.LAB_CHANNELS;
        const lightness = raster.fullLab[offset] ?? 0;
        const componentA = raster.fullLab[offset + FocusCritiqueService.LAB_A_OFFSET] ?? 0;
        const componentB = raster.fullLab[offset + FocusCritiqueService.LAB_B_OFFSET] ?? 0;
        sumL += lightness;
        sumChroma += Math.hypot(componentA, componentB);
        count++;
      }
    }
    const meanL = count > 0 ? sumL / count : 0;
    const meanChroma = count > 0 ? sumChroma / count : 0;
    const localContrast = FocusCritiqueService.contrastAgainstSurround(raster, object, meanL);
    return { object, meanChroma, localContrast };
  }

  private static contrastAgainstSurround(raster: Raster, object: RasterObject, objectL: number): number {
    const dilated = FocusCritiqueService.dilate(raster, object);
    let sumSurroundL = 0;
    let surroundCount = 0;
    for (let index = 0; index < raster.pixelCount; index++) {
      if (dilated[index] === 1 && PixelUtil.read(object.alpha, index) <= FocusCritiqueService.OPAQUE_ALPHA) {
        const offset = index * FocusCritiqueService.LAB_CHANNELS;
        sumSurroundL += raster.fullLab[offset] ?? 0;
        surroundCount++;
      }
    }
    if (surroundCount === 0) {
      return 0;
    }
    const meanSurroundL = sumSurroundL / surroundCount;
    return Math.abs(objectL - meanSurroundL);
  }

  private static compare(focus: ObjectMetrics, other: ObjectMetrics): string | null {
    const isChromaHigher = other.meanChroma > focus.meanChroma + FocusCritiqueService.CHROMA_MARGIN
      && other.meanChroma >= FocusCritiqueService.MIN_PROMINENT_CHROMA;
    if (isChromaHigher) {
      const otherValue = other.meanChroma.toFixed(2);
      const focusValue = focus.meanChroma.toFixed(2);
      return `'${other.object.id}' draws more attention than the focus '${focus.object.id}' (chroma ${otherValue} vs ${focusValue}); make '${other.object.id}' less saturated or the focus brighter`;
    }
    const isContrastHigher = other.localContrast > focus.localContrast + FocusCritiqueService.CONTRAST_MARGIN
      && focus.localContrast < FocusCritiqueService.MAX_FOCUS_CONTRAST_TO_WARN;
    if (isContrastHigher) {
      const otherValue = other.localContrast.toFixed(2);
      const focusValue = focus.localContrast.toFixed(2);
      return `'${other.object.id}' draws more attention than the focus '${focus.object.id}' (contrast ${otherValue} vs ${focusValue}); make '${other.object.id}' less saturated or the focus brighter`;
    }
    return null;
  }

  private static saturationBudget(raster: Raster): string | null {
    let saturatedCount = 0;
    for (let index = 0; index < raster.pixelCount; index++) {
      const offset = index * FocusCritiqueService.LAB_CHANNELS;
      const componentA = raster.fullLab[offset + FocusCritiqueService.LAB_A_OFFSET] ?? 0;
      const componentB = raster.fullLab[offset + FocusCritiqueService.LAB_B_OFFSET] ?? 0;
      if (Math.hypot(componentA, componentB) >= FocusCritiqueService.HIGH_CHROMA_THRESHOLD) {
        saturatedCount++;
      }
    }
    const share = saturatedCount / raster.pixelCount;
    if (share > FocusCritiqueService.MAX_SATURATION_AREA_SHARE) {
      const percent = Math.round(share * 100);
      return `too much saturated color (${percent}% of the frame); reduce saturation on large background areas`;
    }
    return null;
  }

  private static dilate(raster: Raster, object: RasterObject): Uint8Array {
    const dilated = new Uint8Array(raster.pixelCount);
    const reach = FocusCritiqueService.SURROUND_DILATION_PX;
    for (let index = 0; index < raster.pixelCount; index++) {
      if (PixelUtil.read(object.alpha, index) > FocusCritiqueService.OPAQUE_ALPHA) {
        const centerRow = Math.trunc(index / raster.width);
        const centerCol = index % raster.width;
        const firstRow = Math.max(0, centerRow - reach);
        const lastRow = Math.min(raster.height - 1, centerRow + reach);
        const firstCol = Math.max(0, centerCol - reach);
        const lastCol = Math.min(raster.width - 1, centerCol + reach);
        for (let row = firstRow; row <= lastRow; row++) {
          dilated.fill(1, row * raster.width + firstCol, row * raster.width + lastCol + 1);
        }
      }
    }
    return dilated;
  }
}
