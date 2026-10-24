import { SanitizeUtil } from "@/Utils/SanitizeUtil.ts";
import { RecolorUtil } from "@/Utils/RecolorUtil.ts";

// Assets customizados declarados na própria cena (seção `assets:`).
// Aceita SVG (arquivo ou inline) ou imagem raster (PNG/JPG/WebP). O objeto é recortado
// pela caixa real do desenho, ancorado no centro da base e escalado para `height` unidades.
import type { BBox, CompileOptions } from "@/Protocols/OptionsProtocol.ts";

export class CustomAssetService {
  private static readonly KINDS = ["ground", "surface", "any", "wall", "sky", "ceiling", "floor", "water"];

  private static readonly DEFAULT_H: Record<string, any> = { ground: 60, surface: 18, any: 40, wall: 50, sky: 50, ceiling: 30, floor: 10, water: 60 };

  // Prefixa ids internos para não colidir com outros objetos da cena.
  private static prefixIds(svg: any, pre: any) {
    const ids = [...svg.matchAll(/\sid="([^"]+)"/g)].map((m) => m[1]);
    for (const id of ids) {
      const esc = id.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
      svg = svg.replace(new RegExp(`id="${esc}"`, "g"), `id="${pre}${id}"`)
        .replace(new RegExp(`url\\(#${esc}\\)`, "g"), `url(#${pre}${id})`)
        .replace(new RegExp(`href="#${esc}"`, "g"), `href="#${pre}${id}"`);
    }
    return svg;
  }

  private static extname(file: string): string {
    const dot = file.lastIndexOf(".");
    return dot < 0 ? "" : file.slice(dot).toLowerCase();
  }

  private static readText(io: CompileOptions, file: string): string {
    if (!io.files) { throw new Error("this call does not read files; pass the SVG inline or use the CLI"); }
    return io.files.readText(file);
  }

  private static readBytes(io: CompileOptions, file: string): Uint8Array {
    if (!io.files) { throw new Error("this call does not read files; pass the image through a file reader or use the CLI"); }
    return io.files.readBytes(file);
  }

  private static toBase64(bytes: Uint8Array): string {
    let binary = "";
    for (let i = 0; i < bytes.length; i += 0x8000) { binary += String.fromCharCode(...bytes.subarray(i, i + 0x8000)); }
    return btoa(binary);
  }

  private static rasterSize(buf: Uint8Array, ext: string): [number, number] | null {
    const view = new DataView(buf.buffer, buf.byteOffset, buf.byteLength);
    if (ext === ".png") { return [view.getUint32(16), view.getUint32(20)]; }
    if (ext === ".jpg" || ext === ".jpeg") {
      let i = 2;
      while (i < buf.length) { const m = buf[i + 1], len = view.getUint16(i + 2); if (m >= 0xc0 && m <= 0xc3) { return [view.getUint16(i + 7), view.getUint16(i + 5)]; } i += 2 + len; }
    }
    return null;
  }

  static loadCustomAssets(defs: Record<string, any> = {}, io: CompileOptions = {}, warnings: string[] = [], failed = new Set<string>()) {
    const out: Record<string, any> = {};
    let n = 0;
    for (const [id, d] of Object.entries(defs)) {
      n++;
      const kind = d.kind || "any";
      if (!CustomAssetService.KINDS.includes(kind)) { warnings.push(`custom asset '${id}': kind '${kind}' is invalid (use ${CustomAssetService.KINDS.join(", ")})`); continue; }
      const height = d.height ?? CustomAssetService.DEFAULT_H[kind];
      let inner: string, box: BBox;
      try {
        if (d.svg) {
          let src = d.svg.trim().startsWith("<") ? d.svg : CustomAssetService.readText(io, d.svg);
          src = SanitizeUtil.sanitizeSvg(src);
          const open = src.match(/<svg[^>]*>/i);
          if (!open) { throw new Error("does not look like an SVG"); }
          const vb = open[0].match(/viewBox="([^"]+)"/i);
          const wAttr = open[0].match(/\swidth="([\d.]+)/), hAttr = open[0].match(/\sheight="([\d.]+)/);
          const view = vb ? vb[1].split(/[\s,]+/).map(Number) : [0, 0, +(wAttr?.[1] || 100), +(hAttr?.[1] || 100)];
          inner = CustomAssetService.prefixIds(src.slice(src.indexOf(open[0]) + open[0].length, src.lastIndexOf("</svg>")), `c${n}-`);
          const probe = `<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" viewBox="${view.join(" ")}" width="${view[2]}" height="${view[3]}">${inner}</svg>`;
          const b = io.measure ? io.measure(probe) : { x: view[0], y: view[1], width: view[2], height: view[3] };
          if (!b?.width) { throw new Error("desenho vazio"); }
          box = d.trim === false ? { x: view[0], y: view[1], width: view[2], height: view[3] } : b;
        } else if (d.image) {
          const ext = CustomAssetService.extname(d.image);
          const buf = CustomAssetService.readBytes(io, d.image);
          const mime = { ".png": "image/png", ".jpg": "image/jpeg", ".jpeg": "image/jpeg", ".webp": "image/webp" }[ext];
          if (!mime) { throw new Error(`format ${ext} is not supported (use png, jpg or webp)`); }
          const size = (d.size_px && [d.size_px[0], d.size_px[1]]) || CustomAssetService.rasterSize(buf, ext);
          if (!size) { throw new Error("could not read the dimensions; set size_px: [width, height]"); }
          inner = `<image width="${size[0]}" height="${size[1]}" href="data:${mime};base64,${CustomAssetService.toBase64(buf)}"/>`;
          box = { x: 0, y: 0, width: size[0], height: size[1] };
        } else {
          warnings.push(`custom asset '${id}': informe 'svg' (arquivo ou inline) ou 'image'`); continue;
        }
      } catch (e: any) {
        const msg = (e as { code?: string }).code === "ENOENT" ? `file '${d.svg || d.image}' not found (path is relative to the scene file)` : e.message;
        warnings.push(`custom asset '${id}': ${msg}`); failed.add(id); continue;
      }
      const s = height / box.height;
      const w = box.width * s;
      const art = (p: any, t: any) => (d.recolor ? RecolorUtil.makeRecolor(t, d.recolor === true ? 0.75 : d.recolor)(inner) : inner);
      out[id] = {
        kind, width: w, height, custom: true,
        top: d.top, seat: d.seat, elevation: d.elevation ?? (kind === "wall" ? 80 : undefined),
        tags: d.tags || [],
        draw: (p: any, t: any) => {
          const flip = p.facing === "left" && d.facing !== "left" || p.facing === "right" && d.facing === "left" ? -1 : 1;
          const shadow = ["ground", "any"].includes(kind) && d.shadow !== false && p.shadow !== false
            ? `<ellipse cx="0" cy="0" rx="${(w * 0.45).toFixed(1)}" ry="${Math.min(4, w * 0.05).toFixed(1)}" fill="${t.shadow}"/>`
            : "";
          return shadow + `<g transform="scale(${flip} 1) translate(${(-(box.x + box.width / 2) * s).toFixed(3)} ${(-(box.y + box.height) * s).toFixed(3)}) scale(${s.toFixed(5)})">${art(p, t)}</g>`;
        },
      };
    }
    return out;
  }
}
