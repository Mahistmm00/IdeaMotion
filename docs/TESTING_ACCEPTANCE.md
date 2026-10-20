# Testing, evidence, and acceptance guide

**Status:** T02 schema/timing tests implemented and passing on 20 October 2026; remaining scenarios below are a test plan. See [progress](PROGRESS.md) for evidence. PRD sections 21–22 own release targets and acceptance IDs.

## 1. Strategy

Use Vitest for deterministic timing/schema/application logic and a small Playwright set for user flows. Add database policy/integration tests against disposable/local Supabase or a dedicated free test environment without destructive reset of real data. CI uses lawful fixtures/fakes and never consumes live AI quotas by default.

Test failure boundaries and business invariants, not implementation mirrors. Do not add dozens of shallow snapshot tests or require a paid visual testing service. Logs/reports redact private text and secrets.

## 2. Required scenario inventory

| Test group | Cases | Evidence |
|---|---|---|
| Plan schemas | Valid component union, unknown fields/component, duplicate entity/scene IDs, bad cue target, unsupported language, invented chart data without source | Deterministic pass/fail fixtures |
| Alignment | Mismatched arrays, NaN/negative/backward/out-of-bounds time, coincident punctuation, corrupt/empty audio | Unit tests and adapter contract tests |
| Captions/cues | Word ranges, punctuation, normalized numbers/acronyms, repeated phrase occurrence, missing anchor, speech gap, fast phrase, frame boundaries | Expected token/caption/event timelines |
| Formats/layout | Actual-font width, long labels, caption collision, vertical process orientation, horizontal comparison | Rendered benchmark frames and manual inspection |
| Revision reuse | Visual/caption-only reuse; narration/voice invalidation; format-only render; incompatible hash rejected | Dependency tests |
| Auth/RLS | Two users, unapproved session, forged owner ID, self-approval update, service-route authorization, private storage path | Real policy/integration evidence, not mocked allow/deny alone |
| Jobs | Repeated click, same key/different body, global claim race, event failure after commit, old callback after retry, ambiguous sandbox creation, stuck heartbeat | DB/workflow adapter tests |
| Renderer cleanup | Valid stored output but failed/uncertain sandbox stop; attempted second render | Output remains playable; global claim held until confirmed non-running |
| Recovery | Scene failure retains peers, interrupted UI, cancel while synthesizing/rendering, upload failure, oversized file, quota exhausted | Integration tests and UI safe states |
| Publication | Fixture mode can't call live adapter, pinned artifact, stale revision wake, cancellation race, DST, late window, uncertain provider result | Workflow tests; live evidence separate |
| Storage/deletion | Signed access expiry, path traversal attempt, pinned cleanup, duplicate cleanup, active job deletion | Integration tests/dry-run output |

## 3. Browser flows

E2E-01: public visitor opens sample, reviews plan and plays/downloads designated sample; network assertions confirm no live AI/render call.

E2E-02: unapproved user signs in and sees access state; direct live API attempts fail. Approved user can create/resume own draft, save, reload, and edit without data loss.

E2E-03: idea → combined plan → approve → fixture-backed job progress → ready preview → specific revision → reviewed output → download. Mark provider adapter mode in evidence.

E2E-04: display current output while replacement runs, handle stale revision conflict, refresh into running job, and show quota failure without payment CTA.

E2E-05: select reviewed vertical output, simulate publish/schedule, reschedule/cancel, confirm no actual Meta call; horizontal selection requires reviewed adaptation.

Keyboard-check primary controls/dialogs and inspect approximately 375/768/1440 px. Verify focus after error/dialog closure, labeled inputs, playback controls, and reduced-motion interface behavior. Save representative screenshots in release evidence, excluding sensitive accounts.

## 4. Live smoke checks

Run only with verified free allowances, approved credentials, and permitted content. Bound input and retry count first. Each check records provider/model/voice configuration identifiers (not keys), timestamp, artifact hashes, actual media size/duration, elapsed stages, account allowance before/after where available, and outcome.

LIVE-01: actual ElevenLabs response contains valid usable timing and permitted audio.

LIVE-02: actual Vercel Sandbox renders and uploads a valid output directly to Supabase; signed playback works from deployed URL while developer computer is offline. Check stop/cleanup and job reconciliation.

LIVE-03: actual Gemini generates schema-valid plan with supported visuals and reasonable narration; no invented benchmark data.

LIVE-04 (conditional): live Instagram destination, scopes/connection, media processing and external post ID confirmed. This is an external posting action and requires the user's explicit authorization for the actual test post; adapter tests alone do not authorize posting content to someone else's account.

Mocked/fixture checks do not count as LIVE evidence. Conversely, one successful live render does not replace RLS, failure, or duplicate-submission tests.

## 5. Benchmark review

Use the three PRD topics, both formats, and the exact selected voice/style. Evaluate learning objective, factual accuracy, sequence, diagram agreement, readable text, phrase timing, natural speech, and complete ending. Record measured errors against PRD timing targets; do not invent a passing percentage from a few attractive frames.

Sample several word starts and all key cues, including beginning/middle/end and scene boundaries; keep expected-versus-observed timestamps. A semantic contradiction, clipped ending, or private data leak blocks acceptance regardless of numerical average.

## 6. Gates and evidence format

| Gate | Required evidence |
|---|---|
| Task completion | Relevant commands and actual results, or clear reason a check could not run |
| T05 feasibility | LIVE-01/LIVE-02, file/compute measurements, actual free plan eligibility; blocked means not complete |
| Core release | PRD AC-01–AC-13 and AC-15 mapped to tests/manual evidence; no unresolved critical authorization/synchronization/output failures |
| Optional live publishing | AC-14 and LIVE-04 with authorized destination and truthful result |
| Public URL | Quota-safe access mode, no leaked secrets, no unlimited anonymous generation, sample availability/attribution |

Create a compact verification report during implementation: commit/revision, environment, test ID, adapter mode, command/action, actual outcome, artifact/report location, and limitations. A screenshot alone cannot establish API or database correctness. If tests fail, fix relevant defects and repeat affected checks; do not repeatedly rerun broad suites without new changes or unresolved reasons.

