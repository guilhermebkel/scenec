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
  on?: boolean;
  off?: boolean;
  draped?: boolean | string;
  hair?: string;
  sleeve?: string;
}

export interface AssetSize {
  w: number;
  h: number;
}

export type { Theme };
