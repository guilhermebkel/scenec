import type { GroupParams, GroupPart } from "@/Protocols/GroupProtocol.ts";

export abstract class BaseGroup {
  abstract readonly id: string;

  abstract readonly anchor: string;

  abstract readonly desc: string;

  abstract build(group: GroupParams): Record<string, GroupPart>;
}
