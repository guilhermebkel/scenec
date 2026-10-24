import { BaseGroup } from "@/Resources/Groups/BaseGroup.ts";

export class WorkspaceGroup extends BaseGroup {
  readonly id = "workspace";

  readonly anchor = "mesa";

  readonly desc = "work desk with a person typing, screen, lamp, mug and plant";

  build(g: any) {
    return ({
      mesa: { asset: "desk", at: g.at, color: g.color },
      cadeira: { asset: "chair", left_of: "mesa", gap: -0.04, facing: "right" },
      pessoa: { asset: "person", pose: "typing", on: "cadeira", facing: "right", ...g.person },
      tela: g.screen === "monitor" ? { asset: "monitor", on: "mesa", align: -0.1, size: 0.8 } : { asset: "laptop", on: "mesa", align: "left", facing: "left" },
      luminaria: { asset: "lamp", on: "mesa", align: "right" },
      caneca: { asset: "cup", on: "mesa", align: 0.12, color: "accent" },
      planta: { asset: "big_plant", right_of: "mesa", gap: 0.015, size: "small" },
    });
  }
}
