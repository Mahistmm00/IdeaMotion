# ElevenLabs narration proof — T05 first slice

**Updated 21 October 2026:** Real ElevenLabs narration and both local narrated MP4 exports are verified for this account. T05 remains incomplete: Inngest, Sandbox, private Storage upload and hosted playback are not verified. See PROGRESS.md for measured results.

## Configure only ElevenLabs first

1. Keep the account on Free. Do not start a paid plan, billing extension, top-up or trial. The current [pricing page](https://elevenlabs.io/pricing) lists 10k monthly Free credits, but the actual account/API allowance is authoritative. This is a small noncommercial portfolio proof.
2. Open [API key settings](https://elevenlabs.io/app/settings/api-keys). Create a dedicated restricted key with a small credit cap (500 credits is enough for this bounded short proof if the selected model is billed at one credit per character). Permit Text to Speech and read access needed for user subscription, models and voices. Keep other permissions off. The exact UI can change; see [key authentication documentation](https://elevenlabs.io/docs/api-reference/authentication). Do not paste the key into chat.
3. Select an available premade voice in your account and copy its voice ID. The code deliberately rejects professional/cloned/generated voices for this proof and checks availability for Free. Do not pay to unlock a voice. The model is pinned to the documented timing endpoint default, eleven_multilingual_v2; this account passed the read-only checks and one real timing-enabled synthesis request. Availability for another account still needs verification.
4. Open D:\IdeaMotion\.env.local (a file, not a folder). Keep existing Supabase entries and add/update:

    ELEVENLABS_API_KEY=your_actual_key
    ELEVENLABS_VOICE_ID=your_actual_premade_voice_id
    ELEVENLABS_MODEL_ID=eleven_multilingual_v2
    ELEVENLABS_ENABLED=false

Never use NEXT_PUBLIC_ for these fields. The real env file is ignored. Do not add a service-role Supabase key to the browser. No Inngest/Vercel secrets are required for this first local narration check.

## Read-only account check

From D:\IdeaMotion run npm run narration:check. It loads .env.local and performs only GET requests: subscription, models, selected voice. It returns safe readiness/remaining allowance, never the key or raw account response. Missing setup produces CONFIG_REQUIRED and makes no request. It rejects a paid/unknown subscription, automatic quota extension, insufficient remaining allowance, unsupported model or unavailable voice. Do not bypass a rejection by switching to paid usage.

After these checks pass, set ELEVENLABS_ENABLED=true only when ready for one explicit test generation. Running npm run narration:generate sends the fixed, original water-cycle narration (under 400 characters) once. It rechecks the Free account and remaining allowance immediately before synthesis. Read-only checks cannot guarantee endpoint access or speech quality; generation is the actual integration test. This command consumes free allowance even if later validation fails.

## Duplicate-spend protection and recovery

The command exclusively creates artifacts/narration-proof/attempt.json before requesting speech. A second run cannot spend again while this receipt exists, including after a timeout or process crash. No automatic network retry or paid fallback exists. This is a single-computer proof guard, not the database-wide job claim required for hosted operation.

If the provider responded and speech.mp3/response.json were saved but preparation failed, fix the local problem and run npm run narration:prepare. This command makes no provider request and reuses the existing bytes. Do not delete the receipt to retry an uncertain request. Review the provider usage/history first; lost responses can already have consumed credits. A deliberate new attempt needs reviewed allowance and an explicitly archived prior attempt. No automatic reset command is provided.

## Media validation and rendering

Windows defaults use the FFmpeg/ffprobe executables already installed with Remotion. On another platform, set FFMPEG_PATH and FFPROBE_PATH to existing absolute paths for those tools. No executable is downloaded by the narration command. It checks tools exist before a synthesis request.

Preparation probes one MP3 audio stream and measured duration (maximum 30 seconds for this proof), fully decodes audio, verifies saved bytes match the provider response, validates character timestamps against measured audio and extracts words from their actual character intervals. It prefers normalized alignment. If normalized spoken words differ from the approved text (for example AI vs A I or spoken numbers), it stops for an explicit reviewed mapping instead of guessing. General mapping support remains future work.

Preparation writes private ignored response/evidence files, format-specific props and a hash-named local audio input. Caption grouping and animation use these actual word times; scene duration includes the final bounded visual cue without truncating audio. It does not use the old synthetic timings. The full product duration contract is unchanged.

Run npm run video:render:narrated after successful preparation. If needed append -- --browser-executable="C:/Program Files/Google/Chrome/Application/chrome.exe". The command reads artifacts/narration-proof/props.json and exports output.mp4 in that directory. It has deliberately invalid default props so missing input cannot silently render a fixture as real speech.

For vertical output, preparation already writes props-vertical.json using the same validated speech. Run:

    npm run video:render:narrated:vertical

No new synthesis is needed for another format. Inspect both videos for intelligible complete narration, readable captions, cue agreement and no clipping; probe actual dimensions/duration/audio codec/bytes. Record measured evidence before marking this local live check passed. Final output validation and hosted lifecycle remain separate work.

## Privacy and attribution

artifacts/narration-proof is entirely ignored, including raw response/alignment/attempt/props. public/narration-proof contains only a hash-named MP3 for the local Remotion bundler; it is also ignored. That folder is served publicly while the local dev server runs, so use only the fixed, nonprivate sample here. This is not the future private creator-media delivery design. Do not place private narration in it or deploy it as public content.

Free output has no commercial license. Published noncommercial output must include elevenlabs.io or 11.ai in the title under [ElevenLabs' current publishing requirements](https://help.elevenlabs.io/hc/en-us/articles/13313564601361-Can-I-publish-the-content-I-generate-on-the-platform). This proof includes The water cycle · elevenlabs.io on the rendered video and in evidence metadata. Preserve that attribution when sharing. A production brand/commercial offering is outside this $0 portfolio setup.

## Failure codes

| Code | Action |
|---|---|
| CONFIG_REQUIRED | Check the ignored key, premade voice ID and supported model. No secret values should be logged. |
| DISABLED | Keep it disabled until an intentional free-quota test; checks still work. |
| FREE_PLAN_REQUIRED | Verify Free and disabled extension/top-ups in the account. Do not upgrade. |
| QUOTA_EXHAUSTED | Wait for free reset or keep using silent fixtures. |
| VOICE_UNAVAILABLE / MODEL_UNAVAILABLE | Verify this account's free compatible selection; do not purchase access. |
| PROVIDER_REJECTED | Inspect account permissions/provider status without copying raw secrets into chat. |
| PROVIDER_UNCERTAIN | Inspect usage/history before any new generation. Never blindly retry. |
| INVALID_RESPONSE | Retain the attempt and diagnose bounded response/audio fields; no automatic resynthesis. |
| ATTEMPT_ALREADY_EXISTS | Use prepare for saved response; reconcile any uncertain provider attempt first. |
| LOCAL_PROOF_FAILED | Check tool paths, saved media, measured duration, timestamps and approved-text compatibility; preserve the receipt. |

## Remaining hosted gate

After real narration passes, configure Vercel Hobby deployment and Inngest Free, complete hosted RLS/Storage checks, then implement the persisted approved-owner job/claim and quota reservation, short signed workflow steps, bounded Sandbox start/status/stop reconciliation, scoped Supabase signed upload and private signed playback. No unprotected generation endpoint is enabled by this work.

Current official [Sandbox quotas](https://vercel.com/docs/sandbox/pricing) list monthly Hobby inclusion of 5 Active CPU hours, 420 GB-hours memory, 5,000 creations and 20 GB transfer; these are shared limits to verify in the actual account, not a render capacity guarantee. [Inngest Free](https://www.inngest.com/pricing) lists 50k executions and no card requirement. No account configuration, remaining allowance or actual hosted output is inferred from public pricing.

Provider contracts: [speech with timing](https://elevenlabs.io/docs/api-reference/text-to-speech/convert-with-timestamps), [subscription](https://elevenlabs.io/docs/api-reference/user/subscription/get), [models](https://elevenlabs.io/docs/api-reference/models/list), [voice](https://elevenlabs.io/docs/api-reference/voices/get). No additional ElevenLabs SDK is necessary: the adapter uses bounded, server-only fetch requests against these documented endpoints.
