# UI/UX implementation specification

**Status:** Implementation guide, 19 October 2026. Scope and numerical input limits: [PRD](PRD.md), especially sections 4 and 7–12. These are planning defaults, not a finished visual design.

## 1. Experience contract

Four visible stages only: **Idea → Plan → Video → Publish**. Script and storyboard share Plan. Server processing stages are status within Video, never extra wizard steps. Download must not require Instagram connection.

Use the user-approved **IdeaMotion** name and **Violet & Peach** theme: violet `#7254D8`, peach `#FFC7AC`, lavender `#F0EAFB`, deep plum text `#302447`, soft mauve borders `#DCCFEF`, Manrope headings and Inter body text. Use a shared premium, bright application shell with tinted surfaces and generous spacing. The earlier graphite/lime concept is superseded. Verify accessible component color combinations during T06; do not build a custom design-system package. Standard project appearance is not a user-facing branding feature.

The landing hero is a key design deliverable: headline **Your ideas, explained in motion.**, concise narration/motion/captions proposition, primary **Create your first video**, secondary **Watch an example**, and a large visual explainer/player mockup. Immediately follow with the connected steps **Share your idea → Approve your storyboard → Review your video → Download or publish**, then samples, concise features and final CTA. No pricing or fabricated trust signals. On mobile the hero and step cards stack without changing the four-stage workflow.

Required accessibility: semantic landmarks/headings, explicit input labels, visible keyboard focus, contrast meeting WCAG AA for selected text/UI colors, usable error text, non-color state indicators, reduced-motion support for interface animation, and keyboard-operable dialogs. Do not remove explanatory video animation globally when reduced motion is requested; interface preferences and educational content are different contexts. Avoid flashing content.

## 2. Screen inventory

| Screen | Content | Actions and access |
|---|---|---|
| Landing `/` | Product explanation, factual portfolio mode/availability, sample entry | Explore sample, Sign in |
| Samples `/samples` | Three curated topic cards with poster, format/duration | Open sample; no anonymous live API use |
| Sample workspace | Clearly labeled prepared plan/video, simulated interactions | Preview/download designated sample; sign in for access request/status |
| Sign in / Sign up | Supabase email/password UI, validation, submission states and public sample link | Authenticate or create identity; never self-approve live access |
| Verify email / Forgot password / Reset password | Confirmation, neutral reset-request result, resend cooldown, expired-link recovery | Request/consume confirmation or recovery link; email-delivery feasibility remains a setup gate |
| Password updated / Auth recovery | Clear result, signing-in callback, safe error/session-expiry recovery | Return to sign in or samples; preserve recoverable draft |
| Auth callback/access state | Session progress or safe error; approval status | Retry sign-in, return to samples, sign out |
| Projects `/projects` | Owned project cards, recent update, creation state and distinct publication badge | Create, resume, rename, delete; cap/empty/error states |
| Project workspace | Stage navigation, autosave status, main content, contextual action | Stage-specific controls below |
| Settings | Signed-in identity, live approval, preferred zone, Instagram connection mode/state | Sign out; conditional connect/disconnect |

Public sign-in does not imply live approval. An authenticated unapproved user sees an access explanation and samples, not a provider key input or payment upsell. If no access-request workflow exists, say approval is managed by the project owner rather than offering a nonfunctional request button.

## 3. Workspace layout

- Header: project title, autosave state, sample/live badge, compact stage navigation.
- Desktop: main scene/preview area and a bounded conversation panel; collapse optional settings.
- Narrow screens: single-column stack; keep stage context and primary action reachable without covering content.
- Review at approximately 375, 768, and 1440 px; no page-wide horizontal scroll. Small diagrams can use their own controlled viewport rather than shrinking all text illegibly.
- One obvious primary progression action per stage. Secondary controls remain available without becoming required steps.
- Navigation back is allowed. Unsaved changes are flushed or the user gets an explicit leave warning if a save failed. Changing content, rather than navigation itself, invalidates approvals.

## 4. Idea

Main: multiline topic input and conversation. Optional controls: audience, objective, tone, format, target length, reference notes, tested voice. Defaults and limits come from PRD section 9. No separate language picker when only English is supported; state English beside voice settings.

Example prompt is educational, not a promise of output quality. Broad topics produce a few actionable choices. Preserve topic/chat text during network failure. Primary action: **Create plan**; disable for invalid input or same pending request and explain why.

