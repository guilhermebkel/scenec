// Diretor de arte: renderiza a cena em baixa resolução e devolve críticas de composição em texto,
// cada uma com uma sugestão concreta de correção. Roda em CPU (resvg), sem modelo.
import { Resvg } from "@resvg/resvg-js";
export class CriticService {
  private static readonly R = 320;

  // largura da renderização de análise

  private static srgbToLin(v: any) { v /= 255; return v <= 0.04045 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4; }

  private static readonly LUT = Float32Array.from({ length: 256 }, (_, i) => CriticService.srgbToLin(i));

  private static oklab(r: any, g: any, b: any) {
    const lr = CriticService.LUT[r], lg = CriticService.LUT[g], lb = CriticService.LUT[b];
    const l = Math.cbrt(0.4122214708 * lr + 0.5363325363 * lg + 0.0514459929 * lb);
    const m = Math.cbrt(0.2119034982 * lr + 0.6806995451 * lg + 0.1073969566 * lb);
    const s = Math.cbrt(0.0883024619 * lr + 0.2817188376 * lg + 0.6299787005 * lb);
    return [0.2104542553 * l + 0.793617785 * m - 0.0040720468 * s, 1.9779984951 * l - 2.428592205 * m + 0.4505937099 * s, 0.0259040371 * l + 0.7827717662 * m - 0.808675766 * s];
  }

  private static readonly hex = (r: any, g: any, b: any) => "#" + [r, g, b].map((v) => Math.round(v).toString(16).padStart(2, "0")).join("").toUpperCase();

