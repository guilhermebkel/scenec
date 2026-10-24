import type { Theme } from "@/Protocols/ThemeProtocol.ts";

export type Facing = "left" | "right";

export interface AssetParams {
  color?: string;
  width?: number;
  height?: number;
  facing?: Facing;
  floors?: number;
  doors?: number;
  drawers?: number;
  thickness?: number;
  seed?: number;
  drop?: number;
  style?: string;
  frame?: string;
  bg?: string;
  art?: string;
  view?: string;
  ends?: string;
  pot?: string;
  logo?: string;
  handle?: boolean;
  steam?: boolean;
  mic?: boolean;
  stand?: boolean;
  on?: string | boolean;
  off?: boolean;
  draped?: boolean | string;
  hair?: string;
  sleeve?: string;
}

export interface AssetSize {
  w: number;
  h: number;
}

export interface PersonDrawing {
  svg: string;
  hand: number[];
  box: AssetSize;
}

export type AssetDrawing = string | PersonDrawing;

export interface LibraryAsset {
  readonly kind: string;
  readonly width: number;
  readonly height: number;
  readonly tags?: readonly string[];
  readonly top?: number;
  readonly seat?: number;
  readonly elevation?: number;
  readonly isBackdrop?: boolean;
  readonly isHollow?: boolean;
  size?(params: AssetParams): AssetSize;
  topOf?(params: AssetParams): number;
  draw(params: AssetParams, theme: Theme): AssetDrawing;
}

export type { Theme };
