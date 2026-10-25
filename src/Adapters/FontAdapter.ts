import { fileURLToPath } from "node:url";
export class FontAdapter {
  private static readonly WEIGHTS = ["Regular", "Medium", "Bold"] as const;

  static readonly FONT_FILES: string[] = FontAdapter.WEIGHTS.map((weight) =>
    fileURLToPath(new URL(`../../fonts/Poppins-${weight}.ttf`, import.meta.url)));

  static readonly FONT_FAMILY = "Poppins";
}
