import { z } from "zod";
import {
  audioPathSchema,
  dimensions,
  formatSchema,
  hashSchema,
  unique,
} from "./common";
import { scenePlanSchema, visualIds } from "./plan";
import { sceneTimelineSchema } from "./timeline";

export const compositionSchema = z
  .strictObject({
    schemaVersion: z.literal(1),
    approvedVersionId: z.uuid(),
    format: formatSchema,
    width: z.number().int(),
    height: z.number().int(),
    fps: z.literal(30),
    visualSettings: z.strictObject({
      theme: z.literal("violet-peach"),
      componentVersion: z.literal(1),
      captionLayoutVersion: z.literal(1),
    }),
    durationSeconds: z.number().finite().min(60).max(90),
    scenes: z
      .array(
        z.strictObject({
          plan: scenePlanSchema,
          timeline: sceneTimelineSchema,
          offsetSeconds: z.number().finite().min(0).max(90),
          audio: z.strictObject({
            path: audioPathSchema,
            hash: hashSchema,
            speechDependencyKey: hashSchema,
          }),
        }),
      )
      .min(4)
      .max(10),
  })
  .superRefine((composition, ctx) => {
    const fail = (message: string) => ctx.addIssue({ code: "custom", message });
    const size = dimensions[composition.format];
    if (composition.width !== size.width || composition.height !== size.height)
      fail("Dimensions do not match the selected format.");
    if (!unique(composition.scenes.map((scene) => scene.plan.sceneId)))
      fail("Composition scene IDs must be unique.");
    let offset = 0;
    for (const scene of composition.scenes) {
      if (scene.plan.sceneId !== scene.timeline.sceneId)
        fail("Plan and timeline scene IDs must match.");
      if (Math.abs(scene.offsetSeconds - offset) > 1e-8)
        fail(
          "Scene offsets must accumulate exactly once without gaps or overlap.",
        );
      if (
        scene.audio.speechDependencyKey !== scene.timeline.speechDependencyKey
      )
        fail("Timeline speech dependency does not match audio.");
      const targets = [
        ...visualIds(scene.plan),
        ...("connections" in scene.plan.visual
          ? scene.plan.visual.connections.map((edge) => edge.id)
          : []),
      ];
      if (scene.timeline.events.length !== scene.plan.cues.length)
        fail("Every cue requires one resolved event.");
      for (const event of scene.timeline.events) {
        const cue = scene.plan.cues.find((item) => item.cueId === event.cueId);
        if (
          !cue ||
          cue.targetId !== event.targetId ||
          cue.action !== event.action ||
          !targets.includes(event.targetId)
        )
          fail("Resolved event does not match its planned cue.");
      }
      offset += scene.timeline.durationSeconds;
    }
    if (Math.abs(offset - composition.durationSeconds) > 1e-8)
      fail("Composition duration does not equal its scene durations.");
  });
export type CompositionV1 = z.infer<typeof compositionSchema>;
