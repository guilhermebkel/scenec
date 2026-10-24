export class RegistryUtil {
  // Why: the tests of each registry check that every id of its union has an entry, which the compiler cannot see from a list.
  static indexValues<Id extends string, Item extends { readonly id: Id }, Value>(items: Item[], valueOf: (item: Item) => Value): Record<Id, Value> {
    const index: Partial<Record<Id, Value>> = {};
    for (const item of items) {
      index[item.id] = valueOf(item);
    }
    return index as Record<Id, Value>;
  }

  static indexById<Id extends string, Item extends { readonly id: Id }>(items: Item[]): Record<Id, Item> {
    const index: Partial<Record<Id, Item>> = {};
    for (const item of items) {
      index[item.id] = item;
    }
    return index as Record<Id, Item>;
  }
}
