import type { GroupParams, GroupPart } from "@/Protocols/GroupProtocol.ts";
import { BaseGroup } from "@/Resources/Groups/BaseGroup.ts";
import { IdUtil } from "@/Utils/IdUtil.ts";

export class WorkspaceGroup extends BaseGroup {
  private static readonly SCREEN_TO_PART: Record<"monitor", GroupPart> = {
    monitor: { asset: "monitor", on: "mesa", align: -0.1, size: 0.8 },
  };

  private static readonly LAPTOP: GroupPart = { asset: "laptop", on: "mesa", align: "left", facing: "left" };

  readonly id = "workspace";

  readonly anchor = "mesa";

  readonly desc = "work desk with a person typing, screen, lamp, mug and plant";

  build(group: GroupParams): Record<string, GroupPart> {
    return ({
      mesa: { asset: "desk", at: group.at, color: group.color },
      cadeira: { asset: "chair", left_of: "mesa", gap: -0.04, facing: "right" },
      pessoa: { asset: "person", pose: "typing", on: "cadeira", facing: "right", ...group.person },
      tela: IdUtil.lookup(WorkspaceGroup.SCREEN_TO_PART, group.screen) ?? WorkspaceGroup.LAPTOP,
      luminaria: { asset: "lamp", on: "mesa", align: "right" },
      caneca: { asset: "cup", on: "mesa", align: 0.12, color: "accent" },
      planta: { asset: "big_plant", right_of: "mesa", gap: 0.015, size: "small" },
    });
  }
}
