# IdeaMotion — AI Educational Explainer Studio

A $0 portfolio project for narrated educational motion-graphics videos with synchronized captions, vertical/horizontal export, and a simple four-step creator workflow.

**Current status:** T01 scaffold and T02 shared schemas/sample fixtures are implemented; see [progress](docs/PROGRESS.md) for verification. The responsive starter page is a concept preview, not a working video generator. Provider integrations and deployment have not started. There is no public app URL yet.

## Run locally

Use Node.js 24 and npm 11. From this directory:

```sh
npm ci
npm run dev
```

Open [localhost:3000](http://localhost:3000). No accounts, API keys, or environment variables are needed for the scaffold. `.env.example` documents this; keep future real secrets in ignored `.env.local` files.

```sh
npm run lint        # Biome lint and formatting, zero warnings
npm run format      # Apply formatting and safe lint fixes
npm run typecheck   # Generate Next.js route types and check TypeScript
npm test           # 38 deterministic schema and timing tests
npm run build      # Production build
npm start          # Serve the production build
```

`npm run check` runs lint, typecheck, test, and build sequentially. Tests run without credentials or live AI calls; an empty suite now fails. See [shared contracts](docs/SHARED_CONTRACTS.md) for schema usage, fixture provenance, and verification limits.

## Source layout

```text
src/app/             App Router layout, starter page, 404 page, shared styles
src/lib/schemas/     Versioned runtime schemas and contract tests
src/lib/timing/      Cue matching, caption frame boundaries, timing tests
src/fixtures/        Original educational plans and synthetic timing data
docs/                Product, design, architecture, contracts, and task progress
artifacts/           Design references and concept media; not runtime application code
```

The `@/*` import alias maps to `src/*`. Add feature modules as their implementation tasks begin; there are no unused provider SDKs or speculative service abstractions. Fonts currently use local system fallbacks, with no remote font request at build time.

## Documentation

Start with the [documentation index](docs/README.md) and [PRD](docs/PRD.md). AI coding agents must follow [AGENTS.md](AGENTS.md).

- [Architecture and selected tools](docs/ARCHITECTURE.md)
- [Detailed system design](docs/SYSTEM_DESIGN.md)
- [UI/UX specification](docs/UI_UX_SPEC.md)
- [Database and storage specification](docs/DATABASE_SPEC.md)
- [API and workflow contracts](docs/API_WORKFLOWS.md)
- [Video and synchronization pipeline](docs/VIDEO_PIPELINE.md)
- [Implementation checklist](docs/IMPLEMENTATION_PLAN.md)
- [Testing and acceptance](docs/TESTING_ACCEPTANCE.md)
- [Setup and deployment runbook](docs/SETUP_DEPLOYMENT.md)
- [Decision log](docs/DECISIONS.md)

Selected stack: Next.js/TypeScript/Node.js, Supabase Auth/Postgres/Storage, Vercel Hobby/Sandbox, Inngest Free, Remotion, Gemini, and ElevenLabs timing with custom synchronization logic. Provider eligibility and hosted feasibility must be verified before claiming working integrations.

Next is T03: Supabase schema, ownership policies, and email/password authentication with a verified free email path. Supabase/auth and the thin rendering feasibility slice follow before the full dashboard. See the implementation checklist for dependencies.


## Git workflow

Repository: https://github.com/Mahistmm00/IdeaMotion. Development uses `dev`; completed code changes are checked, committed, and pushed to `origin/dev`. Main-branch merges and public deployment are separate steps.
