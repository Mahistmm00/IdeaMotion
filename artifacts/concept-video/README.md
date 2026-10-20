# Application concept walkthrough

`application-walkthrough.mp4` is a narrated concept video showing the proposed four-stage experience: Idea, Plan, Video, and Publish/download. It is an illustrative animation, not a recording of an implemented application or proof of live provider integration.

The solar-panel example demonstrates storyboard review, simulated generation progress, captions/motion, conversational revision, both formats, and a clearly simulated Instagram schedule. No social content is posted.

Narration was generated locally with the installed Microsoft Zira system voice; this preview does not use ElevenLabs or consume AI/API credits. There is no background music. `render-info.json` records actual output metadata/audio checks.

Editable source: `walkthrough.html`. Local reproduction uses `build.ps1`, `narrate.ps1`, and `render.cjs`. These use installed Windows speech and a bundled headless browser; runtime paths are specific to this machine. The video is encoded with the browser's MediaRecorder, not the future Remotion application pipeline.

Scene PNGs are visual-review frames. This artifact does not mark implementation plan tasks complete.
