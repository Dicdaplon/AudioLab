import { describe, expect, it } from "vitest";

import {
  BASIC_PITCH,
  BASIC_PITCH_FPS,
  BASIC_PITCH_LOOKAHEAD_SECONDS,
  checkNoteModelOutput,
  NoteChordDecoder,
  NoteModelChords,
  noteChroma,
  type NoteChordResult,
  resampleAudio,
  StreamResampler,
  transcribeNotes,
} from "../../src/analysis/notes";
import { C_OR_AM, fakeNoteModel, keyRow } from "../helpers/fakeNoteModel";

const SR = 48_000;

function sine(freq: number, length: number, sr = SR, amplitude = 0.5): Float32Array {
  const x = new Float32Array(length);
  for (let i = 0; i < length; i++) x[i] = amplitude * Math.sin((2 * Math.PI * freq * i) / sr);
  return x;
}

function rms(x: Float32Array, from = 0, to = x.length): number {
  let s = 0;
  for (let i = from; i < to; i++) s += x[i] * x[i];
  return Math.sqrt(s / Math.max(1, to - from));
}

describe("resampleAudio", () => {
  it("returns a copy at the same rate", () => {
    const x = sine(440, 1000);
    const y = resampleAudio(x, SR, SR);
    expect(y).toEqual(x);
    expect(y).not.toBe(x);
  });

  it("keeps a tone below the new Nyquist and its length ratio", () => {
    const x = sine(440, SR);
    const y = resampleAudio(x, SR, 22_050);
    expect(y.length).toBe(22_050);
    const ideal = sine(440, 22_050, 22_050);
    let err = 0;
    for (let i = 500; i < 21_500; i++) err = Math.max(err, Math.abs(y[i] - ideal[i]));
    expect(err).toBeLessThan(2e-3);
  });

  it("removes a tone above the new Nyquist instead of folding it", () => {
    const y = resampleAudio(sine(15_000, SR), SR, 22_050);
    expect(rms(y, 500, 21_500)).toBeLessThan(5e-3);
  });

  it("keeps a constant constant, up to the ends", () => {
    const y = resampleAudio(new Float32Array(5000).fill(0.25), 44_100, 22_050);
    for (const v of y) expect(v).toBeCloseTo(0.25, 6);
  });

  it("upsamples too", () => {
    const y = resampleAudio(sine(440, 22_050, 22_050), 22_050, SR);
    expect(y.length).toBe(SR);
    expect(rms(y, 1000, SR - 1000)).toBeCloseTo(0.5 / Math.SQRT2, 3);
  });

  it("rejects invalid rates", () => {
    expect(() => new StreamResampler(0, 22_050)).toThrow(/invalid sample rates/);
    expect(() => resampleAudio(new Float32Array(4), SR, Number.NaN)).toThrow();
  });
});

describe("StreamResampler", () => {
  it("produces exactly the offline samples, block by block", () => {
    const x = sine(1234, 30_000);
    const offline = resampleAudio(x, SR, 22_050);
    const r = new StreamResampler(SR, 22_050);
    expect(r.delaySamples).toBeGreaterThan(0);
    const parts: Float32Array[] = [];
    let i = 0;
    let size = 1;
    while (i < x.length) {
      parts.push(r.push(x.subarray(i, i + size)));
      i += size;
      size = (size * 7 + 3) % 3000; // irregular blocks, some empty
    }
    parts.push(r.flush());
    const joined = new Float32Array(parts.reduce((n, p) => n + p.length, 0));
    let o = 0;
    for (const p of parts) {
      joined.set(p, o);
      o += p.length;
    }
    expect(joined).toEqual(offline);
  });

  it("passes samples through at the same rate, and resets", () => {
    const r = new StreamResampler(22_050, 22_050);
    expect(r.delaySamples).toBe(0);
    expect(r.push([1, 2, 3])).toEqual(new Float32Array([1, 2, 3]));
    expect(r.flush().length).toBe(0);
    const d = new StreamResampler(SR, 22_050);
    const first = d.push(sine(440, 4000));
    d.reset();
    expect(d.push(sine(440, 4000))).toEqual(first);
  });
});

