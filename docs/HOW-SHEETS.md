# "How?" sheets

Every feature of the lab ends with a discreet **How?** bar. Closed, it is one
quiet line; open, a small sheet: a miniature diagram and a few lines on how
the feature works, its algorithm, its limits, where it comes from, and one
thing worth knowing. This page is the recipe, so a new feature (here or in a
site built on the SDK) gets its sheet the same way.

## The pieces (all in `@audiolab/react`)

| Piece            | What it is                                                                                                                                                                                 |
| ---------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `HowPanel`       | The disclosure: `topic`, `diagram`, the lead as children, then `algorithm`, `limits`, `sources`, `aside`. A native `<details>`; `defaultOpen` and `title` (e.g. "Comment ?") are optional. |
| `compact`        | The small `HowPanel` that closes one panel: smaller bar, one column, diagram optional. `Panel`, the detector views and `FftTab` take it through a `how` prop.                              |
| `SketchChain`    | Sketches in a row joined by arrows, each with a caption; wraps on narrow screens. `wide: true` gives a step more room.                                                                     |
| `SketchWave`     | A waveform: `sine`, `pluck` (attack then decay), `noise`, `click`.                                                                                                                         |
| `SketchBars`     | Bars: a spectrum, a chroma, a histogram; `highlight`, a dashed `threshold`, tiny `labels`.                                                                                                 |
| `SketchCurve`    | A curve in [0, 1]²: an envelope, a correlation, a flux; `marks` dots, a `dashed` second curve.                                                                                             |
| `SketchTimeline` | A play-along lane: `targets`, red onset `dots`, a tolerance `band` around the `hit` line, `beats`; `wide`.                                                                                 |
| `SketchMeter`    | A level meter with the learnt `floor` and the `threshold`.                                                                                                                                 |
| `SketchLabel`    | A result in big type: "C major", "110 Hz", "±50 ms".                                                                                                                                       |

Sketches draw in a 120 × 64 box (200 × 64 when wide) and take their colours
from the `--al-viz-*` tokens, so both themes work without a single colour in
the code. They are decorative unless given a `label`; give the chain one
`label` that says what the picture shows.

The lab's sheets live in `apps/lab/src/how/explanations.tsx`, outside the SDK
components, so a host writes its own words.

## Writing one

**Shape** (keep it short; the sheet must stay a glance):

- `topic`: four or five words, lower case, what is explained ("finding the
  key", "when a note starts").
- Lead: two or three sentences, the idea in plain words, one image.
- `algorithm`: the method named and summed up in one or two sentences, with
  the numbers that matter (window, rate, threshold).
- `limits`: what it gets wrong, honestly, one or two sentences.
- `sources`: the paper(s) it comes from, "Author, short title, venue year".
  If it is home-made, say so ("No paper: …").
- `aside`: one thing worth knowing, the line people remember.
- Diagram: two or three steps, the pipeline from what you play to what it
  answers. A caption under each, three words at most.

**Voice** (the teaching voice of the MusicalBook mixing chapters, in
English):

- First person and direct: "I measure…", "So I wait until…".
- One concrete image per idea: a prism for the FFT, a stencil for chord
  templates, a lock and keys for scales, a friend who mishears for
  debouncing.
- Perception before maths: "an A string draws the same shape every 9.1 ms",
  "two neighbouring low notes are only 5 Hz apart".
- Honest: say what it skips and where it fails. No hype words.
- The game tabs' instructions stay instructions; the machinery (frames,
  probabilities, FFT sizes) belongs in the sheet, not in the game copy.

## Checklist for a new feature

1. Write the sheet in `apps/lab/src/how/explanations.tsx` (or the host's own
   module) with the shape above.
2. Place it under the feature: inside the feature's panel, or in a
   `<div className="lab-how">` after an SDK component. A small window of a page
   (one chroma, one list) gets a `compact` sheet through its `how` prop: the
   lead in one or two sentences, the algorithm and the limits, nothing more.
   The detector's are in `apps/lab/src/how/detector.tsx`.
3. Add its topic to the "offers a How? sheet under every feature" test in
   `apps/lab/tests/App.test.tsx`.
4. Look at it open, in both themes and in a narrow column, before shipping.
