import type { AssetId, AssetParams, LibraryAsset } from "@/Protocols/AssetProtocol.ts";
import type { CompilationContext, Depth, Placement } from "@/Protocols/CompilationProtocol.ts";
import type { SceneObject } from "@/Protocols/SceneProtocol.ts";
import { AssetService } from "@/Services/AssetService.ts";
import { DependencyOrderService, type ResolutionOrder } from "@/Services/DependencyOrderService.ts";
import { PersonUtil } from "@/Utils/PersonUtil.ts";

interface Position {
  x: number;
  y: number;
  scale: number;
  z: number;
  depth: string | null;
}

interface PlacementRequest {
  id: string;
  object: SceneObject;
  asset: LibraryAsset;
  assetId: string;
  size: { w: number; h: number };
  sizeFactor: number;
  placed: Record<string, Placement>;
  heldBy: Record<string, string>;
}

export class PlacementService {
  private static readonly SLOT_TO_FRACTION: Record<string, number> = {
    "far-left": 0.08, "left": 0.2, "center-left": 0.35, "center": 0.5, "center-right": 0.65, "right": 0.8, "far-right": 0.92,
  };

  private static readonly SIZE_NAME_TO_FACTOR: Record<string, number> = {
    tiny: 0.5, small: 0.75, medium: 1, large: 1.3, huge: 1.7,
  };

  private static readonly DEPTHS: string[] = ["far", "mid", "near"];

  private static readonly DEPTH_TO_SCALE: Record<string, number> = { near: 1, mid: 0.8, far: 0.6 };

  // Why: the height, in drawing units, of the point where a hand grips each object.
  private static readonly ASSET_TO_GRIP_HEIGHT: Partial<Record<AssetId, number>> = { cup: 6, suitcase: 44, books: 8, ball: 12 };

  private static readonly SEATED_POSES = ["sitting", "typing", "reading", "drinking", "sitting_floor", "hugging_knees"];

  private static readonly SEAT_ALIGN_TO_OFFSET: Record<string, number> = { left: -0.28, right: 0.28, center: 0 };

  private static readonly SURFACE_ALIGN_TO_OFFSET: Record<string, number> = {
    "left": -0.3, "right": 0.3, "center": 0, "far-left": -0.42, "far-right": 0.42,
  };

  private static readonly LAYER_TO_Z_SHIFT: Record<string, number> = { back: -0.2, front: 0.2 };

  private static readonly SKY_SCALE = 0.9;

  private static readonly WALL_SCALE = 0.85;

  private static readonly WATER_SCALE = 0.55;

  private static readonly DEFAULT_SKY_ALTITUDE = 0.14;

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

  private static readonly HELD_ANY_WIDTH_FACTOR = 0.42;

  private static readonly DEFAULT_GAP = 0.015;

  private static readonly BEHIND_OFFSET = 0.35;

  private static readonly DEPTH_Z_STEP = 1000;

  private static readonly FLOOR_Z_SHIFT = 400;

  private static readonly LAYER_Z_SHIFT = 300;

  static slotFraction(at: unknown, fallback: number): number {
    if (typeof at === "number") {
      return at;
    }
    return typeof at === "string" ? PlacementService.SLOT_TO_FRACTION[at] ?? fallback : fallback;
  }

  static placeAll(context: CompilationContext, resolution: ResolutionOrder): Record<string, Placement> {
    const placed: Record<string, Placement> = {};
    for (const id of resolution.order) {
      const placement = PlacementService.place(id, context, { placed, heldBy: resolution.heldBy });
      if (placement) {
        placed[id] = placement;
      }
    }
    return placed;
  }