describe("transcribeNotes", () => {
  it("stitches windows so that frame n is centred on sample n × 256", async () => {
    const length = 100_000; // 3 windows at 22050 Hz
    const x = new Float32Array(length);
    for (let i = 0; i < length; i++) x[i] = (i + 1) / length;
    const model = fakeNoteModel(
      (s) => Float32Array.from({ length: 88 }, () => s),
      (s) => Float32Array.from({ length: 88 }, () => -s),
    );
    const out = await transcribeNotes(x, 22_050, model);
    const frames = Math.floor(length / 256) + 1;
    expect(out.fps).toBeCloseTo(BASIC_PITCH_FPS, 9);
    expect(out.notes.length).toBe(frames);
    expect(out.onsets.length).toBe(frames);
    expect(model.calls.length).toBe(Math.ceil(frames / 142));
    for (let f = 0; f < frames; f++) {
      const expected = f * 256 < length ? x[f * 256] : 0;
      expect(out.notes[f][0]).toBe(expected);
      expect(out.onsets[f][87]).toBe(-expected);
    }
  });

  it("resamples first and runs one window on a short clip", async () => {
    const model = fakeNoteModel(() => keyRow([60]));
    const out = await transcribeNotes(sine(440, 4800), SR, model);
    expect(model.calls.length).toBe(1);
    expect(model.calls[0].length).toBe(BASIC_PITCH.windowSamples);
    expect(out.notes.length).toBe(Math.floor(2205 / 256) + 1);
    expect(out.notes[0][60 - 21]).toBeCloseTo(0.9, 6);
  });

  it("rejects a model output of the wrong shape", async () => {
    const bad = { run: () => Promise.resolve({ notes: [new Float32Array(88)], onsets: [] }) };
    await expect(transcribeNotes(new Float32Array(10), 22_050, bad)).rejects.toThrow(
      /expected 172 notes frames/,
    );
  });
});

describe("checkNoteModelOutput", () => {
  const rows = (n: number, w: number) => Array.from({ length: n }, () => new Float32Array(w));
  it("accepts 172 × 88 and rejects anything else", () => {
    expect(() =>
      checkNoteModelOutput({ notes: rows(172, 88), onsets: rows(172, 88) }),
    ).not.toThrow();
    expect(() => checkNoteModelOutput({ notes: rows(172, 87), onsets: rows(172, 88) })).toThrow(
      /88 notes per frame/,
    );
    expect(() => checkNoteModelOutput({ notes: rows(172, 88), onsets: rows(171, 88) })).toThrow(
      /172 onsets frames/,
    );
  });
  it("puts the look-ahead at 15 frames", () => {
    expect(BASIC_PITCH_LOOKAHEAD_SECONDS).toBeCloseTo((15 * 256) / 22_050, 12);
  });
});

describe("noteChroma", () => {
  it("averages frames and splits treble from bass", () => {
    const c = noteChroma([keyRow([40, 60, 64, 67], 1), keyRow([40, 60, 64, 67], 0.5)]);
    expect(c.peak).toBeCloseTo(0.75, 6);
    expect(c.notes).toEqual([40, 60, 64, 67]);
    expect(c.treble[0]).toBeCloseTo(1 / 3, 6);
    expect(c.treble[4]).toBeCloseTo(1 / 3, 6); // E4 only: E2 is below the treble range
    expect(c.bass[4]).toBeCloseTo(0.75, 6);
    expect(c.bass[0]).toBe(0);
  });

  it("is all zeros without frames and honours its options", () => {
    const empty = noteChroma([]);
    expect(empty.peak).toBe(0);
    expect(empty.notes).toEqual([]);
    expect([...empty.treble].every((v) => v === 0)).toBe(true);
    const c = noteChroma([keyRow([36, 60], 0.2)], {
      noteThreshold: 0.1,
      trebleMinMidi: 30,
      bassRange: [30, 40],
    });
    expect(c.notes).toEqual([36, 60]);
    expect(c.treble[0]).toBeCloseTo(1, 6);
    expect(c.bass[0]).toBeCloseTo(0.2, 6);
  });
});

describe("NoteChordDecoder", () => {
  const decide = (midis: number[], options = {}, repeat = 5) => {
    const d = new NoteChordDecoder(options);
    let last = d.push(noteChroma([keyRow(midis)]));
    for (let i = 1; i < repeat; i++) last = d.push(noteChroma([keyRow(midis)]));
    return last;
  };

  it("names major and minor triads", () => {
    expect(decide([48, 60, 64, 67]).chord?.name).toBe("C");
    expect(decide([45, 57, 60, 64]).chord?.name).toBe("Am");
    const r = decide([50, 62, 66, 69]);
    expect(r.chord?.name).toBe("D");
    expect(r.chords.length).toBe(24);
    expect(r.chords[0].similarity).toBeGreaterThan(0.9); // D3 is in both chromas
    const total = r.chords.reduce((s, c) => s + c.probability, 0) + r.noChord;
    expect(total).toBeCloseTo(1, 9);
  });

  it("says no chord on silence", () => {
    const r = decide([]);
    expect(r.chord).toBeNull();
    expect(r.noChord).toBeGreaterThan(0.99);
    expect(decide([60, 64, 67], { noteThreshold: 0.95 }).chord).toBeNull();
  });

  it("lets the bass pick between two readings of E + G", () => {
    // E and G alone fit C and Em equally; an E2 in the bass decides.
    expect(decide([40, 64, 67], { lambdaBass: 0 }).chord?.name).toBe("C");
    expect(decide([40, 64, 67]).chord?.name).toBe("Em");
  });

  it("holds a chord through one stray frame, switches after a few, and resets", () => {
    const d = new NoteChordDecoder();
    const c = noteChroma([keyRow([48, 60, 64, 67])]);
    const f = noteChroma([keyRow([53, 65, 69, 72])]);
    // A stray frame where F rings over the C chord.
    const stray = noteChroma([keyRow([48, 60, 64, 67]), keyRow([53, 65, 69, 72])]);
    for (let i = 0; i < 20; i++) d.push(c);
    expect(d.push(stray).chord?.name).toBe("C");
    let name: string | undefined;
    for (let i = 0; i < 5; i++) name = d.push(f).chord?.name;
    expect(name).toBe("F");
    d.reset();
    expect(d.push(c).chord?.name).toBe("C");
  });
});

