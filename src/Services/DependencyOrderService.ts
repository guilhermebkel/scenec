import type { SceneObject } from "@/Protocols/SceneProtocol.ts";

export interface ResolutionOrder {
  order: string[];
  heldBy: Record<string, string>;
}

export class DependencyOrderService {
  private static readonly DEPENDENCY_KEYS = ["left_of", "right_of", "behind", "in_front_of", "on", "under", "above"] as const;

  static dependenciesOf(object: SceneObject): string[] {
    return DependencyOrderService.DEPENDENCY_KEYS.map((key) => object[key]).filter((id): id is string => Boolean(id));
  }

  static resolve(objects: Record<string, SceneObject>, warnings: string[]): ResolutionOrder {
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
      const object = objects[id];
      if (!object) {
        return;
      }
      for (const dependency of DependencyOrderService.dependenciesOf(object)) {
        if (objects[dependency]) {
          visit(dependency);
        } else {
          warnings.push(`'${id}' references '${dependency}', which does not exist in the scene`);
        }
      }
      visiting.delete(id);
      seen.add(id);
      visited.push(id);
    };
    Object.keys(objects).forEach(visit);
    const heldBy = DependencyOrderService.findHolders(objects, warnings);
    return { order: DependencyOrderService.placeHeldAfterHolders(visited, heldBy), heldBy };
  }

  private static findHolders(objects: Record<string, SceneObject>, warnings: string[]): Record<string, string> {
    const heldToHolder: Record<string, string> = {};
    for (const [id, object] of Object.entries(objects)) {
      if (!object.holds) {
        continue;
      }
      if (objects[object.holds]) {
        heldToHolder[object.holds] = id;
      } else {
        warnings.push(`'${id}' holds '${object.holds}', which does not exist`);
      }
    }
    return heldToHolder;
  }

  // Why: whoever holds an object is placed first, because the held object sits on the holder's hand.
  private static placeHeldAfterHolders(visited: string[], heldBy: Record<string, string>): string[] {
    const order = visited.filter((id) => !heldBy[id]);
    for (const id of visited) {
      const holder = heldBy[id];
      if (holder) {
        order.splice(order.indexOf(holder) + 1, 0, id);
      }
    }
    return order;
  }
}
