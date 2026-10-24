import { ParseService } from "@/pipeline/ParseService.ts";
import type { CompileResult } from "@/protocols/result.ts";
import { GroupService } from "@/pipeline/GroupService.ts";
import { CustomAssetService } from "@/pipeline/CustomAssetService.ts";
import { SvgUtil } from "@/utils/SvgUtil.ts";
import { ColorUtil } from "@/utils/ColorUtil.ts";
import { MapService } from "@/modes/MapService.ts";
import { PlaneService } from "@/modes/PlaneService.ts";
import { KitUtil } from "@/drawing/KitUtil.ts";
import { PersonUtil } from "@/drawing/PersonUtil.ts";
import { ThemeUtil } from "@/drawing/ThemeUtil.ts";
import { AssetUtil } from "@/drawing/AssetUtil.ts";

// Compilador: descrição de cena (YAML/JSON) -> SVG + avisos em texto + descrição da cena.
import type { CompileOptions } from "@/protocols/options.ts";

export class CompileService {
  private static readonly SLOTS: Record<string, any> = { "far-left": 0.08, left: 0.2, "center-left": 0.35, center: 0.5, "center-right": 0.65, right: 0.8, "far-right": 0.92 };

  private static readonly SIZES: Record<string, any> = { tiny: 0.5, small: 0.75, medium: 1, large: 1.3, huge: 1.7 };

  private static readonly DEPTHS = ["far", "mid", "near"];

  private static readonly GRIP: Record<string, any> = { cup: 6, suitcase: 44, books: 8, ball: 12 };

  // altura do ponto de pegada (unidades)
  private static readonly FONT = "Poppins";

  private static layoutLines(setting: any, _H?: any) {
    const L = structuredClone(({
      outdoor: { horizon: 0.64, base: { near: 0.92, mid: 0.8, far: 0.69 } },
      indoor: { horizon: 0.68, base: { near: 0.93, mid: 0.84, far: 0.74 } },
      beach: { horizon: 0.50, sea: 0.62, base: { near: 0.93, mid: 0.82, far: 0.71 } },
      city: { horizon: 0.70, base: { near: 0.94, mid: 0.84, far: 0.74 } },
    } as Record<string, any>)[setting] || null);
    return L;
  }

  private static readonly slotX = (at: any, def: any) => (typeof at === "number" ? at : CompileService.SLOTS[at] ?? def);

  private static readonly DEPTH_SCALE: Record<string, any> = { near: 1, mid: 0.8, far: 0.6 };

  static compile(input: unknown, options: CompileOptions = {}): CompileResult {
    const { scene, warnings } = ParseService.parseScene(input);
    const { critiqueInput: _ignored, ...result } = CompileService.compileInternal(scene, options);
    return { ...result, warnings: [...warnings, ...result.warnings] } as CompileResult;
  }

