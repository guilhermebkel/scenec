import { BaseAsset } from "@/Resources/Assets/BaseAsset.ts";
import { ShapeUtil } from "@/Utils/ShapeUtil.ts";

export class StarsAsset extends BaseAsset {
  readonly id = "stars";

  readonly kind = "sky";

  readonly backdrop = true;

  readonly w = 600;

  readonly h = 200;

  readonly tags = ["céu estrelado", "starfield"];

  draw(p: any, t: any) {
    let s = ""; const pts = [[-280, -170], [-210, -60], [-150, -140], [-90, -30], [-30, -180], [40, -90], [110, -160], [170, -40], [230, -130], [290, -190], [-250, -110], [70, -20], [-120, -190], [200, -100]];
    pts.forEach(([x, y], i) => { s += ShapeUtil.circle(x, y, i % 3 === 0 ? 2.2 : 1.3, t.paper, `opacity="${0.5 + (i % 4) * 0.12}"`); }); return s;
  }
}
