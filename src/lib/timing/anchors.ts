import { z } from "zod";
import { type CueV1, cueSchema } from "../schemas/plan";
import { type WordV1, wordSchema } from "../schemas/timeline";

// Preserve numbers/decimals and apostrophes; do not guess acronym or number speech.
export function normalizeTokens(text: string): string[] {
  return (
    text
      .normalize("NFKC")
      .toLocaleLowerCase("en")
      .match(/[\p{L}\p{N}]+(?:[.'’][\p{L}\p{N}]+)*/gu) ?? []
  );
}

export function resolveCue(
  cueInput: CueV1,
  wordInput: WordV1[],
  durationSeconds: number,
) {
  const cue = cueSchema.parse(cueInput);
  const words = z.array(wordSchema).min(1).max(500).parse(wordInput);
  z.number().finite().positive().max(90).parse(durationSeconds);
  const phrase = normalizeTokens(cue.phrase);
  const tokens = words.map((word) => normalizeTokens(word.text));
  if (!phrase.length || tokens.some((token) => token.length !== 1))
    throw new Error(
      "Cue matching requires unambiguous normalized word tokens.",
    );
  if (
    words.some(
      (word, i) =>
        word.end > durationSeconds || (i > 0 && word.start < words[i - 1].end),
    )
  )
    throw new Error("Invalid word ordering or scene bounds.");
  const matches: number[] = [];
  for (let i = 0; i <= tokens.length - phrase.length; i++) {
    if (phrase.every((token, j) => tokens[i + j][0] === token)) matches.push(i);
  }
  if (
    matches.some((start, i) => i > 0 && start < matches[i - 1] + phrase.length)
  )
    throw new Error("Overlapping cue matches require a clearer phrase.");
  const index = matches[cue.occurrence];
  if (index === undefined)
    throw new Error(
      "Cue phrase occurrence was not found; repair the plan or explicit text mapping.",
    );
  const start = words[index].start;
  const end = start + cue.durationSeconds;
  if (end > durationSeconds) throw new Error("Cue extends beyond its scene.");
  return {
    cueId: cue.cueId,
    targetId: cue.targetId,
    action: cue.action,
    start,
    end,
  };
}
