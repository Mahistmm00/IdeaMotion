import { describe, expect, it } from "vitest";
import { resolveCue } from "../timing/anchors";
import { wordsFromAlignment } from "./alignment";

// Synthetic adapter fixtures only; these do not constitute provider/audio evidence.
function payload(text: string) {
  const characters = Array.from(text);
  return {
    audio_base64: "SUQz",
    alignment: {
      characters,
      character_start_times_seconds: characters.map((_, i) => i * 0.04),
      character_end_times_seconds: characters.map(
        (character, i) =>
          i * 0.04 + (/[\p{L}\p{N}]/u.test(character) ? 0.035 : 0),
      ),
    },
  };
}
describe("character alignment adapter", () => {
  it("preserves word timing and zero-duration punctuation", () => {
    const result = wordsFromAlignment(payload("Hi. Ada!"), 1, "Hi. Ada!");
    expect(result.words.map((w) => w.text)).toEqual(["Hi.", "Ada!"]);
    expect(result.words[0].start).toBe(0);
    expect(result.words[0].end).toBeCloseTo(0.075);
    expect(result.words[1].start).toBeCloseTo(0.16);
    expect(result.source).toBe("original");
  });
  it("uses normalized timing and handles UTF-16 character offsets", () => {
    const response = {
      ...payload("wrong"),
      normalized_alignment: payload("😀 Ada!").alignment,
    };
    const result = wordsFromAlignment(response, 2, "Ada!");
    expect(result.source).toBe("normalized");
    expect(result.words[0].text).toBe("Ada!");
    expect(result.words[0].start).toBeCloseTo(0.08);
  });
  it("does not infer acronym, number or decimal speech equivalence", () => {
    expect(() =>
      wordsFromAlignment(
        payload("A I in twenty twenty six uses three point one four"),
        5,
        "AI in 2026 uses 3.14",
      ),
    ).toThrow("reviewed text mapping");
    expect(
      wordsFromAlignment(payload("AI 2026 3.14"), 2, "AI 2026 3.14").words.map(
        (w) => w.text,
      ),
    ).toEqual(["AI", "2026", "3.14"]);
  });
  it("keeps repeated cue occurrences scene-local", () => {
    const result = wordsFromAlignment(
      payload("Water moves. Water moves!"),
      3,
      "Water moves. Water moves!",
    );
    const cue = resolveCue(
      {
        cueId: "repeat",
        phrase: "Water moves",
        occurrence: 1,
        targetId: "water",
        action: "highlight",
        durationSeconds: 0.5,
      },
      result.words,
      3,
    );
    expect(cue.start).toBeCloseTo(0.52);
  });
  it("rejects missing timing rather than distributing word times", () => {
    expect(() =>
      wordsFromAlignment({ audio_base64: "SUQz", alignment: null }, 1, "Hi"),
    ).toThrow("No character alignment");
  });
  it("rejects invalid arrays and timing beyond measured audio", () => {
    const invalid = payload("Hi");
    invalid.alignment.character_end_times_seconds.pop();
    expect(() => wordsFromAlignment(invalid, 1, "Hi")).toThrow();
    expect(() => wordsFromAlignment(payload("Hi"), 0.05, "Hi")).toThrow();
  });
  it("rejects backward and overlapping word intervals", () => {
    const invalid = payload("Hi Ada");
    invalid.alignment.character_start_times_seconds[4] = -1;
    expect(() => wordsFromAlignment(invalid, 1, "Hi Ada")).toThrow();
    const overlap = payload("A B");
    overlap.alignment.character_end_times_seconds = [0.1, 0.1, 0.15];
    expect(() => wordsFromAlignment(overlap, 1, "A B")).toThrow("overlap");
  });
});
