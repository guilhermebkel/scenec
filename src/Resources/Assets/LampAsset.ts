import { ColorUtil } from "@/Utils/ColorUtil.ts";
import { BaseAsset } from "@/Resources/Assets/BaseAsset.ts";
import { ShapeUtil } from "@/Utils/ShapeUtil.ts";

export class LampAsset extends BaseAsset {
  readonly id = "lamp";

  readonly kind = "surface";

  readonly w = 30;

  readonly h = 42;

  readonly tags = ["luminária", "luminaria", "desk_lamp"];

  draw(p: any, t: any) {
    return ShapeUtil.rect(-10, -3, 20, 3, t.ink, 1.5) + `<path d="M-2 -3 L-8 -26 L8 -36" stroke="${t.ink}" stroke-width="2.5" fill="none" stroke-linejoin="round"/>`
      + `<path d="M2 -42 L18 -30 L10 -24 Z" fill="${t.accent}"/><path d="M10 -36 L18 -30 L10 -24 Z" fill="${ColorUtil.sh(t.accent, -0.15)}"/>` + `<path d="M14 -27 L26 -2 L-2 -2 Z" fill="${t.accent}" opacity="0.13"/>`;
  }
}
