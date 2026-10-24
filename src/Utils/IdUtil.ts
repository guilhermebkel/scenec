export class IdUtil {
  // Why: scene authors write ids as plain text, so a lookup first narrows the string to the union of known ids.
  static isOneOf<Id extends string>(ids: readonly Id[], value: unknown): value is Id {
    return typeof value === "string" && (ids as readonly string[]).includes(value);
  }

  // Why: hasOwn keeps names such as "constructor" from reaching the object prototype.
  static lookup<Key extends string, Value>(table: Partial<Record<Key, Value>>, key: unknown): Value | undefined {
    return typeof key === "string" && Object.hasOwn(table, key) ? table[key as Key] : undefined;
  }
}
