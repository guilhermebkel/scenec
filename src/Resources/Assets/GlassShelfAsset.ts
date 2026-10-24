import { ColorUtil } from "@/Utils/ColorUtil.ts";
import { BaseAsset } from "@/Resources/Assets/BaseAsset.ts";
import { ShapeUtil } from "@/Utils/ShapeUtil.ts";

export class GlassShelfAsset extends BaseAsset {
  readonly id = "glass_shelf";

  readonly kind = "ground";

  readonly hollow = true;

  readonly w = 14;

  readonly h = 46;

  readonly top = 46;

  readonly tags = ["prateleira de vidro", "vidro", "glass shelf"];

  size(p: any) { return ({ w: p.width || 14, h: p.height || 46 }); }

  topOf(p: any) { return p.height || 46; }

  draw(p: any, t: any) {
    const w = p.width || 14, h = p.height || 46;
    return `<path d="M${-w / 2} ${-h + 1.6} L${w / 2} ${-h + 1.6} L${w / 2} ${-h} L${-w / 2 + 2} ${-h} Z" fill="${t.glass}" opacity="0.55"/>` +
          `<path d="M${-w / 2} ${-h + 1.6} L${w / 2} ${-h + 1.6}" stroke="${ColorUtil.sh(t.glass, -0.35)}" stroke-width="0.5"/>` + ShapeUtil.rect(-w / 2, -h + 1.6, w, 1.2, t.ink, 0, "opacity=\"0.08\"");
  }
}
