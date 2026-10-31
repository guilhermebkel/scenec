import type { DetailName } from "@/Protocols/AssetProtocol.ts";
import type { Depth, CompilationContext } from "@/Protocols/CompilationProtocol.ts";
import type { SceneObject } from "@/Protocols/SceneProtocol.ts";
import { DetailUtil } from "@/Utils/DetailUtil.ts";
import { IdUtil } from "@/Utils/IdUtil.ts";

export class DetailService {
  private static readonly DEPTH_TO_DETAIL: Partial<Record<Depth, DetailName>> = { far: "low" };

  static resolve(id: string, object: SceneObject, context: CompilationContext): DetailName {
    if (DetailUtil.isDetail(object.detail)) {
      return object.detail;
    }
    // Why: art direction puts detail where the eye should land; a group id in `focus` covers its parts (`<id>_<part>`).
    const focus = ([] as string[]).concat(context.canvas.focus ?? []);
    if (focus.some((focused) => id === focused || id.startsWith(`${focused}_`))) {
      return "high";
    }
    return IdUtil.lookup(DetailService.DEPTH_TO_DETAIL, object.depth) ?? "mid";
  }
}
