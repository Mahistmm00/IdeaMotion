import { Composition, registerRoot } from "remotion";
import { ExplainerScene } from "./Scene";

function VideoRoot() {
  return (
    <>
      {(["vertical", "horizontal"] as const).map((format) => (
        <Composition
          key={format}
          id={`WaterCycle-${format}`}
          component={ExplainerScene}
          durationInFrames={360}
          fps={30}
          width={format === "vertical" ? 1080 : 1920}
          height={format === "vertical" ? 1920 : 1080}
          defaultProps={{ format }}
        />
      ))}
    </>
  );
}
registerRoot(VideoRoot);