  static compileInternal(scene: any, opts: CompileOptions = {}): any {
    const warnings: string[] = [];
    const c = scene.canvas || {};
    const W = c.width || 1200, H = c.height || ((c.mode === "2.5d" || c.mode === "board") ? 900 : 630);
    const baseTheme = ThemeUtil.THEMES[c.theme || "flat-cool"] || (warnings.push(`theme '${c.theme}' does not exist; using 'flat-cool'. Available: ${Object.keys(ThemeUtil.THEMES).join(", ")}`), ThemeUtil.THEMES["flat-cool"]);
    // `canvas.colors` sobrescreve cores do tema (ex.: wall, floor, wood) para casar com uma referência
    // kit de estilo: muda a linguagem visual (contorno, hachura, risografia...), não só a paleta
    const KIT = KitUtil.KITS[c.kit || "flat"] || (warnings.push(`kit '${c.kit}' does not exist; available: ${Object.keys(KitUtil.KITS).join(", ")}`), KitUtil.KITS.flat);
    const theme = { ...baseTheme, ...(KIT.colors || {}), ...(c.colors || {}) };
    const setting = c.setting || ((c.mode === "2.5d" || c.mode === "board") ? "outdoor" : "outdoor");
    const lines = CompileService.layoutLines(setting, H) || (warnings.push(`setting '${setting}' is invalid; use outdoor, indoor, beach or city`), CompileService.layoutLines("outdoor"));
    const U = H * 0.0034 * (c.scale ?? 1); // px por unidade (pessoa = 100 un.)
    if (c.horizon != null) lines.horizon = c.horizon;
    if (c.base != null) { const d = c.base - lines.base.near; lines.base = { near: c.base, mid: lines.base.mid + d * 0.6, far: lines.base.far + d * 0.3 }; }
    const BASE = AssetUtil.ASSETS;
    const FAILED = new Set<string>();
    const CUSTOM = CustomAssetService.loadCustomAssets(scene.assets, opts, warnings, FAILED);
    for (const id of Object.keys(CUSTOM)) if (BASE[id]) warnings.push(`custom asset '${id}' replaces the library asset with the same name`);
    const LIB = Object.keys(CUSTOM).length ? { ...BASE, ...CUSTOM } : BASE;
    const wholeKit = (r: any) => {
      if (KIT.outline || KIT.light?.mode === "hatch") r.warnings?.push?.(`in ${c.mode} mode, kit '${c.kit}' applies only filter and texture; per-object outline and hatching exist in classic mode`);
      if (!KIT.scene && !KIT.texture) return r;
      const HH = c.height || 900;
      // texto fica fora do filtro (nítido) e por cima da textura
      const svg = r.svg.replace(/(<svg[^>]*>)([\s\S]*)(<\/svg>\s*)$/, (m: any, a: any, body: any, z: any) => {
        const texts: any[] = []; const art = body.replace(/<text\b[\s\S]*?<\/text>/g, (tx: any) => (texts.push(tx), ""));
        return `${a}<defs>${KIT.scene ? KitUtil.sceneFilter(KIT.scene, theme) : ""}</defs><g${KIT.scene ? " filter=\"url(#kitScene)\"" : ""}>${art}</g>${KitUtil.texture(KIT.texture, W, HH)}${texts.join("")}${z}`;
      });
      return { ...r, svg: SvgUtil.flattenOpacity(svg) };
    };
    if (c.mode === "map") return wholeKit(MapService.compileMap(scene, { theme, warnings, W, H: c.height || 900, contrast: ColorUtil.contrast }));
    if (c.mode === "2.5d" || c.mode === "board") return wholeKit(PlaneService.compilePlane(scene, { LIB, theme, warnings, W, H: c.height || 900, resolveAsset: AssetUtil.resolveAsset, contrast: ColorUtil.contrast }));
    const objs = GroupService.expandGroups(scene.objects || {}, warnings);
    const placed: Record<string, any> = {};

    // ---- ordem de resolução (dependências) ----
    const deps = (o: any) => ["left_of", "right_of", "behind", "in_front_of", "on", "under", "above"].map((k) => o[k]).filter(Boolean);
    const order: string[] = [], seen = new Set<string>(), visiting = new Set<string>();
    const visit = (id: any) => {
      if (seen.has(id)) return; if (visiting.has(id)) { warnings.push(`circular dependency involving '${id}'`); return; }
      visiting.add(id);
      const o = objs[id]; if (!o) return;
      for (const d of deps(o)) { if (!objs[d]) warnings.push(`'${id}' references '${d}', which does not exist in the scene`); else visit(d); }
      visiting.delete(id); seen.add(id); order.push(id);
    };
    Object.keys(objs).forEach(visit);
    // quem segura (holds) vem antes do objeto segurado
    const heldBy: Record<string, any> = {};
    for (const [id, o] of Object.entries(objs)) if (o.holds) {
      if (!objs[o.holds]) warnings.push(`'${id}' holds '${o.holds}', which does not exist`); else heldBy[o.holds] = id;
    }
    const final = order.filter((id) => !heldBy[id]);
    for (const id of order) if (heldBy[id]) final.splice(final.indexOf(heldBy[id]) + 1, 0, id);

    // ---- posicionamento ----
    for (const id of final) {
      const o = objs[id];
      const res = AssetUtil.resolveAsset(o.asset || id, LIB);
      if (!res.id) { if (FAILED.has(o.asset || id)) warnings.push(`'${id}' was ignored because custom asset '${o.asset || id}' failed to load`); else warnings.push(`asset '${o.asset || id}' (in '${id}') does not exist; did you mean: ${res.suggest!.join(", ")}?`); continue; }
      const A = LIB[res.id];
      const dims = A.size ? A.size(o) : { w: A.w, h: A.h };
      const sizeK = typeof o.size === "number" ? o.size : (CompileService.SIZES[o.size || "medium"] ?? (warnings.push(`size '${o.size}' is invalid in '${id}' (use ${Object.keys(CompileService.SIZES).join(", ")})`), 1));
      let depth = o.depth || null, x = null, y = null, scale = null, z = 0;
      const ref = (k: any) => placed[o[k]];

      if (A.kind === "sky") {
        scale = U * sizeK * 0.9;
        const slot = o.at || "top-right";
        const hx = String(slot).replace("top-", "").replace("sky-", "");
        x = (CompileService.SLOTS[hx] ?? (typeof o.at === "number" ? o.at : 0.5)) * W;
        y = H * (o.altitude ?? 0.14) + (dims.h * scale) / 2;
        if (res.id === "stars") { x = W / 2; y = H * 0.38; scale = W / 620; }
        z = -900;
      } else if (A.kind === "wall") {
        if (setting !== "indoor") warnings.push(`'${id}' is a wall object, but the setting is '${setting}'`);
        scale = U * sizeK * 0.85;
        x = (CompileService.SLOTS[o.at] ?? (typeof o.at === "number" ? o.at : 0.5)) * W;
        if (ref("left_of")) x = ref("left_of").bx0 - 0.03 * W - (dims.w * scale) / 2;
        if (ref("right_of")) x = ref("right_of").bx1 + 0.03 * W + (dims.w * scale) / 2;
        if (ref("above")) x = ref("above").x + (o.offset ?? 0) * ref("above").w;
        y = H * lines.horizon - (o.elevation ?? A.elevation) * U * 0.85;
        z = -800;
      } else if (A.kind === "ceiling") {
        scale = U * sizeK;
        x = CompileService.slotX(o.at, 0.5) * W; if (o.above && placed[o.above]) x = placed[o.above].x;
        y = (o.hang ?? 95) * U; z = 500;
      } else if (A.kind === "water") {
        scale = U * sizeK * 0.55; x = CompileService.slotX(o.at, 0.7) * W; y = H * ((lines.sea ?? lines.horizon) - 0.035); z = -700;
        if (!lines.sea) warnings.push(`'${id}' is a water object, but the scene has no sea (use setting: beach)`);
      } else if (o.on) {
        const p = ref("on");
        if (!p) { warnings.push(`'${id}' has 'on: ${o.on}', but '${o.on}' was not positioned`); continue; }
        const PA = LIB[p.asset];
        scale = p.scale * sizeK;
        const SEATED = ["sitting", "typing", "reading", "drinking", "sitting_floor", "hugging_knees"];
        if (PA.seat && SEATED.includes(o.pose)) {
          const off = typeof o.align === "number" ? o.align : ({ left: -0.28, right: 0.28, center: 0 } as Record<string, any>)[o.align || "center"] ?? 0;
          const fx = o.facing === "left" ? 1 : -1; // quadril um pouco para trás do centro do assento
          x = p.x + off * p.w + (A.peep ? 0 : fx * 4 * p.scale); y = p.y - PA.seat * p.scale + 45 * (res.id === "person" ? PersonUtil.bodyScale(o).by : 1) * p.scale * sizeK; z = p.z + 0.5;
        } else if (!(p.top ?? PA.top)) { warnings.push(`'${o.on}' has no supporting surface; '${id}' cannot sit on top of it`); x = p.x; y = p.y - p.h; z = p.z + 0.5; } else {
          const off = typeof o.align === "number" ? o.align : ({ left: -0.3, right: 0.3, center: 0, "far-left": -0.42, "far-right": 0.42 } as Record<string, any>)[o.align || "center"] ?? 0;
          x = p.x + off * p.w; y = p.y - (p.top ?? PA.top) * p.scale; z = p.z + 0.5 + (o.layer === "back" ? -0.2 : o.layer === "front" ? 0.2 : 0);
        }
        depth = p.depth;
      } else if (heldBy[id]) {
        const h = placed[heldBy[id]];
        scale = h.scale * sizeK;
        const hs = Math.sign(h.hand[0]) || 1;
        x = h.x + h.hand[0] * h.scale + (A.kind === "any" ? hs * dims.w * 0.42 * scale : 0); y = h.y + h.hand[1] * h.scale + (CompileService.GRIP[res.id] ?? dims.h / 2) * scale; z = h.z + 0.5;
        depth = h.depth;
      } else {
        // objetos de chão
        if (A.kind === "surface") warnings.push(`'${id}' (${res.id}) usually sits on a surface; add 'on: <table>'`);
        const pref = ref("left_of") || ref("right_of") || ref("behind") || ref("in_front_of") || ref("under");
        if (!depth) {
          if (o.behind && pref) depth = CompileService.DEPTHS[Math.max(0, CompileService.DEPTHS.indexOf(pref.depth) - 1)];
          else if (o.in_front_of && pref) depth = CompileService.DEPTHS[Math.min(2, CompileService.DEPTHS.indexOf(pref.depth) + 1)];
          else depth = (pref?.depth) || "near";
        }
        if (!CompileService.DEPTHS.includes(depth)) { warnings.push(`depth '${depth}' is invalid in '${id}' (use near, mid, far)`); depth = "near"; }
        scale = U * sizeK * CompileService.DEPTH_SCALE[depth];
        const w = dims.w * scale;
        const gap = (o.gap ?? 0.015) * W;
        x = (CompileService.SLOTS[o.at] ?? (typeof o.at === "number" ? o.at : 0.5)) * W;
        if (o.left_of && pref) x = pref.bx0 - gap - w / 2;
        if (o.right_of && pref) x = pref.bx1 + gap + w / 2;
        if (o.behind && pref) x = pref.x + (o.offset ?? 0.35) * pref.w;
        if (o.in_front_of && pref) x = pref.x + (o.offset ?? 0) * pref.w;
        if (o.under && pref) x = pref.x;
        y = H * lines.base[depth];
        z = CompileService.DEPTHS.indexOf(depth) * 1000 + y;
        if (A.kind === "floor") z -= 400;
        if (o.layer === "back") z -= 300; if (o.layer === "front") z += 300;
      }
      const drawn = A.draw({ ...o }, theme);
      if (drawn.box) { dims.w = drawn.box.w; dims.h = drawn.box.h; }
      const w = dims.w * scale, h = dims.h * scale;
      let svg = typeof drawn === "string" ? drawn : drawn.svg;
      if (A.outline) svg = `<g stroke="${theme.ink}" stroke-width="${(1.6 / scale).toFixed(2)}" stroke-linejoin="round">${svg.replaceAll(`fill="${theme.shadow}"`, `fill="${theme.shadow}" stroke="none"`)}</g>`;
      placed[id] = { id, asset: res.id, kind: A.kind, x, y, scale, w, h, z, depth, svg, top: A.topOf ? A.topOf(o) : A.top, noHaze: o.haze === false,
        hand: drawn.hand, bx0: x - w / 2, bx1: x + w / 2, by0: y - h, by1: y, related: deps(o).concat(o.holds || [], heldBy[id] || []) };
    }

    // ---- olhar: `look: <id>` faz o personagem olhar para outro objeto da cena ----
    for (const p of Object.values(placed)) {
      const o = objs[p.id];
      if (p.asset !== "person" || typeof o.look !== "string") continue;
      const tg = placed[o.look];
      if (!tg) { if (!["left", "right", "up", "down", "up-left", "up-right", "down-left", "down-right", "camera", "forward"].includes(o.look)) warnings.push(`'${p.id}' looks at '${o.look}', which does not exist in the scene`); continue; }
      const dx = tg.x - p.x, dy = (tg.y - tg.h / 2) - (p.y - p.h * 0.85), len = Math.hypot(dx, dy) || 1;
      const drawn = LIB.person.draw({ ...o, gaze: [dx / len, dy / len] }, theme);
      p.svg = drawn.svg;
    }

    // ---- enquadramento (câmera) ----
    // canvas.shot: wide (padrão) | full | medium | close; canvas.focus: id(s) ou grupo(s); canvas.frame: left | center | right | 0..1
    const shot = c.shot || "wide";
    const cam = { k: 1, tx: 0, ty: 0 };
    if (shot !== "wide") {
      const SHOT = ({ full: { fill: 0.55 }, medium: { show: 0.62, top: 0.12 }, close: { show: 0.3, top: 0.08 } } as Record<string, any>)[shot];
      if (!SHOT) warnings.push(`shot '${shot}' is invalid; use wide, full, medium or close`);
      else {
        let ids: any[] = [];
        for (const f of [].concat(c.focus || [])) {
          const m = placed[f] ? [f] : Object.keys(placed).filter((k) => k.startsWith(f + "_"));
          if (!m.length) warnings.push(`focus '${f}' does not exist in the scene`); ids.push(...m);
        }
        if (!ids.length) ids = Object.keys(placed).filter((k) => placed[k].asset === "person");
        if (!ids.length) ids = Object.keys(placed).filter((k) => ["ground", "any"].includes(placed[k].kind));
        let F = ids.map((i) => placed[i]);
        // medium e close enquadram pessoas (cabeça e tronco); a mesa do grupo não deve ditar o zoom
        if (SHOT.top != null && F.some((p) => p.asset === "person")) F = F.filter((p) => p.asset === "person");
        if (F.length) {
          // braços abertos/erguidos passam da caixa do personagem: dá folga lateral às pessoas
          const padX = (p: any) => (p.asset === "person" ? p.w * 0.5 : 0);
          const fx0 = Math.min(...F.map((p) => p.bx0 - padX(p))), fx1 = Math.max(...F.map((p) => p.bx1 + padX(p)));
          const fy0 = Math.min(...F.map((p) => p.by0)), fy1 = Math.max(...F.map((p) => p.by1));
          // zoom pela altura do foco, limitado para o foco caber na largura (formatos verticais)
          const top = c.headroom ?? SHOT.top, fh = Math.max(1, fy1 - fy0);
          // full: o foco inteiro ocupa ~62% da altura; medium/close: no espaço abaixo do headroom cabe só
          // a fração `show` do corpo (até o quadril / cabeça e ombros). Limitado para caber na largura.
          const kh = SHOT.fill ? (SHOT.fill * H) / fh : ((1 - top) * H) / (SHOT.show * fh);
          const k = Math.max(1, Math.min(6, kh, (0.8 * W) / Math.max(1, fx1 - fx0)));
          const target = typeof c.frame === "number" ? c.frame : ({ left: 1 / 3, center: 0.5, right: 2 / 3 } as Record<string, any>)[c.frame || "center"] ?? 0.5;
          let tx = target * W - ((fx0 + fx1) / 2) * k;
          let ty = top == null ? 0.55 * H - ((fy0 + fy1) / 2) * k : top * H - fy0 * k;
          tx = Math.min(0, Math.max(W - W * k, tx)); ty = Math.min(0, Math.max(H - H * k, ty));
          Object.assign(cam, { k, tx, ty });
          for (const p of Object.values(placed)) {
            p.x = p.x * k + tx; p.y = p.y * k + ty; p.scale *= k; p.w *= k; p.h *= k;
            p.bx0 = p.bx0 * k + tx; p.bx1 = p.bx1 * k + tx; p.by0 = p.by0 * k + ty; p.by1 = p.by1 * k + ty;
            p.offView = p.bx1 < -0.02 * W || p.bx0 > 1.02 * W || p.by1 < -0.02 * H || p.by0 > 1.02 * H;
          }
          for (const p of F) p.focus = true;
        }
      }
    }

    // ---- verificações (feedback em texto) ----
    const list = Object.values(placed);
    for (const p of list) {
      if (LIB[p.asset].backdrop) continue;
      const ox = Math.max(0, -p.bx0, p.bx1 - W) / p.w, oy = Math.max(0, -p.by0) / p.h;
      if (cam.k > 1) {
        if (p.focus && p.offView) warnings.push(`'${p.id}' is the focus but fell outside the framing (shot: ${shot}); change frame or focus`);
        // lasca: objeto cortado pela borda mostrando tão pouco que vira ruído visual
        const vis = (Math.max(0, Math.min(W, p.bx1) - Math.max(0, p.bx0)) * Math.max(0, Math.min(H, p.by1) - Math.max(0, p.by0))) / Math.max(1, p.w * p.h);
        if (!p.offView && vis > 0 && vis < 0.18 && !objs[p.id].allow_crop) warnings.push(`'${p.id}' shows only a sliver (${Math.round(vis * 100)}%) at the edge of the framing; remove it, move it or show more of it`);
        continue;
      }
      if ((ox > 0.05 || oy > 0.05) && !objs[p.id].allow_crop) warnings.push(`'${p.id}' is ${Math.round(Math.max(ox, oy) * 100)}% outside the frame`);
    }
    const blocking = list.filter((p) => ["ground", "any"].includes(p.kind) && !objs[p.id].on && !heldBy[p.id]);
    for (let i = 0; i < list.length; i++) for (let j = i + 1; j < list.length; j++) {
      const a = list[i], b = list[j];
      if (!blocking.includes(a) || !blocking.includes(b) || a.depth !== b.depth) continue;
      if (a.related.includes(b.id) || b.related.includes(a.id)) continue;
      if (LIB[a.asset].hollow || LIB[b.asset].hollow) continue; // tampos/prateleiras: o espaço embaixo é livre
      if ((objs[a.id].layer || "") !== (objs[b.id].layer || "")) continue; // camadas diferentes de propósito
      const ix = Math.max(0, Math.min(a.bx1, b.bx1) - Math.max(a.bx0, b.bx0));
      const iy = Math.max(0, Math.min(a.by1, b.by1) - Math.max(a.by0, b.by0));
      const frac = (ix * iy) / Math.min(a.w * a.h, b.w * b.h);
      if (frac > 0.2) warnings.push(`'${a.id}' overlaps '${b.id}' by ${Math.round(frac * 100)}%; use left_of/right_of or a different depth`);
    }

    // ---- fundo ----
    const t = theme;
    const hz = H * lines.horizon;
    // perspectiva atmosférica: o que está longe se mistura à cor do ar e perde contraste
    const air = setting === "indoor" ? t.wall : t.skyBottom;
    const [ar, ag, ab] = [1, 3, 5].map((i) => parseInt(air.slice(i, i + 2), 16) / 255);
    const HAZE = setting === "indoor" ? { far: 0.08, mid: 0.04 } : { far: 0.32, mid: 0.13 };
    if (c.haze === false) { HAZE.far = 0; HAZE.mid = 0; }
    const hazeFilter = (id: any, k: any) => `<filter id="${id}" color-interpolation-filters="sRGB"><feColorMatrix type="matrix" values="${1 - k} 0 0 0 ${(ar * k).toFixed(3)} 0 ${1 - k} 0 0 ${(ag * k).toFixed(3)} 0 0 ${1 - k} 0 ${(ab * k).toFixed(3)} 0 0 0 1 0"/></filter>`;
    const sm = (t.shadow.match(/[\d.]+/g) || [0, 0, 0, 0.15]).map(Number);
    let bg = `<defs><linearGradient id="sky" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${t.skyTop}"/><stop offset="1" stop-color="${t.skyBottom}"/></linearGradient>` +
      `<radialGradient id="cshadow"><stop offset="0" stop-color="rgb(${sm[0]},${sm[1]},${sm[2]})" stop-opacity="${sm[3] * 1.5}"/><stop offset="0.55" stop-color="rgb(${sm[0]},${sm[1]},${sm[2]})" stop-opacity="${sm[3] * 1.1}"/><stop offset="1" stop-color="rgb(${sm[0]},${sm[1]},${sm[2]})" stop-opacity="0"/></radialGradient>` +
      hazeFilter("hazeFar", HAZE.far) + hazeFilter("hazeMid", HAZE.mid) + `</defs>`;
    let bgAtText = t.skyTop;
    if (setting === "indoor") {
      bgAtText = t.wall;
      bg += `<rect width="${W}" height="${hz}" fill="${t.wall}"/><rect y="${hz}" width="${W}" height="${H - hz}" fill="${t.floor}"/>` +
        `<rect y="${hz - 8}" width="${W}" height="10" fill="${t.woodDark}" opacity="0.35"/>`;
      if (c.floor === "planks") {
        // tábuas em perspectiva, convergindo para um ponto de fuga acima da parede
        const vx = W * (c.vanish ?? 0.5), vy = hz - H * 0.9, n = 16;
        const atY = (x0: any, y: any) => vx + (x0 - vx) * (y - vy) / (H - vy);
        for (let i = -6; i < n + 6; i++) {
          const x0 = (i / n) * W * 1.6 - W * 0.3, x1 = ((i + 1) / n) * W * 1.6 - W * 0.3;
          bg += `<path d="M${atY(x0, hz).toFixed(1)} ${hz} L${atY(x1, hz).toFixed(1)} ${hz} L${x1.toFixed(1)} ${H} L${x0.toFixed(1)} ${H} Z" fill="${ColorUtil.sh(t.floor, (i % 3) * 0.03 - 0.03)}"/>` +
            `<path d="M${atY(x0, hz).toFixed(1)} ${hz} L${x0.toFixed(1)} ${H}" stroke="${ColorUtil.sh(t.floor, -0.3)}" stroke-width="1.2" opacity="0.6"/>`;
        }
      } else for (let i = 1; i < 8; i++) bg += `<rect x="0" y="${(hz + (H - hz) * (i / 8) ** 1.4 - 0.75).toFixed(1)}" width="${W}" height="1.5" fill="${t.woodDark}" opacity="0.15"/>`;
    } else if (setting === "beach") {
      const sea = H * lines.sea;
      bg += `<rect width="${W}" height="${H}" fill="url(#sky)"/><rect y="${hz}" width="${W}" height="${sea - hz}" fill="${t.sea}"/>` +
        `<path d="M0 ${sea} Q${W * 0.25} ${sea - 14} ${W * 0.5} ${sea} T${W} ${sea} L${W} ${H} L0 ${H} Z" fill="${t.ground}"/>`;
      for (let i = 0; i < 6; i++) bg += `<path d="M${W * (0.08 + i * 0.17)} ${hz + 18 + (i % 3) * 22} q14 -6 28 0" stroke="${t.seaLight}" stroke-width="3" fill="none" stroke-linecap="round"/>`;
      bg += `<path d="M0 ${sea - 4} Q${W * 0.25} ${sea - 18} ${W * 0.5} ${sea - 4} T${W} ${sea - 4}" stroke="${t.paper}" stroke-width="4" fill="none" opacity="0.7"/>`;
    } else {
      bg += `<rect width="${W}" height="${H}" fill="url(#sky)"/>`;
      if (setting === "outdoor") bg += `<path d="M0 ${hz} Q${W * 0.2} ${hz - 50} ${W * 0.45} ${hz - 10} T${W} ${hz - 30} L${W} ${H} L0 ${H} Z" fill="${t.groundDark}" opacity="0.55"/>`;
      bg += `<path d="M0 ${hz + 12} Q${W * 0.3} ${hz - 6} ${W * 0.6} ${hz + 10} T${W} ${hz + 4} L${W} ${H} L0 ${H} Z" fill="${t.ground}"/>`;
      if (setting === "city") bg += `<rect y="${H * 0.86}" width="${W}" height="${H * 0.14}" fill="${t.groundDark}"/>` +
        Array.from({ length: 10 }, (_, i) => `<rect x="${i * W / 10 + 20}" y="${H * 0.925}" width="${W / 20}" height="5" fill="${t.primary}" opacity="0.5"/>`).join("");
    }

    // ---- texto ----
    // Campos: content (\n quebra linha), at (top|bottom-left|center|right), role (title|subtitle|label|body),
    // opcionais: y (fração da altura, linha de base), size (fração da altura), weight, color, box (cor de fundo), pad.
    let textSvg = "";
    const textRects: any[] = [];
    for (const tx of scene.text || []) {
      const role = tx.role || "title";
      const fs = tx.size ? tx.size * H : (({ title: H * 0.075, subtitle: H * 0.036, label: H * 0.028, body: H * 0.032 } as Record<string, any>)[role] || H * 0.04);
      const [vy, hx] = (tx.at || "top-left").split("-");
      const m = W * 0.06;
      const anchor = hx === "center" ? "middle" : hx === "right" ? "end" : "start";
      const xx = tx.x != null ? tx.x * W : hx === "center" ? W / 2 : hx === "right" ? W - m : m;
      const lines = String(tx.content).split("\n");
      const lh = fs * 1.2;
      let yy = vy === "bottom" ? H - m * 0.7 - (lines.length - 1) * lh : m + fs * 0.9;
      if (tx.y == null && role === "subtitle" && (scene.text || []).some((o: any) => (o.role || "title") === "title" && o.at === tx.at && o.y == null)) yy += H * 0.075 * 0.9 + fs * 0.8;
      if (tx.y != null) yy = tx.y * H;
      const color = tx.color ? (t[tx.color] || tx.color) : t.text;
      let ratio = ColorUtil.contrast(color, bgAtText);
      const estW = Math.max(...lines.map((l) => l.length)) * fs * (tx.weight >= 700 || role === "title" ? 0.6 : 0.565);
      const x0 = anchor === "start" ? xx : anchor === "end" ? xx - estW : xx - estW / 2;
      const blockH = fs + (lines.length - 1) * lh;
      textRects.push({ x0, y0: yy - fs, x1: x0 + estW, y1: yy + blockH - fs * 0.75, box: !!tx.box });
      if (tx.box) {
        const bfill = t[tx.box] || tx.box, pad = (tx.pad ?? 0.45) * fs;
        ratio = ColorUtil.contrast(color, bfill);
        textSvg += `<rect x="${(x0 - pad).toFixed(1)}" y="${(yy - fs * 1.05 - pad * 0.3).toFixed(1)}" width="${(estW + pad * 2).toFixed(1)}" height="${(blockH + fs * 0.45 + pad * 0.6).toFixed(1)}" rx="${(tx.radius ?? 0.35) * fs}" fill="${bfill}"/>`;
      }
      if (ratio < 4.5) warnings.push(`text "${lines[0]}" has contrast ${ratio.toFixed(1)}:1 (min. 4.5); change 'color' or use 'box'`);
      for (const p of list) {
        if (LIB[p.asset].backdrop) continue;
        const ix = Math.max(0, Math.min(p.bx1, x0 + estW) - Math.max(p.bx0, x0)), iy = Math.max(0, Math.min(p.by1, yy + blockH - fs + fs * 0.25) - Math.max(p.by0, yy - fs));
        if (ix * iy > 0.06 * estW * blockH || ix * iy > 0.12 * p.w * p.h) warnings.push(`text "${lines[0]}" covers '${p.id}'`);
      }
      const weight = tx.weight || (role === "title" ? 700 : role === "body" ? 400 : 500);
      const esc = (v: any) => v.replace(/&/g, "&amp;").replace(/</g, "&lt;");
      textSvg += `<text x="${xx.toFixed(1)}" y="${yy.toFixed(1)}" font-family="${CompileService.FONT}" font-size="${fs.toFixed(1)}" font-weight="${weight}" fill="${color}" text-anchor="${anchor}">` +
        lines.map((l, i) => i === 0 ? `<tspan x="${xx.toFixed(1)}">${esc(l)}</tspan>` : `<tspan x="${xx.toFixed(1)}" dy="${lh.toFixed(1)}">${esc(l)}</tspan>`).join("") + `</text>`;
    }

    // ---- luz global ----
    // canvas.light: false | { from: left|right|front|0..1, strength: 0..1 }. Sem valor: segue o sol/lua/janela da cena.
    const KL = KIT.light || {};
    const lc = c.light === false || (KL.mode === "none" && c.light == null) ? null : typeof c.light === "object" ? c.light : {};
    const hatch = KL.mode === "hatch";
    const night = ColorUtil.luminance(setting === "indoor" ? t.wall : t.skyTop) < 0.12;
    let light: any = null;
    if (lc) {
      let lx = typeof lc.from === "number" ? lc.from : ({ left: 0.05, right: 0.95, front: 0.5, top: 0.5 } as Record<string, any>)[lc.from];
      if (lx == null) {
        const src = list.find((p) => ["sun", "moon"].includes(p.asset)) || (setting === "indoor" && list.find((p) => p.asset === "window"));
        lx = src ? src.x / W : 0.15;
      }
      const s = lc.strength ?? KL.strength ?? 0.6, dir = lx < 0.4 ? 1 : lx > 0.6 ? -1 : 0;
      const lcol = night ? "#C9D8FF" : "#FFF4DE", scol = `rgb(${sm[0]},${sm[1]},${sm[2]})`;
      const [x1, x2] = dir >= 0 ? [0, 1] : [1, 0];
      light = { lx, s, dir, lcol, scol };
      bg = bg.replace("</defs>",
        // sombreamento de volume: lado iluminado clareia, lado oposto escurece; base escurece (oclusão)
        `<linearGradient id="lgShade" x1="${dir ? x1 : 0.5}" y1="0" x2="${dir ? x2 : 0.5}" y2="${dir ? 0.35 : 1}"><stop offset="0" stop-color="${lcol}" stop-opacity="${(0.26 * s).toFixed(3)}"/><stop offset="0.42" stop-color="${lcol}" stop-opacity="0"/><stop offset="0.6" stop-color="${scol}" stop-opacity="0"/><stop offset="1" stop-color="${scol}" stop-opacity="${(0.5 * s).toFixed(3)}"/></linearGradient>` +
        `<linearGradient id="lgAO" x1="0" y1="0" x2="0" y2="1"><stop offset="0.72" stop-color="${scol}" stop-opacity="0"/><stop offset="1" stop-color="${scol}" stop-opacity="${(0.32 * s).toFixed(3)}"/></linearGradient>` +
        `<filter id="toWhite" color-interpolation-filters="sRGB"><feColorMatrix values="0 0 0 0 1 0 0 0 0 1 0 0 0 0 1 0 0 0 1 0"/></filter>` +
        `<filter id="castF" x="-30%" y="-30%" width="160%" height="160%" color-interpolation-filters="sRGB"><feColorMatrix values="0 0 0 0 ${(sm[0] / 255).toFixed(3)} 0 0 0 0 ${(sm[1] / 255).toFixed(3)} 0 0 0 0 ${(sm[2] / 255).toFixed(3)} 0 0 0 1 0"/><feGaussianBlur stdDeviation="${(H * (setting === "indoor" ? 0.006 : 0.003)).toFixed(1)}"/></filter>` +
        `<clipPath id="groundClip"><rect y="${(hz * cam.k + cam.ty).toFixed(1)}" width="${W}" height="${H}"/></clipPath>` +
        `<radialGradient id="glow" cx="${lx}" cy="${setting === "indoor" ? 0.25 : 0.15}" r="0.75"><stop offset="0" stop-color="${lcol}" stop-opacity="${(0.55 * s).toFixed(3)}"/><stop offset="1" stop-color="${lcol}" stop-opacity="0"/></radialGradient>` +
        `<linearGradient id="falloff" x1="${x1}" y1="0" x2="${x2}" y2="0"><stop offset="0.35" stop-color="${scol}" stop-opacity="0"/><stop offset="1" stop-color="${scol}" stop-opacity="${dir ? (0.13 * s).toFixed(3) : 0}"/></linearGradient>` +
        (hatch ? KitUtil.hatchDefs(t.ink) : "") +
        `<radialGradient id="vignette" cx="0.5" cy="0.5" r="0.75"><stop offset="0.6" stop-color="${scol}" stop-opacity="0"/><stop offset="1" stop-color="${scol}" stop-opacity="${(0.17 * s).toFixed(3)}"/></radialGradient></defs>`);
      if (hatch) { /* gravura: sem brilhos e degradês de ambiente */ } else if (setting === "indoor") bg += `<rect width="${W}" height="${hz}" fill="url(#glow)"/><rect width="${W}" height="${H}" fill="url(#falloff)"/>`;
      else bg += `<rect width="${W}" height="${H * 0.75}" fill="url(#glow)"/>`;
    }

    // ---- montagem ----
    if (cam.k !== 1) bg = `<g transform="translate(${cam.tx.toFixed(1)} ${cam.ty.toFixed(1)}) scale(${cam.k.toFixed(4)})">${bg}</g>`;
    const SHADOW_RE = /<ellipse cx="([-\d.]+)" cy="0" rx="([\d.]+)" ry="([\d.]+)" fill="[^"]*"( stroke="none")?\s*\/>/;
    const casts: any[] = [];
    const pieces = list.sort((a, b) => a.z - b.z).filter((p) => !p.offView).map((p) => {
      const cord = p.kind === "ceiling" ? `<path d="M${p.x.toFixed(1)} 0 L${p.x.toFixed(1)} ${(p.y - p.h).toFixed(1)}" stroke="${t.ink}" stroke-width="2"/>` : "";
      const hz = p.noHaze ? "" : p.depth === "far" && HAZE.far ? " filter=\"url(#hazeFar)\"" : p.depth === "mid" && HAZE.mid ? " filter=\"url(#hazeMid)\"" : "";
      let shadow = "";
      const art = p.svg.replace(SHADOW_RE, (m: any, cx: any, rx: any, ry: any) => {
        if (!m.includes(t.shadow)) return m;
        shadow = `<ellipse cx="${cx}" cy="0" rx="${(rx * 1.25).toFixed(1)}" ry="${(ry * 1.4).toFixed(1)}" fill="url(#cshadow)"/>`;
        return "";
      });
      const T = `translate(${p.x.toFixed(1)} ${p.y.toFixed(1)}) scale(${p.scale.toFixed(3)})`;
      const o = objs[p.id] || {};
      const A = LIB[p.asset] || {};
      let shade = "";
      const lit = light && !A.backdrop && !["sky", "floor"].includes(p.kind) && o.light !== false;
      if (lit) {
        const k = ({ near: 1, mid: 0.6, far: 0.3 } as Record<string, any>)[p.depth] ?? 1;
        const pad = 0.2;
        const [rx, ry, rw, rh] = [p.bx0 - p.w * pad, p.by0 - p.h * pad, p.w * (1 + 2 * pad), p.h * (1 + pad)].map((v) => v.toFixed(1));
        const mk = `<mask id="mk_${p.id}" maskUnits="userSpaceOnUse" x="${rx}" y="${ry}" width="${rw}" height="${rh}"><use href="#b_${p.id}" transform="${T}" filter="url(#toWhite)"/></mask>`;
        if (hatch) {
          // gravura: hachura só no lado da sombra (metade oposta à luz; de frente, a parte de baixo)
          const d = light.dir, hx0 = d > 0 ? p.x + p.w * 0.08 : +rx, hx1 = d < 0 ? p.x - p.w * 0.08 : +rx + +rw;
          const [hy0, hy1] = d ? [+ry, +ry + +rh] : [p.by0 + p.h * 0.6, +ry + +rh];
          shade = mk + `<g mask="url(#mk_${p.id})" opacity="${k}"><rect x="${hx0.toFixed(1)}" y="${hy0.toFixed(1)}" width="${Math.max(0, hx1 - hx0).toFixed(1)}" height="${Math.max(0, hy1 - hy0).toFixed(1)}" fill="url(#hatchP)"/></g>`;
        } else shade = mk + `<g mask="url(#mk_${p.id})" opacity="${k}"><rect x="${rx}" y="${ry}" width="${rw}" height="${rh}" fill="url(#lgShade)"/>` +
          (["ground", "any"].includes(p.kind) && !o.on ? `<rect x="${p.bx0.toFixed(1)}" y="${p.by0.toFixed(1)}" width="${p.w.toFixed(1)}" height="${p.h.toFixed(1)}" fill="url(#lgAO)"/>` : "") + `</g>`;
        // sombra projetada no chão: silhueta achatada e inclinada para longe da luz
        if (KL.casts !== false && ["ground", "any"].includes(p.kind) && !o.on && !heldBy[p.id] && !(o.elevation > 0) && !["mountain", "cloud"].includes(p.asset)) {
          const indoor = setting === "indoor";
          const kk = indoor ? 0.13 : 0.24, sx = (indoor ? 0.35 : 0.75) * light.dir;
          casts.push(`<use href="#b_${p.id}" transform="translate(${p.x.toFixed(1)} ${p.y.toFixed(1)}) matrix(1 0 ${(-sx).toFixed(3)} ${kk} 0 0) scale(${p.scale.toFixed(3)})"/>`);
        }
      }
      p.bodySvg = `<g transform="${T}">${art}</g>`;
      // contorno (outline/hatch) e sombra de recorte (paper), por objeto, com espessura constante em px
      const deco = !A.backdrop && !["sky", "floor"].includes(p.kind) && o.kit !== false;
      let art2 = art, fx = "", defs = "";
      if (deco && KIT.outline) {
        if (KIT.outline.inner) art2 = KitUtil.innerStroke(art, KIT.outline.inner / p.scale, t.ink);
        defs += KitUtil.outlineFilter(`ol_${p.id}`, KIT.outline.w / p.scale, t.ink); fx = `ol_${p.id}`;
      }
      if (deco && KIT.drop) { defs += KitUtil.dropFilter(`dr_${p.id}`, p.scale); fx = `dr_${p.id}`; }
      // sombra de contato fica fora do contorno (senão vira um anel em volta da elipse)
      const contact = shadow ? `<g transform="${T}"${hz}>${shadow}</g>` : "";
      const inner = `<g id="${p.id}" transform="${T}"${hz}><g id="b_${p.id}">${art2}</g></g>`;
      return cord + contact + (fx ? `${defs}<g filter="url(#${fx})">${inner}</g>` : inner) + shade;
    });
    const castLayer = !casts.length
      ? ""
      : hatch
        ? `<mask id="castM" maskUnits="userSpaceOnUse" x="0" y="0" width="${W}" height="${H}"><g filter="url(#toWhite)">${casts.join("")}</g></mask><g clip-path="url(#groundClip)"><rect width="${W}" height="${H}" fill="url(#hatchC)" mask="url(#castM)"/></g>`
        : `<g clip-path="url(#groundClip)" opacity="${((night ? 0.5 : setting === "indoor" ? 0.75 : 1) * 0.42 * light.s).toFixed(3)}"><g filter="url(#castF)">${casts.join("")}</g></g>`;
    const body = pieces.join("\n");
    const vignette = light && !hatch ? `<rect width="${W}" height="${H}" fill="url(#vignette)"/>` : "";
    const grain = c.grain ? `<filter id="grain"><feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves="2" stitchTiles="stitch"/><feColorMatrix values="0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 0.55 0"/></filter><rect width="${W}" height="${H}" filter="url(#grain)" opacity="0.10"/>` : "";
    const head = `<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">`;
    // filtro de cena (riso/sketch) envolve fundo + objetos; textura vai por cima, abaixo do texto
    const sceneArt = KIT.scene ? `<defs>${KitUtil.sceneFilter(KIT.scene, t)}</defs><g filter="url(#kitScene)">${bg}\n${castLayer}\n${body}\n${vignette}</g>` : `${bg}\n${castLayer}\n${body}\n${vignette}`;
    const svg = SvgUtil.flattenOpacity(`${head}\n${sceneArt}\n${KitUtil.texture(KIT.texture, W, H)}\n${grain}\n${textSvg}\n</svg>`);

