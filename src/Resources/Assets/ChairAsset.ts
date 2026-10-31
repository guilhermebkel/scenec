import type { AssetParams, Theme } from "@/Protocols/AssetProtocol.ts";
import { ColorUtil } from "@/Utils/ColorUtil.ts";
import { BaseAsset } from "@/Resources/Assets/BaseAsset.ts";
import { IdUtil } from "@/Utils/IdUtil.ts";
import { ShapeUtil } from "@/Utils/ShapeUtil.ts";

type ChairVariantKey = "2" | "stool" | "3" | "armchair";

export class ChairAsset extends BaseAsset {
  readonly id = "chair";

  readonly kind = "ground";

  readonly width = 44;

  readonly height = 88;

  readonly seat = 45;

  readonly tags = ["cadeira", "seat"];

  private static readonly VARIANT_TO_DRAWER: Record<
    ChairVariantKey,
    (asset: ChairAsset, params: AssetParams, theme: Theme) => string
  > = {
    2: (asset, params, theme) => asset.drawStool(params, theme),
    stool: (asset, params, theme) => asset.drawStool(params, theme),
    3: (asset, params, theme) => asset.drawArmchair(params, theme),
    armchair: (asset, params, theme) => asset.drawArmchair(params, theme),
  };

  draw(params: AssetParams, theme: Theme) {
    const variantKey = String(params.variant ?? "");
    const drawer = IdUtil.lookup(ChairAsset.VARIANT_TO_DRAWER, variantKey);
    return drawer ? drawer(this, params, theme) : this.drawDefault(params, theme);
  }

  private drawDefault(params: AssetParams, theme: Theme): string {
    const flip = ShapeUtil.directionOf(params.facing);
    const mainColor = ShapeUtil.color(theme, params.color, theme.secondary);
    return ShapeUtil.shadow(theme, 24, 3) + ShapeUtil.rect(-16, -40, 4, 40, theme.metal) + ShapeUtil.rect(12, -40, 4,
      40, ColorUtil.sh(theme.metal, -0.2))
    + ShapeUtil.rect(-flip * 18 - (flip > 0 ? 0 : 6), -88, 6, 49, mainColor, { rx: 3 }) + ShapeUtil.rect(-18, -45,
      36, 6, mainColor, { rx: 2 }) + ShapeUtil.rect(-18, -41, 36, 2, ColorUtil.sh(mainColor, -0.25));
  }

  private drawStool(params: AssetParams, theme: Theme): string {
    const mainColor = ShapeUtil.color(theme, params.color, theme.wood);
    const legColor = theme.woodDark;
    return ShapeUtil.shadow(theme, 18, 2.5)
      + `<path d="M-12 0 L-8 -42 M12 0 L8 -42" stroke="${legColor}" stroke-width="3" stroke-linecap="round"/>`
      + ShapeUtil.rect(-15, -46, 30, 6, mainColor, { rx: 3 })
      + ShapeUtil.rect(-15, -42, 30, 2, ColorUtil.sh(mainColor, -0.2));
  }

  private drawArmchair(params: AssetParams, theme: Theme): string {
    const mainColor = ShapeUtil.color(theme, params.color, theme.secondary);
    const darker = ColorUtil.sh(mainColor, -0.2);
    return ShapeUtil.shadow(theme, 28, 3.5)
      + ShapeUtil.rect(-18, -10, 4, 10, theme.woodDark)
      + ShapeUtil.rect(14, -10, 4, 10, theme.woodDark)
      + ShapeUtil.rect(-22, -80, 44, 42, darker, { rx: 8 })
      + ShapeUtil.rect(-20, -78, 40, 38, mainColor, { rx: 6 })
      + ShapeUtil.rect(-24, -45, 48, 35, mainColor, { rx: 6 })
      + ShapeUtil.rect(-26, -55, 8, 30, darker, { rx: 4 })
      + ShapeUtil.rect(18, -55, 8, 30, darker, { rx: 4 });
  }
}
