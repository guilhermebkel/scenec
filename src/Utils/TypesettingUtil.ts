export interface TypesettingOptions {
  readonly wrap?: number;
  readonly hasBalance?: boolean;
}

export interface TextRange {
  readonly start: number;
  readonly length: number;
}

interface BestPartition {
  readonly score: number;
  readonly lines: string[];
}

export class TypesettingUtil {
  private static readonly DEFAULT_LINE_COUNT = 2;

  private static readonly REGEX_SPECIAL_CHARS = /[.*+?^${}()|[\]\\]/g;

  static splitLines(content: string, options: TypesettingOptions = {}): string[] {
    const rawLines = content.split("\n");
    const { wrap, hasBalance } = options;
    if (wrap == null && hasBalance !== true) {
      return rawLines;
    }
    const allWords = content.trim().split(/\s+/).filter((word) => word.length > 0);
    if (allWords.length <= 1) {
      return [content.trim()];
    }
    const totalChars = allWords.reduce((sum, word) => sum + word.length, 0) + (allWords.length - 1);
    const targetLineCount = TypesettingUtil.resolveLineCount(rawLines.length, totalChars, wrap, hasBalance);
    if (targetLineCount <= 1 || targetLineCount >= allWords.length) {
      return rawLines;
    }
    return TypesettingUtil.balancePartition(allWords, targetLineCount);
  }

  private static resolveLineCount(
    rawCount: number,
    totalChars: number,
    wrap?: number,
    hasBalance?: boolean,
  ): number {
    if (wrap != null) {
      return Math.max(TypesettingUtil.DEFAULT_LINE_COUNT, Math.ceil(totalChars / wrap));
    }
    if (hasBalance === true && rawCount > 1) {
      return rawCount;
    }
    return TypesettingUtil.DEFAULT_LINE_COUNT;
  }

  static balancePartition(words: readonly string[], targetLineCount: number): string[] {
    if (words.length <= targetLineCount || targetLineCount <= 1) {
      return [words.join(" ")];
    }
    const totalChars = words.reduce((sum, word) => sum + word.length, 0) + (words.length - 1);
    const averageLineLength = totalChars / targetLineCount;
    return TypesettingUtil.findBestPartition(words, 0, 0, targetLineCount, averageLineLength).lines;
  }

  private static findBestPartition(
    words: readonly string[],
    wordIndex: number,
    lineIndex: number,
    targetLineCount: number,
    averageLineLength: number,
  ): BestPartition {
    const isLastLine = lineIndex === targetLineCount - 1;
    if (isLastLine) {
      const line = words.slice(wordIndex).join(" ");
      const deviation = line.length - averageLineLength;
      return { score: deviation * deviation, lines: [line] };
    }
    let bestScore = Number.POSITIVE_INFINITY;
    let bestLines: string[] = [];
    const maxWordIndex = words.length - (targetLineCount - lineIndex - 1);
    for (let nextIndex = wordIndex + 1; nextIndex <= maxWordIndex; nextIndex++) {
      const line = words.slice(wordIndex, nextIndex).join(" ");
      const deviation = line.length - averageLineLength;
      const penalty = deviation * deviation;
      const nextPartition = TypesettingUtil.findBestPartition(
        words,
        nextIndex,
        lineIndex + 1,
        targetLineCount,
        averageLineLength,
      );
      const totalScore = penalty + nextPartition.score;
      if (totalScore < bestScore) {
        bestScore = totalScore;
        bestLines = [line, ...nextPartition.lines];
      }
    }
    return { score: bestScore, lines: bestLines };
  }

  static emphasisRanges(line: string, words?: readonly string[]): TextRange[] {
    if (!words || words.length === 0) {
      return [{ start: 0, length: line.length }];
    }
    const ranges: TextRange[] = [];
    for (const word of words) {
      if (word.length === 0) {
        continue;
      }
      const pattern = word.replace(TypesettingUtil.REGEX_SPECIAL_CHARS, "\\$&");
      const regex = new RegExp(`\\b${pattern}\\b`, "gi");
      let match = regex.exec(line);
      while (match !== null) {
        ranges.push({ start: match.index, length: match[0].length });
        match = regex.exec(line);
      }
    }
    if (ranges.length === 0) {
      return [{ start: 0, length: line.length }];
    }
    return ranges.toSorted((first, second) => first.start - second.start);
  }
}
