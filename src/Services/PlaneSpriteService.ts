import type { AssetParams, AssetSize, LibraryAsset } from "@/Protocols/AssetProtocol.ts";
import type { GroundSprite, PlaneWorld, SkySprite } from "@/Protocols/PlaneProtocol.ts";
import type { SceneObject } from "@/Protocols/SceneProtocol.ts";
import { AssetService } from "@/Services/AssetService.ts";
import { PlacementService } from "@/Services/PlacementService.ts";
import { FormatUtil } from "@/Utils/FormatUtil.ts";
import { IdUtil } from "@/Utils/IdUtil.ts";
import { RequireUtil } from "@/Utils/RequireUtil.ts";

interface SpriteRequest {
  id: string;
  object: SceneObject;
  groundX: number;
  groundZ: number;
  lift?: number;
  isDecor?: boolean;
}

interface FoundAsset {
  id: string;
  asset: LibraryAsset;
}

export class PlaneSpriteService {
  private static readonly FOOT_SHARE = 0.55;

  private static readonly PERSON_FOOTPRINT = 0.6;

  private static readonly SHADOW_ELLIPSE = /<ellipse cx="([-\d.]+)" cy="0" rx="([\d.]+)" ry="([\d.]+)" fill="[^"]*"( stroke="none")?\s*\/>/;

  static draw(world: PlaneWorld, sprite: GroundSprite): string {
    return PlaneSpriteService.wrap(world, sprite, world.camera.hazeLevel(sprite.z));
  }

  static drawSky(world: PlaneWorld, sprite: SkySprite): string {
    return PlaneSpriteService.wrap(world, sprite, 0);
  }

  static sizeFactor(size: SceneObject["size"]): number {
    if (typeof size === "number") {
      return size;
    }
    return IdUtil.lookup(PlacementService.SIZE_NAME_TO_FACTOR, size ?? "medium") ?? 1;
  }

  static assetName(id: string, object: SceneObject): string {
    return object.asset === undefined || object.asset === "" ? id : object.asset;
  }

  static dimensions(asset: LibraryAsset, params: AssetParams): AssetSize {
    return asset.size ? asset.size(params) : { w: asset.width, h: asset.height };
  }

  static find(world: PlaneWorld, name: string): FoundAsset | undefined {
    const resolution = AssetService.resolveAsset(name, world.library);
    const asset = resolution.id === null ? undefined : world.library[resolution.id];
    return resolution.id === null || asset === undefined ? undefined : { id: resolution.id, asset };
  }

  static add(world: PlaneWorld, request: SpriteRequest): GroundSprite | null {
    const { camera, theme, warnings } = world;
    const { id, object, groundX, groundZ } = request;
    const name = PlaneSpriteService.assetName(id, object);
    const resolution = AssetService.resolveAsset(name, world.library);
    if (resolution.id === null) {
      const suggestions = (resolution.suggest ?? []).join(", ");
      warnings.push(`asset '${name}' (in '${id}') does not exist; did you mean: ${suggestions}?`);
      return null;
    }
    const asset = RequireUtil.defined(world.library[resolution.id], `asset '${resolution.id}'`);
    const factor = PlaneSpriteService.sizeFactor(object.size);
    const scale = camera.pxPerUnit(groundZ, factor);
    const drawn = asset.draw({ ...object }, theme);
    const dimensions = PlaneSpriteService.dimensions(asset, object);
    const lift = request.lift ?? object.lift ?? 0;
    const screenX = camera.screenX(groundX, groundZ);
    const screenY = camera.screenY(groundZ) - lift * camera.unit * camera.shrink(groundZ);
    const width = dimensions.w * scale;
    const height = dimensions.h * scale;
    const isPerson = resolution.id === "person";
    const sprite: GroundSprite = {
      id, asset: resolution.id, kind: asset.kind, x: groundX, z: groundZ, lift, screenX, screenY, scale,
      svg: typeof drawn === "string" ? drawn : drawn.svg,
      width, height,
      heightUnits: dimensions.h * factor,
      halfFootWidth: (width / 2) / (camera.width * 0.98 * camera.spread(groundZ)) * PlaneSpriteService.FOOT_SHARE,
      bounds: { x0: screenX - width / 2, x1: screenX + width / 2, y0: screenY - height, y1: screenY },
      isDecor: request.isDecor === true,
      isPerson,
    };
    world.ground.push(sprite);
    const footprintScale = isPerson ? PlaneSpriteService.PERSON_FOOTPRINT : 1;
    const radius = camera.worldRadius(dimensions.w, groundZ, factor) * footprintScale;
    world.footprints.push({ id, x: groundX, z: groundZ, radius });
    world.pointIdToPosition.set(id, [groundX, groundZ]);
    return sprite;
  }

  private static wrap(world: PlaneWorld, sprite: GroundSprite | SkySprite, hazeLevel: number): string {
    const swap = (match: string, cx: string, rx: string, ry: string): string => {
      const radiusX = (Number(rx) * 1.25).toFixed(1);
      const radiusY = (Number(ry) * 1.6).toFixed(1);
      // Why: the contact shadow every asset draws at its feet is swapped for a soft gradient, so objects sit on the ground instead of on a hard disc.
      return match.includes(world.theme.shadow)
        ? `<ellipse cx="${cx}" cy="0" rx="${radiusX}" ry="${radiusY}" fill="url(#cshadow)"/>`
        : match;
    };
    const art = sprite.svg.replace(PlaneSpriteService.SHADOW_ELLIPSE, swap);
    const num = FormatUtil.oneDecimal;
    const filter = hazeLevel > 0 ? ` filter="url(#haze${hazeLevel})"` : "";
    const move = `translate(${num(sprite.screenX)} ${num(sprite.screenY)}) scale(${sprite.scale.toFixed(3)})`;
    return `<g id="${sprite.id}" transform="${move}"${filter}>${art}</g>`;
  }
}
