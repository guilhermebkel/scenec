import type { BBox, CompileOptions } from "@/Protocols/OptionsProtocol.ts";
import type { CustomArtwork, CustomAssetDefinition } from "@/Protocols/CustomAssetProtocol.ts";
import { ASSET_KINDS, type AssetKind } from "@/Protocols/AssetProtocol.ts";
import { FallbackUtil } from "@/Utils/FallbackUtil.ts";
import { IdUtil } from "@/Utils/IdUtil.ts";
import { CustomAsset } from "@/Resources/Assets/CustomAsset.ts";
import { SanitizeUtil } from "@/Utils/SanitizeUtil.ts";

type ImageExtension = ".png" | ".jpg" | ".jpeg" | ".webp";

type RasterSize = [number, number] | null;

type SizeReader = (bytes: Uint8Array, view: DataView) => RasterSize;

export class CustomAssetService {
  private static readonly KIND_TO_HEIGHT: Record<AssetKind, number> = {
    ground: 60, surface: 18, any: 40, wall: 50, sky: 50, ceiling: 30, floor: 10, water: 60,
  };

  private static readonly EXTENSION_TO_MIME: Record<ImageExtension, string> = {
    ".png": "image/png", ".jpg": "image/jpeg", ".jpeg": "image/jpeg", ".webp": "image/webp",
  };

  private static readonly EXTENSION_TO_SIZE_READER: Partial<Record<ImageExtension, SizeReader>> = {
    ".png": (_bytes, view) => CustomAssetService.pngSize(view),
    ".jpg": (bytes, view) => CustomAssetService.jpegSize(bytes, view),
    ".jpeg": (bytes, view) => CustomAssetService.jpegSize(bytes, view),
  };

  private static readonly DEFAULT_SVG_SIZE = 100;

  private static readonly BASE64_CHUNK = 0x8000;

  private static readonly PNG_WIDTH_OFFSET = 16;

  private static readonly PNG_HEIGHT_OFFSET = 20;

  private static readonly JPEG_FIRST_MARKER = 2;

  private static readonly JPEG_FRAME_FIRST = 0xc0;

  private static readonly JPEG_FRAME_LAST = 0xc3;

  private static readonly JPEG_HEIGHT_OFFSET = 5;

  private static readonly JPEG_WIDTH_OFFSET = 7;

  static loadCustomAssets(
    definitions: Record<string, unknown> = {},
    options: CompileOptions = {},
    warnings: string[] = [],
    failed = new Set<string>(),
  ): Record<string, CustomAsset> {
    const idToAsset: Record<string, CustomAsset> = {};
    let position = 0;
    for (const [id, raw] of Object.entries(definitions)) {
      position++;
      const definition = raw as CustomAssetDefinition;
      const kind = CustomAssetService.validKindOf(id, definition, warnings);
      if (kind === null) {
        continue;
      }
      try {
        idToAsset[id] = CustomAssetService.build(kind, definition, options, position);
      } catch (error) {
        warnings.push(`custom asset '${id}': ${CustomAssetService.describeFailure(error, definition)}`);
        failed.add(id);
      }
    }
    return idToAsset;
  }

  private static validKindOf(id: string, definition: CustomAssetDefinition, warnings: string[]): AssetKind | null {
    const kind = FallbackUtil.nonEmpty(definition.kind, "any");
    if (!IdUtil.isOneOf(ASSET_KINDS, kind)) {
      warnings.push(`custom asset '${id}': kind '${kind}' is invalid (use ${ASSET_KINDS.join(", ")})`);
      return null;
    }
    if (!definition.svg && !definition.image) {
      warnings.push(`custom asset '${id}': provide 'svg' (a file or inline) or 'image'`);
      return null;
    }
    return kind;
  }

  private static build(
    kind: AssetKind, definition: CustomAssetDefinition, options: CompileOptions, position: number,
  ): CustomAsset {
    const artwork = definition.svg
      ? CustomAssetService.loadSvg(definition, options, position)
      : CustomAssetService.loadImage(definition, options);
    const height = definition.height ?? CustomAssetService.KIND_TO_HEIGHT[kind];
    return new CustomAsset(kind, height, definition, artwork);
  }

  private static describeFailure(error: unknown, definition: CustomAssetDefinition): string {
    const isMissing = error instanceof Error && (error as NodeJS.ErrnoException).code === "ENOENT";
    if (isMissing) {
      const file = FallbackUtil.nonEmpty(definition.svg, definition.image ?? "");
      return `file '${file}' not found (path is relative to the scene file)`;
    }
    return String(error instanceof Error ? error.message : error);
  }

  private static readText(options: CompileOptions, file: string): string {
    if (!options.files) {
      throw new Error("this call does not read files; pass the SVG inline or use the CLI");
    }
    return options.files.readText(file);
  }

  private static readBytes(options: CompileOptions, file: string): Uint8Array {
    if (!options.files) {
      throw new Error("this call does not read files; pass the image through a file reader or use the CLI");
    }
    return options.files.readBytes(file);
  }

