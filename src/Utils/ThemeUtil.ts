import type { Theme } from "@/Protocols/ThemeProtocol.ts";
import { IdUtil } from "@/Utils/IdUtil.ts";

export class ThemeUtil {
  static resolve(theme: Theme, value: string | undefined, fallback: string): string {
    // Why: authors write a theme color name or a literal color in one field; the name wins, then the literal.
    const named = IdUtil.lookup<string, string | string[] | undefined>(theme, value);
    if (typeof named === "string" && named !== "") {
      return named;
    }
    return value === undefined || value === "" ? fallback : value;
  }
}
