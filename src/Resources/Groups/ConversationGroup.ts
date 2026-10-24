import { BaseGroup } from "@/Resources/Groups/BaseGroup.ts";

export class ConversationGroup extends BaseGroup {
  readonly id = "conversation";

  readonly anchor = "pessoa1";

  readonly desc = "two standing people talking, looking at each other";

  build(g: any) {
    const [a = {}, b = {}] = g.people || [];
    return {
      pessoa1: { asset: "person", at: g.at, pose: "presenting", facing: "right", look: "pessoa2", expr: "happy", ...a },
      pessoa2: { asset: "person", right_of: "pessoa1", gap: g.gap ?? 0.04, pose: "standing", facing: "left", look: "pessoa1", expr: "neutral", ...b },
    };
  }
}
