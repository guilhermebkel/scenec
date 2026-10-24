import { PersonUtil } from "@/drawing/PersonUtil.ts";
import { ColorUtil } from "@/utils/ColorUtil.ts";

// Biblioteca de assets (estilo próprio, flat com segunda tonalidade de luz/sombra).
// Cada asset desenha em unidades (pessoa em pé = 100), com origem no centro da base
// (y negativo = para cima). Metadados: kind (onde pode ficar), w/h (caixa),
// top (altura da superfície de apoio), seat (altura do assento), tags (sinônimos).

export class AssetUtil {
  private static readonly r = (n: any) => Math.round(n * 100) / 100;

  private static readonly rad = (d: any) => (d * Math.PI) / 180;

  private static readonly circle = (cx: any, cy: any, rr: any, fill: any, extra = "") => `<circle cx="${AssetUtil.r(cx)}" cy="${AssetUtil.r(cy)}" r="${AssetUtil.r(rr)}" fill="${fill}" ${extra}/>`;

  private static readonly rect = (x: any, y: any, w: any, h: any, fill: any, rx = 0, extra = "") => `<rect x="${AssetUtil.r(x)}" y="${AssetUtil.r(y)}" width="${AssetUtil.r(w)}" height="${AssetUtil.r(h)}" rx="${rx}" fill="${fill}" ${extra}/>`;

  private static readonly ell = (cx: any, cy: any, rx: any, ry: any, fill: any, extra = "") => `<ellipse cx="${AssetUtil.r(cx)}" cy="${AssetUtil.r(cy)}" rx="${AssetUtil.r(rx)}" ry="${AssetUtil.r(ry)}" fill="${fill}" ${extra}/>`;

  private static readonly shadow = (t: any, rx: any, ry = 3.5) => AssetUtil.ell(0, 0, rx, ry, t.shadow);

  private static readonly col = (t: any, v: any, def: any) => t[v] || v || def;

