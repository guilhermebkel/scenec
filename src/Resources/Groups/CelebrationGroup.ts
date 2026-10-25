import type { GroupParams, GroupPart } from "@/Protocols/GroupProtocol.ts";
import { BaseGroup } from "@/Resources/Groups/BaseGroup.ts";

export class CelebrationGroup extends BaseGroup {
  readonly id = "celebration";

  readonly anchor = "mesa";

  readonly desc = "table with cake, balloons and two people celebrating";

  build(group: GroupParams): Record<string, GroupPart> {
    const [firstPerson = {}, secondPerson = {}] = group.people ?? [];
    return {
      mesa: { asset: "table", at: group.at, color: group.color },
      bolo: { asset: "cake", on: "mesa", size: 1.4 },
      baloes: { asset: "balloons", right_of: "mesa", gap: 0.01 },
      pessoa1: { asset: "person", left_of: "mesa", gap: 0.01, pose: "celebrating", expr: "laughing", look: "bolo", ...firstPerson },
      pessoa2: { asset: "person", right_of: "baloes", gap: 0.0, pose: "waving", expr: "happy", facing: "left", look: "pessoa1", ...secondPerson },
    };
  }
}
