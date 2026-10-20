import { z } from "zod";
import { hashSchema } from "../lib/schemas/common";
import { wordSchema } from "../lib/schemas/timeline";
import { normalizeTokens } from "../lib/timing/anchors";
import { fixturePlan } from "./fixture";
export const narratedPropsSchema = z
  .strictObject({
    format: z.enum(["vertical", "horizontal"]),
    narration: z.literal(fixturePlan.narration),
    audioHash: hashSchema,
    speechDependencyKey: hashSchema,
    durationSeconds: z.number().finite().positive().max(30),
    words: z.array(wordSchema).min(1).max(100),
  })
  .superRefine((input, ctx) => {
    if (
      normalizeTokens(input.words.map((w) => w.text).join(" ")).join(" ") !==
        normalizeTokens(input.narration).join(" ") ||
      input.words.some(
        (word, i) =>
          word.end > input.durationSeconds ||
          (i > 0 && word.start < input.words[i - 1].end),
      )
    )
      ctx.addIssue({
        code: "custom",
        message: "Narration words are incompatible with the fixed proof scene.",
      });
  });
export type NarratedProps = z.infer<typeof narratedPropsSchema>;
