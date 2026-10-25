import type { PlaneWorld, ScreenBox } from "@/Protocols/PlaneProtocol.ts";
import { PlaneBoxService } from "@/Services/PlaneBoxService.ts";
import { PlaneSpriteService } from "@/Services/PlaneSpriteService.ts";

interface DepthNode {
  id: string;
  isSprite: boolean;
  centerX: number;
  x0: number;
  x1: number;
  z0: number;
  z1: number;
  bottom: number;
  top: number;
  screen: ScreenBox;
  render: () => string;
  next: DepthNode[];
  indegree: number;
  isDone: boolean;
}

export class PlaneDepthService {
  private static readonly EPSILON = 1e-4;

  private static readonly HEIGHT_TOLERANCE = 0.5;

  private static readonly FAR_WEIGHT = 1000;

  private static readonly LOW_WEIGHT = 0.001;

  static draw(world: PlaneWorld): string {
    const nodes = PlaneDepthService.nodes(world);
    // Why: for each pair that overlaps on screen we decide which one is behind, then draw in an order that respects all those relations.
    nodes.forEach((first, index) => {
      for (const second of nodes.slice(index + 1)) {
        if (!PlaneDepthService.overlaps(first.screen, second.screen)) {
          continue;
        }
        const isFirstBehind = PlaneDepthService.isBehind(first, second, world.camera.eyeX);
        const [before, after] = isFirstBehind ? [first, second] : [second, first];
        before.next.push(after);
        after.indegree++;
      }
    });
    return PlaneDepthService.order(nodes, world.warnings).map((node) => node.render()).join("\n");
  }

  private static nodes(world: PlaneWorld): DepthNode[] {
    const { camera } = world;
    const sprites = world.ground.map((sprite): DepthNode => ({
      id: sprite.id, isSprite: true, centerX: sprite.x,
      x0: sprite.x - sprite.halfFootWidth, x1: sprite.x + sprite.halfFootWidth, z0: sprite.z, z1: sprite.z,
      bottom: sprite.lift, top: sprite.lift + sprite.heightUnits,
      screen: sprite.bounds, render: () => PlaneSpriteService.draw(world, sprite), next: [], indegree: 0, isDone: false,
    }));
    const boxes = world.boxes.map((box): DepthNode => {
      const corners = [box.x0, box.x1].flatMap((groundX) => [box.z0, box.z1].flatMap((groundZ) =>
        [box.elevation, box.height].map((up) => camera.project(groundX, groundZ, up))));
      const xs = corners.map((corner) => corner[0]);
      const ys = corners.map((corner) => corner[1]);
      return {
        id: box.id, isSprite: false, centerX: (box.x0 + box.x1) / 2,
        x0: box.x0, x1: box.x1, z0: box.z0, z1: box.z1, bottom: box.elevation, top: box.height,
        screen: { x0: Math.min(...xs), y0: Math.min(...ys), x1: Math.max(...xs), y1: Math.max(...ys) },
        render: () => PlaneBoxService.draw(world, box), next: [], indegree: 0, isDone: false,
      };
    });
    return [...sprites, ...boxes];
  }

  private static overlaps(first: ScreenBox, second: ScreenBox): boolean {
    return first.x0 < second.x1 && second.x0 < first.x1 && first.y0 < second.y1 && second.y0 < first.y1;
  }

  private static xRange(node: DepthNode, other: DepthNode): [number, number] {
    // Why: a cut-out has no volume, so when its center is outside the box on the x axis it counts as a single line there.
    const isOutside = node.isSprite && !other.isSprite && (node.centerX > other.x1 || node.centerX < other.x0);
    return isOutside ? [node.centerX, node.centerX] : [node.x0, node.x1];
  }

  private static isBehind(first: DepthNode, second: DepthNode, eyeX: number): boolean {
    // Why: separation in z decides first, then in x as seen from the camera, then in height with the camera above.
    const epsilon = PlaneDepthService.EPSILON;
    const isSameZ = first.z0 === first.z1 && second.z0 === second.z1 && Math.abs(first.z0 - second.z0) < epsilon;
    if (!isSameZ) {
      if (first.z0 >= second.z1 - epsilon) {
        return true;
      }
      if (second.z0 >= first.z1 - epsilon) {
        return false;
      }
    }
    const [firstX0, firstX1] = PlaneDepthService.xRange(first, second);
    const [secondX0, secondX1] = PlaneDepthService.xRange(second, first);
    if (firstX1 <= secondX0 + epsilon) {
      return eyeX >= (firstX1 + secondX0) / 2;
    }
    if (secondX1 <= firstX0 + epsilon) {
      return eyeX <= (secondX1 + firstX0) / 2;
    }
    if (first.top <= second.bottom + PlaneDepthService.HEIGHT_TOLERANCE) {
      return true;
    }
    if (second.top <= first.bottom + PlaneDepthService.HEIGHT_TOLERANCE) {
      return false;
    }
    return (first.z0 + first.z1) / 2 > (second.z0 + second.z1) / 2;
  }

  private static farness(node: DepthNode): number {
    return -((node.z0 + node.z1) / 2) * PlaneDepthService.FAR_WEIGHT + node.bottom * PlaneDepthService.LOW_WEIGHT;
  }

  private static order(nodes: DepthNode[], warnings: string[]): DepthNode[] {
    const ordered: DepthNode[] = [];
    // Why: Kahn's algorithm; ties and cycles are resolved by drawing the farthest first, and a cycle is reported because the order there is a guess.
    while (ordered.length < nodes.length) {
      const pick = PlaneDepthService.pickReady(nodes) ?? PlaneDepthService.pickGuess(nodes);
      if (pick === undefined) {
        break;
      }
      if (pick.indegree > 0) {
        warnings.push(`ambiguous depth order involving '${pick.id}' (intersecting volumes); move the objects apart or adjust from/to`);
      }
      pick.isDone = true;
      ordered.push(pick);
      for (const following of pick.next) {
        following.indegree--;
      }
    }
    return ordered;
  }

  private static pickReady(nodes: readonly DepthNode[]): DepthNode | undefined {
    let pick: DepthNode | undefined;
    for (const node of nodes) {
      if (!node.isDone && node.indegree === 0 && (pick === undefined || PlaneDepthService.isFarther(node, pick))) {
        pick = node;
      }
    }
    return pick;
  }

  private static pickGuess(nodes: readonly DepthNode[]): DepthNode | undefined {
    let pick: DepthNode | undefined;
    for (const node of nodes) {
      if (!node.isDone && (pick === undefined || PlaneDepthService.isBetterGuess(node, pick))) {
        pick = node;
      }
    }
    return pick;
  }

  private static isFarther(node: DepthNode, other: DepthNode): boolean {
    return PlaneDepthService.farness(node) < PlaneDepthService.farness(other);
  }

  private static isBetterGuess(node: DepthNode, current: DepthNode): boolean {
    return node.indegree < current.indegree
      || (node.indegree === current.indegree && PlaneDepthService.isFarther(node, current));
  }
}
