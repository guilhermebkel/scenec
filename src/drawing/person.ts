// Personagem riggado. Braços por cinemática inversa (2 ossos): cada pose define só onde
// ficam as mãos; o cotovelo é calculado. Unidades: pessoa em pé = 100, origem nos pés.
import { sh } from "../utils/color.ts";
import { SKIN, HAIR } from "./themes.ts";

const r = (n: any) => Math.round(n * 100) / 100;
const UPPER = 17, FORE = 16;

// Alvos das mãos (x>0 = lado direito da imagem) para vista frontal
const FRONT_POSES: Record<string, any> = {
  standing: { L: [-15, -46], R: [15, -46] },
  waving: { L: [-15, -46], R: [27, -105], openR: true },
  pointing: { L: [-15, -46], R: [46, -77] },
  presenting: { L: [-15, -46], R: [36, -66], openR: true, bendR: "down" },
  celebrating: { L: [-24, -108], R: [24, -108], openL: true, openR: true },
  holding: { L: [-15, -46], R: [21, -57] },
  hands_on_hips: { L: [-12, -50], R: [12, -50] },
  thinking: { L: [-7, -57], R: [5, -82], bendR: "down" },
  shrugging: { L: [-27, -66], R: [27, -66], openL: true, openR: true },
  walking: { L: [-8, -49], R: [19, -51] },
  phone: { L: [-15, -46], R: [10, -88] },
};
export const EXPRESSION_NAMES = ["happy", "neutral", "surprised", "sad", "worried", "angry", "laughing", "wink", "thinking"];
// Vista lateral sentada (f = 1 olhando para a direita)
const SIDE_POSES: Record<string, any> = {
  sitting: [20, -50], typing: [35, -55], reading: [22, -66], drinking: [10, -82],
};
export const POSE_NAMES = { standing: Object.keys(FRONT_POSES), seated: Object.keys(SIDE_POSES) };

// Proporções do corpo. age: child | teen | adult | elder; build: slim | average | broad | heavy;
// height: multiplicador da altura do corpo (0.85 a 1.15). A cabeça escala menos que o corpo (criança tem cabeça grande).
const AGE: Record<string, any> = { child: { bx: 0.8, by: 0.58, hs: 0.93 }, teen: { bx: 0.9, by: 0.86, hs: 0.97 }, adult: { bx: 1, by: 1, hs: 1 }, elder: { bx: 1, by: 0.95, hs: 1 } };
const BUILD: Record<string, any> = { slim: 0.88, average: 1, broad: 1.12, heavy: 1.16 };
export function bodyScale(p: Record<string, any> = {}) {
  const a = AGE[p.age] || AGE.adult;
  const hk = Math.max(0.8, Math.min(1.2, Number(p.height) || 1));
  return { bx: a.bx * (BUILD[p.build] || 1), by: a.by * hk, hs: a.hs };
}

// Para onde os olhos olham: [gx, gy] em -1..1 (gy < 0 = para cima). Aceita palavras ou o vetor já resolvido pelo compilador.
const LOOK: Record<string, any> = { left: [-1, 0], right: [1, 0], up: [0, -1], down: [0, 1], "up-left": [-0.8, -0.7], "up-right": [0.8, -0.7], "down-left": [-0.8, 0.7], "down-right": [0.8, 0.7], camera: [0, 0], forward: [0, 0] };
const POSE_GAZE: Record<string, any> = { pointing: [1, -0.3], presenting: [0.8, 0], thinking: [-0.5, -0.8], celebrating: [0, -0.5], phone: [0.5, 0.4], holding: [0.5, 0.3],
  reading: [0.5, 0.9], typing: [1, 0.15], drinking: [0.6, 0], sitting: [0.6, 0] };
function gazeOf(p: any, pose: any, f = 1) {
  if (Array.isArray(p.gaze)) return p.gaze;
  if (typeof p.look === "string" && LOOK[p.look]) return LOOK[p.look];
  const g = POSE_GAZE[pose];
  return g ? [g[0] * f, g[1]] : [0, 0];
}

