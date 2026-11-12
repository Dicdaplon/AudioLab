/**
 * The mascot's rules: poses (jump, tumble, howl, sleep, dance), and the
 * rationing of its phrases (warm-up, global gap, per-kind cooldown,
 * priorities, no repeats). Also the sensor that builds its snapshots.
 */
import { describe, expect, it } from "vitest";

import {
  WOLF_PHRASES,
  WolfBrain,
  WolfSensor,
  type WolfBrainOptions,
  type WolfPhraseKind,
  type WolfSnapshot,
} from "../../src/stage/wolf";
import type { StageSignals } from "../../src/stage";

function snap(over: Partial<WolfSnapshot> = {}): WolfSnapshot {
  return {
    playing: true,
    level: 0.5,
    silenceSeconds: 0,
    attacks: [],
    onsetRate: 0,
    keyEvent: null,
    keyName: null,
    recentInKey: 0,
    recentOutOfKey: 0,
    inKeyStreak: 0,
    note: null,
    tempoConfidence: 0,
    ...over,
  };
}

function brain(options: WolfBrainOptions = {}): WolfBrain {
  return new WolfBrain({ warmupSeconds: 0, random: () => 0, ...options });
}

/** Steps every 0.2 s from `from` to `to`, returning the phrases said. */
function run(
  b: WolfBrain,
  from: number,
  to: number,
  make: (t: number) => WolfSnapshot,
): { kind: WolfPhraseKind; text: string; at: number }[] {
  const said = [];
  for (let i = 0; from + i * 0.2 < to - 1e-9; i++) {
    const t = from + i * 0.2;
    const m = b.step(make(t), t);
    if (m.phrase) said.push(m.phrase);
  }
  return said;
}

describe("WOLF_PHRASES", () => {
  it("has short lines for every kind", () => {
    const lines = Object.values(WOLF_PHRASES).flat();
    expect(lines.length).toBeGreaterThanOrEqual(20);
    for (const line of lines)
      expect(line.replace("{key}", "C♯ minor").length).toBeLessThanOrEqual(22);
    expect(lines).toContain("Too strong!");
    expect(lines).toContain("Mhhh, you sure?");
  });
});

describe("WolfBrain poses", () => {
  it("jumps on a big attack, at most every 1.5 s, then sits back", () => {
    const b = brain();
    expect(b.step(snap({ attacks: [0.95] }), 0).pose).toBe("jump");
    expect(b.step(snap(), 0.2).pose).toBe("jump");
    expect(b.step(snap(), 0.6).pose).toBe("listen");
    expect(b.step(snap({ attacks: [1] }), 1).pose).toBe("listen");
    expect(b.step(snap({ attacks: [1] }), 1.6).pose).toBe("jump");
    expect(b.step(snap({ attacks: [0.5] }), 4).pose).toBe("listen");
  });

  it("tumbles on a record attack when very loud, rarely, and says it is too loud", () => {
    const b = brain();
    const m = b.step(snap({ attacks: [1], level: 0.95 }), 0);
    expect(m.pose).toBe("tumble");
    expect(m.phrase?.kind).toBe("loud");
    expect(b.step(snap(), 0.8).pose).toBe("listen");
    expect(b.step(snap({ attacks: [1], level: 0.95 }), 5).pose).toBe("jump");
  });

  it("falls asleep after 20 s of silence, and wakes up when the music returns", () => {
    const b = brain({ minGapSeconds: 1, kindCooldownSeconds: 1 });
    const said = run(b, 0, 25, (t) => snap({ playing: false, level: 0, silenceSeconds: t }));
    expect(said.map((p) => p.kind)).toEqual(["silence", "sleep"]);
    expect(said[1].at).toBeCloseTo(20);
    expect(b.step(snap({ playing: false, silenceSeconds: 25 }), 25).pose).toBe("sleep");
    const back = b.step(snap(), 30);
    expect(back.pose).toBe("listen");
    expect(back.phrase?.kind).toBe("wake");
  });

  it("howls and names the key when it settles", () => {
    const b = brain();
    const m = b.step(snap({ keyEvent: "settled", keyName: "A minor" }), 0);
    expect(m.pose).toBe("howl");
    expect(m.phrase).toMatchObject({ kind: "key", text: "A minor, classy." });
    expect(b.step(snap(), 1.7).pose).toBe("listen");
  });

  it("dances on a steady beat", () => {
    const b = brain({ minGapSeconds: 1000 });
    let pose = "";
    for (let t = 0; t <= 5; t += 0.2)
      pose = b.step(snap({ tempoConfidence: 0.8, onsetRate: 2 }), t).pose;
    expect(pose).toBe("dance");
  });
});

