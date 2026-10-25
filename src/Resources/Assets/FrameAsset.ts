import type { AssetParams, Theme } from "@/Protocols/AssetProtocol.ts";
import { ColorUtil } from "@/Utils/ColorUtil.ts";
import { BaseAsset } from "@/Resources/Assets/BaseAsset.ts";
import { ShapeUtil } from "@/Utils/ShapeUtil.ts";

export class FrameAsset extends BaseAsset {
  readonly id = "frame";

  readonly kind = "wall";

  readonly width = 60;

  readonly height = 46;

  readonly elevation = 95;

  readonly tags = ["quadro", "picture", "painting"];

  draw(params: AssetParams, theme: Theme) {
    return ShapeUtil.rect(-29, -44, 60, 46, "rgba(0,0,0,0.08)", { rx: 2 }) + ShapeUtil.rect(-30, -46, 60, 46,
      theme.woodDark, { rx: 2 }) + ShapeUtil.rect(-25, -41, 50, 36, theme.paper)
    + `<path d="M-25 -5 L-8 -26 L2 -15 L10 -24 L25 -5 Z" fill="${theme.secondary}"/><path d="M-8 -26 L2 -15 L-4 -5 L-14 -5 Z" fill="${ColorUtil.sh(theme.secondary, -0.15)}"/>`
    + ShapeUtil.circle(12, -32, 4, theme.accent);
  }
}
