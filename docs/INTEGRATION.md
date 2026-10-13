# Integrating the SDK in a host application

A guide for hosts like MusicalBook (Next.js 15 App Router, React 19, TypeScript): how to
mount the AudioLab components in a page, keep the host's theme and styles intact, share
the host's AudioContext, build a custom UI on the engines alone, work on both
repositories at once, and ship a release.

## 1. Install

> Not published on npm yet. Until the first release, the official install path is
> `npm pack` into the host's vendor folder: see
> [section 8](#8-developing-across-the-two-repositories).

```bash
npm install @audiolab/react @audiolab/core
# optional self-hosted fonts, only if you import @audiolab/react/fonts.css:
npm install @fontsource/ibm-plex-sans @fontsource/ibm-plex-mono @fontsource/source-serif-4
```

Both packages are ESM with TypeScript declarations. `react` / `react-dom` `^18.2 || ^19`
are peer dependencies; `@audiolab/core` is a dependency of `@audiolab/react` and is also
what you import pure values and types from (settings defaults, `TonalityFrame`,
`MicrophoneError`…).

## 2. Next.js App Router

**Stylesheet** — import it once, in the root layout (CSS from `node_modules` is allowed
there):

```tsx
// app/layout.tsx
import "@audiolab/react/styles.css";
import "@audiolab/react/fonts.css"; // optional
```

**A client page** — every `@audiolab/react` module carries `"use client"`, so a server
component can render the SDK components directly, but the hooks need a client component
of yours for the state:

```tsx
// app/lab/page.tsx (server component)
import { DEFAULT_DETECTOR_SETTINGS } from "@audiolab/core"; // plain values, fine on the server
import { Detector } from "./detector";

export default function Page() {
  return <Detector initialSettings={DEFAULT_DETECTOR_SETTINGS} />;
}
```

```tsx
// app/lab/detector.tsx
"use client";

import { useState } from "react";
import type { DetectorSettings } from "@audiolab/core";
import {
  DetectorTab,
  LoupeRoot,
  MicNotice,
  MicTransport,
  WolfJumper,
  useMicrophone,
  useTonality,
  type MicState,
} from "@audiolab/react";

export function Detector({ initialSettings }: { initialSettings: DetectorSettings }) {
  const [settings, setSettings] = useState(initialSettings);
  const [colourByPitch, setColourByPitch] = useState(false);
  const microphone = useMicrophone();
  const tonality = useTonality(microphone.mic, settings);

  let state: MicState = "idle";
  if (microphone.unsupported) state = "unsupported";
  else if (microphone.error) state = "error";
  else if (microphone.running) state = "live";
  else if (microphone.starting) state = "starting";
  const error = microphone.unsupported?.message ?? microphone.error;

  return (
    <LoupeRoot as="section">
      <MicTransport
        state={state}
        onStart={microphone.start}
        onStop={microphone.stop}
        onReset={tonality.reset}
      />
      {error && (
        <MicNotice
          message={error}
          kind={microphone.unsupported ? "unsupported" : "error"}
          onRetry={microphone.start}
        />
      )}
      <DetectorTab
        data={tonality}
        settings={settings}
        onSettingsChange={setSettings}
        colourByPitch={colourByPitch}
        onColourByPitchChange={setColourByPitch}
      />
      <WolfJumper
        instantaneousChroma={tonality.instantaneousChroma}
        chords={tonality.chords}
        running={microphone.running}
        signalLevelDb={tonality.signalLevelDb}
        onStart={microphone.start}
      />
    </LoupeRoot>
  );
}
```

`next build` prerenders such a page statically: nothing in the SDK reads `window`,
`document` or `localStorage` during module evaluation or the first render, and the
things that depend on the browser (media queries, the stored theme, the microphone
support check, the chord game's first target) are resolved in effects. The repository's
`packages/react/tests/ssr.test.ts` and `hydration.test.tsx` keep it that way.

Use `useMicrophone().unsupported` rather than calling `checkMicrophoneSupport()` during
render: on the server there is no `navigator`, so a render-time check would produce
markup that the client disagrees with.

## 3. Theme

The SDK follows the host's theme contract, which is MusicalBook's:

- `<html data-theme="dark" | "light">` is the explicit choice and wins;
- without it, the OS preference (`prefers-color-scheme`) applies, dark by default;
- the choice is stored in `localStorage("theme")`.

MusicalBook's anti-flash script and `BasculeTheme` already set that attribute and that
key; the SDK's components switch instantly (the canvas plots observe the attribute).
`ThemeToggle` from `@audiolab/react` writes the same contract, but a host with its own
toggle does not need it.

## 4. CSS scoping

`styles.css` cannot leak: tokens are defined on `.loupe` (rendered by `LoupeRoot`), not
on `:root`, and prefixed `--al-`; component classes are prefixed `al-`. The host's own
`--color-ink`, `.panel` or `.btn` are untouched, and host rules do not match SDK
elements. Inside a `LoupeRoot` the subtree receives the Loupe box model (`box-sizing`,
zero margins), font and colour, so host content placed _inside_ the root inherits them
by design.

To restyle, override tokens on the root:

```css
.loupe {
  --al-color-accent: #9a4a10;
  --al-font-ui: var(--font-ui); /* reuse the host's font stack */
}
```

Keep the `--al-viz-*` tokens as literal colours: the plots read them through
`getComputedStyle` and cannot resolve `var()` or `color-mix()`.

## 5. Microphone permissions and HTTPS

`getUserMedia` only exists in a secure context: `https://` or `localhost` /
`127.0.0.1`. A LAN IP over plain HTTP shows the `insecure-context` notice instead of the
permission prompt. Start the microphone from a click (`microphone.start` on a button):
browsers keep a fresh `AudioContext` suspended until a user gesture. Permission is asked
once per origin; `MicNotice` explains how to re-allow it in Chrome, Firefox and Safari.

Tempo analysis loads an AudioWorklet from a Blob URL. If the host sends a Content
Security Policy, allow `blob:` in `script-src` (or `worker-src`); otherwise the capture
falls back to AnalyserNode polling, which is fine for the detector and the games and only
loses sample accuracy for the tempo estimate.

## 6. Sharing the host's AudioContext

A page must run **one** `AudioContext`. A host that already has one (Tone.js, a synth, a
player) passes it to the session and the SDK never creates, resumes-for-itself or closes
a context of its own:

```tsx
"use client";
import * as Tone from "tone";
import { useMicrophone, usePitch } from "@audiolab/react";

export function Tuner() {
  // Tone owns the context; the SDK only connects nodes to it.
  const microphone = useMicrophone({ context: Tone.getContext().rawContext as AudioContext });
  const { estimate } = usePitch(microphone.mic, { referenceA4: 442 });
  return (
    <button onClick={() => Tone.start().then(microphone.start)}>
      {estimate ? `${estimate.pitchClass} ${estimate.cents.toFixed(0)} cents` : "Start"}
    </button>
  );
}
```

Rules, enforced by `openMicrophone` and tested:

- nothing happens before the click: `start()` is the first call that touches
  `getUserMedia`; call it (and `Tone.start()`) from a user gesture;
- a provided context is **resumed if suspended** and **never closed**; `dispose()` /
  `stop()` only disconnect the SDK's source node and stop the tracks the SDK acquired;
- a provided `stream` is used as is and its tracks are never stopped;
- `mic.ownsContext` and `mic.ownsStream` tell what the session will release.

The analysis nodes (`AnalyserNode`, the sample-capture `AudioWorkletNode`) are created
on the given context and disconnected when the hooks unmount. The worklet outputs
silence and is connected to the destination so the graph keeps rendering it; it does
not interfere with the host's own routing.

## 7. Engines for custom UIs

A host with its own look (and its own note names, "Do Ré Mi") imports `@audiolab/core`
and `@audiolab/core/games` only. Everything the engines return is a key or a number:
pitch classes 0–11 (C = 0), MIDI numbers, cents, `{ root, quality }` chord references,
scale and pool ids. No English label reaches the host.

**Tuner.** `usePitch(mic)` (or `PitchTracker` + `startSampleCapture` without React)
gives `{ frequency, midi, pitchClass, cents, clarity }` or `null`; map `pitchClass` to
your own names and draw the cents.

**Scale finder.** Feed `matchScales` the `presenceHistogram` of `useTonality` (or any
12 weights): each match carries `scaleId`, `tonic`, `missing` and `outside` pitch
classes. Pass your own `ScaleDefinition[]` to add scales; use `SCALE_NAMES_EN` or your
own map for labels.

**Wolf Jumper.** The whole game is `gameReducer` over a `GameState` from
`createInitialState(seed, config)`; the host owns the clock and the detector:

```ts
import {
  createInitialState,
  gameReducer,
  dominantNote,
  pushChromaFrame,
  stepConfirmation,
  EMPTY_CONFIRMATION,
  chordKey,
  parseChordKey,
  WOLF_JUMPER_DETECTION_DEFAULTS as D,
} from "@audiolab/core/games";

let game = createInitialState(seed, { notePool: [9, 0, 2, 4, 7] }); // A minor pentatonic
game = gameReducer(game, { type: "start" });

// Animation loop (requestAnimationFrame): advance the game clock.
game = gameReducer(game, { type: "tick", dtMs });

// Detector loop (10 Hz, from TonalityEngine frames): notes and chords, debounced.
frames = pushChromaFrame(frames, frame.instantaneousChroma, D.noteSmoothFrames);
const note = dominantNote(frames);
const step = stepConfirmation(noteRun, note?.pc ?? null, note?.energy ?? 0, {
  required: D.noteConfirmations,
  minProbability: D.minNoteEnergy,
});
noteRun = step.state;
if (step.confirmed !== null) game = gameReducer(game, { type: "noteDetected", pc: step.confirmed });

const top = frame.chords[0];
const chordStep = stepConfirmation(chordRun, top ? chordKey(top) : null, top?.probability ?? 0, {
  required: D.chordConfirmations,
  minProbability: D.minChordProbability,
});
chordRun = chordStep.state;
if (chordStep.confirmed !== null) {
  game = gameReducer(game, { type: "chordDetected", chord: parseChordKey(chordStep.confirmed) });
}
```

Render `game.enemies` (`pc`, `progress` 0 → 1, `laneY`, `status`), `game.bonuses`
(`chord`, `type`), `game.hp` / `game.config.maxHp`, `game.score`; `gameReducer` returns
the same object when nothing changed. Every tuning value (speeds, spawn rhythm, bonus
durations, lanes) is in `WOLF_JUMPER_DEFAULTS` and overridable in `config`.

**Chord game.** `pickChord(CHORD_POOLS[poolId], previous)` draws the target,
`stepConfirmation` with `CHORD_GAME_DEFAULTS` confirms a hit when the detector's top
chord `sameChord`s the target, `chordGameReducer` keeps score / streak / skipped.

## 8. Developing across the two repositories

Until the packages are on npm, this is the **official install path** and it reproduces
exactly what npm would install:

```bash
# in AudioLab
npm run build:packages
npm pack -w packages/core -w packages/react --pack-destination ../MusicalBook/web/vendor
# prints the file names, audiolab-core-<version>.tgz and audiolab-react-<version>.tgz
# (the packages are at 0.0.0 until the first release: audiolab-core-0.0.0.tgz)

# in MusicalBook/web
npm install ./vendor/audiolab-core-0.0.0.tgz ./vendor/audiolab-react-0.0.0.tgz
```

A host that only uses the engines installs the core tarball alone. Repeat the pack /
install after each SDK change. If npm keeps an old tarball (same version, same file
name), delete `node_modules/@audiolab` and the lock entry, or bump the version with a
changeset first.

For a tighter loop, `file:` dependencies on the package directories work too
(`"@audiolab/react": "file:../../AudioLab/packages/react"`) — they install symlinks, so
`npm run build:packages` (or `npx tsup --watch` in each package) is enough to refresh.
Mind that a symlinked package resolves `react` from its own tree: keep a single React by
deduping (`npm ls react`) or prefer the tarball flow. `npm link` is the same mechanism
with the same caveat.

The lab app in this repository is the reference consumer: `apps/lab` composes the SDK the
same way a host does (`LoupeRoot`, the hooks, the tabs) and its production build consumes
the packages' `dist`. In development and in tests, the `audiolab-source` export condition
resolves the packages to their TypeScript sources so no build step is needed.

## 9. Releases

Versioning uses [Changesets](https://github.com/changesets/changesets); the two packages
are linked and always release together.

1. With every user-visible change, add a changeset: `npm run changeset` (pick the
   packages and the bump, write the summary). Commit it with the change.
2. To cut a release: `npm run version-packages` applies the pending changesets (bumps
   `package.json` versions, writes `CHANGELOG.md`, refreshes the lock file). Review and
   commit (`chore(release): version packages`).
3. `npm run release` builds both packages, runs `publint` and `arethetypeswrong` on the
   packed tarballs, then `changeset publish` pushes them to npm and creates the git tags
   (`@audiolab/core@x.y.z`, `@audiolab/react@x.y.z`). Push the tags.

Nothing publishes from CI, and no registry token is configured in the workflows. Before
the first `npm publish`, the `@audiolab` scope must exist on npmjs.com (create the
organisation or rename the packages); `publishConfig.access` is already `public`.