describe("WolfBrain phrases", () => {
  it("stays quiet during the warm-up", () => {
    const b = new WolfBrain({ random: () => 0 });
    expect(b.step(snap({ recentOutOfKey: 4 }), 0).phrase).toBeNull();
    expect(b.step(snap({ recentOutOfKey: 4 }), 6.2).phrase?.kind).toBe("outOfKey");
  });

  it("comments on out-of-key notes", () => {
    const b = brain();
    expect(b.step(snap({ recentOutOfKey: 2, recentInKey: 8 }), 0).phrase).toBeNull();
    expect(b.step(snap({ recentOutOfKey: 3, recentInKey: 7 }), 0.2).phrase).toMatchObject({
      kind: "outOfKey",
      text: "Mhhh, you sure?",
    });
  });

  it("prefers too loud over out of key over compliments", () => {
    const b = brain();
    const m = b.step(snap({ attacks: [1], level: 0.95, recentOutOfKey: 5, inKeyStreak: 12 }), 0);
    expect(m.phrase?.kind).toBe("loud");
    const later = run(b, 0.2, 60, () => snap({ recentOutOfKey: 5, inKeyStreak: 12 }));
    expect(later.map((p) => p.kind)).toEqual(["outOfKey", "inKey"]);
  });

  it("keeps the global gap, a bubble of 3.5 s and the per-kind cooldown", () => {
    const b = brain({ minGapSeconds: 25, kindCooldownSeconds: 90 });
    const said = run(b, 0, 200, () => snap({ recentOutOfKey: 5 }));
    expect(said.map((p) => p.at)).toEqual([0, 90, 180].map((x) => expect.closeTo(x, 0)));
    const b2 = brain();
    b2.step(snap({ recentOutOfKey: 5 }), 0);
    expect(b2.step(snap(), 3.4).bubble?.kind).toBe("outOfKey");
    expect(b2.step(snap(), 3.6).bubble).toBeNull();
    // Different kinds: 25 s apart at least.
    const b3 = brain();
    const mix = run(b3, 0, 60, (t) =>
      snap({ recentOutOfKey: t < 1 ? 5 : 0, inKeyStreak: t >= 1 ? 12 : 0 }),
    );
    expect(mix.map((p) => p.kind)).toEqual(["outOfKey", "inKey"]);
    expect(mix[1].at - mix[0].at).toBeGreaterThanOrEqual(25 - 1e-9);
  });

  it("never says the same line twice in a row", () => {
    const b = brain({ minGapSeconds: 4, kindCooldownSeconds: 0, random: () => 0 });
    const said = run(b, 0, 40, () => snap({ recentOutOfKey: 5 }));
    expect(said.length).toBeGreaterThanOrEqual(5);
    for (let i = 1; i < said.length; i++) expect(said[i].text).not.toBe(said[i - 1].text);
  });

  it("uses override phrases and skips kinds without lines", () => {
    const b = brain({ phrases: { outOfKey: ["Hmm?"] } });
    expect(b.step(snap({ recentOutOfKey: 5, inKeyStreak: 0 }), 0).phrase?.text).toBe("Hmm?");
    const c = brain({ phrases: { inKey: [] } });
    expect(c.step(snap({ inKeyStreak: 20 }), 0).phrase).toBeNull();
  });

  it("comments once per note on a bend or a vibrato", () => {
    const b = brain({ minGapSeconds: 0, kindCooldownSeconds: 0, bubbleSeconds: 0 });
    const note = { id: 1, vibrato: false, bendCents: 150, inTuneSeconds: 0 };
    expect(b.step(snap({ note }), 0).phrase?.kind).toBe("bend");
    expect(b.step(snap({ note }), 1).phrase).toBeNull();
    expect(
      b.step(snap({ note: { ...note, id: 2, bendCents: 0, vibrato: true } }), 2).phrase?.kind,
    ).toBe("vibrato");
  });
});

describe("WolfSensor", () => {
  function signals(): StageSignals {
    const open = { open: true, level: 0.7, floorDb: -90, ceilingDb: -60, gatedDb: -65 };
    const seg = (midi: number, start: number) => ({
      midi,
      cents: 2,
      start,
      end: start + 0.3,
      open: false,
      vibrato: { active: false, rateHz: 0, extentCents: 0 },
      bend: null,
    });
    return {
      levelDb: -65,
      harmonyLevel: open,
      notesLevel: open,
      key: {
        phase: "settled",
        key: { tonic: 9, mode: "min" },
        runnerUp: null,
        stability: 1,
        event: null,
      },
      chord: {
        current: null,
        runnerUp: null,
        margin: 0,
        silent: true,
        changed: false,
        history: [],
      },
      chordChangedAt: null,
      keyEventAt: null,
      note: null,
      // A minor: A C E in, then C♯ D♯ F♯ out.
      notes: [seg(69, 0), seg(72, 0.4), seg(76, 0.8), seg(73, 1.2), seg(75, 1.6), seg(78, 2.0)],
      chroma: {
        instant: new Float32Array(12),
        chord: new Float32Array(12),
        live: new Float32Array(12),
      },
      tempo: { bpm: 96, confidence: 0.7 },
      beatAt: () => null,
      onsets: [],
      onsetCount: 0,
      harmonyTap: null,
      notesTap: null,
    };
  }

  it("counts in- and out-of-key notes, attacks and key events", () => {
    const s = signals();
    const sensor = new WolfSensor();
    let r = sensor.read(s, 2.4);
    expect(r).toMatchObject({
      recentInKey: 3,
      recentOutOfKey: 3,
      inKeyStreak: 0,
      keyName: "A minor",
    });
    expect(r.attacks).toEqual([]);
    s.onsets.push(
      { time: 2.5, strength: 2, pitchClass: null },
      { time: 2.6, strength: 4, pitchClass: null },
    );
    s.onsetCount = 2;
    s.keyEventAt = 2.5;
    r = sensor.read(s, 2.7);
    expect(r.attacks).toEqual([0.5, 1]);
    expect(r.keyEvent).toBe("settled");
    expect(r.onsetRate).toBeCloseTo(0.5);
    expect(sensor.read(s, 2.9).keyEvent).toBeNull();
    s.key = { ...s.key, key: { tonic: 4, mode: "min" } };
    s.keyEventAt = 3;
    expect(sensor.read(s, 3.1)).toMatchObject({ keyEvent: "modulated", keyName: "E minor" });
  });

  it("measures the silence", () => {
    const s = signals();
    const closed = { ...s.harmonyLevel, open: false };
    s.harmonyLevel = closed;
    s.notesLevel = closed;
    const sensor = new WolfSensor();
    expect(sensor.read(s, 10).silenceSeconds).toBe(0);
    expect(sensor.read(s, 14).silenceSeconds).toBe(4);
    expect(sensor.read(s, 14).playing).toBe(false);
  });
});