  private static place(
    id: string,
    context: CompilationContext,
    state: { placed: Record<string, Placement>; heldBy: Record<string, string> },
  ): Placement | null {
    const { objects, library, warnings, theme } = context;
    const object = objects[id] ?? {};
    const requested = object.asset ?? id;
    const resolved = AssetService.resolveAsset(requested, library);
    if (!resolved.id) {
      if (context.failedAssets.has(requested)) {
        warnings.push(`'${id}' was ignored because custom asset '${requested}' failed to load`);
      } else {
        warnings.push(`asset '${requested}' (in '${id}') does not exist; did you mean: ${(resolved.suggest ?? []).join(", ")}?`);
      }
      return null;
    }
    const asset = library[resolved.id];
    const size = asset.size ? asset.size(object as AssetParams) : { w: asset.width, h: asset.height };
    const request: PlacementRequest = {
      id, object, asset, assetId: resolved.id, size, sizeFactor: PlacementService.sizeFactor(id, object, warnings),
      placed: state.placed, heldBy: state.heldBy,
    };
    const position = PlacementService.position(request, context);
    if (!position) {
      return null;
    }
    const drawn = asset.draw({ ...object } as AssetParams, theme);
    const drawnSize = typeof drawn === "string" ? size : drawn.box;
    const width = drawnSize.w * position.scale;
    const height = drawnSize.h * position.scale;
    return {
      id, asset: resolved.id, kind: asset.kind, x: position.x, y: position.y, scale: position.scale, width, height, z: position.z,
      depth: position.depth, svg: typeof drawn === "string" ? drawn : drawn.svg, bodySvg: "",
      surfaceTop: asset.topOf ? asset.topOf(object as AssetParams) : asset.top,
      hasHaze: object.haze !== false, hand: typeof drawn === "string" ? undefined : drawn.hand,
      boxLeft: position.x - width / 2, boxRight: position.x + width / 2, boxTop: position.y - height, boxBottom: position.y,
      related: DependencyOrderService.dependenciesOf(object).concat(object.holds ?? [], state.heldBy[id] ?? []),
      isOffView: false, isFocus: false,
    };
  }

  private static sizeFactor(id: string, object: SceneObject, warnings: string[]): number {
    if (typeof object.size === "number") {
      return object.size;
    }
    const known = PlacementService.SIZE_NAME_TO_FACTOR[object.size ?? "medium"];
    if (known !== undefined) {
      return known;
    }
    warnings.push(`size '${object.size}' is invalid in '${id}' (use ${Object.keys(PlacementService.SIZE_NAME_TO_FACTOR).join(", ")})`);
    return 1;
  }

  private static position(request: PlacementRequest, context: CompilationContext): Position | null {
    const { asset, object, id, heldBy, placed } = request;
    if (asset.kind === "sky") {
      return PlacementService.positionSky(request, context);
    }
    if (asset.kind === "wall") {
      return PlacementService.positionWall(request, context);
    }
    if (asset.kind === "ceiling") {
      return PlacementService.positionCeiling(request, context);
    }
    if (asset.kind === "water") {
      return PlacementService.positionWater(request, context);
    }
    if (object.on) {
      return PlacementService.positionOnTop(request, context);
    }
    const holder = heldBy[id] ? placed[heldBy[id]] : undefined;
    if (holder) {
      return PlacementService.positionHeld(request, holder);
    }
    return PlacementService.positionOnGround(request, context);
  }

  private static reference(request: PlacementRequest, key: "left_of" | "right_of" | "behind" | "in_front_of" | "on" | "under" | "above"): Placement | undefined {
    const id = request.object[key];
    return id ? request.placed[id] : undefined;
  }

  private static positionSky(request: PlacementRequest, context: CompilationContext): Position {
    const { object, size, sizeFactor, assetId } = request;
    const { width, height, unit } = context;
    let scale = unit * sizeFactor * PlacementService.SKY_SCALE;
    const slot = String(object.at || "top-right").replace("top-", "").replace("sky-", "");
    const fallback = typeof object.at === "number" ? object.at : 0.5;
    let x = (PlacementService.SLOT_TO_FRACTION[slot] ?? fallback) * width;
    let y = height * (object.altitude ?? PlacementService.DEFAULT_SKY_ALTITUDE) + (size.h * scale) / 2;
    if (assetId === "stars") {
      x = width / 2;
      y = height * PlacementService.STARS_HEIGHT_FRACTION;
      scale = width / PlacementService.STARS_REFERENCE_WIDTH;
    }
    return { x, y, scale, z: PlacementService.SKY_Z, depth: object.depth ?? null };
  }

