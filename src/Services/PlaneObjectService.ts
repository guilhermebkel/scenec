import type { AssetKind } from "@/Protocols/AssetProtocol.ts";
import type { PlaneWorld } from "@/Protocols/PlaneProtocol.ts";
import type { SceneObject } from "@/Protocols/SceneProtocol.ts";
import { PlacementService } from "@/Services/PlacementService.ts";
import { PlanePathService } from "@/Services/PlanePathService.ts";
import { PlaneSpaceService } from "@/Services/PlaneSpaceService.ts";
import { PlaneSpriteService } from "@/Services/PlaneSpriteService.ts";
import { IdUtil } from "@/Utils/IdUtil.ts";
import { RequireUtil } from "@/Utils/RequireUtil.ts";

// Why: a unique marker tells "try again in the next pass" apart from "nothing to place" (null).
const WAIT: unique symbol = Symbol("wait");

interface Target {
  groundX: number;
  groundZ: number | null;
}

type Outcome = Target | typeof WAIT | null;

export class PlaneObjectService {
  // Why: an object can sit near another one that comes later in the file, so unresolved anchors get a few more passes.
  private static readonly PASSES = 4;

  private static readonly DEFAULT_ALTITUDE = 0.12;

  private static readonly SKY_UNIT = 0.0017;

  private static readonly ROAD_SIDE_GAP = 0.05;

  private static readonly SPOT_NUDGE = 0.005;

  private static readonly FALLBACK_OFFSET = 0.1;

  private static readonly BOX_EDGE_TOLERANCE = 0.005;

  private static readonly SIDE_TO_SIGN: Record<NonNullable<SceneObject["side"]>, number> = { left: 1, right: -1 };

  private static readonly SKY_KIND: AssetKind = "sky";

  static place(world: PlaneWorld): void {
    const objects = world.scene.objects ?? {};
    const pending = new Set(Object.keys(objects));
    for (let pass = 0; pass < PlaneObjectService.PASSES && pending.size > 0; pass++) {
      for (const id of [...pending]) {
        const object = RequireUtil.defined(objects[id], `object '${id}'`);
        const target = PlaneObjectService.target(world, id, object, pass);
        if (target === WAIT) {
          continue;
        }
        pending.delete(id);
        if (target === null) {
          continue;
        }
        if (target.groundZ === null) {
          PlaneObjectService.placeSky(world, id, object, target.groundX);
        } else {
          PlaneObjectService.placeGround(world, id, object, [target.groundX, target.groundZ]);
        }
      }
    }
  }

  private static target(world: PlaneWorld, id: string, object: SceneObject, pass: number): Outcome {
    const { warnings, road } = world;
    if (Array.isArray(object.at)) {
      return { groundX: object.at[0], groundZ: object.at[1] };
    }
    if (object.along !== undefined) {
      if (road.samples.length === 0) {
        warnings.push(`'${id}' uses 'along', but the scene has no path`);
        return null;
      }
      const { point, normal } = PlanePathService.pointAt(road, object.along);
      const side = IdUtil.lookup(PlaneObjectService.SIDE_TO_SIGN, object.side) ?? 0;
      const distance = object.dist ?? (side === 0 ? 0 : road.width / 2 + PlaneObjectService.ROAD_SIDE_GAP);
      return { groundX: point[0] + normal[0] * distance * side, groundZ: point[1] + normal[1] * distance * side };
    }
    if (object.near !== undefined && object.near !== "") {
      return PlaneObjectService.nearTarget(world, id, object, pass);
    }
    const isSkyAsset = PlaneSpriteService.find(world, PlaneSpriteService.assetName(id, object))?.asset.kind === "sky";
    if (typeof object.at === "string" && isSkyAsset) {
      const slot = IdUtil.lookup(PlacementService.SLOT_TO_FRACTION, object.at.replace("top-", "")) ?? 0.5;
      return { groundX: slot, groundZ: null };
    }
    warnings.push(`'${id}' has no position: use at: [x, z], near, or along`);
    return null;
  }

