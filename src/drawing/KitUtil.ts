
export class KitUtil {
  // Kits de estilo: a mesma cena com outra linguagem visual (não só outra paleta).
// canvas.kit: flat (padrão) | outline | hatch | riso | paper | sketch
// Cada kit decide: cores de base, como a luz aparece (gradiente, hachura ou nada), contorno por objeto,
// filtro de cena inteira e textura por cima (abaixo do texto). Tudo SVG puro, renderizável no resvg.

  static readonly KITS: Record<string, any> = {
    flat: { desc: "flat vector with soft light (default)" },
    outline: {
      desc: "cartoon outline: thick border on the silhouette and a thin line inside",
      outline: { w: 2.6, inner: 0.9 }, light: { strength: 0.45 },
    },
    hatch: {
      desc: "engraving/comics: ink outline, hatched shadows instead of gradients, light paper",
      outline: { w: 2.4, inner: 1.0 }, light: { mode: "hatch" }, texture: "paper",
      colors: { shadow: "rgba(40,30,30,0.18)" },
    },
    riso: {
      desc: "risograph: few vivid inks, print grain and slightly misaligned registration",
      colors: { primary: "#0078BF", accent: "#FF48B0", secondary: "#1F3A93", paper: "#FFF8EC", text: "#1A1F4A", ink: "#1A1F4A" },
      light: { mode: "none" }, scene: "riso",
    },
    paper: {
      desc: "paper cut-out: each piece with its own shadow and fiber texture",
      light: { strength: 0.18, casts: false }, drop: true, texture: "fiber",
    },
    sketch: {
      desc: "sketch: watercolor-washed colors and pencil lines on the edges",
      light: { mode: "none" }, scene: "sketch", texture: "paper",
    },
  };

  private static readonly n = (v: any) => (+v).toFixed(3);

  // contorno de silhueta (dilata o alfa e pinta de tinta por baixo do objeto)
  static outlineFilter(id: any, r: any, ink: any) {
    return `<filter id="${id}" x="-15%" y="-15%" width="130%" height="130%"><feMorphology in="SourceAlpha" operator="dilate" radius="${KitUtil.n(r)}" result="d"/>` +
      `<feFlood flood-color="${ink}"/><feComposite in2="d" operator="in" result="o"/><feMerge><feMergeNode in="o"/><feMergeNode in="SourceGraphic"/></feMerge></filter>`;
  }

  // sombra de recorte de papel
  static dropFilter(id: any, s: any) {
    return `<filter id="${id}" x="-20%" y="-20%" width="140%" height="150%"><feGaussianBlur in="SourceAlpha" stdDeviation="${KitUtil.n(2.2 / s)}"/>` +
      `<feOffset dx="${KitUtil.n(2.5 / s)}" dy="${KitUtil.n(4 / s)}" result="b"/><feFlood flood-color="#2B1D10" flood-opacity="0.42"/><feComposite in2="b" operator="in" result="sh"/>` +
      `<feMerge><feMergeNode in="sh"/><feMergeNode in="SourceGraphic"/></feMerge></filter>`;
  }

