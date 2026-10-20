import { mkdtempSync, readFileSync, rmdirSync, unlinkSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));

import { reserveLocalAttempt } from "./local-attempt";

it("reserves once and retains the original intent after a duplicate or restart", () => {
  const directory = mkdtempSync(path.join(tmpdir(), "ideamotion-attempt-"));
  const receipt = {
    modelId: "test-model",
    voiceId: "test-voice",
    narrationHash: "a".repeat(64),
    characters: 100,
    startedAt: "2026-10-20T00:00:00Z",
  };
  try {
    reserveLocalAttempt(directory, receipt);
    expect(() =>
      reserveLocalAttempt(directory, { ...receipt, characters: 200 }),
    ).toThrow();
    const saved = JSON.parse(
      readFileSync(path.join(directory, "attempt.json"), "utf8"),
    );
    expect(saved.state).toBe("reserved");
    expect(saved.characters).toBe(100);
  } finally {
    unlinkSync(path.join(directory, "attempt.json"));
    rmdirSync(directory);
  }
});
