import { Composition, registerRoot } from "remotion";
import { fixturePlan } from "./fixture";
import { narratedPropsSchema } from "./narrated-contract";
import { NarratedScene } from "./Scene";

function Root() {
  return (
    <Composition
      id="NarratedWaterCycle"
      defaultProps={{
        format: "horizontal",
        narration: fixturePlan.narration,
        audioHash: "",
        speechDependencyKey: "",
        durationSeconds: 0,
        words: [],
      }}
      component={NarratedScene}
      durationInFrames={360}
      fps={30}
      width={1920}
      height={1080}
      calculateMetadata={({ props }) => {
        const parsed = narratedPropsSchema.parse(props);
        return {
          durationInFrames: Math.ceil(parsed.durationSeconds * 30),
          width: parsed.format === "vertical" ? 1080 : 1920,
          height: parsed.format === "vertical" ? 1920 : 1080,
        };
      }}
    />
  );
}
registerRoot(Root);
