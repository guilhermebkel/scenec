import type { AssetParams, PersonDrawing } from "@/Protocols/AssetProtocol.ts";
import type { CompilationContext, Placement } from "@/Protocols/CompilationProtocol.ts";

export class GazeService {
  private static readonly DIRECTION_NAMES = [
    "left", "right", "up", "down", "up-left", "up-right", "down-left", "down-right", "camera", "forward",
  ];

  private static readonly EYE_HEIGHT_FRACTION = 0.85;

  static redraw(placed: Record<string, Placement>, context: CompilationContext): void {
    const { objects, library, theme, warnings } = context;
    for (const placement of Object.values(placed)) {
      const object = objects[placement.id];
      if (placement.asset !== "person" || !object || typeof object.look !== "string") {
        continue;
      }
      const target = placed[object.look];
      if (!target) {
        if (!GazeService.DIRECTION_NAMES.includes(object.look)) {
          warnings.push(`'${placement.id}' looks at '${object.look}', which does not exist in the scene`);
        }
        continue;
      }
      const deltaX = target.x - placement.x;
      const deltaY = target.y - target.height / 2 - (placement.y - placement.height * GazeService.EYE_HEIGHT_FRACTION);
      const length = Math.hypot(deltaX, deltaY) || 1;
      const params = { ...object, gaze: [deltaX / length, deltaY / length] } as AssetParams;
      const drawing = library.person?.draw(params, theme) as PersonDrawing | undefined;
      if (drawing) {
        placement.svg = drawing.svg;
      }
    }
  }
}
