import { BaseGroup } from "@/Resources/Groups/BaseGroup.ts";

export class ParkBenchGroup extends BaseGroup {
  readonly id = "park_bench";

  readonly anchor = "banco";

  readonly desc = "park bench with a tree, a seated person and a dog";

  build(g: any) {
    return ({
      banco: { asset: "bench", at: g.at, color: g.color },
      arvore: { asset: "tree", right_of: "banco", gap: -0.02, depth: "mid" },
      pessoa: { asset: "person", pose: "reading", on: "banco", align: "left", facing: "right", ...g.person },
      cachorro: { asset: "dog", left_of: "banco", gap: 0.01, facing: "right", look: "pessoa" },
    });
  }
}
