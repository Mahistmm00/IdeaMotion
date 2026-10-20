# Portfolio project constraints and implementation direction

**Recorded:** 19 October 2026  
**Authority:** User's portfolio/resume and $0 requirements  
**Status:** $0 and simplicity constraints confirmed. The selected hosted stack is recorded in [Architecture](ARCHITECTURE.md), including Supabase Auth/Postgres/Storage, Vercel Sandbox, and Inngest Free. That document supersedes earlier local-only recommendations below.

## 1. Governing rule

Build a high-quality portfolio demonstration, not a production SaaS business. Total paid API, hosting, infrastructure, storage, and subscription expenditure must be **$0**. Development assumes an existing computer and internet connection; no new hardware, domain purchase, or paid tools are required.

These constraints supersede earlier BRD assumptions about commercial validation, production availability, always-on workers, and a future test budget. They do not remove basic security, validation, accessible/responsive UI, or honest error reporting.

Do not activate paid plans, attach billing to enable metered infrastructure, enable automatic top-ups, or rely on expiring trial credits for the required experience. When a free allowance runs out, stop the affected operation and preserve work. Never fall back to a paid service automatically.

## 2. Two demonstration paths

### Full local demonstration

Run the application and Remotion rendering on the developer's existing computer. Use a small number of real Gemini and ElevenLabs calls only when the account has a verified free allowance. Save render artifacts on local disk outside source control. The web interface remains the four-step Idea → Plan → Video → Publish/download flow.

Use one repository and a modular Next.js/TypeScript application with Node.js endpoints. A local render command/process can share application modules. Inngest Free coordinates hosted workflows; no Redis, Kubernetes, microservice fleet, or additional queue infrastructure is needed.

Local work may continue while the browser is closed as long as the local application process is running. Computer shutdown is not equivalent to a managed always-on server: interrupted work is marked recoverable on restart, not promised to complete while offline.

### Public portfolio demonstration

Offer a clearly labeled sample/demo mode with prepared scene plans, lawful sample audio/alignment, working captions/animation previews, and a limited set of prepared exports. Fixture-backed operations must be labeled simulated; do not pretend to have called AI or published to Instagram.

Anonymous visitors must not consume the owner's provider keys. Supabase Auth and server-side approval checks restrict live operations. The primary showcase is a public Vercel URL with quota-limited Remotion rendering in Vercel Sandbox; the developer's computer need not stay online. Prepared sample mode is a fallback, not proof of working live generation.

Maintain one codebase. Demo providers can implement the same small interfaces as live planning, narration, and publishing adapters. Avoid building a generic plugin framework.

## 3. Feature priorities and resume purpose

| Capability | Portfolio priority | Development skill demonstrated |
|---|---|---|
| Responsive project dashboard and four-step flow | Core | UI composition, state handling, accessible design |
| Combined storyboard/script and conversational edits | Core | Structured AI integration, validation, usable interaction design |
| ElevenLabs narration and custom timing logic | Core local path; free quota required | Audio alignment, phrase mapping, dependent artifact invalidation |
| Remotion motion graphics and captions in both formats | Core | Programmatic animation, layout, media rendering |
| Preview, export, autosave, practical recovery | Core | Persistence, asynchronous work, error handling |
| Authentication and project ownership | Core hosted-data path | Authorization and secure data access |
| Simple job state and duplicate request prevention | Core | Reliable application logic without distributed infrastructure |
| Instagram publish/connection | Optional live integration; labeled simulation available | OAuth and external API integration |
| Scheduling | Basic persisted schedule UI/state; real dispatch is optional | Date/time handling, state transitions |
| Always-on scheduled delivery | Deferred unless a verified no-billing solution exists | Not required to prove the core project |
| Billing, branding, team roles, admin analytics, enterprise SLAs | Excluded | Low value for the agreed scope relative to added complexity |

Use meaningful unit tests for timing, validation, version dependency rules, authorization, and publication duplicate handling. Add a small number of integration/end-to-end tests for the main flow. Do not create enterprise process overhead for its own sake.

## 4. Recommended infrastructure choices

| Component | Recommended direction | $0 assessment and limit |
|---|---|---|
| Web app | Next.js, TypeScript, Node.js endpoints | One modular application/repository |
| Public hosting | Vercel Hobby | Public resume URL; recheck plan terms and quotas |
| Database/auth | Supabase Postgres and Auth Free | Approved live users; ownership policies; accept documented inactivity pauses |
| Render storage | Supabase Storage Free | Persist completed hosted outputs; sandbox/local disk is temporary/development storage |
| Hosted sample storage | Small Supabase Free bucket | Cap retained bytes and transfer; avoid uploading every revision |
| GCS | Not selected for baseline | Billing account required; regional/operation/transfer limits apply and paid-account overages can charge |
| AI | Eligible Gemini free-tier model and ElevenLabs Free | Verify actual model/account quota before enabling; block when exhausted |
| Rendering | Remotion + Vercel Sandbox Hobby | Verify license and all free quotas; local fallback |
| Workflow/scheduling | Inngest Free | Short durable steps; no paid Inngest sandbox/compute or extra queue service |
| Monitoring | Application logs and provider dashboards | No paid observability service or custom cost dashboard |

