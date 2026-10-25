import type { AssetId, AssetParams } from "@/Protocols/AssetProtocol.ts";
import type { Checkpoint, PlaneWorld, ZoneDefinition, ZoneName } from "@/Protocols/PlaneProtocol.ts";
import type { Scene, ZoneDecor } from "@/Protocols/SceneProtocol.ts";
import type { Theme } from "@/Protocols/ThemeProtocol.ts";
import { PlaneSpaceService } from "@/Services/PlaneSpaceService.ts";
import { PlaneSpriteService } from "@/Services/PlaneSpriteService.ts";
import { ColorUtil } from "@/Utils/ColorUtil.ts";
import { ThemeUtil } from "@/Utils/ThemeUtil.ts";

type PresetDecor = ZoneDecor & { asset: AssetId };

interface ZonePreset {
  tint: (theme: Theme) => string;
  decor: readonly PresetDecor[];
}

export class PlaneZoneService {
  static readonly ZONE_TO_PRESET: Record<ZoneName, ZonePreset> = {
    home: {
      tint: (theme) => ColorUtil.sh(theme.foliage[1], 0.5),
      decor: [{ asset: "house", size: 0.75 }, { asset: "tree", size: 0.7 }, { asset: "bush", size: 0.8 }],
    },
    school: {
      tint: (theme) => ColorUtil.sh(theme.accent, 0.68),
      decor: [{ asset: "school", size: 0.85 }, { asset: "tree", size: 0.7 }, { asset: "pennant", size: 0.8 }],
    },
    campus: {
      tint: (theme) => ColorUtil.sh(theme.foliage[1], 0.6),
      decor: [{ asset: "university", size: 0.85 }, { asset: "tree", size: 0.75 }, { asset: "bench", size: 0.8 }],
    },
    office: {
      tint: (theme) => ColorUtil.sh(theme.metal, 0.5),
      decor: [
        { asset: "building", floors: 7, width: 90, size: 0.75 },
        { asset: "building", floors: 5, width: 80, seed: 2, color: "primary", size: 0.75 },
        { asset: "streetlight", size: 0.7 },
      ],
    },
    lab: {
      tint: (theme) => ColorUtil.sh(theme.glass, 0.05),
      decor: [{ asset: "lab", size: 0.85 }, { asset: "pine", size: 0.6 }, { asset: "bush", size: 0.8 }],
    },
    ceremony: {
      tint: (theme) => ColorUtil.sh(theme.accent, 0.4),
      decor: [
        { asset: "stage", size: 0.9 }, { asset: "balloons", size: 0.9 }, { asset: "balloons", size: 0.8 },
        { asset: "pennant", color: "primary", size: 0.8 },
      ],
    },
    park: {
      tint: (theme) => ColorUtil.sh(theme.foliage[0], 0.3),
      decor: [{ asset: "tree", size: 0.8 }, { asset: "bench", size: 0.8 }, { asset: "flowers", size: 0.9 }],
    },
    city: {
      tint: (theme) => ColorUtil.sh(theme.metal, 0.5),
      decor: [{ asset: "building", floors: 8, size: 0.75 }, { asset: "car", size: 0.8 }, { asset: "streetlight", size: 0.7 }],
    },
    beach: {
      tint: (theme) => ColorUtil.sh(theme.accent, 0.7),
      decor: [{ asset: "palm", size: 0.6 }, { asset: "umbrella", size: 0.8 }],
    },
  };

  private static readonly DEFAULT_RADIUS = 0.24;

  static definitions(scene: Scene): Map<string, ZoneDefinition> {
    // Why: the author's zones add to the presets and replace one of the same name.
    return new Map(Object.entries<ZoneDefinition>({ ...PlaneZoneService.ZONE_TO_PRESET, ...scene.zones }));
  }

  static tint(world: PlaneWorld): void {
    const { road, zoneNameToDefinition, theme, warnings } = world;
    for (const checkpoint of road.checkpoints) {
      if (checkpoint.zone === undefined || checkpoint.zone === "") {
        continue;
      }
      const zone = zoneNameToDefinition.get(checkpoint.zone);
      if (!zone) {
        const available = [...zoneNameToDefinition.keys()].join(", ");
        warnings.push(`zone '${checkpoint.zone}' (point '${checkpoint.id}') does not exist; available: ${available}`);
        continue;
      }
      const color = typeof zone.tint === "function"
        ? zone.tint(theme)
        : ThemeUtil.resolve(theme, zone.tint, ColorUtil.sh(theme.ground, 0.3));
      const radius = zone.radius ?? PlaneZoneService.DEFAULT_RADIUS;
      world.tints.push({ x: checkpoint.at[0], z: checkpoint.at[1], radius, color });
      checkpoint.tint = color;
    }
  }

  static decorate(world: PlaneWorld): void {
    // Why: the scenery goes in after the author's own objects, so it respects the space they took.
    for (const checkpoint of world.road.checkpoints) {
      const zone = checkpoint.zone === undefined ? undefined : world.zoneNameToDefinition.get(checkpoint.zone);
      if (!zone || !checkpoint.hasDecor) {
        continue;
      }
      (zone.decor ?? []).forEach((decor, index) => {
        PlaneZoneService.place(world, checkpoint, decor, index);
      });
    }
  }

  private static place(world: PlaneWorld, checkpoint: Checkpoint, decor: ZoneDecor, index: number): void {
    const found = PlaneSpriteService.find(world, decor.asset);
    if (!found) {
      return;
    }
    const factor = decor.size ?? 1;
    const params = decor as AssetParams;
    const isFirst = index === 0;
    const spot = PlaneSpaceService.findSpot(world, {
      anchor: checkpoint.at,
      widthUnits: PlaneSpriteService.dimensions(found.asset, params).w,
      factor,
      candidate: { asset: found.asset, params },
      distances: isFirst ? undefined : PlaneSpaceService.CLOSE_DISTANCES,
    });
    if (!spot) {
      if (isFirst) {
        world.warnings.push(`zone '${checkpoint.zone}': no free space for '${decor.asset}' near '${checkpoint.id}'`);
      }
      return;
    }
    const sprite = PlaneSpriteService.add(world, {
      id: `${checkpoint.id}_${decor.asset}_${index}`, object: { ...decor, size: factor }, groundX: spot[0], groundZ: spot[1], isDecor: true,
    });
    if (sprite && isFirst) {
      world.protectedSprites.push(sprite);
    }
  }
}
