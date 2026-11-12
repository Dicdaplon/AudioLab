# AudioLab overlay

A transparent page for an OBS **browser source**: the song's key, the current chord and
the played note, with live visuals, from the `@audiolab/react/stage` components. It is
a local tool (not deployed): it runs on the streaming machine and listens to its audio
inputs.

```bash
npm run overlay          # from the repository root: http://127.0.0.1:5174
```

Try it without an audio interface: <http://127.0.0.1:5174/?demo=synth&bg=1&debug=1>
(`bg=1` draws a stand-in background, `listen=1` also plays the demo).

## Signal path

The overlay never sits in the audio chain: it opens the inputs Windows exposes, like
any other recording application, alongside the DAW and OBS.

```
guitar ─► interface In 1 ─► DAW (ASIO, effects) ─► outputs ─► monitor mix ─► headphones
                                                                   │
                                     interface loopback input ◄────┘
                                        ├─► OBS (stream audio)
                                        └─► overlay ?harmony=  (key, chords, tempo)
interface In 1 (dry, Windows input) ───────► overlay ?notes=    (played note, attacks)
```

- **Harmony** wants the whole mix (the backing carries the chords): the interface's
  loopback input.
- **Notes** want the instrument alone and dry (no delay, no distortion): pitch
  detection on a mix hears the bass and the keys. With a Focusrite, the physical inputs
  are exposed as "Analogue 1 + 2"; the overlay downmixes to mono, so keep In 2 empty.
- Keep every device at the same sample rate (the interface's).

## URL parameters

| Parameter  | Values                                                                                       | Default          |
| ---------- | -------------------------------------------------------------------------------------------- | ---------------- |
| `harmony`  | part of an input's name, or its id                                                           | default input    |
| `notes`    | same                                                                                         | `harmony`        |
| `chords`   | `notes` (the chords you play) or `harmony` (the mix)                                         | `notes`          |
| `layout`   | `cam` (webcam corner), `scene` (no webcam), `band` (full-frame webcam)                       | `cam`            |
| `view`     | one element alone: `key`, `chord`, `tuner`, `ribbon`, `mandala`, or a file of `src/gallery/` |                  |
| `notation` | `both` (French, English small), `fr`, `en`                                                   | `both`           |
| `song`     | seconds of the song-key window                                                               | `180`            |
| `cam`      | webcam rectangle `x,y,w,h` (1920×1080)                                                       | `48,48,1344,756` |
| `extras`   | optional layers, comma-separated: `mandala`, `paws`, `embers`, `aurora`, `scope`, `ribbon`   | none             |
| `title`    | song title (scene layout)                                                                    |                  |
| `tab`      | `names`: timeline pills show note names, not frets                                           | frets            |
| `demo`     | `synth`, or an audio URL (`/@fs/F:/path/track.mp3`)                                          |                  |
| `debug`    | `1`: inputs, levels, tempo, errors                                                           |                  |
| `hud`      | `0`: never show the info panel, even on errors                                               |                  |

Input names are matched by substring, ignoring case, and real devices win over the
browser's "Default" / "Communications" aliases. A missing input is retried every 3 s, so
plugging the interface in after OBS starts works.

## OBS

1. Start OBS with `--use-fake-ui-for-media-stream` (shortcut target), so browser
   sources may open audio inputs without a permission prompt they cannot show.
2. Run `npm run overlay`.
3. Add a **Browser** source: URL
   `http://127.0.0.1:5174/?harmony=Loopback&notes=Analogue%201`, width 1920, height
   1080, "Use custom frame rate" 60, untick "Control audio via OBS" (the page plays
   nothing), tick "Shutdown source when not visible" if it lives in one scene only.
4. Use `&debug=1` once to check that both inputs are found and the level moves.
5. Between songs nothing is needed: 8 s of silence starts the song key over. To do it
   by hand, right-click the source › **Interact** and press **R** (or refresh the
   source); **D** shows or hides the info panel.

The layouts are deliberately light: one hero (the chord), one ambient layer (the city),
the webcam as the star, and a guitar timeline (scrolling tablature with the chords above
it) under the webcam. Everything else is opt-in with `extras=`.

Levels are adaptive: each input learns its own background and recent peaks, so silence,
the level meter, the city and the embers need no threshold, whatever the gain.

Several sources can show different `view`s and be placed freely; each one opens its own
inputs (cheap: analysis only).
