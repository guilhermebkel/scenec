import type { CompileResult } from "@/Protocols/ResultProtocol.ts";
import type { KitStyle } from "@/Protocols/KitProtocol.ts";
import type { AssetId, AssetKind, LibraryAsset } from "@/Protocols/AssetProtocol.ts";
import type { Canvas, SceneObject } from "@/Protocols/SceneProtocol.ts";
import type { Theme } from "@/Protocols/ThemeProtocol.ts";

export type Depth = "far" | "mid" | "near";

export interface LayoutLines {
  horizon: number;
  sea?: number;
  base: Record<Depth, number>;
}

export interface Placement {
  id: string;
  asset: string;
  kind: AssetKind;
  x: number;
  y: number;
  scale: number;
  width: number;
  height: number;
  z: number;
  depth: Depth | null;
  svg: string;
  bodySvg: string;
  surfaceTop: number | undefined;
  hasHaze: boolean;
  isBackdrop: boolean;
  isHollow: boolean;
  hand: [number, number] | undefined;
  boxLeft: number;
  boxRight: number;
  boxTop: number;
  boxBottom: number;
  related: string[];
  isOffView: boolean;
  isFocus: boolean;
}

export interface Camera {
  zoom: number;
  translateX: number;
  translateY: number;
}

export interface TextRect {
  x0: number;
  y0: number;
  x1: number;
  y1: number;
  box: boolean;
}

export interface Library {
  [assetId: string]: LibraryAsset;
}

export interface CompilationContext {
  canvas: Canvas;
  kit: KitStyle;
  objects: Record<string, SceneObject>;
  library: Library;
  failedAssets: Set<string>;
  theme: Theme;
  warnings: string[];
  width: number;
  height: number;
  setting: string;
  lines: LayoutLines;
  unit: number;
}

export interface LightState {
  source: number;
  strength: number;
  direction: number;
  shadowColor: string;
  shadowRgb: [number, number, number];
  isNight: boolean;
  isHatch: boolean;
}

export interface HazeLevels {
  far: number;
  mid: number;
}

export type Rgba = [number, number, number, number];

export interface Background {
  svg: string;
  haze: HazeLevels;
  shadowRgba: Rgba;
  textBackdrop: string;
}

export interface CritiqueObject {
  id: string;
  asset: string;
  kind: string;
  z: number;
  body: string;
  related: string[];
  ignore: boolean;
}

export interface CritiqueInput {
  width: number;
  height: number;
  head: string;
  bg: string;
  scene: string;
  theme: Theme;
  scale: number;
  textRects: TextRect[];
  skip: string[];
  objects: CritiqueObject[];
}

export interface CompilationOutput {
  result: CompileResult;
  critique: CritiqueInput | null;
}