function ik(S: any, T: any, side: any, bend = "out") {
  let dx = T[0] - S[0], dy = T[1] - S[1];
  let d = Math.hypot(dx, dy);
  const max = UPPER + FORE - 0.01, min = Math.abs(UPPER - FORE) + 0.5;
  if (d > max) { dx *= max / d; dy *= max / d; d = max; }
  if (d < min) d = min;
  const a = Math.acos((UPPER ** 2 + d ** 2 - FORE ** 2) / (2 * UPPER * d));
  const th = Math.atan2(dy, dx);
  const e1 = [S[0] + UPPER * Math.cos(th + a), S[1] + UPPER * Math.sin(th + a)];
  const e2 = [S[0] + UPPER * Math.cos(th - a), S[1] + UPPER * Math.sin(th - a)];
  const pick = bend === "down" ? (e1[1] > e2[1] ? e1 : e2) : (side * e1[0] > side * e2[0] ? e1 : e2);
  return { E: pick, H: [S[0] + dx, S[1] + dy] };
}

// Mão com forma: punho (palma + polegar) ou aberta (palma + dedos em leque + polegar), orientada pelo antebraço.
function hand(H: any, skin: any, open: any, side: any, E: any) {
  const dx = E ? H[0] - E[0] : 0, dy = E ? H[1] - E[1] : 1;
  const ang = (Math.atan2(dy, dx) * 180) / Math.PI;
  // polegar do lado de cima/de dentro: escolhe a perpendicular que aponta para o centro do corpo
  const n = [-dy, dx], toBody = [-H[0], -60 - H[1]];
  const ts = n[0] * toBody[0] + n[1] * toBody[1] >= 0 ? 1 : -1;
  const sk = sh(skin, -0.12);
  const g = (inner: any) => `<g transform="translate(${r(H[0])} ${r(H[1])}) rotate(${r(ang)})">${inner}</g>`;
  if (!open) return g(`<ellipse cx="1.2" cy="${0.9 * ts}" rx="1.9" ry="1.3" fill="${sk}" transform="rotate(${-30 * ts} 1.2 ${0.9 * ts})"/>` +
    `<rect x="-1.2" y="-3.1" width="6.4" height="6.2" rx="3" fill="${skin}"/>` +
    `<ellipse cx="2.4" cy="${2.6 * ts}" rx="2.2" ry="1.25" fill="${skin}" transform="rotate(${-20 * ts} 2.4 ${2.6 * ts})"/>` +
    `<path d="M4.2 -1.6 L4.2 1.6" stroke="${sk}" stroke-width="0.6" stroke-linecap="round"/>`);
  const fingers = [-27, -9, 9, 27].map((a, i) => {
    const len = [2.4, 3.1, 2.9, 2.1][i], rad = (a * Math.PI) / 180;
    return `<path d="M3 ${r(Math.sin(rad) * 1.9)} L${r(3 + Math.cos(rad) * len)} ${r(Math.sin(rad) * (1.9 + len))}" stroke="${skin}" stroke-width="2.25" stroke-linecap="round"/>`;
  }).join("");
  return g(`<ellipse cx="1.3" cy="0" rx="3.7" ry="3.5" fill="${skin}"/>` + fingers +
    `<path d="M0.6 ${2.2 * ts} L1.8 ${5 * ts}" stroke="${skin}" stroke-width="2.3" stroke-linecap="round"/>`);
}

