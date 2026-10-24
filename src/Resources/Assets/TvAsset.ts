import type { AssetParams, Theme } from "@/Protocols/AssetProtocol.ts";
import { ColorUtil } from "@/Utils/ColorUtil.ts";
import { BaseAsset } from "@/Resources/Assets/BaseAsset.ts";
import { ShapeUtil } from "@/Utils/ShapeUtil.ts";

export class TvAsset extends BaseAsset {
  readonly id = "tv";

  readonly kind = "any";

  readonly width = 90;

  readonly height = 58;

  readonly tags = ["tv", "televisão", "televisao", "television"];

  draw(params: AssetParams, theme: Theme) {
    return ShapeUtil.rect(-10, -6, 20, 6, theme.ink, 2) + ShapeUtil.rect(-3, -10, 6, 5, theme.ink) + ShapeUtil.rect(-45, -58, 90, 50, theme.ink, 4) + ShapeUtil.rect(-41, -54, 82, 42, ColorUtil.sh(theme.glass, -0.35), 2)
      + `<path d="M-41 -54 L-10 -54 L-41 -20 Z" fill="${theme.paper}" opacity="0.12"/>` + ShapeUtil.circle(14, -36, 9, theme.accent, "opacity=\"0.8\"") + `<path d="M-41 -12 L-20 -30 L-5 -18 L10 -28 L41 -12 Z" fill="${theme.secondary}" opacity="0.8"/>`;
  }
}
