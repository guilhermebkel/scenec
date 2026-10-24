import type { AssetKind } from "@/Protocols/AssetProtocol.ts";

export interface PixelBox {
  left: number;
  top: number;
  right: number;
  bottom: number;
}

export interface RasterObject {
  id: string;
  kind: AssetKind;
  related: readonly string[];
  alpha: Uint8Array;
  area: number;
  box: PixelBox;
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
}

export interface RasterLayer {
  id: string;
  kind: AssetKind;
  related: readonly string[];
  pixels: Uint8Array;
}

export interface RasterSource {
  width: number;
  height: number;
  factor: number;
  fullPixels: Uint8Array;
  backPixels: Uint8Array;
  layers: RasterLayer[];
}
