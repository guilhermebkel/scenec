export class ShapeUtil {
  static readonly r = (n: any) => Math.round(n * 100) / 100;

  static readonly rad = (d: any) => (d * Math.PI) / 180;

  static readonly circle = (cx: any, cy: any, rr: any, fill: any, extra = "") => `<circle cx="${ShapeUtil.r(cx)}" cy="${ShapeUtil.r(cy)}" r="${ShapeUtil.r(rr)}" fill="${fill}" ${extra}/>`;

  static readonly rect = (x: any, y: any, w: any, h: any, fill: any, rx = 0, extra = "") => `<rect x="${ShapeUtil.r(x)}" y="${ShapeUtil.r(y)}" width="${ShapeUtil.r(w)}" height="${ShapeUtil.r(h)}" rx="${rx}" fill="${fill}" ${extra}/>`;

  static readonly ell = (cx: any, cy: any, rx: any, ry: any, fill: any, extra = "") => `<ellipse cx="${ShapeUtil.r(cx)}" cy="${ShapeUtil.r(cy)}" rx="${ShapeUtil.r(rx)}" ry="${ShapeUtil.r(ry)}" fill="${fill}" ${extra}/>`;

  static readonly shadow = (t: any, rx: any, ry = 3.5) => ShapeUtil.ell(0, 0, rx, ry, t.shadow);

  static readonly col = (t: any, v: any, def: any) => t[v] || v || def;
}
