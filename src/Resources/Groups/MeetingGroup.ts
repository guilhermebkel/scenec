import { BaseGroup } from "@/Resources/Groups/BaseGroup.ts";

export class MeetingGroup extends BaseGroup {
  readonly id = "meeting";

  readonly anchor = "mesa";

  readonly desc = "meeting table with a board, one person presenting and two seated";

  build(g: any) {
    const [a = {}, b = {}, c = {}] = g.people || [];
    return {
      quadro: { asset: "board", above: "mesa", offset: 0.1, elevation: 70 },
      mesa: { asset: "desk", at: g.at, color: g.color },
      cadeira1: { asset: "chair", left_of: "mesa", gap: -0.03, facing: "right" },
      cadeira2: { asset: "chair", right_of: "mesa", gap: -0.03, facing: "left" },
      pessoa1: { asset: "person", pose: "sitting", on: "cadeira1", facing: "right", look: "quadro", ...a },
      pessoa2: { asset: "person", behind: "mesa", offset: 0.05, layer: "back", pose: "presenting", look: "pessoa1", ...b },
      pessoa3: { asset: "person", pose: "sitting", on: "cadeira2", facing: "left", look: "pessoa2", ...c },
      notebook: { asset: "laptop", on: "mesa", align: "left", facing: "left" },
    };
  }
}
