import { fileURLToPath } from "node:url";

const WEIGHTS = ["Regular", "Medium", "Bold"] as const;

export const FONT_FILES: string[] = WEIGHTS.map((weight) =>
  fileURLToPath(new URL(`../../fonts/Poppins-${weight}.ttf`, import.meta.url)));

export const FONT_FAMILY = "Poppins";