  private static loadSvg(definition: CustomAssetDefinition, options: CompileOptions, position: number): CustomArtwork {
    const raw = definition.svg ?? "";
    const source = SanitizeUtil.sanitizeSvg(raw.trim().startsWith("<") ? raw : CustomAssetService.readText(options, raw));
    const open = /<svg[^>]*>/i.exec(source)?.[0];
    if (!open) {
      throw new Error("does not look like an SVG");
    }
    const [minX = 0, minY = 0, width = 0, height = 0] = CustomAssetService.viewBoxOf(open);
    const body = source.slice(source.indexOf(open) + open.length, source.lastIndexOf("</svg>"));
    const inner = CustomAssetService.prefixIds(body, `c${position}-`);
    const viewBox = [minX, minY, width, height].join(" ");
    const probe = `<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" `
      + `viewBox="${viewBox}" width="${width}" height="${height}">${inner}</svg>`;
    const declared: BBox = { x: minX, y: minY, width, height };
    const measured = options.measure ? options.measure(probe) : declared;
    if (!measured?.width) {
      throw new Error("the drawing is empty");
    }
    return { inner, box: definition.trim === false ? declared : measured };
  }

  private static viewBoxOf(open: string): number[] {
    const viewBox = /viewBox="([^"]+)"/i.exec(open)?.[1];
    if (viewBox) {
      return viewBox.split(/[\s,]+/).map(Number);
    }
    const width = Number(/\swidth="([\d.]+)/.exec(open)?.[1] ?? CustomAssetService.DEFAULT_SVG_SIZE);
    const height = Number(/\sheight="([\d.]+)/.exec(open)?.[1] ?? CustomAssetService.DEFAULT_SVG_SIZE);
    return [0, 0, width, height];
  }

  private static prefixIds(svg: string, prefix: string): string {
    // Why: internal ids get a prefix so they do not collide with other objects in the scene.
    let prefixed = svg;
    for (const match of svg.matchAll(/\sid="([^"]+)"/g)) {
      const id = match[1] ?? "";
      const escaped = id.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
      prefixed = prefixed.replace(new RegExp(`id="${escaped}"`, "g"), `id="${prefix}${id}"`)
        .replace(new RegExp(`url\\(#${escaped}\\)`, "g"), `url(#${prefix}${id})`)
        .replace(new RegExp(`href="#${escaped}"`, "g"), `href="#${prefix}${id}"`);
    }
    return prefixed;
  }

  private static loadImage(definition: CustomAssetDefinition, options: CompileOptions): CustomArtwork {
    const file = definition.image ?? "";
    const extension = CustomAssetService.extensionOf(file);
    const bytes = CustomAssetService.readBytes(options, file);
    const mime = IdUtil.lookup(CustomAssetService.EXTENSION_TO_MIME, extension);
    if (!mime) {
      throw new Error(`format ${extension} is not supported (use png, jpg or webp)`);
    }
    const declared = definition.size_px
      ? [definition.size_px[0] ?? 0, definition.size_px[1] ?? 0]
      : CustomAssetService.rasterSize(bytes, extension);
    if (!declared) {
      throw new Error("could not read the dimensions; set size_px: [width, height]");
    }
    const [width = 0, height = 0] = declared;
    return {
      inner: `<image width="${width}" height="${height}" `
        + `href="data:${mime};base64,${CustomAssetService.toBase64(bytes)}"/>`,
      box: { x: 0, y: 0, width, height },
    };
  }

  private static extensionOf(file: string): string {
    const dot = file.lastIndexOf(".");
    return dot < 0 ? "" : file.slice(dot).toLowerCase();
  }

  private static toBase64(bytes: Uint8Array): string {
    let binary = "";
    for (let start = 0; start < bytes.length; start += CustomAssetService.BASE64_CHUNK) {
      binary += String.fromCharCode(...bytes.subarray(start, start + CustomAssetService.BASE64_CHUNK));
    }
    return btoa(binary);
  }

  private static rasterSize(bytes: Uint8Array, extension: string): RasterSize {
    const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
    const read = IdUtil.lookup(CustomAssetService.EXTENSION_TO_SIZE_READER, extension);
    return read ? read(bytes, view) : null;
  }

  private static pngSize(view: DataView): RasterSize {
    return [view.getUint32(CustomAssetService.PNG_WIDTH_OFFSET), view.getUint32(CustomAssetService.PNG_HEIGHT_OFFSET)];
  }

  private static jpegSize(bytes: Uint8Array, view: DataView): RasterSize {
    let offset = CustomAssetService.JPEG_FIRST_MARKER;
    while (offset < bytes.length) {
      const marker = bytes[offset + 1] ?? 0;
      if (marker >= CustomAssetService.JPEG_FRAME_FIRST && marker <= CustomAssetService.JPEG_FRAME_LAST) {
        return [
          view.getUint16(offset + CustomAssetService.JPEG_WIDTH_OFFSET),
          view.getUint16(offset + CustomAssetService.JPEG_HEIGHT_OFFSET),
        ];
      }
      offset += 2 + view.getUint16(offset + 2);
    }
    return null;
  }
}
