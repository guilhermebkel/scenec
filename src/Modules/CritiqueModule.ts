import { Resvg } from "@resvg/resvg-js";
import type { CritiqueInput, CritiqueObject } from "@/Protocols/CompilationProtocol.ts";
import { BalanceCritiqueService } from "@/Services/BalanceCritiqueService.ts";
import { ColorCritiqueService } from "@/Services/ColorCritiqueService.ts";
import { CoverageCritiqueService } from "@/Services/CoverageCritiqueService.ts";
import { FocusCritiqueService } from "@/Services/FocusCritiqueService.ts";
import { RasterService } from "@/Services/RasterService.ts";
import { ScaleCritiqueService } from "@/Services/ScaleCritiqueService.ts";
import { SilhouetteCritiqueService } from "@/Services/SilhouetteCritiqueService.ts";
import { TangentCritiqueService } from "@/Services/TangentCritiqueService.ts";
import { ThumbnailCritiqueService } from "@/Services/ThumbnailCritiqueService.ts";

export class CritiqueModule {
  private static readonly ANALYSIS_WIDTH = 320;

  private static readonly THUMBNAIL_WIDTH = 96;

  private static readonly DEFS = /<defs>[\s\S]*?<\/defs>/;

  static critique(input: CritiqueInput): string[] {
    const { width, height, head, bg, scene, objects, theme, scale, textRects, skip, focusId, horizon, setting } = input;
    const factor = CritiqueModule.ANALYSIS_WIDTH / width;
    const render = (inner: string): Uint8Array => new Resvg(`${head}${inner}</svg>`, {
      fitTo: { mode: "width", value: CritiqueModule.ANALYSIS_WIDTH },
      font: { loadSystemFonts: false },
    }).render().pixels;
    const defs = CritiqueModule.DEFS.exec(bg)?.[0] ?? "";
    const layers = objects
      .filter((object) => !object.isIgnored)
      .toSorted((first, second) => first.z - second.z)
      .map((object) => ({
        id: object.id,
        asset: object.asset,
        kind: object.kind,
        related: object.related,
        pixels: render(defs + object.body),
        isFocus: object.isFocus ?? false,
        height: object.height ?? 0,
        depth: object.depth ?? null,
      }));
    const raster = RasterService.build({
      width: CritiqueModule.ANALYSIS_WIDTH,
      height: Math.max(1, Math.round(height * factor)),
      factor,
      fullPixels: render(scene),
      backPixels: render(bg),
      layers,
      horizonRatio: horizon,
      setting,
      focusId,
    });
    const thumbnailMessages = skip.includes("thumbnail")
      ? []
      : CritiqueModule.runThumbnailCritique(input, defs);
    const messages = [
      ...CoverageCritiqueService.critique(raster, textRects, scale),
      ...BalanceCritiqueService.critique(raster, textRects),
      ...(skip.includes("silhouette") ? [] : SilhouetteCritiqueService.critique(raster, theme)),
      ...(skip.includes("tangent") || skip.includes("contact") ? [] : TangentCritiqueService.critique(raster)),
      ...(skip.includes("focus") ? [] : FocusCritiqueService.critique(raster, focusId)),
      ...(skip.includes("color") ? [] : ColorCritiqueService.critique(raster)),
      ...(skip.includes("scale") ? [] : ScaleCritiqueService.critique(input)),
      ...thumbnailMessages,
    ];
    return messages.map((message) => `art: ${message}`);
  }

  private static runThumbnailCritique(input: CritiqueInput, defs: string): string[] {
    const { width, height, head, scene, objects, focusId, title } = input;
    const thumbnailHeight = Math.max(1, Math.round(height * (CritiqueModule.THUMBNAIL_WIDTH / width)));
    const renderThumbnail = (inner: string): Uint8Array => new Resvg(`${head}${inner}</svg>`, {
      fitTo: { mode: "width", value: CritiqueModule.THUMBNAIL_WIDTH },
      font: { loadSystemFonts: false },
    }).render().pixels;
    const focusTarget = CritiqueModule.findFocusObject(objects, focusId);
    let focusObject: { id: string; pixels: Uint8Array } | undefined;
    if (focusTarget) {
      focusObject = {
        id: focusTarget.id,
        pixels: renderThumbnail(defs + focusTarget.body),
      };
    }
    return ThumbnailCritiqueService.critique({
      thumbnailPixels: renderThumbnail(scene),
      thumbnailWidth: CritiqueModule.THUMBNAIL_WIDTH,
      thumbnailHeight,
      sceneWidth: width,
      focusObject,
      title,
    });
  }

  private static findFocusObject(objects: readonly CritiqueObject[], focusId?: string): CritiqueObject | undefined {
    if (focusId) {
      const match = objects.find((object) => object.id === focusId || object.id.startsWith(`${focusId}_`));
      if (match) {
        return match;
      }
    }
    const flagged = objects.find((object) => object.isFocus);
    if (flagged) {
      return flagged;
    }
    const people = objects.filter((object) => object.asset === "person" && !object.isIgnored);
    return people.toSorted((first, second) => (second.height ?? 0) - (first.height ?? 0))[0];
  }
}
