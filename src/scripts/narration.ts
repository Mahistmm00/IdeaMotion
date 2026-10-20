import { execFileSync } from "node:child_process";
import { createHash } from "node:crypto";
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import { z } from "zod";
import { wordsFromAlignment } from "../lib/narration/alignment";
import {
  checkNarrationAccess,
  NarrationError,
  narrationConfig,
  synthesizeNarration,
} from "../lib/narration/elevenlabs";
import { reserveLocalAttempt } from "../lib/narration/local-attempt";
import { resolveCue } from "../lib/timing/anchors";
import { fixturePlan } from "../video/fixture";
import { narratedPropsSchema } from "../video/narrated-contract";

const hash = (bytes: string | Buffer) =>
  createHash("sha256").update(bytes).digest("hex");
const command = process.argv[2];
const root = process.cwd();
const directory = path.join(root, "artifacts/narration-proof");
const receiptPath = path.join(directory, "attempt.json");
function binary(name: "ffmpeg" | "ffprobe") {
  const configured = process.env[`${name.toUpperCase()}_PATH`];
  const local = path.join(
    root,
    "node_modules/@remotion/compositor-win32-x64-msvc",
    `${name}.exe`,
  );
  if (configured && path.isAbsolute(configured) && existsSync(configured))
    return configured;
  if (process.platform === "win32" && existsSync(local)) return local;
  throw new Error("MEDIA_TOOLS_REQUIRED");
}
function prepare() {
  const audioPath = path.join(directory, "speech.mp3");
  const metadata = JSON.parse(
    execFileSync(
      binary("ffprobe"),
      [
        "-v",
        "error",
        "-show_entries",
        "format=duration:stream=codec_name,codec_type",
        "-of",
        "json",
        audioPath,
      ],
      {
        encoding: "utf8",
        timeout: 15000,
        maxBuffer: 100000,
        stdio: ["ignore", "pipe", "pipe"],
      },
    ),
  );
  const probe = z
    .object({
      format: z.object({ duration: z.coerce.number().positive().max(30) }),
      streams: z
        .array(
          z.object({
            codec_name: z.literal("mp3"),
            codec_type: z.literal("audio"),
          }),
        )
        .length(1),
    })
    .parse(metadata);
  execFileSync(
    binary("ffmpeg"),
    [
      "-v",
      "error",
      "-xerror",
      "-i",
      audioPath,
      "-c:a",
      "pcm_s16le",
      "-f",
      "null",
      "-",
    ],
    { timeout: 15000, stdio: ["ignore", "pipe", "pipe"] },
  );
  const audio = readFileSync(audioPath);
  const response = JSON.parse(
    readFileSync(path.join(directory, "response.json"), "utf8"),
  );
  if (hash(Buffer.from(response.audio_base64, "base64")) !== hash(audio))
    throw new Error("AUDIO_HASH_MISMATCH");
  const adapted = wordsFromAlignment(
    response,
    probe.format.duration,
    fixturePlan.narration,
  );
  const events = fixturePlan.cues.map((cue) =>
    resolveCue(cue, adapted.words, 30),
  );
  const durationSeconds =
    Math.ceil(
      Math.max(probe.format.duration, ...events.map((e) => e.end)) * 30,
    ) / 30;
  const audioHash = hash(audio);
  const receipt = JSON.parse(readFileSync(receiptPath, "utf8"));
  const speechDependencyKey = hash(
    JSON.stringify({
      narration: fixturePlan.narration,
      model: receipt.modelId,
      voice: receipt.voiceId,
      stability: 0.5,
      similarityBoost: 0.75,
      adapter: 1,
      audioHash,
      alignment: hash(JSON.stringify(adapted.alignment)),
    }),
  );
  const props = narratedPropsSchema.parse({
    format: "horizontal",
    narration: fixturePlan.narration,
    audioHash,
    speechDependencyKey,
    durationSeconds,
    words: adapted.words,
  });
  writeFileSync(
    path.join(directory, "props-vertical.json"),
    JSON.stringify({ ...props, format: "vertical" }, null, 2),
  );
  const mediaDir = path.join(root, "public/narration-proof");
  mkdirSync(mediaDir, { recursive: true });
  writeFileSync(path.join(mediaDir, `${audioHash}.mp3`), audio, { flag: "w" });
  writeFileSync(
    path.join(directory, "props.json"),
    JSON.stringify(props, null, 2),
  );
  writeFileSync(
    path.join(directory, "evidence.json"),
    JSON.stringify(
      {
        mode: "live-elevenlabs-local",
        audioHash,
        audioBytes: audio.length,
        measuredAudioSeconds: probe.format.duration,
        durationSeconds,
        alignmentSource: adapted.source,
        wordCount: adapted.words.length,
        cueStarts: events.map((e) => ({ cueId: e.cueId, start: e.start })),
        title: "The water cycle · elevenlabs.io",
        hosted: false,
      },
      null,
      2,
    ),
  );
  console.log(
    "Audio decoded and timing validated. Local rendering props are ready; hosted generation is not verified.",
  );
}

try {
  if (command === "prepare") {
    prepare();
  } else if (command === "check" || command === "generate") {
    const config = narrationConfig(process.env);
    if (command === "check") {
      const result = await checkNarrationAccess(
        config,
        fixturePlan.narration.length,
      );
      console.log(
        JSON.stringify({
          status: "read-only checks passed",
          ...result,
          synthesisEnabled: config.enabled,
        }),
      );
    } else {
      if (!config.enabled) throw new NarrationError("DISABLED");
      binary("ffmpeg");
      binary("ffprobe");
      reserveLocalAttempt(directory, {
        modelId: config.modelId,
        voiceId: config.voiceId,
        narrationHash: hash(fixturePlan.narration),
        characters: fixturePlan.narration.length,
        startedAt: new Date().toISOString(),
      });
      const output = await synthesizeNarration(config, fixturePlan.narration);
      writeFileSync(path.join(directory, "speech.mp3"), output.audio, {
        flag: "wx",
      });
      writeFileSync(
        path.join(directory, "response.json"),
        JSON.stringify(output.response),
        { flag: "wx" },
      );
      // This state records provider success only, not validated/rendered media.
      writeFileSync(
        receiptPath,
        JSON.stringify({
          state: "received",
          modelId: config.modelId,
          voiceId: config.voiceId,
          narrationHash: hash(fixturePlan.narration),
          characters: fixturePlan.narration.length,
          remainingBefore: output.access.remainingCharacters,
          receivedAt: new Date().toISOString(),
        }),
      );
      prepare();
    }
  } else {
    throw new Error("Choose check, generate or prepare.");
  }
} catch (error) {
  const code =
    error instanceof NarrationError
      ? error.code
      : error instanceof Error && "code" in error && error.code === "EEXIST"
        ? "ATTEMPT_ALREADY_EXISTS"
        : "LOCAL_PROOF_FAILED";
  console.error(
    "Narration: " +
      code +
      ". See docs/NARRATION_SETUP.md. No automatic retry was made.",
  );
  process.exitCode = 1;
}
