import type { AssetParams, Theme } from "@/Protocols/AssetProtocol.ts";
import { ColorUtil } from "@/Utils/ColorUtil.ts";
import { BaseAsset } from "@/Resources/Assets/BaseAsset.ts";
import { DetailUtil } from "@/Utils/DetailUtil.ts";
import { ShapeUtil } from "@/Utils/ShapeUtil.ts";

export class TreeAsset extends BaseAsset {
  readonly id = "tree";

  readonly kind = "ground";

  readonly width = 115;

  readonly height = 205;

  readonly tags = ["árvore", "arvore", "tree_round", "oak"];

  draw(params: AssetParams, theme: Theme) {
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
}
