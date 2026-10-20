import { z } from "zod";
import {
  characterAlignmentSchema,
  type WordV1,
  wordSchema,
} from "../schemas/timeline";
import { normalizeTokens } from "../timing/anchors";

const providerAlignmentSchema = z.object({
  characters: z.array(z.string().min(1).max(2)).min(1).max(10000),
  character_start_times_seconds: z.array(z.number().finite()).min(1).max(10000),
  character_end_times_seconds: z.array(z.number().finite()).min(1).max(10000),
});
export const timingResponseSchema = z.object({
  audio_base64: z.string().min(4).max(6000000),
  alignment: providerAlignmentSchema.nullish(),
  normalized_alignment: providerAlignmentSchema.nullish(),
});

/** Caller supplies measured, decoded audio duration, never an estimate from text. */
export function wordsFromAlignment(
  response: unknown,
  measuredDuration: number,
  approvedText: string,
) {
  const payload = timingResponseSchema.parse(response);
  const selected = payload.normalized_alignment ?? payload.alignment;
  if (!selected) throw new Error("No character alignment was returned.");
  const alignment = characterAlignmentSchema.parse({
    schemaVersion: 1,
    durationSeconds: measuredDuration,
    characters: selected.characters,
    starts: selected.character_start_times_seconds,
    ends: selected.character_end_times_seconds,
  });
  const spoken = alignment.characters.join("");
  if (
    normalizeTokens(spoken).join(" ") !==
    normalizeTokens(approvedText).join(" ")
  )
    throw new Error(
      "Spoken normalization needs an explicit reviewed text mapping.",
    );
  const characterOffsets: { start: number; end: number; index: number }[] = [];
  let offset = 0;
  alignment.characters.forEach((character, index) => {
    characterOffsets.push({
      start: offset,
      end: offset + character.length,
      index,
    });
    offset += character.length;
  });
  const words: WordV1[] = [];
  const matches = spoken.matchAll(/[\p{L}\p{N}]+(?:[.'’][\p{L}\p{N}]+)*/gu);
  for (const match of matches) {
    const startOffset = match.index;
    const endOffset = startOffset + match[0].length;
    const covered = characterOffsets.filter(
      (c) => c.start < endOffset && c.end > startOffset,
    );
    const start = alignment.starts[covered[0].index];
    const end = alignment.ends[covered[covered.length - 1].index];
    const punctuation =
      spoken.slice(endOffset).match(/^[.,!?;:…]+/u)?.[0] ?? "";
    const word = wordSchema.parse({
      wordId: `word-${words.length}`,
      text: match[0] + punctuation,
      start,
      end,
    });
    if (words.length && word.start < words[words.length - 1].end)
      throw new Error("Word intervals overlap; repair alignment.");
    words.push(word);
  }
  if (!words.length) throw new Error("Alignment contains no spoken words.");
  return {
    alignment,
    words,
    source: payload.normalized_alignment
      ? ("normalized" as const)
      : ("original" as const),
  };
}
