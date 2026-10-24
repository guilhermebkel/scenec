import type { GroupParams } from "@/Protocols/GroupProtocol.ts";
import { BaseGroup } from "@/Resources/Groups/BaseGroup.ts";

export class ReadingCornerGroup extends BaseGroup {
  readonly id = "reading_corner";

  readonly anchor = "sofa";

  readonly desc = "sofa with a person reading, floor lamp and shelf";

  build(group: GroupParams) {
    return ({
      sofa: { asset: "sofa", at: group.at, color: group.color ?? "secondary" },
      pessoa: { asset: "person", pose: "reading", on: "sofa", align: "left", facing: "right", pants: "metal", ...group.person },
      abajur: { asset: "floor_lamp", right_of: "sofa", gap: 0.005 },
      prateleira: { asset: "shelf_wall", above: "sofa", offset: 0.18, elevation: 45 },
    });
  }
}
