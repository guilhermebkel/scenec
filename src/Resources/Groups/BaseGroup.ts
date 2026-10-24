export abstract class BaseGroup {
  abstract readonly id: string;

  abstract readonly anchor: string;

  abstract readonly desc: string;

  abstract build(group: any): Record<string, any>;
}
