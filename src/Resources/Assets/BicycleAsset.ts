import { BaseAsset } from "@/Resources/Assets/BaseAsset.ts";
import { ShapeUtil } from "@/Utils/ShapeUtil.ts";

export class BicycleAsset extends BaseAsset {
  readonly id = "bicycle";

  readonly kind = "ground";

  readonly w = 80;

  readonly h = 48;

  readonly tags = ["bicicleta", "bike"];

  draw(p: any, t: any) {
    const c = ShapeUtil.col(t, p.color, t.secondary), f = p.facing === "left" ? -1 : 1;
    const wh = (x: any) => `<circle cx="${x}" cy="-17" r="16" fill="none" stroke="${t.ink}" stroke-width="3.5"/>` + ShapeUtil.circle(x, -17, 2.5, t.metal);
    return `<g transform="scale(${f} 1)">` + ShapeUtil.shadow(t, 40, 3) + wh(-24) + wh(24) +
          `<path d="M-24 -17 L-6 -17 L10 -38 L-12 -38 Z M-6 -17 L-14 -42 M24 -17 L14 -46" stroke="${c}" stroke-width="3.5" fill="none" stroke-linejoin="round" stroke-linecap="round"/>` +
          `<path d="M-20 -43 L-8 -43" stroke="${t.ink}" stroke-width="4" stroke-linecap="round"/><path d="M10 -47 L19 -48" stroke="${t.ink}" stroke-width="3" stroke-linecap="round"/>` + ShapeUtil.circle(-6, -17, 4, t.metal) + `</g>`;
  }
}
