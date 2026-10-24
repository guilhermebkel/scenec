import type { AssetDrawing, AssetKind, AssetParams, LibraryAsset } from "@/Protocols/AssetProtocol.ts";
import type { CustomArtwork, CustomAssetDefinition } from "@/Protocols/CustomAssetProtocol.ts";
import type { Theme } from "@/Protocols/ThemeProtocol.ts";
import { RecolorUtil } from "@/Utils/RecolorUtil.ts";

// Why: an asset declared in the scene is cropped to the real box of its drawing, anchored at the center of its base and scaled to `height` units.
export class CustomAsset implements LibraryAsset {
  private static readonly DEFAULT_RECOLOR_STRENGTH = 0.75;

  private static readonly DEFAULT_WALL_ELEVATION = 80;

  private static readonly SHADOW_WIDTH = 0.45;

  private static readonly SHADOW_HEIGHT_RATIO = 0.05;

  private static readonly SHADOW_MAX_HEIGHT = 4;

  private static readonly GROUNDED_KINDS: readonly AssetKind[] = ["ground", "any"];

  readonly width: number;

  readonly top?: number;

  readonly seat?: number;

  readonly elevation?: number;

  readonly tags: readonly string[];

  private readonly scale: number;

  constructor(
    readonly kind: AssetKind,
    readonly height: number,
    private readonly definition: CustomAssetDefinition,
    private readonly artwork: CustomArtwork,
  ) {
    this.scale = height / artwork.box.height;
    this.width = artwork.box.width * this.scale;
    this.top = definition.top;
    this.seat = definition.seat;
    this.elevation = definition.elevation ?? (kind === "wall" ? CustomAsset.DEFAULT_WALL_ELEVATION : undefined);
    this.tags = definition.tags ?? [];
  }

  draw(params: AssetParams, theme: Theme): AssetDrawing {
    const { definition, artwork, scale } = this;
    const { box } = artwork;
    const isFlipped = (params.facing === "left" && definition.facing !== "left") || (params.facing === "right" && definition.facing === "left");
    const art = definition.recolor
      ? RecolorUtil.makeRecolor(theme, definition.recolor === true ? CustomAsset.DEFAULT_RECOLOR_STRENGTH : definition.recolor)(artwork.inner)
      : artwork.inner;
    const offsetX = (-(box.x + box.width / 2) * scale).toFixed(3);
    const offsetY = (-(box.y + box.height) * scale).toFixed(3);
    return this.shadow(params, theme) + `<g transform="scale(${isFlipped ? -1 : 1} 1) translate(${offsetX} ${offsetY}) scale(${scale.toFixed(5)})">${art}</g>`;
  }

  private shadow(params: AssetParams, theme: Theme): string {
    if (!CustomAsset.GROUNDED_KINDS.includes(this.kind) || this.definition.shadow === false || params.shadow === false) {
      return "";
    }
    const radiusX = (this.width * CustomAsset.SHADOW_WIDTH).toFixed(1);
    const radiusY = Math.min(CustomAsset.SHADOW_MAX_HEIGHT, this.width * CustomAsset.SHADOW_HEIGHT_RATIO).toFixed(1);
    return `<ellipse cx="0" cy="0" rx="${radiusX}" ry="${radiusY}" fill="${theme.shadow}"/>`;
  }
}
