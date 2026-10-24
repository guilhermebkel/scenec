import type { CompilationContext, LayoutLines } from "@/Protocols/CompilationProtocol.ts";
import type { CompileOptions } from "@/Protocols/OptionsProtocol.ts";
import type { Scene } from "@/Protocols/SceneProtocol.ts";
import type { Theme } from "@/Protocols/ThemeProtocol.ts";
import { AssetService } from "@/Services/AssetService.ts";
import { CustomAssetService } from "@/Services/CustomAssetService.ts";
import { KitService } from "@/Services/KitService.ts";
import { ThemeService } from "@/Services/ThemeService.ts";

export class ContextService {
  private static readonly DEFAULT_THEME = "flat-cool";

  private static readonly DEFAULT_KIT = "flat";

  private static readonly DEFAULT_SETTING = "outdoor";

  private static readonly DEFAULT_WIDTH = 1200;

  private static readonly CLASSIC_HEIGHT = 630;

  private static readonly TALL_HEIGHT = 900;

  private static readonly TALL_MODES = ["2.5d", "board"];

  // Why: the unit is the pixel size of one asset unit, where a person is 100 units tall.
  private static readonly UNIT_PER_HEIGHT = 0.0034;

  private static readonly MID_BASE_FOLLOW = 0.6;

  private static readonly FAR_BASE_FOLLOW = 0.3;

  private static readonly SETTING_TO_LINES: Record<string, LayoutLines> = {
    outdoor: { horizon: 0.64, base: { near: 0.92, mid: 0.8, far: 0.69 } },
    indoor: { horizon: 0.68, base: { near: 0.93, mid: 0.84, far: 0.74 } },
    beach: { horizon: 0.5, sea: 0.62, base: { near: 0.93, mid: 0.82, far: 0.71 } },
    city: { horizon: 0.7, base: { near: 0.94, mid: 0.84, far: 0.74 } },
  };

  static create(scene: Scene, options: CompileOptions, warnings: string[]): CompilationContext {
    const canvas = scene.canvas ?? {};
    const width = canvas.width ?? ContextService.DEFAULT_WIDTH;
    const height = canvas.height ?? (ContextService.TALL_MODES.includes(canvas.mode ?? "") ? ContextService.TALL_HEIGHT : ContextService.CLASSIC_HEIGHT);
    const kit = ContextService.kitOf(canvas.kit, warnings);
    const theme: Theme = { ...ContextService.themeOf(canvas.theme, warnings), ...(kit.colors ?? {}), ...(canvas.colors ?? {}) };
    const setting = canvas.setting ?? ContextService.DEFAULT_SETTING;
    const lines = ContextService.linesOf(setting, canvas, warnings);
    const failedAssets = new Set<string>();
    const library = ContextService.libraryOf(scene, options, warnings, failedAssets);
    const unit = height * ContextService.UNIT_PER_HEIGHT * (canvas.scale ?? 1);
    return { canvas, kit, objects: {}, library, failedAssets, theme, warnings, width, height, setting, lines, unit };
  }

  private static themeOf(name: string | undefined, warnings: string[]): Theme {
    const theme = ThemeService.THEMES[name ?? ContextService.DEFAULT_THEME];
    if (theme) {
      return theme;
    }
    warnings.push(`theme '${name}' does not exist; using '${ContextService.DEFAULT_THEME}'. Available: ${Object.keys(ThemeService.THEMES).join(", ")}`);
    return ThemeService.THEMES[ContextService.DEFAULT_THEME];
  }

  private static kitOf(name: string | undefined, warnings: string[]): CompilationContext["kit"] {
    const kit = KitService.KITS[name ?? ContextService.DEFAULT_KIT];
    if (kit) {
      return kit;
    }
    warnings.push(`kit '${name}' does not exist; available: ${Object.keys(KitService.KITS).join(", ")}`);
    return KitService.KITS[ContextService.DEFAULT_KIT];
  }

  private static linesOf(setting: string, canvas: CompilationContext["canvas"], warnings: string[]): LayoutLines {
    let preset = ContextService.SETTING_TO_LINES[setting];
    if (!preset) {
      warnings.push(`setting '${setting}' is invalid; use outdoor, indoor, beach or city`);
      preset = ContextService.SETTING_TO_LINES[ContextService.DEFAULT_SETTING];
    }
    const lines = structuredClone(preset);
    if (canvas.horizon != null) {
      lines.horizon = canvas.horizon;
    }
    if (canvas.base != null) {
      const shift = canvas.base - lines.base.near;
      lines.base = {
        near: canvas.base,
        mid: lines.base.mid + shift * ContextService.MID_BASE_FOLLOW,
        far: lines.base.far + shift * ContextService.FAR_BASE_FOLLOW,
      };
    }
    return lines;
  }

  private static libraryOf(scene: Scene, options: CompileOptions, warnings: string[], failed: Set<string>): CompilationContext["library"] {
    const custom = CustomAssetService.loadCustomAssets(scene.assets, options, warnings, failed);
    for (const id of Object.keys(custom)) {
      if (id in AssetService.ASSETS) {
        warnings.push(`custom asset '${id}' replaces the library asset with the same name`);
      }
    }
    return Object.keys(custom).length > 0 ? { ...AssetService.ASSETS, ...custom } : AssetService.ASSETS;
  }
}
