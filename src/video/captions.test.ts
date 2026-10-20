import { describe, expect, it } from "vitest";
import { captionFrames } from "../lib/timing/frames";
import { segmentCaptions, wrapText } from "./captions";
import { fixtureEvents, fixtureWords } from "./fixture";
import { sceneLayout } from "./layout";

const measure = (text: string) => text.length * 10;
describe("custom caption layout", () => {
  it("wraps by measured width and rejects an unbreakable overflow", () => {
    expect(wrapText("one two three", 75, measure)).toEqual([
      "one two",
      "three",
    ]);
    expect(() => wrapText("unbreakable", 50, measure)).toThrow("safe width");
  });
  it("preserves word coverage and blanks meaningful speech gaps", () => {
    const result = segmentCaptions(fixtureWords, 420, measure);
    expect(result.flatMap((c) => c.wordIds)).toEqual(
      fixtureWords.map((w) => w.wordId),
    );
    expect(result[0].end).toBe(2.9);
    expect(result[1].start).toBe(4.1);
    expect(result.every((c) => c.lines.length <= 2)).toBe(true);
  });
  it("splits a long phrase at two lines without losing tokens", () => {
    const result = segmentCaptions(fixtureWords, 160, measure);
    expect(result.length).toBeGreaterThan(3);
    expect(result.flatMap((c) => c.wordIds)).toHaveLength(fixtureWords.length);
    expect(
      result.every(
        (c) =>
          c.lines.length <= 2 && c.lines.every((line) => measure(line) <= 160),
      ),
    ).toBe(true);
  });
  it("rejects overlapping words instead of guessing alignment", () => {
    expect(() =>
      segmentCaptions(
        [{ ...fixtureWords[0], end: 2 }, fixtureWords[1]],
        420,
        measure,
      ),
    ).toThrow("Invalid word timing");
  });
  it("anchors motion to the fixture word rather than arbitrary animation delays", () => {
    expect(fixtureEvents.map((e) => e.start)).toEqual([1.1, 5.35, 8.2]);
  });
  it.each(["vertical", "horizontal"] as const)(
    "reserves essential bounds in %s",
    (format) => {
      const layout = sceneLayout(format);
      for (const node of layout.nodes) {
        expect(node.x).toBeGreaterThanOrEqual(layout.margin);
        expect(node.x + layout.nodeWidth).toBeLessThanOrEqual(
          layout.width - layout.margin,
        );
        expect(node.y + layout.nodeHeight + 8).toBeLessThan(layout.captionTop);
      }
      expect(layout.captionTop + 176).toBeLessThan(layout.height - 96);
    },
  );
});

it("converts measured caption groups into nonoverlapping output frames", () => {
  const captions = segmentCaptions(fixtureWords, 420, measure);
  const frames = captionFrames(
    captions.map(({ start, end }) => ({ start, end })),
    30,
    12,
  );
  expect(frames[0]).toEqual({ startFrame: 21, endFrame: 87 });
  expect(frames[1].startFrame).toBe(122);
  expect(
    frames.every(
      (frame, i) => !i || frame.startFrame >= frames[i - 1].endFrame,
    ),
  ).toBe(true);
});
