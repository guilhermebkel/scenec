import { ColorUtil } from "@/Utils/ColorUtil.ts";
import { BaseAsset } from "@/Resources/Assets/BaseAsset.ts";
import { ShapeUtil } from "@/Utils/ShapeUtil.ts";

export class FloorLampAsset extends BaseAsset {
  readonly id = "floor_lamp";

  readonly kind = "ground";

  readonly w = 40;

  readonly h = 150;

  readonly tags = ["abajur de chão", "luminária de chão", "luminaria de chao", "floor lamp"];

  draw(p: any, t: any) {
    return ShapeUtil.shadow(t, 14, 2.5) + ShapeUtil.ell(0, -2, 13, 3, t.ink) + ShapeUtil.rect(-1.5, -125, 3, 123, t.ink)
      + `<path d="M-16 -122 L-11 -150 L11 -150 L16 -122 Z" fill="${t.accent}"/><path d="M2 -150 L11 -150 L16 -122 L4 -122 Z" fill="${ColorUtil.sh(t.accent, -0.15)}"/>`
      + `<path d="M-16 -122 L-40 -20 L40 -20 L16 -122 Z" fill="#FFE9A8" opacity="0.12"/>`;
  }
}
