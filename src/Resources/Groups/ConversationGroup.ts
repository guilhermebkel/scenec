import type { GroupParams } from "@/Protocols/GroupProtocol.ts";
import { BaseGroup } from "@/Resources/Groups/BaseGroup.ts";

export class ConversationGroup extends BaseGroup {
  readonly id = "conversation";

  readonly anchor = "pessoa1";

  readonly desc = "two standing people talking, looking at each other";

  build(group: GroupParams) {
    const [firstPerson = {}, secondPerson = {}] = group.people ?? [];
    return {
      pessoa1: { asset: "person", at: group.at, pose: "presenting", facing: "right", look: "pessoa2", expr: "happy", ...firstPerson },
      pessoa2: { asset: "person", right_of: "pessoa1", gap: group.gap ?? 0.04, pose: "standing", facing: "left", look: "pessoa1", expr: "neutral", ...secondPerson },
    };
  }
}
