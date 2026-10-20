import Link from "next/link";

const stages = [
  {
    number: "01",
    title: "Idea",
    description:
      "Start with a topic. Shape the explanation through a simple conversation.",
  },
  {
    number: "02",
    title: "Plan",
    description:
      "Review the script and storyboard together before creating your video.",
  },
  {
    number: "03",
    title: "Video",
    description:
      "Bring the story to life with motion, narration, and synchronized captions.",
  },
  {
    number: "04",
    title: "Publish",
    description:
      "Review your finished video, download it, or prepare it for Instagram.",
  },
];

export default function Home() {
  return (
    <div className="site-shell">
      <header className="site-header">
        <Link className="wordmark" href="/" aria-label="IdeaMotion home">
          <span className="brand-mark" aria-hidden="true">
            i<span />
          </span>
          IdeaMotion<span className="wordmark-dot">.</span>
        </Link>
        <span className="status-pill">
          <span aria-hidden="true" /> In development
        </span>
      </header>

      <main id="main-content">
        <section className="hero" aria-labelledby="hero-title">
          <div className="hero-copy">
            <p className="eyebrow">A little idea. A moving story.</p>
            <h1 id="hero-title">
              Your ideas,
              <br />
              explained <span className="hero-accent">in motion.</span>
            </h1>
            <p className="hero-description">
              A simpler way to turn what you know into educational videos.
              Thoughtful motion graphics, a clear voice, and captions that keep
              up.
            </p>
            <a className="primary-link" href="#workflow">
              Explore the workflow <span aria-hidden="true">↗</span>
            </a>
            <p className="project-note">
              Portfolio preview · Video creation is coming soon.
            </p>
          </div>

          <div
            className="concept-card"
            role="img"
            aria-label="Illustration of the planned video experience; not a playable video"
          >
            <div className="concept-toolbar">
              <span className="concept-dot" /> A small idea, beautifully
              explained <span>16:9</span>
            </div>
            <div className="concept-stage">
              <span className="concept-label">MADE TO MAKE SENSE</span>
              <div className="idea-orbit" aria-hidden="true">
                <span className="orbit-node node-one">Idea</span>
                <span className="orbit-center">Aha!</span>
                <span className="orbit-node node-two">Story</span>
              </div>
              <p>
                Connect the dots.
                <br />
                <strong>Make something click.</strong>
              </p>
              <span className="caption-example">
                Every great explanation starts with an idea.
              </span>
            </div>
            <div className="concept-footer">
              <span className="preview-label">Concept illustration</span>
              <div className="timeline" aria-hidden="true">
                <span />
              </div>
              <span>Motion + voice + captions</span>
            </div>
          </div>
        </section>

        <section
          id="workflow"
          className="workflow"
          aria-labelledby="workflow-title"
        >
          <div className="section-heading">
            <div>
              <p className="eyebrow">THE PLANNED EXPERIENCE</p>
              <h2 id="workflow-title">From thought to story, in four steps.</h2>
            </div>
            <p>
              One connected creative flow.
              <br />
              Built one feature at a time.
            </p>
          </div>
          <ol className="stage-grid">
            {stages.map((stage) => (
              <li className="stage-card" key={stage.number}>
                <span className="stage-number">{stage.number}</span>
                <h3>{stage.title}</h3>
                <p>{stage.description}</p>
              </li>
            ))}
          </ol>
        </section>
      </main>
      <footer className="site-footer">
        <span>IdeaMotion · Independent portfolio project</span>
        <span>Designed for learning. Built with care.</span>
      </footer>
    </div>
  );
}
