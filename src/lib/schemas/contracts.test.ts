import { describe, expect, it } from "vitest";
import {
  chartSceneFixture,
  createSampleProjects,
} from "../../fixtures/samples";
import { punctuationAlignment } from "../../fixtures/timing";
import { briefSchema, storagePathSchema } from "./common";
import { compositionSchema } from "./composition";
import { planSchema, scenePlanSchema } from "./plan";
import {
  characterAlignmentSchema,
  sceneTimelineSchema,
  speechArtifactSchema,
} from "./timeline";

describe("sample contract boundaries", () => {
  it("provides three deterministic original samples and both 1080p layouts without claiming media exists", () => {
    const samples = createSampleProjects();
    expect(samples).toEqual(createSampleProjects());
    expect(samples).toHaveLength(3);
    for (const sample of samples) {
      expect(sample.provenance).toMatchObject({
        mode: "fixture",
        timing: "synthetic",
        mediaAvailable: false,
        license: "CC0-1.0",
      });
      expect(
        sample.compositions.map((item) => [item.width, item.height]),
      ).toEqual([
        [1080, 1920],
        [1920, 1080],
      ]);
      expect(planSchema.safeParse(sample.plan).success).toBe(true);
      for (const item of sample.speech)
        expect(speechArtifactSchema.safeParse(item).success).toBe(true);
    }
  });
  it("validates every supported component", () => {
    const scenes = [
      ...createSampleProjects().flatMap((sample) => sample.plan.scenes),
      chartSceneFixture,
    ];
    expect(new Set(scenes.map((item) => item.component)).size).toBe(6);
    for (const item of scenes)
      expect(scenePlanSchema.safeParse(item).success).toBe(true);
  });
  it.each(["script", "css", "url", "ownerId", "approved"])(
    "rejects unrecognized model/browser authority: %s",
    (field) => {
      const scene = createSampleProjects()[0].plan.scenes[0];
      expect(
        scenePlanSchema.safeParse({ ...scene, [field]: "untrusted" }).success,
      ).toBe(false);
    },
  );
  it("rejects nested unknown fields and unsupported component/version/language", () => {
    const plan = createSampleProjects()[0].plan;
    expect(
      scenePlanSchema.safeParse({
        ...chartSceneFixture,
        visual: { ...chartSceneFixture.visual, html: "<script />" },
      }).success,
    ).toBe(false);
    expect(
      scenePlanSchema.safeParse({
        ...plan.scenes[0],
        component: "generatedCode",
      }).success,
    ).toBe(false);
    expect(planSchema.safeParse({ ...plan, schemaVersion: 2 }).success).toBe(
      false,
    );
    expect(planSchema.safeParse({ ...plan, language: "fr" }).success).toBe(
      false,
    );
  });
  it("rejects duplicate scene IDs, unbounded narration, and invalid overall duration", () => {
    const plan = createSampleProjects()[0].plan;
    plan.scenes[1].sceneId = plan.scenes[0].sceneId;
    expect(planSchema.safeParse(plan).success).toBe(false);
    expect(
      scenePlanSchema.safeParse({
        ...plan.scenes[0],
        narration: "x".repeat(2001),
      }).success,
    ).toBe(false);
    const short = createSampleProjects()[0].plan;
    for (const scene of short.scenes) scene.estimatedDurationSeconds = 1;
    expect(planSchema.safeParse(short).success).toBe(false);
  });
  it("rejects chart data without provenance", () => {
    expect(
      scenePlanSchema.safeParse({
        ...chartSceneFixture,
        visual: {
          series: [{ id: "point", label: "Unsupported claim", value: 90 }],
          unit: "percent",
        },
      }).success,
    ).toBe(false);
  });
  it("rejects dangling/duplicate visual IDs and unsafe path actions", () => {
    const scene = createSampleProjects()[0].plan.scenes[1];
    if (scene.component !== "process")
      throw new Error("Expected process fixture");
    scene.visual.connections[0].toId = "missing";
    expect(scenePlanSchema.safeParse(scene).success).toBe(false);
    scene.visual.connections[0].toId = "second";
    scene.visual.entities[1].id = "first";
    expect(scenePlanSchema.safeParse(scene).success).toBe(false);
    const cue = {
      cueId: "cue",
      phrase: "Water",
      occurrence: 0,
      targetId: "missing",
      action: "highlight",
      durationSeconds: 1,
    };
    const concept = createSampleProjects()[0].plan.scenes[0];
    expect(scenePlanSchema.safeParse({ ...concept, cues: [cue] }).success).toBe(
      false,
    );
    expect(
      scenePlanSchema.safeParse({
        ...concept,
        cues: [{ ...cue, targetId: "first", action: "moveAlongPath" }],
      }).success,
    ).toBe(false);
  });
});

