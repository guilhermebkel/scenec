import type { ThemeColorName } from "@/Protocols/ThemeProtocol.ts";
export const FONT_NAMES = ["sans", "serif", "hand"] as const;

export type FontName = (typeof FONT_NAMES)[number];

export const KIT_SCENE_NAMES = ["riso", "sketch", "clay", "duotone", "poster"] as const;

export type KitSceneName = (typeof KIT_SCENE_NAMES)[number];

export interface KitOutline {
  w: number;
  inner: number;
  wobble?: number;
  weight?: number;
  detailRatio?: number;
}

export const KIT_TEXTURE_NAMES = ["paper", "fiber"] as const;

export type KitTextureName = (typeof KIT_TEXTURE_NAMES)[number];

export const KIT_LIGHT_MODES = ["none", "hatch"] as const;

export type KitLightMode = (typeof KIT_LIGHT_MODES)[number];

export interface KitLight {
  strength?: number;
  mode?: KitLightMode;
  hasCasts?: boolean;
}

export interface KitStyle {
  readonly outline?: KitOutline;
  readonly light?: KitLight;
  readonly texture?: KitTextureName;
  readonly themeColorToColor?: Partial<Record<ThemeColorName, string>>;
  readonly scene?: KitSceneName;
  readonly hasDrop?: boolean;
  readonly font?: FontName;
}

export const KIT_IDS = [
  "flat",
  "hatch",
  "outline",
  "paper",
  "riso",
  "sketch",
  "clay",
  "duotone",
  "poster",
  "isometric",
] as const;

export type KitId = (typeof KIT_IDS)[number];
