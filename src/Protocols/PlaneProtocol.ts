import type { AssetKind } from "@/Protocols/AssetProtocol.ts";
import type { Library } from "@/Protocols/CompilationProtocol.ts";
import type { BoxOptions, PathOptions, Scene, ZoneDecor } from "@/Protocols/SceneProtocol.ts";
import type { Theme } from "@/Protocols/ThemeProtocol.ts";

export const ZONE_NAMES = ["home", "school", "campus", "office", "lab", "ceremony", "park", "city", "beach"] as const;

export type ZoneName = (typeof ZONE_NAMES)[number];

export type GroundPoint = readonly [number, number];

export type ScreenPoint = readonly [number, number];

export interface ScreenBox {
  x0: number;
  y0: number;
  x1: number;
  y1: number;
}

export interface HazeStep {
  depth: number;
  strength: number;
}

export interface PlaneCamera {
  readonly width: number;
  readonly height: number;
  readonly isRoom: boolean;
  readonly unit: number;
  readonly eyeX: number;
  readonly hazeSteps: readonly HazeStep[] | null;
  readonly shrink: (z: number) => number;
  readonly screenX: (x: number, z: number) => number;
  readonly screenY: (z: number) => number;
  readonly spread: (z: number) => number;
  readonly pxPerUnit: (z: number, factor?: number) => number;
  readonly worldRadius: (widthUnits: number, z: number, factor?: number) => number;
  readonly project: (x: number, z: number, heightUnits?: number) => ScreenPoint;
  readonly hazeLevel: (z: number) => number;
}

export interface Checkpoint {
  id: string;
  at: GroundPoint;
  arc: number;
  label: string | undefined;
  zone: string | undefined;
  isFinish: boolean;
  color: string | undefined;
  labelSide: string | undefined;
  hasDecor: boolean;
  tint: string | undefined;
  isOccupied: boolean;
}

export interface Road {
  definition: PathOptions | null;
  samples: GroundPoint[];
  arc: number[];
  width: number;
  checkpointRadius: number;
  checkpoints: Checkpoint[];
}

export interface RoadPosition {
  point: GroundPoint;
  normal: GroundPoint;
}

export interface Footprint {
  id: string;
  x: number;
  z: number;
  radius: number;
}

export interface GroundSprite {
  id: string;
  asset: string;
  kind: AssetKind;
  x: number;
  z: number;
  lift: number;
  screenX: number;
  screenY: number;
  scale: number;
  svg: string;
  width: number;
  height: number;
  heightUnits: number;
  halfFootWidth: number;
  bounds: ScreenBox;
  isDecor: boolean;
  isPerson: boolean;
}

export interface SkySprite {
  id: string;
  screenX: number;
  screenY: number;
  scale: number;
  svg: string;
  width: number;
  height: number;
}

export interface PlaneBox {
  id: string;
  x0: number;
  x1: number;
  z0: number;
  z1: number;
  elevation: number;
  height: number;
  options: BoxOptions;
  color: string;
}

export interface ZoneTint {
  x: number;
  z: number;
  radius: number;
  color: string;
}

export interface ZoneDefinition {
  tint?: string | ((theme: Theme) => string);
  radius?: number;
  decor?: readonly ZoneDecor[];
}

export interface PlaneWorld {
  scene: Scene;
  theme: Theme;
  library: Library;
  warnings: string[];
  camera: PlaneCamera;
  road: Road;
  zoneNameToDefinition: ReadonlyMap<string, ZoneDefinition>;
  boxes: PlaneBox[];
  tints: ZoneTint[];
  ground: GroundSprite[];
  sky: SkySprite[];
  pointIdToPosition: Map<string, GroundPoint>;
  footprints: Footprint[];
  protectedSprites: GroundSprite[];
}

export interface PlaneLabel {
  box: ScreenBox;
  centerX: number;
  centerY: number;
  number: string;
  title: string;
  fontSize: number;
  color: string;
}
