import { MapModule } from "@/Modules/MapModule.ts";
import { ParsingModule } from "@/Modules/ParsingModule.ts";
import { PlaneModule } from "@/Modules/PlaneModule.ts";
import type { Background, Camera, CompilationContext, CompilationOutput, CritiqueInput, LightState, Placement } from "@/Protocols/CompilationProtocol.ts";
import type { CompileOptions } from "@/Protocols/OptionsProtocol.ts";
import type { CompileResult } from "@/Protocols/ResultProtocol.ts";
import type { Scene } from "@/Protocols/SceneProtocol.ts";
import { AssetService } from "@/Services/AssetService.ts";
import { BackgroundService } from "@/Services/BackgroundService.ts";
import { CameraService } from "@/Services/CameraService.ts";
import { ContextService } from "@/Services/ContextService.ts";
import { DependencyOrderService } from "@/Services/DependencyOrderService.ts";
import { DescriptionService } from "@/Services/DescriptionService.ts";
import { FramingCheckService } from "@/Services/FramingCheckService.ts";
import { GazeService } from "@/Services/GazeService.ts";
import { GroupService } from "@/Services/GroupService.ts";
import { KitService } from "@/Services/KitService.ts";
import { LightingService } from "@/Services/LightingService.ts";
import { PieceService } from "@/Services/PieceService.ts";
import { PlacementService } from "@/Services/PlacementService.ts";
import { TextService } from "@/Services/TextService.ts";
import { ColorUtil } from "@/Utils/ColorUtil.ts";
import { SvgUtil } from "@/Utils/SvgUtil.ts";

export class CompilationModule {
  private static readonly PLANE_HEIGHT = 900;

  static compile(input: unknown, options: CompileOptions = {}): CompileResult {
    const { scene, warnings } = ParsingModule.parseScene(input);
    const { result } = CompilationModule.compileInternal(scene, options);
    return { ...result, warnings: [...warnings, ...result.warnings] };
  }

  static compileInternal(scene: Scene, options: CompileOptions = {}): CompilationOutput {
    const warnings: string[] = [];
    const context = ContextService.create(scene, options, warnings);
    const { canvas, theme, width } = context;
    const fullHeight = canvas.height ?? CompilationModule.PLANE_HEIGHT;
    if (canvas.mode === "map") {
      const map = MapModule.compileMap(scene, { theme, warnings, width, height: fullHeight });
      return { result: KitService.applyWholeKit(map, context), critique: null };
    }
    if (canvas.mode === "2.5d" || canvas.mode === "board") {
      const plane = PlaneModule.compilePlane(scene, {
        LIB: context.library, theme, warnings, W: width, H: fullHeight, resolveAsset: AssetService.resolveAsset, contrast: ColorUtil.contrast,
      });
      return { result: KitService.applyWholeKit(plane, context), critique: null };
    }
    return CompilationModule.compileClassic(scene, context);
  }

  private static compileClassic(scene: Scene, base: CompilationContext): CompilationOutput {
    const objects = GroupService.expandGroups(scene.objects ?? {}, base.warnings);
    const context: CompilationContext = { ...base, objects };
    const resolution = DependencyOrderService.resolve(objects, context.warnings);
    const placed = PlacementService.placeAll(context, resolution);
    GazeService.redraw(placed, context);
    const camera = CameraService.frame(placed, context);
    const list = Object.values(placed);
    FramingCheckService.check(list, context, camera, resolution.heldBy);
    const background = BackgroundService.build(context);
    const text = TextService.render(scene.text ?? [], context, list, background.textBackdrop);
    const light = LightingService.resolve(context, list, background);
    const backgroundSvg = CompilationModule.finishBackground(background, light, context, camera);
    // Why: drawing order is by depth value; the description and layout follow the same order.
    const ordered = [...list].sort((first, second) => first.z - second.z);
    const pieces = PieceService.assemble(ordered, { context, light, haze: background.haze, heldBy: resolution.heldBy });
    const castLayer = PieceService.castLayer(pieces.casts, light, context);
    const vignette = light && !light.isHatch ? `<rect width="${context.width}" height="${context.height}" fill="url(#vignette)"/>` : "";
    const head = `<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" width="${context.width}" height="${context.height}" viewBox="0 0 ${context.width} ${context.height}">`;
    const artwork = `${backgroundSvg}\n${castLayer}\n${pieces.body}\n${vignette}`;
    // Why: the scene filter wraps background and objects; the texture goes on top, below the text.
    const sceneArt = context.kit.scene ? `<defs>${KitService.sceneFilter(context.kit.scene, context.theme)}</defs><g filter="url(#kitScene)">${artwork}</g>` : artwork;
    const grain = CompilationModule.grain(context);
    const texture = KitService.texture(context.kit.texture, context.width, context.height);
    const svg = SvgUtil.flattenOpacity(`${head}\n${sceneArt}\n${texture}\n${grain}\n${text.svg}\n</svg>`);
    const result: CompileResult = {
      svg,
      warnings: [...new Set(context.warnings)],
      description: DescriptionService.describe(ordered, context),
      layout: DescriptionService.layout(ordered, context),
    };
    const critique = context.canvas.critique === false
      ? null
      : CompilationModule.critiqueInput({ context, head, background: backgroundSvg, sceneArt, textRects: text.rects, ordered });
    return { result, critique };
  }

  private static finishBackground(background: Background, light: LightState | null, context: CompilationContext, camera: Camera): string {
    const lit = light ? LightingService.applyToBackground(background.svg, light, context, camera) : background.svg;
    if (camera.zoom === 1) {
      return lit;
    }
    return `<g transform="translate(${camera.translateX.toFixed(1)} ${camera.translateY.toFixed(1)}) scale(${camera.zoom.toFixed(4)})">${lit}</g>`;
  }

  private static grain(context: CompilationContext): string {
    if (!context.canvas.grain) {
      return "";
    }
    return `<filter id="grain"><feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves="2" stitchTiles="stitch"/><feColorMatrix values="0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 0.55 0"/></filter><rect width="${context.width}" height="${context.height}" filter="url(#grain)" opacity="0.10"/>`;
  }

  // Why: the art-director critique runs in the render entry, which has resvg; the compiler only hands it the inputs.
  private static critiqueInput(parts: {
    context: CompilationContext;
    head: string;
    background: string;
    sceneArt: string;
    textRects: CritiqueInput["textRects"];
    ordered: Placement[];
  }): CritiqueInput {
    const { context, head, background, sceneArt, textRects, ordered } = parts;
    return {
      width: context.width,
      height: context.height,
      head,
      bg: SvgUtil.flattenOpacity(background),
      scene: SvgUtil.flattenOpacity(sceneArt),
      theme: context.theme,
      scale: context.canvas.scale ?? 1,
      textRects,
      skip: context.kit.scene === "sketch" ? ["silhouette"] : [],
      objects: ordered.filter((placement) => !placement.isOffView).map((placement) => ({
        id: placement.id,
        asset: placement.asset,
        kind: placement.kind,
        z: placement.z,
        body: SvgUtil.flattenOpacity(placement.bodySvg),
        related: placement.related,
        ignore: Boolean(placement.isBackdrop || context.objects[placement.id]?.critique === false),
      })),
    };
  }
}
