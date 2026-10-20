# Setup, free-tier configuration, and deployment guide

**Status:** Updated 20 October 2026. Local T01 scaffold commands are available in the [root README](../README.md); check [progress](PROGRESS.md) for verification. No environment variables are required for this scaffold. Provider accounts, migrations, live integrations, and deployment remain planned. The provider sections below are future gates, not executable setup instructions for T01.

## 1. Prerequisites and verification

Use existing computer/internet and compatible supported Node.js/package-manager versions selected at T01. Record exact tested versions/lockfile. No hardware purchase, paid domain, cloud GPU, or paid API subscription.

Before any provider integration, read its current official docs and check the actual account plan, quota units/reset, payment requirements, pause/overage behavior, licensing/data-use terms, and access eligibility. Prior pricing citations are planning evidence, not a permanent free guarantee. Do not activate billing or a paid fallback to get a feature working.

## 2. Configuration classification

Create `.env.example` with placeholders only. Keep actual local secrets in ignored environment files and hosted secrets in project configuration. Names below are semantic requirements; SDK-specific names are finalized during integration.

| Configuration | Visibility | Checks |
|---|---|---|
| Supabase project URL and publishable key | Browser-safe only with correct RLS | Correct project; no privileged key in public prefix |
| Supabase privileged credential | Server only | Minimal trusted operations; never bundle/log/share with user props |
| Auth redirect/base URL | Nonsecret | Exact localhost/deployed allowlist; validate auth flow |
| Approved-user control | Trusted DB/admin only | Signup metadata cannot self-approve |
| Gemini key/model and configured budget | Server only | Actual free model/capability; no paid fallback |
| ElevenLabs key/voice/model/budget | Server only | Timing-enabled, allowance and permitted use checked |
| Inngest event/signing credentials | Server only | Verify deployed incoming handler; local-dev mode separated |
| Vercel Sandbox authorization/project binding | Server only | Official supported auth path; Hobby quota, no broad public token |
| Storage bucket/retention/file guards | Server configuration | Private media; actual free file/transfer limit verified |
| Publishing mode | Server-enforced live/simulated | Fail closed; not overridable by client |
| Meta client/token-encryption configuration | Server only, conditional | Callback state, token storage and permission review |

Do not add Meta secrets until the live milestone. Do not ask the user to paste keys into chat or commit them. Offer direct environment configuration instructions when implementation needs credentials.

## 3. Local setup sequence

1. Install dependencies from the committed lockfile after T01 creates it.
2. Copy placeholder env structure into an ignored local file and configure fixture mode first.
3. Apply versioned migrations to disposable/local or explicitly selected free development Supabase. Confirm target identity before destructive commands; never reset a real hosted database as a setup shortcut.
4. Seed lawful sample metadata and nonsecret fixtures. No provider keys or privileged user sessions in seed files.
5. Start app and local Inngest development integration using actual documented scripts from implementation. Verify sample behavior without AI credentials.
6. Enable only the provider being tested; verify approval and quotas first. Keep live publishing disabled by default.
7. Run typecheck/lint/tests/build and relevant local renderer proof.

A local development process stopping does not prove the hosted system is offline. Conversely, local success does not prove Vercel deployment compatibility.

## 4. Hosted setup sequence

### Supabase Free

- One project initially. Apply schema/RLS migrations and verify two-user tests.
- Configure exact allowed auth callback, email-confirmation and password-recovery URLs. The requested email/password UI requires a verified $0 delivery path and provider-limit checks before implementation. Do not add a paid SMTP/auth service or assume public email delivery is unrestricted.
- Set up private media bucket and narrow policies/upload mechanism. Create a trusted approved owner profile.
- Verify actual DB/storage/transfer/file caps, inactivity pause, and restoration behavior. Store only the small retained demo set; no artificial keepalive traffic.

### Vercel Hobby and Sandbox

- Deploy the single app to a public provider URL under qualifying personal/noncommercial terms.
- Set server/public environment variables with correct visibility; inspect built output/network for secret leaks.
- Configure official Sandbox authorization and tested Remotion bundle access. Do not place Sandbox credentials or Supabase privileged keys in composition inputs.
- Start a small bounded render, upload output directly to Storage, validate signed access, stop sandbox, and record actual compute/resource use.
- Test output persistence after sandbox shutdown and browser closure. The developer's computer must not be required for hosted jobs.

### Inngest Free

- Register the deployed endpoint through supported integration and verify request signing.
- Use short idempotent steps for orchestration; no paid Inngest sandbox/compute, separate workers, Redis, or infinite polling.
- Confirm execution accounting for runs/steps/retries and sleep limits. Initial schedule window comes from PRD.
- Exercise dispatch-pending resume, cancellation, old revision wake, and lost response reconciliation.

### AI and optional publishing

- Enable live AI for approved users only, after a free allowance and use eligibility check. Set shared conservative budgets before opening access.
- Verify ElevenLabs timestamp schema and attribution conditions with actual output.
- Leave publishing simulated until Meta account/access/callback/media path are proven. A successful connection is not evidence of a published post.

## 5. Release checks

Use the testing guide and PRD acceptance IDs. Confirm real hosted generation, both formats, file caps, RLS, no client secrets, safe errors, labeled fixtures, private signed media, bounded workflow retries, cleanup dry run, and no paid plans/top-ups. Record a smoke video/screenshot set and truthful README limitations.

Free services can pause or exhaust quotas; show current availability and samples rather than promise 24/7 generation. A custom domain is not necessary. Do not leave a public endpoint that lets anonymous visitors spend the owner's quota even when the UI hides it.

## 6. Troubleshooting and recovery

| Symptom | First checks / safe action |
|---|---|
| OAuth loop/callback error | Verify deployed/local callback allowlists and session cookies; preserve draft |
| RLS/access error | Reproduce with normal user; inspect policy/ownership; do not disable RLS as a fix |
| Job dispatch pending | Inspect saved job and dispatch result; resend same identity, not new generation |
| Render has no progress | Inspect saved sandbox reference/heartbeat; reconcile before another sandbox |
| Audio no valid alignment | Verify supported endpoint/model; bounded repair; no guessed subtitle timing |
| MP4 upload fails | Check actual bytes/type/free cap and authorized destination; preserve temporary output where possible |
| Signed playback expires | Reauthorize and issue new access, no re-render |
| Quota exhausted | Stop live work; samples/local fallback; no upgrade/top-up |
| Database paused | Restore through supported free account flow if available; don't claim queued work was saved while unavailable |
| Live publication uncertain | Inspect external IDs/provider state; don't blindly repost |
| Secret exposed | Disable affected live feature, revoke/rotate credential, remove source/log exposure; inspect access before re-enabling |

For rollback, use a known-good app revision and disable incompatible jobs/features. Database migrations should be additive when feasible; do not automatically run a destructive down/reset migration on private data. Freeze/reconcile in-flight jobs before changing state contracts. Document any data repair before applying it.

## 7. Required README additions at implementation

Exact local commands, environment variable names/visibility, tested versions, migrations/seeds, auth setup, public URL, live/sample modes, approval restrictions, free limits, unit/hosted evidence, cleanup command, retention/attribution, optional Meta status, and known limitations. Until those exist, do not fabricate passing commands or deployment results.
