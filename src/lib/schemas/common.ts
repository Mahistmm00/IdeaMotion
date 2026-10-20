import { z } from "zod";

export const idSchema = z.string().regex(/^[a-z][a-z0-9-]{0,63}$/);
export const hashSchema = z.string().regex(/^[a-f0-9]{64}$/);
export const text = (max: number) => z.string().trim().min(1).max(max);
export const secondsSchema = z.number().finite().min(0).max(90);
export const formatSchema = z.enum(["vertical", "horizontal"]);
export const dimensions = {
  vertical: { width: 1080, height: 1920 },
  horizontal: { width: 1920, height: 1080 },
} as const;

// A relative object key is data, never permission to read or sign an asset.
export const storagePathSchema = z
  .string()
  .max(512)
  .regex(
    /^[a-zA-Z0-9_-]+(?:\/[a-zA-Z0-9_-]+)*\/[a-zA-Z0-9_-]+\.(?:mp3|wav|json|mp4|png)$/,
  );
export const audioPathSchema = storagePathSchema.refine(
  (path) => /\.(mp3|wav)$/.test(path),
  "Audio requires an MP3 or WAV object path.",
);
export const alignmentPathSchema = storagePathSchema.refine(
  (path) => path.endsWith(".json"),
  "Alignment requires a JSON object path.",
);

export function unique(values: string[]) {
  return new Set(values).size === values.length;
}

export const briefSchema = z.strictObject({
  topic: text(2000).min(10),
  audience: text(200).default("Beginners"),
  objective: text(300).optional(),
  tone: z.enum(["friendly", "professional", "playful"]).default("friendly"),
  language: z.literal("en").default("en"),
  format: formatSchema.default("vertical"),
  targetDurationSeconds: z.number().int().min(60).max(90).optional(),
  referenceNotes: text(5000).optional(),
});
export type Brief = z.infer<typeof briefSchema>;
