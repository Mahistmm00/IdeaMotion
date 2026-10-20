import "@fontsource/inter/600.css";
import { useEffect, useState } from "react";
import {
  AbsoluteFill,
  Audio,
  continueRender,
  delayRender,
  interpolate,
  staticFile,
  useCurrentFrame,
} from "remotion";
import { z } from "zod";
import { sceneTimelineSchema, type WordV1 } from "../lib/schemas/timeline";
import { resolveCue } from "../lib/timing/anchors";
import { captionFrames } from "../lib/timing/frames";
import { segmentCaptions, wrapText } from "./captions";
import {
  fixtureDuration,
  fixtureEvents,
  fixturePlan,
  fixtureWords,
} from "./fixture";
import { sceneLayout } from "./layout";
import { type NarratedProps, narratedPropsSchema } from "./narrated-contract";

if (fixturePlan.component !== "process")
  throw new Error("Unsupported fixture.");
const processVisual = fixturePlan.visual;

export const previewPropsSchema = z.strictObject({
  format: z.enum(["vertical", "horizontal"]),
});
export type PreviewProps = z.infer<typeof previewPropsSchema>;
type Prepared = {
  captions: ReturnType<typeof segmentCaptions>;
  frames: ReturnType<typeof captionFrames>;
};

export function ExplainerScene(input: PreviewProps) {
  const { format } = previewPropsSchema.parse(input);
  return (
    <ProcessScene
      format={format}
      words={fixtureWords}
      events={fixtureEvents}
      durationSeconds={fixtureDuration}
      speechDependencyKey={"0".repeat(64)}
      audioHash={null}
    />
  );
}

export function NarratedScene(input: NarratedProps) {
  const props = narratedPropsSchema.parse(input);
  const events = fixturePlan.cues.map((cue) =>
    resolveCue(cue, props.words, props.durationSeconds),
  );
  return (
    <ProcessScene
      format={props.format}
      words={props.words}
      events={events}
      durationSeconds={props.durationSeconds}
      speechDependencyKey={props.speechDependencyKey}
      audioHash={props.audioHash}
    />
  );
}

