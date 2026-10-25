import type { ThemeColorName } from "@/Protocols/ThemeProtocol.ts";
import type { KitId, KitLight, KitOutline, KitSceneName, KitStyle } from "@/Protocols/KitProtocol.ts";

export abstract class BaseKit implements KitStyle {
  abstract readonly id: KitId;

  abstract readonly description: string;

  readonly outline?: KitOutline;

  readonly light?: KitLight;

  readonly texture?: string;

  readonly colors?: Partial<Record<ThemeColorName, string>>;

  readonly scene?: KitSceneName;

  readonly hasDrop?: boolean;
}
