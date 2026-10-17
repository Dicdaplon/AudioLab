/**
 * The detection cases of the useWolfJumper tests (@audiolab/react), replayed
 * frame by frame on the pure detector and the game reducer.
 */
import { describe, expect, it } from "vitest";

import type { ChordQuality, ChordScore } from "../../src/analysis/chordDetection";
import {
  INITIAL_WOLF_DETECTOR_STATE,
  WOLF_DETECTOR_DEFAULTS,
  WolfJumperDetector,
  aliveBonusChords,
  createInitialState,
  gameReducer,
  stepWolfDetector,
  type GameAction,
  type GameState,
  type WolfDetectorConfig,
  type WolfDetectorFrame,
  type WolfJumperConfig,
} from "../../src/games";

function chroma(pc: number, energy = 0.8): Float32Array {
  const c = new Float32Array(12).fill(0.02);
  c[pc] = energy;
  return c;
}

const top = (root: number, quality: ChordQuality, probability = 0.6): ChordScore[] => [
  { root, quality, name: "", similarity: 0.9, probability },
];

function setup(config: Partial<WolfDetectorConfig> = {}, game: Partial<WolfJumperConfig> = {}) {
  const detector = new WolfJumperDetector(config);
  let state: GameState = createInitialState(1, game);
  let frame: WolfDetectorFrame = {
    instantaneousChroma: new Float32Array(12),
    chords: [],
    signalLevelDb: -30,
  };
  const dispatch = (action: GameAction) => (state = gameReducer(state, action));
  const push = (patch: Partial<WolfDetectorFrame>, withTargets = false) => {
    frame = { ...frame, ...patch };
    const actions = detector.push(
      frame,
      state.config.notePool,
      withTargets ? aliveBonusChords(state) : undefined,
    );
    actions.forEach(dispatch);
    return actions;
  };
  return { detector, dispatch, push, state: () => state };
}

