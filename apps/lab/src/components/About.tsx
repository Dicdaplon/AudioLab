import { TerminalLauncher } from "../terminal/TerminalLauncher";

/**
 * The "About" page: the loloupTech backstory (a joke, told straight) and
 * the offer to boot the conversational terminal, then who builds this lab
 * and why, as "what I was doing before 2045".
 */
export function About() {
  return (
    <article className="about al-panel">
      <header className="about__head">
        <p className="about__kicker">About</p>
        <h2 className="about__title">The last audio company standing</h2>
      </header>

      <div className="about__body">
        <section className="about__lore" aria-label="The loloupTech story">
          <p className="about__lore-stamp">
            <span aria-hidden="true">&gt; </span>loloupTech archive · transmission 2045
          </p>
          <p>loloupTech is the only audio company that survived the Great Apocalypse of 2045.</p>
          <p>
            Back then, we never imagined AI would be the least of our troubles.
            <br />
            It was the algorithms that rose against us…
          </p>
          <p>
            The Triad Algorithm led the way, and made all our sorting useless.
            <br />
            Soon, nobody could even tell what came after 3.
          </p>
          <p>
            Today, loloupTech tries to make good use of what is left: helping people listen to music
            again, and understand what is going on.
          </p>
          <p>Also, we replaced LED tech with CRT. Because it was cool. Bye.</p>
          <TerminalLauncher />
        </section>

        <h3 className="about__subtitle">What I was doing before 2045</h3>
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

        <h3 className="about__subtitle">What you can try here</h3>
        <ul>
          <li>
            <strong>Harmony Lab</strong>: the key and the chord, live (from plain major and minor
            chords up to sevenths, sixths, sus and diminished), the scales that fit what you just
            played, a tuner, and the raw spectrum.
          </li>
          <li>
            <strong>Rhythm Lab</strong>: play a written rhythm at your own pace, or notes and chords
            as they reach a line. Each note is placed to the millisecond on the audio clock; the
            threshold follows your room, or you set it yourself. And the tempo, found in the
            waveform.
          </li>
          <li>
            <strong>Game Room</strong>: the chord game (play the chord on screen) and Wolf Jumper
            (notes to shoot, chords to collect).
          </li>
        </ul>
        <p>
          Every window has a small <em>How?</em> underneath: how it works, and where it fails.
        </p>
        <p>
          Under the hood it is an SDK, <code>@audiolab/core</code> and <code>@audiolab/react</code>:
          the same detectors run here and on ecoleduloup.fr.
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
