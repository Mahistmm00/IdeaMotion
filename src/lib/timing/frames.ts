import { z } from "zod";

const intervalSchema = z
  .strictObject({
    start: z.number().finite().min(0),
    end: z.number().finite().positive(),
  })
  .refine((item) => item.end > item.start);

/** Half-open frames. Reject collapsed intervals instead of displaying a false hold. */
export function captionFrames(
  intervals: { start: number; end: number }[],
  fps: number,
  durationSeconds: number,
) {
  z.number().int().min(1).max(120).parse(fps);
  z.number().finite().positive().max(90).parse(durationSeconds);
  const parsed = z.array(intervalSchema).max(200).parse(intervals);
  const frameCount = Math.ceil(durationSeconds * fps);
  const frames = parsed.map((interval, index) => {
    if (
      interval.end > durationSeconds ||
      (index > 0 && interval.start < parsed[index - 1].end)
    )
      throw new Error(
        "Caption intervals must be ordered and inside the scene.",
      );
    return {
      startFrame: Math.floor(interval.start * fps),
      endFrame: Math.min(Math.ceil(interval.end * fps), frameCount),
    };
  });
  for (let i = 0; i < frames.length; i++) {
    if (i + 1 < frames.length)
      frames[i].endFrame = Math.min(
        frames[i].endFrame,
        frames[i + 1].startFrame,
      );
    if (frames[i].endFrame <= frames[i].startFrame)
      throw new Error(
        "Caption collapsed during frame conversion; resegment it.",
      );
  }
  return frames;
}