GCS is not inherently expensive, but a free allowance does not make it a strict no-charge storage guarantee. Google currently lists 5 GB-months of regional storage in eligible US regions along with operation and transfer allowances. A paid billing account can incur overage charges. Avoid this liability for the baseline portfolio build.

Supabase currently lists 500 MB database, 1 GB file storage, 5 GB egress, and a 50 MB storage upload limit on Free. Cached egress is separately listed; do not combine transfer allowances into one assumed pool. Free projects can pause after inactivity. Treat these as ceilings to stay well below, not targets or availability guarantees.

## 5. Conservative working limits

These are proposed application limits, not provider entitlements:

- One active render at a time across the initial demo; three initial sample topics.
- One selected format per render; reuse narration for the alternate format.
- Hosted sample storage below 200 MB total and 25 MB per file. If a 1080p export cannot fit while preserving quality, keep it local rather than buying storage.
- Disable autoplay/preloading of hosted MP4s; use poster images and user-initiated playback. Local generation remains available if public media delivery must be disabled to protect free allowances.
- Live generation is restricted to approved users, with a shared configurable request/character/compute budget below remaining free quotas. Retries count toward that budget.
- Check actual provider quotas and other account usage before setting limits. An application counter alone cannot guarantee a shared provider allowance has not been consumed elsewhere.
- Cache compatible audio/plans, reserve quota before requests, limit retries, and stop on quota errors. Do not promise a fixed videos-per-month number from character credits.
- Keep only the latest working artifacts and a small number of reviewed outputs; clean up intermediates after successful export. Never delete a pinned scheduled asset or selected sample unexpectedly.

Do not promise that unlimited public video playback can remain free. Start with a small demo audience, monitor provider-level transfer usage, and disable media or live operations before quotas are exhausted. The local demo is the durable fallback.

## 6. Provider and publishing constraints

ElevenLabs remains the chosen live narration/timing provider. Its Free plan currently includes 10,000 monthly credits, but generated content has noncommercial-use and attribution conditions. Do not assume a resume purpose automatically resolves every distribution/licensing question. Use permitted sample material, include required attribution, and confirm eligibility for any public showcase. If the intended use is not permitted, use independently licensed sample audio with labeled fixture timing; do not buy a plan or silently claim live ElevenLabs generation.

Gemini free-tier availability is model/account dependent and free-tier data may be used to improve Google's products. Use non-sensitive demo topics. A model without a free allowance must not be enabled in the zero-cost configuration.

Instagram live integration depends on eligible accounts and Meta access. A screenshot or simulated success is not evidence of actual publishing. Document the implemented mode honestly in UI and README. Real scheduling on a local process only runs while that process/computer is active; overdue items require review instead of unexpected late publication.

## 7. Completion and architecture gates

The project succeeds when a reviewer can understand the architecture, run the documented local setup, create or load an explainer, review synchronized output in both formats, inspect clean code and meaningful tests, and see graceful handling of failures. Paying customers, commercial traction, and enterprise uptime are not completion criteria.

Before adopting a service, record: exact free plan, required payment method, quota units/reset period, failure behavior at the limit, data/license constraints, local/demo fallback, and whether it adds meaningful portfolio value. Reject services with an unavoidable cost or insufficiently understood overage behavior.

Before public deployment, review the actual account plans and current terms again. Do not claim free-tier compliance solely from an old pricing page. The project must remain demonstrable locally when a free service pauses, changes policy, or exhausts its allowance.

## 8. Sources checked on 19 October 2026

- [Google Cloud free tier, billing requirements, and Cloud Storage allowances](https://docs.cloud.google.com/free/docs/free-cloud-features)
- [Supabase Free pricing and quotas](https://supabase.com/pricing)
- [Vercel Hobby plan and use restrictions](https://vercel.com/docs/plans/hobby)
- [Gemini free-tier availability and data-use conditions](https://ai.google.dev/gemini-api/docs/pricing)
- [ElevenLabs pricing](https://elevenlabs.io/pricing)
- [ElevenLabs content publication and license guidance](https://help.elevenlabs.io/hc/en-us/articles/13313564601361-Can-I-publish-the-content-I-generate-on-the-platform)
- [Remotion free-license eligibility](https://www.remotion.pro/license)
