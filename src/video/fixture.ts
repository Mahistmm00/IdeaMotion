import { scenePlanSchema } from "../lib/schemas/plan";
import { wordSchema } from "../lib/schemas/timeline";
import { resolveCue } from "../lib/timing/anchors";

// Original CC0 educational text. These are synthetic timing values, not speech alignment.
export const fixtureWords = [
  ["Water", 0.7, 1.05],
  ["evaporates", 1.1, 1.9],
  ["into", 2, 2.3],
  ["vapor.", 2.35, 2.9],
  ["Vapor", 4.1, 4.5],
  ["cools", 4.6, 5],
  ["and", 5.05, 5.3],
  ["condenses", 5.35, 6.05],
  ["into", 6.1, 6.4],
  ["droplets.", 6.45, 7.05],
  ["Droplets", 8.2, 8.7],
  ["fall", 8.8, 9.1],
  ["as", 9.2, 9.4],
  ["precipitation.", 9.5, 10.45],
].map(([text, start, end], index) =>
  wordSchema.parse({ wordId: `word-${index}`, text, start, end }),
);
export const fixturePlan = scenePlanSchema.parse({
  schemaVersion: 1,
  sceneId: "water-cycle",
  component: "process",
  displayText: "The water cycle",
  narration: fixtureWords.map((w) => w.text).join(" "),
  estimatedDurationSeconds: 12,
  visual: {
    entities: [
      { id: "evaporation", label: "Evaporation" },
      { id: "condensation", label: "Condensation" },
      { id: "precipitation", label: "Precipitation" },
    ],
    connections: [
      { id: "first", fromId: "evaporation", toId: "condensation" },
      { id: "second", fromId: "condensation", toId: "precipitation" },
    ],
  },
  cues: [
    {
      cueId: "evaporates",
      phrase: "evaporates",
      occurrence: 0,
      targetId: "evaporation",
      action: "highlight",
      durationSeconds: 1.8,
    },
    {
      cueId: "condenses",
      phrase: "condenses",
      occurrence: 0,
      targetId: "condensation",
      action: "highlight",
      durationSeconds: 1.7,
    },
    {
      cueId: "falls",
      phrase: "Droplets fall",
      occurrence: 0,
      targetId: "precipitation",
      action: "highlight",
      durationSeconds: 2.3,
    },
  ],
});
export const fixtureEvents = fixturePlan.cues.map((cue) =>
  resolveCue(cue, fixtureWords, 12),
);
export const fixtureDuration = 12;
