# Local scene rendering — T04

Implemented 20 October 2026. This is an isolated, original CC0 water-cycle fixture, not live AI generation. No accounts, credentials, API calls or paid infrastructure are needed. Its 12-second synthetic timeline is explicitly labeled; exports intentionally have no audio. ElevenLabs speech/alignment remains T05. The production full-video schema still requires 4–10 scenes and 60–90 seconds.

## Try it

Run npm ci, then npm run dev and open [the preview](http://localhost:3000/render-preview). Choose horizontal or vertical and use the player controls. Both use the same trusted scene component as exports. The browser preview draws frames; it does not start a hosted render or write files.

- npm run video:studio — inspect the scene at localhost:3101.
- npm run video:render:horizontal — export artifacts/render-proof/horizontal.mp4.
- npm run video:render:vertical — export artifacts/render-proof/vertical.mp4.

Render sequentially: the renderer uses port 3100, separate from Next on 3000. Remotion may download Chrome Headless Shell on first use. If that download stalls, append the following argument with your actual installed browser path (tested on this Windows computer):

    npm run video:render:horizontal -- --browser-executable="C:/Program Files/Google/Chrome/Application/chrome.exe"

The same argument works for the vertical command. CPU rendering is local development work; it is not an ordinary Vercel HTTP endpoint. Generated MP4s and extracted frames stay ignored. The checked-in fixture recreates them.

## Implemented boundaries

src/video/fixture.ts validates a fixed supported process scene and words. Cue resolution uses shared phrase/occurrence logic. src/video/Scene.tsx accepts only a strict format enum; it cannot execute user/AI code or fetch arbitrary assets. Other schema-supported scene types are not rendered yet.

The bundled Inter 600 font loads before canvas measurement. Caption grouping uses actual font widths, two-line limits, punctuation, three-second group bounds and speech-gap splitting. It preserves word IDs and speaking intervals, validates the resulting timeline, then explicitly adapts intervals to the strict half-open frame helper. Oversize words/labels/headings fail rather than shrinking silently. Portrait reflows nodes vertically and wraps captions; landscape uses three columns. Both reserve caption bounds. The zero speech dependency key is a fixture sentinel only and must never serve as a live artifact/reuse identity.

## Actual evidence

Both local renders completed and were inspected at 5.8 seconds: no clipped essential text or covered diagram labels in those frames. ffprobe reported H.264, 30 fps, 360 frames, exactly 12 seconds, with no audio stream as intended:

| Format | Resolution | Bytes |
|---|---|---:|
| Horizontal | 1920 × 1080 | 380729 |
| Vertical | 1080 × 1920 | 411213 |

Both files also passed full-file FFmpeg decode checks. npm run check passed lint, TypeScript, 83 tests and the production build. Files are local evidence, not committed media or public URLs. Synthetic cue starts are 1.1, 5.35 and 8.2 seconds; these are not measured speech accuracy. No claim is made about actual narration, hosted runtime, storage upload, a full 60–90 second video, or complete benchmark quality. T05 must verify those separately.

## Dependencies and licensing

Remotion/player/CLI are pinned together at 4.0.537 after registry compatibility checks. Zod is aligned to the CLI-required 4.5.4; existing schema/auth tests pass with this version. Inter 5.2.8 is bundled locally under SIL OFL 1.1; its copyright/license is distributed in node_modules/@fontsource/inter/LICENSE. No remote Google Fonts request is required.

Remotion's [actual license](https://github.com/remotion-dev/remotion/blob/main/LICENSE.md) permits free use by individuals and qualifying small organizations. It is source-available under its own license; eligibility must be rechecked if ownership/team size changes. Official [rendering documentation](https://www.remotion.dev/docs/render) describes CLI exports. No cloud rendering service was activated.
