import type { SceneObject } from "@/Protocols/SceneProtocol.ts";

export interface ResolutionOrder {
  order: string[];
  heldToHolder: Record<string, string>;
}

export class DependencyOrderService {
  private static readonly DEPENDENCY_KEYS = [
    "left_of", "right_of", "behind", "in_front_of", "on", "under", "above",
  ] as const;

  static dependenciesOf(object: SceneObject): string[] {
    return DependencyOrderService.DEPENDENCY_KEYS.map((key) => object[key]).filter((id): id is string => Boolean(id));
  }

  static resolve(idToObject: Record<string, SceneObject>, warnings: string[]): ResolutionOrder {
    const visited: string[] = [];
    const seen = new Set<string>();
    const visiting = new Set<string>();
    const visit = (id: string): void => {
      if (seen.has(id)) {
        return;
      }
      if (visiting.has(id)) {
        warnings.push(`circular dependency involving '${id}'`);
        return;
      }
      visiting.add(id);
      const object = idToObject[id];
      if (!object) {
        return;
      }
      for (const dependency of DependencyOrderService.dependenciesOf(object)) {
        if (idToObject[dependency]) {
          visit(dependency);
        } else {
          warnings.push(`'${id}' references '${dependency}', which does not exist in the scene`);
        }
      }
      visiting.delete(id);
      seen.add(id);
      visited.push(id);
    };
    Object.keys(idToObject).forEach(visit);
    const heldToHolder = DependencyOrderService.findHolders(idToObject, warnings);
    return { order: DependencyOrderService.placeHeldAfterHolders(visited, heldToHolder), heldToHolder };
  }

  private static findHolders(idToObject: Record<string, SceneObject>, warnings: string[]): Record<string, string> {
    const heldToHolder: Record<string, string> = {};
    for (const [id, object] of Object.entries(idToObject)) {
      if (!object.holds) {
        continue;
      }
      if (idToObject[object.holds]) {
        heldToHolder[object.holds] = id;
      } else {
        warnings.push(`'${id}' holds '${object.holds}', which does not exist`);
      }
    }
    return heldToHolder;
  }

  private static placeHeldAfterHolders(visited: string[], heldToHolder: Record<string, string>): string[] {
    // Why: whoever holds an object is placed first, because the held object sits on the holder's hand.
    const order = visited.filter((id) => !heldToHolder[id]);
    for (const id of visited) {
      const holder = heldToHolder[id];
      if (holder) {
        order.splice(order.indexOf(holder) + 1, 0, id);
      }
    }
    return order;
  }
}
