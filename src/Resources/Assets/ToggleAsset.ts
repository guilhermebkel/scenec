import type { AssetParams, Theme } from "@/Protocols/AssetProtocol.ts";
import { ColorUtil } from "@/Utils/ColorUtil.ts";
import { BaseAsset } from "@/Resources/Assets/BaseAsset.ts";
import { ShapeUtil } from "@/Utils/ShapeUtil.ts";

export class ToggleAsset extends BaseAsset {
  readonly id = "toggle";

  readonly kind = "wall";

  readonly width = 52;

  readonly height = 28;

  readonly elevation = 100;

  readonly tags = ["toggle", "switch", "interruptor_ui", "ui_switch", "button_toggle"];

  draw(params: AssetParams, theme: Theme) {
    const isOff = params.off ?? false;
    const bg = isOff ? theme.metal : ShapeUtil.color(theme, params.color, theme.accent);
    const knobX = isOff ? -13 : 13;
    const knobColor = theme.paper;
    return ShapeUtil.rect(-26, -28, 52, 28, bg, { rx: 14 })
      + ShapeUtil.circle(knobX, -14, 11, knobColor)
      + ShapeUtil.circle(knobX, -14, 11, "none", `stroke="${ColorUtil.sh(knobColor, -0.1)}" stroke-width="1"`);
  }
}
