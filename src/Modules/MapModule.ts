import type { CompileResult } from "@/Protocols/ResultProtocol.ts";
import { ColorUtil } from "@/Utils/ColorUtil.ts";

// Modo mapa: contornos reais (data/europe.json, extraído uma vez do Natural Earth), projeção cônica
// conforme de Lambert feita aqui mesmo, países destacados, rota com meio de transporte por trecho,
// pinos numerados, rótulos que evitam sobreposição e painel de roteiro.
import europeData from "@/Data/europe.json" with { type: "json" };

export class MapModule {
  private static readonly EUROPE = europeData;

  private static readonly FONT = "Poppins";

  private static readonly f1 = (n: any) => (+n).toFixed(1);

  private static readonly esc = (s: any) => String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;");

  private static readonly norm = (s: any) => String(s).toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "").trim();

  // Cidades (lon, lat) com nomes em português; aceita também `at: [lon, lat]` na cena.
  private static readonly CITIES: Record<string, any> = {
    paris: [2.35, 48.86, "Paris"], roma: [12.5, 41.9, "Roma"], rome: [12.5, 41.9, "Roma"], munique: [11.58, 48.14, "Munique"], munich: [11.58, 48.14, "Munique"],
    salzburgo: [13.04, 47.81, "Salzburgo"], saltzburg: [13.04, 47.81, "Salzburgo"], salzburg: [13.04, 47.81, "Salzburgo"], luxemburgo: [6.13, 49.61, "Luxemburgo"],
    luxembourg: [6.13, 49.61, "Luxemburgo"], milao: [9.19, 45.46, "Milão"], milan: [9.19, 45.46, "Milão"], londres: [-0.13, 51.51, "Londres"],
    madri: [-3.7, 40.42, "Madri"], barcelona: [2.17, 41.39, "Barcelona"], lisboa: [-9.14, 38.72, "Lisboa"], porto: [-8.61, 41.15, "Porto"],
    berlim: [13.4, 52.52, "Berlim"], frankfurt: [8.68, 50.11, "Frankfurt"], hamburgo: [9.99, 53.55, "Hamburgo"], colonia: [6.96, 50.94, "Colônia"],
    viena: [16.37, 48.21, "Viena"], innsbruck: [11.4, 47.27, "Innsbruck"], zurique: [8.54, 47.37, "Zurique"], genebra: [6.14, 46.2, "Genebra"],
    berna: [7.45, 46.95, "Berna"], amsterda: [4.9, 52.37, "Amsterdã"], bruxelas: [4.35, 50.85, "Bruxelas"], praga: [14.42, 50.08, "Praga"],
    budapeste: [19.04, 47.5, "Budapeste"], varsovia: [21.01, 52.23, "Varsóvia"], cracovia: [19.94, 50.06, "Cracóvia"], veneza: [12.32, 45.44, "Veneza"],
    florenca: [11.26, 43.77, "Florença"], napoles: [14.27, 40.85, "Nápoles"], turim: [7.69, 45.07, "Turim"], bolonha: [11.34, 44.49, "Bolonha"],
    nice: [7.27, 43.7, "Nice"], lyon: [4.84, 45.76, "Lyon"], marselha: [5.37, 43.3, "Marselha"], bordeaux: [-0.58, 44.84, "Bordeaux"],
    estrasburgo: [7.75, 48.57, "Estrasburgo"], copenhague: [12.57, 55.68, "Copenhague"], estocolmo: [18.07, 59.33, "Estocolmo"], oslo: [10.75, 59.91, "Oslo"],
    helsinque: [24.94, 60.17, "Helsinque"], dublin: [-6.26, 53.35, "Dublin"], edimburgo: [-3.19, 55.95, "Edimburgo"], atenas: [23.73, 37.98, "Atenas"],
    istambul: [28.98, 41.01, "Istambul"], dubrovnik: [18.09, 42.65, "Dubrovnik"], zagreb: [15.98, 45.81, "Zagreb"], liubliana: [14.51, 46.06, "Liubliana"],
    bratislava: [17.11, 48.15, "Bratislava"], sevilha: [-5.98, 37.39, "Sevilha"], valencia: [-0.38, 39.47, "Valência"], hallstatt: [13.65, 47.56, "Hallstatt"],
    bruges: [3.22, 51.21, "Bruges"], interlaken: [7.86, 46.69, "Interlaken"], como: [9.09, 45.81, "Como"], pisa: [10.4, 43.72, "Pisa"], verona: [10.99, 45.44, "Verona"],
  };

  private static readonly byPt = Object.fromEntries(MapModule.EUROPE.countries.flatMap((c) => [[MapModule.norm(c.pt), c], [MapModule.norm(c.name), c]]));

  // ícones dos meios de transporte (desenhados em ~24 un., centrados)
  private static readonly ICON: Record<string, any> = {
    plane: (c: any) => `<path d="M12 0 Q12 1.6 10 1.6 L3 1.6 L-3 9 L-5.5 9 L-2 1.6 L-7 1.6 L-9 4 L-10.5 4 L-9.5 0.5 Q-11 0 -9.5 -0.5 L-10.5 -4 L-9 -4 L-7 -1.6 L-2 -1.6 L-5.5 -9 L-3 -9 L3 -1.6 L10 -1.6 Q12 -1.6 12 0 Z" fill="${c}"/>`,
    train: (c: any, bg: any) => `<rect x="-7" y="-10" width="14" height="16" rx="4" fill="${c}"/><rect x="-5" y="-8" width="10" height="6" rx="1.5" fill="${bg}"/>`
      + `<circle cx="-3.6" cy="2" r="1.4" fill="${bg}"/><circle cx="3.6" cy="2" r="1.4" fill="${bg}"/><path d="M-5 6 L-8 10 M5 6 L8 10" stroke="${c}" stroke-width="1.8" stroke-linecap="round"/>`,
    car: (c: any, bg: any) => `<path d="M-10 3 L-10 -1 L-7 -2 L-4 -7 L5 -7 L8 -2 L10 -1 L10 3 Z" fill="${c}"/><rect x="-3" y="-6" width="7" height="4" rx="1" fill="${bg}"/><circle cx="-5.5" cy="3.5" r="2.6" fill="${c}" stroke="${bg}" stroke-width="1.2"/><circle cx="5.5" cy="3.5" r="2.6" fill="${c}" stroke="${bg}" stroke-width="1.2"/>`,
    bus: (c: any, bg: any) => `<rect x="-9" y="-9" width="18" height="16" rx="3" fill="${c}"/><rect x="-7" y="-7" width="14" height="6" rx="1" fill="${bg}"/><circle cx="-5" cy="8" r="2" fill="${c}"/><circle cx="5" cy="8" r="2" fill="${c}"/>`,
    boat: (c: any) => `<path d="M-11 1 L11 1 L7 7 L-7 7 Z" fill="${c}"/><path d="M0 1 L0 -10 L8 -1 Z" fill="${c}"/>`,
  };

  private static readonly TRANSPORT_PT: Record<string, any> = { plane: "avião", train: "trem", car: "carro", bus: "ônibus", boat: "barco" };

  private static readonly TRANSPORT_ALIAS: Record<string, any> = { aviao: "plane", avião: "plane", voo: "plane", trem: "train", carro: "car", onibus: "bus", ônibus: "bus", barco: "boat", navio: "boat", ferry: "boat" };

  private static lambert(lon0 = 10, lat0 = 50, p1 = 43, p2 = 62) {
    const r = Math.PI / 180, q = (p: any) => Math.tan(Math.PI / 4 + (p * r) / 2);
    const n = Math.log(Math.cos(p1 * r) / Math.cos(p2 * r)) / Math.log(q(p2) / q(p1));
    const F = (Math.cos(p1 * r) * q(p1) ** n) / n, rho = (p: any) => F / q(p) ** n, rho0 = rho(lat0);
    return ([lon, lat]: number[]) => { const th = n * (lon - lon0) * r, rh = rho(lat); return [rh * Math.sin(th), -(rho0 - rh * Math.cos(th))]; };
  }

  static compileMap(scene: any, { theme: t, warnings, W, H, contrast }: any): CompileResult {
    const c = scene.canvas || {}, m = scene.map || {};
    const panelOn = m.panel !== false;
    const PW = panelOn ? Math.round(W * 0.28) : 0, PAD = W * 0.025;
    const area = { x0: PAD, y0: PAD, x1: W - PW - PAD * (panelOn ? 1.6 : 1), y1: H - PAD };

    // ---------- rota ----------
    const stops: any[] = [], legs: any[] = [];
    let pendingBy = null;
    for (const [i, item] of (scene.route || []).entries()) {
      if (item.by) {
        const by = MapModule.TRANSPORT_ALIAS[MapModule.norm(item.by)] || item.by;
        if (!MapModule.ICON[by]) { warnings.push(`transport '${item.by}' is unknown (use plane, train, car, bus or boat)`); }
        pendingBy = by; continue;
      }
      const key = MapModule.norm(item.city || "");
      const g = item.at ? [item.at[0], item.at[1], item.city] : MapModule.CITIES[key.replace(/\s+/g, "")];
      if (!g) { warnings.push(`city '${item.city}' is not in the dictionary; set 'at: [lon, lat]'`); continue; }
      const country = item.country ? MapModule.byPt[MapModule.norm(item.country)] : null;
      if (item.country && !country) { warnings.push(`country '${item.country}' not found on the map`); }
      const stop = { i, lon: g[0], lat: g[1], city: item.label || g[2] || item.city, country, note: item.note };
      if (stops.length) { legs.push({ a: stops[stops.length - 1], b: stop, by: pendingBy || "car" }); }
      if (stops.length && !pendingBy) { warnings.push(`leg to '${stop.city}' has no transport; used car (add '- {by: ...}')`); }
      pendingBy = null;
      stops.push(stop);
    }
    if (stops.length < 2) { warnings.push("the route needs at least 2 cities"); }

    // ---------- projeção e enquadramento ----------
    const lon0 = m.center?.[0] ?? (stops.reduce((s, p) => s + p.lon, 0) / (stops.length || 1));
    const lat0 = m.center?.[1] ?? (stops.reduce((s, p) => s + p.lat, 0) / (stops.length || 1));
    const P = MapModule.lambert(lon0, lat0);
    const padDeg = m.padding ?? 3.5;
    const lons = stops.map((s) => s.lon), lats = stops.map((s) => s.lat);
    const [a0, a1, b0, b1] = m.bounds || [Math.min(...lons) - padDeg, Math.max(...lons) + padDeg, Math.min(...lats) - padDeg * 0.8, Math.max(...lats) + padDeg * 0.8];
    const frame: any[] = [];
    for (let k = 0; k <= 10; k++) { frame.push(P([a0 + (a1 - a0) * k / 10, b0]), P([a0 + (a1 - a0) * k / 10, b1]), P([a0, b0 + (b1 - b0) * k / 10]), P([a1, b0 + (b1 - b0) * k / 10])); }
    const fx0 = Math.min(...frame.map((p) => p[0])), fx1 = Math.max(...frame.map((p) => p[0]));
    const fy0 = Math.min(...frame.map((p) => p[1])), fy1 = Math.max(...frame.map((p) => p[1]));
    const aw = area.x1 - area.x0, ah = area.y1 - area.y0;
    const k = Math.min(aw / (fx1 - fx0), ah / (fy1 - fy0));
    const ox = area.x0 + (aw - (fx1 - fx0) * k) / 2 - fx0 * k, oy = area.y0 + (ah - (fy1 - fy0) * k) / 2 - fy0 * k;
    const proj = (lon: any, lat: any) => { const [x, y] = P([lon, lat]); return [ox + x * k, oy + y * k]; };
    stops.forEach((s) => { [s.x, s.y] = proj(s.lon, s.lat); });

    // ---------- países ----------
    const visited: any[] = [];
    for (const s of stops) { if (s.country && !visited.includes(s.country)) { visited.push(s.country); } }
    for (const name of m.highlight || []) { const cc = MapModule.byPt[MapModule.norm(name)]; if (cc && !visited.includes(cc)) { visited.push(cc); } }
    const palette = m.palette || ["#9DB8F0", "#F7C98A", "#9ED39A", "#E9A0B4", "#B9A3E3", "#8FD3D1", "#F2A68F", "#D8C27A"];
    const colorOf = new Map(visited.map((cc, i) => [cc, palette[i % palette.length]]));
    const sea = ColorUtil.sh(t.glass, 0.25), land = ColorUtil.sh(t.paper, -0.05), border = "#FFFFFF";
    const toPath = (polys: any) => polys.map((poly: any) => {
      const rings = poly.map((ring: any) => ring.map(([lo, la]: number[]) => proj(lo, la)));
      const xs = rings[0].map((p: any) => p[0]), ys = rings[0].map((p: any) => p[1]);
      if (Math.max(...xs) < -50 || Math.min(...xs) > W + 50 || Math.max(...ys) < -50 || Math.min(...ys) > H + 50) { return ""; }
      return rings.map((r: any) => "M" + r.map((p: any) => p[0].toFixed(1) + " " + p[1].toFixed(1)).join("L") + "Z").join("");
    }).join("");

    let mapSvg = `<rect x="0" y="0" width="${W}" height="${H}" fill="${sea}"/>`;
    // ondas sutis no mar
    for (let yy = 30; yy < H; yy += 46) { for (let xx = (yy / 46 % 2) * 40 + 20; xx < W - PW; xx += 90) { mapSvg += `<path d="M${xx} ${yy} q8 -4 16 0 t16 0" stroke="${ColorUtil.sh(sea, -0.1)}" stroke-width="1.5" fill="none" opacity="0.5"/>`; } }
    // graticule leve
    let grat = "";
    // só os trechos visíveis (caminhos muito fora do quadro derrubam o renderizador)
    const inView = (p: any) => p[0] > -60 && p[0] < W + 60 && p[1] > -60 && p[1] < H + 60;
    const gline = (pts: any) => { const v = pts.filter(inView); return v.length > 1 ? `<path d="M${v.map((p: any) => p.map(MapModule.f1).join(" ")).join("L")}" stroke="${t.paper}" stroke-width="0.8" fill="none" opacity="0.35"/>` : ""; };
    for (let lo = -30; lo <= 50; lo += 5) { const pts: any[] = []; for (let la = 30; la <= 72; la += 1) { pts.push(proj(lo, la)); } grat += gline(pts); }
    for (let la = 30; la <= 72; la += 5) { const pts: any[] = []; for (let lo = -30; lo <= 50; lo += 1) { pts.push(proj(lo, la)); } grat += gline(pts); }
    mapSvg += grat;
    const others = MapModule.EUROPE.countries.filter((cc) => !colorOf.has(cc));
    mapSvg += `<g stroke="${border}" stroke-width="1" stroke-linejoin="round">` + others.map((cc) => `<path d="${toPath(cc.polys)}" fill="${land}"/>`).join("") + "</g>";
    // países visitados "levantados" (sombra deslocada + borda)
    for (const cc of visited) {
      const d = toPath(cc.polys), col = colorOf.get(cc);
      mapSvg += `<path d="${d}" fill="${ColorUtil.sh(col, -0.35)}" transform="translate(0 4)" opacity="0.55"/><path d="${d}" fill="${col}" stroke="${ColorUtil.sh(col, -0.3)}" stroke-width="1.6" stroke-linejoin="round"/>`;
    }

    // ---------- rótulos dos países ----------
    const occupied: any[] = []; // caixas já usadas (para evitar sobreposição)
    const ov = (a: any, b: any) => Math.max(0, Math.min(a.x1, b.x1) - Math.max(a.x0, b.x0)) * Math.max(0, Math.min(a.y1, b.y1) - Math.max(a.y0, b.y0));
    const inArea = (b: any) => b.x0 >= area.x0 && b.x1 <= area.x1 && b.y0 >= area.y0 && b.y1 <= area.y1;
    let countryLabels = "";
    const fsC = Math.max(12, H * 0.017);
    for (const cc of MapModule.EUROPE.countries) {
      const isV = colorOf.has(cc); if (!isV && cc.area < 0.004) { continue; }
      const [lx, ly] = proj(cc.label[0], cc.label[1]); const fs = isV ? fsC * 1.05 : fsC * 0.9;
      const txt = (isV ? cc.pt.toUpperCase() : cc.pt), w = txt.length * fs * (isV ? 0.66 : 0.58);
      const b = { x0: lx - w / 2, x1: lx + w / 2, y0: ly - fs, y1: ly + fs * 0.3, kind: "country", visited: isV, cc, txt, fs, lx, ly };
      if (!inArea(b)) { continue; }
      occupied.push(b);
    }

    // ---------- trechos ----------
    const legSvg: any[] = [], badges: any[] = [];
    const pairCount = new Map();
    legs.forEach((L, idx) => {
      const { a, b } = L;
      const dx = b.x - a.x, dy = b.y - a.y, len = Math.hypot(dx, dy) || 1;
      const key = [a.city, b.city].sort().join("|");
      const nth = pairCount.get(key) || 0; pairCount.set(key, nth + 1);
      const short = len < Math.max(13, H * 0.019) * 6;
      L.short = short;
      const bulge = short ? Math.max(26, len * 0.5) : (L.by === "plane" ? 0.22 : 0.12) * len + (nth ? 8 : 0);
      const nx = -dy / len, ny = dx / len; // perpendicular (inverte com o sentido, então ida e volta ficam em lados opostos)
      const cx = (a.x + b.x) / 2 + nx * bulge, cy = (a.y + b.y) / 2 + ny * bulge;
      const pt = (u: any) => [(1 - u) ** 2 * a.x + 2 * (1 - u) * u * cx + u * u * b.x, (1 - u) ** 2 * a.y + 2 * (1 - u) * u * cy + u * u * b.y];
      const tan = (u: any) => [2 * (1 - u) * (cx - a.x) + 2 * u * (b.x - cx), 2 * (1 - u) * (cy - a.y) + 2 * u * (b.y - cy)];
      const d = `M${MapModule.f1(a.x)} ${MapModule.f1(a.y)} Q${MapModule.f1(cx)} ${MapModule.f1(cy)} ${MapModule.f1(b.x)} ${MapModule.f1(b.y)}`;
      const col = L.by === "plane" ? t.primary : L.by === "train" ? t.secondary : t.accent;
      let s = "";
      if (L.by === "train") { s += `<path d="${d}" stroke="${col}" stroke-width="7" fill="none" stroke-linecap="round"/><path d="${d}" stroke="${t.paper}" stroke-width="2.6" fill="none" stroke-dasharray="7 6"/>`; } else if (L.by === "plane") { s += `<path d="${d}" stroke="${t.paper}" stroke-width="6.5" fill="none" stroke-linecap="round" opacity="0.8"/><path d="${d}" stroke="${col}" stroke-width="3.2" fill="none" stroke-dasharray="10 7" stroke-linecap="round"/>`; } else { s += `<path d="${d}" stroke="${col}" stroke-width="4" fill="none" stroke-linecap="round"/>`; }
      // seta de sentido
      const [axp, ayp] = pt(0.78), [tx, ty] = tan(0.78), ang = Math.atan2(ty, tx) * 180 / Math.PI;
      s += `<path d="M-6 -6 L4 0 L-6 6" transform="translate(${MapModule.f1(axp)} ${MapModule.f1(ayp)}) rotate(${MapModule.f1(ang)})" stroke="${col}" stroke-width="3.2" fill="none" stroke-linecap="round" stroke-linejoin="round"/>`;
      legSvg.push(s);
      // selo do transporte no meio do trecho
      const [mx, my] = pt(0.5), [ux, uy] = tan(0.5), mang = Math.atan2(uy, ux) * 180 / Math.PI;
      const r = Math.max(13, H * 0.019) * (short ? 0.72 : 1);
      // em trechos curtos o selo vai para fora da curva, longe dos pinos
      const bx = short ? mx + nx * r * 1.6 : mx, by2 = short ? my + ny * r * 1.6 : my;
      badges.push({ x: bx, y: by2, r, by: L.by, col, ang: mang, idx });
      occupied.push({ x0: bx - r, x1: bx + r, y0: by2 - r, y1: by2 + r, kind: "badge" });
      for (let u = 0.08; u < 0.95; u += 0.06) { const [qx, qy] = pt(u); occupied.push({ x0: qx - 4, x1: qx + 4, y0: qy - 4, y1: qy + 4, kind: "line" }); }
    });

    // ---------- pinos ----------
    const groups: any[] = [];
    for (const [n, s] of stops.entries()) {
      const g = groups.find((gg) => Math.hypot(gg.x - s.x, gg.y - s.y) < 2);
      if (g) { g.nums.push(n + 1); } else { groups.push({ ...s, nums: [n + 1] }); }
    }
    const pinR = Math.max(11, H * 0.016);
    // números extras de uma mesma cidade vão para o lado com mais espaço
    for (const g of groups) {
      const right = groups.some((o) => o !== g && o.x > g.x && o.x - g.x < pinR * 6 && Math.abs(o.y - g.y) < pinR * 3);
      g.dir = right ? -1 : 1;
    }
    for (const g of groups) { const ext = (g.nums.length - 1) * pinR * 1.6; occupied.push({ x0: g.x - pinR - (g.dir < 0 ? ext : 0), x1: g.x + pinR + (g.dir > 0 ? ext : 0), y0: g.y - pinR, y1: g.y + pinR, kind: "pin" }); }

    // rótulos das cidades: escolhe a posição com menos sobreposição
    const cityLabels: any[] = [];
    const fsCity = Math.max(14, H * 0.021);
    for (const g of groups) {
      const name = g.city, sub = g.country ? g.country.pt : "";
      const w = Math.max(name.length * fsCity * 0.6, sub.length * fsCity * 0.45) + fsCity * 1.2, h = fsCity * (sub ? 2.35 : 1.6);
      const ext = (g.nums.length - 1) * pinR * 1.6, offR = pinR + (g.dir > 0 ? ext : 0) + 8, offL = pinR + (g.dir < 0 ? ext : 0) + 8;
      const offX = offR;
      const cands = [[g.x + offR, g.y - h / 2], [g.x - offL - w, g.y - h / 2], [g.x - w / 2, g.y - pinR - 10 - h], [g.x - w / 2, g.y + pinR + 10],
        [g.x + offX, g.y - h - 6], [g.x - pinR - 8 - w, g.y - h - 6], [g.x + offX, g.y + 6], [g.x - pinR - 8 - w, g.y + 6]];
      let best: any = null, bs = Infinity;
      for (const [x0, y0] of cands) {
        const b = { x0, y0, x1: x0 + w, y1: y0 + h };
        let sc = inArea(b) ? 0 : 1e7;
        for (const o of occupied) { sc += ov(b, o) * (o.kind === "city" ? 6 : o.kind === "pin" ? 5 : o.kind === "badge" ? 4 : o.kind === "line" ? 3 : o.visited ? 1.5 : 0.6); }
        if (sc < bs) { bs = sc; best = b; }
      }
      if (bs > 0.12 * w * h) { warnings.push(`label of city '${name}' overlaps (${Math.round(bs / (w * h) * 100)}%); adjust the map 'padding' or use 'label_side'`); }
      best.kind = "city"; best.name = name; best.sub = sub; best.g = g;
      occupied.push(best); cityLabels.push(best);
    }

    // rótulos de países que não colidem com elementos da rota
    for (const b of occupied.filter((o) => o.kind === "country")) {
      const hit = occupied.some((o) => o !== b && o.kind !== "country" && o.kind !== "line" && ov(b, o) > 0.02 * (b.x1 - b.x0) * (b.y1 - b.y0));
      if (hit && (!b.visited || b.cc.area < 0.002)) { continue; }
      let moved = !hit;
      let { lx, ly } = b;
      if (hit) { // tenta deslocar o nome do país visitado
        for (const [ddx, ddy] of [[0, 30], [0, -30], [40, 0], [-40, 0], [0, 55], [0, -55]]) {
          const nb = { x0: b.x0 + ddx, x1: b.x1 + ddx, y0: b.y0 + ddy, y1: b.y1 + ddy };
          if (!occupied.some((o) => o !== b && o.kind !== "country" && o.kind !== "line" && ov(nb, o) > 0)) { lx += ddx; ly += ddy; moved = true; break; }
        }
      }
      if (!moved) { continue; }
      countryLabels += b.visited
        ? `<text x="${MapModule.f1(lx)}" y="${MapModule.f1(ly)}" font-family="${MapModule.FONT}" font-weight="700" font-size="${MapModule.f1(b.fs)}" letter-spacing="2" fill="${ColorUtil.sh(colorOf.get(b.cc), -0.55)}" text-anchor="middle" opacity="0.8">${MapModule.esc(b.txt)}</text>`
        : `<text x="${MapModule.f1(lx)}" y="${MapModule.f1(ly)}" font-family="${MapModule.FONT}" font-weight="500" font-size="${MapModule.f1(b.fs)}" fill="${ColorUtil.sh(land, -0.4)}" text-anchor="middle">${MapModule.esc(b.txt)}</text>`;
    }

    // ---------- desenho de selos, pinos e rótulos ----------
    const badgeSvg = badges.map((bd) => {
      const rot = bd.by === "plane" ? ` rotate(${MapModule.f1(bd.ang)})` : "";
      const s = bd.r / 14;
      return `<circle cx="${MapModule.f1(bd.x)}" cy="${MapModule.f1(bd.y + 2)}" r="${MapModule.f1(bd.r)}" fill="${t.ink}" opacity="0.18"/><circle cx="${MapModule.f1(bd.x)}" cy="${MapModule.f1(bd.y)}" r="${MapModule.f1(bd.r)}" fill="${t.paper}" stroke="${bd.col}" stroke-width="2.5"/>`
        + `<g transform="translate(${MapModule.f1(bd.x)} ${MapModule.f1(bd.y)})${rot} scale(${s.toFixed(3)})">${MapModule.ICON[bd.by] ? MapModule.ICON[bd.by](bd.col, t.paper) : ""}</g>`;
    }).join("");
    const pinSvg = groups.map((g: any) => g.nums.map((n: any, j: any) => {
      const x = g.x + g.dir * j * pinR * 1.6, last = n === stops.length, first = n === 1;
      const col = last ? t.accent : first ? t.secondary : t.primary;
      return `<circle cx="${MapModule.f1(x)}" cy="${MapModule.f1(g.y + 2.5)}" r="${MapModule.f1(pinR)}" fill="${t.ink}" opacity="0.2"/><circle cx="${MapModule.f1(x)}" cy="${MapModule.f1(g.y)}" r="${MapModule.f1(pinR)}" fill="${col}" stroke="${t.paper}" stroke-width="2.5"/>`
        + `<text x="${MapModule.f1(x)}" y="${MapModule.f1(g.y + pinR * 0.4)}" font-family="${MapModule.FONT}" font-weight="700" font-size="${MapModule.f1(pinR * 1.15)}" fill="${t.paper}" text-anchor="middle">${n}</text>`;
    }).join("")).join("");
    const cityLabelSvg = cityLabels.map((b) => `<rect x="${MapModule.f1(b.x0 + 1.5)}" y="${MapModule.f1(b.y0 + 2.5)}" width="${MapModule.f1(b.x1 - b.x0)}" height="${MapModule.f1(b.y1 - b.y0)}" rx="8" fill="${t.ink}" opacity="0.14"/>`
      + `<rect x="${MapModule.f1(b.x0)}" y="${MapModule.f1(b.y0)}" width="${MapModule.f1(b.x1 - b.x0)}" height="${MapModule.f1(b.y1 - b.y0)}" rx="8" fill="${t.paper}"/>`
      + `<text x="${MapModule.f1(b.x0 + fsCity * 0.6)}" y="${MapModule.f1(b.y0 + fsCity * 1.15)}" font-family="${MapModule.FONT}" font-weight="700" font-size="${MapModule.f1(fsCity)}" fill="${t.text === t.paper ? t.ink : t.text}">${MapModule.esc(b.name)}</text>`
      + (b.sub ? `<text x="${MapModule.f1(b.x0 + fsCity * 0.6)}" y="${MapModule.f1(b.y0 + fsCity * 1.95)}" font-family="${MapModule.FONT}" font-weight="500" font-size="${MapModule.f1(fsCity * 0.68)}" fill="${ColorUtil.sh(t.ink, 0.35)}">${MapModule.esc(b.sub)}</text>` : "")).join("");

    // ---------- painel do roteiro ----------
    let panel = "";
    if (panelOn) {
      const px = W - PW - PAD * 0.6, py = PAD, ph = H - PAD * 2;
      panel += `<rect x="${MapModule.f1(px + 3)}" y="${MapModule.f1(py + 5)}" width="${PW}" height="${MapModule.f1(ph)}" rx="18" fill="${t.ink}" opacity="0.15"/><rect x="${MapModule.f1(px)}" y="${MapModule.f1(py)}" width="${PW}" height="${MapModule.f1(ph)}" rx="18" fill="${t.paper}"/>`;
      const title = (scene.text || []).find((x: any) => (x.role || "title") === "title")?.content || "Roteiro";
      const subtitle = (scene.text || []).find((x: any) => x.role === "subtitle")?.content;
      const tfs = H * 0.034;
      const words = title.split(" "); const lines: any[] = []; let cur = "";
      for (const wd of words) { if ((cur + " " + wd).trim().length * tfs * 0.58 > PW - 44) { lines.push(cur.trim()); cur = wd; } else { cur += " " + wd; } }
      lines.push(cur.trim());
      let yy = py + 28 + tfs;
      for (const ln of lines) { panel += `<text x="${MapModule.f1(px + 24)}" y="${MapModule.f1(yy)}" font-family="${MapModule.FONT}" font-weight="700" font-size="${MapModule.f1(tfs)}" fill="${t.text === t.paper ? t.ink : t.text}">${MapModule.esc(ln)}</text>`; yy += tfs * 1.15; }
      if (subtitle) { panel += `<text x="${MapModule.f1(px + 24)}" y="${MapModule.f1(yy + 2)}" font-family="${MapModule.FONT}" font-weight="500" font-size="${MapModule.f1(tfs * 0.5)}" fill="${ColorUtil.sh(t.ink, 0.4)}">${MapModule.esc(subtitle)}</text>`; yy += tfs * 0.9; }
      yy += 16;
      const stepH = Math.min(H * 0.072, (py + ph - yy - 70) / Math.max(1, stops.length));
      const rr = Math.min(pinR, stepH * 0.3);
      stops.forEach((s, n) => {
        const cy = yy + n * stepH + rr, last = n === stops.length - 1, first = n === 0;
        const col = last ? t.accent : first ? t.secondary : t.primary;
        if (n < legs.length) {
          const L = legs[n], lc = L.by === "plane" ? t.primary : L.by === "train" ? t.secondary : t.accent;
          panel += `<path d="M${MapModule.f1(px + 24 + rr)} ${MapModule.f1(cy + rr)} L${MapModule.f1(px + 24 + rr)} ${MapModule.f1(cy + stepH - rr)}" stroke="${lc}" stroke-width="3" ${L.by === "plane" ? "stroke-dasharray=\"5 4\"" : ""}/>`;
          panel += `<g transform="translate(${MapModule.f1(px + 24 + rr * 2 + 22)} ${MapModule.f1(cy + stepH / 2)}) scale(${(rr / 15).toFixed(3)})">${MapModule.ICON[L.by] ? MapModule.ICON[L.by](lc, t.paper) : ""}</g>`
            + `<text x="${MapModule.f1(px + 24 + rr * 2 + 38)}" y="${MapModule.f1(cy + stepH / 2 + 4)}" font-family="${MapModule.FONT}" font-size="${MapModule.f1(rr * 0.85)}" fill="${ColorUtil.sh(t.ink, 0.4)}">${MapModule.TRANSPORT_PT[L.by] || L.by}</text>`;
        }
        panel += `<circle cx="${MapModule.f1(px + 24 + rr)}" cy="${MapModule.f1(cy)}" r="${MapModule.f1(rr)}" fill="${col}"/><text x="${MapModule.f1(px + 24 + rr)}" y="${MapModule.f1(cy + rr * 0.4)}" font-family="${MapModule.FONT}" font-weight="700" font-size="${MapModule.f1(rr * 1.1)}" fill="${t.paper}" text-anchor="middle">${n + 1}</text>`
          + `<text x="${MapModule.f1(px + 24 + rr * 2 + 12)}" y="${MapModule.f1(cy + rr * 0.42)}" font-family="${MapModule.FONT}" font-weight="600" font-size="${MapModule.f1(rr * 1.15)}" fill="${t.text === t.paper ? t.ink : t.text}">${MapModule.esc(s.city)}${s.country ? `<tspan dx="${MapModule.f1(rr * 0.6)}" font-weight="400" fill="${ColorUtil.sh(t.ink, 0.4)}">${MapModule.esc(s.country.pt)}</tspan>` : ""}</text>`;
      });
      // legenda
      const usedBy = [...new Set(legs.map((l) => l.by))];
      let lx = px + 24; const ly = py + ph - 26;
      panel += `<path d="M${MapModule.f1(px + 20)} ${MapModule.f1(ly - 26)} L${MapModule.f1(px + PW - 20)} ${MapModule.f1(ly - 26)}" stroke="${ColorUtil.sh(t.paper, -0.12)}" stroke-width="1.5"/>`;
      for (const by of usedBy) {
        const lc = by === "plane" ? t.primary : by === "train" ? t.secondary : t.accent;
        panel += (by === "train"
          ? `<path d="M${MapModule.f1(lx)} ${MapModule.f1(ly - 5)} L${MapModule.f1(lx + 30)} ${MapModule.f1(ly - 5)}" stroke="${lc}" stroke-width="6"/><path d="M${MapModule.f1(lx)} ${MapModule.f1(ly - 5)} L${MapModule.f1(lx + 30)} ${MapModule.f1(ly - 5)}" stroke="${t.paper}" stroke-width="2" stroke-dasharray="5 4"/>`
          : `<path d="M${MapModule.f1(lx)} ${MapModule.f1(ly - 5)} L${MapModule.f1(lx + 30)} ${MapModule.f1(ly - 5)}" stroke="${lc}" stroke-width="3" stroke-dasharray="7 5"/>`)
        + `<text x="${MapModule.f1(lx + 38)}" y="${MapModule.f1(ly)}" font-family="${MapModule.FONT}" font-size="${MapModule.f1(H * 0.016)}" fill="${ColorUtil.sh(t.ink, 0.3)}">${MapModule.TRANSPORT_PT[by] || by}</text>`;
        lx += 38 + (MapModule.TRANSPORT_PT[by] || by).length * H * 0.011 + 26;
      }
    }

    const source = `<text x="${MapModule.f1(area.x0 + 4)}" y="${MapModule.f1(H - 8)}" font-family="${MapModule.FONT}" font-size="10" fill="${ColorUtil.sh(sea, -0.45)}">Contornos: Natural Earth (domínio público)</text>`;
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">\n${mapSvg}\n${countryLabels}\n${legSvg.join("\n")}\n${badgeSvg}\n${pinSvg}\n${cityLabelSvg}\n${panel}\n${source}\n</svg>`;
    const description = [
      ...stops.map((s, n) => `${n + 1}. ${s.city}${s.country ? " (" + s.country.pt + ")" : ""}: screen (${Math.round(s.x / W * 100)}%, ${Math.round(s.y / H * 100)}%)`),
      ...legs.map((l) => `${l.a.city} → ${l.b.city}: ${l.by}`),
      `highlighted countries: ${visited.map((v) => v.pt).join(", ")}`,
    ].join("\n");
    return { svg, warnings: [...new Set<string>(warnings)], description };
  }
}
