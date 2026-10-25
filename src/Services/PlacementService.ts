import type { AssetId, AssetKind, LibraryAsset } from "@/Protocols/AssetProtocol.ts";
import type { CompilationContext, Depth, Placement } from "@/Protocols/CompilationProtocol.ts";
import type { SeatedPoseName } from "@/Protocols/PersonProtocol.ts";
import { DEPTH_NAMES } from "@/Protocols/SceneProtocol.ts";
import type { ObjectLayer, SceneObject, SettingName, SizeName, SlotName } from "@/Protocols/SceneProtocol.ts";
import { AssetService } from "@/Services/AssetService.ts";
import { DependencyOrderService, type ResolutionOrder } from "@/Services/DependencyOrderService.ts";
import { IdUtil } from "@/Utils/IdUtil.ts";
import { RequireUtil } from "@/Utils/RequireUtil.ts";
import { PersonUtil } from "@/Utils/PersonUtil.ts";

type SeatedPose = SeatedPoseName | "sitting_floor" | "hugging_knees";

type ReferenceKey = "left_of" | "right_of" | "behind" | "in_front_of" | "on" | "under" | "above";

type Positioner = (request: PlacementRequest, context: CompilationContext) => Position | null;

interface Position {
  x: number;
  y: number;
  scale: number;
  z: number;
  depth: Depth | null;
}

interface PlacementRequest {
  id: string;
  object: SceneObject;
  asset: LibraryAsset;
  assetId: string;
  size: { w: number; h: number };
  sizeFactor: number;
  idToPlacement: Record<string, Placement>;
  heldToHolder: Record<string, string>;
}

export class PlacementService {
  static readonly SLOT_TO_FRACTION: Record<SlotName, number> = {
    "far-left": 0.08, "left": 0.2, "center-left": 0.35, "center": 0.5, "center-right": 0.65, "right": 0.8, "far-right": 0.92,
  };

  static readonly SIZE_NAME_TO_FACTOR: Record<SizeName, number> = {
    tiny: 0.5, small: 0.75, medium: 1, large: 1.3, huge: 1.7,
  };

  private static readonly DEPTHS: readonly Depth[] = DEPTH_NAMES;

  private static readonly GROUND_REFERENCE_KEYS: readonly ReferenceKey[] = [
    "left_of", "right_of", "behind", "in_front_of", "under",
  ];

  private static readonly KIND_TO_POSITIONER: Partial<Record<AssetKind, Positioner>> = {
    sky: (request, context) => PlacementService.positionSky(request, context),
    wall: (request, context) => PlacementService.positionWall(request, context),
    ceiling: (request, context) => PlacementService.positionCeiling(request, context),
    water: (request, context) => PlacementService.positionWater(request, context),
  };

  private static readonly KIND_TO_HELD_WIDTH_FACTOR: Partial<Record<AssetKind, number>> = { any: 0.42 };

  private static readonly KIND_TO_GROUND_Z_SHIFT: Partial<Record<AssetKind, number>> = { floor: -400 };

  private static readonly LAYER_TO_GROUND_Z_SHIFT: Record<ObjectLayer, number> = { back: -300, front: 300 };

  private static readonly FACING_TO_BACKSET: Partial<Record<"left" | "right", number>> = { left: 1 };

  private static readonly ASSET_TO_BODY_SCALE_Y: Partial<Record<AssetId, (object: SceneObject) => number>> = {
    person: (object) => PersonUtil.bodyScale(object).by,
  };

  private static readonly DEPTH_TO_SCALE: Record<Depth, number> = { near: 1, mid: 0.8, far: 0.6 };

  // Why: the height, in drawing units, of the point where a hand grips each object.
  private static readonly ASSET_TO_GRIP_HEIGHT: Partial<Record<AssetId, number>> = {
    cup: 6, suitcase: 44, books: 8, ball: 12,
  };

  private static readonly SEATED_POSES: readonly SeatedPose[] = [
    "sitting", "typing", "reading", "drinking", "sitting_floor", "hugging_knees",
  ];

  private static readonly SEAT_ALIGN_TO_OFFSET: Record<"left" | "right" | "center", number> = {
    left: -0.28, right: 0.28, center: 0,
  };