function armPath(S: any, E: any, H: any, sleeve: any, skin: any, shortSleeve: any) {
  const base = `fill="none" stroke-linecap="round" stroke-linejoin="round"`;
  if (!shortSleeve) return `<path d="M${r(S[0])} ${r(S[1])} L${r(E[0])} ${r(E[1])} L${r(H[0])} ${r(H[1])}" stroke="${sleeve}" ${base} stroke-width="7"/>`;
  const mid = [S[0] + (E[0] - S[0]) * 0.6, S[1] + (E[1] - S[1]) * 0.6];
  return `<path d="M${r(mid[0])} ${r(mid[1])} L${r(E[0])} ${r(E[1])} L${r(H[0])} ${r(H[1])}" stroke="${skin}" ${base} stroke-width="6"/>` +
    `<path d="M${r(S[0])} ${r(S[1])} L${r(mid[0])} ${r(mid[1])}" stroke="${sleeve}" ${base} stroke-width="8"/>`;
}

function head(p: any, t: any, side: any, back: any, gz = [0, 0]) {
  const skin = SKIN[p.skin] || SKIN.medium;
  const hair = HAIR[p.hair_color] || p.hair_color || (p.age === "elder" ? HAIR.gray : HAIR.brown);
  const cx = 0, cy = -91;
  const style = p.hair || "short";
  let backHair = "", front = "";
  if (style === "long") {
    backHair = `<path d="M-12 -93 Q-15 -70 -10 -68 L10 -68 Q15 -70 12 -93 Z" fill="${hair}"/>`;
    front = `<path d="M-12 -92 Q-11 -105 0 -104 Q11 -105 12 -92 Q4 -99 -12 -92 Z" fill="${hair}"/>`;
  } else if (style === "bun") {
    backHair = `<circle cx="0" cy="-105" r="6" fill="${hair}"/>`;
    front = `<path d="M-11.5 -92 Q-11 -104 0 -103.5 Q11 -104 11.5 -92 Q2 -100 -11.5 -92 Z" fill="${hair}"/>`;
  } else if (style === "curly") {
    front = [[-9, -6], [-4, -10], [2, -11], [8, -8], [11, -2], [-11, 0]].map(([dx, dy]) => `<circle cx="${cx + dx}" cy="${cy + dy}" r="5" fill="${hair}"/>`).join("");
  } else if (style === "ponytail") {
    backHair = `<path d="M${-side * 9 - (side ? 0 : 9)} -96 Q${-side * 22 - (side ? 0 : 14)} -86 ${-side * 15 - (side ? 0 : 12)} -72" stroke="${hair}" stroke-width="6" fill="none" stroke-linecap="round"/>`;
    front = `<path d="M-11.5 -92 Q-11 -104 0 -103.5 Q11 -104 11.5 -92 Q2 -100 -11.5 -92 Z" fill="${hair}"/>`;
  } else if (style === "short") {
    front = `<path d="M-11 -93 Q-10 -104 1 -103 Q11 -102 11 -94 Q6 -98 -2 -97 Q-7 -96 -11 -93 Z" fill="${hair}"/>`;
  } else if (style === "bald") {
    front = "";
  }
  const neck = `<rect x="-3" y="-85" width="6" height="7" fill="${sh(skin, -0.12)}"/>`;
  if (back) {
    // de costas: cabelo cobre a cabeça, sem rosto
    const cover = style === "bald"
      ? `<circle cx="0" cy="${cy}" r="11" fill="${skin}"/>`
      : `<circle cx="0" cy="${cy}" r="11" fill="${skin}"/><path d="M-11.3 -88 Q-12 -103 0 -103 Q12 -103 11.3 -88 Q0 -84 -11.3 -88 Z" fill="${hair}"/>` +
        (style === "long" ? `<path d="M-11 -90 Q-13 -70 -9 -68 L9 -68 Q13 -70 11 -90 Z" fill="${hair}"/>` : "") + (style === "bun" ? `<circle cx="0" cy="-104" r="6" fill="${hair}"/>` : "");
    return neck + backHair + cover;
  }
  const expr = p.expr || "happy";
  // de frente, olhar para o lado também desloca o rosto (a cabeça "vira" um pouco)
  const ex = side * 1.8 + (side ? 0 : gz[0] * 1.3);
  const px = gz[0] * 1.1, py = gz[1] * 1.1;
  const eye = (x: any) => `<circle cx="${r(x + px)}" cy="${r(cy + py)}" r="1.45" fill="${t.ink}"/><circle cx="${r(x + px + 0.45)}" cy="${r(cy + py - 0.5)}" r="0.42" fill="#FFFFFF" opacity="0.85"/>`;
  const eyes = expr === "wink"
    ? eye(-4 + ex) + `<path d="M${r(2.4 + ex)} ${cy} Q${r(4 + ex)} ${cy - 1.6} ${r(5.6 + ex)} ${cy}" stroke="${t.ink}" stroke-width="1.1" fill="none" stroke-linecap="round"/>`
    : eye(-4 + ex) + eye(4 + ex);
  const mx = side * 2 + (side ? 0 : gz[0] * 1.3);
  const mouth = expr === "surprised"
    ? `<ellipse cx="${mx}" cy="${cy + 5.5}" rx="1.6" ry="2" fill="${t.ink}"/>`
    : expr === "neutral"
      ? `<path d="M${mx - 2.5} ${cy + 5.5} L${mx + 2.5} ${cy + 5.5}" stroke="${t.ink}" stroke-width="1.2" stroke-linecap="round"/>`
      : expr === "sad" || expr === "worried" || expr === "angry"
        ? `<path d="M${mx - 3} ${cy + 6.5} Q${mx} ${cy + 3.8} ${mx + 3} ${cy + 6.5}" stroke="${t.ink}" stroke-width="1.2" fill="none" stroke-linecap="round"/>`
        : expr === "laughing"
          ? `<path d="M${mx - 3.5} ${cy + 4} Q${mx} ${cy + 9.5} ${mx + 3.5} ${cy + 4} Z" fill="${t.ink}"/>`
          : `<path d="M${mx - 3} ${cy + 4.5} Q${mx} ${cy + 7.5} ${mx + 3} ${cy + 4.5}" stroke="${t.ink}" stroke-width="1.2" fill="none" stroke-linecap="round"/>`;
  const brows = expr === "thinking" || expr === "surprised"
    ? `<path d="M${-6 + ex} ${cy - 4.5} L${-2 + ex} ${cy - 5.2} M${2 + ex} ${cy - 5.2} L${6 + ex} ${cy - 4.5}" stroke="${hair}" stroke-width="1.1" stroke-linecap="round"/>`
    : expr === "worried"
      ? `<path d="M${-6 + ex} ${cy - 4.2} L${-2 + ex} ${cy - 5.6} M${2 + ex} ${cy - 5.6} L${6 + ex} ${cy - 4.2}" stroke="${hair}" stroke-width="1.1" stroke-linecap="round"/>`
      : expr === "angry" ? `<path d="M${-6 + ex} ${cy - 5.6} L${-2 + ex} ${cy - 4} M${2 + ex} ${cy - 4} L${6 + ex} ${cy - 5.6}" stroke="${hair}" stroke-width="1.3" stroke-linecap="round"/>` : "";
  const blush = `<circle cx="${-6.5 + ex}" cy="${cy + 3.5}" r="2" fill="#E9806E" opacity="0.35"/><circle cx="${6.5 + ex}" cy="${cy + 3.5}" r="2" fill="#E9806E" opacity="0.35"/>`;
  const glasses = p.glasses ? `<g stroke="${t.ink}" stroke-width="1" fill="none"><circle cx="${-4 + ex}" cy="${cy}" r="3.2"/><circle cx="${4 + ex}" cy="${cy}" r="3.2"/><path d="M${-0.8 + ex} ${cy} L${0.8 + ex} ${cy}"/></g>` : "";
  const beard = p.beard ? `<path d="M-10 -89 Q-10 -76 0 -76 Q10 -76 10 -89 Q8 -83 ${mx + 4} ${cy + 3} L${mx - 4} ${cy + 3} Q-8 -83 -10 -89 Z" fill="${hair}"/>` : "";
  const lines = p.age === "elder" ? `<path d="M${r(-8.2 + ex)} ${cy - 1.5} l-1.4 -0.6 M${r(8.2 + ex)} ${cy - 1.5} l1.4 -0.6 M${r(-5 + ex)} ${cy - 7.5} L${r(5 + ex)} ${cy - 7.5}" stroke="${sh(skin, -0.25)}" stroke-width="0.6" stroke-linecap="round"/>` : "";
  const ear = side ? `<ellipse cx="${-side * 10}" cy="${cy + 1}" rx="2" ry="3" fill="${sh(skin, -0.08)}"/>` : "";
  return neck + backHair + ear + `<circle cx="${cx}" cy="${cy}" r="11" fill="${skin}"/>` +
    front + beard + lines + eyes + brows + mouth + blush + glasses;
}

