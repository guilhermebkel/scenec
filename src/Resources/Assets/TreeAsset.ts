import type { AssetParams, Theme } from "@/Protocols/AssetProtocol.ts";
import { ColorUtil } from "@/Utils/ColorUtil.ts";
import { BaseAsset } from "@/Resources/Assets/BaseAsset.ts";
import { ShapeUtil } from "@/Utils/ShapeUtil.ts";

export class TreeAsset extends BaseAsset {
  readonly id = "tree";

  readonly kind = "ground";

  readonly width = 115;

  readonly height = 205;

  readonly tags = ["árvore", "arvore", "tree_round", "oak"];

  draw(params: AssetParams, theme: Theme) {
    const [first, second, color] = theme.foliage;
    return ShapeUtil.shadow(theme, 46, 4.5)
      + `<path d="M-8 0 L-5 -95 L5 -95 L8 0 Z" fill="${theme.trunk}"/><path d="M1 0 L1.5 -95 L5 -95 L8 0 Z" fill="${ColorUtil.sh(theme.trunk, -0.2)}"/>`
      + `<path d="M0 -80 L-22 -110 M0 -95 L20 -120" stroke="${theme.trunk}" stroke-width="5" stroke-linecap="round"/>`
      + ShapeUtil.circle(-28, -125, 32, color) + ShapeUtil.circle(28, -122, 30, ColorUtil.sh(color, -0.1)) + ShapeUtil.circle(0, -155, 42, first)
      + `<path d="M0 -113 A42 42 0 0 0 42 -155 A42 42 0 0 1 10 -114 Z" fill="${ColorUtil.sh(first, -0.12)}"/>`
      + ShapeUtil.circle(-25, -138, 26, second, "opacity=\"0.9\"") + ShapeUtil.circle(-16, -172, 12, ColorUtil.sh(second, 0.18), "opacity=\"0.7\"") + ShapeUtil.circle(22, -165, 18, second, "opacity=\"0.8\"");
  }
}
