import type { CompileResult } from "@/Protocols/ResultProtocol.ts";
import { ColorUtil } from "@/Utils/ColorUtil.ts";

// Modo 2.5D: o chão é um plano contínuo (x, z) visto em perspectiva.
// x ∈ [0,1] esquerda→direita; z ∈ [0,1] perto→longe (z>1 vai para o horizonte).
// Objetos continuam desenhados de frente ("recortes em pé"), escalados pela distância.
// Recursos: caminho com casas e checkpoints, zonas com cenário próprio, rótulos,
// espalhamento de vegetação que evita o caminho e posicionamento automático em espaço livre.

export class PlaneModule {
  private static readonly SLOTS: Record<string, any> = { "far-left": 0.08, "left": 0.2, "center-left": 0.35, "center": 0.5, "center-right": 0.65, "right": 0.8, "far-right": 0.92 };

  private static readonly SIZES: Record<string, any> = { tiny: 0.5, small: 0.75, medium: 1, large: 1.3, huge: 1.7 };

  private static readonly FONT = "Poppins";

  private static readonly esc = (s: any) => String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;");

  private static readonly f1 = (n: any) => (+n).toFixed(1);

  // Cenários prontos para zonas (o autor pode sobrescrever em `zones:`)
  private static readonly ZONE_PRESETS: Record<string, any> = {
    home: { tint: (t: any) => ColorUtil.sh(t.foliage[1], 0.5), decor: [{ asset: "house", size: 0.75 }, { asset: "tree", size: 0.7 }, { asset: "bush", size: 0.8 }] },
    school: { tint: (t: any) => ColorUtil.sh(t.accent, 0.68), decor: [{ asset: "school", size: 0.85 }, { asset: "tree", size: 0.7 }, { asset: "pennant", size: 0.8 }] },
    campus: { tint: (t: any) => ColorUtil.sh(t.foliage[1], 0.6), decor: [{ asset: "university", size: 0.85 }, { asset: "tree", size: 0.75 }, { asset: "bench", size: 0.8 }] },
    office: { tint: (t: any) => ColorUtil.sh(t.metal, 0.5), decor: [{ asset: "building", floors: 7, width: 90, size: 0.75 }, { asset: "building", floors: 5, width: 80, seed: 2, color: "primary", size: 0.75 }, { asset: "streetlight", size: 0.7 }] },
    lab: { tint: (t: any) => ColorUtil.sh(t.glass, 0.05), decor: [{ asset: "lab", size: 0.85 }, { asset: "pine", size: 0.6 }, { asset: "bush", size: 0.8 }] },
    ceremony: { tint: (t: any) => ColorUtil.sh(t.accent, 0.4), decor: [{ asset: "stage", size: 0.9 }, { asset: "balloons", size: 0.9 }, { asset: "balloons", size: 0.8 }, { asset: "pennant", color: "primary", size: 0.8 }] },
    park: { tint: (t: any) => ColorUtil.sh(t.foliage[0], 0.3), decor: [{ asset: "tree", size: 0.8 }, { asset: "bench", size: 0.8 }, { asset: "flowers", size: 0.9 }] },
    city: { tint: (t: any) => ColorUtil.sh(t.metal, 0.5), decor: [{ asset: "building", floors: 8, size: 0.75 }, { asset: "car", size: 0.8 }, { asset: "streetlight", size: 0.7 }] },
    beach: { tint: (t: any) => ColorUtil.sh(t.accent, 0.7), decor: [{ asset: "palm", size: 0.6 }, { asset: "umbrella", size: 0.8 }] },
  };

  private static rng(seed: any) { let s = (seed >>> 0) || 1; return () => ((s = (s * 1664525 + 1013904223) >>> 0) / 4294967296); }

  private static catmull(pts: any, per = 48) {
    if (pts.length < 2) { return pts.slice(); }
    const P = [pts[0], ...pts, pts[pts.length - 1]], out = [];
    for (let i = 1; i < P.length - 2; i++) {
      for (let k = 0; k < per; k++) {
        const t = k / per, t2 = t * t, t3 = t2 * t, [p0, p1, p2, p3] = [P[i - 1], P[i], P[i + 1], P[i + 2]];
        out.push([0, 1].map((j) => 0.5 * (2 * p1[j] + (-p0[j] + p2[j]) * t + (2 * p0[j] - 5 * p1[j] + 4 * p2[j] - p3[j]) * t2 + (-p0[j] + 3 * p1[j] - 3 * p2[j] + p3[j]) * t3)));
      }
    }
    out.push(pts[pts.length - 1]);
    return out;
  }

