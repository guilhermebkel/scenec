import { MapModule } from "@/Modules/MapModule.ts";
import { ParsingModule } from "@/Modules/ParsingModule.ts";
import { PlaneModule } from "@/Modules/PlaneModule.ts";
import type { Background, Camera, CompilationContext, CompilationOutput, CritiqueInput, LightState, Placement } from "@/Protocols/CompilationProtocol.ts";
import type { CritiqueName } from "@/Protocols/CritiqueProtocol.ts";
import type { KitSceneName } from "@/Protocols/KitProtocol.ts";
import type { CompileOptions } from "@/Protocols/OptionsProtocol.ts";
import type { CompileResult } from "@/Protocols/ResultProtocol.ts";
import type { ModeName, Scene, SettingName } from "@/Protocols/SceneProtocol.ts";
import { BackgroundService } from "@/Services/BackgroundService.ts";
import { CameraService } from "@/Services/CameraService.ts";
import { ContextService } from "@/Services/ContextService.ts";
import { DependencyOrderService } from "@/Services/DependencyOrderService.ts";
import { DescriptionService } from "@/Services/DescriptionService.ts";
import { FramingCheckService } from "@/Services/FramingCheckService.ts";
import { FramingService } from "@/Services/FramingService.ts";
import { GazeService } from "@/Services/GazeService.ts";
import { GroupService } from "@/Services/GroupService.ts";
import { KitService } from "@/Services/KitService.ts";
import { LightingService } from "@/Services/LightingService.ts";
import { PieceService } from "@/Services/PieceService.ts";
import { PlacementService } from "@/Services/PlacementService.ts";
import { TextService } from "@/Services/TextService.ts";
import { IdUtil } from "@/Utils/IdUtil.ts";
import { SvgUtil } from "@/Utils/SvgUtil.ts";

type ModeCompiler = (scene: Scene, context: CompilationContext) => CompilationOutput;

export class CompilationModule {
  private static readonly PLANE_HEIGHT = 900;

  private static readonly ZOOM_DIGITS = 4;

  private static readonly SETTING_TO_TEXT_BACKDROP: Partial<Record<SettingName, "wall">> = {
    indoor: "wall",
  };

  private static readonly SCENE_TO_SKIPPED_CRITIQUES: Partial<Record<KitSceneName, CritiqueName[]>> = {
    sketch: ["silhouette"],
  };

  private static readonly DEFAULT_GRAIN_OPACITY = 0.1;

  private static readonly GRAIN_DIGITS = 2;

  private static readonly MODE_TO_COMPILER: Record<ModeName, ModeCompiler> = {
    "classic": (scene, context) => CompilationModule.compileClassic(scene, context),
    "2.5d": (scene, context) => CompilationModule.compilePlane(scene, context),
    "board": (scene, context) => CompilationModule.compilePlane(scene, context),
    "map": (scene, context) => CompilationModule.compileMap(scene, context),
  };

  static compile(input: unknown, options: CompileOptions = {}): CompileResult {
    const { scene, warnings } = ParsingModule.parseScene(input);
    const { result } = CompilationModule.compileInternal(scene, options);
    return { ...result, warnings: [...warnings, ...result.warnings] };
  }

  static compileInternal(scene: Scene, options: CompileOptions = {}): CompilationOutput {
    const warnings: string[] = [];
    const context = ContextService.create(scene, options, warnings);
    return CompilationModule.MODE_TO_COMPILER[context.canvas.mode ?? "classic"](scene, context);
  }

  private static compileMap(scene: Scene, context: CompilationContext): CompilationOutput {
    const { theme, warnings, width, canvas } = context;
    const height = canvas.height ?? CompilationModule.PLANE_HEIGHT;
    const map = MapModule.compileMap(scene, { theme, warnings, width, height });
    return { result: KitService.applyWholeKit(map, context), critique: null };
  }

  private static compilePlane(scene: Scene, context: CompilationContext): CompilationOutput {
    const { theme, warnings, width, canvas, library } = context;
    const height = canvas.height ?? CompilationModule.PLANE_HEIGHT;
    const plane = PlaneModule.compilePlane(scene, { library, theme, warnings, width, height });
    return { result: KitService.applyWholeKit(plane, context), critique: null };
  }

