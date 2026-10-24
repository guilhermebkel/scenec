import type { GroupParams } from "@/Protocols/GroupProtocol.ts";
import { BaseGroup } from "@/Resources/Groups/BaseGroup.ts";

export class ParkBenchGroup extends BaseGroup {
  readonly id = "park_bench";

  readonly anchor = "banco";

  readonly desc = "park bench with a tree, a seated person and a dog";

  build(group: GroupParams) {
    return ({
      banco: { asset: "bench", at: group.at, color: group.color },
      arvore: { asset: "tree", right_of: "banco", gap: -0.02, depth: "mid" },
      pessoa: { asset: "person", pose: "reading", on: "banco", align: "left", facing: "right", ...group.person },
      cachorro: { asset: "dog", left_of: "banco", gap: 0.01, facing: "right", look: "pessoa" },
    });
  }
}
