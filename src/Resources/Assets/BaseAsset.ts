import type { AssetParams, AssetSize, Theme } from "@/Protocols/AssetProtocol.ts";

export type AssetDrawing = string | { svg: string; hand: number[]; box: { w: number; h: number } };

export abstract class BaseAsset {
  abstract readonly id: string;

  abstract readonly kind: string;

  abstract readonly width: number;

  abstract readonly height: number;

  abstract readonly tags: readonly string[];

  size?(params: AssetParams): AssetSize;

  readonly backdrop?: boolean;

  readonly seat?: number;

  readonly elevation?: number;

  readonly top?: number;

  readonly hollow?: boolean;

  topOf?(params: AssetParams): number;

  abstract draw(params: AssetParams, theme: Theme): AssetDrawing;
}
