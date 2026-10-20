import { describe, expect, it } from "vitest";
import {
  repeatedPhraseWords,
  spokenNormalizationFixture,
} from "../../fixtures/timing";
import { normalizeTokens, resolveCue } from "./anchors";
import { captionFrames } from "./frames";

const cue = {
  cueId: "cue",
  phrase: "water moves",
  occurrence: 1,
  targetId: "drop",
  action: "highlight" as const,
  durationSeconds: 0.5,
};

describe("scene-scoped phrase anchors", () => {
  it("resolves the requested repeated occurrence after a speech gap", () => {
    expect(resolveCue(cue, repeatedPhraseWords, 3)).toMatchObject({
      start: 2,
      end: 2.5,
    });
    expect(
      resolveCue({ ...cue, occurrence: 0 }, repeatedPhraseWords, 3),
    ).toMatchObject({ start: 0, end: 0.5 });
  });
  it("fails absent occurrences and cue overruns rather than guessing", () => {
    expect(() =>
      resolveCue({ ...cue, occurrence: 2 }, repeatedPhraseWords, 3),
    ).toThrow(/not found/);
    expect(() =>
      resolveCue({ ...cue, phrase: "clouds form" }, repeatedPhraseWords, 3),
    ).toThrow(/not found/);
    expect(() =>
      resolveCue({ ...cue, durationSeconds: 2 }, repeatedPhraseWords, 3),
    ).toThrow(/beyond/);
  });
  it("rejects ambiguous overlapping anchors and unordered words", () => {
    const words = [0, 1, 2].map((start) => ({
      wordId: `word-${start}`,
      text: "go",
      start,
      end: start + 0.5,
    }));
    expect(() =>
      resolveCue({ ...cue, phrase: "go go", occurrence: 0 }, words, 3),
    ).toThrow(/Overlapping/);
    expect(() =>
      resolveCue(cue, [...repeatedPhraseWords].reverse(), 3),
    ).toThrow(/ordering/);
  });
  it("normalizes punctuation/case without inventing number or acronym equivalence", () => {
    expect(normalizeTokens("Ada, explains 3.14!")).toEqual([
      "ada",
      "explains",
      "3.14",
    ]);
    expect(normalizeTokens("AI")).not.toEqual(normalizeTokens("A I"));
    expect(normalizeTokens("2026")).not.toEqual(
      normalizeTokens("twenty twenty six"),
    );
    const words = spokenNormalizationFixture.spokenText
      .split(" ")
      .map((text, index) => ({
        wordId: `word-${index}`,
        text,
        start: index,
        end: index + 0.5,
      }));
    expect(() =>
      resolveCue({ ...cue, phrase: "AI", occurrence: 0 }, words, 20),
    ).toThrow(/not found/);
    const mapped = spokenNormalizationFixture.mappings[0].spokenText;
    expect(
      resolveCue({ ...cue, phrase: mapped, occurrence: 0 }, words, 20).start,
    ).toBe(0);
  });
});

describe("half-open caption frame boundaries", () => {
  it("prevents adjacent captions owning the same frame", () => {
    expect(
      captionFrames(
        [
          { start: 0.01, end: 0.051 },
          { start: 0.051, end: 0.1 },
        ],
        30,
        1,
      ),
    ).toEqual([
      { startFrame: 0, endFrame: 1 },
      { startFrame: 1, endFrame: 3 },
    ]);
  });
  it("ends on the last valid scene frame without accumulating offsets", () => {
    expect(captionFrames([{ start: 0.95, end: 1 }], 30, 1)).toEqual([
      { startFrame: 28, endFrame: 30 },
    ]);
  });
  it("requires resegmentation when fast captions collapse into one frame", () => {
    expect(() =>
      captionFrames(
        [
          { start: 0, end: 0.01 },
          { start: 0.01, end: 0.02 },
        ],
        30,
        1,
      ),
    ).toThrow(/resegment/);
  });
  it("rejects malformed timing, invalid fps, and out-of-scene intervals", () => {
    expect(() => captionFrames([{ start: 0.2, end: 0.1 }], 30, 1)).toThrow();
    expect(() => captionFrames([{ start: 0, end: 2 }], 30, 1)).toThrow();
    expect(() => captionFrames([{ start: 0, end: 1 }], 0, 1)).toThrow();
    expect(() => captionFrames([{ start: NaN, end: 1 }], 30, 1)).toThrow();
  });
});
