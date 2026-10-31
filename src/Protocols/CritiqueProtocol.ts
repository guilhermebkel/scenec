import type { AssetKind } from "@/Protocols/AssetProtocol.ts";
import type { SettingName } from "@/Protocols/SceneProtocol.ts";

export const CRITIQUE_NAMES = [
  "coverage",
  "balance",
  "silhouette",
  "contact",
  "tangent",
  "focus",
  "color",
  "scale",
  "thumbnail",
] as const;

export type CritiqueName = (typeof CRITIQUE_NAMES)[number];

export type CritiqueDepth = "far" | "mid" | "near";

export interface PixelBox {
  left: number;
  top: number;
  right: number;
  bottom: number;
}

export interface RasterObject {
  id: string;
  asset: string;
  kind: AssetKind;
  related: readonly string[];
  alpha: Uint8Array;
  area: number;
  box: PixelBox;
  isFocus: boolean;
  height: number;
  depth: CritiqueDepth | null;
}

export interface Raster {
  width: number;
  height: number;
  pixelCount: number;
  factor: number;
  rgba: Uint8Array;
  fullLab: Float32Array;
  backLab: Float32Array;
  objects: RasterObject[];
  owner: Int16Array;
  horizonRatio?: number;
  setting?: SettingName;
  focusId?: string;
}

export interface RasterLayer {
  id: string;
  asset: string;
  kind: AssetKind;
  related: readonly string[];
  pixels: Uint8Array;
  isFocus: boolean;
  height: number;
  depth: CritiqueDepth | null;
}

export interface RasterSource {
  width: number;
  height: number;
  factor: number;
  fullPixels: Uint8Array;
  backPixels: Uint8Array;
  layers: RasterLayer[];
  horizonRatio?: number;
  setting?: SettingName;
  focusId?: string;
}