  private static positionWall(request: PlacementRequest, context: CompilationContext): Position {
    const { object, size, sizeFactor, asset, id } = request;
    const { width, height, unit, warnings, setting, lines } = context;
    if (setting !== "indoor") {
      warnings.push(`'${id}' is a wall object, but the setting is '${setting}'`);
    }
    const scale = unit * sizeFactor * PlacementService.WALL_SCALE;
    const margin = PlacementService.WALL_SIDE_MARGIN * width;
    let x = PlacementService.slotFraction(object.at, 0.5) * width;
    const leftOf = PlacementService.reference(request, "left_of");
    const rightOf = PlacementService.reference(request, "right_of");
    const above = PlacementService.reference(request, "above");
    if (leftOf) {
      x = leftOf.boxLeft - margin - (size.w * scale) / 2;
    }
    if (rightOf) {
      x = rightOf.boxRight + margin + (size.w * scale) / 2;
    }
    if (above) {
      x = above.x + (typeof object.offset === "number" ? object.offset : 0) * above.width;
    }
    const y = height * lines.horizon - (object.elevation ?? asset.elevation ?? 0) * unit * PlacementService.WALL_SCALE;
    return { x, y, scale, z: PlacementService.WALL_Z, depth: object.depth ?? null };
  }

  private static positionCeiling(request: PlacementRequest, context: CompilationContext): Position {
    const { object, sizeFactor, placed } = request;
    const { width, unit } = context;
    const above = object.above ? placed[object.above] : undefined;
    const x = above ? above.x : PlacementService.slotFraction(object.at, 0.5) * width;
    const y = (object.hang ?? PlacementService.DEFAULT_HANG) * unit;
    return { x, y, scale: unit * sizeFactor, z: PlacementService.CEILING_Z, depth: object.depth ?? null };
  }

  private static positionWater(request: PlacementRequest, context: CompilationContext): Position {
    const { object, sizeFactor, id } = request;
    const { width, height, unit, lines, warnings } = context;
    if (!lines.sea) {
      warnings.push(`'${id}' is a water object, but the scene has no sea (use setting: beach)`);
    }
    return {
      x: PlacementService.slotFraction(object.at, 0.7) * width,
      y: height * ((lines.sea ?? lines.horizon) - PlacementService.WATER_LINE_OFFSET),
      scale: unit * sizeFactor * PlacementService.WATER_SCALE,
      z: PlacementService.WATER_Z,
      depth: object.depth ?? null,
    };
  }

  private static alignOffset(align: unknown, names: Record<string, number>): number {
    if (typeof align === "number") {
      return align;
    }
    return names[typeof align === "string" ? align : "center"] ?? 0;
  }

  private static positionOnTop(request: PlacementRequest, context: CompilationContext): Position | null {
    const { object, sizeFactor, id, assetId, placed } = request;
    const { library, warnings } = context;
    const support = object.on ? placed[object.on] : undefined;
    if (!support) {
      warnings.push(`'${id}' has 'on: ${object.on}', but '${object.on}' was not positioned`);
      return null;
    }
    const supportAsset = library[support.asset];
    const scale = support.scale * sizeFactor;
    const isSeated = PlacementService.SEATED_POSES.includes(String(object.pose));
    if (supportAsset.seat && isSeated) {
      const offset = PlacementService.alignOffset(object.align, PlacementService.SEAT_ALIGN_TO_OFFSET);
      const backset = object.facing === "left" ? 1 : -1;
      const bodyScaleY = assetId === "person" ? PersonUtil.bodyScale(object).by : 1;
      return {
        x: support.x + offset * support.width + backset * PlacementService.SEAT_BACKSET_UNITS * support.scale,
        y: support.y - supportAsset.seat * support.scale + PlacementService.SEAT_HIP_UNITS * bodyScaleY * support.scale * sizeFactor,
        scale, z: support.z + PlacementService.ON_Z_STEP, depth: support.depth,
      };
    }
    const surfaceTop = support.surfaceTop ?? supportAsset.top;
    if (!surfaceTop) {
      warnings.push(`'${object.on}' has no supporting surface; '${id}' cannot sit on top of it`);
      return { x: support.x, y: support.y - support.height, scale, z: support.z + PlacementService.ON_Z_STEP, depth: support.depth };
    }
    const offset = PlacementService.alignOffset(object.align, PlacementService.SURFACE_ALIGN_TO_OFFSET);
    const layerShift = PlacementService.LAYER_TO_Z_SHIFT[object.layer ?? ""] ?? 0;
    return {
      x: support.x + offset * support.width, y: support.y - surfaceTop * support.scale, scale,
      z: support.z + PlacementService.ON_Z_STEP + layerShift, depth: support.depth,
    };
  }

