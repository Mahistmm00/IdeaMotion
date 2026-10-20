import type { WordV1 } from "../lib/schemas/timeline";

export type Measure = (text: string) => number;
export function wrapText(
  text: string,
  width: number,
  measure: Measure,
): string[] {
  if (!Number.isFinite(width) || width <= 0)
    throw new Error("Invalid text width.");
  const lines: string[] = [];
  let line = "";
  for (const token of text.split(/\s+/u).filter(Boolean)) {
    if (measure(token) > width)
      throw new Error("A word exceeds the safe width; revise the text.");
    const next = line ? `${line} ${token}` : token;
    if (measure(next) > width) {
      lines.push(line);
      line = token;
    } else line = next;
  }
  if (line) lines.push(line);
  return lines;
}

/** Uses actual font widths; speech gaps end a phrase without a stale caption hold. */
export function segmentCaptions(
  words: WordV1[],
  width: number,
  measure: Measure,
) {
  const captions: {
    captionId: string;
    text: string;
    wordIds: string[];
    start: number;
    end: number;
    lines: string[];
  }[] = [];
  let group: WordV1[] = [];
  const flush = () => {
    if (!group.length) return;
    const text = group.map((w) => w.text).join(" ");
    captions.push({
      captionId: `caption-${captions.length}`,
      text,
      wordIds: group.map((w) => w.wordId),
      start: group[0].start,
      end: group[group.length - 1].end,
      lines: wrapText(text, width, measure),
    });
    group = [];
  };
  words.forEach((word, index) => {
    if (
      word.end <= word.start ||
      word.start < 0 ||
      (index && word.start < words[index - 1].end)
    )
      throw new Error("Invalid word timing.");
    const candidate = [...group, word];
    if (
      group.length &&
      (word.start - group[group.length - 1].end > 0.45 ||
        word.end - group[0].start > 3 ||
        wrapText(candidate.map((w) => w.text).join(" "), width, measure)
          .length > 2)
    )
      flush();
    group.push(word);
    if (wrapText(word.text, width, measure).length > 2)
      throw new Error("Caption requires a revision.");
    if (/[.!?;]$/u.test(word.text)) flush();
  });
  flush();
  return captions;
}
