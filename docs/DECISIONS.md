# Decision log

**Updated:** 19 October 2026. Confirmed product decisions and implementation defaults are distinguished below. Entries do not create provider access or authorize payments.

| ID | Decision | Status / reason | Authority |
|---|---|---|---|
| D01 | Portfolio/resume objective; $0 services/infrastructure | Confirmed; no paid business platform requirements | User; PRD sections 2–3, 18 |
| D02 | Four creator stages with combined script/storyboard | Confirmed; low-complexity workflow | User; PRD sections 7–12 |
| D03 | Educational motion graphics and AI voiceover | Confirmed; explain relationships rather than cinematic generation | User; PRD section 13 |
| D04 | Vertical and horizontal, 1080p MP4 | Confirmed formats; 30 fps/encoding is implementation default pending benchmark | User; PRD section 11 |
| D05 | Automatic 60–90 seconds; optional target in range | Planning default from agreed PRD; no mandatory presets | PRD sections 9, 11 |
| D06 | Supabase Auth/Postgres/Storage; exclude MongoDB/Better Auth/R2/GCS | Confirmed consolidation | User reference-stack selection |
| D07 | Next.js/TypeScript/Node.js on Vercel; Remotion + Sandbox | Confirmed selected direction; free feasibility not yet proven | PRD section 6; architecture |
| D08 | Inngest Free orchestration/scheduling | Selected direction; no paid compute or extra queue | PRD sections 6, 14 |
| D09 | ElevenLabs timing + our own synchronization | Confirmed; no separate alignment provider | User; video pipeline |
| D10 | Gemini eligible free model | Selected provider; exact model unresolved until verified | PRD section 25 |
| D11 | Public samples and approved-user live use | Confirmed budget protection; approval is simple server-controlled flag | PRD section 4 |
| D12 | GitHub OAuth, English-first, one visual system | Implementation defaults; validate callbacks/voices, record actual tokens later | PRD sections 4, 9 |
| D13 | Live Instagram conditional; simulation explicit | Scope qualification; do not claim fake posts | PRD sections 5, 12 |
| D14 | Seven-day scheduling window, bounded late retry | Implementation defaults within PRD; no publishing SLA | PRD section 12 |
| D15 | Versioned immutable approval, pinned reviewed media | Required correctness; safe revisions/schedules | PRD sections 15–16 |
| D16 | Short server steps and direct sandbox-to-Storage upload | Implementation contract; avoid request timeouts/body limits | API/workflow and database guides |
| D17 | Explicit render-review endpoint | Domain clarification; supports existing Ready action, no extra user stage | API/workflow guide |
| D18 | No microservice fleet, custom billing/analytics, enterprise framework | Confirmed simplicity boundary | User; root AGENTS.md |
| D19 | Separate successful content from renderer cleanup; hold global claim until stopped | Selected design; prevents hidden overlapping compute | System design sections 7–8; database claim/cleanup fields |
| D20 | Path-specific signed uploads to Storage, no broad key in sandbox | Selected design supported by official upload APIs; actual protocol tested at T05 | System design section 10 |
| D21 | Bounded HTTP UI polling; durable waits for render progress | Selected simplicity decision; no Realtime/WebSocket requirement | System design section 13 |
| D22 | Explicit job revision/attempt separation and submission idempotency fields | Contract reconciliation; safe stale update handling | Database and API specifications |
| D23 | IdeaMotion name and Violet & Peach theme | User-approved; supersedes Explain Studio/graphite-lime visual references; no new branding-kit feature | User naming/theme approval; UI/UX and Stitch reference |
| D24 | Signature public landing hero and visible four-step flow | User-requested; part of public product presentation, not a fifth creator stage | UI/UX specification |
| D25 | Expanded authentication designs include email/password signup and recovery | User requested all auth pages; supersedes D12 GitHub-only UI default. Supabase remains selected; $0 email-delivery feasibility must be verified before implementation | PRD section 4; UI/UX; setup guide |

## Unresolved checks

### D26 — T01 foundation tooling (20 October 2026)

