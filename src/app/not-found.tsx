import Link from "next/link";

export default function NotFound() {
  return (
    <main id="main-content" className="not-found">
      <p className="eyebrow">404 · PAGE NOT FOUND</p>
      <h1>Let’s get you back to the idea.</h1>
      <p>This page isn’t available.</p>
      <Link className="primary-link" href="/">
        Back to IdeaMotion
      </Link>
    </main>
  );
}
