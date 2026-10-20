import { expect, it } from "vitest";
import { fixturePlan, fixtureWords } from "./fixture";
import { narratedPropsSchema } from "./narrated-contract";

const props = {
  format: "horizontal",
  narration: fixturePlan.narration,
  audioHash: "a".repeat(64),
  speechDependencyKey: "b".repeat(64),
  durationSeconds: 12,
  words: fixtureWords,
};
it("accepts bounded matching scene input, while rejecting arbitrary assets and code", () => {
  // Synthetic contract data only, not a live narration proof.
  expect(narratedPropsSchema.safeParse(props).success).toBe(true);
  expect(
    narratedPropsSchema.safeParse({
      ...props,
      audioHash: "https://example.com/speech.mp3",
    }).success,
  ).toBe(false);
  expect(
    narratedPropsSchema.safeParse({ ...props, script: "alert(1)" }).success,
  ).toBe(false);
});
it("rejects different narration, empty input and truncated scene bounds", () => {
  expect(
    narratedPropsSchema.safeParse({
      ...props,
      narration: "Another explanation",
    }).success,
  ).toBe(false);
  expect(narratedPropsSchema.safeParse({ ...props, words: [] }).success).toBe(
    false,
  );
  expect(
    narratedPropsSchema.safeParse({ ...props, durationSeconds: 1 }).success,
  ).toBe(false);
});
