import type { AssetDrawing, AssetId, AssetParams, AssetSize, LibraryAsset, Theme } from "@/Protocols/AssetProtocol.ts";

export abstract class BaseAsset implements LibraryAsset {
  abstract readonly id: AssetId;

  abstract readonly kind: string;

  abstract readonly width: number;

  abstract readonly height: number;

  abstract readonly tags: readonly string[];

  readonly isBackdrop?: boolean;

  readonly seat?: number;

  readonly elevation?: number;

  readonly top?: number;

  readonly isHollow?: boolean;

  size?(params: AssetParams): AssetSize;

  topOf?(params: AssetParams): number;

  abstract draw(params: AssetParams, theme: Theme): AssetDrawing;
}