  static compilePlane(scene: any, { LIB, theme: t, warnings, W, H, resolveAsset, contrast }: any): CompileResult {
    const c = scene.canvas || {};
    // ---------- projeção ----------
    // Dois tipos de câmera: 'board' (padrão, alta e distante, para mapas e tabuleiros) e 'room'
    // (perspectiva real, mais baixa e próxima, para interiores). Todos os valores podem ser sobrescritos em canvas.camera.
    const camIn = typeof c.camera === "string" ? { preset: c.camera } : (c.camera || {});
    const ROOM = camIn.preset === "room" || c.camera === "room" || camIn.horizon != null;
    const cam = ROOM ? { horizon: 0.48, near_y: 1.0, depth: 0.7, vanish_x: 0.5, cx: 0.5, x_span: 1.17, unit: 0.0093, ...camIn } : camIn;
    const K = ROOM ? cam.depth : (c.depth ?? 0.9);
    const S = (z: any) => 1 / (1 + K * Math.max(z, -0.85 / K));
    let yInf: any, yN: any, xs: any, X: any;
    if (ROOM) {
      yInf = H * cam.horizon; yN = H * cam.near_y;
      xs = (z: any) => cam.x_span * S(z) / 0.98;
      X = (x: any, z: any) => W * cam.vanish_x + (x - cam.cx) * W * cam.x_span * S(z);
    } else {
      yN = H * (c.near_y ?? 0.97); const yF = H * (c.far_y ?? 0.32);
      yInf = (yF * (1 + K) - yN) / K;
      const sF = 1 / (1 + K);
      xs = (z: any) => 0.72 + 0.28 * (S(z) - sF) / (1 - sF);
      X = (x: any, z: any) => W / 2 + (x - 0.5) * W * 0.98 * xs(z);
    }
    const Y = (z: any) => yInf + (yN - yInf) * S(z);
    const U = ROOM ? H * cam.unit * (c.scale ?? 1) : H * 0.00165 * (c.scale ?? 1);
    const pxPerUnit = (z: any, k = 1) => U * S(z) * k;
    const worldR = (wUnits: any, z: any, k = 1) => (wUnits * pxPerUnit(z, k)) / 2 / (W * 0.98 * xs(z)); // raio no eixo x do mundo
    const P3 = (x: any, z: any, h = 0) => [X(x, z), Y(z) - h * U * S(z)]; // ponto do mundo (x, z, altura em unidades) -> tela
    const HAZE = (c.haze === false || ROOM && c.haze !== true) ? null : [[0.6, 0.1], [0.85, 0.2], [1.15, 0.34]];
    const hazeLevel = (z: any) => { if (!HAZE) { return 0; } let lv = 0; HAZE.forEach(([zz], i) => { if (z >= zz) { lv = i + 1; } }); return lv; };
    const air = t.skyBottom;
    const [ar, ag, ab] = [1, 3, 5].map((i) => parseInt(air.slice(i, i + 2), 16) / 255);

    const sprites: any[] = []; // objetos desenhados (ordenados por profundidade)
    const anchors: Record<string, any> = {}; // id -> [x, z]
    const footprints: any[] = []; // { x, z, r, id } para checar espaço livre

    // ---------- caminho ----------
    const pathDef = scene.path || null;
    let samples: any[] = [], cps: any[] = [], arc: any[] = [];
    const roadW = pathDef?.width ?? 0.075;
    const cpR = pathDef?.checkpoint_size ?? 0.042;
    if (pathDef) {
      const pts = (pathDef.points || []).map((p: any, i: any) => ({ ...p, id: p.id || `ponto${i + 1}`, i }));
      if (pts.length < 2) { warnings.push("path needs at least 2 points"); }
      for (const p of pts) {
        if (!Array.isArray(p.at) || p.at.length !== 2) { warnings.push(`path point '${p.id}' has no 'at: [x, z]'`); p.at = [0.5, 0.5]; }
        anchors[p.id] = p.at;
      }
      samples = PlaneModule.catmull(pts.map((p: any) => p.at), 40);
      arc = [0];
      for (let i = 1; i < samples.length; i++) { arc.push(arc[i - 1] + Math.hypot(samples[i][0] - samples[i - 1][0], samples[i][1] - samples[i - 1][1])); }
      cps = pts.map((p: any) => {
        let best = 0, bd = 1e9;
        samples.forEach((s, i) => { const d = Math.hypot(s[0] - p.at[0], s[1] - p.at[1]); if (d < bd) { bd = d; best = i; } });
        return { ...p, arc: arc[best] };
      });
    }
    const distToRoad = (x: any, z: any) => { let d = 1e9; for (const s of samples) { d = Math.min(d, Math.hypot(s[0] - x, s[1] - z)); } return d; };
    const pointAt = (u: any) => { // u ∈ [0,1] ao longo do caminho
      const L = arc[arc.length - 1] * Math.min(1, Math.max(0, u));
      let i = arc.findIndex((a) => a >= L); if (i <= 0) { i = 1; }
      const a = samples[i - 1], b = samples[i], k = (L - arc[i - 1]) / ((arc[i] - arc[i - 1]) || 1);
      const p = [a[0] + (b[0] - a[0]) * k, a[1] + (b[1] - a[1]) * k];
      const tg = [b[0] - a[0], b[1] - a[1]], n = Math.hypot(...tg) || 1;
      return { p, normal: [-tg[1] / n, tg[0] / n] };
    };

    // ---------- espaço livre ----------
    const free = (x: any, z: any, r: any, ignore: any[] = []) => {
      if (x - r < 0.02 || x + r > 0.98 || z < -0.04 || z > 1.08) { return false; }
      if (samples.length && distToRoad(x, z) < roadW / 2 + r * 0.9) { return false; }
      for (const cp of cps) { if (Math.hypot(cp.at[0] - x, cp.at[1] - z) < cpR + r) { return false; } }
      for (const f of footprints) { if (!ignore.includes(f.id) && Math.hypot(f.x - x, (f.z - z) * 1.6) < (f.r + r) * 0.85) { return false; } }
      return true;
    };
    // um objeto mais perto da câmera não pode tapar o caminho, checkpoints ou elementos importantes atrás dele
    const protectedSprites: any[] = [];
    const occludes = (x: any, z: any, A: any, k: any, o = {}) => {
      const dims = A.size ? A.size(o) : { w: A.width, h: A.height }, ppu = pxPerUnit(z, k);
      const sx = X(x, z), sy = Y(z), w = dims.w * ppu, h = dims.h * ppu;
      const b = { x0: sx - w * 0.42, x1: sx + w * 0.42, y0: sy - h * 0.95, y1: sy - h * 0.04 };
      for (let i = 0; i < samples.length; i += 2) { const p = samples[i]; if (p[1] > z + 0.005) { const px = X(p[0], p[1]), py = Y(p[1]); if (px > b.x0 && px < b.x1 && py > b.y0 && py < b.y1) { return true; } } }
      for (const cp of cps) { if (cp.at[1] > z) { const px = X(...cp.at), py = Y(cp.at[1]); if (px > b.x0 - 10 && px < b.x1 + 10 && py > b.y0 && py < b.y1 + 10) { return true; } } }
      for (const ps of protectedSprites) {
        if (ps.z > z) {
          const ov = Math.max(0, Math.min(b.x1, ps.bx1) - Math.max(b.x0, ps.bx0)) * Math.max(0, Math.min(b.y1, ps.by1) - Math.max(b.y0, ps.by0));
          if (ov > 0.12 * ps.w * ps.h) { return true; }
        }
      }
      return false;
    };
    const autoPlace = (ax: any, az: any, wUnits: any, k: any, opts: any = {}) => {
      const angles = opts.angles || [90, 60, 120, 30, 150, 0, 180, 20, 160, -30, 210, -90];
      const dists = opts.dists || [0.12, 0.16, 0.2, 0.25, 0.09];
      for (const d of dists) {
        for (const a of angles) {
          const x = ax + Math.cos((a * Math.PI) / 180) * d, z = az + Math.sin((a * Math.PI) / 180) * d * 0.9;
          const r = worldR(wUnits, z, k);
          if (free(x, z, r) && !(opts.A && occludes(x, z, opts.A, k, opts.o))) { return [x, z]; }
        }
      }
      return null;
    };

    // ---------- adicionar sprite ----------
    const addSprite = (id: any, o: any, x: any, z: any, opts: any = {}) => {
      const res = resolveAsset(o.asset || id, LIB);
      if (!res.id) { warnings.push(`asset '${o.asset || id}' (in '${id}') does not exist; did you mean: ${res.suggest.join(", ")}?`); return null; }
      const A = LIB[res.id];
      const k = typeof o.size === "number" ? o.size : (PlaneModule.SIZES[o.size || "medium"] ?? 1);
      const ppu = pxPerUnit(z, k);
      const drawn = A.draw({ ...o }, t);
      const svg = typeof drawn === "string" ? drawn : drawn.svg;
      const dims = A.size ? A.size(o) : { w: A.width, h: A.height };
      const lift = opts.lift ?? o.lift ?? 0;
      const sx = X(x, z), sy = Y(z) - lift * U * S(z);
      const sp: any = { id, asset: res.id, kind: A.kind, x, z, lift, sx, sy, ppu, svg, w: dims.w * ppu, h: dims.h * ppu, hu: dims.h * k, decor: !!opts.decor, person: res.id === "person" };
      sp.wx = (sp.w / 2) / (W * 0.98 * xs(z)) * (A.footprint ?? 0.55); // meia-largura do pé no mundo
      sp.bx0 = sx - sp.w / 2; sp.bx1 = sx + sp.w / 2; sp.by0 = sy - sp.h; sp.by1 = sy;
      sprites.push(sp);
      if (!opts.noFootprint) { footprints.push({ id, x, z, r: worldR(dims.w, z, k) * (res.id === "person" ? 0.6 : 1) }); }
      anchors[id] = [x, z];
      return sp;
    };

    // ---------- zonas (decoração automática perto do checkpoint) ----------
    const zoneDefs = { ...PlaneModule.ZONE_PRESETS, ...(scene.zones || {}) };
    const tints: any[] = [];
    for (const cp of cps) {
      if (!cp.zone) { continue; }
      const Z = zoneDefs[cp.zone];
      if (!Z) { warnings.push(`zone '${cp.zone}' (point '${cp.id}') does not exist; available: ${Object.keys(zoneDefs).join(", ")}`); continue; }
      const tint = typeof Z.tint === "function" ? Z.tint(t) : (t[Z.tint] || Z.tint || ColorUtil.sh(t.ground, 0.3));
      tints.push({ x: cp.at[0], z: cp.at[1], r: Z.radius ?? 0.24, color: tint });
      cp.tint = tint;
    }

    // ---------- caixas com volume (móveis, bancadas, construções) ----------
    const boxes: any[] = [];
    for (const [id, b] of Object.entries<any>(scene.boxes || {})) {
      if (!Array.isArray(b.from) || !Array.isArray(b.to)) { warnings.push(`box '${id}' needs from: [x, z] and to: [x, z]`); continue; }
      const x0 = Math.min(b.from[0], b.to[0]), x1 = Math.max(b.from[0], b.to[0]);
      const z0 = Math.min(b.from[1], b.to[1]), z1 = Math.max(b.from[1], b.to[1]);
      const h = b.height ?? 40, e = b.elevation ?? (b.thickness ? h - b.thickness : 0);
      if (e >= h) { warnings.push(`box '${id}': elevation (${e}) must be less than height (${h})`); continue; }
      boxes.push({ id, x0, x1, z0, z1, e, h, b, color: t[b.color] || b.color || t.wood });
      anchors[id] = [(x0 + x1) / 2, (z0 + z1) / 2];
    }
    for (let i = 0; i < boxes.length; i++) {
      for (let j = i + 1; j < boxes.length; j++) {
        const a = boxes[i], q = boxes[j];
        const ix = Math.min(a.x1, q.x1) - Math.max(a.x0, q.x0), iz = Math.min(a.z1, q.z1) - Math.max(a.z0, q.z0), ih = Math.min(a.h, q.h) - Math.max(a.e, q.e);
        if (ix > 0.002 && iz > 0.002 && ih > 0.5) { warnings.push(`boxes '${a.id}' and '${q.id}' interpenetrate; adjust from/to or elevation`); }
      }
    }
    const boxById = Object.fromEntries(boxes.map((bx) => [bx.id, bx]));
    // ordem de desenho: caixa embaixo de outra (ex.: gaveteiro sob o tampo) é desenhada antes dela
    boxes.forEach((bx) => { bx.key = bx.z1; });
    for (let pass = 0; pass < 3; pass++) {
      for (const a2 of boxes) {
        for (const b2 of boxes) {
          if (a2 === b2) { continue; }
          const ix = Math.min(a2.x1, b2.x1) - Math.max(a2.x0, b2.x0), iz = Math.min(a2.z1, b2.z1) - Math.max(a2.z0, b2.z0);
          if (ix > 0 && iz > 0 && a2.h <= b2.e + 0.5 && a2.key <= b2.key) { a2.key = b2.key + 1e-4; }
        }
      }
    }

    // ---------- objetos explícitos do autor ----------
    const objs = scene.objects || {};
    const order = Object.keys(objs);
    // resolve âncoras em ordem de dependência simples (near precisa existir)
    const pending = new Set(order);
    for (let pass = 0; pass < 4 && pending.size; pass++) {
      for (const id of [...pending]) {
        const o = objs[id];
        let x, z;
        if (Array.isArray(o.at)) { [x, z] = o.at; } else if (o.along != null) {
          if (!samples.length) { warnings.push(`'${id}' uses 'along', but the scene has no path`); pending.delete(id); continue; }
          const { p, normal } = pointAt(o.along); const side = o.side === "left" ? 1 : o.side === "right" ? -1 : 0;
          const d = o.dist ?? (side ? roadW / 2 + 0.05 : 0);
          [x, z] = [p[0] + normal[0] * d * side, p[1] + normal[1] * d * side];
        } else if (o.near) {
          if (!anchors[o.near]) { if (pass === 3) { warnings.push(`'${id}' has 'near: ${o.near}', which does not exist`); pending.delete(id); } continue; }
          const [ax, az] = anchors[o.near];
          if (o.offset) { [x, z] = [ax + o.offset[0], az + o.offset[1]]; } else if ((o.asset || id) === "person" || o.on_spot) { [x, z] = [ax, az - 0.005]; } else {
            const res = resolveAsset(o.asset || id, LIB); const A = res.id && LIB[res.id];
            const k = typeof o.size === "number" ? o.size : (PlaneModule.SIZES[o.size || "medium"] ?? 1);
            const spot = A && autoPlace(ax, az, (A.size ? A.size(o) : { w: A.width }).w, k);
            if (!spot) { warnings.push(`no free space found near '${o.near}' for '${id}'; use 'offset: [dx, dz]'`); [x, z] = [ax + 0.1, az + 0.1]; } else { [x, z] = spot; }
          }
        } else if (typeof o.at === "string" && LIB[resolveAsset(o.asset || id, LIB).id || ""]?.kind === "sky") {
          [x, z] = [PlaneModule.SLOTS[o.at.replace("top-", "")] ?? 0.5, 99];
        } else { warnings.push(`'${id}' has no position: use at: [x, z], near, or along`); pending.delete(id); continue; }
        pending.delete(id);
        if (z === 99) { // objeto de céu
          const res = resolveAsset(o.asset || id, LIB); if (!res.id) { continue; }
          const A = LIB[res.id], k = typeof o.size === "number" ? o.size : (PlaneModule.SIZES[o.size || "medium"] ?? 1), ppu = H * 0.0017 * k;
          sprites.push({ id, asset: res.id, kind: "sky", sx: x * W, sy: H * (o.altitude ?? 0.12) + A.height * ppu / 2, ppu, z: 50, svg: A.draw({ ...o }, t), w: A.width * ppu, h: A.height * ppu, sky: true });
          continue;
        }
        let lift;
        if (o.on && boxById[o.on]) {
          const bx = boxById[o.on]; lift = bx.h;
          if (x < bx.x0 - 0.005 || x > bx.x1 + 0.005 || z < bx.z0 - 0.005 || z > bx.z1 + 0.005) { warnings.push(`'${id}' has 'on: ${o.on}', but position [${x}, ${z}] is outside the top of the box`); }
        } else if (o.on) { warnings.push(`'${id}' has 'on: ${o.on}', which is not a box`); }
        const sp = addSprite(id, o, x, z, lift != null ? { lift } : {});
        if (sp) { protectedSprites.push(sp); }
        if (sp && samples.length && !sp.person && !["sky"].includes(sp.kind) && o.on_path !== true && distToRoad(x, z) < roadW / 2) { warnings.push(`'${id}' is on top of the path; move it or use 'on_path: true' if intended`); }
      }
    }

    // decoração das zonas (depois dos objetos do autor, para respeitar o espaço deles)
    for (const cp of cps) {
      const Z = cp.zone && zoneDefs[cp.zone]; if (!Z || cp.decor === false) { continue; }
      (Z.decor || []).forEach((d: any, i: any) => {
        const A = LIB[resolveAsset(d.asset, LIB).id || ""]; if (!A) { return; }
        const k = d.size ?? 1;
        const spot = autoPlace(cp.at[0], cp.at[1], (A.size ? A.size(d) : { w: A.width }).w, k, i === 0 ? { A, o: d } : { A, o: d, dists: [0.1, 0.14, 0.18, 0.22, 0.27] });
        if (!spot) { if (i === 0) { warnings.push(`zone '${cp.zone}': no free space for '${d.asset}' near '${cp.id}'`); } return; }
        const sp = addSprite(`${cp.id}_${d.asset}_${i}`, { ...d, size: k }, spot[0], spot[1], { decor: true });
        if (sp && i === 0) { protectedSprites.push(sp); }
      });
    }

    // espalhamento (vegetação etc.)
    for (const [si, sc] of (scene.scatter || []).entries()) {
      const R = PlaneModule.rng(sc.seed ?? 7 + si), list = sc.assets || ["tree", "bush"];
      const [x0, z0, x1, z1] = sc.area || [0.02, 0, 0.98, 1.05];
      let placedN = 0, tries = 0;
      while (placedN < (sc.count ?? 15) && tries++ < 3000) {
        const x = x0 + R() * (x1 - x0), z = z0 + R() * (z1 - z0), a = list[Math.floor(R() * list.length)];
        const A = LIB[resolveAsset(a, LIB).id || ""]; if (!A) { warnings.push(`scatter: asset '${a}' does not exist`); break; }
        const k = (sc.size ?? 0.8) * (0.8 + R() * 0.4);
        if (!free(x, z, worldR(A.width, z, k) * 0.9) || occludes(x, z, A, k)) { continue; }
        addSprite(`scatter${si}_${placedN}`, { asset: a, size: k, facing: R() < 0.5 ? "left" : "right" }, x, z, { decor: true });
        placedN++;
      }
    }

    for (const cp of cps) { cp.occupied = sprites.some((sp) => sp.person && Math.hypot(sp.x - cp.at[0], sp.z - cp.at[1]) < cpR); }

    // ---------- desenho: céu, horizonte, chão ----------
    const zH = c.horizon_z ?? 1.45, yH = Y(zH);
    let defs = `<linearGradient id="sky" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${t.skyTop}"/><stop offset="1" stop-color="${t.skyBottom}"/></linearGradient>`
      + `<linearGradient id="ground" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${ColorUtil.sh(t.ground, 0.18)}"/><stop offset="1" stop-color="${t.ground}"/></linearGradient>`;
    const sm = (t.shadow.match(/[\d.]+/g) || [0, 0, 0, 0.15]).map(Number);
    defs += `<radialGradient id="cshadow"><stop offset="0" stop-color="rgb(${sm[0]},${sm[1]},${sm[2]})" stop-opacity="${sm[3] * 1.5}"/><stop offset="0.55" stop-color="rgb(${sm[0]},${sm[1]},${sm[2]})" stop-opacity="${sm[3] * 1.1}"/><stop offset="1" stop-color="rgb(${sm[0]},${sm[1]},${sm[2]})" stop-opacity="0"/></radialGradient>`;
    if (HAZE) { HAZE.forEach(([, k], i) => { defs += `<filter id="haze${i + 1}" color-interpolation-filters="sRGB"><feColorMatrix type="matrix" values="${1 - k} 0 0 0 ${(ar * k).toFixed(3)} 0 ${1 - k} 0 0 ${(ag * k).toFixed(3)} 0 0 ${1 - k} 0 ${(ab * k).toFixed(3)} 0 0 0 1 0"/></filter>`; }); }
    tints.forEach((tn, i) => { defs += `<radialGradient id="zone${i}"><stop offset="0" stop-color="${tn.color}" stop-opacity="1"/><stop offset="0.62" stop-color="${tn.color}" stop-opacity="0.9"/><stop offset="1" stop-color="${tn.color}" stop-opacity="0"/></radialGradient>`; });

    let bg = ROOM ? "" : `<rect width="${W}" height="${H}" fill="url(#sky)"/>`;
    const poly = (pts: any, fill: any, extra = "") => `<polygon points="${pts.map((p: any) => PlaneModule.f1(p[0]) + "," + PlaneModule.f1(p[1])).join(" ")}" fill="${fill}" ${extra}/>`;
    if (ROOM) {
      const wl = scene.walls || {}, fl = scene.floor || {};
      const zB = wl.back?.z ?? 1, xR = wl.right?.x ?? (wl.right === false ? 3 : 1), xL = wl.left?.x ?? -3, zMin = fl.from_z ?? -0.8, wh = wl.height ?? 320;
      const backC = t[wl.back?.color] || wl.back?.color || t.wall, rightC = t[wl.right?.color] || wl.right?.color || ColorUtil.sh(backC, -0.07), leftC = t[wl.left?.color] || wl.left?.color || ColorUtil.sh(backC, -0.04);
      const floorC = t[fl.color] || fl.color || t.floor;
      bg += `<rect width="${W}" height="${H}" fill="${backC}"/>`;
      bg += poly([P3(xL, zMin), P3(xR, zMin), P3(xR, zB), P3(xL, zB)], floorC);
      if (fl.planks !== false) {
        const pw = fl.plank_width ?? 0.05;
        for (let x = xL, i = 0; x < xR; x += pw, i++) {
          const a = Math.max(x, xL), b2 = Math.min(x + pw, xR);
          if (b2 - a < 1e-4) { continue; } // evita caminhos de comprimento zero (o resvg não aceita)
          { const xa = P3(a, zMin)[0], xb = P3(b2, zMin)[0], xc = P3(a, zB)[0]; if (Math.max(xa, xb, xc) < -40 || Math.min(xa, xb, xc) > W + 40) { continue; } } // fora do quadro
          bg += poly([P3(a, zMin), P3(b2, zMin), P3(b2, zB), P3(a, zB)], ColorUtil.sh(floorC, ((i * 7) % 3) * 0.025 - 0.02))
            + `<path d="M${P3(a, zMin).map(PlaneModule.f1).join(" ")} L${P3(a, zB).map(PlaneModule.f1).join(" ")}" stroke="${ColorUtil.sh(floorC, -0.3)}" stroke-width="1" opacity="0.55"/>`;
          // juntas transversais
          // juntas como faixas finas (linhas perfeitamente horizontais derrubam o renderizador)
          for (let zz = zMin + ((i * 0.37) % 0.5); zz < zB; zz += 0.55) { const p1 = P3(a, zz), p2 = P3(b2, zz), th = Math.max(0.6, 1.2 * S(zz)); bg += poly([[p1[0], p1[1] - th / 2], [p2[0], p2[1] - th / 2], [p2[0], p2[1] + th / 2], [p1[0], p1[1] + th / 2]], ColorUtil.sh(floorC, -0.3), "opacity=\"0.4\""); }
        }
      }
      bg += poly([P3(xL, zB, 0), P3(xR, zB, 0), P3(xR, zB, wh), P3(xL, zB, wh)], backC);
      bg += poly([P3(xL, zB, 0), P3(xR, zB, 0), P3(xR, zB, 4), P3(xL, zB, 4)], ColorUtil.sh(backC, -0.08));
      if (xR < 2) {
        bg += poly([P3(xR, zMin, 0), P3(xR, zB, 0), P3(xR, zB, wh), P3(xR, zMin, wh)], rightC) + poly([P3(xR, zMin, 0), P3(xR, zB, 0), P3(xR, zB, 4), P3(xR, zMin, 4)], ColorUtil.sh(rightC, -0.08))
          + `<path d="M${P3(xR, zB, 0).map(PlaneModule.f1).join(" ")} L${P3(xR, zB, wh).map(PlaneModule.f1).join(" ")}" stroke="${ColorUtil.sh(backC, -0.12)}" stroke-width="1.2"/>`;
      }
      if (xL > -2) { bg += poly([P3(xL, zMin, 0), P3(xL, zB, 0), P3(xL, zB, wh), P3(xL, zMin, wh)], leftC); }
      // sombra de contato das caixas no chão
      for (const bx of boxes) {
        if (bx.e < 8 && bx.b.shadow !== false) {
          const m = 0.012;
          bg += poly([P3(bx.x0 - m, bx.z0 - m), P3(bx.x1 + m, bx.z0 - m), P3(bx.x1 + m, bx.z1), P3(bx.x0 - m, bx.z1)], t.shadow);
        }
      }
    }
    if (!ROOM) {
    // morros distantes
      const hill = ColorUtil.sh(t.groundDark || t.ground, 0.25);
      bg += `<path d="M0 ${PlaneModule.f1(yH)} Q${W * 0.12} ${PlaneModule.f1(yH - H * 0.07)} ${W * 0.28} ${PlaneModule.f1(yH - H * 0.02)} T${W * 0.6} ${PlaneModule.f1(yH - H * 0.04)} T${W} ${PlaneModule.f1(yH - H * 0.05)} L${W} ${PlaneModule.f1(yH + 4)} L0 ${PlaneModule.f1(yH + 4)} Z" fill="${hill}" opacity="0.7"/>`;
      bg += `<path d="M0 ${PlaneModule.f1(yH + 2)} Q${W * 0.25} ${PlaneModule.f1(yH - H * 0.035)} ${W * 0.5} ${PlaneModule.f1(yH)} T${W} ${PlaneModule.f1(yH - H * 0.02)} L${W} ${H} L0 ${H} Z" fill="url(#ground)"/>`;
    }
    // manchas de zona
    tints.forEach((tn, i) => {
      const cx = X(tn.x, tn.z), cy = Y(tn.z), rx = tn.r * W * 0.98 * xs(tn.z), ry = (Y(tn.z - tn.r) - Y(tn.z + tn.r)) / 2;
      bg += `<ellipse cx="${PlaneModule.f1(cx)}" cy="${PlaneModule.f1(cy)}" rx="${PlaneModule.f1(rx)}" ry="${PlaneModule.f1(ry)}" fill="url(#zone${i})"/>`;
    });

    // caminho: espessura, base, casas e checkpoints
    let road = "";
    if (samples.length) {
      const edge = (sign: any, extra = 0) => samples.map((p: any, i: any) => {
        const a = samples[Math.max(0, i - 1)], b = samples[Math.min(samples.length - 1, i + 1)];
        const tx = b[0] - a[0], tz = b[1] - a[1], n = Math.hypot(tx, tz) || 1;
        const hw = roadW / 2 + extra;
        return [p[0] - (tz / n) * hw * sign, p[1] + (tx / n) * hw * sign];
      });
      const poly = (extra: any, dy = 0) => {
        const L = edge(1, extra), R = edge(-1, extra).reverse();
        return [...L, ...R].map(([x, z]) => `${PlaneModule.f1(X(x, z))},${PlaneModule.f1(Y(z) + dy * S(z))}`).join(" ");
      };
      const roadC = pathDef.color ? (t[pathDef.color] || pathDef.color) : ColorUtil.sh(t.paper, -0.04);
      road += `<polygon points="${poly(0.006, 7)}" fill="${ColorUtil.sh(t.ground, -0.35)}" opacity="0.55"/>`;
      road += `<polygon points="${poly(0.006)}" fill="${ColorUtil.sh(roadC, -0.25)}"/><polygon points="${poly(0)}" fill="${roadC}"/>`;
      if (pathDef.tiles !== false) {
        const total = arc[arc.length - 1], tile = pathDef.tile_length ?? 0.045;
        const tileColors = [ColorUtil.sh(t.accent, 0.55), ColorUtil.sh(t.primary, 0.62), ColorUtil.sh(t.secondary, 0.65)];
        let k = 0;
        for (let a = tile * 0.2; a < total - tile * 0.5; a += tile) {
          const b = a + tile * 0.8;
          if (cps.some((cp: any) => Math.abs(cp.arc - (a + b) / 2) < cpR + tile * 0.45)) { k++; continue; }
          const P1 = pointAt(a / total), P2 = pointAt(b / total), hw = roadW / 2 * 0.8;
          const q = [[P1.p, P1.normal, 1], [P2.p, P2.normal, 1], [P2.p, P2.normal, -1], [P1.p, P1.normal, -1]]
            .map(([p, n, sgn]: any) => [p[0] + n[0] * hw * sgn, p[1] + n[1] * hw * sgn]).map(([x, z]) => `${PlaneModule.f1(X(x, z))},${PlaneModule.f1(Y(z))}`).join(" ");
          road += `<polygon points="${q}" fill="${tileColors[k++ % tileColors.length]}"/>`;
        }
      }
      // checkpoints
      cps.forEach((cp: any, idx: any) => {
        const [x, z] = cp.at, cx = X(x, z), cy = Y(z), rx = cpR * W * 0.98 * xs(z), ry = (Y(z - cpR) - Y(z + cpR)) / 2;
        const col = cp.finish ? t.accent : (t[cp.color] || cp.color || t.primary);
        road += `<ellipse cx="${PlaneModule.f1(cx)}" cy="${PlaneModule.f1(cy + 6 * S(z))}" rx="${PlaneModule.f1(rx)}" ry="${PlaneModule.f1(ry)}" fill="${ColorUtil.sh(col, -0.3)}"/>`
          + `<ellipse cx="${PlaneModule.f1(cx)}" cy="${PlaneModule.f1(cy)}" rx="${PlaneModule.f1(rx)}" ry="${PlaneModule.f1(ry)}" fill="${col}"/>`
          + `<ellipse cx="${PlaneModule.f1(cx)}" cy="${PlaneModule.f1(cy)}" rx="${PlaneModule.f1(rx * 0.78)}" ry="${PlaneModule.f1(ry * 0.78)}" fill="none" stroke="${t.paper}" stroke-width="${PlaneModule.f1(2.5 * S(z))}" opacity="0.8"/>`;
        if (!cp.occupied) { road += `<text x="${PlaneModule.f1(cx)}" y="${PlaneModule.f1(cy + ry * 0.35)}" font-family="${PlaneModule.FONT}" font-weight="700" font-size="${PlaneModule.f1(ry * 1.1)}" fill="${t.paper}" text-anchor="middle">${cp.finish ? "★" : idx + 1}</text>`; }
      });
    }

    // ---------- sprites ordenados por profundidade ----------
    const groundSprites = sprites.filter((s) => !s.sky).sort((a, b) => b.z - a.z || a.sy - b.sy);
    const skySprites = sprites.filter((s) => s.sky);
    const drawSprite = (s: any) => {
      const lv = s.sky ? 0 : hazeLevel(s.z);
      const art = s.svg.replace(/<ellipse cx="([-\d.]+)" cy="0" rx="([\d.]+)" ry="([\d.]+)" fill="[^"]*"( stroke="none")?\s*\/>/, (m: any, cx: any, rx: any, ry: any) =>
        m.includes(t.shadow) ? `<ellipse cx="${cx}" cy="0" rx="${(rx * 1.25).toFixed(1)}" ry="${(ry * 1.6).toFixed(1)}" fill="url(#cshadow)"/>` : m);
      return `<g id="${s.id}" transform="translate(${PlaneModule.f1(s.sx)} ${PlaneModule.f1(s.sy)}) scale(${s.ppu.toFixed(3)})"${lv ? ` filter="url(#haze${lv})"` : ""}>${art}</g>`;
    };

