import type { AssetIdToAsset } from "@/Protocols/CompilationProtocol.ts";
import type { GroundPoint, PlaneWorld } from "@/Protocols/PlaneProtocol.ts";
import type { CompileResult } from "@/Protocols/ResultProtocol.ts";
import type { Scene } from "@/Protocols/SceneProtocol.ts";
import type { Theme } from "@/Protocols/ThemeProtocol.ts";
import { PlaneBackgroundService } from "@/Services/PlaneBackgroundService.ts";
import { PlaneBoxService } from "@/Services/PlaneBoxService.ts";
import { PlaneDepthService } from "@/Services/PlaneDepthService.ts";
import { PlaneLabelService } from "@/Services/PlaneLabelService.ts";
import { PlaneObjectService } from "@/Services/PlaneObjectService.ts";
import { PlanePathService } from "@/Services/PlanePathService.ts";
import { PlaneProjectionService } from "@/Services/PlaneProjectionService.ts";
import { PlaneRoadService } from "@/Services/PlaneRoadService.ts";
import { PlaneScatterService } from "@/Services/PlaneScatterService.ts";
import { PlaneSpriteService } from "@/Services/PlaneSpriteService.ts";
import { PlaneTitleService } from "@/Services/PlaneTitleService.ts";
import { PlaneZoneService } from "@/Services/PlaneZoneService.ts";

interface PlaneInput {
  library: AssetIdToAsset;
  theme: Theme;
  warnings: string[];
  width: number;
  height: number;
}

export class PlaneModule {
  private static readonly FRAME_TOLERANCE = 0.05;

  static compilePlane(scene: Scene, input: PlaneInput): CompileResult {
    const { library, theme, warnings, width, height } = input;
    const pointIdToPosition = new Map<string, GroundPoint>();
    const world: PlaneWorld = {
      scene, theme, library, warnings, pointIdToPosition,
      camera: PlaneProjectionService.create(scene.canvas ?? {}, width, height),
      road: PlanePathService.build(scene.path, warnings, pointIdToPosition),
      zoneNameToDefinition: PlaneZoneService.definitions(scene),
      boxes: [], tints: [], ground: [], sky: [], footprints: [], protectedSprites: [],
    };
    PlaneZoneService.tint(world);
    PlaneBoxService.read(world);
    PlaneObjectService.place(world);
    PlaneZoneService.decorate(world);
    PlaneScatterService.place(world);
    PlaneModule.markOccupied(world);
    world.ground.sort((first, second) => second.z - first.z || first.screenY - second.screenY);

    const background = PlaneBackgroundService.draw(world);
    const road = PlaneRoadService.draw(world);
    const labels = PlaneLabelService.place(world);
    const labelSvg = PlaneLabelService.draw(world, labels);
    const titleSvg = PlaneTitleService.draw(world, labels);
    PlaneModule.warnOutsideFrame(world);

    const sky = world.sky.map((sprite) => PlaneSpriteService.drawSky(world, sprite)).join("\n");
    const depthSorted = PlaneDepthService.draw(world);
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" `
      + `width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">\n`
      + `<defs>${background.defs}</defs>\n${background.svg}\n${sky}\n${road}\n${depthSorted}\n${labelSvg}\n${titleSvg}\n</svg>`;
    return { svg, warnings: [...new Set<string>(warnings)], description: PlaneModule.describe(world) };
  }

  private static markOccupied(world: PlaneWorld): void {
    for (const checkpoint of world.road.checkpoints) {
      checkpoint.isOccupied = world.ground.some((sprite) => sprite.isPerson
        && Math.hypot(sprite.x - checkpoint.at[0], sprite.z - checkpoint.at[1]) < world.road.checkpointRadius);
    }
  }

  private static warnOutsideFrame(world: PlaneWorld): void {
    const { width } = world.camera;
    const tolerance = PlaneModule.FRAME_TOLERANCE;
    for (const sprite of world.ground) {
      const { bounds } = sprite;
      const marginX = sprite.width * tolerance;
      const marginY = sprite.height * tolerance;
      if (!sprite.isDecor && (bounds.x0 < -marginX || bounds.x1 > width + marginX || bounds.y0 < -marginY)) {
        world.warnings.push(`'${sprite.id}' is outside the frame`);
      }
    }
  }

  private static describe(world: PlaneWorld): string {
    const { camera, road, ground } = world;
    return [
      ...road.checkpoints.map((checkpoint, index) => {
        const [groundX, groundZ] = checkpoint.at;
        const zone = checkpoint.zone === undefined || checkpoint.zone === "" ? "" : `, zone ${checkpoint.zone}`;
        const column = Math.round(camera.screenX(groundX, groundZ) / camera.width * 100);
        const row = Math.round(camera.screenY(groundZ) / camera.height * 100);
        const label = checkpoint.label === undefined || checkpoint.label === "" ? "no label" : checkpoint.label;
        return `point ${index + 1} '${checkpoint.id}' (${label}): x=${groundX}, z=${groundZ}, screen=(${column}%, ${row}%)${zone}`;
      }),
      ...ground.filter((sprite) => !sprite.isDecor).map((sprite) => {
        const percent = Math.round(sprite.height / camera.height * 100);
        return `${sprite.id} (${sprite.asset}): x=${sprite.x.toFixed(2)}, z=${sprite.z.toFixed(2)}, ${percent}% of the height`;
      }),
      `${ground.filter((sprite) => sprite.isDecor).length} automatic scenery elements (zones and scatter)`,
    ].join("\n");
  }
}