describe("input and asset boundaries", () => {
  it("uses brief defaults without coercing untrusted values", () => {
    expect(
      briefSchema.parse({ topic: "  Explain the water cycle.  " }),
    ).toMatchObject({
      topic: "Explain the water cycle.",
      language: "en",
      format: "vertical",
      audience: "Beginners",
    });
    for (const targetDurationSeconds of [30, 91, 60.5, "60"])
      expect(
        briefSchema.safeParse({
          topic: "Explain the water cycle",
          targetDurationSeconds,
        }).success,
      ).toBe(false);
    expect(briefSchema.safeParse({ topic: "short" }).success).toBe(false);
    expect(
      briefSchema.safeParse({
        topic: "Explain the water cycle",
        approved: true,
      }).success,
    ).toBe(false);
  });
  it("rejects an alignment file presented as audio or a video presented as alignment", () => {
    const speech = createSampleProjects()[0].speech[0];
    expect(
      speechArtifactSchema.safeParse({
        ...speech,
        audio: { ...speech.audio, path: "fixtures/test.json" },
      }).success,
    ).toBe(false);
    expect(
      speechArtifactSchema.safeParse({
        ...speech,
        alignment: { ...speech.alignment, path: "fixtures/test.mp4" },
      }).success,
    ).toBe(false);
  });
  it.each([
    "../audio.wav",
    "owner/../audio.wav",
    "https://example.com/a.wav",
    "owner\\file.wav",
    "/owner/audio.wav",
    "owner/file.exe",
    "owner/a.wav?token=secret",
  ])("rejects unsafe object paths: %s", (path) => {
    expect(storagePathSchema.safeParse(path).success).toBe(false);
  });
});

describe("alignment and timeline invariants", () => {
  it("accepts coincident zero-duration punctuation", () =>
    expect(
      characterAlignmentSchema.safeParse(punctuationAlignment).success,
    ).toBe(true));
  it.each([NaN, Infinity, -1, 2])(
    "rejects invalid character timing %s",
    (time) => {
      expect(
        characterAlignmentSchema.safeParse({
          ...punctuationAlignment,
          starts: [time, 0.2, 0.4],
        }).success,
      ).toBe(false);
    },
  );
  it("rejects mismatched arrays and backward intervals", () => {
    expect(
      characterAlignmentSchema.safeParse({
        ...punctuationAlignment,
        ends: [0.2],
      }).success,
    ).toBe(false);
    expect(
      characterAlignmentSchema.safeParse({
        ...punctuationAlignment,
        starts: [0.2, 0.1, 0.4],
      }).success,
    ).toBe(false);
  });
  it("rejects reversed/overlapping words and missing/reordered caption references", () => {
    const original = createSampleProjects()[0].timelines[0];
    const reversed = structuredClone(original);
    reversed.words[0].end = 0;
    expect(sceneTimelineSchema.safeParse(reversed).success).toBe(false);
    const overlapping = structuredClone(original);
    overlapping.words[1].start = 0;
    expect(sceneTimelineSchema.safeParse(overlapping).success).toBe(false);
    const dangling = structuredClone(original);
    dangling.captions[0].wordIds[0] = "missing";
    expect(sceneTimelineSchema.safeParse(dangling).success).toBe(false);
    const missing = structuredClone(original);
    missing.captions.pop();
    expect(sceneTimelineSchema.safeParse(missing).success).toBe(false);
  });
  it("rejects overlapping captions and events outside scene bounds", () => {
    const timeline = createSampleProjects()[0].timelines[0];
    timeline.captions[0].end = timeline.captions[1].end;
    expect(sceneTimelineSchema.safeParse(timeline).success).toBe(false);
    const outside = createSampleProjects()[0].timelines[0];
    outside.events = [
      { cueId: "cue", targetId: "first", action: "reveal", start: 19, end: 21 },
    ];
    expect(sceneTimelineSchema.safeParse(outside).success).toBe(false);
  });
});

describe("composition compatibility", () => {
  it("rejects crop-sized dimensions, wrong scene identity, drift, and mismatched speech", () => {
    const original = createSampleProjects()[0].compositions[0];
    expect(
      compositionSchema.safeParse({ ...original, width: 1920 }).success,
    ).toBe(false);
    const drift = structuredClone(original);
    drift.scenes[1].offsetSeconds += 0.1;
    expect(compositionSchema.safeParse(drift).success).toBe(false);
    const identity = structuredClone(original);
    identity.scenes[0].timeline.sceneId = "different";
    expect(compositionSchema.safeParse(identity).success).toBe(false);
    const stale = structuredClone(original);
    stale.scenes[0].audio.speechDependencyKey = "a".repeat(64);
    expect(compositionSchema.safeParse(stale).success).toBe(false);
    expect(
      compositionSchema.safeParse({ ...original, durationSeconds: 81 }).success,
    ).toBe(false);
  });
  it("rejects an event without a matching approved cue", () => {
    const composition = createSampleProjects()[0].compositions[0];
    composition.scenes[0].timeline.events = [
      {
        cueId: "invented",
        targetId: "first",
        action: "highlight",
        start: 0,
        end: 1,
      },
    ];
    expect(compositionSchema.safeParse(composition).success).toBe(false);
  });
});