  static readonly ASSETS: Record<string, any> = {
    person: { kind: "ground", w: 40, h: 108, tags: ["pessoa", "human", "character", "man", "woman", "personagem"], draw: PersonUtil.person },

    // ---------------- exterior ----------------
    house: { kind: "ground", w: 160, h: 175, tags: ["casa", "home"],
      draw: (p: any, t: any) => {
        const body = AssetUtil.col(t, p.color, t.primary), roof = t.secondary;
        return AssetUtil.shadow(t, 88, 5) +
          AssetUtil.rect(40, -150, 16, 32, t.woodDark) + AssetUtil.rect(48, -150, 8, 32, ColorUtil.sh(t.woodDark, -0.2)) + AssetUtil.rect(38, -154, 20, 6, ColorUtil.sh(t.woodDark, -0.1), 1) +
          AssetUtil.rect(-65, -100, 130, 100, body) + AssetUtil.rect(25, -100, 40, 100, ColorUtil.sh(body, -0.12)) +
          `<path d="M-65 -100 L65 -100 L65 -92 L-65 -92 Z" fill="${ColorUtil.sh(body, -0.28)}" opacity="0.6"/>` +
          `<path d="M-80 -95 L0 -170 L80 -95 Z" fill="${roof}"/><path d="M0 -170 L80 -95 L40 -95 Z" fill="${ColorUtil.sh(roof, -0.18)}"/>` +
          `<path d="M-84 -92 L0 -172 L84 -92" stroke="${ColorUtil.sh(roof, -0.3)}" stroke-width="5" fill="none" stroke-linejoin="round" stroke-linecap="round"/>` +
          AssetUtil.rect(-15, -56, 30, 56, t.woodDark, 3) + AssetUtil.rect(2, -56, 13, 56, ColorUtil.sh(t.woodDark, -0.15), 0) + AssetUtil.circle(9, -28, 2, t.accent) + AssetUtil.rect(-19, -2, 38, 3, ColorUtil.sh(body, -0.35)) +
          [[-52, -80], [26, -80]].map(([x, y]) => AssetUtil.rect(x, y, 26, 24, t.glass, 2, `stroke="${t.paper}" stroke-width="3"`) +
            `<path d="M${x + 4} ${y + 18} L${x + 14} ${y + 4}" stroke="${t.paper}" stroke-width="2.5" opacity="0.6"/>` + AssetUtil.rect(x - 3, y + 24, 32, 3, t.paper, 1)).join("") +
          AssetUtil.circle(0, -122, 9, t.glass, `stroke="${t.paper}" stroke-width="3"`);
      } },

    tree: { kind: "ground", w: 115, h: 205, tags: ["árvore", "arvore", "tree_round", "oak"],
      draw: (p: any, t: any) => {
        const [a, b, c] = t.foliage;
        return AssetUtil.shadow(t, 46, 4.5) +
          `<path d="M-8 0 L-5 -95 L5 -95 L8 0 Z" fill="${t.trunk}"/><path d="M1 0 L1.5 -95 L5 -95 L8 0 Z" fill="${ColorUtil.sh(t.trunk, -0.2)}"/>` +
          `<path d="M0 -80 L-22 -110 M0 -95 L20 -120" stroke="${t.trunk}" stroke-width="5" stroke-linecap="round"/>` +
          AssetUtil.circle(-28, -125, 32, c) + AssetUtil.circle(28, -122, 30, ColorUtil.sh(c, -0.1)) + AssetUtil.circle(0, -155, 42, a) +
          `<path d="M0 -113 A42 42 0 0 0 42 -155 A42 42 0 0 1 10 -114 Z" fill="${ColorUtil.sh(a, -0.12)}"/>` +
          AssetUtil.circle(-25, -138, 26, b, "opacity=\"0.9\"") + AssetUtil.circle(-16, -172, 12, ColorUtil.sh(b, 0.18), "opacity=\"0.7\"") + AssetUtil.circle(22, -165, 18, b, "opacity=\"0.8\"");
      } },

    pine: { kind: "ground", w: 80, h: 200, tags: ["pinheiro", "pine_tree", "conifer"],
      draw: (p: any, t: any) => {
        let [a, , c] = t.foliage; if (p.color) { a = AssetUtil.col(t, p.color, a); c = ColorUtil.sh(a, -0.12); }
        const tri = (y0: any, y1: any, hw: any, colr: any) => `<path d="M${-hw} ${y0} L0 ${y1} L${hw} ${y0} Z" fill="${colr}"/><path d="M0 ${y1} L${hw} ${y0} L0 ${y0} Z" fill="${ColorUtil.sh(colr, -0.15)}"/>`;
        return AssetUtil.shadow(t, 32, 3.5) + AssetUtil.rect(-6, -30, 12, 30, t.trunk) + AssetUtil.rect(0, -30, 6, 30, ColorUtil.sh(t.trunk, -0.2)) +
          tri(-30, -95, 40, c) + tri(-80, -145, 33, a) + tri(-128, -195, 25, c);
      } },

    palm: { kind: "ground", w: 200, h: 262, tags: ["palmeira", "coqueiro", "palm_tree"],
      draw: (p: any, t: any) => {
        const [a, b] = t.foliage;
        const leaf = (ang: any, len: any, colr: any) => {
          const x = Math.cos(AssetUtil.rad(ang)) * len, y = -Math.sin(AssetUtil.rad(ang)) * len;
          return `<path d="M30 -200 Q${AssetUtil.r(30 + x * 0.5)} ${AssetUtil.r(-200 + y * 0.5 - 25)} ${AssetUtil.r(30 + x)} ${AssetUtil.r(-200 + y)} Q${AssetUtil.r(30 + x * 0.45)} ${AssetUtil.r(-200 + y * 0.45 - 4)} 30 -200 Z" fill="${colr}"/>` +
            `<path d="M30 -200 Q${AssetUtil.r(30 + x * 0.5)} ${AssetUtil.r(-200 + y * 0.5 - 18)} ${AssetUtil.r(30 + x)} ${AssetUtil.r(-200 + y)}" stroke="${ColorUtil.sh(colr, -0.2)}" stroke-width="1.5" fill="none"/>`;
        };
        let trunk = `<path d="M-8 0 Q-6 -110 26 -200 L34 -198 Q6 -110 8 0 Z" fill="${t.trunk}"/>`;
        for (let i = 1; i < 9; i++) { const y = -i * 22, x = -7 + (i / 9) ** 2 * 33; trunk += `<path d="M${AssetUtil.r(x - 1)} ${y} l9 -3" stroke="${ColorUtil.sh(t.trunk, -0.22)}" stroke-width="2" stroke-linecap="round"/>`; }
        return AssetUtil.shadow(t, 40, 4.5) + trunk + [15, 40, 140, 165, 195, -15].map((g, i) => leaf(g, 70, i % 2 ? a : b)).join("") +
          leaf(90, 55, a) + AssetUtil.circle(26, -194, 6, t.woodDark) + AssetUtil.circle(35, -192, 6, ColorUtil.sh(t.woodDark, -0.15));
      } },

    bush: { kind: "ground", w: 74, h: 44, tags: ["arbusto", "shrub"],
      draw: (p: any, t: any) => {
        const [a, b, c] = t.foliage; return AssetUtil.shadow(t, 36, 3) + AssetUtil.circle(-20, -14, 15, c) + AssetUtil.circle(20, -14, 15, ColorUtil.sh(c, -0.1)) + AssetUtil.circle(0, -24, 21, a) +
        `<path d="M0 -3 A21 21 0 0 0 21 -24 A21 21 0 0 1 6 -5 Z" fill="${ColorUtil.sh(a, -0.12)}"/>` + AssetUtil.circle(-9, -12, 12, b) + AssetUtil.circle(10, -11, 12, ColorUtil.sh(b, -0.08)) + AssetUtil.circle(-6, -34, 6, ColorUtil.sh(a, 0.2), "opacity=\"0.6\"");
      } },

    flowers: { kind: "ground", w: 50, h: 30, tags: ["flores", "canteiro", "flower_bed"],
      draw: (p: any, t: any) => {
        const [a, b] = t.foliage; let s = AssetUtil.shadow(t, 24, 2.5);
        [[-16, -16, t.primary], [-4, -24, t.accent], [9, -18, t.paper], [19, -12, t.primary], [-20, -8, t.accent]].forEach(([x, y, c]) => {
          s += `<path d="M${x} 0 Q${x + 1} ${y / 2} ${x} ${y}" stroke="${b}" stroke-width="2" fill="none"/>` + [0, 72, 144, 216, 288].map((g) => AssetUtil.circle(x + Math.cos(AssetUtil.rad(g)) * 3, y + Math.sin(AssetUtil.rad(g)) * 3, 2.6, c)).join("") + AssetUtil.circle(x, y, 1.8, t.accent === c ? t.paper : t.accent);
        });
        return s + AssetUtil.ell(0, -2, 24, 4, a);
      } },

    fence: { kind: "ground", w: 160, h: 40, tags: ["cerca"],
      draw: (p: any, t: any) => {
        let s = AssetUtil.rect(-80, -30, 160, 5, t.paper) + AssetUtil.rect(-80, -15, 160, 5, t.paper) + AssetUtil.rect(-80, -25, 160, 2, ColorUtil.sh(t.paper, -0.15)) + AssetUtil.rect(-80, -10, 160, 2, ColorUtil.sh(t.paper, -0.15));
        for (let x = -76; x <= 70; x += 18) s += `<path d="M${x} 0 L${x} -34 L${x + 5} -40 L${x + 10} -34 L${x + 10} 0 Z" fill="${t.paper}"/><path d="M${x + 6} 0 L${x + 6} -38 L${x + 10} -34 L${x + 10} 0 Z" fill="${ColorUtil.sh(t.paper, -0.12)}"/>`;
        return s;
      } },

    building: { kind: "ground", w: 90, h: 300, tags: ["prédio", "predio", "tower", "skyscraper"],
      size: (p: any) => ({ w: p.width || 90, h: p.floors ? p.floors * 30 + 26 : 306 }),
      draw: (p: any, t: any) => {
        const h = p.floors ? p.floors * 30 + 20 : 300, w = p.width || 90, c = AssetUtil.col(t, p.color, t.secondary);
        let s = AssetUtil.rect(-w / 2, -h, w, h, c) + AssetUtil.rect(w / 2 - w * 0.28, -h, w * 0.28, h, ColorUtil.sh(c, -0.18)) + AssetUtil.rect(-w / 2 - 4, -h - 6, w + 8, 8, ColorUtil.sh(c, -0.35));
        let i = 0;
        for (let y = -h + 20; y < -25; y += 30) for (let x = -w / 2 + 12; x < w / 2 - 14; x += 22) {
          const lit = ((i++ * 7 + Math.floor(w) + (p.seed || 0)) % 5) < 2;
          s += AssetUtil.rect(x, y, 12, 16, lit ? t.glass : ColorUtil.sh(c, -0.35), 1) + (lit ? AssetUtil.rect(x, y + 12, 12, 4, ColorUtil.sh(t.glass, -0.12)) : "");
        }
        return s + AssetUtil.rect(-10, -24, 20, 24, ColorUtil.sh(c, -0.4), 2);
      } },

    mountain: { kind: "ground", w: 320, h: 200, tags: ["montanha", "hill", "serra"],
      draw: (p: any, t: any) => `<path d="M-160 0 L-40 -200 L40 -80 L80 -130 L160 0 Z" fill="${t.secondary}" opacity="0.6"/>` +
        `<path d="M-40 -200 L40 -80 L10 0 L-20 0 Z" fill="${ColorUtil.sh(t.secondary, -0.2)}" opacity="0.45"/><path d="M80 -130 L160 0 L110 0 Z" fill="${ColorUtil.sh(t.secondary, -0.2)}" opacity="0.45"/>` +
        `<path d="M-40 -200 L-62 -163 L-48 -170 L-36 -158 L-22 -170 Z" fill="${t.paper}" opacity="0.9"/>` },

    sun: { kind: "sky", w: 90, h: 90, tags: ["sol"],
      draw: (p: any, t: any) => {
        let s = ""; for (let a = 0; a < 360; a += 30) s += `<path d="M${AssetUtil.r(Math.cos(AssetUtil.rad(a)) * 34)} ${AssetUtil.r(-45 + Math.sin(AssetUtil.rad(a)) * 34)} L${AssetUtil.r(Math.cos(AssetUtil.rad(a)) * 44)} ${AssetUtil.r(-45 + Math.sin(AssetUtil.rad(a)) * 44)}" stroke="${t.accent}" stroke-width="5" stroke-linecap="round"/>`;
        return AssetUtil.circle(0, -45, 31, t.accent, "opacity=\"0.25\"") + s + AssetUtil.circle(0, -45, 26, t.accent) + `<path d="M-16 -55 A20 20 0 0 1 4 -66" stroke="${ColorUtil.sh(t.accent, 0.45)}" stroke-width="4" fill="none" stroke-linecap="round"/>`;
      } },

    moon: { kind: "sky", w: 60, h: 60, tags: ["lua"],
      draw: (p: any, t: any) => AssetUtil.circle(4, -32, 34, t.primary, "opacity=\"0.12\"") + `<path d="M10 -58 A28 28 0 1 0 22 -10 A22 22 0 1 1 10 -58 Z" fill="${t.primary}"/>` +
        AssetUtil.circle(-6, -28, 3, t.ink, "opacity=\"0.12\"") + AssetUtil.circle(4, -16, 2, t.ink, "opacity=\"0.12\"") },

    cloud: { kind: "sky", w: 110, h: 50, tags: ["nuvem"],
      draw: (p: any, t: any) => `<g fill="${t.paper}" opacity="0.94"><circle cx="-28" cy="-15" r="15"/><circle cx="0" cy="-26" r="22"/><circle cx="28" cy="-15" r="15"/><rect x="-43" y="-15" width="86" height="15" rx="7"/></g>` +
        `<path d="M-43 -8 Q-43 0 -36 0 L36 0 Q43 0 43 -8 Z" fill="${ColorUtil.sh(t.paper, -0.08)}" opacity="0.9"/>` },

    bird: { kind: "sky", w: 20, h: 10, tags: ["pássaro", "passaro", "gaivota", "birds"],
      draw: (p: any, t: any) => `<path d="M-10 -6 Q-5 -11 0 -5 Q5 -11 10 -6" stroke="${t.ink}" stroke-width="1.8" fill="none" stroke-linecap="round" opacity="0.75"/>` },

    star: { kind: "sky", w: 14, h: 14, tags: ["estrela"],
      draw: (p: any, t: any) => `<path d="M0 -14 Q1 -8 7 -7 Q1 -6 0 0 Q-1 -6 -7 -7 Q-1 -8 0 -14 Z" fill="${t.paper}" opacity="0.9"/>` },

    stars: { kind: "sky", backdrop: true, w: 600, h: 200, tags: ["céu estrelado", "starfield"],
      draw: (p: any, t: any) => {
        let s = ""; const pts = [[-280, -170], [-210, -60], [-150, -140], [-90, -30], [-30, -180], [40, -90], [110, -160], [170, -40], [230, -130], [290, -190], [-250, -110], [70, -20], [-120, -190], [200, -100]];
        pts.forEach(([x, y], i) => { s += AssetUtil.circle(x, y, i % 3 === 0 ? 2.2 : 1.3, t.paper, `opacity="${0.5 + (i % 4) * 0.12}"`); }); return s;
      } },

    car: { kind: "ground", w: 140, h: 62, tags: ["carro", "automóvel", "automovel", "auto"],
      draw: (p: any, t: any) => {
        const c = AssetUtil.col(t, p.color, t.primary), f = p.facing === "left" ? -1 : 1;
        const wheel = (x: any) => AssetUtil.circle(x, -13, 13, t.ink) + AssetUtil.circle(x, -13, 6, t.metal) + AssetUtil.circle(x, -13, 2.5, ColorUtil.sh(t.metal, -0.3));
        return `<g transform="scale(${f} 1)">` + AssetUtil.shadow(t, 70, 4.5) +
          `<path d="M-68 -16 L-68 -34 Q-66 -40 -56 -42 L-36 -44 L-18 -60 Q-12 -64 0 -64 L28 -64 Q38 -64 44 -56 L56 -44 Q68 -42 70 -34 L70 -16 Z" fill="${c}"/>` +
          `<path d="M-68 -26 L70 -26 L70 -16 L-68 -16 Z" fill="${ColorUtil.sh(c, -0.15)}"/>` +
          `<path d="M-30 -44 L-15 -57 Q-11 -60 -4 -60 L6 -60 L6 -44 Z" fill="${t.glass}"/><path d="M11 -60 L27 -60 Q34 -60 38 -55 L49 -44 L11 -44 Z" fill="${t.glass}"/>` +
          `<path d="M-24 -46 L-14 -56" stroke="${t.paper}" stroke-width="2.5" opacity="0.6"/>` +
          AssetUtil.rect(64, -36, 6, 6, t.accent, 2) + AssetUtil.rect(-68, -36, 5, 6, ColorUtil.sh(t.primary, -0.3), 2) + AssetUtil.rect(-6, -36, 10, 2.5, ColorUtil.sh(c, -0.35), 1) + AssetUtil.rect(26, -36, 10, 2.5, ColorUtil.sh(c, -0.35), 1) +
          wheel(-40) + wheel(42) + `</g>`;
      } },

    bicycle: { kind: "ground", w: 80, h: 48, tags: ["bicicleta", "bike"],
      draw: (p: any, t: any) => {
        const c = AssetUtil.col(t, p.color, t.secondary), f = p.facing === "left" ? -1 : 1;
        const wh = (x: any) => `<circle cx="${x}" cy="-17" r="16" fill="none" stroke="${t.ink}" stroke-width="3.5"/>` + AssetUtil.circle(x, -17, 2.5, t.metal);
        return `<g transform="scale(${f} 1)">` + AssetUtil.shadow(t, 40, 3) + wh(-24) + wh(24) +
          `<path d="M-24 -17 L-6 -17 L10 -38 L-12 -38 Z M-6 -17 L-14 -42 M24 -17 L14 -46" stroke="${c}" stroke-width="3.5" fill="none" stroke-linejoin="round" stroke-linecap="round"/>` +
          `<path d="M-20 -43 L-8 -43" stroke="${t.ink}" stroke-width="4" stroke-linecap="round"/><path d="M10 -47 L19 -48" stroke="${t.ink}" stroke-width="3" stroke-linecap="round"/>` + AssetUtil.circle(-6, -17, 4, t.metal) + `</g>`;
      } },

    dog: { kind: "ground", w: 50, h: 36, tags: ["cachorro", "cão", "cao", "puppy"],
      draw: (p: any, t: any) => {
        const c = AssetUtil.col(t, p.color, t.wood), f = p.facing === "left" ? -1 : 1, d = ColorUtil.sh(c, -0.2);
        return `<g transform="scale(${f} 1)">` + AssetUtil.shadow(t, 24, 3) +
          AssetUtil.rect(-15, -14, 5, 14, d, 2) + AssetUtil.rect(9, -14, 5, 14, d, 2) +
          AssetUtil.ell(-1, -18, 18, 9, c) + `<path d="M-17 -20 Q-26 -30 -22 -34" stroke="${c}" stroke-width="4" fill="none" stroke-linecap="round"/>` +
          AssetUtil.rect(-11, -14, 5, 14, c, 2) + AssetUtil.rect(13, -14, 5, 14, c, 2) +
          AssetUtil.circle(17, -29, 9, c) + AssetUtil.ell(24, -26, 6, 4.5, ColorUtil.sh(c, 0.25)) + AssetUtil.circle(29, -27, 2, t.ink) + AssetUtil.circle(19, -31, 1.4, t.ink) +
          `<path d="M11 -36 Q8 -26 14 -25 Q15 -32 11 -36 Z" fill="${d}"/>` + AssetUtil.rect(11, -22, 10, 3, t.primary, 1.5) + `</g>`;
      } },

    cat: { kind: "ground", w: 36, h: 32, tags: ["gato", "gatinho", "kitten"],
      draw: (p: any, t: any) => {
        const c = AssetUtil.col(t, p.color, t.metal), f = p.facing === "left" ? -1 : 1;
        return `<g transform="scale(${f} 1)">` + AssetUtil.shadow(t, 16, 2.5) +
          `<path d="M-12 -4 Q-24 -8 -20 -22" stroke="${c}" stroke-width="4" fill="none" stroke-linecap="round"/>` +
          `<path d="M-12 0 Q-14 -20 0 -22 Q10 -22 10 0 Z" fill="${c}"/><path d="M2 0 Q4 -16 0 -22 Q10 -22 10 0 Z" fill="${ColorUtil.sh(c, -0.15)}"/>` +
          AssetUtil.circle(4, -26, 8, c) + `<path d="M-2 -30 L-3 -38 L3 -32 Z M6 -32 L11 -38 L11 -30 Z" fill="${c}"/>` +
          AssetUtil.circle(2, -27, 1.3, t.ink) + AssetUtil.circle(8, -27, 1.3, t.ink) + `<path d="M5 -24 L4 -23 M5 -24 L6 -23" stroke="${t.ink}" stroke-width="0.8"/>` + `</g>`;
      } },

    streetlight: { kind: "ground", w: 40, h: 170, tags: ["poste", "lamppost", "street_lamp"],
      draw: (p: any, t: any) => AssetUtil.shadow(t, 10, 2) + `<path d="M0 0 L0 -160 Q0 -170 14 -170" stroke="${t.metal}" stroke-width="5" fill="none"/>` + AssetUtil.rect(8, -174, 20, 8, t.metal, 3) +
        `<path d="M10 -166 L-30 0 L70 0 L26 -166 Z" fill="#FFE39A" opacity="0.12"/>` + AssetUtil.circle(18, -165, 4, "#FFE9A8") },

    bench: { kind: "ground", w: 110, h: 60, seat: 36, tags: ["banco", "park_bench"],
      draw: (p: any, t: any) => AssetUtil.shadow(t, 55, 3) + AssetUtil.rect(-55, -40, 110, 6, t.wood, 2) + AssetUtil.rect(-55, -36, 110, 2, ColorUtil.sh(t.wood, -0.2)) + AssetUtil.rect(-55, -58, 110, 6, t.wood, 2) + AssetUtil.rect(-55, -54, 110, 2, ColorUtil.sh(t.wood, -0.2)) +
        AssetUtil.rect(-48, -34, 5, 34, t.metal) + AssetUtil.rect(43, -34, 5, 34, t.metal) + AssetUtil.rect(-48, -58, 4, 20, t.metal) + AssetUtil.rect(44, -58, 4, 20, t.metal) },

    // ---------------- parede ----------------
    window: { kind: "wall", w: 90, h: 100, elevation: 75, tags: ["janela"],
      draw: (p: any, t: any) => {
        const night = p.view === "night", sky = night ? "#26305E" : t.glass;
        const fr = AssetUtil.col(t, p.frame, t.paper);
        return AssetUtil.rect(-45, -100, 90, 100, fr, 4) + AssetUtil.rect(-39, -94, 78, 88, sky, 2) + AssetUtil.rect(-39, -94, 78, 10, ColorUtil.sh(sky, -0.1)) +
          (night
            ? AssetUtil.circle(18, -72, 8, "#F5E6A8")
            : AssetUtil.circle(-15, -40, 10, t.paper, "opacity=\"0.7\"") + AssetUtil.circle(-4, -46, 13, t.paper, "opacity=\"0.7\"") +
            `<path d="M-30 -20 L-8 -88 M-18 -14 L4 -82" stroke="${t.paper}" stroke-width="4" opacity="0.35"/>`) +
          AssetUtil.rect(-2, -94, 4, 88, fr) + AssetUtil.rect(-39, -52, 78, 4, fr) + AssetUtil.rect(-50, -4, 100, 6, fr, 2) + AssetUtil.rect(-50, 0, 100, 2, ColorUtil.sh(fr, -0.18));
      } },

    frame: { kind: "wall", w: 60, h: 46, elevation: 95, tags: ["quadro", "picture", "painting"],
      draw: (p: any, t: any) => AssetUtil.rect(-29, -44, 60, 46, "rgba(0,0,0,0.08)", 2) + AssetUtil.rect(-30, -46, 60, 46, t.woodDark, 2) + AssetUtil.rect(-25, -41, 50, 36, t.paper) +
        `<path d="M-25 -5 L-8 -26 L2 -15 L10 -24 L25 -5 Z" fill="${t.secondary}"/><path d="M-8 -26 L2 -15 L-4 -5 L-14 -5 Z" fill="${ColorUtil.sh(t.secondary, -0.15)}"/>` + AssetUtil.circle(12, -32, 4, t.accent) },

    clock: { kind: "wall", w: 34, h: 34, elevation: 120, tags: ["relógio", "relogio"],
      draw: (p: any, t: any) => AssetUtil.circle(1, -16, 17, "rgba(0,0,0,0.08)") + AssetUtil.circle(0, -17, 17, t.paper, `stroke="${t.ink}" stroke-width="3"`) +
        [0, 90, 180, 270].map((a) => AssetUtil.circle(Math.cos(AssetUtil.rad(a)) * 11.5, -17 + Math.sin(AssetUtil.rad(a)) * 11.5, 1.2, t.ink)).join("") +
        `<path d="M0 -17 L0 -28 M0 -17 L8 -13" stroke="${t.ink}" stroke-width="2.5" stroke-linecap="round"/>` },

    board: { kind: "wall", w: 170, h: 100, elevation: 60, tags: ["quadro negro", "lousa", "whiteboard", "chalkboard", "chart"],
      draw: (p: any, t: any) => {
        const bg = p.style === "white" ? t.paper : "#2F5446", ln = p.style === "white" ? t.ink : "#EAF2E6";
        const bars = [30, 52, 40, 70].map((v, i) => { const c = [t.primary, t.accent, t.secondary, t.primary][i]; return AssetUtil.rect(-60 + i * 26, -18 - v, 16, v, c, 2) + AssetUtil.rect(-52 + i * 26, -18 - v, 8, v, ColorUtil.sh(c, -0.15), 0); }).join("");
        return AssetUtil.rect(-83, -98, 170, 100, "rgba(0,0,0,0.1)", 4) + AssetUtil.rect(-85, -100, 170, 100, t.woodDark, 4) + AssetUtil.rect(-79, -94, 158, 88, bg, 2) +
          `<path d="M-79 -94 L-40 -94 L-79 -50 Z" fill="${t.paper}" opacity="0.05"/>` + bars +
          `<path d="M-68 -18 L54 -18" stroke="${ln}" stroke-width="2"/><path d="M-62 -55 Q-30 -60 -10 -75 T50 -92" stroke="${ln}" stroke-width="2.5" fill="none" stroke-dasharray="5 4"/>` +
          AssetUtil.rect(-40, -2, 80, 5, t.woodDark, 2) + AssetUtil.rect(-30, -5, 8, 3, t.paper, 1);
      } },

    shelf_wall: { kind: "wall", w: 90, h: 34, elevation: 100, tags: ["prateleira", "wall_shelf"],
      draw: (p: any, t: any) => AssetUtil.rect(-45, -6, 90, 6, t.wood, 1) + AssetUtil.rect(-45, 0, 90, 2, ColorUtil.sh(t.wood, -0.25)) + AssetUtil.rect(-38, -26, 7, 20, t.primary, 1) + AssetUtil.rect(-30, -24, 6, 18, t.secondary, 1) +
        AssetUtil.rect(-23, -27, 7, 21, t.accent, 1) + `<path d="M8 -6 L12 -18 L22 -18 L26 -6 Z" fill="${t.primary}"/>` + `<path d="M17 -18 Q10 -30 14 -36 Q18 -28 17 -18 Z M17 -18 Q24 -28 22 -34 Q16 -28 17 -18 Z" fill="${t.foliage[0]}"/>` },

    // ---------------- móveis ----------------
    bookshelf: { kind: "ground", w: 80, h: 170, tags: ["estante", "shelf", "books"],
      draw: (p: any, t: any) => {
        let s = AssetUtil.shadow(t, 44, 3) + AssetUtil.rect(-40, -170, 80, 170, t.woodDark, 2) + AssetUtil.rect(-35, -165, 70, 160, ColorUtil.sh(t.wood, -0.1));
        const cols = [t.primary, t.secondary, t.accent, t.paper, t.primary, t.secondary];
        for (let row = 0; row < 4; row++) {
          const base = -10 - row * 40; let x = -33, k = row;
          s += AssetUtil.rect(-35, base - 36, 70, 6, "rgba(0,0,0,0.12)");
          while (x < 26) { const w = 6 + ((k * 5) % 5), h = 22 + ((k * 7) % 9), c = cols[k % cols.length]; s += AssetUtil.rect(x, base - h, w, h, c, 1) + AssetUtil.rect(x + w * 0.6, base - h, w * 0.4, h, ColorUtil.sh(c, -0.15)) + AssetUtil.rect(x, base - h + 4, w, 1.5, ColorUtil.sh(c, -0.3)); x += w + 1; k++; }
          s += AssetUtil.rect(-35, base, 70, 5, t.woodDark);
        }
        return s + AssetUtil.rect(26, -170, 14, 170, ColorUtil.sh(t.woodDark, -0.15));
      } },

    desk: { kind: "ground", w: 130, h: 46, top: 46, tags: ["mesa de trabalho", "escrivaninha", "table_desk"],
      draw: (p: any, t: any) => AssetUtil.shadow(t, 68, 3.5) + AssetUtil.rect(-58, -40, 6, 40, t.woodDark) + AssetUtil.rect(52, -40, 6, 40, t.woodDark) +
        AssetUtil.rect(18, -40, 32, 22, t.woodDark, 2) + AssetUtil.rect(18, -40, 32, 4, ColorUtil.sh(t.woodDark, -0.2)) + AssetUtil.rect(30, -32, 8, 2.5, t.accent, 1) +
        AssetUtil.rect(-65, -46, 130, 7, t.wood, 2) + AssetUtil.rect(-65, -41, 130, 2, ColorUtil.sh(t.wood, -0.22)) + AssetUtil.rect(-63, -46, 126, 1.5, ColorUtil.sh(t.wood, 0.2)) },

    table: { kind: "ground", w: 80, h: 46, top: 46, tags: ["mesa", "mesa redonda", "cafe_table", "dining_table"],
      draw: (p: any, t: any) => {
        const w = p.width || 80; return AssetUtil.shadow(t, w / 2, 3.5) + AssetUtil.rect(-3.5, -40, 7, 37, t.metal) + AssetUtil.rect(0, -40, 3.5, 37, ColorUtil.sh(t.metal, -0.2)) +
        `<path d="M-20 0 Q0 -8 20 0 Z" fill="${t.metal}"/>` + AssetUtil.rect(-w / 2, -46, w, 6, t.wood, 3) + AssetUtil.rect(-w / 2, -42, w, 2, ColorUtil.sh(t.wood, -0.22));
      },
      size: (p: any) => ({ w: p.width || 80, h: 46 }) },

    counter: { kind: "ground", w: 220, h: 62, top: 62, tags: ["balcão", "balcao", "bar", "kitchen_counter"],
      draw: (p: any, t: any) => AssetUtil.shadow(t, 112, 4) + AssetUtil.rect(-104, -54, 208, 54, t.wood) + AssetUtil.rect(-104, -54, 208, 6, ColorUtil.sh(t.wood, -0.22)) +
        [-70, 0, 70].map((x) => AssetUtil.rect(x - 28, -44, 56, 38, ColorUtil.sh(t.wood, -0.12), 3) + AssetUtil.rect(x - 8, -40, 16, 2.5, t.metal, 1)).join("") +
        AssetUtil.rect(-110, -62, 220, 8, t.woodDark, 2) + AssetUtil.rect(-108, -62, 216, 1.5, ColorUtil.sh(t.woodDark, 0.25)) },

    chair: { kind: "ground", w: 44, h: 88, seat: 45, tags: ["cadeira", "seat"],
      draw: (p: any, t: any) => {
        const f = p.facing === "left" ? -1 : 1, c = AssetUtil.col(t, p.color, t.secondary);
        return AssetUtil.shadow(t, 24, 3) + AssetUtil.rect(-16, -40, 4, 40, t.metal) + AssetUtil.rect(12, -40, 4, 40, ColorUtil.sh(t.metal, -0.2)) +
          AssetUtil.rect(-f * 18 - (f > 0 ? 0 : 6), -88, 6, 49, c, 3) + AssetUtil.rect(-18, -45, 36, 6, c, 2) + AssetUtil.rect(-18, -41, 36, 2, ColorUtil.sh(c, -0.25));
      } },

    sofa: { kind: "ground", w: 170, h: 72, seat: 36, tags: ["sofá", "sofa", "couch"],
      draw: (p: any, t: any) => {
        const c = AssetUtil.col(t, p.color, t.secondary), d = ColorUtil.sh(c, -0.15);
        return AssetUtil.shadow(t, 86, 4.5) + AssetUtil.rect(-70, -8, 6, 8, t.woodDark) + AssetUtil.rect(64, -8, 6, 8, t.woodDark) +
          AssetUtil.rect(-75, -72, 150, 42, d, 14) + AssetUtil.rect(-68, -68, 66, 34, c, 10) + AssetUtil.rect(2, -68, 66, 34, c, 10) +
          AssetUtil.rect(-80, -40, 160, 32, c, 8) + AssetUtil.rect(-80, -18, 160, 10, d, 6) +
          AssetUtil.rect(-86, -56, 20, 50, d, 9) + AssetUtil.rect(66, -56, 20, 50, d, 9) + AssetUtil.rect(-86, -56, 20, 8, ColorUtil.sh(c, 0.1), 6) + AssetUtil.rect(66, -56, 20, 8, ColorUtil.sh(c, 0.1), 6) +
          AssetUtil.rect(-60, -62, 28, 24, t.accent, 6, "transform=\"rotate(-8 -46 -50)\"") + AssetUtil.rect(-50, -40, 100, 2, ColorUtil.sh(c, -0.3));
      } },

    bed: { kind: "ground", w: 180, h: 70, top: 38, seat: 38, tags: ["cama", "bed"],
      draw: (p: any, t: any) => {
        const c = AssetUtil.col(t, p.color, t.primary);
        return AssetUtil.shadow(t, 90, 4) + AssetUtil.rect(-90, -70, 10, 70, t.woodDark, 3) + AssetUtil.rect(80, -46, 10, 46, t.woodDark, 3) +
          AssetUtil.rect(-82, -34, 166, 22, t.paper, 4) + AssetUtil.rect(-82, -16, 166, 6, ColorUtil.sh(t.paper, -0.12)) + AssetUtil.rect(-76, -46, 40, 14, t.paper, 7) + AssetUtil.rect(-76, -38, 40, 6, ColorUtil.sh(t.paper, -0.1), 3) +
          `<path d="M-30 -40 Q20 -44 84 -38 L84 -14 L-34 -14 Z" fill="${c}"/><path d="M-30 -22 L84 -22 L84 -14 L-34 -14 Z" fill="${ColorUtil.sh(c, -0.15)}"/>` + AssetUtil.rect(-84, -10, 168, 4, t.woodDark, 1);
      } },

    tv: { kind: "any", w: 90, h: 58, tags: ["tv", "televisão", "televisao", "television"],
      draw: (p: any, t: any) => AssetUtil.rect(-10, -6, 20, 6, t.ink, 2) + AssetUtil.rect(-3, -10, 6, 5, t.ink) + AssetUtil.rect(-45, -58, 90, 50, t.ink, 4) + AssetUtil.rect(-41, -54, 82, 42, ColorUtil.sh(t.glass, -0.35), 2) +
        `<path d="M-41 -54 L-10 -54 L-41 -20 Z" fill="${t.paper}" opacity="0.12"/>` + AssetUtil.circle(14, -36, 9, t.accent, "opacity=\"0.8\"") + `<path d="M-41 -12 L-20 -30 L-5 -18 L10 -28 L41 -12 Z" fill="${t.secondary}" opacity="0.8"/>` },

    tv_stand: { kind: "ground", w: 120, h: 40, top: 40, tags: ["rack", "móvel de tv", "tv_cabinet"],
      draw: (p: any, t: any) => AssetUtil.shadow(t, 60, 3) + AssetUtil.rect(-60, -40, 120, 36, t.wood, 3) + AssetUtil.rect(-60, -40, 120, 4, ColorUtil.sh(t.wood, 0.15), 2) + AssetUtil.rect(-54, -32, 52, 24, ColorUtil.sh(t.wood, -0.12), 2) + AssetUtil.rect(2, -32, 52, 24, ColorUtil.sh(t.wood, -0.12), 2) +
        AssetUtil.rect(-30, -22, 10, 2.5, t.metal, 1) + AssetUtil.rect(22, -22, 10, 2.5, t.metal, 1) + AssetUtil.rect(-56, -4, 6, 4, t.woodDark) + AssetUtil.rect(50, -4, 6, 4, t.woodDark) },

    floor_lamp: { kind: "ground", w: 40, h: 150, tags: ["abajur de chão", "luminária de chão", "luminaria de chao", "floor lamp"],
      draw: (p: any, t: any) => AssetUtil.shadow(t, 14, 2.5) + AssetUtil.ell(0, -2, 13, 3, t.ink) + AssetUtil.rect(-1.5, -125, 3, 123, t.ink) +
        `<path d="M-16 -122 L-11 -150 L11 -150 L16 -122 Z" fill="${t.accent}"/><path d="M2 -150 L11 -150 L16 -122 L4 -122 Z" fill="${ColorUtil.sh(t.accent, -0.15)}"/>` +
        `<path d="M-16 -122 L-40 -20 L40 -20 L16 -122 Z" fill="#FFE9A8" opacity="0.12"/>` },

    rug: { kind: "floor", w: 180, h: 14, tags: ["tapete", "carpet"],
      draw: (p: any, t: any) => { const c = AssetUtil.col(t, p.color, t.secondary); return AssetUtil.ell(0, -2, 90, 10, c, "opacity=\"0.22\"") + AssetUtil.ell(0, -2, 76, 7, "none", `stroke="${c}" stroke-width="2" opacity="0.35" stroke-dasharray="6 5"`); } },

    pendant_lamp: { kind: "ceiling", w: 40, h: 30, tags: ["luminária pendente", "hanging_lamp"],
      draw: (p: any, t: any) => `<path d="M-20 -2 Q-20 -26 0 -26 Q20 -26 20 -2 Z" fill="${t.accent}"/><path d="M4 -26 Q20 -26 20 -2 L8 -2 Z" fill="${ColorUtil.sh(t.accent, -0.15)}"/>` + AssetUtil.circle(0, -1, 5, "#FFF3C4") +
        `<path d="M-18 0 L-50 70 L50 70 L18 0 Z" fill="#FFE9A8" opacity="0.13"/>` },

    // ---------------- objetos de superfície ----------------
    laptop: { kind: "surface", w: 34, h: 24, tags: ["notebook", "computador", "computer"],
      draw: (p: any, t: any) => {
        const f = p.facing === "left" ? -1 : 1;
        return AssetUtil.rect(-17, -3, 34, 3, t.metal, 1.5) + AssetUtil.rect(-17, -1.5, 34, 1.5, ColorUtil.sh(t.metal, -0.25)) +
          `<path d="M${-f * 15} -3 L${-f * 19} -25" stroke="${t.ink}" stroke-width="3.5" stroke-linecap="round"/><path d="M${-f * 13} -5 L${-f * 16.5} -23" stroke="${t.glass}" stroke-width="1.6" stroke-linecap="round" opacity="0.9"/>`;
      } },

    monitor: { kind: "surface", w: 50, h: 46, tags: ["tela", "screen", "display"],
      draw: (p: any, t: any) => p.off
        ? AssetUtil.rect(-3, -14, 6, 14, t.ink) + AssetUtil.rect(-12, -2.5, 24, 2.5, t.ink, 1) + AssetUtil.rect(-25, -46, 50, 33, t.ink, 2) + AssetUtil.rect(-24, -45, 48, 30, ColorUtil.sh(t.ink, 0.12), 1) + `<path d="M-24 -45 L-6 -45 L-24 -25 Z" fill="#FFFFFF" opacity="0.06"/>` :
        AssetUtil.rect(-4, -14, 8, 14, t.metal) + AssetUtil.rect(-14, -3, 28, 3, t.metal, 1.5) + AssetUtil.rect(-25, -46, 50, 33, t.ink, 3) + AssetUtil.rect(-21, -42, 42, 25, t.glass, 1) +
        AssetUtil.rect(-17, -38, 18, 3, t.primary, 1) + AssetUtil.rect(-17, -32, 28, 2.5, t.paper, 1, "opacity=\"0.8\"") + AssetUtil.rect(-17, -27, 22, 2.5, t.paper, 1, "opacity=\"0.8\"") },

    lamp: { kind: "surface", w: 30, h: 42, tags: ["luminária", "luminaria", "desk_lamp"],
      draw: (p: any, t: any) => AssetUtil.rect(-10, -3, 20, 3, t.ink, 1.5) + `<path d="M-2 -3 L-8 -26 L8 -36" stroke="${t.ink}" stroke-width="2.5" fill="none" stroke-linejoin="round"/>` +
        `<path d="M2 -42 L18 -30 L10 -24 Z" fill="${t.accent}"/><path d="M10 -36 L18 -30 L10 -24 Z" fill="${ColorUtil.sh(t.accent, -0.15)}"/>` + `<path d="M14 -27 L26 -2 L-2 -2 Z" fill="${t.accent}" opacity="0.13"/>` },

    plant: { kind: "any", w: 36, h: 46, tags: ["planta", "vaso", "plant_pot"],
      draw: (p: any, t: any) => {
        const [a, b] = t.foliage;
        return `<path d="M0 -16 Q-18 -30 -14 -46 Q-4 -32 0 -16 Z" fill="${a}"/><path d="M0 -16 Q16 -28 15 -42 Q3 -32 0 -16 Z" fill="${b}"/><path d="M0 -16 Q-2 -36 3 -48 Q6 -34 0 -16 Z" fill="${ColorUtil.sh(a, -0.12)}"/>` +
          `<path d="M-11 -16 L11 -16 L8 0 L-8 0 Z" fill="${t.primary}"/><path d="M2 -16 L11 -16 L8 0 L2 0 Z" fill="${ColorUtil.sh(t.primary, -0.15)}"/>` + AssetUtil.rect(-12, -18, 24, 4, ColorUtil.sh(t.primary, -0.08), 1);
      } },

    big_plant: { kind: "ground", w: 60, h: 110, tags: ["planta grande", "costela de adão", "monstera"],
      draw: (p: any, t: any) => {
        const [a, b, c] = t.foliage; const pot = AssetUtil.col(t, p.pot, "#C9724E");
        const lf = (x: any, y: any, rot: any, colr: any) => `<ellipse cx="${x}" cy="${y}" rx="11" ry="22" fill="${colr}" transform="rotate(${rot} ${x} ${y})"/><path d="M${x} ${y + 20} L${x} ${y - 18}" stroke="${ColorUtil.sh(colr, -0.2)}" stroke-width="1.4" transform="rotate(${rot} ${x} ${y})"/>`;
        return AssetUtil.shadow(t, 22, 3) + lf(-16, -64, -35, c) + lf(16, -66, 35, b) + lf(0, -86, 0, a) + lf(-24, -88, -50, a) + lf(24, -90, 48, c) + lf(-6, -58, -12, b) +
          `<path d="M-16 -34 L16 -34 L12 0 L-12 0 Z" fill="${pot}"/><path d="M4 -34 L16 -34 L12 0 L4 0 Z" fill="${ColorUtil.sh(pot, -0.12)}"/>` + AssetUtil.rect(-17, -36, 34, 5, ColorUtil.sh(pot, -0.2), 2);
      } },

    cup: { kind: "surface", w: 16, h: 22, tags: ["xícara", "xicara", "caneca", "mug", "coffee"],
      draw: (p: any, t: any) => {
        const c = AssetUtil.col(t, p.color, t.paper);
        return AssetUtil.ell(0, 0, 9, 1.6, ColorUtil.sh(c, -0.2)) + `<path d="M-6 -12 L6 -12 L5 0 L-5 0 Z" fill="${c}"/><path d="M1 -12 L6 -12 L5 0 L1 0 Z" fill="${ColorUtil.sh(c, -0.12)}"/>` + AssetUtil.ell(0, -12, 6, 1.4, t.woodDark) +
          `<path d="M6 -10 Q11 -9 10 -5 Q9 -3 5.5 -3" stroke="${c}" stroke-width="2" fill="none"/>` +
          (p.steam === false ? "" : `<path d="M-2 -15 Q-5 -19 -2 -22 Q1 -25 -2 -28 M3 -15 Q0 -19 3 -22" stroke="${t.metal}" stroke-width="1.3" fill="none" opacity="0.6" stroke-linecap="round"/>`);
      } },

    cake: { kind: "surface", w: 30, h: 26, tags: ["bolo", "dessert"],
      draw: (p: any, t: any) => AssetUtil.rect(-16, -2, 32, 2, t.paper, 1) + AssetUtil.rect(-13, -18, 26, 16, t.paper, 2) + AssetUtil.rect(4, -18, 9, 16, ColorUtil.sh(t.paper, -0.1)) + AssetUtil.rect(-13, -12, 26, 3, t.primary) +
        `<path d="M-13 -18 Q-9 -14 -5 -18 Q-1 -14 3 -18 Q7 -14 13 -18 L13 -20 L-13 -20 Z" fill="${t.primary}"/>` + AssetUtil.circle(0, -23, 3, t.primary) + AssetUtil.circle(-1, -24, 1, ColorUtil.sh(t.primary, 0.4)) },

    pizza: { kind: "surface", w: 40, h: 8, tags: ["pizza"],
      draw: (p: any, t: any) => AssetUtil.ell(0, -2, 20, 4.5, t.paper) + AssetUtil.ell(0, -3, 17, 3.5, "#E9B44C") + AssetUtil.ell(0, -3.4, 15, 2.8, t.primary) +
        [[-8, -3.6], [2, -4.2], [9, -3], [-2, -2.6], [5, -2.2]].map(([x, y], i) => AssetUtil.ell(x, y, 2, 0.9, i % 2 ? "#F6E6B4" : ColorUtil.sh(t.primary, -0.35))).join("") + AssetUtil.ell(-5, -4.6, 2.5, 0.7, "#5E8C3A") },

    fruit_bowl: { kind: "surface", w: 34, h: 22, tags: ["frutas", "fruteira", "fruit"],
      draw: (p: any, t: any) => AssetUtil.circle(-7, -14, 6, t.primary) + AssetUtil.circle(6, -14, 6, t.accent) + AssetUtil.circle(0, -19, 6, "#8DBA4A") + AssetUtil.circle(-2, -21, 1.5, "#FFFFFF", "opacity=\"0.4\"") +
        `<path d="M-6 -24 L-5 -27" stroke="${t.trunk}" stroke-width="1.5"/>` + `<path d="M-17 -12 L17 -12 Q15 0 0 0 Q-15 0 -17 -12 Z" fill="${t.secondary}"/><path d="M4 -12 L17 -12 Q15 0 3 0 Z" fill="${ColorUtil.sh(t.secondary, -0.15)}"/>` },

    burger: { kind: "surface", w: 22, h: 18, tags: ["hambúrguer", "hamburguer", "sanduíche", "lanche"],
      draw: (p: any, t: any) => AssetUtil.rect(-10, -4, 20, 4, "#D99A4E", 2) + AssetUtil.rect(-11, -8, 22, 4, "#5A3322", 2) + `<path d="M-12 -9 L12 -9 L9 -7 L5 -9 L1 -7 L-3 -9 L-7 -7 Z" fill="#8DBA4A"/>` + AssetUtil.rect(-11, -10, 22, 2, "#F2C14E") +
        `<path d="M-10 -10 Q-10 -18 0 -18 Q10 -18 10 -10 Z" fill="#D99A4E"/>` + `<path d="M3 -18 Q10 -18 10 -10 L5 -10 Z" fill="${ColorUtil.sh("#D99A4E", -0.12)}"/>` + AssetUtil.circle(-3, -14, 0.8, "#FFF3D6") + AssetUtil.circle(2, -15.5, 0.8, "#FFF3D6") },

    plate: { kind: "surface", w: 26, h: 4, tags: ["prato", "dish"],
      draw: (p: any, t: any) => { const c = AssetUtil.col(t, p.color, t.paper); return AssetUtil.ell(0, -1.5, 13, 3, c) + AssetUtil.ell(0, -2, 9, 1.8, ColorUtil.sh(c, -0.08)); } },

    vase_flowers: { kind: "surface", w: 22, h: 34, tags: ["vaso de flores", "buquê", "flower vase"],
      draw: (p: any, t: any) => `<path d="M0 -14 Q-6 -24 -8 -30 M0 -14 Q2 -26 1 -32 M0 -14 Q6 -24 9 -28" stroke="${t.foliage[1]}" stroke-width="1.5" fill="none"/>` +
        AssetUtil.circle(-8, -31, 3.5, t.primary) + AssetUtil.circle(1, -33, 3.5, t.accent) + AssetUtil.circle(9, -29, 3.5, t.primary) +
        `<path d="M-5 -14 L5 -14 Q8 -7 4 0 L-4 0 Q-8 -7 -5 -14 Z" fill="${t.glass}" opacity="0.85"/><path d="M1 -14 L5 -14 Q8 -7 4 0 L1 0 Z" fill="${ColorUtil.sh(t.glass, -0.15)}"/>` },

    books: { kind: "surface", w: 26, h: 16, tags: ["livros", "pilha de livros", "book_stack"],
      draw: (p: any, t: any) => [[-13, -5, 26, t.primary], [-11, -10, 23, t.secondary], [-12, -15, 21, t.accent]].map(([x, y, w, c]) => AssetUtil.rect(x, y, w, 5, c, 1) + AssetUtil.rect(x + w - 4, y, 4, 5, ColorUtil.sh(c, -0.18), 1) + AssetUtil.rect(x + 2, y + 2, w - 7, 1, ColorUtil.sh(c, 0.35))).join("") },

    coffee_machine: { kind: "surface", w: 34, h: 40, tags: ["máquina de café", "espresso"],
      draw: (p: any, t: any) => AssetUtil.rect(-17, -40, 34, 40, t.metal, 4) + AssetUtil.rect(6, -40, 11, 40, ColorUtil.sh(t.metal, -0.18), 4) + AssetUtil.rect(-12, -34, 24, 9, t.ink, 2) + AssetUtil.circle(-6, -30, 1.8, t.accent) + AssetUtil.rect(-6, -20, 12, 4, t.ink) + AssetUtil.rect(-5, -10, 10, 10, t.paper, 1) },

    // ---------------- praia / viagem ----------------
    umbrella: { kind: "ground", w: 140, h: 150, tags: ["guarda-sol", "parasol", "beach_umbrella"],
      draw: (p: any, t: any) => {
        const c = AssetUtil.col(t, p.color, t.primary);
        return AssetUtil.shadow(t, 55, 5) + `<path d="M0 0 L8 -135" stroke="${t.ink}" stroke-width="4" stroke-linecap="round"/>` +
          `<path d="M-58 -112 Q8 -175 74 -128 Z" fill="${c}"/>` + `<path d="M-14 -126 Q8 -172 30 -122 Z" fill="${t.paper}"/>` +
          `<path d="M-58 -112 Q-30 -118 -14 -126 Q8 -120 30 -122 Q52 -124 74 -128" fill="none" stroke="${ColorUtil.sh(c, -0.25)}" stroke-width="3"/>` +
          `<path d="M-58 -112 Q-36 -132 -14 -126 L-58 -112 Z" fill="${ColorUtil.sh(c, 0.15)}" opacity="0.5"/>`;
      } },

    boat: { kind: "water", w: 70, h: 70, tags: ["barco", "veleiro", "sailboat"],
      draw: (p: any, t: any) => `<path d="M-35 -14 L35 -14 L25 0 L-25 0 Z" fill="${t.primary}"/><path d="M-35 -14 L35 -14 L33 -10 L-33 -10 Z" fill="${ColorUtil.sh(t.primary, 0.2)}"/>` +
        `<path d="M0 -14 L0 -70" stroke="${t.ink}" stroke-width="2.5"/><path d="M3 -68 L30 -18 L3 -18 Z" fill="${t.paper}"/><path d="M3 -68 L16 -43 L3 -43 Z" fill="${ColorUtil.sh(t.paper, -0.08)}"/><path d="M-3 -60 L-24 -18 L-3 -18 Z" fill="${ColorUtil.sh(t.paper, -0.12)}"/>` +
        `<path d="M-40 1 Q-30 -2 -20 1 T0 1 T20 1 T40 1" stroke="${t.paper}" stroke-width="2" fill="none" opacity="0.6"/>` },

    suitcase: { kind: "any", w: 30, h: 46, tags: ["mala", "luggage", "bagagem"],
      draw: (p: any, t: any) => {
        const c = AssetUtil.col(t, p.color, t.accent);
        return `<path d="M-6 -36 L-6 -44 L6 -44 L6 -36" stroke="${t.ink}" stroke-width="2.5" fill="none"/>` + AssetUtil.rect(-15, -38, 30, 36, c, 4) + AssetUtil.rect(5, -38, 10, 36, ColorUtil.sh(c, -0.15), 4) +
          AssetUtil.rect(-8, -38, 2, 36, ColorUtil.sh(c, -0.25)) + AssetUtil.rect(6, -38, 2, 36, ColorUtil.sh(c, -0.3)) + AssetUtil.circle(-9, -1, 2.5, t.ink) + AssetUtil.circle(9, -1, 2.5, t.ink) + AssetUtil.circle(-2, -30, 3, t.primary) + AssetUtil.rect(-12, -18, 8, 6, t.paper, 1, "transform=\"rotate(-10 -8 -15)\"");
      } },

    backpack: { kind: "any", w: 26, h: 34, tags: ["mochila"],
      draw: (p: any, t: any) => {
        const c = AssetUtil.col(t, p.color, t.secondary);
        return `<path d="M-6 -30 Q0 -38 6 -30" stroke="${ColorUtil.sh(c, -0.3)}" stroke-width="2.5" fill="none"/>` + AssetUtil.rect(-12, -30, 24, 30, c, 8) + AssetUtil.rect(2, -30, 10, 30, ColorUtil.sh(c, -0.15), 6) + AssetUtil.rect(-8, -14, 16, 11, ColorUtil.sh(c, -0.1), 4) + AssetUtil.rect(-3, -12, 6, 2, t.accent, 1);
      } },

    beach_towel: { kind: "floor", w: 90, h: 10, tags: ["toalha", "towel"],
      draw: (p: any, t: any) => `<path d="M-45 0 L-35 -9 L45 -9 L35 0 Z" fill="${t.secondary}"/><path d="M-25 0 L-15 -9 L-5 -9 L-15 0 Z M5 0 L15 -9 L25 -9 L15 0 Z" fill="${t.paper}"/>` },

    ball: { kind: "ground", w: 24, h: 24, tags: ["bola", "beach_ball"],
      draw: (p: any, t: any) => AssetUtil.shadow(t, 10, 2) + AssetUtil.circle(0, -12, 12, t.paper) + `<path d="M0 -24 A12 12 0 0 1 12 -12 L0 -12 Z" fill="${t.primary}"/><path d="M0 0 A12 12 0 0 1 -12 -12 L0 -12 Z" fill="${t.accent}"/>` +
        `<path d="M0 0 A12 12 0 0 0 12 -12 A12 12 0 0 1 2 -1 Z" fill="${t.ink}" opacity="0.12"/>` + AssetUtil.circle(-5, -18, 2.5, t.paper, "opacity=\"0.7\"") },

    sandcastle: { kind: "ground", w: 46, h: 40, tags: ["castelo de areia", "sand castle"],
      draw: (p: any, t: any) => {
        const s = t.groundDark || t.ground;
        return AssetUtil.shadow(t, 24, 3) + AssetUtil.rect(-20, -18, 40, 18, s) + AssetUtil.rect(-22, -32, 12, 14, s) + AssetUtil.rect(10, -32, 12, 14, s) + AssetUtil.rect(-6, -40, 12, 22, ColorUtil.sh(s, -0.08)) +
          [-22, -16, 10, 16].map((x) => AssetUtil.rect(x, -36, 4, 4, s)).join("") + AssetUtil.rect(-3, -12, 6, 12, ColorUtil.sh(s, -0.25), 3) + `<path d="M0 -40 L0 -50 L7 -47 L0 -44" stroke="${t.ink}" stroke-width="1.2" fill="${t.primary}"/>` + AssetUtil.rect(8, -18, 12, 18, ColorUtil.sh(s, -0.12));
      } },

    // ---------------- educação / carreira ----------------
    school: { kind: "ground", w: 170, h: 150, tags: ["escola", "colégio", "colegio"],
      draw: (p: any, t: any) => {
        const c = AssetUtil.col(t, p.color, t.primary), roof = t.secondary;
        return AssetUtil.shadow(t, 92, 5) +
          AssetUtil.rect(-80, -86, 160, 86, c) + AssetUtil.rect(30, -86, 50, 86, ColorUtil.sh(c, -0.12)) + AssetUtil.rect(-80, -90, 160, 6, ColorUtil.sh(c, -0.3)) +
          AssetUtil.rect(-28, -122, 56, 40, c) + AssetUtil.rect(10, -122, 18, 40, ColorUtil.sh(c, -0.12)) +
          `<path d="M-36 -120 L0 -146 L36 -120 Z" fill="${roof}"/><path d="M0 -146 L36 -120 L14 -120 Z" fill="${ColorUtil.sh(roof, -0.18)}"/>` +
          AssetUtil.circle(0, -106, 9, t.paper, `stroke="${ColorUtil.sh(c, -0.35)}" stroke-width="2"`) + `<path d="M0 -106 L0 -112 M0 -106 L4 -104" stroke="${t.ink}" stroke-width="1.6" stroke-linecap="round"/>` +
          AssetUtil.rect(-14, -46, 28, 46, t.woodDark, 2) + AssetUtil.rect(0, -46, 14, 46, ColorUtil.sh(t.woodDark, -0.15)) +
          [-66, -44, 24, 46].map((x) => AssetUtil.rect(x, -70, 18, 18, t.glass, 2, `stroke="${t.paper}" stroke-width="2.5"`)).join("") +
          [-66, -44, 24, 46].map((x) => AssetUtil.rect(x, -40, 18, 18, t.glass, 2, `stroke="${t.paper}" stroke-width="2.5"`)).join("") +
          `<path d="M60 -86 L60 -150" stroke="${t.metal}" stroke-width="2.5"/><path d="M60 -150 L82 -144 L60 -137 Z" fill="${t.accent}"/>`;
      } },

    university: { kind: "ground", w: 190, h: 150, tags: ["universidade", "faculdade", "campus", "museu"],
      draw: (p: any, t: any) => {
        const c = AssetUtil.col(t, p.color, t.paper), d = ColorUtil.sh(c, -0.14);
        let s = AssetUtil.shadow(t, 100, 5) + AssetUtil.rect(-95, -12, 190, 12, ColorUtil.sh(c, -0.2)) + AssetUtil.rect(-90, -20, 180, 8, d) + AssetUtil.rect(-85, -108, 170, 90, ColorUtil.sh(c, -0.06));
        for (let i = 0; i < 6; i++) { const x = -75 + i * 30; s += AssetUtil.rect(x, -100, 12, 80, c) + AssetUtil.rect(x + 7, -100, 5, 80, d) + AssetUtil.rect(x - 3, -104, 18, 5, d) + AssetUtil.rect(x - 3, -22, 18, 4, d); }
        return s + AssetUtil.rect(-92, -114, 184, 10, c) + AssetUtil.rect(-92, -106, 184, 3, d) +
          `<path d="M-96 -114 L0 -150 L96 -114 Z" fill="${c}"/><path d="M0 -150 L96 -114 L40 -114 Z" fill="${d}"/><path d="M-70 -118 L0 -143 L70 -118 Z" fill="${ColorUtil.sh(c, -0.08)}"/>` +
          AssetUtil.circle(0, -127, 7, t.accent) + AssetUtil.rect(-12, -60, 24, 40, t.woodDark, 2);
      } },

    lab: { kind: "ground", w: 160, h: 140, tags: ["laboratório", "laboratorio", "centro de pesquisa", "research"],
      draw: (p: any, t: any) => {
        const c = AssetUtil.col(t, p.color, t.secondary);
        let s = AssetUtil.shadow(t, 86, 5) + AssetUtil.rect(-80, -100, 160, 100, c) + AssetUtil.rect(30, -100, 50, 100, ColorUtil.sh(c, -0.14)) + AssetUtil.rect(-84, -106, 168, 8, ColorUtil.sh(c, -0.3));
        for (let y = -88; y < -20; y += 22) for (let x = -70; x < 70; x += 24) s += AssetUtil.rect(x, y, 18, 14, t.glass, 1) + AssetUtil.rect(x, y + 10, 18, 4, ColorUtil.sh(t.glass, -0.12));
        s += AssetUtil.rect(-16, -30, 32, 30, ColorUtil.sh(c, -0.35), 2) + AssetUtil.rect(-14, -28, 13, 28, t.glass, 1, "opacity=\"0.8\"") + AssetUtil.rect(1, -28, 13, 28, t.glass, 1, "opacity=\"0.8\"");
        // dome do observatório + frasco no letreiro
        s += `<path d="M30 -106 A26 26 0 0 1 82 -106 Z" fill="${t.metal}"/><path d="M56 -132 A26 26 0 0 1 82 -106 L56 -106 Z" fill="${ColorUtil.sh(t.metal, -0.15)}"/><path d="M52 -128 L70 -140" stroke="${t.ink}" stroke-width="4" stroke-linecap="round"/>`;
        s += AssetUtil.rect(-60, -128, 54, 20, t.paper, 4) + `<path d="M-46 -125 L-46 -119 L-51 -111 L-37 -111 L-42 -119 L-42 -125 Z" fill="${t.accent}"/>` + AssetUtil.rect(-33, -121, 22, 3, t.ink, 1) + AssetUtil.rect(-33, -115, 16, 3, t.ink, 1);
        return s;
      } },

    stage: { kind: "ground", w: 180, h: 130, tags: ["palco", "cerimônia", "cerimonia", "formatura", "ceremony"],
      draw: (p: any, t: any) => {
        const c = AssetUtil.col(t, p.color, t.primary), d = ColorUtil.sh(c, -0.18);
        return AssetUtil.shadow(t, 96, 5) + AssetUtil.rect(-86, -126, 8, 106, t.woodDark) + AssetUtil.rect(78, -126, 8, 106, t.woodDark) + AssetUtil.rect(-90, -132, 180, 10, t.woodDark, 2) +
          `<path d="M-78 -122 Q-70 -60 -78 -20 L-50 -20 Q-56 -80 -40 -122 Z" fill="${c}"/><path d="M78 -122 Q70 -60 78 -20 L50 -20 Q56 -80 40 -122 Z" fill="${d}"/>` +
          `<path d="M-40 -122 Q0 -108 40 -122 L40 -116 Q0 -100 -40 -116 Z" fill="${d}"/>` +
          AssetUtil.rect(-36, -112, 72, 18, t.paper, 3) + AssetUtil.rect(-26, -106, 52, 3, t.ink, 1) +
          AssetUtil.rect(-94, -22, 188, 22, ColorUtil.sh(t.wood, -0.05), 2) + AssetUtil.rect(-94, -22, 188, 5, ColorUtil.sh(t.wood, 0.15), 2) + AssetUtil.rect(-94, -6, 188, 6, ColorUtil.sh(t.wood, -0.25)) +
          AssetUtil.rect(-14, -56, 28, 34, t.woodDark, 2) + AssetUtil.rect(-18, -60, 36, 6, ColorUtil.sh(t.woodDark, -0.15), 2) + AssetUtil.circle(0, -42, 5, t.accent);
      } },

    finish_flag: { kind: "ground", w: 50, h: 90, tags: ["bandeira de chegada", "chegada", "finish", "bandeira quadriculada"],
      draw: (p: any, t: any) => {
        let s = AssetUtil.shadow(t, 10, 2) + `<path d="M0 0 L0 -90" stroke="${t.ink}" stroke-width="3.5" stroke-linecap="round"/>`;
        for (let i = 0; i < 4; i++) for (let j = 0; j < 3; j++) s += AssetUtil.rect(2 + i * 10, -88 + j * 10 + (i % 2 ? 1 : 0), 10, 10, (i + j) % 2 ? t.ink : t.paper);
        return s + AssetUtil.rect(2, -88, 40, 30, "none", 0, `stroke="${t.ink}" stroke-width="1.2"`);
      } },

    pennant: { kind: "ground", w: 30, h: 70, tags: ["bandeirinha", "flag"],
      draw: (p: any, t: any) => AssetUtil.shadow(t, 7, 1.6) + `<path d="M0 0 L0 -70" stroke="${t.metal}" stroke-width="2.5"/><path d="M1 -70 L28 -62 L1 -54 Z" fill="${AssetUtil.col(t, p.color, t.accent)}"/>` },

    balloons: { kind: "ground", w: 40, h: 100, tags: ["balões", "baloes", "festa", "party"],
      draw: (p: any, t: any) => {
        const cs = [t.primary, t.accent, t.secondary];
        return `<path d="M0 0 Q-6 -40 -12 -70 M0 0 Q2 -45 4 -82 M0 0 Q8 -36 16 -66" stroke="${t.metal}" stroke-width="1" fill="none"/>` +
          [[-12, -78, cs[0]], [4, -91, cs[1]], [16, -74, cs[2]]].map(([x, y, c]) => AssetUtil.ell(x, y, 9, 11, c) + AssetUtil.ell(x - 3, y - 4, 2.5, 3.5, t.paper, "opacity=\"0.45\"")).join("");
      } },

    diploma: { kind: "any", w: 26, h: 12, tags: ["diploma", "canudo", "certificado"],
      draw: (p: any, t: any) => AssetUtil.rect(-13, -10, 26, 10, t.paper, 5) + AssetUtil.rect(-13, -10, 26, 4, ColorUtil.sh(t.paper, 0.0), 5) + AssetUtil.rect(-13, -4, 26, 4, ColorUtil.sh(t.paper, -0.12), 2) + AssetUtil.rect(-2, -11, 4, 12, t.primary) + `<path d="M0 0 L-3 6 M0 0 L3 6" stroke="${t.primary}" stroke-width="1.6"/>` },

    trophy: { kind: "surface", w: 24, h: 30, tags: ["troféu", "trofeu", "prêmio"],
      draw: (p: any, t: any) => AssetUtil.rect(-9, -4, 18, 4, t.woodDark, 1) + AssetUtil.rect(-3, -12, 6, 8, t.accent) + `<path d="M-10 -30 L10 -30 Q10 -14 0 -12 Q-10 -14 -10 -30 Z" fill="${t.accent}"/><path d="M2 -30 L10 -30 Q10 -14 0 -12 Z" fill="${ColorUtil.sh(t.accent, -0.15)}"/>` +
        `<path d="M-10 -27 Q-16 -27 -14 -21 Q-12 -17 -8 -18 M10 -27 Q16 -27 14 -21 Q12 -17 8 -18" stroke="${t.accent}" stroke-width="2" fill="none"/>` },

    // ---------------- escritório (móveis modulares) ----------------
    desk_slab: { kind: "ground", hollow: true, w: 120, h: 46, top: 46, tags: ["tampo", "bancada", "desk top", "mesa planejada"],
      size: (p: any) => ({ w: p.width || 120, h: p.height || 46 }), topOf: (p: any) => p.height || 46,
      draw: (p: any, t: any) => {
        const w = p.width || 120, h = p.height || 46, th = p.thickness || 4, c = AssetUtil.col(t, p.color, t.wood);
        let s = AssetUtil.rect(-w / 2, -h, w, th, c) + AssetUtil.rect(-w / 2, -h + th - 1.2, w, 1.2, ColorUtil.sh(c, -0.18)) + AssetUtil.rect(-w / 2, -h, w, 0.8, ColorUtil.sh(c, 0.25));
        const ends = p.ends || "none";
        if (ends === "left" || ends === "both") s = AssetUtil.rect(-w / 2, -h, 3, h, ColorUtil.sh(c, -0.06)) + AssetUtil.rect(-w / 2 + 2, -h, 1, h, ColorUtil.sh(c, -0.2)) + s;
        if (ends === "right" || ends === "both") s = AssetUtil.rect(w / 2 - 3, -h, 3, h, ColorUtil.sh(c, -0.12)) + s;
        return s;
      } },

    drawer_unit: { kind: "ground", w: 26, h: 42, tags: ["gaveteiro", "gavetas", "drawers"],
      size: (p: any) => ({ w: p.width || 26, h: p.height || 42 }),
      draw: (p: any, t: any) => {
        const w = p.width || 26, h = p.height || 42, n = p.drawers || 4, c = AssetUtil.col(t, p.color, t.wood), plinth = 2.5;
        let s = AssetUtil.shadow(t, w * 0.55, 1.8) + AssetUtil.rect(-w / 2, -h, w, h, ColorUtil.sh(c, -0.08)) + AssetUtil.rect(-w / 2, -plinth, w, plinth, ColorUtil.sh(c, -0.25));
        const dh = (h - plinth - 1) / n;
        for (let i = 0; i < n; i++) {
          const y = -h + 0.6 + i * dh;
          s += AssetUtil.rect(-w / 2 + 0.8, y, w - 1.6, dh - 0.7, c, 0.6) + AssetUtil.rect(-w / 2 + 0.8, y + dh - 1.4, w - 1.6, 0.7, ColorUtil.sh(c, -0.15)) +
            AssetUtil.rect(-w * 0.28, y + dh * 0.42, w * 0.56, 0.8, t.metal, 0.4) + AssetUtil.rect(-w * 0.28, y + dh * 0.42 + 0.6, w * 0.56, 0.35, ColorUtil.sh(t.metal, -0.3));
        }
        return s;
      } },

    cabinet: { kind: "ground", w: 40, h: 36, tags: ["armário", "armario", "gabinete", "cabinet"],
      size: (p: any) => ({ w: p.width || 40, h: p.height || 36 }),
      draw: (p: any, t: any) => {
        const w = p.width || 40, h = p.height || 36, n = p.doors || 2, c = AssetUtil.col(t, p.color, t.wood), plinth = 2;
        let s = AssetUtil.shadow(t, w * 0.52, 1.8) + AssetUtil.rect(-w / 2, -h, w, h, ColorUtil.sh(c, -0.1)) + AssetUtil.rect(-w / 2 + 1, -plinth, w - 2, plinth, ColorUtil.sh(c, -0.3));
        const dw = (w - 1) / n;
        for (let i = 0; i < n; i++) {
          const x = -w / 2 + 0.5 + i * dw;
          s += AssetUtil.rect(x + 0.3, -h + 0.5, dw - 0.6, h - plinth - 0.8, c, 0.4) + AssetUtil.rect(x + dw - 1.2, -h + 0.5, 0.9, h - plinth - 0.8, ColorUtil.sh(c, -0.12));
          const hx = i < n / 2 ? x + dw - 2.6 : x + 1.8;
          if (n > 1 || p.handle !== false) s += AssetUtil.rect(hx, -h * 0.72, 0.8, h * 0.3, t.metal, 0.4);
        }
        return s;
      } },

    rolling_cart: { kind: "ground", w: 26, h: 36, top: 36, tags: ["gaveteiro com rodinhas", "carrinho", "rolling cabinet"],
      draw: (p: any, t: any) => {
        const c = AssetUtil.col(t, p.color, t.wood), d = ColorUtil.sh(c, -0.35);
        let s = AssetUtil.shadow(t, 14, 1.5) + AssetUtil.rect(-13, -36, 26, 33, ColorUtil.sh(c, -0.08)) +
          AssetUtil.rect(-11.5, -34.5, 23, 9, d) + AssetUtil.rect(-11.5, -24, 23, 9, d) + AssetUtil.rect(-13, -25.5, 26, 1.5, c) +
          AssetUtil.rect(-9, -30, 10, 4.5, t.paper, 0.5) + AssetUtil.rect(-8, -31, 6, 1.5, t.primary) + AssetUtil.rect(3, -29, 5, 3.5, t.paper) +
          AssetUtil.rect(-9, -21.5, 17, 6, t.ink, 1) + AssetUtil.rect(-9, -21.5, 17, 1, ColorUtil.sh(t.ink, 0.2));
        [-14.5, -8.5].forEach((y) => { s += AssetUtil.rect(-12, y, 24, 5.6, c, 0.5) + AssetUtil.rect(-7, y + 2.6, 14, 0.8, t.metal, 0.4); });
        return s + [-10, 10].map((x) => AssetUtil.circle(x, -1.5, 1.6, t.ink)).join("");
      } },

    trash_can: { kind: "ground", w: 9, h: 15, tags: ["lixeira", "cesto de lixo", "bin"],
      draw: (p: any, t: any) => {
        const c = AssetUtil.col(t, p.color, "#C9CCD0");
        return AssetUtil.shadow(t, 5.5, 1) + AssetUtil.rect(-4.5, -13.5, 9, 13, c, 1.2) + AssetUtil.rect(-4.5, -13.5, 2.2, 13, ColorUtil.sh(c, 0.35), 1) + AssetUtil.rect(1.8, -13.5, 2.7, 13, ColorUtil.sh(c, -0.22), 1) +
          AssetUtil.ell(0, -13.6, 4.6, 1.2, ColorUtil.sh(c, -0.1)) + AssetUtil.rect(-4.7, -15, 9.4, 1.8, ColorUtil.sh(c, -0.05), 0.8) + AssetUtil.rect(-1.5, -1.5, 3, 1.5, t.ink, 0.5);
      } },

    office_chair: { kind: "ground", w: 42, h: 60, tags: ["cadeira de escritório", "cadeira presidente", "office chair", "gamer chair"],
      draw: (p: any, t: any) => {
        const c = AssetUtil.col(t, p.color, "#1F1F24"), chrome = "#B9BEC4", d = ColorUtil.sh(c, 0.12);
        let s = AssetUtil.shadow(t, 22, 2.2);
        // base em estrela
        [[-19, -2], [19, -2], [-11, 0.5], [11, 0.5], [0, -3.5]].forEach(([x, y]) => { s += `<path d="M0 -5 L${x} ${y}" stroke="${chrome}" stroke-width="2.2" stroke-linecap="round"/>` + AssetUtil.circle(x, y + 0.6, 1.6, t.ink); });
        s += AssetUtil.rect(-1.3, -16, 2.6, 11, chrome) + AssetUtil.rect(-0.3, -16, 0.9, 11, "#FFFFFF", 0, "opacity=\"0.5\"");
        // assento e braços
        s += AssetUtil.rect(-18, -21, 36, 6, ColorUtil.sh(c, 0.05), 3) + AssetUtil.rect(-21, -29, 5, 13, c, 2) + AssetUtil.rect(16, -29, 5, 13, c, 2) + AssetUtil.rect(-21, -30, 6, 2.5, d, 1) + AssetUtil.rect(15, -30, 6, 2.5, d, 1);
        if (p.draped) s += `<path d="M-22 -31 Q-25 -22 -23 -12 L-17 -14 Q-18 -22 -16 -30 Z" fill="${AssetUtil.col(t, p.draped === true ? "metal" : p.draped, t.metal)}"/>`;
        // encosto alto acolchoado
        s += `<path d="M-15 -22 L-16 -52 Q-16 -60 -8 -60 L8 -60 Q16 -60 16 -52 L15 -22 Z" fill="${c}"/>` +
          `<path d="M-13 -55 Q0 -58 13 -55" stroke="${d}" stroke-width="1" fill="none"/><path d="M-13 -44 Q0 -46 13 -44" stroke="${d}" stroke-width="0.8" fill="none"/>` +
          `<path d="M-6 -57 L-6.5 -24 M6 -57 L6.5 -24" stroke="${d}" stroke-width="0.8"/>` + `<path d="M-14 -50 Q-15 -36 -13.5 -24" stroke="${ColorUtil.sh(c, 0.22)}" stroke-width="1.6" fill="none" opacity="0.7"/>`;
        return s;
      } },

    laptop_open: { kind: "surface", w: 17, h: 18, tags: ["notebook aberto", "laptop de frente", "laptop stand"],
      draw: (p: any, t: any) => {
        const lift = p.stand === false ? 0 : 5;
        let s = "";
        if (lift) s += `<path d="M-6 0 L4 -${lift} M6 0 L-4 -${lift}" stroke="${t.metal}" stroke-width="1" />` + AssetUtil.rect(-7, -0.8, 14, 0.8, t.metal);
        s += `<path d="M-8.5 ${-lift} L8.5 ${-lift} L7 ${-lift - 2.2} L-7 ${-lift - 2.2} Z" fill="${ColorUtil.sh(t.ink, 0.25)}"/>` +
          AssetUtil.rect(-7.2, -lift - 13, 14.4, 11, t.ink, 0.8) + AssetUtil.rect(-6.4, -lift - 12.2, 12.8, 9, p.on ? t.glass : ColorUtil.sh(t.ink, 0.12), 0.4) +
          `<path d="M-6.4 ${-lift - 12.2} L-1 ${-lift - 12.2} L-6.4 ${-lift - 6} Z" fill="#FFFFFF" opacity="0.08"/>`;
        return s;
      } },

    headphones: { kind: "surface", w: 10, h: 9, tags: ["fone", "headset", "fone de ouvido"],
      draw: (p: any, t: any) => {
        const c = AssetUtil.col(t, p.color, t.ink);
        return `<path d="M-4.5 -2.5 Q-4.5 -9 0 -9 Q4.5 -9 4.5 -2.5" stroke="${c}" stroke-width="1.3" fill="none"/>` + AssetUtil.ell(-4.2, -2.3, 2.3, 2.6, c) + AssetUtil.ell(4.2, -2.3, 2.3, 2.6, ColorUtil.sh(c, 0.15)) +
          (p.mic !== false ? `<path d="M-5.5 -3 Q-9 -6 -7.5 -11" stroke="${c}" stroke-width="0.7" fill="none"/>` + AssetUtil.circle(-7.5, -11.2, 0.8, c) : "");
      } },

    cap: { kind: "surface", w: 10, h: 6, tags: ["boné", "bone", "baseball cap"],
      draw: (p: any, t: any) => {
        const c = AssetUtil.col(t, p.color, t.ink);
        return `<path d="M-5 -1 Q-5 -6.5 0 -6.5 Q5 -6.5 5 -1 Z" fill="${c}"/><path d="M-1 -1 L6.5 -0.2 Q6.5 0.6 5 0.6 L-1 0.2 Z" fill="${ColorUtil.sh(c, 0.12)}"/>` +
          AssetUtil.rect(-2.5, -4.8, 5, 2.2, AssetUtil.col(t, p.logo, t.accent), 0.4) + AssetUtil.rect(-1.8, -4.2, 3.6, 0.5, t.paper);
      } },

    photo_frame: { kind: "surface", w: 10, h: 13, tags: ["porta-retrato", "quadrinho", "moldura", "photo frame", "pôster de mesa"],
      size: (p: any) => ({ w: p.width || 10, h: p.height || 13 }),
      draw: (p: any, t: any) => {
        const w = p.width || 10, h = p.height || 13, fc = AssetUtil.col(t, p.frame, t.ink), m = Math.min(w, h) * 0.08, iw = w - m * 2, ih = h - m * 2, x0 = -w / 2 + m, y0 = -h + m;
        const bg = AssetUtil.col(t, p.bg, t.paper);
        let art = AssetUtil.rect(x0, y0, iw, ih, bg);
        const a = p.art || "portrait";
        if (a === "portrait") art += AssetUtil.rect(x0, y0, iw, ih, ColorUtil.sh(AssetUtil.col(t, p.bg, t.secondary), 0.15)) + AssetUtil.circle(0, y0 + ih * 0.4, iw * 0.16, "#D9A27A") + `<path d="M${x0 + iw * 0.18} ${y0 + ih} Q0 ${y0 + ih * 0.5} ${x0 + iw * 0.82} ${y0 + ih} Z" fill="${t.ink}"/>` + AssetUtil.circle(0, y0 + ih * 0.34, iw * 0.17, ColorUtil.sh(t.ink, 0.1), "opacity=\"0.0\"");
        else if (a === "landscape") art += `<path d="M${x0} ${y0 + ih} L${x0 + iw * 0.35} ${y0 + ih * 0.45} L${x0 + iw * 0.6} ${y0 + ih * 0.75} L${x0 + iw * 0.75} ${y0 + ih * 0.6} L${x0 + iw} ${y0 + ih} Z" fill="${t.secondary}"/>` + AssetUtil.circle(x0 + iw * 0.72, y0 + ih * 0.28, iw * 0.1, t.accent);
        else if (a === "poster") art += AssetUtil.rect(x0, y0, iw, ih, AssetUtil.col(t, p.bg, t.primary)) + `<path d="M0 ${y0 + ih * 0.45} L${x0} ${y0} L${x0 + iw * 0.4} ${y0} Z M0 ${y0 + ih * 0.45} L${x0 + iw} ${y0 + ih * 0.1} L${x0 + iw} ${y0 + ih * 0.45} Z M0 ${y0 + ih * 0.45} L${x0 + iw * 0.7} ${y0 + ih} L${x0 + iw * 0.3} ${y0 + ih} Z" fill="${t.accent}" opacity="0.75"/>` + AssetUtil.circle(0, y0 + ih * 0.45, iw * 0.22, ColorUtil.sh(t.accent, 0.4));
        else if (a === "text") art += AssetUtil.rect(x0, y0, iw, ih, AssetUtil.col(t, p.bg, "#2B2B30")) + [0.3, 0.45, 0.6].map((k, i) => AssetUtil.rect(x0 + iw * 0.2, y0 + ih * k, iw * (0.6 - i * 0.12), ih * 0.06, t.paper, 0.3, "opacity=\"0.85\"")).join("");
        else if (a === "abstract") art += AssetUtil.circle(x0 + iw * 0.35, y0 + ih * 0.4, iw * 0.25, t.primary, "opacity=\"0.8\"") + AssetUtil.circle(x0 + iw * 0.62, y0 + ih * 0.62, iw * 0.22, t.accent, "opacity=\"0.8\"");
        return AssetUtil.rect(-w / 2 + 0.5, -h + 0.6, w, h, "#000000", 0.4, "opacity=\"0.12\"") + AssetUtil.rect(-w / 2, -h, w, h, fc, 0.4) + art + AssetUtil.rect(-w / 2, -h, w * 0.18, h, "#FFFFFF", 0, "opacity=\"0.06\"");
      } },

    figurine: { kind: "surface", w: 4, h: 6, tags: ["boneco", "miniatura", "action figure", "toy"],
      draw: (p: any, t: any) => {
        const c = AssetUtil.col(t, p.color, t.primary);
        return AssetUtil.ell(0, -0.4, 2, 0.6, ColorUtil.sh(c, -0.3)) + AssetUtil.rect(-1.4, -3.6, 2.8, 3.2, c, 1) + AssetUtil.circle(0, -4.9, 1.7, "#F0C8A0") + `<path d="M-1.8 -5.2 Q0 -7.4 1.8 -5.2 Z" fill="${AssetUtil.col(t, p.hair, t.ink)}"/>` + AssetUtil.rect(-1.9, -3.4, 0.7, 2, ColorUtil.sh(c, -0.2), 0.3);
      } },

    tumbler: { kind: "surface", w: 5, h: 11, tags: ["copo com canudo", "copo térmico", "tumbler"],
      draw: (p: any, t: any) => {
        const c = AssetUtil.col(t, p.color, t.paper);
        return `<path d="M-2.3 -8 L2.3 -8 L1.8 0 L-1.8 0 Z" fill="${c}"/><path d="M0.6 -8 L2.3 -8 L1.8 0 L0.6 0 Z" fill="${ColorUtil.sh(c, -0.1)}"/>` + AssetUtil.rect(-2.6, -8.8, 5.2, 1, ColorUtil.sh(c, -0.05), 0.4) +
          `<path d="M0.5 -8.8 L1.2 -12" stroke="${ColorUtil.sh(c, -0.12)}" stroke-width="0.6"/>` + AssetUtil.rect(-1.4, -5, 2.8, 1.2, t.ink, 0.2, "opacity=\"0.55\"");
      } },

    paper_cup: { kind: "surface", w: 4.5, h: 6, tags: ["copo de café", "café para viagem", "coffee to go"],
      draw: (p: any, t: any) => `<path d="M-2 -5 L2 -5 L1.6 0 L-1.6 0 Z" fill="${t.paper}"/><path d="M0.6 -5 L2 -5 L1.6 0 L0.6 0 Z" fill="${ColorUtil.sh(t.paper, -0.1)}"/>` + AssetUtil.rect(-2.3, -5.9, 4.6, 1, t.ink, 0.4) + AssetUtil.rect(-1.9, -3.4, 3.7, 1.6, AssetUtil.col(t, p.sleeve, t.woodDark), 0.2) },

    plastic_bag: { kind: "surface", w: 11, h: 9, tags: ["sacola", "sacola plástica", "bag"],
      draw: (p: any, t: any) => `<path d="M-5.5 0 Q-6 -5 -3.5 -7.5 Q-2 -9.5 0 -8 Q2.5 -9.8 4 -7.2 Q6.3 -4.5 5.5 0 Z" fill="${AssetUtil.col(t, p.color, "#F2F2F0")}"/>` +
        `<path d="M-3 -6 Q-1 -3 -2 -1 M1.5 -7 Q3 -4 2 -0.5 M-0.5 -4 L0.5 -2" stroke="#C9C9C6" stroke-width="0.4" fill="none"/>` + AssetUtil.rect(-2, -3.5, 3, 2, "#9A9A98", 0.3, "opacity=\"0.35\"") },

    cables: { kind: "surface", w: 14, h: 4, tags: ["cabos", "fios", "carregador"],
      draw: (p: any, t: any) => {
        const drop = p.drop ?? 30, c = AssetUtil.col(t, p.color, t.ink);
        return `<path d="M-7 -1 Q-3 -5 0 -1.5 Q3 1 6 -3 M-5 -0.5 Q-1 -3 3 -0.3" stroke="${c}" stroke-width="0.55" fill="none"/>` + AssetUtil.rect(-2, -1.6, 3.5, 1.4, c, 0.3) +
          `<path d="M-4 0 Q-6 ${drop * 0.5} -3 ${drop} M5 0 Q8 ${drop * 0.4} 4 ${drop * 0.75}" stroke="${c}" stroke-width="0.45" fill="none"/>`;
      } },

    light_switch: { kind: "wall", w: 5, h: 7, elevation: 110, tags: ["interruptor", "tomada", "switch"],
      draw: (p: any, t: any) => AssetUtil.rect(-2.4, -7, 5, 7, "rgba(0,0,0,0.08)", 0.6) + AssetUtil.rect(-2.5, -7.2, 5, 7, t.paper, 0.6) + AssetUtil.rect(-1, -5.2, 2, 3, ColorUtil.sh(t.paper, -0.08), 0.4) },

    glass_shelf: { kind: "ground", hollow: true, w: 14, h: 46, top: 46, tags: ["prateleira de vidro", "vidro", "glass shelf"],
      size: (p: any) => ({ w: p.width || 14, h: p.height || 46 }), topOf: (p: any) => p.height || 46,
      draw: (p: any, t: any) => {
        const w = p.width || 14, h = p.height || 46;
        return `<path d="M${-w / 2} ${-h + 1.6} L${w / 2} ${-h + 1.6} L${w / 2} ${-h} L${-w / 2 + 2} ${-h} Z" fill="${t.glass}" opacity="0.55"/>` +
          `<path d="M${-w / 2} ${-h + 1.6} L${w / 2} ${-h + 1.6}" stroke="${ColorUtil.sh(t.glass, -0.35)}" stroke-width="0.5"/>` + AssetUtil.rect(-w / 2, -h + 1.6, w, 1.2, t.ink, 0, "opacity=\"0.08\"");
      } },
  };

  // Busca por nome ou sinônimo; devolve id ou sugestões
  static resolveAsset(name: any, LIB = AssetUtil.ASSETS) {
    if (LIB[name]) return { id: name };
    const n = name.toLowerCase();
    for (const [id, a] of Object.entries(LIB)) if ((a.tags || []).includes(n)) return { id };
    const lev = (a: any, b: any) => {
      const d = Array.from({ length: a.length + 1 }, (_, i) => [i]);
      for (let j = 1; j <= b.length; j++) d[0][j] = j;
      for (let i = 1; i <= a.length; i++) for (let j = 1; j <= b.length; j++)
        d[i][j] = Math.min(d[i - 1][j] + 1, d[i][j - 1] + 1, d[i - 1][j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1));
      return d[a.length][b.length];
    };
    const cands: any[] = [];
    for (const [id, a] of Object.entries(LIB)) for (const k of [id, ...(a.tags || [])]) cands.push([lev(n, k), id]);
    cands.sort((x, y) => x[0] - y[0]);
    return { id: null, suggest: [...new Set(cands.slice(0, 6).map((c) => c[1]))].slice(0, 3) };
  }
}
