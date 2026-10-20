import Link from "next/link";
import { RenderPreview } from "./preview";
export const metadata = { title: "Rendering preview | IdeaMotion" };
export default function RenderPreviewPage() {
  return (
    <main
      id="main-content"
      className="mx-auto max-w-6xl px-6 py-10 text-[#302447]"
    >
      <Link href="/" className="underline">
        ← IdeaMotion home
      </Link>
      <p className="mt-10 text-sm font-semibold uppercase tracking-widest text-[#6244C6]">
        Local rendering proof
      </p>
      <h1 className="mt-3 text-4xl font-semibold">
        One idea. Two perspectives.
      </h1>
      <p className="mt-4 max-w-2xl leading-7">
        An original water-cycle scene with motion graphics and custom captions.
        This silent sample uses synthetic timing to test our renderer. AI
        generation and ElevenLabs narration are not connected yet.
      </p>
      <RenderPreview />
    </main>
  );
}
