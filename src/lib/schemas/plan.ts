import { z } from "zod";
import { idSchema, text, unique } from "./common";

const entitySchema = z.strictObject({ id: idSchema, label: text(120) });
const connectionSchema = z.strictObject({
  id: idSchema,
  fromId: idSchema,
  toId: idSchema,
  label: text(80).optional(),
});
export const cueSchema = z.strictObject({
  cueId: idSchema,
  phrase: text(200),
  occurrence: z.number().int().min(0).max(100),
  targetId: idSchema,
  action: z.enum(["reveal", "highlight", "moveAlongPath"]),
  durationSeconds: z.number().finite().min(0.1).max(5),
});
const sceneFields = {
  schemaVersion: z.literal(1),
  sceneId: idSchema,
  narration: text(2000),
  displayText: text(300),
  estimatedDurationSeconds: z.number().finite().min(1).max(30),
  cues: z.array(cueSchema).max(24),
};
const entities = z.array(entitySchema).min(1).max(12);

const sceneUnion = z.discriminatedUnion("component", [
  z.strictObject({
    ...sceneFields,
    component: z.literal("concept"),
    visual: z.strictObject({ entities }),
  }),
  z.strictObject({
    ...sceneFields,
    component: z.literal("labeledDiagram"),
    visual: z.strictObject({
      entities,
      connections: z.array(connectionSchema).min(1).max(20),
    }),
  }),
  z.strictObject({
    ...sceneFields,
    component: z.literal("process"),
    visual: z.strictObject({
      entities: entities.min(2),
      connections: z.array(connectionSchema).min(1).max(20),
    }),
  }),
  z.strictObject({
    ...sceneFields,
    component: z.literal("comparison"),
    visual: z.strictObject({ columns: z.tuple([entitySchema, entitySchema]) }),
  }),
  z.strictObject({
    ...sceneFields,
    component: z.literal("dataChart"),
    visual: z.strictObject({
      series: z
        .array(
          z.strictObject({
            id: idSchema,
            label: text(80),
            value: z.number().finite().min(0).max(1e9),
          }),
        )
        .min(1)
        .max(12),
      unit: text(40),
      source: z.strictObject({
        kind: z.enum(["supplied", "reviewed"]),
        note: text(1000),
      }),
    }),
  }),
  z.strictObject({
    ...sceneFields,
    component: z.literal("takeaway"),
    visual: z.strictObject({ points: entities.max(5) }),
  }),
]);

export function visualIds(scene: z.infer<typeof sceneUnion>) {
  switch (scene.component) {
    case "comparison":
      return scene.visual.columns.map((item) => item.id);
    case "dataChart":
      return scene.visual.series.map((item) => item.id);
    case "takeaway":
      return scene.visual.points.map((item) => item.id);
    default:
      return scene.visual.entities.map((item) => item.id);
  }
}

export const scenePlanSchema = sceneUnion.superRefine((scene, ctx) => {
  const nodes = visualIds(scene);
  const connections =
    "connections" in scene.visual ? scene.visual.connections : [];
  const targets = [...nodes, ...connections.map((item) => item.id)];
  const fail = (message: string) => ctx.addIssue({ code: "custom", message });
  if (!unique(targets)) fail("Visual IDs must be unique within a scene.");
  if (!unique(scene.cues.map((cue) => cue.cueId)))
    fail("Cue IDs must be unique within a scene.");
  for (const connection of connections) {
    if (
      !nodes.includes(connection.fromId) ||
      !nodes.includes(connection.toId) ||
      connection.fromId === connection.toId
    )
      fail("Connections require two distinct existing entities.");
  }
  for (const cue of scene.cues) {
    if (!targets.includes(cue.targetId)) fail("Cue target does not exist.");
    if (
      cue.action === "moveAlongPath" &&
      !connections.some((edge) => edge.id === cue.targetId)
    )
      fail("Path motion requires a trusted connection target.");
  }
});

export const planSchema = z
  .strictObject({
    schemaVersion: z.literal(1),
    title: text(120),
    language: z.literal("en"),
    scenes: z.array(scenePlanSchema).min(4).max(10),
  })
  .superRefine((plan, ctx) => {
    if (!unique(plan.scenes.map((scene) => scene.sceneId)))
      ctx.addIssue({
        code: "custom",
        path: ["scenes"],
        message: "Scene IDs must be unique.",
      });
    const duration = plan.scenes.reduce(
      (total, scene) => total + scene.estimatedDurationSeconds,
      0,
    );
    if (duration < 60 || duration > 90)
      ctx.addIssue({
        code: "custom",
        path: ["scenes"],
        message: "Estimated plan duration must be 60–90 seconds.",
      });
  });

export type ScenePlanV1 = z.infer<typeof scenePlanSchema>;
export type PlanV1 = z.infer<typeof planSchema>;
export type CueV1 = z.infer<typeof cueSchema>;