  private static readonly SETTING_TO_IS_INDOOR: Record<SettingName, boolean> = {
    indoor: true, outdoor: false, beach: false, city: false,
  };

  private static readonly SURFACE_ALIGN_TO_OFFSET: Record<"left" | "right" | "center" | "far-left" | "far-right", number> = {
    "left": -0.3, "right": 0.3, "center": 0, "far-left": -0.42, "far-right": 0.42,
  };

  private static readonly LAYER_TO_Z_SHIFT: Record<ObjectLayer, number> = { back: -0.2, front: 0.2 };

  private static readonly SKY_SCALE = 0.9;

  private static readonly WALL_SCALE = 0.85;

  private static readonly WATER_SCALE = 0.55;

  private static readonly DEFAULT_SKY_ALTITUDE = 0.14;

  private static readonly DEFAULT_WATER_SLOT = 0.7;

  private static readonly SKY_Z = -900;

  private static readonly WALL_Z = -800;

  private static readonly WATER_Z = -700;

  private static readonly CEILING_Z = 500;

  private static readonly DEFAULT_HANG = 95;

  private static readonly WALL_SIDE_MARGIN = 0.03;

  private static readonly WATER_LINE_OFFSET = 0.035;

  private static readonly STARS_HEIGHT_FRACTION = 0.38;

  private static readonly STARS_REFERENCE_WIDTH = 620;

  private static readonly ON_Z_STEP = 0.5;

  private static readonly SEAT_HIP_UNITS = 45;

  private static readonly SEAT_BACKSET_UNITS = 4;

  private static readonly DEFAULT_GAP = 0.015;

  private static readonly BEHIND_OFFSET = 0.35;

  private static readonly DEPTH_Z_STEP = 1000;

  static slotFraction(at: unknown, fallback: number): number {
    if (typeof at === "number") {
      return at;
    }
    return IdUtil.lookup(PlacementService.SLOT_TO_FRACTION, at) ?? fallback;
  }

  static placeAll(context: CompilationContext, resolution: ResolutionOrder): Record<string, Placement> {
    const idToPlacement: Record<string, Placement> = {};
    for (const id of resolution.order) {
      const state = { idToPlacement, heldToHolder: resolution.heldToHolder };
      const placement = PlacementService.place(id, context, state);
      if (placement) {
        idToPlacement[id] = placement;
      }
    }
    return idToPlacement;
  }

  private static place(
    id: string,
    context: CompilationContext,
    state: { idToPlacement: Record<string, Placement>; heldToHolder: Record<string, string> },
  ): Placement | null {
    const { objects, library, warnings, theme } = context;
    const object = objects[id] ?? {};
    const requested = object.asset ?? id;
    const resolved = AssetService.resolveAsset(requested, library);
    if (!resolved.id) {
      if (context.failedAssets.has(requested)) {
        warnings.push(`'${id}' was ignored because custom asset '${requested}' failed to load`);
      } else {
        const suggestions = (resolved.suggest ?? []).join(", ");
        warnings.push(`asset '${requested}' (in '${id}') does not exist; did you mean: ${suggestions}?`);
      }
      return null;
    }
    const asset = RequireUtil.defined(library[resolved.id], `library asset ${resolved.id}`);
    const size = asset.size ? asset.size(object) : { w: asset.width, h: asset.height };
    const sizeFactor = PlacementService.sizeFactor(id, object, warnings);
    const request: PlacementRequest = {
      id, object, asset, assetId: resolved.id, size, sizeFactor,
      idToPlacement: state.idToPlacement, heldToHolder: state.heldToHolder,
    };
    const position = PlacementService.position(request, context);
    if (!position) {
      return null;
    }
    const drawn = asset.draw({ ...object }, theme);
    const drawnSize = typeof drawn === "string" ? size : drawn.box;
    const width = drawnSize.w * position.scale;
    const height = drawnSize.h * position.scale;
    const isPlain = typeof drawn === "string";
    return {
      id, asset: resolved.id, kind: asset.kind, x: position.x, y: position.y, scale: position.scale,
      width, height, z: position.z,
      depth: position.depth, svg: isPlain ? drawn : drawn.svg, bodySvg: "",
      surfaceTop: asset.topOf ? asset.topOf(object) : asset.top,
      hasHaze: object.haze !== false, isBackdrop: Boolean(asset.isBackdrop), isHollow: Boolean(asset.isHollow),
      hand: isPlain ? undefined : drawn.hand,
      boxLeft: position.x - width / 2, boxRight: position.x + width / 2,
      boxTop: position.y - height, boxBottom: position.y,
      related: DependencyOrderService.dependenciesOf(object).concat(object.holds ?? [], state.heldToHolder[id] ?? []),
      isOffView: false, isFocus: false,
    };
  }

