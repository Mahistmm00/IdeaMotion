# IdeaMotion — AI Educational Explainer Studio

A $0 portfolio project for narrated educational motion-graphics videos with synchronized captions, vertical/horizontal export, and a simple four-step creator workflow.

**Current status:** T01–T02 and the T04 local one-scene rendering proof are implemented. Auth flows were confirmed by the user; broader hosted RLS/Storage/session-refresh checks remain open. Try [the rendering preview](http://localhost:3000/render-preview) and see [local rendering](docs/LOCAL_RENDERING.md). No live AI generation, hosted render or public deployment is claimed.

## Run locally

Use Node.js 24 and npm 11. From this directory:

```sh
npm ci
npm run dev
```

Open [localhost:3000](http://localhost:3000). The preview and local tests require no accounts or API keys. Auth pages stay disabled until Supabase is configured; follow the [Supabase auth setup guide](docs/SUPABASE_AUTH_SETUP.md). `.env.example` documents this; keep future real secrets in ignored `.env.local` files.

```sh
npm run lint        # Biome lint and formatting, zero warnings
npm run format      # Apply formatting and safe lint fixes
npm run typecheck   # Generate Next.js route types and check TypeScript
npm test           # 104 local schema, timing, auth-action and SQL policy tests
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

The `@/*` import alias maps to `src/*`. Add feature modules as their implementation tasks begin; there are no unused provider SDKs or speculative service abstractions. The application shell uses system fonts; the renderer bundles Inter locally, without a remote font request.

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

Next is T05: verify remaining hosted auth/storage gates and prove real ElevenLabs timing plus hosted rendering, upload and signed playback within verified free allowances. The full dashboard follows this feasibility gate. See the implementation checklist for dependencies.


## Git workflow

Repository: https://github.com/Mahistmm00/IdeaMotion. Development uses `dev`; completed code changes are checked, committed, and pushed to `origin/dev`. Main-branch merges and public deployment are separate steps.



## Real narration proof

The ElevenLabs adapter, actual character-to-word timing, guarded local generation and both narrated rendering commands are implemented. One real Free-account narration and both local MP4 exports are verified. See [narration setup](docs/NARRATION_SETUP.md) and [measured progress](docs/PROGRESS.md). Generated speech, raw responses, keys and output videos remain ignored. Inngest/Sandbox/private hosted playback are still pending; this is not a completed hosted generator.
