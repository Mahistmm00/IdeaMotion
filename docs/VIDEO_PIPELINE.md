# Video, caption, and animation pipeline specification

**Status:** Internal design contract, 19 October 2026. This defines our data/algorithms; T04 now implements one local process-scene fixture and custom captions. See [local rendering](LOCAL_RENDERING.md); the full pipeline remains planned. [PRD](PRD.md) owns duration/formats/quality targets; [API/workflows](API_WORKFLOWS.md) owns asynchronous jobs.

## 1. Responsibilities and boundaries

Gemini proposes structured content; ElevenLabs provides speech and actual character alignment; our deterministic TypeScript modules compose readable captions and semantic visual cues; Remotion produces frames/audio; Vercel Sandbox runs hosted encoding; Supabase retains artifacts. No transcription/forced-alignment provider or arbitrary generated-code execution is allowed.

The creator approves narration/visual plan before full production. AI descriptions are insufficient unless they map to supported component parameters. A final render must use one compatible set of versioned artifacts.

## 2. Internal contracts

Implement these as runtime-validated TypeScript/Zod types during T02. Contract names below are ours, not provider response field names. Schema version 1 is initial; unsupported versions fail explicitly.

### `ScenePlanV1`

| Field | Meaning |
|---|---|
| `schemaVersion` | Literal 1 |
| `sceneId` | Stable unique identifier within project lineage |
| `narration` | Approved English spoken text |
| `displayText` | Titles/labels that can differ from spoken normalization |
| `component` | Supported discriminated component type |
| `visual` | Component-specific entities/relationships/layout hints |
| `estimatedDurationSeconds` | Planning estimate only |
| `cues` | Validated visual events anchored to a phrase and occurrence |

Component types: `concept`, `labeledDiagram`, `process`, `comparison`, `dataChart`, `takeaway`. Use a discriminated union with bounded arrays/text and explicit allowed fields. A chart requires supplied or reviewed data; no invented statistics. Entity IDs are unique; every arrow/label/cue references an existing allowed target. Optional supporting icons must come from a licensed static allowlist, not arbitrary remote URLs.

A cue contains `cueId`, `phrase`, zero-based `occurrence` within this scene, `targetId`, an allowed action such as reveal/highlight/moveAlongPath, and a bounded visual duration. Motion paths and properties come from trusted components; model-generated CSS, scripts, URLs, and arbitrary property access are rejected.

### `SpeechArtifactV1`

Scene ID, approved narration hash, provider/voice/model/settings identifiers, actual audio path/hash/duration, validated alignment path/hash, raw-to-normalized text mapping where needed, and schema version. Raw provider data is parsed through an adapter; never let renderer code depend directly on a provider response shape.

### `SceneTimelineV1`

Scene ID, speech dependency key, actual scene duration, word tokens with IDs/text/start/end, caption segments with display text/word IDs/start/end, and resolved animation events with cue/target/start/end. All local timestamps are finite seconds relative to the scene start. Content and version compatibility are mandatory.

### `CompositionV1`

Approved plan/version ID, ordered scene timelines and component parameters, format, dimensions/fps from PRD, global offsets, selected trusted visual settings, asset references and dependency hashes. Renderer receives only validated data; no provider secrets. Preview/export must derive from this same composition contract.

## 3. Alignment algorithm

1. Parse timing-enabled ElevenLabs response in its adapter and decode/check audio.
2. Validate that character/start/end arrays correspond, timestamps are finite and bounded by measured audio, and each end is not before its start. Accept provider-coincident punctuation/character timings where valid; reject real backward ordering and mismatched lengths.
3. Use spoken/normalized alignment appropriate to returned audio. Preserve approved source text separately. Case/punctuation/whitespace normalization must not invent a number/pronunciation equivalence.
4. Tokenize English words while retaining source character ranges and punctuation. For a token, derive its interval from covered timed characters. Zero-duration punctuation does not become a flashing caption.
5. Map display text to normalized spoken tokens explicitly where abbreviations/numbers differ. If a meaningful mapping is uncertain, repair or fail the scene; don't hide uncertainty with evenly distributed timing.
6. Find cue phrase occurrences inside this scene's normalized token sequence. Use phrase plus occurrence, not first global substring match. Detect missing/overlapping ambiguous matches.
7. Resolve cue start from matched token timing; set event end from validated duration/scene constraints. Deliberate visual anticipation must be explicit and bounded, never accidental negative time.
8. Derive captions and final scene duration including allowed visual holds. Accumulate scene durations into global offsets exactly once.

Missing/invalid alignment cannot silently pass synchronization. A bounded provider retry may recover it, subject to remaining free quota; do not add another provider.

## 4. Caption segmentation and timing