  // traço fino por dentro: formas sem stroke ganham contorno; brilhos e transparências ficam sem
  static innerStroke(art: any, w: any, ink: any) {
    const a = art.replace(/<(rect|path|circle|ellipse|polygon)\b([^>]*?)\/>/g, (m: any, tag: any, attrs: any) =>
      /\bopacity=|fill-opacity=|fill="none"|fill="url\(/.test(attrs) || /\bstroke=/.test(attrs) ? (/\bstroke=/.test(attrs) ? m : `<${tag}${attrs} stroke="none"/>`) : m);
    return `<g stroke="${ink}" stroke-width="${KitUtil.n(w)}" stroke-linejoin="round">${a}</g>`;
  }

  // padrões de hachura (sombra própria e sombra projetada)
  static hatchDefs(ink: any) {
    return `<pattern id="hatchP" width="7" height="7" patternUnits="userSpaceOnUse" patternTransform="rotate(45)"><rect x="0" y="0" width="1.5" height="7" fill="${ink}" fill-opacity="0.5"/></pattern>` +
      `<pattern id="hatchC" width="6" height="6" patternUnits="userSpaceOnUse" patternTransform="rotate(-35)"><rect x="0" y="0" width="1.4" height="6" fill="${ink}" fill-opacity="0.42"/><rect x="0" y="0" width="6" height="1.2" fill="${ink}" fill-opacity="0.22"/></pattern>`;
  }

  // filtros de cena inteira
  static sceneFilter(kind: any, t: any) {
    if (kind === "riso") {
      // posteriza (tinta chapada) -> cópia deslocada em rosa multiplicada (registro) -> poros de papel claros
      return `<filter id="kitScene" x="0" y="0" width="100%" height="100%" color-interpolation-filters="sRGB">` +
        `<feComponentTransfer in="SourceGraphic" result="post"><feFuncR type="discrete" tableValues="0.1 0.35 0.6 0.85 1"/><feFuncG type="discrete" tableValues="0.1 0.35 0.6 0.85 1"/><feFuncB type="discrete" tableValues="0.12 0.38 0.62 0.86 1"/></feComponentTransfer>` +
        `<feOffset in="post" dx="2.2" dy="1.4" result="off"/>` +
        // cópia deslocada vira tinta rosa só onde há tinta (alfa = 1 - luminância): áreas claras não mudam
        `<feColorMatrix in="off" type="matrix" values="0 0 0 0 1  0 0 0 0 0.36  0 0 0 0 0.66  -0.2 -0.4 -0.08 0.62 0" result="tint"/>` +
        `<feBlend in="post" in2="tint" mode="multiply" result="reg"/>` +
        `<feTurbulence type="fractalNoise" baseFrequency="0.85" numOctaves="1" seed="7" result="nz"/>` +
        `<feColorMatrix in="nz" type="matrix" values="0 0 0 0 1  0 0 0 0 0.98  0 0 0 0 0.94  0 0 0 -2.4 1.25" result="spk"/>` +
        `<feComposite in="spk" in2="reg" operator="in" result="spk2"/>` +
        `<feMerge><feMergeNode in="reg"/><feMergeNode in="spk2"/></feMerge></filter>`;
    }
    if (kind === "sketch") {
      // cores lavadas + bordas por convolução (laplaciano) desenhadas como grafite
      return `<filter id="kitScene" x="0" y="0" width="100%" height="100%" color-interpolation-filters="sRGB">` +
        `<feColorMatrix in="SourceGraphic" type="saturate" values="0.55" result="ds"/>` +
        `<feComponentTransfer in="ds" result="wash"><feFuncR type="linear" slope="0.58" intercept="0.42"/><feFuncG type="linear" slope="0.58" intercept="0.42"/><feFuncB type="linear" slope="0.58" intercept="0.4"/></feComponentTransfer>` +
        `<feColorMatrix in="SourceGraphic" type="matrix" values="0.3 0.59 0.11 0 0  0.3 0.59 0.11 0 0  0.3 0.59 0.11 0 0  0 0 0 1 0" result="g"/>` +
        `<feConvolveMatrix in="g" order="3" kernelMatrix="-1 -1 -1 -1 8 -1 -1 -1 -1" preserveAlpha="true" result="e1"/>` +
        `<feConvolveMatrix in="g" order="3" kernelMatrix="1 1 1 1 -8 1 1 1 1" preserveAlpha="true" result="e2"/>` +
        `<feComposite in="e1" in2="e2" operator="arithmetic" k2="1" k3="1" result="e"/>` +
        `<feColorMatrix in="e" type="matrix" values="0 0 0 0 0.22  0 0 0 0 0.22  0 0 0 0 0.26  2.2 2.2 2.2 0 0" result="lines"/>` +
        `<feMorphology in="lines" operator="dilate" radius="0.6" result="lines2"/>` +
        `<feMerge><feMergeNode in="wash"/><feMergeNode in="lines2"/></feMerge></filter>`;
    }
    return "";
  }

  // texturas por cima da cena (abaixo do texto)
  static texture(kind: any, W: any, H: any) {
    if (kind === "paper") return `<filter id="kitTex" x="0" y="0" width="100%" height="100%"><feTurbulence type="fractalNoise" baseFrequency="0.75" numOctaves="2" seed="3"/>` +
      `<feColorMatrix type="matrix" values="0 0 0 0 0.45  0 0 0 0 0.4  0 0 0 0 0.33  0 0 0 -1.6 1.05"/></filter><rect width="${W}" height="${H}" filter="url(#kitTex)" opacity="0.05"/>`;
    if (kind === "fiber") return `<filter id="kitTex" x="0" y="0" width="100%" height="100%"><feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves="2" seed="5" result="f"/>` +
      `<feTurbulence type="fractalNoise" baseFrequency="0.02" numOctaves="3" seed="11" result="m"/><feComposite in="f" in2="m" operator="arithmetic" k2="0.6" k3="0.4" result="mix"/>` +
      `<feColorMatrix in="mix" type="matrix" values="0 0 0 0 0.42  0 0 0 0 0.36  0 0 0 0 0.28  0.5 0 0 0 -0.12"/></filter><rect width="${W}" height="${H}" filter="url(#kitTex)" opacity="0.55"/>`;
    return "";
  }
}
