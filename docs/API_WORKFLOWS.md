# Internal API and background workflow contracts

**Status:** Design contract, 19 October 2026. External SDK calls must be checked against current official docs during integration. These are our internal interfaces, not claims about provider schemas.

Deployment/module/sequence decisions are in [system design](SYSTEM_DESIGN.md). Persistence and resource-claim fields are in [database design](DATABASE_SPEC.md).

## 1. Common boundary

All private routes validate session and ownership; live external work additionally requires approved status, free budget, compatible saved input, and idempotency. Public samples use separate explicit handlers/data. Mutation requests use JSON, bounded bodies, and origin/CSRF protections appropriate to cookie auth. Never trust owner IDs, provider IDs, file paths, approval flags, or model names supplied by a browser.

Success envelope: `{ data, requestId }`. Error envelope: `{ error: { code, message, retryable, details? }, requestId }`. `details` contains safe field errors/recovery hints, never raw provider payloads or tokens. Async success returns HTTP 202 plus job ID, state, and resource revision. Ready data reads return 200; new persisted resources may return 201.

Use 400/422 for malformed/invalid input consistently; 401 unauthenticated, 403 not approved/forbidden action, 404 missing or nonowned resource, 409 stale revision/idempotency conflict or busy claim, 429 application/provider limit, 503 temporary dependency unavailable. The UI follows the error code, not arbitrary message parsing.

## 2. Revisions and idempotency

State-changing draft/version operations include `expectedRevision`. Expensive or side-effecting submissions also include an `Idempotency-Key` header scoped by owner and operation. Persist request hash with the key.

- Same key and same validated body returns the saved logical result/job, even after refresh.
- Same key with different body returns `IDEMPOTENCY_CONFLICT` (409).
- A key does not bypass ownership, approval, or current access checks.
- Retry of a failed job uses its recovery endpoint/attempt semantics; it is not a new unlimited budget.
- Idempotency stores stable IDs; regenerate ephemeral signed access separately.

After access checks, replay a recorded identical result before new quota admission. Otherwise a previously accepted operation could disappear behind a later quota failure. A new key cannot create another concurrent render for the same compatible version/format; return existing work or a conflict according to saved state. Approval of the same snapshot reuses its existing immutable version.

## 3. Endpoint contract matrix

| Endpoint | Input | Response / side effect |
|---|---|---|
| `GET /api/projects` | Cursor/page size; bounded | Safe owned card summaries, next cursor |
| `POST /api/projects` | Brief/settings using PRD limits | Project ID/revision; enforce cap |
| `GET /api/projects/:id` | Valid UUID | Draft, safe version/job/publication summaries; no secret provider fields |
| `PATCH /api/projects/:id` | expectedRevision; allowed title/brief/draft edits | Updated revision/save time; no arbitrary state writes |
| `DELETE /api/projects/:id` | expectedRevision | Deletion accepted or conflict requiring job/schedule resolution |
| `POST /api/projects/:id/ideas` | expectedRevision, message, optional bounded context | Persisted conversation/planning job; no media synthesis |
| `POST /api/projects/:id/plan` | expectedRevision, optional scene-scoped instruction | Structured plan job/draft result; repaired output must pass schema |
| `POST /api/projects/:id/approve` | expectedRevision | Immutable version and one generation job, HTTP 202 |
| `POST /api/projects/:id/revisions` | expectedRevision, source render/version ID, instruction, scene ID optional | Scoped revision job; indicates return-to-plan for material content change |
| `POST /api/projects/:id/renders` | approved version ID, target format | Compatible render job or existing result; no unapproved narration |
| `GET /api/jobs/:id` | Job ID | State/stage, attempt, safe error, permitted next actions, heartbeat |
| `POST /api/jobs/:id/retry` | expected job revision/attempt | Reconciled permitted retry; cannot blindly repeat uncertain side effects |
| `POST /api/jobs/:id/cancel` | expected job revision | Cancel requested or already terminal outcome |
| `GET /api/assets/:id/access` | purpose preview/download | Authorized expiring URL, expiry, safe metadata; no client-chosen path |
| `POST /api/assets/:id/review` | compatible available render ID | Mark this exact render reviewed; only its owner |
| `POST /api/projects/:id/publication` | reviewed render ID, mode, caption, now or schedule/timezone | New pinned publication job; explicit simulation mode |
| `PATCH /api/projects/:id/publication` | expectedRevision; permitted pending edits | Updated pinned revision; stale wake becomes no-op |
| `DELETE /api/projects/:id/publication` | expectedRevision | Cancel pending job; truthful outcome when already submitting |
| `GET /api/instagram/connect` | Authenticated intent | Conditional authorized redirect with server-bound anti-forgery state |
| Instagram callback | Provider code/state | Validate state/session/destination; securely store live connection |
| `DELETE /api/instagram/connection` | Expected connection identity | Disconnect; block pending live submissions |
| `/api/inngest` | Verified SDK requests | Dispatch registered handlers only; not arbitrary caller-controlled jobs |