  private static sizeFactor(id: string, object: SceneObject, warnings: string[]): number {
    if (typeof object.size === "number") {
      return object.size;
    }
    const known = IdUtil.lookup(PlacementService.SIZE_NAME_TO_FACTOR, object.size ?? "medium");
    if (known !== undefined) {
      return known;
    }
    const names = Object.keys(PlacementService.SIZE_NAME_TO_FACTOR).join(", ");
    warnings.push(`size '${object.size}' is invalid in '${id}' (use ${names})`);
    return 1;
  }

  private static position(request: PlacementRequest, context: CompilationContext): Position | null {
    const { asset, object, id, heldToHolder, idToPlacement } = request;
    const positioner = IdUtil.lookup(PlacementService.KIND_TO_POSITIONER, asset.kind);
    if (positioner) {
      return positioner(request, context);
    }
    if (object.on) {
      return PlacementService.positionOnTop(request, context);
    }
    const holder = heldToHolder[id] ? idToPlacement[heldToHolder[id]] : undefined;
    if (holder) {
      return PlacementService.positionHeld(request, holder);
    }
    return PlacementService.positionOnGround(request, context);
  }

  private static reference(request: PlacementRequest, key: ReferenceKey): Placement | undefined {
    const id = request.object[key];
    return id ? request.idToPlacement[id] : undefined;
  }

  private static isUnset(at: unknown): boolean {
    // Why: an empty string or a zero in `at` counts as "not set" for sky objects, the same as leaving it out.
    return !at;
  }

  private static positionSky(request: PlacementRequest, context: CompilationContext): Position {
    const { object, size, sizeFactor, assetId } = request;
    const { width, height, unit } = context;
    const depth = object.depth ?? null;
    if (assetId === "stars") {
      return {
        x: width / 2,
        y: height * PlacementService.STARS_HEIGHT_FRACTION,
        scale: width / PlacementService.STARS_REFERENCE_WIDTH,
        z: PlacementService.SKY_Z,
        depth,
      };
    }
    const scale = unit * sizeFactor * PlacementService.SKY_SCALE;
    const slot = String(PlacementService.isUnset(object.at) ? "top-right" : object.at).replace("top-", "").replace("sky-", "");
    const fallback = typeof object.at === "number" ? object.at : 0.5;
    const slotX = (IdUtil.lookup(PlacementService.SLOT_TO_FRACTION, slot) ?? fallback) * width;
    const slotY = height * (object.altitude ?? PlacementService.DEFAULT_SKY_ALTITUDE) + (size.h * scale) / 2;
    return { x: slotX, y: slotY, scale, z: PlacementService.SKY_Z, depth };
  }

  private static positionWall(request: PlacementRequest, context: CompilationContext): Position {
    const { object, size, sizeFactor, asset, id } = request;
    const { width, height, unit, warnings, setting, lines } = context;
    if (!PlacementService.SETTING_TO_IS_INDOOR[setting]) {
      warnings.push(`'${id}' is a wall object, but the setting is '${setting}'`);
    }
    const scale = unit * sizeFactor * PlacementService.WALL_SCALE;
    const margin = PlacementService.WALL_SIDE_MARGIN * width;
    let centerX = PlacementService.slotFraction(object.at, 0.5) * width;
    const leftOf = PlacementService.reference(request, "left_of");
    const rightOf = PlacementService.reference(request, "right_of");
    const above = PlacementService.reference(request, "above");
    if (leftOf) {
      centerX = leftOf.boxLeft - margin - (size.w * scale) / 2;
    }
    if (rightOf) {
      centerX = rightOf.boxRight + margin + (size.w * scale) / 2;
    }
    if (above) {
      centerX = above.x + (typeof object.offset === "number" ? object.offset : 0) * above.width;
    }
    const lift = (object.elevation ?? asset.elevation ?? 0) * unit * PlacementService.WALL_SCALE;
    const baseY = height * lines.horizon - lift;
    return { x: centerX, y: baseY, scale, z: PlacementService.WALL_Z, depth: object.depth ?? null };
  }

