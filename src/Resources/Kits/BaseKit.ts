import type { KitLight, KitOutline, KitStyle } from "@/Protocols/KitProtocol.ts";

export abstract class BaseKit implements KitStyle {
  abstract readonly id: string;

  abstract readonly description: string;

  readonly outline?: KitOutline;

  readonly light?: KitLight;

  readonly texture?: string;

  readonly colors?: Record<string, string>;

  readonly scene?: string;

  readonly hasDrop?: boolean;
}
