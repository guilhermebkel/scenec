import { BaseKit } from "@/Resources/Kits/BaseKit.ts";

export class OutlineKit extends BaseKit {
  readonly id = "outline";

  readonly description = "cartoon outline: thick border on the silhouette and a thin line inside";
  readonly outline = { w: 2.6, inner: 0.9, wobble: 1.25, weight: 0.45, detailRatio: 0.55 };
  readonly light = { strength: 0.45 };
}