    // ---------- caixas: só as faces visíveis, com detalhes de portas/gavetas na face escolhida ----------
    const camX = ROOM ? cam.cx : 0.5;
    const drawBox = (bx: any) => {
      const { x0, x1, z0, z1, e, h, color, b } = bx;
      const q = P3, poly2 = (pts: any, fill: any, extra = "") => `<polygon points="${pts.map((pp: any) => PlaneModule.f1(pp[0]) + "," + PlaneModule.f1(pp[1])).join(" ")}" fill="${fill}" ${extra}/>`;
      const faces: Record<string, any> = {
        front: [q(x0, z0, e), q(x1, z0, e), q(x1, z0, h), q(x0, z0, h)],
        left: [q(x0, z1, e), q(x0, z0, e), q(x0, z0, h), q(x0, z1, h)],
        right: [q(x1, z0, e), q(x1, z1, e), q(x1, z1, h), q(x1, z0, h)],
      };
      const det = b.details || (b.front ? { type: b.front, count: b.count, face: "front" } : null);
      const dFace = det?.face || "front";
      const topC = t[b.top_color] || b.top_color || ColorUtil.sh(color, 0.1), sideC = ColorUtil.sh(color, -0.12);
      let g = "";
      if (e > 0 && q(x0, z1, e)[1] > q(x0, z0, e)[1]) { g += poly2([q(x0, z0, e), q(x1, z0, e), q(x1, z1, e), q(x0, z1, e)], ColorUtil.sh(color, -0.32)); }
      if (camX < x0) { g += poly2(faces.left, dFace === "left" ? color : sideC); }
      if (camX > x1) { g += poly2(faces.right, dFace === "right" ? color : sideC); }
      const top = [q(x0, z0, h), q(x1, z0, h), q(x1, z1, h), q(x0, z1, h)];
      if (top[3][1] < top[0][1] - 0.3) { g += poly2(top, topC); }
      g += poly2(faces.front, dFace === "front" ? color : ColorUtil.sh(color, -0.04));
      g += `<path d="M${top[0].map(PlaneModule.f1).join(" ")} L${top[1].map(PlaneModule.f1).join(" ")}" stroke="${ColorUtil.sh(color, 0.3)}" stroke-width="1"/>`;
      if (det && faces[dFace] && (dFace === "front" || (dFace === "left" ? camX < x0 : camX > x1))) {
        const [BL, BR, TR, TL] = faces[dFace];
        const bil = (u: any, v: any) => { const bx2 = BL[0] + (BR[0] - BL[0]) * u, by2 = BL[1] + (BR[1] - BL[1]) * u, tx = TL[0] + (TR[0] - TL[0]) * u, ty = TL[1] + (TR[1] - TL[1]) * u; return [bx2 + (tx - bx2) * v, by2 + (ty - by2) * v]; };
        const zm = dFace === "front" ? z0 : (z0 + z1) / 2, sw = Math.max(0.7, U * S(zm) * 0.16);
        const ln = (a: any, bb: any, col2: any, w2: any) => `<path d="M${a.map(PlaneModule.f1).join(" ")} L${bb.map(PlaneModule.f1).join(" ")}" stroke="${col2}" stroke-width="${PlaneModule.f1(w2)}" stroke-linecap="round"/>`;
        const pv = (det.plinth ?? 2) / (h - e);
        if (pv > 0) { g += poly2([bil(0, 0), bil(1, 0), bil(1, pv), bil(0, pv)], ColorUtil.sh(color, -0.28)); }
        const n = det.count || (det.type === "drawers" ? 4 : 2), gap = ColorUtil.sh(color, -0.3), metal = t[det.handle] || det.handle || t.metal;
        if (det.type === "drawers") {
          for (let i = 0; i < n; i++) {
            const v1 = 1 - i * (1 - pv) / n, v0 = v1 - (1 - pv) / n, vm = (v0 + v1) / 2 + (v1 - v0) * 0.08;
            if (i > 0) { g += ln(bil(0.02, v1), bil(0.98, v1), gap, sw); }
            g += ln(bil(0.28, vm), bil(0.72, vm), metal, sw * 1.8) + ln(bil(0.28, vm - (v1 - v0) * 0.06), bil(0.72, vm - (v1 - v0) * 0.06), ColorUtil.sh(metal, -0.35), sw * 0.6);
          }
        } else if (det.type === "doors") {
          for (let i = 1; i < n; i++) { g += ln(bil(i / n, pv), bil(i / n, 0.99), gap, sw); }
          for (let i = 0; i < n; i++) {
            const u = n === 1 ? 0.88 : (i < n / 2 ? (i + 1) / n - 0.045 : i / n + 0.045);
            g += ln(bil(u, 0.42), bil(u, 0.74), metal, sw * 1.8);
          }
        } else if (det.type === "open") {
          g += poly2([bil(0.05, pv + 0.04), bil(0.95, pv + 0.04), bil(0.95, 0.95), bil(0.05, 0.95)], ColorUtil.sh(color, -0.38));
          for (const vv of (det.shelves || [0.5])) { g += ln(bil(0.05, vv), bil(0.95, vv), color, sw * 2.2); }
        }
      }
      return `<g id="${bx.id}"${b.opacity != null ? ` opacity="${b.opacity}"` : ""}>${g}</g>`;
    };

