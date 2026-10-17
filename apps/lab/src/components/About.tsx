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

        <h3 className="about__subtitle">What you can try here</h3>
        <ul>
          <li>
            <strong>Detector</strong>: the key and the chord, live. Pick a chord vocabulary: the 24
            triads, or sevenths, sixths, sus2 / sus4 and diminished chords on top.
          </li>
          <li>
            <strong>Tuner</strong> and <strong>Scales</strong>: a McLeod pitch tracker, and the
            scales that fit what you just played.
          </li>
          <li>
            <strong>Chord game</strong>: play the chord on screen, now with seventh and suspended
            sets, and a choice: same notes, or the triad is enough (E for E7).
          </li>
          <li>
            <strong>Wolf Jumper</strong>: notes to shoot, chords to collect. The note can come from
            the chroma or from the pitch tracker, which follows the fundamental rather than the
            loudest harmonic of a string.
          </li>
          <li>
            <strong>Rhythm</strong>: play a written rhythm at your own pace, or notes and chords as
            they reach a line. Each note is placed to the millisecond on the audio clock, with no
            click and no threshold to set, and the page shows how sure it can be.
          </li>
          <li>
            <strong>FFT</strong>: the spectrum, its noise floor, and where the tempo hides.
          </li>
        </ul>
        <p>
          Under the hood it is an SDK, <code>@audiolab/core</code> and <code>@audiolab/react</code>:
          the same detectors run here and on ecoleduloup.fr. The extended chord vocabulary is
          measured on a synthetic guitar so far (95 % right with every quality on); recorded takes
          are next.
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
