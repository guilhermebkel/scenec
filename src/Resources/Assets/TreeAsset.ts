import type { AssetParams, Theme } from "@/Protocols/AssetProtocol.ts";
import { ColorUtil } from "@/Utils/ColorUtil.ts";
import { BaseAsset } from "@/Resources/Assets/BaseAsset.ts";
import { DetailUtil } from "@/Utils/DetailUtil.ts";
import { IdUtil } from "@/Utils/IdUtil.ts";
import { ShapeUtil } from "@/Utils/ShapeUtil.ts";

type TreeVariantKey = "2" | "tall" | "3" | "wide";

export class TreeAsset extends BaseAsset {
  readonly id = "tree";

  readonly kind = "ground";

  readonly width = 115;

  readonly height = 205;

  readonly tags = ["árvore", "arvore", "tree_round", "oak"];

  private static readonly VARIANT_TO_DRAWER: Record<
    TreeVariantKey,
    (asset: TreeAsset, params: AssetParams, theme: Theme) => string
  > = {
    2: (asset, params, theme) => asset.drawTall(params, theme),
    tall: (asset, params, theme) => asset.drawTall(params, theme),
    3: (asset, params, theme) => asset.drawWide(params, theme),
    wide: (asset, params, theme) => asset.drawWide(params, theme),
  };

  draw(params: AssetParams, theme: Theme) {
    const variantKey = String(params.variant ?? "");
    const drawer = IdUtil.lookup(TreeAsset.VARIANT_TO_DRAWER, variantKey);
    return drawer ? drawer(this, params, theme) : this.drawDefault(params, theme);
  }

  private drawDefault(params: AssetParams, theme: Theme): string {
    const [first, second, color] = theme.foliage;
    const rank = DetailUtil.rankOf(params.detail);
    const hasParts = rank >= 1;
    const isHigh = rank >= 2;
    const branches = hasParts
      ? `<path d="M0 -80 L-22 -110 M0 -95 L20 -120" stroke="${theme.trunk}" stroke-width="5" stroke-linecap="round"/>`
      : "";
    const small = hasParts
      ? ShapeUtil.blob(-25, -138, 26, { seed: 14, lobes: 5, fill: second, extra: "opacity=\"0.9\"" })
      + ShapeUtil.blob(-16, -172, 12, { seed: 15, lobes: 4, fill: ColorUtil.sh(second, 0.18), extra: "opacity=\"0.7\"" })
      + ShapeUtil.blob(22, -165, 18, { seed: 16, lobes: 4, fill: second, extra: "opacity=\"0.8\"" })
      : "";
    const bark = isHigh
      ? `<path d="M-2 -10 L-2.5 -40 M2 -20 L2.5 -55 M-1 -60 L-1.5 -88" stroke="${ColorUtil.sh(theme.trunk, -0.3)}" `
      + `stroke-width="0.9" stroke-linecap="round" fill="none"/>`
      : "";
    const leaves = isHigh
      ? ShapeUtil.blob(-30, -170, 8, { seed: 17, lobes: 3, fill: ColorUtil.sh(first, 0.2), extra: "opacity=\"0.55\"" })
      + ShapeUtil.blob(12, -178, 7, { seed: 18, lobes: 3, fill: ColorUtil.sh(second, 0.22), extra: "opacity=\"0.55\"" })
      + ShapeUtil.blob(-36, -135, 6, { seed: 19, lobes: 3, fill: ColorUtil.sh(color, 0.22), extra: "opacity=\"0.5\"" })
      + ShapeUtil.blob(34, -130, 6, { seed: 20, lobes: 3, fill: ColorUtil.sh(color, 0.22), extra: "opacity=\"0.5\"" })
      : "";
    return ShapeUtil.shadow(theme, 46, 4.5)
      + `<path d="M-8 0 L-5 -95 L5 -95 L8 0 Z" fill="${theme.trunk}"/><path d="M1 0 L1.5 -95 L5 -95 L8 0 Z" fill="${ColorUtil.sh(theme.trunk, -0.2)}"/>`
      + bark + branches
      + ShapeUtil.blob(-28, -125, 32, { seed: 11, lobes: 5, fill: color })
      + ShapeUtil.blob(28, -122, 30, { seed: 12, lobes: 5, fill: ColorUtil.sh(color, -0.1) })
      + ShapeUtil.blob(0, -155, 42, { seed: 13, lobes: 6, fill: ColorUtil.sh(first, -0.12) })
      + ShapeUtil.blob(-3, -158, 40, { seed: 13, lobes: 6, fill: first })
      + small + leaves;
  }

  private drawTall(params: AssetParams, theme: Theme): string {
    const [first, second] = theme.foliage;
    const trunkColor = theme.trunk;
    return ShapeUtil.shadow(theme, 32, 4)
      + `<path d="M-5 0 L-3 -80 L3 -80 L5 0 Z" fill="${trunkColor}"/>`
      + ShapeUtil.blob(0, -110, 28, { seed: 21, lobes: 4, squash: 0.75, fill: ColorUtil.sh(second, -0.1) })
      + ShapeUtil.blob(0, -145, 26, { seed: 22, lobes: 5, squash: 0.7, fill: first })
      + ShapeUtil.blob(0, -175, 20, { seed: 23, lobes: 4, squash: 0.65, fill: ColorUtil.sh(first, 0.15) });
  }

  private drawWide(params: AssetParams, theme: Theme): string {
    const [first, second, color] = theme.foliage;
    const trunkColor = theme.trunk;
    return ShapeUtil.shadow(theme, 55, 4.5)
      + `<path d="M-10 0 L-18 -70 L-2 -70 L-3 0 Z" fill="${trunkColor}"/>`
      + `<path d="M3 0 L2 -70 L18 -70 L10 0 Z" fill="${trunkColor}"/>`
      + ShapeUtil.blob(-35, -115, 36, { seed: 25, lobes: 5, fill: second })
      + ShapeUtil.blob(35, -115, 36, { seed: 26, lobes: 5, fill: ColorUtil.sh(color, -0.1) })
      + ShapeUtil.blob(0, -135, 40, { seed: 27, lobes: 6, fill: first });
  }
}
