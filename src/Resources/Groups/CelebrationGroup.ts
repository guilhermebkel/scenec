import { BaseGroup } from "@/Resources/Groups/BaseGroup.ts";

export class CelebrationGroup extends BaseGroup {
  readonly id = "celebration";

  readonly anchor = "mesa";

  readonly desc = "table with cake, balloons and two people celebrating";

  build(g: any) {
    const [a = {}, b = {}] = g.people || [];
    return {
      mesa: { asset: "table", at: g.at, color: g.color },
      bolo: { asset: "cake", on: "mesa", size: 1.4 },
      baloes: { asset: "balloons", right_of: "mesa", gap: 0.01 },
      pessoa1: { asset: "person", left_of: "mesa", gap: 0.01, pose: "celebrating", expr: "laughing", look: "bolo", ...a },
      pessoa2: { asset: "person", right_of: "baloes", gap: 0.0, pose: "waving", expr: "happy", facing: "left", look: "pessoa1", ...b },
    };
  }
}
