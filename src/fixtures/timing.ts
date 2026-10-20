export const spokenNormalizationFixture = {
  sourceText: "AI in 2026 uses 3.14 as an example. Ada explains it.",
  spokenText:
    "A I in twenty twenty six uses three point one four as an example Ada explains it",
  mappings: [
    { sourceText: "AI", spokenText: "A I", occurrence: 0 },
    { sourceText: "2026", spokenText: "twenty twenty six", occurrence: 0 },
    { sourceText: "3.14", spokenText: "three point one four", occurrence: 0 },
  ],
};

// Includes a speech gap, repeated anchor, punctuation, and a fast phrase.
export const repeatedPhraseWords = [
  { wordId: "word-0", text: "Water", start: 0, end: 0.3 },
  { wordId: "word-1", text: "moves.", start: 0.31, end: 0.6 },
  { wordId: "word-2", text: "Water", start: 2, end: 2.15 },
  { wordId: "word-3", text: "moves!", start: 2.15, end: 2.3 },
];

export const punctuationAlignment = {
  schemaVersion: 1 as const,
  durationSeconds: 1,
  characters: ["H", "i", "."],
  starts: [0, 0.2, 0.4],
  ends: [0.2, 0.4, 0.4],
};