    // ---------- ordem de desenho (pintor com relações par a par) ----------
    // Cada item vira um volume no mundo: caixa = [x0,x1]×[z0,z1]×[e,h]; recorte = pé fino em z com largura do desenho.
    // Para cada par que se sobrepõe na tela decidimos quem está atrás (separação em z, depois em x vista da câmera,
    // depois em altura, com a câmera acima) e desenhamos numa ordem topológica que respeita todas essas relações.
    const drawOrdered = () => {
      const items = [
        ...groundSprites.map((sp) => ({ kind: "sprite", cx: sp.x, x0: sp.x - sp.wx, x1: sp.x + sp.wx, z0: sp.z, z1: sp.z, e: sp.lift, h: sp.lift + sp.hu, sb: [sp.bx0, sp.by0, sp.bx1, sp.by1], svg: () => drawSprite(sp), ref: sp })),
        ...boxes.map((bx) => {
          const pts = [bx.x0, bx.x1].flatMap((xx) => [bx.z0, bx.z1].flatMap((zz) => [bx.e, bx.h].map((hh) => P3(xx, zz, hh))));
          const xsS = pts.map((p) => p[0]), ysS = pts.map((p) => p[1]);
          return { kind: "box", x0: bx.x0, x1: bx.x1, z0: bx.z0, z1: bx.z1, e: bx.e, h: bx.h, sb: [Math.min(...xsS), Math.min(...ysS), Math.max(...xsS), Math.max(...ysS)], svg: () => drawBox(bx), ref: bx };
        }),
      ];
      const EPS = 1e-4;
      const behind = (A: any, B: any) => { // true se A deve ser desenhado antes de B
        const sameZ = A.z0 === A.z1 && B.z0 === B.z1 && Math.abs(A.z0 - B.z0) < EPS;
        if (!sameZ) { if (A.z0 >= B.z1 - EPS) { return true; } if (B.z0 >= A.z1 - EPS) { return false; } }
        // recortes não têm volume: se o centro do recorte está fora da caixa no eixo x, tratamos como separados
        const ax0 = A.kind === "sprite" && B.kind === "box" && (A.cx > B.x1 || A.cx < B.x0) ? A.cx : A.x0, ax1 = A.kind === "sprite" && B.kind === "box" && (A.cx > B.x1 || A.cx < B.x0) ? A.cx : A.x1;
        const bx0 = B.kind === "sprite" && A.kind === "box" && (B.cx > A.x1 || B.cx < A.x0) ? B.cx : B.x0, bx1 = B.kind === "sprite" && A.kind === "box" && (B.cx > A.x1 || B.cx < A.x0) ? B.cx : B.x1;
        if (ax1 <= bx0 + EPS) { return camX >= (ax1 + bx0) / 2; }
        if (bx1 <= ax0 + EPS) { return camX <= (bx1 + ax0) / 2; }
        if (A.h <= B.e + 0.5) { return true; } // A embaixo de B (câmera acima): A primeiro
        if (B.h <= A.e + 0.5) { return false; }
        return (A.z0 + A.z1) / 2 > (B.z0 + B.z1) / 2; // volumes que se cruzam: centro mais distante primeiro
      };
      const n = items.length, edges: number[][] = items.map(() => []), indeg = new Array(n).fill(0);
      const ov = (a: any, b: any) => a.sb[0] < b.sb[2] && b.sb[0] < a.sb[2] && a.sb[1] < b.sb[3] && b.sb[1] < a.sb[3];
      for (let i = 0; i < n; i++) {
        for (let j = i + 1; j < n; j++) {
          if (!ov(items[i], items[j])) { continue; }
          const [a, b] = behind(items[i], items[j]) ? [i, j] : [j, i];
          edges[a].push(b); indeg[b]++;
        }
      }
      // Kahn; empate e ciclos resolvidos pelo mais distante primeiro
      const far = (i: any) => -((items[i].z0 + items[i].z1) / 2) * 1000 + items[i].e * 0.001;
      const done = new Array(n).fill(false), out = [];
      while (out.length < n) {
        let pick = -1;
        for (let i = 0; i < n; i++) { if (!done[i] && indeg[i] === 0 && (pick < 0 || far(i) < far(pick))) { pick = i; } }
        if (pick < 0) { for (let i = 0; i < n; i++) { if (!done[i] && (pick < 0 || indeg[i] < indeg[pick] || (indeg[i] === indeg[pick] && far(i) < far(pick)))) { pick = i; } } warnings.push(`ambiguous depth order involving '${items[pick].ref.id}' (intersecting volumes); move the objects apart or adjust from/to`); }
        done[pick] = true; out.push(pick);
        for (const j of edges[pick]) { indeg[j]--; }
      }
      return out.map((i) => items[i].svg()).join("\n");
    };

