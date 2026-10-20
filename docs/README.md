# Documentation index and AI reading order

**Updated:** 20 October 2026. T01 scaffold, T02 shared contracts/fixtures and T04 local scene rendering are implemented. See [implementation progress](PROGRESS.md) for actual checks; planning guides describe features that are not yet implemented.

## Authority

1. Latest explicit user instruction.
2. [PRD](PRD.md): scope, product requirements, priorities, and acceptance.
3. Approved decisions in [decision log](DECISIONS.md).
4. Domain specifications listed below: implementation contracts within PRD scope.
5. [Architecture](ARCHITECTURE.md): selected services and deployment responsibilities.
6. Historical context: [BRD](BRD.md) and [project constraints](PROJECT_CONSTRAINTS.md).

Do not silently choose between contradictory documents. Follow the higher authority, update the stale statement, and record a material implementation decision. Unverified provider access or free quota is not an approved fact merely because a document describes the intended integration.

## Read by task

| Task | Required documents |
|---|---|
| Any code change | Root `AGENTS.md`, relevant PRD sections, current task in [implementation plan](IMPLEMENTATION_PLAN.md) |
| Cross-component integration/system behavior | [System design](SYSTEM_DESIGN.md), affected database/API/pipeline sections |
| Screens/components | [UI/UX](UI_UX_SPEC.md), relevant API contracts, relevant acceptance tests |
| Schema/auth/storage | [database](DATABASE_SPEC.md), API authorization rules, setup guide |
| Endpoint/job/schedule | [API/workflows](API_WORKFLOWS.md), database states, relevant pipeline sections |
| Narration/captions/graphics | [video pipeline](VIDEO_PIPELINE.md), UI preview behavior, timing tests |
| Verification | [testing](TESTING_ACCEPTANCE.md), acceptance IDs and task exit criteria |
| Provider configuration/deployment | [setup/deployment](SETUP_DEPLOYMENT.md), architecture, current official provider documentation |

## Document ownership

- PRD owns feature scope and user-facing limits. Domain documents reference these instead of inventing alternate values.
- System design owns component/deployment boundaries, end-to-end sequence flows, resource ownership, and cross-component failure decisions.
- UI/UX owns screen interaction, component inventory, accessibility, and visible states.
- Database specification owns logical persistence, relationships, ownership and storage rules.
- API/workflows owns internal messages, request/error conventions, job transitions, dispatch/retry/cancellation semantics.
- Video pipeline owns versioned scene/audio/timing/render contracts and deterministic synchronization rules.
- Testing guide owns test cases and required evidence; implementation plan owns execution order and task status.
- Setup guide owns configuration classification, deployment gates, and recovery instructions.
- Decision log owns deviations and unresolved technical choices; it does not override the user or expand scope.
- [Stitch design reference](STITCH_DESIGN.md) and [workflow handoff](STITCH_WORKFLOW.md) record generated visual artifacts and their verification limits; they do not establish working integrations.
- Current visual review uses the [fresh 24-page Stitch index](STITCH_FRESH_REVIEW.md); the previous canvas was rejected. See the [rebuild brief](STITCH_REBUILD_BRIEF.md) for scope and progress.

No external accounts, migrations, SDK integrations, tests, or deployments have been executed by creating these documents. Implementation status must remain explicit. Update the smallest authoritative document and link to it; do not copy whole specifications into every file.

## First implementation handoff

T01, T02 and T04 are complete; continue with remaining T03 hosted checks and T05 in the implementation plan. See [shared contracts](SHARED_CONTRACTS.md) for the implemented schema and fixture guide. Complete the initial contracts/fixtures and one hosted rendering feasibility slice before building the complete dashboard. Do not skip into publishing or a fully styled application while hosted rendering and the free upload limit are unproven.



T03 implementation/setup: [Supabase auth guide](SUPABASE_AUTH_SETUP.md). Code and local policy tests exist; user-confirmed auth flows work. Broader hosted RLS/Storage/session-refresh verification remains pending.

T04 renderer and preview: [local rendering guide](LOCAL_RENDERING.md).

T05 narration implementation and configuration: [ElevenLabs setup](NARRATION_SETUP.md). Real narration and both local narrated formats are verified; hosted feasibility remains incomplete.
