export interface Theme {
  skyTop: string;
  skyBottom: string;
  ground: string;
  groundDark: string;
  wall: string;
  floor: string;
  sea?: string;
  seaLight?: string;
  primary: string;
  secondary: string;
  accent: string;
  foliage: [string, string, string];
  trunk: string;
  wood: string;
  woodDark: string;
  ink: string;
  paper: string;
  glass: string;
  metal: string;
  text: string;
  textOnDark: string;
  shadow: string;
  [key: string]: string | string[] | undefined;
}