describe("NoteModelChords", () => {
  /** Push `seconds` of a constant at 48 kHz, running the model every 250 ms. */
  async function play(
    engine: NoteModelChords,
    model: ReturnType<typeof fakeNoteModel>,
    value: number,
    seconds: number,
    results: NoteChordResult[],
  ) {
    const tick = SR / 4;
    for (let t = 0; t < seconds * 4; t++) {
      engine.push(new Float32Array(tick).fill(value));
      const r = await engine.analyse(model);
      if (r) results.push(r);
    }
  }

  it("follows the audio with the 174 ms look-ahead, one step per 0.1 s", async () => {
    const engine = new NoteModelChords({ sampleRate: SR });
    const model = fakeNoteModel(C_OR_AM);
    const results: NoteChordResult[] = [];
    await play(engine, model, 0, 1, results);
    expect(results.length).toBeGreaterThan(0);
    expect(results.every((r) => r.chord === null)).toBe(true);
    await play(engine, model, 0.5, 2, results);
    await play(engine, model, -0.5, 2, results);

    const last = results.at(-1)!;
    expect(last.chord?.name).toBe("Am");
    expect(last.notes).toEqual([45, 57, 60, 64]);
    expect(last.streamTime).toBeCloseTo(5, 2); // minus the resampler delay
    expect(last.streamTime - last.time).toBeGreaterThanOrEqual(BASIC_PITCH_LOOKAHEAD_SECONDS);
    expect(last.streamTime - last.time).toBeLessThan(BASIC_PITCH_LOOKAHEAD_SECONDS + 0.11);
    expect(engine.receivedSeconds).toBeCloseTo(5, 2);

    // The chord appears within ~0.5 s of the audio, on the stream clock.
    const firstC = results.find((r) => r.chord?.name === "C")!;
    expect(firstC.time).toBeGreaterThanOrEqual(1);
    expect(firstC.time).toBeLessThan(1.5);
    const firstAm = results.find((r) => r.chord?.name === "Am")!;
    expect(firstAm.time).toBeGreaterThanOrEqual(3);
    expect(firstAm.time).toBeLessThan(3.6);
    // Every window is the latest 2 s at 22050 Hz.
    expect(model.calls.every((w) => w.length === BASIC_PITCH.windowSamples)).toBe(true);
  });

  it("decodes every step once when called every 250 ms", async () => {
    const engine = new NoteModelChords({ sampleRate: SR });
    const model = fakeNoteModel(C_OR_AM);
    const times: number[] = [];
    const tick = SR / 4;
    let seen = -1;
    for (let t = 0; t < 16; t++) {
      engine.push(new Float32Array(tick).fill(0.5));
      const r = await engine.analyse(model);
      if (r && r.time !== seen) {
        times.push(r.time);
        seen = r.time;
      }
    }
    // Consecutive results are 0.2–0.3 s apart (2–3 steps per call), never more.
    for (let i = 1; i < times.length; i++) {
      expect(times[i] - times[i - 1]).toBeLessThanOrEqual(0.3 + 1e-9);
    }
  });

  it("skips no-new-audio calls and the steps a long gap left behind", async () => {
    const engine = new NoteModelChords({ sampleRate: SR });
    const model = fakeNoteModel(C_OR_AM);
    expect(engine.nextWindow()).toBeNull();
    expect(await engine.analyse(model)).toBeNull();
    expect(engine.latest).toBeNull();

    engine.push(new Float32Array(5 * SR).fill(0.5)); // longer than the ring
    const r = await engine.analyse(model);
    expect(model.calls.length).toBe(1);
    expect(r?.chord?.name).toBe("C");
    expect(r?.time).toBeGreaterThan(4);
    const again = await engine.analyse(model);
    expect(model.calls.length).toBe(1);
    expect(again).toBe(r);

    engine.reset();
    expect(engine.latest).toBeNull();
    expect(engine.receivedSeconds).toBe(0);
  });

  it("returns the previous result while no step is reliable yet", async () => {
    const engine = new NoteModelChords({ sampleRate: SR });
    const model = fakeNoteModel(C_OR_AM);
    engine.push(new Float32Array(SR).fill(0.5));
    const r = await engine.analyse(model);
    engine.push(new Float32Array(10).fill(0.5));
    expect(await engine.analyse(model)).toBe(r);
  });
});
