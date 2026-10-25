import type { Checkpoint, GroundPoint, Road, RoadPosition } from "@/Protocols/PlaneProtocol.ts";
import type { PathOptions } from "@/Protocols/SceneProtocol.ts";
import { CurveUtil } from "@/Utils/CurveUtil.ts";
import { RequireUtil } from "@/Utils/RequireUtil.ts";

export class PlanePathService {
  private static readonly DEFAULT_WIDTH = 0.075;

  private static readonly DEFAULT_CHECKPOINT_RADIUS = 0.042;

  private static readonly SAMPLES_PER_SEGMENT = 40;

  private static readonly SAMPLE = "path sample";

  private static readonly LENGTH = "path length";

  private static readonly FALLBACK_POINT: GroundPoint = [0.5, 0.5];

  static build(
    definition: PathOptions | undefined, warnings: string[], pointIdToPosition: Map<string, GroundPoint>,
  ): Road {
    const width = definition?.width ?? PlanePathService.DEFAULT_WIDTH;
    const checkpointRadius = definition?.checkpoint_size ?? PlanePathService.DEFAULT_CHECKPOINT_RADIUS;
    if (!definition) {
      return { definition: null, samples: [], arc: [], width, checkpointRadius, checkpoints: [] };
    }
    const points = definition.points ?? [];
    if (points.length < 2) {
      warnings.push("path needs at least 2 points");
    }
    const named = points.map((point, index) => {
      const id = point.id === undefined || point.id === "" ? `point${index + 1}` : point.id;
      if (point.at === undefined) {
        warnings.push(`path point '${id}' has no 'at: [x, z]'`);
      }
      const at: GroundPoint = point.at ?? PlanePathService.FALLBACK_POINT;
      pointIdToPosition.set(id, at);
      return { point, id, at };
    });
    const samples = CurveUtil.catmullRom(named.map((entry) => entry.at), PlanePathService.SAMPLES_PER_SEGMENT);
    const arc = PlanePathService.arcLengths(samples);
    const checkpoints = named.map(({ point, id, at }): Checkpoint => ({
      id, at,
      arc: RequireUtil.defined(arc[PlanePathService.nearestSample(samples, at)], "path arc length"),
      label: point.label,
      zone: point.zone,
      isFinish: point.finish === true,
      color: point.color,
      labelSide: point.label_side,
      hasDecor: point.decor !== false,
      tint: undefined,
      isOccupied: false,
    }));
    return { definition, samples, arc, width, checkpointRadius, checkpoints };
  }

  static distanceToRoad(road: Road, groundX: number, groundZ: number): number {
    let nearest = Infinity;
    for (const sample of road.samples) {
      nearest = Math.min(nearest, Math.hypot(sample[0] - groundX, sample[1] - groundZ));
    }
    return nearest;
  }

  static pointAt(road: Road, fraction: number): RoadPosition {
    const total = RequireUtil.defined(road.arc.at(-1), PlanePathService.LENGTH);
    // Why: the fraction runs 0..1 along the whole path, and the normal points to the left of the walking direction.
    const target = total * Math.min(1, Math.max(0, fraction));
    let index = road.arc.findIndex((length) => length >= target);
    if (index <= 0) {
      index = 1;
    }
    const before = RequireUtil.defined(road.samples[index - 1], PlanePathService.SAMPLE);
    const after = RequireUtil.defined(road.samples[index], PlanePathService.SAMPLE);
    const startLength = RequireUtil.defined(road.arc[index - 1], PlanePathService.LENGTH);
    const span = RequireUtil.defined(road.arc[index], PlanePathService.LENGTH) - startLength;
    const progress = (target - startLength) / (span || 1);
    const tangentX = after[0] - before[0];
    const tangentZ = after[1] - before[1];
    const norm = Math.hypot(tangentX, tangentZ) || 1;
    return {
      point: [before[0] + (after[0] - before[0]) * progress, before[1] + (after[1] - before[1]) * progress],
      normal: [-tangentZ / norm, tangentX / norm],
    };
  }

  private static arcLengths(samples: readonly GroundPoint[]): number[] {
    const arc = [0];
    for (let index = 1; index < samples.length; index++) {
      const here = RequireUtil.defined(samples[index], PlanePathService.SAMPLE);
      const previous = RequireUtil.defined(samples[index - 1], PlanePathService.SAMPLE);
      const walked = RequireUtil.defined(arc[index - 1], PlanePathService.LENGTH);
      arc.push(walked + Math.hypot(here[0] - previous[0], here[1] - previous[1]));
    }
    return arc;
  }

  private static nearestSample(samples: readonly GroundPoint[], at: GroundPoint): number {
    let best = 0;
    let bestDistance = 1e9;
    samples.forEach((sample, index) => {
      const distance = Math.hypot(sample[0] - at[0], sample[1] - at[1]);
      if (distance < bestDistance) {
        bestDistance = distance;
        best = index;
      }
    });
    return best;
  }
}
