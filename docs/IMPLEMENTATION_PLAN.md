# Implementation checklist and AI task handoff

**Status:** T01, T02 and T04 are implemented. T03 user auth flows are confirmed; broader hosted security/storage checks remain open. T05 is next and not started. See [progress](PROGRESS.md) for evidence.

## Execution rules

Work in dependency order. For each task read its referenced guides, implement a small coherent slice, run meaningful checks, and record changed files, evidence, limitations, and next task. Never mark a task complete from a screenshot/mock alone when it needs database/provider behavior. Do not bulk-build later features while a feasibility gate is blocked.

Use one repository. Prefer established dependencies only when they simplify the real task. Select supported compatible package versions at implementation time using official docs; do not invent pins here. No subagent delegation is required by these guides. No paid plan, domain, top-up, or live public anonymous generation is authorized.

## Ordered tasks

| ID | Task | Dependencies | Exit criteria and required evidence |
|---|---|---|---|
| T01 | Initialize Next.js/TypeScript app and basic checks | None | App starts; typecheck/lint/build/test scripts exist and pass as applicable; secret/generated-media ignores; `.env.example` contains placeholders only |
| T02 | Shared schemas and lawful sample fixtures | T01 | Plan/audio/timeline contracts from pipeline guide, malformed input rejection, deterministic timing fixtures; no live credentials needed |
| T03 | Supabase schema, RLS, auth and approval | T01–T02 | Migrations/seeds; email/password confirmation/recovery redirects and verified $0 delivery; two-user ownership/self-approval tests; private Storage access; no production reset |
| T04 | Local one-scene renderer and custom captions | T02 | Fixed supported scene renders with fixture timing; both layouts; no arbitrary generated code; frame/word timing tests |
| T05 | Real hosted feasibility slice | T03–T04 | Actual free ElevenLabs timing → validated composition → Inngest short steps → Sandbox → Supabase upload → public-app signed playback; developer computer not needed; measured quota/runtime/file size recorded |
| T06 | App shell, sample gallery, dashboard and draft autosave | T03–T05 | Responsive samples/project CRUD; safe access states, save conflict handling; one visual token set recorded |
| T07 | Gemini idea and combined plan | T02, T06 | Verified free model, structured output, bounded history/repair, representative scene cards, direct/conversational edits; no media before approval |
| T08 | Full approved generation workflow | T05, T07 | Immutable plan approval, DB claim/idempotency/quota guards, scene reuse, progress/cancel, both outputs, output validation and cleanup |
| T09 | Revision, review and download | T08 | Dependency-aware scene changes, explicit reviewed asset, alternate-format review, expired signed URL renewal, preserved prior output |
| T10 | Persisted schedules and simulated publish | T09 | Pinned reviewed artifact, zones/window, stale wake/cancel tests, mode labels, no accidental Meta call |
| T11 | Conditional live Instagram integration | T10 and verified Meta access | Real authorized destination, secured tokens, safe media delivery, duplicate/unknown outcome handling; otherwise explicitly deferred with simulation retained |
| T12 | Acceptance, cleanup, public release and README | T06–T10; T11 only if enabled | PRD core AC evidence, live hosted smoke evidence, tested free plan settings, public URL, benchmark samples, known limitations/attribution, CI without live AI calls |

T05 is the primary feasibility gate. Build only a thin functional page to prove hosted playback; this does not require the full UI. If actual free account access, timestamp support, 1080p size, or hosted rendering fails, document the precise constraint and work on fixtures/isolated components only. Do not claim the main hosted feature is complete or quietly buy capacity.

## Suggested vertical slices

1. A static scene with lawful recorded timing can render locally.
2. An authenticated approved owner can render and retrieve that scene in hosted infrastructure.
3. Real ElevenLabs timing replaces the fixture with correct synchronization.
4. A full approved multi-scene plan produces a 60–90 second export.
5. A single narration revision rebuilds only dependencies.
6. A pinned output enters simulated publication and schedule cancellation.

This sequence isolates failure causes. It does not change the four visible creator stages.

## Per-task completion record

Maintain a short `docs/PROGRESS.md` during implementation (create it when T01 begins). Each entry: task ID/status, concrete outcome, files/commands, tests and actual result, live versus fixture evidence, resource usage if applicable, unresolved failure, next action. Do not maintain duplicate detailed task state in every document.

Example handoff instruction:

> Implement T02 from IMPLEMENTATION_PLAN.md. Follow AGENTS.md and VIDEO_PIPELINE.md. Add validated schemas and deterministic fixtures/tests; do not configure paid providers or implement the dashboard. Report checks and remaining uncertainty.

## Scope-change handling

If a feature adds another infrastructure service, billing exposure, generic framework, or user stage, stop expanding that feature and evaluate against PRD scope. Routine implementation details can be decided and logged without asking permission. Ask only for genuinely missing product choices, credentials/access, unavoidable paid requirements, or destructive actions; identify the concrete blocker.

