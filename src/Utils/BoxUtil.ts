import type { ScreenBox } from "@/Protocols/PlaneProtocol.ts";

export class BoxUtil {
  static overlapArea(first: ScreenBox, second: ScreenBox): number {
    return Math.max(0, Math.min(first.x1, second.x1) - Math.max(first.x0, second.x0))
      * Math.max(0, Math.min(first.y1, second.y1) - Math.max(first.y0, second.y0));
  }
}
