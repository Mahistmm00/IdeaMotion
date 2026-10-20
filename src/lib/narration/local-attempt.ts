import "server-only";
import { mkdirSync, writeFileSync } from "node:fs";
import path from "node:path";

/** Atomic local proof guard. A crash leaves the intent in place for reconciliation. */
export function reserveLocalAttempt(
  directory: string,
  receipt: {
    modelId: string;
    voiceId: string;
    narrationHash: string;
    characters: number;
    startedAt: string;
  },
) {
  mkdirSync(directory, { recursive: true });
  writeFileSync(
    path.join(directory, "attempt.json"),
    JSON.stringify({ state: "reserved", ...receipt }),
    { flag: "wx" },
  );
}