  private static positionHeld(request: PlacementRequest, holder: Placement): Position {
    const { sizeFactor, size, asset, assetId } = request;
    const scale = holder.scale * sizeFactor;
    const hand = holder.hand ?? [0, 0];
    const side = Math.sign(hand[0]) || 1;
    const anyShift = asset.kind === "any" ? side * size.w * PlacementService.HELD_ANY_WIDTH_FACTOR * scale : 0;
    const grip = PlacementService.ASSET_TO_GRIP_HEIGHT[assetId as AssetId] ?? size.h / 2;
    return {
      x: holder.x + hand[0] * holder.scale + anyShift,
      y: holder.y + hand[1] * holder.scale + grip * scale,
      scale, z: holder.z + PlacementService.ON_Z_STEP, depth: holder.depth,
    };
  }

  private static isDepth(value: string): value is Depth {
    return PlacementService.DEPTHS.includes(value);
  }

  private static depthFor(request: PlacementRequest, reference: Placement | undefined, warnings: string[]): Depth {
    const { object, id } = request;
    let depth: string = object.depth ?? "";
    if (!depth) {
      const referenceIndex = PlacementService.DEPTHS.indexOf(reference?.depth ?? "near");
      if (object.behind && reference) {
        depth = PlacementService.DEPTHS[Math.max(0, referenceIndex - 1)];
      } else if (object.in_front_of && reference) {
        depth = PlacementService.DEPTHS[Math.min(PlacementService.DEPTHS.length - 1, referenceIndex + 1)];
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

  private static positionOnGround(request: PlacementRequest, context: CompilationContext): Position {
    const { object, size, sizeFactor, asset, id, assetId } = request;
    const { width, height, unit, lines, warnings } = context;
    if (asset.kind === "surface") {
      warnings.push(`'${id}' (${assetId}) usually sits on a surface; add 'on: <table>'`);
    }
    const reference = ["left_of", "right_of", "behind", "in_front_of", "under"]
      .map((key) => PlacementService.reference(request, key as "left_of"))
      .find(Boolean);
    const depth = PlacementService.depthFor(request, reference, warnings);
    const scale = unit * sizeFactor * PlacementService.DEPTH_TO_SCALE[depth];
    const gap = (object.gap ?? PlacementService.DEFAULT_GAP) * width;
    const halfWidth = (size.w * scale) / 2;
    const offsetOf = (fallback: number): number => (typeof object.offset === "number" ? object.offset : fallback);
    let x = PlacementService.slotFraction(object.at, 0.5) * width;
    if (reference) {
      if (object.left_of) {
        x = reference.boxLeft - gap - halfWidth;
      }
      if (object.right_of) {
        x = reference.boxRight + gap + halfWidth;
      }
      if (object.behind) {
        x = reference.x + offsetOf(PlacementService.BEHIND_OFFSET) * reference.width;
      }
      if (object.in_front_of) {
        x = reference.x + offsetOf(0) * reference.width;
      }
      if (object.under) {
        x = reference.x;
      }
    }
    const y = height * lines.base[depth];
    let z = PlacementService.DEPTHS.indexOf(depth) * PlacementService.DEPTH_Z_STEP + y;
    if (asset.kind === "floor") {
      z -= PlacementService.FLOOR_Z_SHIFT;
    }
    if (object.layer === "back") {
      z -= PlacementService.LAYER_Z_SHIFT;
    }
    if (object.layer === "front") {
      z += PlacementService.LAYER_Z_SHIFT;
    }
    return { x, y, scale, z, depth };
  }
}
