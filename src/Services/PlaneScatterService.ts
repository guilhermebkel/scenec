import type { AssetId } from "@/Protocols/AssetProtocol.ts";
import type { PlaneWorld } from "@/Protocols/PlaneProtocol.ts";
import type { ScatterOptions } from "@/Protocols/SceneProtocol.ts";
import { PlaneSpaceService } from "@/Services/PlaneSpaceService.ts";
import { PlaneSpriteService } from "@/Services/PlaneSpriteService.ts";
import { SeedUtil } from "@/Utils/SeedUtil.ts";

export class PlaneScatterService {
  private static readonly DEFAULT_SEED = 7;

  private static readonly DEFAULT_ASSETS: readonly AssetId[] = ["tree", "bush"];

  private static readonly DEFAULT_AREA = [0.02, 0, 0.98, 1.05] as const;

  private static readonly DEFAULT_COUNT = 15;

  private static readonly DEFAULT_SIZE = 0.8;

  private static readonly MAX_TRIES = 3000;

  static place(world: PlaneWorld): void {
    (world.scene.scatter ?? []).forEach((options, index) => {
      PlaneScatterService.scatter(world, options, index);
    });
  }

  private static scatter(world: PlaneWorld, options: ScatterOptions, index: number): void {
    const random = SeedUtil.sequence(options.seed ?? PlaneScatterService.DEFAULT_SEED + index);
    const names = options.assets ?? PlaneScatterService.DEFAULT_ASSETS;
    const [areaX0, areaZ0, areaX1, areaZ1] = options.area ?? PlaneScatterService.DEFAULT_AREA;
    const wanted = options.count ?? PlaneScatterService.DEFAULT_COUNT;
    let placed = 0;
    let tries = 0;
    while (placed < wanted && tries++ < PlaneScatterService.MAX_TRIES) {
      const groundX = areaX0 + random() * (areaX1 - areaX0);
      const groundZ = areaZ0 + random() * (areaZ1 - areaZ0);
      const name = names[Math.floor(random() * names.length)];
      const found = name === undefined ? undefined : PlaneSpriteService.find(world, name);
      if (name === undefined || !found) {
        if (name !== undefined) {
          world.warnings.push(`scatter: asset '${name}' does not exist`);
        }
        return;
      }
      const factor = (options.size ?? PlaneScatterService.DEFAULT_SIZE) * (0.8 + random() * 0.4);
      const radius = world.camera.worldRadius(found.asset.width, groundZ, factor) * 0.9;
      const candidate = { asset: found.asset, params: {} };
      if (!PlaneSpaceService.isFree(world, groundX, groundZ, radius)
        || PlaneSpaceService.occludes(world, [groundX, groundZ], candidate, factor)) {
        continue;
      }
      const object = { asset: name, size: factor, facing: random() < 0.5 ? "left" : "right" } as const;
      PlaneSpriteService.add(world, { id: `scatter${index}_${placed}`, object, groundX, groundZ, isDecor: true });
      placed++;
    }
  }
}
