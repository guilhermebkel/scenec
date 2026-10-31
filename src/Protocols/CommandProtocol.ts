export interface CommandArguments {
  positionals: string[];
  output: string | undefined;
  shouldWritePng: boolean;
  width: number;
  count: number;
  isBest?: boolean;
}
