export class RegistryUtil {
  static indexValues<Id extends string, Item extends { readonly id: Id }, Value>(
    items: Item[], valueOf: (item: Item) => Value,
  ): Record<Id, Value> {
    const idToValue: Partial<Record<Id, Value>> = {};
    for (const item of items) {
      idToValue[item.id] = valueOf(item);
    }
    // Why: the tests of each registry check that every id of its union has an entry, which the compiler cannot see.
    return idToValue as Record<Id, Value>;
  }

  static indexById<Id extends string, Item extends { readonly id: Id }>(items: Item[]): Record<Id, Item> {
    const idToItem: Partial<Record<Id, Item>> = {};
    for (const item of items) {
      idToItem[item.id] = item;
    }
    return idToItem as Record<Id, Item>;
  }
}
