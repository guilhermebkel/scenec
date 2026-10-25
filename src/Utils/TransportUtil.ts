import { TRANSPORT_NAMES, type TransportName } from "@/Protocols/MapProtocol.ts";
import type { Theme } from "@/Protocols/ThemeProtocol.ts";
import { IdUtil } from "@/Utils/IdUtil.ts";
import { NormalizeUtil } from "@/Utils/NormalizeUtil.ts";

type TransportAlias = "aviao" | "voo" | "trem" | "carro" | "onibus" | "barco" | "navio" | "ferry";

type IconDrawer = (color: string, background: string) => string;

type StrokeDrawer = (path: string, color: string, paper: string) => string;

export class TransportUtil {
  private static readonly NAME_TO_PORTUGUESE: Record<TransportName, string> = {
    plane: "avião", train: "trem", car: "carro", bus: "ônibus", boat: "barco",
  };

  private static readonly ALIAS_TO_NAME: Record<TransportAlias, TransportName> = {
    aviao: "plane", voo: "plane", trem: "train", carro: "car", onibus: "bus", barco: "boat", navio: "boat", ferry: "boat",
  };

  private static readonly NAME_TO_ICON: Record<TransportName, IconDrawer> = {
    plane: (color) => `<path d="M12 0 Q12 1.6 10 1.6 L3 1.6 L-3 9 L-5.5 9 L-2 1.6 L-7 1.6 L-9 4 L-10.5 4 L-9.5 0.5 Q-11 0 -9.5 -0.5 L-10.5 -4 L-9 -4 L-7 -1.6 L-2 -1.6 L-5.5 -9 L-3 -9 L3 -1.6 L10 -1.6 Q12 -1.6 12 0 Z" fill="${color}"/>`,
    train: (color, background) => `<rect x="-7" y="-10" width="14" height="16" rx="4" fill="${color}"/><rect x="-5" y="-8" width="10" height="6" rx="1.5" fill="${background}"/>`
      + `<circle cx="-3.6" cy="2" r="1.4" fill="${background}"/><circle cx="3.6" cy="2" r="1.4" fill="${background}"/><path d="M-5 6 L-8 10 M5 6 L8 10" stroke="${color}" stroke-width="1.8" stroke-linecap="round"/>`,
    car: (color, background) => `<path d="M-10 3 L-10 -1 L-7 -2 L-4 -7 L5 -7 L8 -2 L10 -1 L10 3 Z" fill="${color}"/><rect x="-3" y="-6" width="7" height="4" rx="1" fill="${background}"/><circle cx="-5.5" cy="3.5" r="2.6" fill="${color}" stroke="${background}" stroke-width="1.2"/><circle cx="5.5" cy="3.5" r="2.6" fill="${color}" stroke="${background}" stroke-width="1.2"/>`,
    bus: (color, background) => `<rect x="-9" y="-9" width="18" height="16" rx="3" fill="${color}"/><rect x="-7" y="-7" width="14" height="6" rx="1" fill="${background}"/><circle cx="-5" cy="8" r="2" fill="${color}"/><circle cx="5" cy="8" r="2" fill="${color}"/>`,
    boat: (color) => `<path d="M-11 1 L11 1 L7 7 L-7 7 Z" fill="${color}"/><path d="M0 1 L0 -10 L8 -1 Z" fill="${color}"/>`,
  };

  private static readonly NAME_TO_COLOR_ROLE: Record<TransportName, "primary" | "secondary" | "accent"> = {
    plane: "primary", train: "secondary", car: "accent", bus: "accent", boat: "accent",
  };

  private static readonly NAME_TO_BULGE_SHARE: Record<TransportName, number> = {
    plane: 0.22, train: 0.12, car: 0.12, bus: 0.12, boat: 0.12,
  };

  private static readonly NAME_TO_ROTATES_BADGE: Record<TransportName, boolean> = {
    plane: true, train: false, car: false, bus: false, boat: false,
  };

  private static readonly NAME_TO_DASH: Record<TransportName, string> = {
    plane: "stroke-dasharray=\"5 4\"", train: "", car: "", bus: "", boat: "",
  };

  private static readonly NAME_TO_ROUTE_STROKE: Record<TransportName, StrokeDrawer> = {
    plane: (path, color, paper) => `<path d="${path}" stroke="${paper}" stroke-width="6.5" fill="none" stroke-linecap="round" opacity="0.8"/>`
      + `<path d="${path}" stroke="${color}" stroke-width="3.2" fill="none" stroke-dasharray="10 7" stroke-linecap="round"/>`,
    train: (path, color, paper) => `<path d="${path}" stroke="${color}" stroke-width="7" fill="none" stroke-linecap="round"/>`
      + `<path d="${path}" stroke="${paper}" stroke-width="2.6" fill="none" stroke-dasharray="7 6"/>`,
    car: (path, color) => TransportUtil.plainStroke(path, color),
    bus: (path, color) => TransportUtil.plainStroke(path, color),
    boat: (path, color) => TransportUtil.plainStroke(path, color),
  };

  private static readonly NAME_TO_LEGEND_STROKE: Record<TransportName, StrokeDrawer> = {
    plane: (path, color) => TransportUtil.dashedLegend(path, color),
    train: (path, color, paper) => `<path d="${path}" stroke="${color}" stroke-width="6"/>`
      + `<path d="${path}" stroke="${paper}" stroke-width="2" stroke-dasharray="5 4"/>`,
    car: (path, color) => TransportUtil.dashedLegend(path, color),
    bus: (path, color) => TransportUtil.dashedLegend(path, color),
    boat: (path, color) => TransportUtil.dashedLegend(path, color),
  };

  static parse(text: string): TransportName | undefined {
    const key = NormalizeUtil.key(text);
    return IdUtil.lookup(TransportUtil.ALIAS_TO_NAME, key) ?? (IdUtil.isOneOf(TRANSPORT_NAMES, key) ? key : undefined);
  }

  static portuguese(by: TransportName): string {
    return TransportUtil.NAME_TO_PORTUGUESE[by];
  }

  static color(by: TransportName, theme: Theme): string {
    return theme[TransportUtil.NAME_TO_COLOR_ROLE[by]];
  }

  static bulgeShare(by: TransportName): number {
    return TransportUtil.NAME_TO_BULGE_SHARE[by];
  }

  static rotatesBadge(by: TransportName): boolean {
    return TransportUtil.NAME_TO_ROTATES_BADGE[by];
  }

  static panelDash(by: TransportName): string {
    return TransportUtil.NAME_TO_DASH[by];
  }

  static routeStroke(by: TransportName, path: string, color: string, paper: string): string {
    return TransportUtil.NAME_TO_ROUTE_STROKE[by](path, color, paper);
  }

  static legendStroke(by: TransportName, path: string, color: string, paper: string): string {
    return TransportUtil.NAME_TO_LEGEND_STROKE[by](path, color, paper);
  }

  static icon(by: TransportName, color: string, background: string): string {
    return TransportUtil.NAME_TO_ICON[by](color, background);
  }

  private static plainStroke(path: string, color: string): string {
    return `<path d="${path}" stroke="${color}" stroke-width="4" fill="none" stroke-linecap="round"/>`;
  }

  private static dashedLegend(path: string, color: string): string {
    return `<path d="${path}" stroke="${color}" stroke-width="3" stroke-dasharray="7 5"/>`;
  }
}
