import type { AssetParams, LibraryAsset } from "@/Protocols/AssetProtocol.ts";
import type { GroundPoint, PlaneWorld, ScreenBox } from "@/Protocols/PlaneProtocol.ts";
import { PlanePathService } from "@/Services/PlanePathService.ts";
import { BoxUtil } from "@/Utils/BoxUtil.ts";
import { PlaneSpriteService } from "@/Services/PlaneSpriteService.ts";

interface Candidate {
  asset: LibraryAsset;
  params: AssetParams;
}

interface SpotSearch {
  anchor: GroundPoint;
  widthUnits: number;
  factor: number;
  distances?: readonly number[];
  candidate?: Candidate;
}

export class PlaneSpaceService {
  static readonly CLOSE_DISTANCES = [0.1, 0.14, 0.18, 0.22, 0.27];

  private static readonly ANGLES = [90, 60, 120, 30, 150, 0, 180, 20, 160, -30, 210, -90];

  private static readonly DISTANCES = [0.12, 0.16, 0.2, 0.25, 0.09];

  private static readonly DEPTH_SQUASH = 0.9;

  private static readonly OCCLUDER_MIN_OVERLAP = 0.12;

  private static readonly DEPTH_WEIGHT = 1.6;

  static isFree(world: PlaneWorld, groundX: number, groundZ: number, radius: number): boolean {
    const { road } = world;
    if (groundX - radius < 0.02 || groundX + radius > 0.98 || groundZ < -0.04 || groundZ > 1.08) {
      return false;
    }
    const roadClearance = road.width / 2 + radius * 0.9;
    if (road.samples.length > 0 && PlanePathService.distanceToRoad(road, groundX, groundZ) < roadClearance) {
      return false;
    }
    for (const checkpoint of road.checkpoints) {
      if (Math.hypot(checkpoint.at[0] - groundX, checkpoint.at[1] - groundZ) < road.checkpointRadius + radius) {
        return false;
      }
    }
    // Why: depth counts 1.6 times, so things stacked in z do not hide each other.
    return !world.footprints.some((footprint) => {
      const apart = Math.hypot(footprint.x - groundX, (footprint.z - groundZ) * PlaneSpaceService.DEPTH_WEIGHT);
      return apart < (footprint.radius + radius) * 0.85;
    });
  }

  static occludes(world: PlaneWorld, at: GroundPoint, candidate: Candidate, factor: number): boolean {
    const { camera, road } = world;
    const [groundX, groundZ] = at;
    const dimensions = PlaneSpriteService.dimensions(candidate.asset, candidate.params);
    const scale = camera.pxPerUnit(groundZ, factor);
    const screenX = camera.screenX(groundX, groundZ);
    const screenY = camera.screenY(groundZ);
    const width = dimensions.w * scale;
    const height = dimensions.h * scale;
    const box: ScreenBox = {
      x0: screenX - width * 0.42, x1: screenX + width * 0.42, y0: screenY - height * 0.95, y1: screenY - height * 0.04,
    };
    // Why: only every second road sample is tested; the road is dense enough that the gaps cannot hide a hit.
    for (let index = 0; index < road.samples.length; index += 2) {
      const sample = road.samples[index];
      if (sample !== undefined && sample[1] > groundZ + 0.005) {
        const px = camera.screenX(sample[0], sample[1]);
        const py = camera.screenY(sample[1]);
        if (px > box.x0 && px < box.x1 && py > box.y0 && py < box.y1) {
          return true;
        }
      }
    }
    return PlaneSpaceService.coversCheckpoint(world, groundZ, box)
      || PlaneSpaceService.coversProtected(world, groundZ, box);
  }

  static findSpot(world: PlaneWorld, search: SpotSearch): GroundPoint | null {
    const [anchorX, anchorZ] = search.anchor;
    for (const distance of search.distances ?? PlaneSpaceService.DISTANCES) {
      for (const angle of PlaneSpaceService.ANGLES) {
        const groundX = anchorX + Math.cos((angle * Math.PI) / 180) * distance;
        const groundZ = anchorZ + Math.sin((angle * Math.PI) / 180) * distance * PlaneSpaceService.DEPTH_SQUASH;
        const radius = world.camera.worldRadius(search.widthUnits, groundZ, search.factor);
        const { candidate, factor } = search;
        const isBlocked = !PlaneSpaceService.isFree(world, groundX, groundZ, radius)
          || (candidate !== undefined && PlaneSpaceService.occludes(world, [groundX, groundZ], candidate, factor));
        if (!isBlocked) {
          return [groundX, groundZ];
        }
      }
    }
    return null;
  }

  private static coversCheckpoint(world: PlaneWorld, groundZ: number, box: ScreenBox): boolean {
    const { camera, road } = world;
    return road.checkpoints.some((checkpoint) => {
      if (checkpoint.at[1] <= groundZ) {
        return false;
      }
      const px = camera.screenX(checkpoint.at[0], checkpoint.at[1]);
      const py = camera.screenY(checkpoint.at[1]);
      return px > box.x0 - 10 && px < box.x1 + 10 && py > box.y0 && py < box.y1 + 10;
    });
  }

  private static coversProtected(world: PlaneWorld, groundZ: number, box: ScreenBox): boolean {
    return world.protectedSprites.some((other) => {
      if (other.z <= groundZ) {
        return false;
      }
      const overlap = BoxUtil.overlapArea(box, other.bounds);
      return overlap > PlaneSpaceService.OCCLUDER_MIN_OVERLAP * other.width * other.height;
    });
  }
}
