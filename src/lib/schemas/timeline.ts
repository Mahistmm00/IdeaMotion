import { z } from "zod";
import {
  alignmentPathSchema,
  audioPathSchema,
  hashSchema,
  idSchema,
  secondsSchema,
  text,
  unique,
} from "./common";
import { cueSchema } from "./plan";

export const wordSchema = z
  .strictObject({
    wordId: idSchema,
    text: text(100),
    start: secondsSchema,
    end: secondsSchema,
  })
  .refine(
    (word) => word.end > word.start,
    "A spoken word must have positive duration.",
  );
export const captionSchema = z
  .strictObject({
    captionId: idSchema,
    text: text(300),
    wordIds: z.array(idSchema).min(1).max(40),
    start: secondsSchema,
    end: secondsSchema,
  })
  .refine(
    (caption) => caption.end > caption.start,
    "Caption must have positive duration.",
  );
export const eventSchema = z
  .strictObject({
    cueId: idSchema,
    targetId: idSchema,
    action: cueSchema.shape.action,
    start: secondsSchema,
    end: secondsSchema,
  })
  .refine(
    (event) => event.end > event.start,
    "Event must have positive duration.",
  );

export const sceneTimelineSchema = z
  .strictObject({
    schemaVersion: z.literal(1),
    sceneId: idSchema,
    speechDependencyKey: hashSchema,
    durationSeconds: secondsSchema.positive(),
    words: z.array(wordSchema).min(1).max(500),
    captions: z.array(captionSchema).min(1).max(200),
    events: z.array(eventSchema).max(24),
  })
  .superRefine((timeline, ctx) => {
    const fail = (message: string) => ctx.addIssue({ code: "custom", message });
    if (
      !unique(timeline.words.map((word) => word.wordId)) ||
      !unique(timeline.captions.map((caption) => caption.captionId)) ||
      !unique(timeline.events.map((event) => event.cueId))
    )
      fail("Timeline IDs must be unique within their kind.");
    timeline.words.forEach((word, index) => {
      if (
        word.end > timeline.durationSeconds ||
        (index > 0 && word.start < timeline.words[index - 1].end)
      )
        fail("Words must be ordered, nonoverlapping, and inside the scene.");
    });
    let cursor = 0;
    timeline.captions.forEach((caption, index) => {
      const covered = timeline.words.slice(
        cursor,
        cursor + caption.wordIds.length,
      );
      if (
        covered.length !== caption.wordIds.length ||
        covered.some((word, i) => word.wordId !== caption.wordIds[i])
      )
        fail("Captions must cover each word once in speaking order.");
      if (
        covered.length &&
        (caption.start > covered[0].start ||
          caption.end < covered[covered.length - 1].end)
      )
        fail("Caption must contain its spoken word intervals.");
      if (
        caption.end > timeline.durationSeconds ||
        (index > 0 && caption.start < timeline.captions[index - 1].end)
      )
        fail("Captions must be ordered, nonoverlapping, and inside the scene.");
      cursor += caption.wordIds.length;
    });
    if (cursor !== timeline.words.length)
      fail("All spoken words require captions.");
    if (timeline.events.some((event) => event.end > timeline.durationSeconds))
      fail("Events must stay inside the scene.");
  });

export const speechArtifactSchema = z.strictObject({
  schemaVersion: z.literal(1),
  sceneId: idSchema,
  narrationHash: hashSchema,
  speechDependencyKey: hashSchema,
  provider: z.enum(["elevenlabs", "fixture"]),
  voiceId: text(100),
  modelId: text(100),
  settings: z.strictObject({
    stability: z.number().min(0).max(1),
    similarityBoost: z.number().min(0).max(1),
  }),
  audio: z.strictObject({
    path: audioPathSchema,
    hash: hashSchema,
    durationSeconds: secondsSchema.positive(),
  }),
  alignment: z.strictObject({ path: alignmentPathSchema, hash: hashSchema }),
  textMapping: z
    .array(
      z.strictObject({
        sourceText: text(200),
        spokenText: text(200),
        occurrence: z.number().int().min(0).max(100),
      }),
    )
    .max(100),
});

// Internal alignment data; the ElevenLabs adapter will translate its real response.
export const characterAlignmentSchema = z
  .strictObject({
    schemaVersion: z.literal(1),
    durationSeconds: secondsSchema.positive(),
    characters: z.array(z.string().min(1).max(2)).min(1).max(10000),
    starts: z.array(secondsSchema).min(1).max(10000),
    ends: z.array(secondsSchema).min(1).max(10000),
  })
  .superRefine((alignment, ctx) => {
    if (
      alignment.characters.length !== alignment.starts.length ||
      alignment.starts.length !== alignment.ends.length
    ) {
      ctx.addIssue({
        code: "custom",
        message: "Character timing arrays must have equal lengths.",
      });
      return;
    }
    alignment.starts.forEach((start, i) => {
      const end = alignment.ends[i];
      if (
        end < start ||
        end > alignment.durationSeconds ||
        (i > 0 &&
          (start < alignment.starts[i - 1] || end < alignment.ends[i - 1]))
      )
        ctx.addIssue({
          code: "custom",
          path: ["starts", i],
          message:
            "Character intervals must be monotonic and inside audio duration.",
        });
    });
  });
export type SceneTimelineV1 = z.infer<typeof sceneTimelineSchema>;
export type SpeechArtifactV1 = z.infer<typeof speechArtifactSchema>;
export type WordV1 = z.infer<typeof wordSchema>;
