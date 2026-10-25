import type { Theme } from "@/Protocols/ThemeProtocol.ts";

export const TRANSPORT_NAMES = ["plane", "train", "car", "bus", "boat"] as const;

export type TransportName = (typeof TRANSPORT_NAMES)[number];

export type Point = [number, number];

export interface MapCountry {
  name: string;
  pt: string;
  label: number[];
  area: number;
  polys: number[][][][];
}

export interface RouteStop {
  lon: number;
  lat: number;
  city: string;
  country: MapCountry | null;
}

export interface MapStop extends RouteStop {
  x: number;
  y: number;
}

export interface RouteTransfer {
  fromIndex: number;
  toIndex: number;
  by: TransportName;
}

export interface MapLeg {
  from: MapStop;
  to: MapStop;
  by: TransportName;
}

export interface Box {
  x0: number;
  y0: number;
  x1: number;
  y1: number;
}

export interface CountryBox extends Box {
  kind: "country";
  isVisited: boolean;
  country: MapCountry;
  text: string;
  fontSize: number;
  x: number;
  y: number;
}

export interface ObstacleBox extends Box {
  kind: "badge" | "line" | "pin";
}

export interface CityBox extends Box {
  kind: "city";
  name: string;
  sub: string;
}

export type LabelBox = CountryBox | ObstacleBox | CityBox;

export interface Badge {
  x: number;
  y: number;
  radius: number;
  by: TransportName;
  color: string;
  angle: number;
}

export interface PinGroup extends MapStop {
  numbers: number[];
  direction: 1 | -1;
}

export interface MapFrame {
  theme: Theme;
  width: number;
  height: number;
  panelWidth: number;
  padding: number;
  area: Box;
  pinRadius: number;
}

export type Projector = (lon: number, lat: number) => Point;
