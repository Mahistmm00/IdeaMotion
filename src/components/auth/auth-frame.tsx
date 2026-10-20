import Link from "next/link";

export function AuthFrame({ children }: { children: React.ReactNode }) {
  return (
    <div className="auth-shell">
      <aside className="auth-story">
        <Link href="/" className="wordmark">
          IdeaMotion<span className="wordmark-dot">.</span>
        </Link>
        <div>
          <p className="eyebrow">MAKE SOMETHING CLICK</p>
          <h2>
            A little idea.
            <br />A moving story.
          </h2>
          <p>Turn what you know into something others can understand.</p>
          <ol>
            <li>Share your idea</li>
            <li>Shape your storyboard</li>
            <li>Bring it to life</li>
            <li>Share your explanation</li>
          </ol>
        </div>
        <p className="project-note">
          Independent portfolio project · In development
        </p>
      </aside>
      <main id="main-content" className="auth-main">
        {children}
        <Link className="auth-back" href="/">
          ← Back to the preview
        </Link>
      </main>
    </div>
  );
}
