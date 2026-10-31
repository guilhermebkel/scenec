import { DETAIL_NAMES, type DetailName } from "@/Protocols/AssetProtocol.ts";
import { IdUtil } from "@/Utils/IdUtil.ts";

export class DetailUtil {
  private static readonly DETAIL_TO_RANK: Record<DetailName, number> = { low: 0, mid: 1, high: 2 };

  private static readonly DEFAULT_RANK = 1;

  static isDetail(value: unknown): value is DetailName {
    return IdUtil.isOneOf(DETAIL_NAMES, value);
  }

  static rankOf(detail: string | undefined): number {
    return IdUtil.lookup(DetailUtil.DETAIL_TO_RANK, detail) ?? DetailUtil.DEFAULT_RANK;
  }
}
