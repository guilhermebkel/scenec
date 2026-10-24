// Grupos prontos: um objeto `group: <nome>` vira várias peças já arrumadas entre si.
// Os ids gerados são <id>_<peça> (ex.: canto_pessoa), e podem ser referenciados de fora (look, on, left_of...).
// Parâmetros comuns: at, depth, size, flip (espelha), person/people (sobrescreve personagens),
// parts: { peça: {...campos} | false } para ajustar ou remover peças, color (cor principal do móvel).

const REL = ["left_of", "right_of", "behind", "in_front_of", "on", "under", "above", "holds", "look"];

export const GROUPS: Record<string, any> = {
  // canto de trabalho: mesa, cadeira, pessoa digitando, tela, luminária, caneca e planta
  workspace: {
    anchor: "mesa", desc: "mesa de trabalho com pessoa digitando, tela, luminária, caneca e planta",
    build: (g: any) => ({
      mesa: { asset: "desk", at: g.at, color: g.color },
      cadeira: { asset: "chair", left_of: "mesa", gap: -0.04, facing: "right" },
      pessoa: { asset: "person", pose: "typing", on: "cadeira", facing: "right", ...g.person },
      tela: g.screen === "monitor" ? { asset: "monitor", on: "mesa", align: -0.1, size: 0.8 } : { asset: "laptop", on: "mesa", align: "left", facing: "left" },
      luminaria: { asset: "lamp", on: "mesa", align: "right" },
      caneca: { asset: "cup", on: "mesa", align: 0.12, color: "accent" },
      planta: { asset: "big_plant", right_of: "mesa", gap: 0.015, size: "small" },
    }),
  },
  // canto de leitura: sofá, pessoa lendo, abajur de chão e prateleira acima
  reading_corner: {
    anchor: "sofa", desc: "sofá com pessoa lendo, abajur de chão e prateleira",
    build: (g: any) => ({
      sofa: { asset: "sofa", at: g.at, color: g.color || "secondary" },
      pessoa: { asset: "person", pose: "reading", on: "sofa", align: "left", facing: "right", pants: "metal", ...g.person },
      abajur: { asset: "floor_lamp", right_of: "sofa", gap: 0.005 },
      prateleira: { asset: "shelf_wall", above: "sofa", offset: 0.18, elevation: 45 },
    }),
  },
  // mesa de refeição: duas pessoas sentadas frente a frente, olhando uma para a outra
  dining: {
    anchor: "mesa", desc: "mesa com duas pessoas sentadas conversando, comida e bebidas",
    build: (g: any) => {
      const [a = {}, b = {}] = g.people || [];
      return {
        mesa: { asset: "table", at: g.at, color: g.color },
        cadeira1: { asset: "chair", left_of: "mesa", gap: -0.004, facing: "right" },
        cadeira2: { asset: "chair", right_of: "mesa", gap: -0.004, facing: "left" },
        pessoa1: { asset: "person", pose: "sitting", on: "cadeira1", facing: "right", look: "pessoa2", ...a },
        pessoa2: { asset: "person", pose: "drinking", on: "cadeira2", facing: "left", look: "pessoa1", ...b },
        prato: { asset: g.food || "pizza", on: "mesa", align: 0 },
        copo1: { asset: "cup", on: "mesa", align: -0.32, steam: false },
      };
    },
  },
  // conversa em pé: um fala (apresentando), o outro escuta; os dois se olham
  conversation: {
    anchor: "pessoa1", desc: "duas pessoas em pé conversando, olhando uma para a outra",
    build: (g: any) => {
      const [a = {}, b = {}] = g.people || [];
      return {
        pessoa1: { asset: "person", at: g.at, pose: "presenting", facing: "right", look: "pessoa2", expr: "happy", ...a },
        pessoa2: { asset: "person", right_of: "pessoa1", gap: g.gap ?? 0.04, pose: "standing", facing: "left", look: "pessoa1", expr: "neutral", ...b },
      };
    },
  },
  // banco de praça: banco, árvore, pessoa sentada lendo e cachorro
  park_bench: {
    anchor: "banco", desc: "banco de praça com árvore, pessoa sentada e cachorro",
    build: (g: any) => ({
      banco: { asset: "bench", at: g.at, color: g.color },
      arvore: { asset: "tree", right_of: "banco", gap: -0.02, depth: "mid" },
      pessoa: { asset: "person", pose: "reading", on: "banco", align: "left", facing: "right", ...g.person },
      cachorro: { asset: "dog", left_of: "banco", gap: 0.01, facing: "right", look: "pessoa" },
    }),
  },
  // comemoração: mesa com bolo, balões e duas pessoas festejando
  celebration: {
    anchor: "mesa", desc: "mesa com bolo, balões e duas pessoas comemorando",
    build: (g: any) => {
      const [a = {}, b = {}] = g.people || [];
      return {
        mesa: { asset: "table", at: g.at, color: g.color },
        bolo: { asset: "cake", on: "mesa", size: 1.4 },
        baloes: { asset: "balloons", right_of: "mesa", gap: 0.01 },
        pessoa1: { asset: "person", left_of: "mesa", gap: 0.01, pose: "celebrating", expr: "laughing", look: "bolo", ...a },
        pessoa2: { asset: "person", right_of: "baloes", gap: 0.0, pose: "waving", expr: "happy", facing: "left", look: "pessoa1", ...b },
      };
    },
  },
  // reunião: quadro na parede, uma pessoa apresenta e duas assistem sentadas
  meeting: {
    anchor: "mesa", desc: "mesa de reunião com quadro, uma pessoa apresentando e duas sentadas",
    build: (g: any) => {
      const [a = {}, b = {}, c = {}] = g.people || [];
      return {
        quadro: { asset: "board", above: "mesa", offset: 0.1, elevation: 70 },
        mesa: { asset: "desk", at: g.at, color: g.color },
        cadeira1: { asset: "chair", left_of: "mesa", gap: -0.03, facing: "right" },
        cadeira2: { asset: "chair", right_of: "mesa", gap: -0.03, facing: "left" },
        pessoa1: { asset: "person", pose: "sitting", on: "cadeira1", facing: "right", look: "quadro", ...a },
        pessoa2: { asset: "person", behind: "mesa", offset: 0.05, layer: "back", pose: "presenting", look: "pessoa1", ...b },
        pessoa3: { asset: "person", pose: "sitting", on: "cadeira2", facing: "left", look: "pessoa2", ...c },
        notebook: { asset: "laptop", on: "mesa", align: "left", facing: "left" },
      };
    },
  },
};