describe("WolfJumperDetector", () => {
  it("kills enemies of a note held for two frames", () => {
    const { detector, dispatch, push, state } = setup();
    dispatch({ type: "spawnEnemy", pc: 0 });
    expect(push({ instantaneousChroma: chroma(0) })).toEqual([]);
    expect(push({ instantaneousChroma: chroma(0) })).toEqual([{ type: "noteDetected", pc: 0 }]);
    expect(state().score).toBe(1);
    expect(detector.note?.pc).toBe(0);
  });

  it("ignores notes while the noise gate is closed", () => {
    const { detector, dispatch, push, state } = setup();
    dispatch({ type: "spawnEnemy", pc: 0 });
    for (let i = 0; i < 4; i++) push({ instantaneousChroma: chroma(0), signalLevelDb: -80 });
    expect(detector.gateOpen).toBe(false);
    expect(state().score).toBe(0);

    detector.configure({ noiseGateDb: -90 });
    push({ instantaneousChroma: chroma(0) });
    push({ instantaneousChroma: chroma(0) });
    expect(state().score).toBe(1);
  });

  it("adaptive gate: learns the room, then lets notes through without a threshold", () => {
    const { detector, dispatch, push, state } = setup({ gate: "adaptive" });
    expect(detector.gate).toBeNull(); // nothing pushed yet
    // 6 s of room noise at −70 dB: the floor is learnt, the gate closes.
    for (let i = 0; i < 60; i++) {
      push({ instantaneousChroma: chroma(5, 0.3), signalLevelDb: -70 + (i % 2) });
    }
    expect(detector.gateOpen).toBe(false);
    expect(detector.gate?.floorDb).toBeCloseTo(-70, 0);
    dispatch({ type: "spawnEnemy", pc: 0 });
    // A note 10 dB above the room (−60 dB, which the fixed −60 gate would cut).
    push({ instantaneousChroma: chroma(0), signalLevelDb: -60 });
    push({ instantaneousChroma: chroma(0), signalLevelDb: -60 });
    expect(detector.gateOpen).toBe(true);
    expect(state().score).toBe(1);
    expect(setup().detector.gate).toBeNull();
  });

  it("adaptive gate: a clear pitch opens it even when quiet", () => {
    const { detector, push } = setup({ gate: "adaptive", noteSource: "pitch" });
    for (let i = 0; i < 60; i++) push({ instantaneousChroma: chroma(5, 0.3), signalLevelDb: -70 });
    expect(detector.gateOpen).toBe(false);
    push({
      instantaneousChroma: chroma(0),
      signalLevelDb: -68,
      pitch: { frequency: 261.6, midi: 60, pitchClass: 0, cents: 0, clarity: 0.97 },
    });
    expect(detector.gateOpen).toBe(true);
  });

  it("collects a bonus when its chord is held for three frames", () => {
    const { dispatch, push, state } = setup();
    dispatch({ type: "spawnBonus", bonusType: "shield", chord: { root: 7, quality: "maj" } });
    push({ chords: top(7, "maj") });
    push({ chords: top(7, "maj") });
    expect(state().bonuses[0].status).toBe("alive");
    push({ chords: top(7, "maj") });
    expect(state().bonuses[0].status).toBe("collected");
  });

  it("ignores notes outside a restricted note pool and applies detection settings", () => {
    const { dispatch, push, state } = setup(
      { noteConfirmations: 3 },
      { notePool: [9, 0, 2, 4, 7], maxHp: 2 },
    );
    dispatch({ type: "spawnEnemy", pc: 11 });
    dispatch({ type: "spawnEnemy", pc: 0 });
    for (let i = 0; i < 4; i++) push({ instantaneousChroma: chroma(11) });
    expect(state().score).toBe(0);
    // One frame for the 3-frame smoothing to flip to C, then three confirmations.
    for (let i = 0; i < 3; i++) push({ instantaneousChroma: chroma(0) });
    expect(state().score).toBe(0);
    push({ instantaneousChroma: chroma(0) });
    expect(state().score).toBe(1);
  });

  it("does not count a frame twice", () => {
    const { push } = setup();
    const c = chroma(0);
    push({ instantaneousChroma: c });
    expect(push({ instantaneousChroma: c })).toEqual([]);
    expect(push({ instantaneousChroma: chroma(0) })).toHaveLength(1);
  });

  it("lets a triad collect a seventh bonus under the triad policy", () => {
    const E7 = { root: 4, quality: "dom7" } as const;
    const exact = setup();
    exact.dispatch({ type: "spawnBonus", bonusType: "hp", chord: E7 });
    for (let i = 0; i < 3; i++) exact.push({ chords: top(4, "maj") }, true);
    expect(exact.state().bonuses[0].status).toBe("alive");

    const triad = setup({ chordAccept: "triad" });
    triad.dispatch({ type: "spawnBonus", bonusType: "hp", chord: E7 });
    // E and E7 alternating keep one run going.
    triad.push({ chords: top(4, "maj") }, true);
    triad.push({ chords: top(4, "dom7") }, true);
    const actions = triad.push({ chords: top(4, "maj") }, true);
    expect(actions).toEqual([{ type: "chordDetected", chord: E7 }]);
    expect(triad.state().bonuses[0].status).toBe("collected");
  });

  it("reads the note from a pitch estimate with noteSource pitch", () => {
    const { dispatch, push, state } = setup({ noteSource: "pitch" });
    dispatch({ type: "spawnEnemy", pc: 9 });
    const pitch = (clarity: number) => ({
      frequency: 220,
      midi: 57,
      pitchClass: 9,
      cents: 0,
      clarity,
    });
    // The chroma says E (a strong 3rd harmonic); the pitch says A.
    push({ instantaneousChroma: chroma(4), pitch: pitch(0.95) });
    push({ instantaneousChroma: chroma(4), pitch: pitch(0.5) });
    expect(state().score).toBe(0);
    push({ instantaneousChroma: chroma(4), pitch: pitch(0.95) });
    push({ instantaneousChroma: chroma(4), pitch: pitch(0.95) });
    expect(state().score).toBe(1);
  });

  it("reset forgets the history and the runs", () => {
    const { detector, push } = setup();
    push({ instantaneousChroma: chroma(0) });
    detector.reset();
    expect(detector.note).toBeNull();
    expect(push({ instantaneousChroma: chroma(0) })).toEqual([]);
  });

  it("the class and the pure step agree", () => {
    const frames: WolfDetectorFrame[] = [0, 0, 4, 4, 4, 7, 7, 7].map((pc, i) => ({
      instantaneousChroma: chroma(pc),
      chords: top(pc, "maj", 0.5),
      signalLevelDb: i === 2 ? -90 : -30,
    }));
    const detector = new WolfJumperDetector();
    let state = INITIAL_WOLF_DETECTOR_STATE;
    let total = 0;
    for (const f of frames) {
      const step = stepWolfDetector(state, f, [0, 4, 7], undefined, WOLF_DETECTOR_DEFAULTS);
      state = step.state;
      total += step.actions.length;
      expect(detector.push(f, [0, 4, 7])).toEqual(step.actions);
    }
    expect(total).toBeGreaterThan(0);
  });
});