State copy examples: “Saved”, “Saving…”, “Not saved — retry”, “Live generation is temporarily unavailable. Your idea is saved.” Do not display raw stack traces or model responses as errors.

## 5. Plan

Display ordered `SceneCard` items: ordinal, narration, display text, representative layout, plain-language animation description, estimated timing. Stable scene IDs are internal, not prominent creator-facing labels.

Inline narration/display edits and scene-scoped conversational requests are supported. A card edit creates a draft revision. Show which scenes changed after an AI proposal. A major proposed change is reviewable before approval.

Primary action: **Approve & generate video**. Save first, then approve an immutable version through the server contract. The button does not optimistically claim approval or start a second job after refresh.

Scene previews use supported graphics or explicit representative placeholders. Label timing “Estimated”; final measured duration appears after synthesis. An unsupported scene blocks generation with a repair action attached to that scene.

## 6. Video

During work: `GenerationStatus` reads actual job stage and safe error/status. Poll with pause/backoff when page is hidden; opening another tab does not create work. Cancel shows **Cancel requested** until acknowledged.

Ready: poster and video controls, duration, dimensions/format, burned-in captions, revision composer, format switch/render-other-format, Download, and **Ready to publish**. Final review targets the saved rendered asset; do not show an outdated interactive composition beside a new MP4 without version context.

If a replacement job runs, keep the prior completed video playable and label it “Previous version”. Do not replace it with a blank loading panel. A revision summary identifies expected affected scenes and whether speech must regenerate.

Selecting the other format changes the intended composition; it does not instantly claim a ready alternate export. Show render/review status separately for each format. Mark reviewed only after the creator has access to the completed selected output; completion itself does not auto-approve it.

## 7. Publish

Show selected reviewed video, format, destination account/mode, editable suggested Instagram post caption, Download, Publish now, and Schedule. Distinguish post caption from captions inside video.

If horizontal is selected for Instagram, offer **Create vertical version** with a review step; do not silently crop. Connection failure never blocks download. Future scheduling validates window/time zone from PRD section 12 and displays the resolved date/time/offset before confirmation.

Sample mode has a persistent banner, action copy such as **Simulate publish**, and result “Simulation completed — nothing was posted”. Avoid celebratory “Published” status without an explicit simulated qualifier. Live confirmation includes destination and external post link when available.

Editing a scheduled project shows “Scheduled version unchanged”. Replacing a schedule requires explicit selection of a reviewed render. Cancel/reschedule reflects saved state; cancel during submission warns that the actual outcome may already be irreversible.

## 8. Shared component inventory

`AppShell`, `StageNav`, `ModeBadge`, `SaveStatus`, `ProjectCard`, `BriefForm`, `OptionalSettings`, `ConversationPanel`, `SceneCard`, `RevisionSummary`, `GenerationStatus`, `VideoPreview`, `FormatSelector`, `CaptionTextEditor`, `PublishPanel`, `SchedulePicker`, `ConnectionCard`, `ErrorNotice`, `EmptyState`, and a reusable confirmation dialog.

Use shared primitives for inputs/buttons/dialogs; avoid a bespoke global state framework unless real cross-screen needs justify it. Server state and local unsaved form state are distinct. Persisted status is authoritative for work/publication; UI loading state is not a job record.

## 9. State and error mapping

| Condition | Visible behavior | Next action |
|---|---|---|
| No projects | Helpful empty state | Create or explore sample |
| Unapproved | Live access explanation | Samples/sign out |
| 401/session expiry | Preserve non-sensitive draft; sign-in prompt | Reauthenticate; recheck saved revision |
| 404/private resource | Generic unavailable page | Return to owned projects |
| Version conflict | Keep local text, identify newer saved revision | Reload/compare and resubmit deliberately |
| Quota unavailable | Saved input; disabled live action | Samples or wait; no upgrade CTA |
| Unsupported scene/timing | Attach safe error to scene/job | Repair/retry if permitted |
| Download access expired | Refresh authorized URL | Retry playback/download |
| Publication outcome unknown | Do not show success or auto-retry button | Reconcile/check destination |
| Database unavailable | No false Saved/Queued state | Retry when available |

## 10. UI acceptance

Pass PRD AC-01–AC-04 and AC-07–AC-13 where relevant. Keyboard-test sign-in return, scene edit, approval, revision, video controls, and schedule dialog. Verify that long topic/title/text and narrow layouts do not hide primary controls. Record screenshots for loading, empty, sample, ready, quota, conflict, and publishing-simulation states. Visual mockups are not evidence that provider integration works.