export function person(p: any, t: any) {
  const skin = SKIN[p.skin] || SKIN.medium;
  const top = t[p.shirt] || p.shirt || t.primary;
  const bottomC = t[p.pants] || p.pants || t.secondary;
  const jacket = p.jacket ? (t[p.jacket] || p.jacket) : null;
  const outfit = p.outfit || "tshirt"; // tshirt | sweater | dress
  const bottom = outfit === "dress" ? "dress" : (p.bottom || "pants"); // pants | shorts | skirt
  const shoes = t[p.shoes] || p.shoes || t.ink;
  const pose = p.pose || "standing";
  const gownC = outfit === "gown" ? (t[p.gown] || p.gown || t.ink) : null;
  const sleeve = outfit === "labcoat" ? "#FBFBF8" : gownC || jacket || top;
  const shortSleeve = !jacket && outfit === "tshirt";
  const k = bodyScale(p);
  const shadow = `<ellipse cx="0" cy="0" rx="${r(20 * k.bx)}" ry="3.2" fill="${t.shadow}"/>`;
  const B = (x: any) => `<g transform="scale(${r(k.bx)} ${r(k.by)})">${x}</g>`;
  const HD = (x: any, tilt = 0) => `<g transform="translate(0 ${r(-81 * k.by + 81 * k.hs)}) scale(${r(k.hs)}) rotate(${r(tilt)} 0 -82)">${x}</g>`;
  const box = { w: 40 * k.bx, h: 81 * k.by + 27 * k.hs };
  const out = (svg: any, H: any) => ({ svg, hand: [H[0] * k.bx, H[1] * k.by], box });

  // ---------- sentado (perfil) ----------
  if (SIDE_POSES[pose] || pose === "sitting_typing") {
    const f = p.facing === "left" ? -1 : 1;
    const T = SIDE_POSES[pose] || SIDE_POSES.typing;
    const legColor = bottom === "pants" ? bottomC : skin;
    let legs = `<path d="M0 -45 L${f * 24} -45 L${f * 24} -4" stroke="${legColor}" stroke-width="11" fill="none" stroke-linejoin="round"/>` +
      `<path d="M${f * 2} -41 L${f * 24} -41" stroke="${sh(legColor, -0.12)}" stroke-width="3" fill="none"/>` +
      `<path d="M${f * 21} -3 L${f * 32} -3 Q${f * 32} -8 ${f * 25} -8 L${f * 21} -8 Z" fill="${shoes}"/>`;
    if (bottom === "shorts") legs += `<path d="M0 -45 L${f * 14} -45" stroke="${bottomC}" stroke-width="12" stroke-linecap="butt"/>`;
    if (bottom === "skirt" || bottom === "dress") legs += `<path d="M${-f * 6} -52 L${f * 18} -50 L${f * 20} -39 L${-f * 7} -40 Z" fill="${bottom === "dress" ? top : bottomC}"/>`;
    const torsoC = jacket || top;
    const torso = `<rect x="-10" y="-81" width="20" height="40" rx="7" fill="${torsoC}"/>` +
      `<path d="M${-f * 10} -74 Q${-f * 10} -81 ${-f * 4} -81 L${-f * 3} -81 L${-f * 3} -41 L${-f * 10} -41 Z" fill="${sh(torsoC, -0.13)}"/>` +
      (jacket ? `<path d="M${f * 5} -80 L${f * 9} -76 L${f * 9} -44 L${f * 4} -44 Z" fill="${top}"/>` : "");
    // braço de trás (mais escuro) + braço da frente
    const S = [f * 2, -75];
    const back = ik(S, [T[0] * f - f * 4, T[1] + 2], f, "down");
    const front = ik(S, [T[0] * f, T[1]], f, "down");
    const armsBack = armPath(S, back.E, back.H, sh(sleeve, -0.18), sh(skin, -0.15), shortSleeve) + hand(back.H, sh(skin, -0.15), false, f, back.E);
    const armsFront = armPath(S, front.E, front.H, sleeve, skin, shortSleeve) + hand(front.H, skin, false, f, front.E);
    const prop = pose === "reading"
      ? `<path d="M${r(front.H[0] - f * 2)} ${r(front.H[1] - 9)} L${r(front.H[0] + f * 8)} ${r(front.H[1] - 6)} L${r(front.H[0] + f * 8)} ${r(front.H[1] + 4)} L${r(front.H[0] - f * 2)} ${r(front.H[1] + 1)} Z" fill="${t.accent}"/>`
      : pose === "drinking" ? `<path d="M${r(front.H[0] + f * 1)} ${r(front.H[1] - 7)} L${r(front.H[0] + f * 9)} ${r(front.H[1] - 7)} L${r(front.H[0] + f * 8)} ${r(front.H[1] + 3)} L${r(front.H[0] + f * 2)} ${r(front.H[1] + 3)} Z" fill="${t.paper}"/>` : "";
    const gz = gazeOf(p, pose, f);
    return out(shadow + B(armsBack + legs + torso) + HD(head(p, t, f, false, gz), f * gz[1] * 7) + B(armsFront + prop), front.H);
  }

  // ---------- em pé (frente ou costas) ----------
  const back = p.view === "back";
  const P = FRONT_POSES[pose] || FRONT_POSES.standing;
  const side = p.facing === "left" ? -1 : p.facing === "right" ? 1 : 0;
  const walk = pose === "walking";
  let legs = "";
  const legC = bottom === "pants" ? bottomC : skin;
  if (walk) {
    legs = `<path d="M-3 -45 L-12 -3" stroke="${legC}" stroke-width="8" stroke-linecap="round"/><path d="M3 -45 L11 -3" stroke="${sh(legC, -0.12)}" stroke-width="8" stroke-linecap="round"/>` +
      `<ellipse cx="-14" cy="-2.5" rx="5.5" ry="2.8" fill="${shoes}"/><ellipse cx="14" cy="-2.5" rx="5.5" ry="2.8" fill="${shoes}"/>`;
  } else {
    const lw = bottom === "pants" ? 8 : 6.5;
    legs = `<rect x="${-1 - lw}" y="-47" width="${lw}" height="45" rx="3" fill="${legC}"/><rect x="1" y="-47" width="${lw}" height="45" rx="3" fill="${legC}"/>` +
      `<rect x="${1 + lw * 0.45}" y="-47" width="${lw * 0.55}" height="45" rx="2" fill="${sh(legC, -0.12)}"/>` +
      `<ellipse cx="-5.5" cy="-2.5" rx="5.5" ry="2.8" fill="${shoes}"/><ellipse cx="5.5" cy="-2.5" rx="5.5" ry="2.8" fill="${shoes}"/>`;
  }
  if (bottom === "shorts") legs += `<path d="M-11 -47 L11 -47 L12 -30 L1 -30 L0 -36 L-1 -30 L-12 -30 Z" fill="${bottomC}"/><path d="M4 -47 L11 -47 L12 -30 L5 -30 Z" fill="${sh(bottomC, -0.12)}"/>`;
  if (bottom === "skirt") legs += `<path d="M-12 -48 L12 -48 L17 -27 L-17 -27 Z" fill="${bottomC}"/><path d="M4 -48 L12 -48 L17 -27 L7 -27 Z" fill="${sh(bottomC, -0.12)}"/>`;
  if (bottom === "dress") legs += `<path d="M-12 -48 L12 -48 L18 -24 L-18 -24 Z" fill="${top}"/><path d="M4 -48 L12 -48 L18 -24 L7 -24 Z" fill="${sh(top, -0.12)}"/>`;
  const torsoC = jacket || top;
  const heavy = p.build === "heavy";
  let torso = heavy
    ? `<path d="M-13 -74 Q-13 -81 -6 -81 L6 -81 Q13 -81 13 -74 Q18 -58 13 -44 L-13 -44 Q-18 -58 -13 -74 Z" fill="${torsoC}"/>` +
      `<path d="M5 -81 L6 -81 Q13 -81 13 -74 Q18 -58 13 -44 L5 -44 Z" fill="${sh(torsoC, -0.13)}"/>`
    : `<path d="M-13 -74 Q-13 -81 -6 -81 L6 -81 Q13 -81 13 -74 L12 -44 L-12 -44 Z" fill="${torsoC}"/>` +
      `<path d="M5 -81 L6 -81 Q13 -81 13 -74 L12 -44 L5 -44 Z" fill="${sh(torsoC, -0.13)}"/>`;
  if (jacket && !back) torso += `<path d="M-5 -81 L5 -81 L3 -45 L-3 -45 Z" fill="${top}"/><path d="M-5 -81 L-1 -70 L-4 -60 M5 -81 L1 -70 L4 -60" stroke="${sh(jacket, -0.25)}" stroke-width="1.2" fill="none"/>`;
  if (!jacket && outfit === "sweater" && !back) torso += `<path d="M-6 -81 Q0 -76 6 -81" stroke="${sh(top, -0.25)}" stroke-width="1.5" fill="none"/>`;
  if (outfit === "tshirt" && !jacket && !back) torso += `<path d="M-5 -81 Q0 -77 5 -81" fill="${sh(skin, -0.12)}"/>`;
  // beca (gown) e jaleco (labcoat) por cima de tudo
  if (gownC) {
    torso += `<path d="M-13 -76 Q-13 -81 -6 -81 L6 -81 Q13 -81 13 -76 L18 -14 L-18 -14 Z" fill="${gownC}"/><path d="M5 -81 L6 -81 Q13 -81 13 -76 L18 -14 L6 -14 Z" fill="${sh(gownC, -0.15)}"/>` +
      (back ? "" : `<path d="M-6 -81 L-3 -81 L-4 -46 L-7 -46 Z M3 -81 L6 -81 L7 -46 L4 -46 Z" fill="${t[p.stole] || t.accent}"/><path d="M-5 -81 Q0 -74 5 -81" fill="${sh(skin, -0.12)}"/>`);
  }
  if (outfit === "labcoat") {
    const lc = "#FBFBF8";
    torso += `<path d="M-13 -76 Q-13 -81 -6 -81 L6 -81 Q13 -81 13 -76 L15 -27 L-15 -27 Z" fill="${lc}"/><path d="M5 -81 L6 -81 Q13 -81 13 -76 L15 -27 L5 -27 Z" fill="${sh(lc, -0.1)}"/>` +
      (back
        ? ""
        : `<path d="M-5 -81 L5 -81 L1 -60 L-1 -60 Z" fill="${top}"/><path d="M0 -60 L0 -27" stroke="${sh(lc, -0.25)}" stroke-width="1"/>` +
        `<rect x="-11" y="-42" width="7" height="6" rx="1" fill="none" stroke="${sh(lc, -0.25)}" stroke-width="1"/><path d="M6 -72 L6 -66" stroke="${t.primary}" stroke-width="1.6"/>`);
  }
  let pack = "";
  if (p.backpack) {
    const bc = t[p.backpack] || (p.backpack === true ? t.accent : p.backpack);
    pack = back ? "" : `<rect x="-16" y="-79" width="32" height="32" rx="7" fill="${sh(bc, -0.2)}"/>`;
    if (back) torso += `<rect x="-11" y="-78" width="22" height="30" rx="7" fill="${bc}"/><rect x="-7" y="-62" width="14" height="10" rx="3" fill="${sh(bc, -0.15)}"/>`;
    else torso += `<path d="M-8 -81 L-9 -50 M8 -81 L9 -50" stroke="${sh(bc, -0.1)}" stroke-width="2.5" stroke-linecap="round"/>`;
  }
  const hat = p.hat === "grad_cap"
    ? `<path d="M-9 -103 L9 -103 L9 -98 Q0 -95 -9 -98 Z" fill="${t.ink}"/><path d="M-18 -103 L0 -110 L18 -103 L0 -96 Z" fill="${t.ink}"/><path d="M-18 -103 L0 -96 L18 -103 L0 -98.5 Z" fill="${sh(t.ink, 0.15)}"/>` +
    `<path d="M0 -103 L13 -102 L14 -93" stroke="${t.accent}" stroke-width="1.3" fill="none"/><circle cx="14" cy="-92" r="1.8" fill="${t.accent}"/>`
    : p.hat === "cap" ? `<path d="M-11 -97 Q-11 -108 0 -108 Q11 -108 11 -97 Z" fill="${t[p.hat_color] || t.primary}"/><path d="M${side >= 0 ? 4 : -18} -98 L${side >= 0 ? 18 : -4} -98 L${side >= 0 ? 16 : -6} -95 L${side >= 0 ? 4 : -4} -95 Z" fill="${sh(t[p.hat_color] || t.primary, -0.2)}"/>` : "";
  const SL = [-12, -76], SR = [12, -76];
  const L = ik(SL, P.L, -1, P.bendL), R = ik(SR, P.R, 1, P.bendR);
  const arms = armPath(SL, L.E, L.H, sleeve, skin, shortSleeve) + hand(L.H, skin, P.openL, -1, L.E) +
    armPath(SR, R.E, R.H, sleeve, skin, shortSleeve) + hand(R.H, skin, P.openR, 1, R.E);
  // braço que cruza o corpo (pensando) vai na frente; demais também na frente do tronco
  const gz = gazeOf(p, pose, side || 1);
  const tilt = side ? side * gz[1] * 6 : gz[0] * 4;
  // bengala (idoso): apoiada na mão esquerda quando ela está em repouso
  const cane = p.cane && Math.abs(P.L[1] + 46) < 6
    ? `<path d="M${r(L.H[0] - 1)} ${r(L.H[1] + 2)} L${r(L.H[0] - 4)} -1" stroke="${t.trunk || "#6B4A33"}" stroke-width="2.4" stroke-linecap="round"/>` +
    `<path d="M${r(L.H[0] - 1)} ${r(L.H[1] + 2)} Q${r(L.H[0] + 1)} ${r(L.H[1] - 4)} ${r(L.H[0] + 5)} ${r(L.H[1] - 1)}" stroke="${t.trunk || "#6B4A33"}" stroke-width="2.4" fill="none" stroke-linecap="round"/>`
    : "";
  const phone = pose === "phone" && !back ? `<rect x="${r(R.H[0] - 1.5)}" y="${r(R.H[1] - 8)}" width="4.6" height="8.5" rx="1.2" fill="${t.ink}"/><rect x="${r(R.H[0] - 0.8)}" y="${r(R.H[1] - 7.2)}" width="3.2" height="6.4" rx="0.6" fill="${t.glass || "#BFD7EA"}"/>` : "";
  const svg = back
    ? B(legs + torso + arms) + HD(head(p, t, 0, true) + hat)
    : B(legs + pack + torso) + HD(head(p, t, side, false, gz) + hat, tilt) + B(cane + arms + phone);
  return out(shadow + svg, R.H);
}
