export class IdUtil {
  static isOneOf<Id extends string>(ids: readonly Id[], value: unknown): value is Id {
    // Why: scene authors write ids as plain text, so a lookup first narrows the string to the union of known ids.
    return typeof value === "string" && (ids as readonly string[]).includes(value);
  }

  static lookup<Key extends string, Value>(keyToValue: Partial<Record<Key, Value>>, key: unknown): Value | undefined {
    // Why: hasOwn keeps names such as "constructor" from reaching the object prototype.
    return typeof key === "string" && Object.hasOwn(keyToValue, key) ? keyToValue[key as Key] : undefined;
  }
}
