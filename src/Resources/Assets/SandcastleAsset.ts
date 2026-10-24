import type { AssetParams, Theme } from "@/Protocols/AssetProtocol.ts";
import { ColorUtil } from "@/Utils/ColorUtil.ts";
import { BaseAsset } from "@/Resources/Assets/BaseAsset.ts";
import { ShapeUtil } from "@/Utils/ShapeUtil.ts";

export class SandcastleAsset extends BaseAsset {
  readonly id = "sandcastle";

  readonly kind = "ground";

  readonly width = 46;

  readonly height = 40;

  readonly tags = ["castelo de areia", "sand castle"];

  draw(params: AssetParams, theme: Theme) {
    const svg = theme.groundDark || theme.ground;
    return ShapeUtil.shadow(theme, 24, 3) + ShapeUtil.rect(-20, -18, 40, 18, svg) + ShapeUtil.rect(-22, -32, 12, 14, svg) + ShapeUtil.rect(10, -32, 12, 14, svg) + ShapeUtil.rect(-6, -40, 12, 22, ColorUtil.sh(svg, -0.08))
      + [-22, -16, 10, 16].map((posX) => ShapeUtil.rect(posX, -36, 4, 4, svg)).join("") + ShapeUtil.rect(-3, -12, 6, 12, ColorUtil.sh(svg, -0.25), 3) + `<path d="M0 -40 L0 -50 L7 -47 L0 -44" stroke="${theme.ink}" stroke-width="1.2" fill="${theme.primary}"/>` + ShapeUtil.rect(8, -18, 12, 18, ColorUtil.sh(svg, -0.12));
  }
}