    // ---------- rótulos dos checkpoints ----------
    const labels: any[] = [];
    const labelBlockers = groundSprites.filter((s) => !s.decor || s.h > 40).map((s) => ({ x0: s.bx0, x1: s.bx1, y0: s.by0, y1: s.by1, id: s.id }));
    const overlap = (a: any, b: any) => Math.max(0, Math.min(a.x1, b.x1) - Math.max(a.x0, b.x0)) * Math.max(0, Math.min(a.y1, b.y1) - Math.max(a.y0, b.y0));
    const titleBox: any[] = [];
    for (const [idx, cp] of cps.entries()) {
      if (!cp.label) { continue; }
      const [x, z] = cp.at, cx = X(x, z), cy = Y(z);
      const fs = Math.max(13, H * 0.024 * (0.75 + 0.25 * S(z) / 1));
      const txt = `${cp.finish ? "★" : idx + 1}  ${cp.label}`;
      const w = txt.length * fs * 0.56 + fs * 1.4, h = fs * 1.8;
      const ry = (Y(z - cpR) - Y(z + cpR)) / 2;
      const personAbove = groundSprites.find((s) => s.person && Math.abs(s.sx - cx) < 20 && Math.abs(s.sy - cy) < 20);
      const up = personAbove ? personAbove.h + fs * 0.6 : fs * 2.4;
      const cands = [
        [cx - w / 2, cy - up - h], [cx + ry * 2.2, cy - h * 0.5], [cx - ry * 2.2 - w, cy - h * 0.5],
        [cx + ry * 1.6, cy - up * 0.7 - h], [cx - ry * 1.6 - w, cy - up * 0.7 - h], [cx - w / 2, cy + ry * 2],
      ];
      if (cp.label_side === "left") { cands.unshift(cands[2]); } if (cp.label_side === "right") { cands.unshift(cands[1]); } if (cp.label_side === "below") { cands.unshift(cands[5]); }
      let best: any = null, bestScore = Infinity;
      for (const [lx, ly] of cands) {
        const b = { x0: lx, x1: lx + w, y0: ly, y1: ly + h };
        let score = 0;
        if (b.x0 < 6 || b.x1 > W - 6 || b.y0 < 6 || b.y1 > H - 6) { score += 1e6; }
        for (const o of [...labelBlockers, ...labels, ...titleBox]) { score += overlap(b, o) * (o.label ? 3 : 1); }
        if (score < bestScore) { bestScore = score; best = b; }
      }
      if (bestScore > w * h * 0.15) { warnings.push(`label '${cp.label}' overlaps other elements (${Math.round(bestScore / (w * h) * 100)}% of its area); adjust 'label_side' or the point position`); }
      best.label = true; best.cx = cx; best.cy = cy; best.txt = txt; best.fs = fs; best.finish = cp.finish; best.color = cp.finish ? t.accent : (t[cp.color] || cp.color || t.primary);
      labels.push(best);
    }
    const labelSvg = labels.map((b) => {
      const ax = Math.min(Math.max(b.cx, b.x0 + 8), b.x1 - 8), ay = b.y1 < b.cy ? b.y1 : b.y0;
      return `<path d="M${PlaneModule.f1(ax)} ${PlaneModule.f1(ay)} L${PlaneModule.f1(b.cx)} ${PlaneModule.f1(b.cy)}" stroke="${t.ink}" stroke-width="1.5" opacity="0.45" stroke-dasharray="3 3"/>`
        + `<rect x="${PlaneModule.f1(b.x0 + 2)}" y="${PlaneModule.f1(b.y0 + 3)}" width="${PlaneModule.f1(b.x1 - b.x0)}" height="${PlaneModule.f1(b.y1 - b.y0)}" rx="${PlaneModule.f1((b.y1 - b.y0) / 2)}" fill="${t.ink}" opacity="0.15"/>`
        + `<rect x="${PlaneModule.f1(b.x0)}" y="${PlaneModule.f1(b.y0)}" width="${PlaneModule.f1(b.x1 - b.x0)}" height="${PlaneModule.f1(b.y1 - b.y0)}" rx="${PlaneModule.f1((b.y1 - b.y0) / 2)}" fill="${t.paper}"/>`
        + `<circle cx="${PlaneModule.f1(b.x0 + (b.y1 - b.y0) / 2)}" cy="${PlaneModule.f1((b.y0 + b.y1) / 2)}" r="${PlaneModule.f1((b.y1 - b.y0) / 2 - 3)}" fill="${b.color}"/>`
        + `<text x="${PlaneModule.f1(b.x0 + (b.y1 - b.y0) / 2)}" y="${PlaneModule.f1((b.y0 + b.y1) / 2 + b.fs * 0.36)}" font-family="${PlaneModule.FONT}" font-weight="700" font-size="${PlaneModule.f1(b.fs)}" fill="${t.paper}" text-anchor="middle">${PlaneModule.esc(b.txt.split("  ")[0])}</text>`
        + `<text x="${PlaneModule.f1(b.x0 + (b.y1 - b.y0) + b.fs * 0.35)}" y="${PlaneModule.f1((b.y0 + b.y1) / 2 + b.fs * 0.36)}" font-family="${PlaneModule.FONT}" font-weight="600" font-size="${PlaneModule.f1(b.fs)}" fill="${t.text === t.paper ? t.ink : t.text}">${PlaneModule.esc(b.txt.split("  ")[1])}</text>`;
    }).join("");

