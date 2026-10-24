import type { AssetParams, Theme } from "@/Protocols/AssetProtocol.ts";
import { ColorUtil } from "@/Utils/ColorUtil.ts";
import { BaseAsset } from "@/Resources/Assets/BaseAsset.ts";
import { ShapeUtil } from "@/Utils/ShapeUtil.ts";

export class BurgerAsset extends BaseAsset {
  readonly id = "burger";

  readonly kind = "surface";

  readonly width = 22;

  readonly height = 18;

  readonly tags = ["hambúrguer", "hamburguer", "sanduíche", "lanche"];

  draw(params: AssetParams, theme: Theme) {
    return ShapeUtil.rect(-10, -4, 20, 4, "#D99A4E", 2) + ShapeUtil.rect(-11, -8, 22, 4, "#5A3322", 2) + `<path d="M-12 -9 L12 -9 L9 -7 L5 -9 L1 -7 L-3 -9 L-7 -7 Z" fill="#8DBA4A"/>` + ShapeUtil.rect(-11, -10, 22, 2, "#F2C14E")
      + `<path d="M-10 -10 Q-10 -18 0 -18 Q10 -18 10 -10 Z" fill="#D99A4E"/>` + `<path d="M3 -18 Q10 -18 10 -10 L5 -10 Z" fill="${ColorUtil.sh("#D99A4E", -0.12)}"/>` + ShapeUtil.circle(-3, -14, 0.8, "#FFF3D6") + ShapeUtil.circle(2, -15.5, 0.8, "#FFF3D6");
  }
}
