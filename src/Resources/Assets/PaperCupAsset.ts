import type { AssetParams, Theme } from "@/Protocols/AssetProtocol.ts";
import { ColorUtil } from "@/Utils/ColorUtil.ts";
import { BaseAsset } from "@/Resources/Assets/BaseAsset.ts";
import { ShapeUtil } from "@/Utils/ShapeUtil.ts";

export class PaperCupAsset extends BaseAsset {
  readonly id = "paper_cup";

  readonly kind = "surface";

  readonly width = 4.5;

  readonly height = 6;

  readonly tags = ["copo de café", "café para viagem", "coffee to go"];

  draw(params: AssetParams,
    theme: Theme) {
    return `<path d="M-2 -5 L2 -5 L1.6 0 L-1.6 0 Z" fill="${theme.paper}"/><path d="M0.6 -5 L2 -5 L1.6 0 L0.6 0 Z" fill="${ColorUtil.sh(theme.paper, -0.1)}"/>`
      + ShapeUtil.rect(-2.3, -5.9, 4.6, 1, theme.ink, { rx: 0.4 }) + ShapeUtil.rect(-1.9, -3.4, 3.7, 1.6,
      ShapeUtil.color(theme, params.sleeve, theme.woodDark), { rx: 0.2 });
  }
}
