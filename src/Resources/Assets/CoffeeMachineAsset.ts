import { ColorUtil } from "@/Utils/ColorUtil.ts";
import { BaseAsset } from "@/Resources/Assets/BaseAsset.ts";
import { ShapeUtil } from "@/Utils/ShapeUtil.ts";

export class CoffeeMachineAsset extends BaseAsset {
  readonly id = "coffee_machine";

  readonly kind = "surface";

  readonly w = 34;

  readonly h = 40;

  readonly tags = ["máquina de café", "espresso"];

  draw(p: any, t: any) { return ShapeUtil.rect(-17, -40, 34, 40, t.metal, 4) + ShapeUtil.rect(6, -40, 11, 40, ColorUtil.sh(t.metal, -0.18), 4) + ShapeUtil.rect(-12, -34, 24, 9, t.ink, 2) + ShapeUtil.circle(-6, -30, 1.8, t.accent) + ShapeUtil.rect(-6, -20, 12, 4, t.ink) + ShapeUtil.rect(-5, -10, 10, 10, t.paper, 1); }
}
