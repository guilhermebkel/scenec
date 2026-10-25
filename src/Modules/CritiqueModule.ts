import { Resvg } from "@resvg/resvg-js";
import type { CritiqueInput } from "@/Protocols/CompilationProtocol.ts";
import { BalanceCritiqueService } from "@/Services/BalanceCritiqueService.ts";
import { ContactCritiqueService } from "@/Services/ContactCritiqueService.ts";
import { CoverageCritiqueService } from "@/Services/CoverageCritiqueService.ts";
import { RasterService } from "@/Services/RasterService.ts";
import { SilhouetteCritiqueService } from "@/Services/SilhouetteCritiqueService.ts";

export class CritiqueModule {
  private static readonly ANALYSIS_WIDTH = 320;

  private static readonly DEFS = /<defs>[\s\S]*?<\/defs>/;

  static critique(input: CritiqueInput): string[] {
    const { width, height, head, bg, scene, objects, theme, scale, textRects, skip } = input;
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
        id: object.id, kind: object.kind, related: object.related, pixels: render(defs + object.body),
      }));
    const raster = RasterService.build({
      width: CritiqueModule.ANALYSIS_WIDTH,
      height: Math.max(1, Math.round(height * factor)),
      factor,
      fullPixels: render(scene),
      backPixels: render(bg),
      layers,
    });
    const messages = [
      ...CoverageCritiqueService.critique(raster, textRects, scale),
      ...BalanceCritiqueService.critique(raster, textRects),
      ...(skip.includes("silhouette") ? [] : SilhouetteCritiqueService.critique(raster, theme)),
      ...ContactCritiqueService.critique(raster),
    ];
    return messages.map((message) => `art: ${message}`);
  }
}
