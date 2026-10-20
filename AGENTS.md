# Project instructions

This is a portfolio/resume project with a strict $0 budget, not a production SaaS business. Follow the user's latest direction, then `docs/PRD.md` as the consolidated implementation baseline. It supersedes conflicting earlier defaults in `docs/BRD.md` and `docs/PROJECT_CONSTRAINTS.md`; `docs/ARCHITECTURE.md` records the selected stack.

## Reading and task workflow

- Start with `docs/README.md` for document authority and the task-specific reading map. Use `docs/IMPLEMENTATION_PLAN.md` for dependencies and completion checks; do not assume a planned task is implemented.
- Read `docs/SYSTEM_DESIGN.md` before cross-component work. It defines hosted execution, sequence flows, scoped media delivery and resource-claim ownership. A stored successful output does not permit another live render until the previous sandbox is confirmed non-running.
- Read the relevant domain contract before editing: `UI_UX_SPEC.md`, `DATABASE_SPEC.md`, `API_WORKFLOWS.md`, or `VIDEO_PIPELINE.md` under `docs/`. Use `TESTING_ACCEPTANCE.md` for verification and `SETUP_DEPLOYMENT.md` before configuring/deploying providers.
- Keep scope in the PRD and detailed contracts in their domain guides; link rather than duplicating whole specifications. Resolve conflicts using documented authority and update stale statements.
- Implement a coherent task in dependency order. The initial hosted-render proof must precede a broad dashboard/publishing build. Do not expand scope merely to avoid a difficult feasibility check.
- Record material choices and measured provider checks in `docs/DECISIONS.md`. Exact package/model/voice identifiers and free quotas require current official documentation or account evidence; never invent SDK calls or assume old free-tier details remain valid.
- Create `docs/PROGRESS.md` when implementation begins and record task status, real outcomes, checks, limitations, and next task. Do not mark work complete without its exit criteria.

## Engineering boundaries

- Keep one modular Next.js/TypeScript application with Node.js endpoints. Public hosting is Vercel Hobby; hosted rendering uses Remotion with Vercel Sandbox. Local rendering is a development/fallback option.
- Use Supabase Auth, Postgres, and Storage; do not add MongoDB, Better Auth, R2, or GCS. See `docs/ARCHITECTURE.md` for the selected stack.
- Use Inngest Free for workflow coordination and scheduling, within verified quotas. Heavy rendering runs in Vercel Sandbox, not inside an HTTP workflow step. No additional queue infrastructure is needed.
- Use free/open-source tools or verified free tiers only. Do not activate paid plans, metered billing, paid fallbacks, or automatic top-ups. Stop or degrade honestly when a free allowance is exhausted.
- Check current free-tier limits, licensing, and overage behavior before adopting or deploying a service. Do not rely on temporary promotional credits for the required demo.
- Keep the public portfolio demo quota-safe. Clearly label fixture/simulated AI and publishing behavior; never expose owner provider keys or allow unrestricted anonymous generation.
- Preserve quality: clean maintainable code, responsive accessible UI, input validation, ownership checks, secure credential handling, actionable errors, and meaningful tests.
- Preserve the four-stage creator experience and the agreed ElevenLabs timing plus custom caption/animation rendering logic.
- Keep full local generation runnable. A hosted always-on renderer or scheduler is not required. Live Instagram publishing is an optional integration, not a reason to add paid infrastructure.
- Do not implement billing, branding, enterprise collaboration, or production SLAs without a new user scope decision.

- Use runtime schemas at external boundaries. Database job/approval state is authoritative; browser state, AI output, callbacks, and client IDs are not trusted authority.
- Keep approved content and reviewed artifacts immutable, preserve compatible prior outputs, and follow dependency-aware narration/timing/render invalidation. Do not replace pinned scheduled output silently.
- Keep side effects idempotent and bounded. Reconcile uncertain sandbox/publication outcomes before retrying; do not promise exactly-once external effects. Never label uploaded/processing media as confirmed published.
- Test meaningful timing, ownership, state, quota, and recovery behavior. Default tests use lawful deterministic fixtures and no live AI credits. Clearly separate fixture evidence from live-provider verification.
- Run checks appropriate to the change and report actual results or why a check could not run. Do not fabricate passing tests, migrations, account configuration, a public URL, or live integration evidence.
- No real social posts/messages, paid activation, or destructive data operations are authorized merely by a planning document. Respect the user's actual authorization and applicable tool permissions.
- Ask only for genuinely missing required information/access or a material scope/budget decision. Continue independent authorized work rather than asking again for routine choices already covered by the PRD.


## Git delivery workflow

- The user-authorized public repository is https://github.com/Mahistmm00/IdeaMotion.
- Use the exact `dev` branch for development; create it if missing. This user-requested name overrides the default `codex/` prefix.
- After each coherent code change, run the appropriate checks, review staged files for secrets/generated outputs, commit, and push to `origin/dev`. The user has authorized these routine pushes; do not request confirmation again solely for pushing.
- Do not push credentials, dependency folders, build output, or generated media. Avoid unrelated changes. Never force-push, rewrite remote history, merge into main, or delete remote branches without separate authorization.
- If authentication, network access, a failing check, or a remote conflict blocks delivery, preserve the local work and report the concrete blocker; do not claim a successful push.