    // ---------- título ----------
    let textSvg = "";
    for (const tx of scene.text || []) {
      const role = tx.role || "title", fs = ({ title: H * 0.06, subtitle: H * 0.03 } as Record<string, any>)[role] || H * 0.035;
      const [vy, hx] = (tx.at || "top-left").split("-"); const m = W * 0.04;
      const anchor = hx === "center" ? "middle" : hx === "right" ? "end" : "start";
      const xx = hx === "center" ? W / 2 : hx === "right" ? W - m : m;
      let yy = vy === "bottom" ? H - m * 0.7 : m + fs * 0.9;
      if (role === "subtitle" && (scene.text || []).some((o: any) => (o.role || "title") === "title" && o.at === tx.at)) { yy += H * 0.06 * 0.9 + fs * 0.8; }
      const color = tx.color ? (t[tx.color] || tx.color) : t.text;
      const estW = tx.content.length * fs * 0.56, x0 = anchor === "start" ? xx : anchor === "end" ? xx - estW : xx - estW / 2;
      let ratio = contrast(color, t.skyTop);
      if (tx.box) { const bf = t[tx.box] || tx.box; ratio = contrast(color, bf); textSvg += `<rect x="${PlaneModule.f1(x0 - fs * 0.45)}" y="${PlaneModule.f1(yy - fs * 1.05)}" width="${PlaneModule.f1(estW + fs * 0.9)}" height="${PlaneModule.f1(fs * 1.45)}" rx="${PlaneModule.f1(fs * 0.35)}" fill="${bf}"/>`; }
      if (ratio < 4.5) { warnings.push(`text "${tx.content}" has contrast ${ratio.toFixed(1)}:1 (min. 4.5)`); }
      const tb = { x0, x1: x0 + estW, y0: yy - fs, y1: yy + fs * 0.25 };
      for (const s of [...groundSprites, ...skySprites]) {
        const sb = s.sky ? { x0: s.sx - s.w / 2, x1: s.sx + s.w / 2, y0: s.sy - s.h, y1: s.sy } : { x0: s.bx0, x1: s.bx1, y0: s.by0, y1: s.by1 };
        const ov = overlap(tb, sb);
        if (ov > 0.08 * estW * fs || ov > 0.15 * (sb.x1 - sb.x0) * (sb.y1 - sb.y0)) { warnings.push(`text "${tx.content}" covers '${s.id}'`); }
      }
      for (const l of labels) { if (overlap(tb, l) > 0) { warnings.push(`text "${tx.content}" covers the label '${l.txt.split("  ")[1]}'`); } }
      textSvg += `<text x="${PlaneModule.f1(xx)}" y="${PlaneModule.f1(yy)}" font-family="${PlaneModule.FONT}" font-size="${PlaneModule.f1(fs)}" font-weight="${role === "title" ? 700 : 500}" fill="${color}" text-anchor="${anchor}">${PlaneModule.esc(tx.content)}</text>`;
    }

