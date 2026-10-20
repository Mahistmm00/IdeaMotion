"use client";
import { Player } from "@remotion/player";
import { useState } from "react";
import { type Format, sceneLayout } from "../../video/layout";
import { ExplainerScene } from "../../video/Scene";
export function RenderPreview() {
  const [format, setFormat] = useState<Format>("horizontal");
  const layout = sceneLayout(format);
  return (
    <section className="mt-8" aria-label="Sample video player">
      <div className="mb-5 flex flex-wrap gap-3">
        {(["horizontal", "vertical"] as const).map((value) => (
          <button
            key={value}
            type="button"
            aria-pressed={format === value}
            onClick={() => setFormat(value)}
            className="rounded-full border border-[#7254D8] px-5 py-3 font-semibold aria-pressed:bg-[#7254D8] aria-pressed:text-white focus-visible:outline-2 focus-visible:outline-offset-4"
          >
            {value === "horizontal" ? "Horizontal · 16:9" : "Vertical · 9:16"}
          </button>
        ))}
      </div>
      <Player
        key={format}
        component={ExplainerScene}
        inputProps={{ format }}
        durationInFrames={360}
        fps={30}
        compositionWidth={layout.width}
        compositionHeight={layout.height}
        controls
        style={{
          width: "100%",
          maxWidth: format === "vertical" ? 360 : 960,
          aspectRatio: layout.width / layout.height,
          borderRadius: 20,
          overflow: "hidden",
        }}
      />
      <p className="mt-4 text-sm">
        12-second development fixture · 1080p · 30 fps · no audio. Full videos
        will target 60–90 seconds.
      </p>
    </section>
  );
}
