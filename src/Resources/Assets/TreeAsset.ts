import { ColorUtil } from "@/Utils/ColorUtil.ts";
import { BaseAsset } from "@/Resources/Assets/BaseAsset.ts";
import { ShapeUtil } from "@/Utils/ShapeUtil.ts";

export class TreeAsset extends BaseAsset {
  readonly id = "tree";

  readonly kind = "ground";

  readonly w = 115;

  readonly h = 205;

  readonly tags = ["árvore", "arvore", "tree_round", "oak"];

  draw(p: any, t: any) {
    const [a, b, c] = t.foliage;
    return ShapeUtil.shadow(t, 46, 4.5)
      + `<path d="M-8 0 L-5 -95 L5 -95 L8 0 Z" fill="${t.trunk}"/><path d="M1 0 L1.5 -95 L5 -95 L8 0 Z" fill="${ColorUtil.sh(t.trunk, -0.2)}"/>`
      + `<path d="M0 -80 L-22 -110 M0 -95 L20 -120" stroke="${t.trunk}" stroke-width="5" stroke-linecap="round"/>`
      + ShapeUtil.circle(-28, -125, 32, c) + ShapeUtil.circle(28, -122, 30, ColorUtil.sh(c, -0.1)) + ShapeUtil.circle(0, -155, 42, a)
      + `<path d="M0 -113 A42 42 0 0 0 42 -155 A42 42 0 0 1 10 -114 Z" fill="${ColorUtil.sh(a, -0.12)}"/>`
      + ShapeUtil.circle(-25, -138, 26, b, "opacity=\"0.9\"") + ShapeUtil.circle(-16, -172, 12, ColorUtil.sh(b, 0.18), "opacity=\"0.7\"") + ShapeUtil.circle(22, -165, 18, b, "opacity=\"0.8\"");
  }
}