  private static positionCeiling(request: PlacementRequest, context: CompilationContext): Position {
    const { object, sizeFactor, idToPlacement } = request;
    const { width, unit } = context;
    const above = object.above ? idToPlacement[object.above] : undefined;
    const centerX = above ? above.x : PlacementService.slotFraction(object.at, 0.5) * width;
    const hangY = (object.hang ?? PlacementService.DEFAULT_HANG) * unit;
    const depth = object.depth ?? null;
    return { x: centerX, y: hangY, scale: unit * sizeFactor, z: PlacementService.CEILING_Z, depth };
  }

  private static positionWater(request: PlacementRequest, context: CompilationContext): Position {
    const { object, sizeFactor, id } = request;
    const { width, height, unit, lines, warnings } = context;
    if (!lines.sea) {
      warnings.push(`'${id}' is a water object, but the scene has no sea (use setting: beach)`);
    }
    return {
      x: PlacementService.slotFraction(object.at, PlacementService.DEFAULT_WATER_SLOT) * width,
      y: height * ((lines.sea ?? lines.horizon) - PlacementService.WATER_LINE_OFFSET),
      scale: unit * sizeFactor * PlacementService.WATER_SCALE,
      z: PlacementService.WATER_Z,
      depth: object.depth ?? null,
    };
  }

  private static alignOffset<Name extends string>(align: unknown, nameToOffset: Record<Name, number>): number {
    if (typeof align === "number") {
      return align;
    }
    return IdUtil.lookup(nameToOffset, typeof align === "string" ? align : "center") ?? 0;
  }

  private static positionOnTop(request: PlacementRequest, context: CompilationContext): Position | null {
    const { object, sizeFactor, id, assetId, idToPlacement } = request;
    const { library, warnings } = context;
    const support = object.on ? idToPlacement[object.on] : undefined;
    if (!support) {
      warnings.push(`'${id}' has 'on: ${object.on}', but '${object.on}' was not positioned`);
      return null;
    }
    const supportAsset = RequireUtil.defined(library[support.asset], `library asset ${support.asset}`);
    const scale = support.scale * sizeFactor;
    const isSeated = IdUtil.isOneOf(PlacementService.SEATED_POSES, object.pose);
    if (supportAsset.seat && isSeated) {
      const offset = PlacementService.alignOffset(object.align, PlacementService.SEAT_ALIGN_TO_OFFSET);
      const backset = IdUtil.lookup(PlacementService.FACING_TO_BACKSET, object.facing) ?? -1;
      const bodyScaleY = IdUtil.lookup(PlacementService.ASSET_TO_BODY_SCALE_Y, assetId)?.(object) ?? 1;
      const hip = PlacementService.SEAT_HIP_UNITS * bodyScaleY * support.scale * sizeFactor;
      return {
        x: support.x + offset * support.width + backset * PlacementService.SEAT_BACKSET_UNITS * support.scale,
        y: support.y - supportAsset.seat * support.scale + hip,
        scale, z: support.z + PlacementService.ON_Z_STEP, depth: support.depth,
      };
    }
    const surfaceTop = support.surfaceTop ?? supportAsset.top;
    if (!surfaceTop) {
      warnings.push(`'${object.on}' has no supporting surface; '${id}' cannot sit on top of it`);
      return {
        x: support.x, y: support.y - support.height, scale,
        z: support.z + PlacementService.ON_Z_STEP, depth: support.depth,
      };
    }
    const offset = PlacementService.alignOffset(object.align, PlacementService.SURFACE_ALIGN_TO_OFFSET);
    const layerShift = IdUtil.lookup(PlacementService.LAYER_TO_Z_SHIFT, object.layer) ?? 0;
    return {
      x: support.x + offset * support.width, y: support.y - surfaceTop * support.scale, scale,
      z: support.z + PlacementService.ON_Z_STEP + layerShift, depth: support.depth,
    };
  }