const SIZES: Record<string, any> = { tiny: 0.5, small: 0.75, medium: 1, large: 1.3, huge: 1.7 };
const flipSide = (v: any) => (v === "left" ? "right" : v === "right" ? "left" : v);

export function expandGroups(objs: Record<string, any>, warnings: string[]): Record<string, any> {
  const out: Record<string, any> = {}, alias: Record<string, string> = {};
  for (const [id, o] of Object.entries(objs || {})) {
    if (!o?.group) { out[id] = o; continue; }
    const G = GROUPS[o.group];
    if (!G) { warnings.push(`grupo '${o.group}' (em '${id}') não existe; disponíveis: ${Object.keys(GROUPS).join(", ")}`); continue; }
    const parts = G.build({ ...o, at: o.at ?? 0.5 });
    const removed = new Set();
    for (const [k, v] of Object.entries(o.parts || {})) {
      if (v === false) { delete parts[k]; removed.add(k); } else if (parts[k]) { parts[k] = { ...parts[k], ...(v as object) }; } else { parts[k] = v; } // peça extra
    }
    const pre = (ref: any) => (typeof ref === "string" && parts[ref] ? `${id}_${ref}` : removed.has(ref) ? undefined : ref);
    for (const [k, p] of Object.entries(parts)) {
      const q: Record<string, any> = { ...(p as object) };
      for (const r of REL) { if (q[r] != null) { q[r] = Array.isArray(q[r]) ? q[r].map(pre) : pre(q[r]); } }
      for (const key of Object.keys(q)) { if (q[key] === undefined) { delete q[key]; } }
      if (o.depth && !q.on && !q.depth) { q.depth = o.depth; }
      // tamanho do grupo: só para peças que não herdam escala (as apoiadas/seguradas herdam do suporte)
      if (o.size != null && !q.on && !q.holds) {
        const k0 = typeof q.size === "number" ? q.size : SIZES[q.size] ?? 1;
        q.size = k0 * (typeof o.size === "number" ? o.size : SIZES[o.size] ?? 1);
      }
      if (o.flip) {
        if (q.left_of || q.right_of) { const l = q.left_of; q.left_of = q.right_of; q.right_of = l; if (q.left_of == null) { delete q.left_of; } if (q.right_of == null) { delete q.right_of; } }
        q.facing = flipSide(q.facing);
        if (typeof q.align === "number") { q.align = -q.align; } else { q.align = flipSide(q.align); }
        if (typeof q.offset === "number") { q.offset = -q.offset; }
        for (const key of ["facing", "align"]) { if (q[key] == null) { delete q[key]; } }
      }
      out[`${id}_${k}`] = q;
    }
    alias[id] = `${id}_${G.anchor}`;
  }
  // referências ao id do grupo apontam para a peça âncora
  for (const o of Object.values(out)) { for (const r of REL) { if (typeof o[r] === "string" && alias[o[r]]) { o[r] = alias[o[r]]; } } }
  return out;
}