Implemented Next.js **16.4.2**, React **19.3.1**, Tailwind CSS **4.3.3**, TypeScript **5.9.3**, Vitest **5.0.5**, and Biome **2.5.15** on Node **24.14.0** / npm **11.9.0**. Package versions and peer/engine constraints were checked against the npm registry during implementation; the lockfile is the exact dependency record. See [Next.js installation](https://nextjs.org/docs/app/getting-started/installation) and [Biome setup](https://biomejs.dev/installation/quick-start/).

Biome replaces the attempted ESLint setup: the React plugin did not support ESLint 10, compatible ESLint 9 was marked unsupported, and the Next ESLint dependency chain carried five high-severity audit findings. Removing that chain yielded zero audit findings at installation. No forced security downgrade or ignored peer constraints were retained. TypeScript 5.9.3 provides a conservative supported foundation; newer majors are unnecessary for this scaffold. These are local development tools, with no new infrastructure or paid service. Empty-suite test allowance lasts only until T02. Framework agent-rule generation is disabled to preserve the curated root instructions. Current validation and limitations are in [progress](PROGRESS.md).

## Remaining provider checks

Future provider SDK versions, Gemini model, ElevenLabs voice/model/eligibility, actual free account caps/reset periods, encoder bitrate/file-size quality, sandbox auth/upload implementation, polling/deadlines, final UI accessibility, and live Meta access. Resolve in the task that needs them using current official docs and measured evidence. Do not turn uncertainty into guessed SDK calls or invented test results.

## New-entry format

For a material change, add ID/date, decision, confirmed/default/verified status, concrete reason, affected docs/contracts, evidence, and any previous decision superseded. Routine internal naming needs no lengthy architectural proposal. Scope/budget changes require user direction; implementation choices within scope can be decided and recorded autonomously.

## D27 — T02 versioned validation and honest fixtures (20 October 2026)

Implemented Zod **4.6.7** after checking its current npm version and [official schema API](https://zod.dev/api). Runtime schema validation is shared; database ownership, genuine approval, stored byte/hash validation and provider eligibility remain separate trusted checks. Bounded component-specific fields replace arbitrary generated visuals. Scene narration (2,000 characters), display text (300), entities (12), connections (20), and cue count/duration (24 / 0.1–5 seconds) are initial internal guardrails, not provider limits. Complete plan defaults remain 4–10 scenes and 60–90 seconds from the PRD.

Fixtures are original CC0 text/synthetic timing data with no included audio/video. Reference paths and audio hashes are placeholders; factory provenance states media is unavailable. Width-aware caption segmentation and live alignment/byte processing remain future renderer/adapter tasks. Pure phrase/frame functions provide deterministic boundary coverage now without new services. See SHARED_CONTRACTS.md and PROGRESS.md for current contracts, tests and limits. No budget or product-scope change.

## D28 — T03 prepared auth and local PostgreSQL verification (20 October 2026)

User requested code and setup guidance without creating a Supabase project. Added @supabase/ssr 0.12.7, @supabase/supabase-js 2.118.0, server-only 0.0.1 and development-only @electric-sql/pglite 0.5.10 after checking registry versions and official integration docs. Installed package license metadata is retained in node_modules; no paid service or additional runtime infrastructure was introduced. Server Actions handle email/password auth; no browser Auth client is used, permitting HttpOnly session cookies. Proxy refresh and protected server reads are uncached and do not trust getSession data. Email verification uses explicit POST confirmation with fixed destinations and accepts bounded opaque/prefixed tokens, not an assumed SHA-256 format.

Default sender restrictions were checked against Supabase's current documentation: team addresses only and two messages/hour. Owner/team testing is the selected $0 setup path, not unrestricted public delivery; AUTH_EMAIL_ENABLED defaults false. Local policy tests execute the migration under actual PostgreSQL roles in PGlite, while platform schemas/identity are simulated. This distinction is explicit; no claim of hosted Auth/Storage/SMTP verification is made. First migration creates only required profile/project/version foundations and a private bucket with direct browser media denial. Future job/asset/signed-access work remains deferred. See SUPABASE_AUTH_SETUP.md for references, configuration and remaining gates.

### D28 follow-up — 20 October 2026

After user-reported migration application, real API checks confirmed the three table endpoints exist and reject anonymous access; Auth settings permit email signup with confirmation required. Enabled the local email-availability flag and verified the browser signup button is active. Credentials remain ignored/local. This is limited hosted-readiness evidence, not proof of successful email delivery, all ownership policies or completed authentication. See PROGRESS.md for pending checks.

### D28 callback compatibility follow-up — 20 October 2026

Support standard PKCE code callbacks as well as the custom token-hash templates. Use the documented exchangeCodeForSession API and the pinned installed SDK implementation for optional flowId/verifier behavior. Validate the runtime-only redirectType metadata before choosing recovery; unknown/absent values default to account status. Preserve explicit POST confirmation, fixed destinations and no raw-token logging. Documentation no longer claims custom email templates are the only supported path. Real code redemption and email delivery are not inferred from mocked tests or a dummy-link preview.

## D29 — Local rendering proof (20 October 2026)

Implement T04 with Remotion/player/CLI 4.0.537, bundled Inter 5.2.8 (OFL), and CLI-compatible Zod 4.5.4. Current registry peer metadata accepts the installed React version; local dependency audits reported zero vulnerabilities. Individual portfolio use qualifies under the current [Remotion license](https://github.com/remotion-dev/remotion/blob/main/LICENSE.md). No paid or cloud service was introduced.

The proof uses a fixed validated process scene, strict format-only props and original synthetic timing. It deliberately renders silent video and visibly labels this limitation; it does not invent ElevenLabs timing or adopt another speech provider. Full CompositionV1 constraints remain unchanged. A thin isolated preview reuses the export component; no dashboard or hosted generation endpoint is built ahead of T05. See LOCAL_RENDERING.md for packages, commands, measured exports and limitations.

## D30 — Real narration local proof (verification completed 21 October 2026)

Added server-only bounded ElevenLabs HTTP requests against the documented subscription/models/voice and timing endpoints, using eleven_multilingual_v2 and mp3_44100_128. Current account passed Free-plan, disabled-extension, model and premade-voice checks. User explicitly authorized one actual narration request. The saved enable flag remains false; that one command enabled synthesis only in its process environment. No paid service was activated.

Character alignment is validated against decoded/measured audio, preferring normalized alignment and rejecting unreviewed spoken-text differences. Both formats reuse the same audio/words, with bounded visual cue endings and visible ElevenLabs attribution. The exclusive local attempt receipt prevents duplicate spend and survives ambiguous outcomes; it is not a substitute for a hosted database claim. Local CLI uses development-only tsx 4.23.15; installation audit reported zero vulnerabilities. No extra speech-provider SDK was added.

This is a successful local live narration proof, not hosted T05 completion. No real credentials, raw responses or generated media are committed. Provider response/account eligibility can change; account checks remain required and no universal Free voice availability is promised. See NARRATION_SETUP.md and PROGRESS.md for exact evidence, limitations and remaining hosted gates.