`POST /api/assets/:id/review` makes the PRD's reviewed-artifact action explicit; it does not add a new user-facing step. Optional live endpoints remain disabled until configured. Error codes include PRD examples plus `IDEMPOTENCY_CONFLICT`, `GENERATION_BUSY`, `ASSET_UNAVAILABLE`, and `DISPATCH_PENDING`.

## 4. Internal event contracts

| Event | Data | Consumer invariant |
|---|---|---|
| `video/generation.requested` | schemaVersion, jobId | Load owner, approved version, format and budget from persisted authorized job |
| `video/revision.requested` | schemaVersion, jobId | Load validated scoped request; never execute freeform code |
| `publication/requested` | schemaVersion, publicationId, publicationRevision | Re-read mode, reviewed artifact, destination and due instant |
| Cancellation/resume | IDs and expected attempt/revision if a wake event is needed | Database state wins; events are hints, not authority |

Do not embed audio/base64, full plans, access tokens, signed media URLs, or user-controlled owner authority in events. Fixed registered workflow handlers validate schemaVersion and treat unknown versions as a safe failed/needs-attention state.

## 5. Generation workflow

1. Endpoint transaction persists immutable approved input, idempotent job and quota reservation; commit before dispatch.
2. Event dispatch success moves dispatch pending to queued. A failed dispatch leaves saved work retriable without another reservation/version. UI exposes resume; implement a small bounded reconciliation action rather than a second broker/outbox service.
3. Handler claims the job atomically; rechecks user approval, cancellation, compatible input and budget.
4. Prepare supported scenes and dependency keys; reuse valid assets.
5. Generate narration for changed scenes; persist audio/alignment references after each successful segment.
6. Synchronize locally using validated timeline contracts.
7. Claim/start one sandbox render, persist provider identity, and wait/check with bounded backoff.
8. Upload output directly to Storage using an exact-path signed upload grant; validate actual persisted output and mark content succeeded. Do not release the live production claim while the sandbox may still run.
9. Stop sandbox, confirm non-running state, then release the claim. Track cleanup separately; uncertain shutdown blocks new live rendering but does not erase a valid completed video.

Each network step must fit the deployed function timeout. Inngest sleep/wait does not keep a route running or extend its compute limits. Polling intervals and maximum render deadline are benchmark/configuration decisions; bounded total attempts and verified account quota are mandatory.

If provider acceptance may have occurred but response/DB update is lost, reconcile before another paid-unit operation. Automatic duplicate sandbox creation, narration re-synthesis, or publication is not justified by a generic network error. Store conservative reservation and needs-attention state when uncertain.

## 6. State transitions

Generation happy path: `dispatch_pending → queued → preparing → synthesizing → synchronizing → rendering → validating → succeeded`. Planning-only jobs can skip irrelevant media stages. Failure transitions record the last completed stage and safe recovery; terminal cancellation is separate from failure.

Any active state may receive `cancel_requested`. Check before each expensive operation. A completed operation can win a race with cancellation; report actual outcome. `needs_attention` holds unresolved provider ambiguity; do not release global render claim until resource is reconciled/stopped. A retry creates a bounded new attempt under the same logical job; compatible assets remain available.

Completed success cannot regress from a delayed callback. Transition checks and expected attempt prevent an old worker from modifying a new attempt's status. Superseding a draft does not change the running job's pinned version.

Use a job revision for stale updates separately from retry attempt. Renderer cleanup has its own state: content success with cleanup pending is possible. UI can show the good output while a safe generation-busy/needs-attention notice blocks another render. No timer alone proves the previous sandbox stopped.

## 7. Publishing and schedules

Publication states and timing limits are in the PRD. Each pending schedule stores UTC instant, original IANA zone, reviewed render, destination snapshot, post caption, mode and revision. Inngest wakes with IDs/revision; before submission it checks current row, cancellation, due time, allowed late window, connection identity/health, asset availability and mode.

Simulated handler records simulated outcomes only and makes no Meta call. Live and simulated modes cannot change mid-job. A live switch is a new explicit reviewed action.

On reschedule/cancel, increment revision. An old sleeping run exits on mismatch. Take a short database lock/conditional update to claim `submitting`; never hold a DB transaction open during Meta calls. Immediately before irreversible submission recheck cancellation as far as practical, then accept that there is a race and expose true final state.

Save provider container/post identifiers. Processing acceptance is not publication confirmation. A timeout after possible acceptance becomes `outcome_unknown`; reconcile identifiers/provider state, not blind resubmit. Retry only established temporary failures without ambiguous prior success. Stop late attempts outside the PRD window.

## 8. Verification evidence

Use deterministic adapters for normal tests. Exercise double-click, reused key/different body, dispatch failure after commit, two workers claiming one job, old callback after retry, missing alignment, browser refresh, cancel while rendering, schedule revision races, private ID access, and uncertain publication outcome. Record live provider smoke checks separately; an adapter test cannot prove real hosted rendering or posting.
