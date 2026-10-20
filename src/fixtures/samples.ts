import { createHash } from "node:crypto";
import { dimensions } from "../lib/schemas/common";
import { compositionSchema } from "../lib/schemas/composition";
import { planSchema, type ScenePlanV1 } from "../lib/schemas/plan";
import {
  sceneTimelineSchema,
  speechArtifactSchema,
} from "../lib/schemas/timeline";
import { resolveCue } from "../lib/timing/anchors";

const digest = (value: string) =>
  createHash("sha256").update(value).digest("hex");
const provenance = {
  mode: "fixture" as const,
  license: "CC0-1.0",
  attribution:
    "Original IdeaMotion educational text and synthetic test timing, dedicated to the public domain.",
  timing: "synthetic" as const,
  mediaAvailable: false as const,
};

function scene(
  sceneId: string,
  narration: string,
  component: ScenePlanV1["component"],
): ScenePlanV1 {
  const shared = {
    schemaVersion: 1 as const,
    sceneId,
    narration,
    displayText: narration.split(".")[0],
    estimatedDurationSeconds: 20,
    cues: [],
  };
  const labels: Record<string, [string, string]> = {
    "water-intro": ["The water cycle", ""],
    "water-process": ["Evaporation", "Condensation"],
    "water-diagram": ["Cloud droplets", "Precipitation"],
    "water-summary": ["Water keeps moving", ""],
    "energy-intro": ["Renewable electricity", ""],
    "energy-compare": ["Solar panels", "Wind turbines"],
    "energy-process": ["Local conditions", "System design"],
    "energy-summary": ["Compare with evidence", ""],
    "solar-intro": ["Photovoltaic cells", ""],
    "solar-diagram": ["Absorbed light", "Electric charges"],
    "solar-process": ["Panel: direct current", "Inverter: alternating current"],
    "solar-summary": ["Light becomes electrical energy", ""],
  };
  const [firstLabel, secondLabel] = labels[sceneId] ?? ["First", "Second"];
  const first = { id: "first", label: firstLabel };
  const second = { id: "second", label: secondLabel };
  switch (component) {
    case "concept":
      return { ...shared, component, visual: { entities: [first] } };
    case "process":
    case "labeledDiagram":
      return {
        ...shared,
        component,
        visual: {
          entities: [first, second],
          connections: [{ id: "link", fromId: "first", toId: "second" }],
        },
      };
    case "comparison":
      return { ...shared, component, visual: { columns: [first, second] } };
    case "dataChart":
      return {
        ...shared,
        component,
        visual: {
          series: [
            { id: "first", label: "Blue pencils", value: 2 },
            { id: "second", label: "Red pencils", value: 3 },
          ],
          unit: "pencils",
          source: {
            kind: "supplied",
            note: "Original illustrative counting example: two blue pencils and three red pencils; not research statistics.",
          },
        },
      };
    case "takeaway":
      return { ...shared, component, visual: { points: [first] } };
  }
}

const topics = [
  {
    slug: "water-cycle",
    title: "The water cycle",
    scenes: [
      scene(
        "water-intro",
        "Water moves between the ground and the air. The water cycle describes this continuing journey through evaporation, condensation, and precipitation. We can follow a drop to see how these processes fit together.",
        "concept",
      ),
      scene(
        "water-process",
        "Energy from sunlight can warm water at the surface. Some liquid water becomes water vapor and enters the air. As moist air cools, water vapor can condense into tiny droplets that form clouds.",
        "process",
      ),
      scene(
        "water-diagram",
        "Cloud droplets can join together and grow. When drops become heavy enough, they fall as precipitation. Water then collects in rivers, lakes, and oceans, or moves into soil and underground spaces.",
        "labeledDiagram",
      ),
      scene(
        "water-summary",
        "The cycle has no single starting point. Water can take many routes and spend different amounts of time along the way. Evaporation, condensation, and precipitation help us explain how water keeps moving.",
        "takeaway",
      ),
    ],
  },
  {
    slug: "solar-vs-wind",
    title: "Solar and wind energy",
    scenes: [
      scene(
        "energy-intro",
        "Sunlight and moving air can both help generate electricity. Solar panels and wind turbines use different physical processes, but each can supply energy without burning fuel during normal electricity generation.",
        "concept",
      ),
      scene(
        "energy-compare",
        "Solar panels convert light into electrical energy. Wind turbines use moving air to turn blades connected to a generator. Their output depends on local conditions, so neither produces the same amount at every moment.",
        "comparison",
      ),
      scene(
        "energy-process",
        "Choosing an energy system requires attention to the location, available space, and when electricity is needed. Electricity networks can combine different sources, storage, and other tools to help balance supply with demand.",
        "process",
      ),
      scene(
        "energy-summary",
        "There is no universal winner for every place. Understanding how each technology works helps explain why communities may use a combination. A fair comparison uses relevant evidence instead of invented performance figures.",
        "takeaway",
      ),
    ],
  },
  {
    slug: "solar-panels",
    title: "How solar panels work",
    scenes: [
      scene(
        "solar-intro",
        "A solar panel contains many connected photovoltaic cells. These cells convert light into electrical energy. The process depends on the properties of semiconductor materials, and does not require the panel to collect heat first.",
        "concept",
      ),
      scene(
        "solar-diagram",
        "When light is absorbed in a photovoltaic cell, it can provide energy to electric charges. The cell structure helps separate those charges. An external circuit provides a path for current to flow.",
        "labeledDiagram",
      ),
      scene(
        "solar-process",
        "Connected cells contribute to the panel output. In a typical home system, an inverter converts direct current into alternating current. Actual output depends on sunlight, shading, temperature, and the design of the system.",
        "process",
      ),
      scene(
        "solar-summary",
        "The key idea is conversion: light energy becomes electrical energy through a photovoltaic material. Panels, wiring, and other equipment work together as a system. The panel is only one part of delivering useful electricity.",
        "takeaway",
      ),
    ],
  },
];

