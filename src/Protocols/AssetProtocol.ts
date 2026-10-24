import type { PersonParams } from "@/Protocols/PersonProtocol.ts";
import type { Theme } from "@/Protocols/ThemeProtocol.ts";

// Why: the slug of every library asset, so code that names an asset by id is checked by the compiler.
export const ASSET_IDS = [
  "backpack",
  "ball",
  "balloons",
  "beach_towel",
  "bed",
  "bench",
  "bicycle",
  "big_plant",
  "bird",
  "board",
  "boat",
  "books",
  "bookshelf",
  "building",
  "burger",
  "bush",
  "cabinet",
  "cables",
  "cake",
  "cap",
  "car",
  "cat",
  "chair",
  "clock",
  "cloud",
  "coffee_machine",
  "counter",
  "cup",
  "desk",
  "desk_slab",
  "diploma",
  "dog",
  "drawer_unit",
  "fence",
  "figurine",
  "finish_flag",
  "floor_lamp",
  "flowers",
  "frame",
  "fruit_bowl",
  "glass_shelf",
  "headphones",
  "house",
  "lab",
  "lamp",
  "laptop",
  "laptop_open",
  "light_switch",
  "monitor",
  "moon",
  "mountain",
  "office_chair",
  "palm",
  "paper_cup",
  "pendant_lamp",
  "pennant",
  "person",
  "photo_frame",
  "pine",
  "pizza",
  "plant",
  "plastic_bag",
  "plate",
  "rolling_cart",
  "rug",
  "sandcastle",
  "school",
  "shelf_wall",
  "sofa",
  "stage",
  "star",
  "stars",
  "streetlight",
  "suitcase",
  "sun",
  "table",
  "trash_can",
  "tree",
  "trophy",
  "tumbler",
  "tv",
  "tv_stand",
  "umbrella",
  "university",
  "vase_flowers",
  "window",
] as const;

export type AssetId = (typeof ASSET_IDS)[number];

export type Facing = "left" | "right";

export interface AssetParams extends PersonParams {
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
  hand: [number, number];
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
