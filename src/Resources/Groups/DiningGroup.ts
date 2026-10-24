import type { GroupParams } from "@/Protocols/GroupProtocol.ts";
import { BaseGroup } from "@/Resources/Groups/BaseGroup.ts";

export class DiningGroup extends BaseGroup {
  readonly id = "dining";

  readonly anchor = "mesa";

  readonly desc = "table with two seated people talking, food and drinks";

  build(group: GroupParams) {
    const [firstPerson = {}, secondPerson = {}] = group.people ?? [];
    return {
      mesa: { asset: "table", at: group.at, color: group.color },
      cadeira1: { asset: "chair", left_of: "mesa", gap: -0.004, facing: "right" },
      cadeira2: { asset: "chair", right_of: "mesa", gap: -0.004, facing: "left" },
      pessoa1: { asset: "person", pose: "sitting", on: "cadeira1", facing: "right", look: "pessoa2", ...firstPerson },
      pessoa2: { asset: "person", pose: "drinking", on: "cadeira2", facing: "left", look: "pessoa1", ...secondPerson },
      prato: { asset: group.food ?? "pizza", on: "mesa", align: 0 },
      copo1: { asset: "cup", on: "mesa", align: -0.32, steam: false },
    };
  }
}
