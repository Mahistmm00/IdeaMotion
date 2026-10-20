# Shared contracts and fixture guide

Implemented in T02. These are internal contracts, not ElevenLabs response shapes, database authorization, or proof of rendered media. The [video pipeline](VIDEO_PIPELINE.md) remains the domain specification.

## Modules

| Module under `src/` | Purpose |
|---|---|
| `lib/schemas/common.ts` | Brief limits, stable scene/entity IDs, relative object keys, hashes, format dimensions |
| `lib/schemas/plan.ts` | `scenePlanSchema`, `planSchema`, inferred `ScenePlanV1` and `PlanV1` |
| `lib/schemas/timeline.ts` | Speech artifact, character alignment, word, caption, resolved event, and scene timeline schemas |
| `lib/schemas/composition.ts` | Complete version-1 composition, scene ordering, format and dependency checks |
| `lib/timing/anchors.ts` | Scene-local phrase matching by explicit zero-based occurrence |
| `lib/timing/frames.ts` | Half-open caption intervals converted to nonoverlapping frames |
| `fixtures/samples.ts` | Factory for three original educational sample projects, plus an illustrative chart scene |
| `fixtures/timing.ts` | Synthetic punctuation, pauses, fast speech, repeated anchors, and explicit spoken-normalization examples |

Use `schema.safeParse(unknownInput)` at a boundary and handle its issues; use `schema.parse` for trusted construction where invalid output is a programmer error. Infer TypeScript types from schemas rather than writing a parallel interface. Unknown fields, unknown versions, NaN/Infinity, implicit numeric coercion, executable visual fields, and remote asset URLs are rejected. Narrative strings are text data and must still be escaped by the eventual UI.

## Current contract defaults

- Product brief limits and English/format defaults follow PRD section 9. No voice/provider key is accepted in the brief; provider selection remains trusted configuration.
- Complete plans have 4–10 unique scenes with a summed estimated duration of 60–90 seconds. Individual scenes allow 1–30 estimated seconds, 2,000 narration characters, 300 display characters, 12 entities, 20 connections, and 24 cues. Cue durations are 0.1–5 seconds. These bounded internal defaults can be tuned during rendering benchmarks; they are not provider limits.
- Supported components: concept, labeled diagram, process, comparison, data chart, takeaway. IDs are unique within a scene's visual targets. Connections and cue targets must exist. Path motion targets a trusted connection only. Chart data must carry supplied/reviewed provenance; a model claiming `reviewed` is **not** evidence of actual review. Trusted approval must establish provenance before live generation.
- Timelines use finite local seconds and half-open intervals. Words and captions are ordered/nonoverlapping. Every spoken word belongs to exactly one caption in order. Events stay within scene bounds. Compositions require matching scene identity, declared speech dependency, cue/event correspondence, accumulated offsets, 30 fps, 1080p dimensions, and total measured duration within 60–90 seconds.
- Relative paths reject traversal, absolute paths, URLs, query strings, backslashes and unsupported extensions. Audio references require WAV/MP3; alignment requires JSON. File existence, actual MIME/bytes, ownership and signed access are separate server checks.
- Hash shape and declared dependency equality do not prove that actual bytes match a hash, a plan is approved, or an asset belongs to a user. Trusted builders/storage services must establish those facts in later tasks. Never render a browser-supplied composition merely because it parses.

## Fixture provenance and honest use

`createSampleProjects()` returns fresh deterministic objects for the water cycle, solar versus wind, and solar panels. Each has four scene plans, synthetic word/caption timing, illustrative speech metadata, and both vertical/horizontal composition specifications. The water sample includes a repeated phrase cue resolved to its second occurrence. These are contract fixtures, not finished videos or factual benchmark approvals.

The original educational text and numeric timing data are dedicated under CC0-1.0; see `src/fixtures/LICENSE.md`. No scraped media, voice clone, paid stock asset, external model output, or copyrighted recording is included. Fixture audio paths and audio hashes are intentionally synthetic placeholders; **the files do not exist**. Keep `mode: fixture`, `timing: synthetic`, and `mediaAvailable: false` intact when using the data. Do not show a playable/downloadable output or claim real provider verification from these records.

The factory uses Node's crypto API and belongs in server/test code. A future public sample handler should return only the deliberately selected public fields, not indiscriminately serialize internal artifact metadata.

## Verification and deferred work

Run `npm test` for malformed-data, reference, timing, cue, normalization, frame-boundary and composition compatibility tests. The T01 empty-suite allowance has been removed: no tests is now a failure.

Width-aware caption segmentation, actual-font measurement, character-to-word conversion/source ranges, automatic display-to-spoken mapping, real audio decoding/byte validation, dependency-key construction for real providers, rendering, auth and API endpoints are not implemented by T02. T04 implements the local renderer/caption integration, and T05 verifies the real hosted path. Never substitute evenly spaced synthetic timing when a live alignment response is missing or invalid.