  private static positionHeld(request: PlacementRequest, holder: Placement): Position {
    const { sizeFactor, size, asset, assetId } = request;
    const scale = holder.scale * sizeFactor;
    const [handX, handY] = holder.hand ?? [0, 0];
    const side = Math.sign(handX) || 1;
    const widthFactor = IdUtil.lookup(PlacementService.KIND_TO_HELD_WIDTH_FACTOR, asset.kind) ?? 0;
    const anyShift = widthFactor ? side * size.w * widthFactor * scale : 0;
    const grip = PlacementService.ASSET_TO_GRIP_HEIGHT[assetId as AssetId] ?? size.h / 2;
    return {
      x: holder.x + handX * holder.scale + anyShift,
      y: holder.y + handY * holder.scale + grip * scale,
      scale, z: holder.z + PlacementService.ON_Z_STEP, depth: holder.depth,
    };
  }

  private static isDepth(value: string): value is Depth {
    return IdUtil.isOneOf(PlacementService.DEPTHS, value);
  }

  private static depthFor(request: PlacementRequest, reference: Placement | undefined, warnings: string[]): Depth {
    const { object, id } = request;
    let depth: string = object.depth ?? "";
    if (!depth) {
      const referenceIndex = PlacementService.DEPTHS.indexOf(reference?.depth ?? "near");
      if (object.behind && reference) {
        depth = PlacementService.DEPTHS[Math.max(0, referenceIndex - 1)] ?? "near";
      } else if (object.in_front_of && reference) {
        depth = PlacementService.DEPTHS[Math.min(PlacementService.DEPTHS.length - 1, referenceIndex + 1)] ?? "near";
      } else {
        depth = reference?.depth ?? "near";
      }
    }
    if (!PlacementService.isDepth(depth)) {
      warnings.push(`depth '${depth}' is invalid in '${id}' (use near, mid, far)`);
      return "near";
    }
    return depth;
  }

  private static warnSurface(request: PlacementRequest, warnings: string[]): void {
    const { asset, id, assetId } = request;
    if (asset.kind !== "surface") {
      return;
    }
    warnings.push(`'${id}' (${assetId}) usually sits on a surface; add 'on: <table>'`);
  }

  private static positionOnGround(request: PlacementRequest, context: CompilationContext): Position {
    const { object, size, sizeFactor, asset } = request;
    const { width, height, unit, lines, warnings } = context;
    PlacementService.warnSurface(request, warnings);
    const reference = PlacementService.GROUND_REFERENCE_KEYS
      .map((key) => PlacementService.reference(request, key))
      .find(Boolean);
    const depth = PlacementService.depthFor(request, reference, warnings);
    const scale = unit * sizeFactor * PlacementService.DEPTH_TO_SCALE[depth];
    const gap = (object.gap ?? PlacementService.DEFAULT_GAP) * width;
    const halfWidth = (size.w * scale) / 2;
    const offsetOf = (fallback: number): number => (typeof object.offset === "number" ? object.offset : fallback);
    let centerX = PlacementService.slotFraction(object.at, 0.5) * width;
    if (reference) {
      if (object.left_of) {
        centerX = reference.boxLeft - gap - halfWidth;
      }
      if (object.right_of) {
        centerX = reference.boxRight + gap + halfWidth;
      }
      if (object.behind) {
        centerX = reference.x + offsetOf(PlacementService.BEHIND_OFFSET) * reference.width;
      }
      if (object.in_front_of) {
        centerX = reference.x + offsetOf(0) * reference.width;
      }
      if (object.under) {
        centerX = reference.x;
      }
    }
    const baseY = height * lines.base[depth];
    let depthZ = PlacementService.DEPTHS.indexOf(depth) * PlacementService.DEPTH_Z_STEP + baseY;
    depthZ += IdUtil.lookup(PlacementService.KIND_TO_GROUND_Z_SHIFT, asset.kind) ?? 0;
    depthZ += IdUtil.lookup(PlacementService.LAYER_TO_GROUND_Z_SHIFT, object.layer) ?? 0;
    return { x: centerX, y: baseY, scale, z: depthZ, depth };
  }
}