    // ---- entrada do diretor de arte (a crítica em si roda em scenec/render, que usa o resvg) ----
    const critiqueInput = c.critique === false
      ? null
      : { W, H, head, bg: SvgUtil.flattenOpacity(bg), scene: SvgUtil.flattenOpacity(sceneArt), theme: t, scale: c.scale ?? 1, textRects, skip: KIT.scene === "sketch" ? ["silhouette"] : [],
          objects: list.filter((p: any) => !p.offView).map((p: any) => ({ id: p.id, asset: p.asset, kind: p.kind, z: p.z, body: SvgUtil.flattenOpacity(p.bodySvg), related: p.related, ignore: !!(LIB[p.asset].backdrop || objs[p.id].critique === false) })) };

    const description = list.map((p) => `${p.id} (${p.asset}): x=${Math.round((p.x / W) * 100)}%, base=${Math.round((p.y / H) * 100)}%, ` +
      `${Math.round((p.w / W) * 100)}%×${Math.round((p.h / H) * 100)}% of the frame${p.depth ? ", " + p.depth : ""}`).join("\n");
    const pct = (v: any, d: any) => +((v / d) * 100).toFixed(1);
    const layout = list.map((p) => ({ id: p.id, asset: p.asset, x: pct(p.x, W), base: pct(p.y, H), w: pct(p.w, W), h: pct(p.h, H) }));
    return { svg, warnings: [...new Set(warnings)], description, layout, critiqueInput };
  }
}
