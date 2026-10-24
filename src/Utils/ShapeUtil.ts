export class ShapeUtil {
  static readonly r = (count: any) => Math.round(count * 100) / 100;

  static readonly rad = (darker: any) => (darker * Math.PI) / 180;

  static readonly circle = (cx: any, cy: any, rr: any, fill: any, extra = "") => `<circle cx="${ShapeUtil.r(cx)}" cy="${ShapeUtil.r(cy)}" r="${ShapeUtil.r(rr)}" fill="${fill}" ${extra}/>`;

  static readonly rect = (posX: any, posY: any, width: any, height: any, fill: any, rx = 0, extra = "") => `<rect x="${ShapeUtil.r(posX)}" y="${ShapeUtil.r(posY)}" width="${ShapeUtil.r(width)}" height="${ShapeUtil.r(height)}" rx="${rx}" fill="${fill}" ${extra}/>`;

  static readonly ell = (cx: any, cy: any, rx: any, ry: any, fill: any, extra = "") => `<ellipse cx="${ShapeUtil.r(cx)}" cy="${ShapeUtil.r(cy)}" rx="${ShapeUtil.r(rx)}" ry="${ShapeUtil.r(ry)}" fill="${fill}" ${extra}/>`;

  static readonly shadow = (theme: any, rx: any, ry = 3.5) => ShapeUtil.ell(0, 0, rx, ry, theme.shadow);

  static readonly col = (theme: any, value: any, def: any) => theme[value] || value || def;
}