topics[0].scenes[0].narration =
  "Water moves between the ground and the air. Water moves through evaporation, condensation, and precipitation in a continuing cycle. We can follow a drop to see how these processes fit together.";
topics[0].scenes[0].cues = [
  {
    cueId: "water-repeat",
    phrase: "water moves",
    occurrence: 1,
    targetId: "first",
    action: "highlight",
    durationSeconds: 1,
  },
];

// No audio/video files are shipped or implied. Paths/hashes below are contract-only
// placeholders, never evidence of a provider call, measured audio, or stored bytes.
export function createSampleProjects() {
  return topics.map((topic) => {
    const plan = planSchema.parse({
      schemaVersion: 1,
      title: topic.title,
      language: "en",
      scenes: topic.scenes,
    });
    const timelines = plan.scenes.map((item) => {
      const tokens = item.narration.match(/\S+/g) ?? [];
      const words = tokens.map((token, index) => ({
        wordId: `word-${index}`,
        text: token,
        start: (index * 19) / tokens.length,
        end: ((index + 0.8) * 19) / tokens.length,
      }));
      const captions = [];
      for (let i = 0; i < words.length; i += 6) {
        const group = words.slice(i, i + 6);
        captions.push({
          captionId: `caption-${i}`,
          text: group.map((word) => word.text).join(" "),
          wordIds: group.map((word) => word.wordId),
          start: group[0].start,
          end: group[group.length - 1].end,
        });
      }
      return sceneTimelineSchema.parse({
        schemaVersion: 1,
        sceneId: item.sceneId,
        speechDependencyKey: digest(`fixture-speech:${item.narration}`),
        durationSeconds: 20,
        words,
        captions,
        events: item.cues.map((cue) => resolveCue(cue, words, 20)),
      });
    });
    const speech = plan.scenes.map((item, i) =>
      speechArtifactSchema.parse({
        schemaVersion: 1,
        sceneId: item.sceneId,
        narrationHash: digest(item.narration),
        speechDependencyKey: timelines[i].speechDependencyKey,
        provider: "fixture",
        voiceId: "fixture-no-voice",
        modelId: "fixture-no-model",
        settings: { stability: 0.5, similarityBoost: 0.5 },
        audio: {
          path: `fixtures/${topic.slug}/${item.sceneId}.wav`,
          hash: digest(`no-audio:${item.sceneId}`),
          durationSeconds: 20,
        },
        alignment: {
          path: `fixtures/${topic.slug}/${item.sceneId}.json`,
          hash: digest(JSON.stringify(timelines[i].words)),
        },
        textMapping: [],
      }),
    );
    const compositions = (["vertical", "horizontal"] as const).map((format) =>
      compositionSchema.parse({
        schemaVersion: 1,
        approvedVersionId: "00000000-0000-4000-8000-000000000001",
        format,
        ...dimensions[format],
        fps: 30,
        durationSeconds: 80,
        visualSettings: {
          theme: "violet-peach",
          componentVersion: 1,
          captionLayoutVersion: 1,
        },
        scenes: plan.scenes.map((item, i) => ({
          plan: item,
          timeline: timelines[i],
          offsetSeconds: i * 20,
          audio: {
            path: speech[i].audio.path,
            hash: speech[i].audio.hash,
            speechDependencyKey: speech[i].speechDependencyKey,
          },
        })),
      }),
    );
    return {
      slug: topic.slug,
      provenance: { ...provenance },
      plan,
      speech,
      timelines,
      compositions,
    };
  });
}

export const chartSceneFixture = scene(
  "counting-example",
  "We have two blue pencils and three red pencils. A small chart can compare these supplied counts without pretending they are research statistics.",
  "dataChart",
);
