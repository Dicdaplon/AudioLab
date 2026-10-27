# GuitarSet excerpts

The first 12 s of four accompaniment excerpts of **GuitarSet** (version 1.1.0, microphone
recordings, `audio_mono-mic`), converted to mono 16-bit WAV, with their lead-sheet chords and
key in the JSON next to each file. Cut by `npm run extract:guitarset -w packages/core`.

GuitarSet: Q. Xi, R. M. Bittner, J. Pauwels, X. Ye, J. P. Bello, "GuitarSet: A Dataset for
Guitar Transcription", ISMIR 2018. <https://zenodo.org/records/3371780>. Licensed under
[CC BY 4.0](https://creativecommons.org/licenses/by/4.0/); the excerpts here are cut and
converted from the original files.

| File                    | Player | Style            | Key      |
| ----------------------- | ------ | ---------------- | -------- |
| `03_Rock3-148-C_comp`   | 03     | rock             | C major  |
| `04_SS3-98-C_comp`      | 04     | singer-songwriter | C major |
| `05_Funk3-98-A_comp`    | 05     | funk             | A major  |
| `03_Jazz2-187-F#_comp`  | 03     | jazz             | F# minor |

All four come from players 03–05, the test split of `npm run measure:guitarset`: the
settings tuned on players 00–02 never saw them.