  private static compileClassic(scene: Scene, base: CompilationContext): CompilationOutput {
    const objects = GroupService.expandGroups(scene.objects ?? {}, base.warnings);
    const context: CompilationContext = { ...base, idToObject: objects };
    const resolution = DependencyOrderService.resolve(objects, context.warnings);
    const placed = PlacementService.placeAll(context, resolution);
    GazeService.redraw(placed, context);
    const camera = CameraService.frame(placed, context);
    const list = Object.values(placed);
    FramingCheckService.check(list, context, camera, resolution.heldToHolder);
    const backdropKey = IdUtil.lookup(CompilationModule.SETTING_TO_TEXT_BACKDROP, context.setting) ?? "skyTop";
    const textBackdrop = context.theme[backdropKey];
    const text = TextService.render(scene.text ?? [], context, list, textBackdrop);
    const background = BackgroundService.build(context, { textRects: text.rects, placements: list });
    const light = LightingService.resolve(context, list, background);
    const backgroundSvg = CompilationModule.finishBackground(background, light, context, camera);
    // Why: drawing order is by depth value; the description and layout follow the same order.
    const ordered = [...list].sort((first, second) => first.z - second.z);
    const { heldToHolder } = resolution;
    const pieces = PieceService.assemble(ordered, { context, light, haze: background.haze, heldToHolder });
    const castLayer = PieceService.castLayer(pieces.casts, light, context);
    const { width, height } = context;
    const vignette = light && !light.isHatch ? `<rect width="${width}" height="${height}" fill="url(#vignette)" style="mix-blend-mode: multiply;"/>` : "";
    const framing = FramingService.render(context, ordered, text.rects);
    const framingSvg = framing.svg ? `\n${framing.svg}` : "";
    const head = `<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" `
      + `width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">`;
    const artwork = `${backgroundSvg}\n${castLayer}\n${pieces.body}\n${vignette}${framingSvg}`;
    const timeFilter = context.canvas.time ? LightingService.timeGradeFilter(context.canvas.time) : "";
    const graded = context.canvas.time ? `<defs>${timeFilter}</defs><g filter="url(#timeGrade)">${artwork}</g>` : artwork;
    // Why: the scene filter wraps background and objects; the texture goes on top, below the text.
    const sceneFilter = context.kit.scene ? KitService.sceneFilter(context.kit.scene) : "";
    const sceneArt = context.kit.scene ? `<defs>${sceneFilter}</defs><g filter="url(#kitScene)">${graded}</g>` : graded;
    const grain = CompilationModule.grain(context);
    const texture = KitService.texture(context.kit.texture, context.width, context.height);
    const svg = SvgUtil.flattenOpacity(`${head}\n${sceneArt}\n${texture}\n${grain}\n${text.svg}\n</svg>`);
    const result: CompileResult = {
      svg,
      warnings: [...new Set(context.warnings)],
      description: DescriptionService.describe(ordered, context, framing.corner),
      layout: DescriptionService.layout(ordered, context),
    };
    const parts = {
      context, head, background: backgroundSvg, sceneArt, textRects: text.rects, ordered, framing: framing.svg,
    };
    const critique = context.canvas.critique === false ? null : CompilationModule.critiqueInput(parts);
    return { result, critique };
  }

  private static finishBackground(
    background: Background, light: LightState | null, context: CompilationContext, camera: Camera,
  ): string {
    const lit = light ? LightingService.applyToBackground(background.svg, light, context, camera) : background.svg;
    if (camera.zoom === 1) {
      return lit;
    }
    const move = `translate(${camera.translateX.toFixed(1)} ${camera.translateY.toFixed(1)})`;
    return `<g transform="${move} scale(${camera.zoom.toFixed(CompilationModule.ZOOM_DIGITS)})">${lit}</g>`;
  }

  private static grain(context: CompilationContext): string {
    const { grain } = context.canvas;
    if (!grain) {
      return "";
    }
    const opacity = grain === true
      ? CompilationModule.DEFAULT_GRAIN_OPACITY
      : Number(grain.toFixed(CompilationModule.GRAIN_DIGITS));
    if (opacity <= 0) {
      return "";
    }
    // Why: soft-light blend mode scales grain with luminance (stronger in shadows, weaker in highlights).
    return `<filter id="grain"><feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves="2" stitchTiles="stitch"/><feColorMatrix values="0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 0.55 0"/></filter><rect width="${context.width}" height="${context.height}" filter="url(#grain)" style="mix-blend-mode: soft-light;" opacity="${opacity.toFixed(CompilationModule.GRAIN_DIGITS)}"/>`;
  }

  private static readonly FRAMING_CRITIQUE_Z = 999;

  private static critiqueInput(parts: {
    context: CompilationContext;
    head: string;
    background: string;
    sceneArt: string;
    textRects: CritiqueInput["textRects"];
    ordered: Placement[];
    framing?: string;
  }): CritiqueInput {
    const { context, head, background, sceneArt, textRects, ordered, framing } = parts;
    const objects = ordered.filter((placement) => !placement.isOffView).map((placement) => ({
      id: placement.id,
      asset: placement.asset,
      kind: placement.kind,
      z: placement.z,
      body: SvgUtil.flattenOpacity(placement.bodySvg),
      related: placement.related,
      isIgnored: placement.isBackdrop || context.idToObject[placement.id]?.critique === false,
    }));
    if (framing) {
      objects.push({
        id: "framing",
        asset: "framing",
        kind: "any",
        z: CompilationModule.FRAMING_CRITIQUE_Z,
        body: SvgUtil.flattenOpacity(framing),
        related: [],
        isIgnored: false,
      });
    }
    // Why: the art-director critique runs in the render entry, which has resvg; the compiler only hands it the inputs.
    return {
      width: context.width,
      height: context.height,
      head,
      bg: SvgUtil.flattenOpacity(background),
      scene: SvgUtil.flattenOpacity(sceneArt),
      theme: context.theme,
      scale: context.canvas.scale ?? 1,
      textRects,
      skip: IdUtil.lookup(CompilationModule.SCENE_TO_SKIPPED_CRITIQUES, context.kit.scene) ?? [],
      objects,
    };
  }
}
