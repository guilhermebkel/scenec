export type AssetDrawing = string | { svg: string; hand: number[]; box: { w: number; h: number } };

export abstract class BaseAsset {
  abstract readonly id: string;

  abstract readonly kind: string;

  abstract readonly w: number;

  abstract readonly h: number;

  abstract readonly tags: readonly string[];

  size?(params: any): { w: number; h: number };

  readonly backdrop?: boolean;

  readonly seat?: number;

  readonly elevation?: number;

  readonly top?: number;

  readonly hollow?: boolean;

  topOf?(params: any): number;

  abstract draw(params: any, theme: any): AssetDrawing;
}