  private static nearTarget(world: PlaneWorld, id: string, object: SceneObject, pass: number): Outcome {
    const near = object.near ?? "";
    const anchor = world.pointIdToPosition.get(near);
    if (!anchor) {
      if (pass === PlaneObjectService.PASSES - 1) {
        world.warnings.push(`'${id}' has 'near: ${near}', which does not exist`);
        return null;
      }
      return WAIT;
    }
    const [anchorX, anchorZ] = anchor;
    if (Array.isArray(object.offset)) {
      return { groundX: anchorX + object.offset[0], groundZ: anchorZ + object.offset[1] };
    }
    const name = PlaneSpriteService.assetName(id, object);
    if (name === "person" || object.on_spot === true) {
      return { groundX: anchorX, groundZ: anchorZ - PlaneObjectService.SPOT_NUDGE };
    }
    const found = PlaneSpriteService.find(world, name);
    const widthUnits = found ? PlaneSpriteService.dimensions(found.asset, object).w : 0;
    const factor = PlaneSpriteService.sizeFactor(object.size);
    const spot = found && PlaneSpaceService.findSpot(world, { anchor, widthUnits, factor });
    if (!spot) {
      world.warnings.push(`no free space found near '${near}' for '${id}'; use 'offset: [dx, dz]'`);
      const nudge = PlaneObjectService.FALLBACK_OFFSET;
      return { groundX: anchorX + nudge, groundZ: anchorZ + nudge };
    }
    return { groundX: spot[0], groundZ: spot[1] };
  }

  private static placeSky(world: PlaneWorld, id: string, object: SceneObject, slot: number): void {
    const found = PlaneSpriteService.find(world, PlaneSpriteService.assetName(id, object));
    if (!found) {
      return;
    }
    const { camera, theme } = world;
    const scale = camera.height * PlaneObjectService.SKY_UNIT * PlaneSpriteService.sizeFactor(object.size);
    const drawn = found.asset.draw({ ...object }, theme);
    const altitude = object.altitude ?? PlaneObjectService.DEFAULT_ALTITUDE;
    world.sky.push({
      id,
      screenX: slot * camera.width,
      screenY: camera.height * altitude + found.asset.height * scale / 2,
      scale,
      svg: typeof drawn === "string" ? drawn : drawn.svg,
      width: found.asset.width * scale,
      height: found.asset.height * scale,
    });
  }

  private static placeGround(world: PlaneWorld, id: string, object: SceneObject, at: readonly [number, number]): void {
    const { warnings, road } = world;
    const [groundX, groundZ] = at;
    let lift: number | undefined;
    if (object.on !== undefined && object.on !== "") {
      const box = world.boxes.find((candidate) => candidate.id === object.on);
      if (box) {
        lift = box.height;
        const tolerance = PlaneObjectService.BOX_EDGE_TOLERANCE;
        const isOutsideX = groundX < box.x0 - tolerance || groundX > box.x1 + tolerance;
        const isOutsideZ = groundZ < box.z0 - tolerance || groundZ > box.z1 + tolerance;
        if (isOutsideX || isOutsideZ) {
          warnings.push(`'${id}' has 'on: ${object.on}', but position [${groundX}, ${groundZ}] is outside the top of the box`);
        }
      } else {
        warnings.push(`'${id}' has 'on: ${object.on}', which is not a box`);
      }
    }
    const sprite = PlaneSpriteService.add(world, { id, object, groundX, groundZ, lift });
    if (!sprite) {
      return;
    }
    world.protectedSprites.push(sprite);
    const roadDistance = PlanePathService.distanceToRoad(road, groundX, groundZ);
    const isOnRoad = road.samples.length > 0 && roadDistance < road.width / 2;
    if (isOnRoad && !sprite.isPerson && sprite.kind !== PlaneObjectService.SKY_KIND && object.on_path !== true) {
      warnings.push(`'${id}' is on top of the path; move it or use 'on_path: true' if intended`);
    }
  }
}