  private static readonly hexToRgb = (h: any) => [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16));

  static critique({ W, H, head, bg, scene, objects, theme, scale, textRects, skip = [] }: any): string[] {
    const f = CriticService.R / W, Rw = CriticService.R, Rh = Math.max(1, Math.round(H * f));
    const render = (inner: any) => {
      const img = new Resvg(`${head}${inner}</svg>`, { fitTo: { mode: "width", value: CriticService.R }, font: { loadSystemFonts: false } }).render();
      return img.pixels;
    };
    const defs = (bg.match(/<defs>[\s\S]*?<\/defs>/) || [""])[0];
    const N = Rw * Rh;
    const full = render(scene), back = render(bg);
    const lab = (px: any) => { const L = new Float32Array(N * 3); for (let i = 0; i < N; i++) { const o = CriticService.oklab(px[i * 4], px[i * 4 + 1], px[i * 4 + 2]); L[i * 3] = o[0]; L[i * 3 + 1] = o[1]; L[i * 3 + 2] = o[2]; } return L; };
    const FL = lab(full), BL = lab(back);
    const dE = (A: any, i: any, B: any, j: any) => Math.hypot(A[i * 3] - B[j * 3], A[i * 3 + 1] - B[j * 3 + 1], A[i * 3 + 2] - B[j * 3 + 2]);

    const objs = objects.filter((o: any) => !o.ignore).sort((a: any, b: any) => a.z - b.z);
    for (const o of objs) {
      const px = render(defs + o.body);
      o.alpha = new Uint8Array(N);
      let n = 0, x0 = Rw, x1 = -1, y0 = Rh, y1 = -1;
      for (let i = 0; i < N; i++) {
        const a = px[i * 4 + 3]; o.alpha[i] = a;
        if (a > 128) { n++; const x = i % Rw, y = (i / Rw) | 0; if (x < x0) x0 = x; if (x > x1) x1 = x; if (y < y0) y0 = y; if (y > y1) y1 = y; }
      }
      o.area = n; o.bb = [x0, y0, x1, y1];
    }
    // dono visível de cada pixel (objeto mais à frente)
    const owner = new Int16Array(N).fill(-1);
    objs.forEach((o: any, k: any) => { for (let i = 0; i < N; i++) if (o.alpha[i] > 128) owner[i] = k; });

    const out: any[] = [];
    const pct = (v: any) => Math.round(v * 100) + "%";

    // 1) ocupação e faixas vazias
    const occ = new Uint8Array(N);
    let objCov = 0;
    for (let i = 0; i < N; i++) if (owner[i] >= 0) { occ[i] = 1; if (objs[owner[i]].kind !== "sky") objCov++; }
    for (const r of textRects) {
      for (let y = Math.max(0, Math.floor(r.y0 * f)); y < Math.min(Rh, Math.ceil(r.y1 * f)); y++)
        for (let x = Math.max(0, Math.floor(r.x0 * f)); x < Math.min(Rw, Math.ceil(r.x1 * f)); x++) occ[y * Rw + x] = 1;
    }
    objCov /= N;
    if (objCov < 0.05 && objs.length) {
      const sug = Math.min(2.5, scale * Math.sqrt(0.08 / Math.max(objCov, 0.01)));
      out.push(`cena vazia: os objetos ocupam só ${pct(objCov)} do quadro; aproxime a câmera (canvas.scale ≈ ${sug.toFixed(2)}) ou use objetos maiores`);
    }
    let run = 0, best = 0, bestEnd = 0;
    for (let y = 0; y < Rh; y++) {
      let c = 0; for (let x = 0; x < Rw; x++) c += occ[y * Rw + x];
      if (c < Rw * 0.02) { run++; if (run > best) { best = run; bestEnd = y; } } else run = 0;
    }
    if (best > Rh * 0.3) {
      const a = (bestEnd - best + 1) / Rh, b = (bestEnd + 1) / Rh;
      out.push(`faixa vazia de ${pct(best / Rh)} da altura (de y=${pct(a)} a y=${pct(b)}); suba o grupo principal, aumente a escala ou ocupe a faixa (texto, objeto de parede, elemento de céu)`);
    }

    // 2) equilíbrio de peso visual (o que difere do fundo, ponderado pela diferença de cor)
    let sw = 0, sx = 0;
    const perObj = objs.map(() => 0);
    for (let i = 0; i < N; i++) {
      const w = Math.min(0.3, dE(FL, i, BL, i));
      if (w < 0.02) continue;
      sw += w; sx += w * (i % Rw);
      if (owner[i] >= 0) perObj[owner[i]] += w;
    }
    for (const r of textRects) { const a = (r.x1 - r.x0) * (r.y1 - r.y0) * f * f * (r.box ? 0.25 : 0.12); sw += a; sx += a * ((r.x0 + r.x1) / 2) * f; }
    if (sw > 0) {
      const cx = sx / sw / Rw;
      if (Math.abs(cx - 0.5) > 0.15) {
        const left = cx < 0.5;
        const side = objs.map((o: any, k: any) => ({ o, w: perObj[k] })).filter(({ o }: any) => left ? (o.bb[0] + o.bb[2]) / 2 < Rw / 2 : (o.bb[0] + o.bb[2]) / 2 > Rw / 2).sort((a: any, b: any) => b.w - a.w)[0];
        out.push(`peso visual pende para a ${left ? "esquerda" : "direita"} (centro de massa em ${pct(cx)} da largura); ` +
          (side ? `aproxime '${side.o.id}' do centro ou ` : "") + `ponha algo do lado ${left ? "direito" : "esquerdo"}`);
      }
    }

    // 3) silhueta que se perde no vizinho ou no fundo
    const tokens = Object.entries(theme).filter(([, v]) => typeof v === "string" && /^#[0-9a-f]{6}$/i.test(v));
    const tokenOf = (rgb: any) => {
      let bestT = null, bd = 0.03; const a = CriticService.oklab(rgb[0], rgb[1], rgb[2]);
      for (const [k, v] of tokens) { const b = CriticService.oklab(...(CriticService.hexToRgb(v) as [number, number, number])); const d = Math.hypot(a[0] - b[0], a[1] - b[1], a[2] - b[2]); if (d < bd) { bd = d; bestT = k; } }
      return bestT;
    };
    const OFF = [[2, 0], [-2, 0], [0, 2], [0, -2]];
    if (!skip.includes("silhouette")) objs.forEach((o: any, k: any) => {
      if (o.area < 40 || ["sky", "floor"].includes(o.kind)) return;
      // contagem por terço vertical do objeto: uma parte inteira sumindo (ex.: pernas no sofá) já é problema
      const T = [0, 0, 0], Lz = [0, 0, 0], NB: Record<string, number>[] = [{}, {}, {}], RGB = [[0, 0, 0], [0, 0, 0], [0, 0, 0]];
      const hh = Math.max(1, o.bb[3] - o.bb[1] + 1);
      for (let y = 2; y < Rh - 2; y++) for (let x = 2; x < Rw - 2; x++) {
        const i = y * Rw + x;
        if (owner[i] !== k) continue;
        for (const [dx, dy] of OFF) {
          const j = (y + dy) * Rw + x + dx;
          if (o.alpha[j] > 25) continue;
          const ob = owner[j];
          if (ob > k) continue; // o vizinho está na frente: não é borda visível deste objeto
          const t3 = Math.min(2, Math.floor(((y - o.bb[1]) / hh) * 3));
          T[t3]++;
          if (dE(FL, i, FL, j) < 0.06) {
            Lz[t3]++; const key = ob >= 0 ? objs[ob].id : "(fundo)"; NB[t3][key] = (NB[t3][key] || 0) + 1;
            RGB[t3][0] += full[i * 4]; RGB[t3][1] += full[i * 4 + 1]; RGB[t3][2] += full[i * 4 + 2];
          }
          break;
        }
      }
      const total = T[0] + T[1] + T[2], lost = Lz[0] + Lz[1] + Lz[2];
      if (total < 24) return;
      const t3 = [0, 1, 2].sort((a, b) => Lz[b] / Math.max(1, T[b]) - Lz[a] / Math.max(1, T[a]))[0];
      const partFrac = Lz[t3] / Math.max(1, T[t3]);
      if (!((lost / total >= 0.3 && lost >= 12) || (partFrac >= 0.4 && Lz[t3] >= 10))) return;
      const who = Object.entries(NB[t3]).sort((a, b) => b[1] - a[1])[0][0];
      const c = RGB[t3].map((v: any) => v / Lz[t3]), tk = tokenOf(c);
      const part = ["de cima", "do meio", "de baixo"][t3];
      out.push(`'${o.id}' some contra ${who === "(fundo)" ? "o fundo" : `'${who}'`} na parte ${part} (${pct(partFrac)} desse contorno sem contraste): ` +
        `a cor ${CriticService.hex(c[0], c[1], c[2])}${tk ? ` (${tk})` : ""} está próxima demais; mude a cor de um dos dois`);
    });

    // 4) tangências: contornos que quase se tocam sem se sobrepor (criam tensão visual)
    const dil = (a: any) => {
      const m = new Uint8Array(N);
      for (let y = 0; y < Rh; y++) for (let x = 0; x < Rw; x++) if (a[y * Rw + x] > 128)
        for (let dy = -2; dy <= 2; dy++) for (let dx = -2; dx <= 2; dx++) { const yy = y + dy, xx = x + dx; if (yy >= 0 && yy < Rh && xx >= 0 && xx < Rw) m[yy * Rw + xx] = 1; }
      return m;
    };
    const cand = objs.filter((o: any) => o.area >= 30 && o.kind !== "floor");
    for (const o of cand) o.dil = dil(o.alpha);
    for (let a = 0; a < cand.length; a++) for (let b = a + 1; b < cand.length; b++) {
      const A = cand[a], B = cand[b];
      if (A.related.includes(B.id) || B.related.includes(A.id)) continue;
      if (A.bb[2] + 3 < B.bb[0] || B.bb[2] + 3 < A.bb[0] || A.bb[3] + 3 < B.bb[1] || B.bb[3] + 3 < A.bb[1]) continue;
      let near = 0, over = 0;
      for (let i = 0; i < N; i++) { if (B.alpha[i] > 128) { if (A.alpha[i] > 128) over++; else if (A.dil[i]) near++; } }
      if (near >= 4 && over <= Math.max(2, 0.01 * Math.min(A.area, B.area)))
        out.push(`'${A.id}' e '${B.id}' quase se encostam (tangência); afaste-os um pouco ou sobreponha de propósito`);
    }
    for (const o of cand) {
      if (o.kind === "sky" && o.area < 30) continue;
      const [x0, y0, x1] = o.bb;
      const gaps = [["esquerda", x0], ["direita", Rw - 1 - x1], ["topo", y0]];
      for (const [side, g] of gaps) if (g > 0 && g <= 2) out.push(`'${o.id}' encosta na borda (${side}); afaste da borda ou deixe cortar de propósito`);
    }
    return out.map((m) => "arte: " + m);
  }
}