    // ---------- verificações ----------
    for (const s of groundSprites) {
      if (s.decor) { continue; }
      if (s.bx0 < -s.w * 0.05 || s.bx1 > W + s.w * 0.05 || s.by0 < -s.h * 0.05) { warnings.push(`'${s.id}' is outside the frame`); }
    }

    const svg = `<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">\n<defs>${defs}</defs>\n${bg}\n`
      + skySprites.map(drawSprite).join("\n") + "\n" + road + "\n" + drawOrdered() + "\n" + labelSvg + "\n" + textSvg + "\n</svg>";
    const description = [
      ...cps.map((cp: any, i: any) => `point ${i + 1} '${cp.id}' (${cp.label || "no label"}): x=${cp.at[0]}, z=${cp.at[1]}, screen=(${Math.round(X(...cp.at) / W * 100)}%, ${Math.round(Y(cp.at[1]) / H * 100)}%)${cp.zone ? ", zone " + cp.zone : ""}`),
      ...groundSprites.filter((s) => !s.decor).map((s) => `${s.id} (${s.asset}): x=${s.x.toFixed(2)}, z=${s.z.toFixed(2)}, ${Math.round(s.h / H * 100)}% of the height`),
      `${groundSprites.filter((s) => s.decor).length} automatic scenery elements (zones and scatter)`,
    ].join("\n");
    return { svg, warnings: [...new Set<string>(warnings)], description };
  }
}
