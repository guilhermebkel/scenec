import { ColorUtil } from "@/Utils/ColorUtil.ts";
import { BaseAsset } from "@/Resources/Assets/BaseAsset.ts";
import { ShapeUtil } from "@/Utils/ShapeUtil.ts";

export class SandcastleAsset extends BaseAsset {
  readonly id = "sandcastle";

  readonly kind = "ground";

  readonly w = 46;

  readonly h = 40;

  readonly tags = ["castelo de areia", "sand castle"];

  draw(p: any, t: any) {
    const s = t.groundDark || t.ground;
    return ShapeUtil.shadow(t, 24, 3) + ShapeUtil.rect(-20, -18, 40, 18, s) + ShapeUtil.rect(-22, -32, 12, 14, s) + ShapeUtil.rect(10, -32, 12, 14, s) + ShapeUtil.rect(-6, -40, 12, 22, ColorUtil.sh(s, -0.08))
      + [-22, -16, 10, 16].map((x) => ShapeUtil.rect(x, -36, 4, 4, s)).join("") + ShapeUtil.rect(-3, -12, 6, 12, ColorUtil.sh(s, -0.25), 3) + `<path d="M0 -40 L0 -50 L7 -47 L0 -44" stroke="${t.ink}" stroke-width="1.2" fill="${t.primary}"/>` + ShapeUtil.rect(8, -18, 12, 18, ColorUtil.sh(s, -0.12));
  }
}
