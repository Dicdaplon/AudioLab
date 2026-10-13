/** The "About" page: who builds this lab, and why it exists. */
export function About() {
  return (
    <article className="about al-panel">
      <header className="about__head">
        <p className="about__kicker">About</p>
        <h2 className="about__title">A research library, kept in the open</h2>
      </header>

      <div className="about__body">
        <p>
          I’m a developer and an engineer in signal and image processing.
          <br />I also play music, and I teach it.
        </p>

        <p>
          Audio is where the two meet.
          <br />A sound is a signal. A chord is a shape in a spectrum. A groove is a pattern in
          time.
          <br />I like to look at music from both sides: by ear, and by the numbers.
        </p>

        <p>
          <strong>This lab is my own research library, in a way.</strong>
          <br />
          Each tool started as a question:
        </p>
        <ul>
          <li>can a machine hear the key of a jam, live?</li>
          <li>what does a chord actually look like in a spectrum?</li>
          <li>where does the tempo hide in a waveform?</li>
        </ul>
        <p>
          Some answers are solid. Some are still rough.
          <br />I keep both here, documented and tested, so I can build on them, and so can others.
        </p>

        <p>
          AI is the next layer. Not as a magic box, but as one more way to listen: classical signal
          processing first, learned models where they genuinely help.
        </p>

        <h3 className="about__subtitle">l’école du loup(é)</h3>
        <p>
          Alongside this, I give music lessons and run a collective of musicians.
          <br />
          That is where <strong>l’école du loup(é)</strong> comes from: a space I created to talk
          about music theory, improvisation and listening. Fewer rules, more links between things.
        </p>
        <p>
          The tools in this lab are meant to live there too: ear training, chord detection,
          exercises that listen back.
        </p>

        <p className="about__links">
          <a href="https://ecoleduloup.fr" target="_blank" rel="noreferrer">
            ecoleduloup.fr
          </a>{" "}
          <span className="about__note">(in French)</span>
          <span aria-hidden="true"> · </span>
          <a href="https://github.com/Dicdaplon/AudioLab" target="_blank" rel="noreferrer">
            Source on GitHub
          </a>
        </p>
      </div>
    </article>
  );
}
