import { BaseKit } from "@/Resources/Kits/BaseKit.ts";

export class RisoKit extends BaseKit {
  readonly id = "riso";

  readonly desc = "risograph: few vivid inks, print grain and slightly misaligned registration";
  readonly colors = { primary: "#0078BF", accent: "#FF48B0", secondary: "#1F3A93", paper: "#FFF8EC", text: "#1A1F4A", ink: "#1A1F4A" };
  readonly light = { mode: "none" };
  readonly scene = "riso";
}
