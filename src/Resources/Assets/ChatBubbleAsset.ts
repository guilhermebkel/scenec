import type { AssetParams, Theme } from "@/Protocols/AssetProtocol.ts";
import { BaseAsset } from "@/Resources/Assets/BaseAsset.ts";
import { ShapeUtil } from "@/Utils/ShapeUtil.ts";

export class ChatBubbleAsset extends BaseAsset {
  readonly id = "chat_bubble";

  readonly kind = "wall";

  readonly width = 52;

  readonly height = 44;

  readonly elevation = 100;

  readonly tags = ["balao_de_fala", "conversa", "chat_bubble", "message", "speech_bubble", "comment"];

  draw(params: AssetParams, theme: Theme) {
    const bg = ShapeUtil.color(theme, params.color, theme.primary);
    const dotColor = theme.paper;
    return ShapeUtil.shadow(theme, 24, 3)
      + `<path d="M-24 -44 L24 -44 Q26 -44 26 -24 Q26 -4 4 -4 L-8 -4 L-18 2 L-16 -4 L-24 -4 Q-26 -4 -26 -24 Q-26 -44 -24 -44 Z" `
      + `fill="${bg}"/>`
      + ShapeUtil.circle(-10, -24, 3, dotColor)
      + ShapeUtil.circle(0, -24, 3, dotColor)
      + ShapeUtil.circle(10, -24, 3, dotColor);
  }
}
