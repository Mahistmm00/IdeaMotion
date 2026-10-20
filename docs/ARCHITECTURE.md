# Selected portfolio architecture

**Updated:** 19 October 2026  
**Status:** Selected planning direction; implementation and deployment not started. Free-tier account eligibility and render performance must be validated.

This records the user's reference architecture with Supabase consolidating authentication, database, and media storage. It supersedes earlier local-only deployment recommendations. The strict $0 budget and simple single-repository architecture remain mandatory.

For complete component/deployment diagrams, sequence flows, job resource ownership, secure upload, and recovery decisions, read [SYSTEM_DESIGN.md](SYSTEM_DESIGN.md). This file remains the concise stack overview.

| Layer | Choice | Responsibility |
|---|---|---|
| Web app/backend endpoints | Next.js, TypeScript, Node.js runtime | Four-step UI, validation, protected endpoints |
| Authentication | Supabase Auth Free | Sessions and approved-user access to live generation |
| Database | Supabase Postgres Free | Projects, scene plans, narration/timing metadata, job states, approvals, schedules |
| Video/audio/assets | Supabase Storage Free | Private buckets, retained media, signed preview/download access |
| Public hosting | Vercel Hobby | Resume URL and application endpoints |
| Background workflow/scheduling | Inngest Free | Durable coordination, bounded retries, status checks, due publication jobs |
| Motion graphics/rendering | Remotion + Vercel Sandbox | Our animation components and hosted MP4 rendering |
| AI planning | Eligible Gemini free-tier model | Ideas, combined script/storyboard, conversational revisions |
| Narration/alignment | ElevenLabs Free | Narration plus character-level timestamps |
| Captions/synchronization | Our TypeScript logic | Phrase grouping and visual events mapped to actual speech timing |

MongoDB Atlas, Better Auth, Cloudflare R2, and GCS are not part of this stack. Supabase database is Postgres; media files belong in Storage, with paths and metadata in database rows.

## Hosted flow

1. An approved user submits an idea through the public Vercel application.
2. Server validates session, project ownership, input, and remaining free allowance.
3. Gemini creates the combined plan; Supabase stores its versions and approval.
4. Approval creates one persistent generation job and an Inngest event containing identifiers.
5. Short workflow steps request ElevenLabs narration/timing and build validated captions and animation cues.
6. A step starts a Remotion render in Vercel Sandbox and records its identity. Subsequent bounded checks track completion rather than keeping an HTTP request open throughout rendering.
7. Successful output is uploaded from the sandbox to Supabase Storage before the sandbox is stopped. The sandbox filesystem is temporary, not durable media storage.
8. The application reads job status and provides signed preview/download access.
9. Inngest can coordinate saved publication schedules. Actual Instagram publication remains conditional on valid Meta access and user approval.

Do not forward full MP4s through ordinary Vercel function request/response bodies, put base64 media in Postgres/Inngest events, or allow workflow retries to start duplicate renders. Use short serverless steps; Inngest does not remove Vercel function runtime limits or supply the render compute.

## Access and security

Supabase Auth replaces Better Auth. Approved-user live access is a simple server-enforced allowlist or approval flag, not an enterprise team-role system. Public visitors can inspect labeled sample projects without spending the owner's AI quotas.

Use row-level security for user-owned records and storage policies for private media. Verify authorization again in privileged server operations. Supabase privileged keys, AI keys, Inngest signing secrets, and Sandbox credentials stay server-side. Signed job events must reference a previously authorized persisted job; background handlers must not trust a user-supplied owner ID.

## Free-tier constraints

- Supabase currently lists a 500 MB database, 1 GB file storage, 5 GB egress, separately listed cached egress, and a 50 MB maximum upload size on Free. Keep retained media far below these ceilings and enforce upload-size checks. Free projects can pause after inactivity.
- Vercel Sandbox Hobby currently includes 5 active CPU hours/month and 420 GB-hours of memory/month with up to a 45-minute session. Hobby creation pauses at exhausted quotas without additional usage charges. These compute units do not imply a fixed number of videos.
- Inngest Free currently includes 50,000 executions/month, five concurrent steps, and no credit-card requirement. Runs and their steps each count as executions. Its pricing states that Free executions pause at the limit without metered overage. A sleeping run has a 30-day total limit; use a shorter initial scheduling window, proposed as seven days.
- Do not activate Inngest's separately priced sandbox/compute product. Its role here is orchestration; Vercel Sandbox supplies rendering.
- Start with one active render across the demo and an approved-user-only live path. Measure retries, render checks, storage, and provider usage, not only successful exports.
- Keep the Supabase export path within its per-file limit through tested encoding. If acceptable 1080p quality cannot fit, report the constraint and use local export fallback; never silently upgrade storage or claim hosted success.
- Recheck actual account quotas before enabling live generation. Use prepared, clearly labeled samples when any service is exhausted. Keep all services on free plans; no automatic paid fallback or top-up.

The public hosted application is the primary showcase. Local development/export remains a fallback and does not require the developer's computer to run for hosted jobs. Enterprise uptime and guaranteed scheduled dispatch are excluded; service pauses or exhausted quotas must produce honest needs-attention states.

## Verification and references

Before marking hosted generation complete, benchmark three sample topics in both formats, verify audio/timing, test direct upload and signed playback, exercise duplicate-event recovery, and confirm account-level free-plan limits. No live service configuration has been created by this planning update.

- [Supabase pricing](https://supabase.com/pricing)
- [Vercel Sandbox pricing and quotas](https://vercel.com/docs/sandbox/pricing)
- [Remotion Vercel Sandbox integration](https://www.remotion.dev/docs/vercel-sandbox)
- [Inngest pricing and free-quota behavior](https://www.inngest.com/pricing)
- [Inngest workflow limits](https://www.inngest.com/docs/durable-execution/limits)