PRD owns presentation targets: phrase-based, at most two lines initially, high contrast and readable holds. Implement width-aware layout using the actual font/layout dimensions, not only a fixed character count.

Group adjacent tokens using punctuation and phrase boundaries until the next token would exceed width, line count, or reasonable reading duration. Start near first audible token, end near the final covered token, and avoid overlap with the next segment. Do not lengthen a caption past the next speech phrase just to satisfy minimum hold. Very short rapid speech may require regrouping; never make false timing claims.

Represent times as half-open intervals `[start, end)`. Convert seconds to frame boundaries consistently: start at floor(start × fps), end at ceil(end × fps), bounded to valid frames and at least one frame for a visible segment. Adjacent caption intervals must not both own the same output frame; clamp the previous end to the next start or merge/resegment if that would make it unreadable. Keep underlying audio timing in seconds to avoid accumulating rounding drift.

Caption spelling/display edits keep token IDs/timing if meaning is unchanged. A semantic rewrite cannot be treated as a pure display patch. Long equation/symbol content belongs in the diagram with an appropriate spoken explanation; don't force it into illegible subtitle text.

Provide fixtures for speech gaps, fast phrases, punctuation, “AI” versus spoken letters, “2026” versus spoken words, decimals, names, repeated phrase occurrences, absent anchors, and scene boundaries.

## 5. Visual composition and responsive formats

Trusted components implement separate layout rules for 9:16 and 16:9. The same explanation/entity model can be reused; positions, line breaks, diagram orientation, caption area, and sizes are recomputed. Do not render a horizontal scene then crop its center into vertical.

Maintain a reserved caption zone and safe margins. Test typography at real output size and a phone-sized preview. Each component must declare essential bounds and reject/report overflows. Avoid fitting by shrinking until unreadable. Simplify labels or change layout through a reviewable plan revision when necessary.

Visual actions support clear reveal/highlight/path/transition sequences. A process arrow must represent the relationship in the narration. Only animate supported parameters; no universal animation-code agent. Charts use actual supplied data and honest scales.

Final narration controls global synchronization. Visual-only holds can support comprehension but must stay within approved duration policy. Sequential scene synthesis needs continuity checks so pauses/voice shifts do not undermine quality.

## 6. Artifact dependency and reuse keys

| Artifact | Hash inputs that determine compatibility |
|---|---|
| Speech | Narration text, language, provider/model/voice, synthesis settings, adapter contract version |
| Alignment/tokens | Actual audio hash, returned alignment hash, normalization/tokenization version |
| Captions | Token timeline hash, display edits, segmentation/layout version, format |
| Animation timeline | Resolved tokens, scene visual/cue plan, timing algorithm version |
| Composition/render | Ordered scene assets/timelines, visual component version, format/dimensions/fps, encoder settings |

Do not use filename or scene ID alone as a cache key. Content changes can preserve scene ID while invalidating audio. Format changes usually preserve speech but invalidate layout/render. Separate display-caption changes from narration edits, and preserve unaffected compatible artifacts. Keep a pinned reviewed render immutable.

## 7. Rendering and storage protocol

Prepare a validated composition and accessible input artifacts. Start sandbox through the trusted server adapter, persist its ID, render asynchronously, inspect the output, and upload directly to the exact authorized Storage destination. Use bounded status checks instead of holding one function invocation open for the full render.

Check actual duration, width/height, streams/codecs, byte size, complete ending, and audio decodability before/after upload as practical. A poster/preview does not prove MP4 success. Upload failure leaves a recoverable job, not Ready. Do not tear down the only completed temporary output before confirming persistence or explicitly accepting loss with a safe failed state.

Sandbox stop/cleanup is required after completion/cancellation where possible. Ambiguous start/stop responses require reconciliation, not uncontrolled duplicate workers. Enforce remaining compute/storage budgets before new work. File-size/encoding settings are a benchmark gate; no silent paid storage or dimension downgrade.

## 8. Revisions and failure recovery

Use the PRD revision matrix. Material script changes return to Plan; no approval can be inferred from an AI-generated rewrite. Small caption/visual changes create a new reviewable output and leave old render available.

On one failed scene, retain compatible successful scenes. On timeline failure, keep the source/diagnostic code privately and present a safe scene-level repair action. A quota error does not trigger repeated re-synthesis. Transient failures follow the bounded retry budget and uncertain outcomes are charged conservatively against available quota reservations.

## 9. Proof required before broad UI work

Run a small valid fixture through local timing/render, then actual voice and hosted render/upload. Test both output formats, one repeated cue phrase, one narration revision, one expired access URL, and a forced upload failure. Record actual timing accuracy, file size, render duration/CPU/memory use, free allowance consumed, and license/attribution eligibility. Do not estimate videos-per-month solely from a provider's character-credit count.