function ProcessScene({
  format,
  words,
  events,
  durationSeconds,
  speechDependencyKey,
  audioHash,
}: {
  format: PreviewProps["format"];
  words: WordV1[];
  events: typeof fixtureEvents;
  durationSeconds: number;
  speechDependencyKey: string;
  audioHash: string | null;
}) {
  const layout = sceneLayout(format);
  const frame = useCurrentFrame();
  const [handle] = useState(() =>
    delayRender("Load local font and measure scene"),
  );
  const [prepared, setPrepared] = useState<Prepared | null>(null);
  const [error, setError] = useState<string | null>(null);
  useEffect(() => {
    let active = true;
    async function prepare() {
      try {
        await document.fonts.load("600 48px Inter");
        const context = document.createElement("canvas").getContext("2d");
        if (!context) throw new Error("Text measurement is unavailable.");
        context.font = "600 48px Inter";
        const captions = segmentCaptions(
          words,
          layout.captionWidth - 80,
          (text) => context.measureText(text).width,
        );
        context.font = "600 42px Inter";
        if (
          fixturePlan.component !== "process" ||
          processVisual.entities.some(
            (node) =>
              wrapText(
                node.label,
                layout.nodeWidth - 100,
                (text) => context.measureText(text).width,
              ).length !== 1,
          )
        )
          throw new Error("Process label exceeds its safe region.");
        context.font = "600 78px Inter";
        if (
          wrapText(
            fixturePlan.displayText,
            layout.width - 192,
            (text) => context.measureText(text).width,
          ).length !== 1
        )
          throw new Error("Heading exceeds its safe region.");
        sceneTimelineSchema.parse({
          schemaVersion: 1,
          sceneId: fixturePlan.sceneId,
          speechDependencyKey,
          durationSeconds,
          words,
          captions: captions.map(({ lines: _lines, ...caption }) => caption),
          events,
        });
        if (active)
          setPrepared({
            captions,
            frames: captionFrames(
              captions.map(({ start, end }) => ({ start, end })),
              30,
              durationSeconds,
            ),
          });
      } catch (failure) {
        if (active)
          setError(
            failure instanceof Error
              ? failure.message
              : "Scene preparation failed.",
          );
      } finally {
        continueRender(handle);
      }
    }
    void prepare();
    return () => {
      active = false;
    };
  }, [
    handle,
    layout.captionWidth,
    layout.nodeWidth,
    layout.width,
    words,
    events,
    durationSeconds,
    speechDependencyKey,
  ]);
  if (error) throw new Error(error);
  const captionIndex =
    prepared?.frames.findIndex(
      (c) => frame >= c.startFrame && frame < c.endFrame,
    ) ?? -1;
  const caption = prepared?.captions[captionIndex];
  if (fixturePlan.component !== "process")
    throw new Error("Unsupported scene.");
  return (
    <AbsoluteFill
      style={{
        background:
          "linear-gradient(140deg, #F9F5FF 0%, #F0EAFB 60%, #FFE9DC 100%)",
        color: "#302447",
        fontFamily: "Inter",
        fontWeight: 600,
      }}
    >
      {audioHash ? (
        <Audio src={staticFile(`narration-proof/${audioHash}.mp3`)} />
      ) : null}
      <div
        style={{
          position: "absolute",
          left: 96,
          top: 82,
          fontSize: 28,
          letterSpacing: 5,
          color: "#6244C6",
        }}
      >
        IDEAMOTION · SCIENCE IN MOTION
      </div>
      <div style={{ position: "absolute", left: 96, top: 170, fontSize: 78 }}>
        {fixturePlan.displayText}
      </div>
      <div style={{ position: "absolute", left: 96, top: 280, fontSize: 30 }}>
        One continuous journey. Three essential changes.
      </div>
      {layout.nodes.map((node, index) => {
        const entity = processVisual.entities[index];
        const event = events.find((e) => e.targetId === entity.id);
        const started = event ? frame >= Math.floor(event.start * 30) : false;
        const current = event
          ? started && frame < Math.ceil(event.end * 30)
          : false;
        const progress = event
          ? interpolate(
              frame,
              [event.start * 30, event.start * 30 + 12],
              [0, 1],
              { extrapolateLeft: "clamp", extrapolateRight: "clamp" },
            )
          : 0;
        return (
          <div
            key={entity.id}
            style={{
              position: "absolute",
              left: node.x,
              top: node.y,
              width: layout.nodeWidth,
              height: layout.nodeHeight,
              boxSizing: "border-box",
              borderRadius: 36,
              border: current ? "5px solid #7254D8" : "3px solid #DCCFEF",
              background: started ? "#FFF7F1" : "#FFFFFF",
              transform: `translateY(${(1 - progress) * 8}px)`,
              display: "flex",
              flexDirection: "column",
              justifyContent: "center",
              padding: 40,
              gap: 20,
              boxShadow: "0 18px 45px #3024470D",
            }}
          >
            <div style={{ fontSize: 26, color: "#6244C6" }}>
              0{index + 1} /{" "}
              {index === 0
                ? "LIQUID → GAS"
                : index === 1
                  ? "GAS → LIQUID"
                  : "WATER FALLS"}
            </div>
            <div style={{ fontSize: 42 }}>{entity.label}</div>
          </div>
        );
      })}
      {layout.nodes.slice(0, 2).map((node, index) => (
        <div
          key={processVisual.connections[index].id}
          style={{
            position: "absolute",
            fontSize: 58,
            color: "#7254D8",
            left: format === "vertical" ? 510 : node.x + 520,
            top: format === "vertical" ? node.y + 235 : node.y + 85,
          }}
        >
          {format === "vertical" ? "↓" : "→"}
        </div>
      ))}
      {caption ? (
        <div
          style={{
            position: "absolute",
            top: layout.captionTop,
            left: (layout.width - layout.captionWidth) / 2,
            width: layout.captionWidth,
            boxSizing: "border-box",
            background: "#302447",
            color: "#FFFFFF",
            padding: "24px 40px",
            borderRadius: 24,
            fontSize: 48,
            lineHeight: "64px",
            textAlign: "center",
          }}
        >
          {caption.lines.map((line) => (
            <div key={line}>{line}</div>
          ))}
        </div>
      ) : null}
      <div style={{ position: "absolute", bottom: 48, left: 96, fontSize: 24 }}>
        {audioHash
          ? "The water cycle · elevenlabs.io"
          : "LOCAL RENDER PROOF · SYNTHETIC TIMING · SILENT SAMPLE"}
      </div>
    </AbsoluteFill>
  );
}
