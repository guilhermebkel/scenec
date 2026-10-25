import type { AssetKind } from "@/Protocols/AssetProtocol.ts";
import type { TextRect } from "@/Protocols/CompilationProtocol.ts";
import type { Raster } from "@/Protocols/CritiqueProtocol.ts";
import { FormatUtil } from "@/Utils/FormatUtil.ts";
import { PixelUtil } from "@/Utils/PixelUtil.ts";

export class CoverageCritiqueService {
  private static readonly MIN_COVERAGE = 0.05;

  private static readonly TARGET_COVERAGE = 0.08;

  private static readonly COVERAGE_FLOOR = 0.01;

  private static readonly MAX_SUGGESTED_SCALE = 2.5;

  private static readonly EMPTY_ROW_SHARE = 0.02;

  private static readonly MIN_BAND_SHARE = 0.3;

  private static readonly SCALE_DECIMALS = 2;

  private static readonly UNCOUNTED_KINDS: readonly AssetKind[] = ["sky"];

  static critique(raster: Raster, textRects: readonly TextRect[], scale: number): string[] {
    const messages: string[] = [];
    const coverage = CoverageCritiqueService.coverageOf(raster);
    if (coverage < CoverageCritiqueService.MIN_COVERAGE && raster.objects.length > 0) {
      const suggested = Math.min(
        CoverageCritiqueService.MAX_SUGGESTED_SCALE,
        scale * Math.sqrt(
          CoverageCritiqueService.TARGET_COVERAGE / Math.max(coverage, CoverageCritiqueService.COVERAGE_FLOOR),
        ),
      );
      messages.push(
        `empty scene: objects cover only ${FormatUtil.percent(coverage)} of the frame; `
        + `move the camera closer (canvas.scale ≈ ${suggested.toFixed(CoverageCritiqueService.SCALE_DECIMALS)}) or use larger objects`,
      );
    }
    const band = CoverageCritiqueService.emptyBand(CoverageCritiqueService.occupancy(raster, textRects), raster);
    if (band.rows > raster.height * CoverageCritiqueService.MIN_BAND_SHARE) {
      const start = (band.lastRow - band.rows + 1) / raster.height;
      const end = (band.lastRow + 1) / raster.height;
      messages.push(
        `empty band of ${FormatUtil.percent(band.rows / raster.height)} of the height `
        + `(from y=${FormatUtil.percent(start)} to y=${FormatUtil.percent(end)}); `
        + "raise the main group, increase the scale or fill the band (text, wall object, sky element)",
      );
    }
    return messages;
  }

  private static coverageOf(raster: Raster): number {
    let covered = 0;
    for (let index = 0; index < raster.pixelCount; index++) {
      const object = raster.objects[PixelUtil.read(raster.owner, index)];
      if (object && !CoverageCritiqueService.UNCOUNTED_KINDS.includes(object.kind)) {
        covered++;
      }
    }
    return covered / raster.pixelCount;
  }

  private static occupancy(raster: Raster, textRects: readonly TextRect[]): Uint8Array {
    const occupied = new Uint8Array(raster.pixelCount);
    for (let index = 0; index < raster.pixelCount; index++) {
      if (PixelUtil.read(raster.owner, index) >= 0) {
        occupied[index] = 1;
      }
    }
    for (const rect of textRects) {
      const firstRow = Math.max(0, Math.floor(rect.y0 * raster.factor));
      const endRow = Math.min(raster.height, Math.ceil(rect.y1 * raster.factor));
      const firstColumn = Math.max(0, Math.floor(rect.x0 * raster.factor));
      const endColumn = Math.min(raster.width, Math.ceil(rect.x1 * raster.factor));
      for (let row = firstRow; row < endRow; row++) {
        occupied.fill(1, row * raster.width + firstColumn, row * raster.width + Math.max(firstColumn, endColumn));
      }
    }
    return occupied;
  }

  private static emptyBand(occupied: Uint8Array, raster: Raster): { rows: number; lastRow: number } {
    let run = 0;
    let best = { rows: 0, lastRow: 0 };
    for (let row = 0; row < raster.height; row++) {
      let filled = 0;
      for (let column = 0; column < raster.width; column++) {
        filled += PixelUtil.read(occupied, row * raster.width + column);
      }
      if (filled < raster.width * CoverageCritiqueService.EMPTY_ROW_SHARE) {
        run++;
        best = run > best.rows ? { rows: run, lastRow: row } : best;
      } else {
        run = 0;
      }
    }
    return best;
  }
}
