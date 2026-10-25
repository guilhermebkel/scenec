export class NormalizeUtil {
  private static readonly COMBINING_MARKS = /[̀-ͯ]/g;

  static key(text: string): string {
    return text.toLowerCase().normalize("NFD").replace(NormalizeUtil.COMBINING_MARKS, "").trim();
  }
}
