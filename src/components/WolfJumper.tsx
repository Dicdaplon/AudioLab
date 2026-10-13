/**
 * Wolf Jumper — endless-runner game with notes (enemies) + chord bonuses.
 *
 * Gameplay:
 *   - Notes (small coloured discs) fly in from the right. Play the matching
 *     pitch class to kill ALL alive enemies of that note at once (satisfying
 *     chain kills, especially with the "Same-note × 5" bonus).
 *   - Bonuses (golden boxes labelled with a chord) appear occasionally. Play
 *     the chord to collect them. Effects:
 *       ❤+2     restore 2 HP
 *       🛡 7 s  shield — incoming enemies are killed instead of damaging
 *       🐢 7 s  slow — enemies move at half speed
 *       🎯×5    next 5 enemy spawns share the same note
 *   - Score, streak and best streak are tracked. HP reaches 0 → Game Over.
 *
 * Detection:
 *   - NOTES: argmax of the LAST 3 instantaneous chromas (≈ 300 ms smoothing),
 *     confirmed 2 consecutive frames → fast and snappy.
 *   - CHORDS: top-1 of the detector's 1 s chord window, confirmed 3 frames
 *     with probability ≥ MIN_CHORD_PROB → robust.
 *
 * Both pipelines are gated by the noise gate (signal-level dB threshold).
 */

import { useEffect, useMemo, useRef, useState } from "react";

import type { ChordScore } from "../analysis/chordDetection";
import { CHROMA_SIZE } from "../analysis/chroma";

// ---- Tuning ----

const INITIAL_TRAVEL_MS = 6000;
const MIN_TRAVEL_MS = 2200;
const TRAVEL_DECAY_PER_HIT_MS = 100;

const INITIAL_SPAWN_MS = 1800;
const MIN_SPAWN_MS = 700;
const SPAWN_DECAY_PER_HIT_MS = 35;

const BONUS_INTERVAL_MIN_MS = 11000;
const BONUS_INTERVAL_MAX_MS = 16000;
const BONUS_TRAVEL_MS = 7000; // bonuses move a bit slower than enemies

const NOTE_SMOOTH_FRAMES = 3; // ~300 ms smoothing on instantaneous chroma
const NOTE_CONFIRMATIONS = 2; // ~200 ms once stable
const CHORD_CONFIRMATIONS = 3;
const MIN_NOTE_ENERGY = 0.14;
const MIN_CHORD_PROB = 0.18;

const SHIELD_DURATION_MS = 7000;
const SLOW_DURATION_MS = 7000;
const SLOW_FACTOR = 0.5;
const SAME_NOTE_COUNT = 5;
const HP_BONUS_AMOUNT = 2;
const MAX_HP = 5;

const SCENE_WIDTH = 880;
const SCENE_HEIGHT = 260;
const WOLF_X = 100;
const GROUND_Y = 200;
const ENEMY_SIZE = 42;
const BONUS_SIZE = 64;

// ---- Pools ----

interface NoteDef {
  pc: number;
  name: string;
  color: string;
}

const NOTE_POOL: NoteDef[] = [
  { pc: 0, name: "C", color: "#e63946" },
  { pc: 2, name: "D", color: "#f4a261" },
  { pc: 4, name: "E", color: "#e9c46a" },
  { pc: 5, name: "F", color: "#3da26e" },
  { pc: 7, name: "G", color: "#4cc9f0" },
  { pc: 9, name: "A", color: "#8338ec" },
  { pc: 11, name: "B", color: "#ff6fb5" },
];

const BONUS_CHORDS = ["C", "G", "D", "F", "Am", "Em", "Dm"];

type BonusType = "hp" | "shield" | "slow" | "samenote";

interface BonusTypeDef {
  id: BonusType;
  icon: string;
  short: string;
  color: string;
  label: string;
}

const BONUS_TYPES: BonusTypeDef[] = [
  { id: "hp", icon: "❤", short: "+2", color: "#ff5050", label: "+2 HP" },
  { id: "shield", icon: "🛡", short: "7s", color: "#4cc9f0", label: "Bouclier 7 s" },
  { id: "slow", icon: "🐢", short: "7s", color: "#8338ec", label: "Slow 7 s" },
  { id: "samenote", icon: "🎯", short: "×5", color: "#ffd60a", label: "Même note ×5" },
];

// ---- Data ----

interface Enemy {
  id: number;
  pc: number;
  name: string;
  color: string;
  spawnAt: number; // ms
  progress: number; // 0..1+ — 1 = at wolf
  baseSpeed: number; // progress per second (excluding slow factor)
  laneY: number; // visual y offset from ground
  state: "alive" | "killed" | "reached";
  endedAt?: number; // for fade animation
}

interface Bonus {
  id: number;
  type: BonusType;
  chordName: string;
  spawnAt: number;
  progress: number;
  baseSpeed: number;
  laneY: number;
  state: "alive" | "collected" | "expired";
  endedAt?: number;
}

interface ActiveEffects {
  shieldUntil: number;
  slowUntil: number;
  sameNoteRemaining: number;
  sameNotePc: number | null;
}

// ---- Utilities ----

function argmax(arr: ArrayLike<number>): { idx: number; value: number } {
  let idx = -1;
  let value = -Infinity;
  for (let i = 0; i < arr.length; i++) {
    if (arr[i] > value) {
      value = arr[i];
      idx = i;
    }
  }
  return { idx, value };
}

function clamp(x: number, lo: number, hi: number): number {
  return x < lo ? lo : x > hi ? hi : x;
}

function computeTravelMs(score: number): number {
  return Math.max(MIN_TRAVEL_MS, INITIAL_TRAVEL_MS - score * TRAVEL_DECAY_PER_HIT_MS);
}

function computeSpawnMs(score: number): number {
  return Math.max(MIN_SPAWN_MS, INITIAL_SPAWN_MS - score * SPAWN_DECAY_PER_HIT_MS);
}

function pickRandom<T>(arr: readonly T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function findNoteDef(pc: number): NoteDef | undefined {
  return NOTE_POOL.find((n) => n.pc === pc);
}

// ---- Component ----

interface WolfJumperProps {
  /** Instantaneous chroma (per-frame, ~100 ms). */
  instantaneousChroma: Float32Array;
  /** Ranked chord scores (1 s window). */
  chords: ChordScore[];
  /** Mic running. */
  running: boolean;
  /** Average dB signal level in music band. */
  signalLevelDb: number;
  /** Start mic callback. */
  onStart?: () => void;
}

export function WolfJumper({
  instantaneousChroma,
  chords,
  running,
  signalLevelDb,
  onStart,
}: WolfJumperProps) {
  // --- Game state ---
  const [enemies, setEnemies] = useState<Enemy[]>([]);
  const [bonuses, setBonuses] = useState<Bonus[]>([]);
  const [effects, setEffects] = useState<ActiveEffects>({
    shieldUntil: 0,
    slowUntil: 0,
    sameNoteRemaining: 0,
    sameNotePc: null,
  });
  const [score, setScore] = useState(0);
  const [streak, setStreak] = useState(0);
  const [bestStreak, setBestStreak] = useState(0);
  const [hp, setHp] = useState(MAX_HP);
  const [gameOver, setGameOver] = useState(false);
  const [noiseGateDb, setNoiseGateDb] = useState(-60);

  // --- Refs for things accessed from RAF / timers without re-render ---
  const enemyIdRef = useRef(0);
  const bonusIdRef = useRef(0);
  const noteConfRef = useRef(0);
  const lastDetectedNoteRef = useRef(-1);
  const chordConfRef = useRef(0);
  const lastChordNameRef = useRef("");
  const scoreRef = useRef(0);
  const gameOverRef = useRef(false);
  const effectsRef = useRef(effects);
  const lastTickRef = useRef(performance.now());

  useEffect(() => {
    scoreRef.current = score;
  }, [score]);
  useEffect(() => {
    gameOverRef.current = gameOver;
  }, [gameOver]);
  useEffect(() => {
    effectsRef.current = effects;
  }, [effects]);

  // --- Smoothing buffer for snappy note detection ---
  const chromaBufferRef = useRef<Float32Array[]>([]);

  // --- Noise gate ---
  const gateOpen = signalLevelDb > noiseGateDb;
  const signalNorm = clamp((signalLevelDb + 90) / 80, 0, 1);
  const gateNorm = clamp((noiseGateDb + 90) / 80, 0, 1);

  // --- RAF loop: advance enemies/bonuses, check collisions ---
  useEffect(() => {
    let raf = 0;
    let cancelled = false;
    const loop = () => {
      if (cancelled) return;
      const now = performance.now();
      const dtSec = (now - lastTickRef.current) / 1000;
      lastTickRef.current = now;

      const speedFactor = effectsRef.current.slowUntil > now ? SLOW_FACTOR : 1;
      const shieldOn = effectsRef.current.shieldUntil > now;

      let hpLostThisTick = 0;
      let shieldKills = 0;

      setEnemies((prev) => {
        const next: Enemy[] = [];
        for (const e of prev) {
          if (e.state === "alive") {
            const np = e.progress + e.baseSpeed * dtSec * speedFactor;
            if (np >= 1) {
              if (shieldOn) {
                shieldKills += 1;
                next.push({ ...e, progress: 1, state: "killed", endedAt: now });
              } else {
                hpLostThisTick += 1;
                next.push({ ...e, progress: 1, state: "reached", endedAt: now });
              }
            } else {
              next.push({ ...e, progress: np });
            }
          } else if (e.endedAt && now - e.endedAt > 400) {
            // Drop after fade
            continue;
          } else {
            next.push(e);
          }
        }
        return next;
      });

      setBonuses((prev) => {
        const next: Bonus[] = [];
        for (const b of prev) {
          if (b.state === "alive") {
            const np = b.progress + b.baseSpeed * dtSec * speedFactor;
            if (np >= 1) {
              next.push({ ...b, progress: 1, state: "expired", endedAt: now });
            } else {
              next.push({ ...b, progress: np });
            }
          } else if (b.endedAt && now - b.endedAt > 400) {
            continue;
          } else {
            next.push(b);
          }
        }
        return next;
      });

      if (hpLostThisTick > 0) {
        setStreak(0);
        setHp((h) => {
          const nh = h - hpLostThisTick;
          if (nh <= 0) {
            setGameOver(true);
            return 0;
          }
          return nh;
        });
      }
      if (shieldKills > 0) {
        setScore((s) => s + shieldKills);
      }

      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => {
      cancelled = true;
      cancelAnimationFrame(raf);
    };
  }, []);

  // --- Spawn enemies ---
  useEffect(() => {
    if (!running || gameOver) return;
    let t = 0;
    const spawn = () => {
      if (gameOverRef.current) return;
      let note: NoteDef;
      // "Same note ×5" effect overrides random selection.
      const eff = effectsRef.current;
      if (eff.sameNoteRemaining > 0 && eff.sameNotePc !== null) {
        note = findNoteDef(eff.sameNotePc) ?? pickRandom(NOTE_POOL);
        setEffects((e) => ({
          ...e,
          sameNoteRemaining: Math.max(0, e.sameNoteRemaining - 1),
          sameNotePc: e.sameNoteRemaining - 1 > 0 ? e.sameNotePc : null,
        }));
      } else {
        note = pickRandom(NOTE_POOL);
      }

      enemyIdRef.current += 1;
      const travelMs = computeTravelMs(scoreRef.current);
      setEnemies((prev) => [
        ...prev,
        {
          id: enemyIdRef.current,
          pc: note.pc,
          name: note.name,
          color: note.color,
          spawnAt: performance.now(),
          progress: 0,
          baseSpeed: 1000 / travelMs, // 1 unit / travelMs in seconds → progress per sec
          laneY: Math.floor(Math.random() * 3) * 20 - 20, // -20, 0, +20
          state: "alive",
        },
      ]);
      const next = computeSpawnMs(scoreRef.current) * (0.85 + Math.random() * 0.3);
      t = window.setTimeout(spawn, next);
    };
    spawn();
    return () => clearTimeout(t);
  }, [running, gameOver]);

  // --- Spawn bonuses ---
  useEffect(() => {
    if (!running || gameOver) return;
    let t = 0;
    const spawn = () => {
      if (gameOverRef.current) return;
      const type = pickRandom(BONUS_TYPES);
      const chord = pickRandom(BONUS_CHORDS);
      bonusIdRef.current += 1;
      setBonuses((prev) => [
        ...prev,
        {
          id: bonusIdRef.current,
          type: type.id,
          chordName: chord,
          spawnAt: performance.now(),
          progress: 0,
          baseSpeed: 1000 / BONUS_TRAVEL_MS,
          laneY: Math.floor(Math.random() * 2) * 30 - 15, // -15 or +15
          state: "alive",
        },
      ]);
      const next =
        BONUS_INTERVAL_MIN_MS + Math.random() * (BONUS_INTERVAL_MAX_MS - BONUS_INTERVAL_MIN_MS);
      t = window.setTimeout(spawn, next);
    };
    // First bonus appears after a small delay (not at game start).
    t = window.setTimeout(spawn, 6000 + Math.random() * (BONUS_INTERVAL_MIN_MS - 6000));
    return () => clearTimeout(t);
  }, [running, gameOver]);

  // --- Note detection (fast, smoothed) ---
  useEffect(() => {
    if (!running || gameOver || instantaneousChroma.length !== CHROMA_SIZE) return;
    const buf = chromaBufferRef.current;
    buf.push(instantaneousChroma);
    if (buf.length > NOTE_SMOOTH_FRAMES) buf.shift();

    if (!gateOpen) {
      noteConfRef.current = 0;
      lastDetectedNoteRef.current = -1;
      return;
    }

    // Smooth: mean of buffered chromas.
    const smoothed = new Float32Array(CHROMA_SIZE);
    for (const c of buf) {
      for (let i = 0; i < CHROMA_SIZE; i++) smoothed[i] += c[i];
    }
    for (let i = 0; i < CHROMA_SIZE; i++) smoothed[i] /= buf.length;
    const m = argmax(smoothed);
    if (m.idx < 0 || m.value < MIN_NOTE_ENERGY) {
      noteConfRef.current = 0;
      lastDetectedNoteRef.current = -1;
      return;
    }
    // Only consider notes in our pool.
    const isInPool = NOTE_POOL.some((n) => n.pc === m.idx);
    if (!isInPool) {
      noteConfRef.current = 0;
      lastDetectedNoteRef.current = -1;
      return;
    }

    if (m.idx === lastDetectedNoteRef.current) {
      noteConfRef.current += 1;
    } else {
      noteConfRef.current = 1;
      lastDetectedNoteRef.current = m.idx;
    }

    if (noteConfRef.current >= NOTE_CONFIRMATIONS) {
      // Kill all alive enemies of this pc.
      let kills = 0;
      setEnemies((prev) => {
        const now = performance.now();
        return prev.map((e) => {
          if (e.state === "alive" && e.pc === m.idx) {
            kills += 1;
            return { ...e, state: "killed", endedAt: now };
          }
          return e;
        });
      });
      if (kills > 0) {
        setScore((s) => s + kills);
        setStreak((s) => {
          const ns = s + kills;
          setBestStreak((b) => Math.max(b, ns));
          return ns;
        });
      }
      // After successful kill burst, require a fresh confirmation cycle for
      // the next kill (else holding the note would re-kill spawning enemies
      // instantly).
      noteConfRef.current = 0;
      lastDetectedNoteRef.current = -1;
    }
  }, [instantaneousChroma, running, gameOver, gateOpen]);

  // --- Chord detection (for bonus pickup) ---
  useEffect(() => {
    if (!running || gameOver || chords.length === 0) {
      chordConfRef.current = 0;
      lastChordNameRef.current = "";
      return;
    }
    if (!gateOpen) {
      chordConfRef.current = 0;
      lastChordNameRef.current = "";
      return;
    }
    const top = chords[0];
    if (top.probability < MIN_CHORD_PROB) {
      chordConfRef.current = 0;
      lastChordNameRef.current = "";
      return;
    }

    if (top.name === lastChordNameRef.current) {
      chordConfRef.current += 1;
    } else {
      chordConfRef.current = 1;
      lastChordNameRef.current = top.name;
    }

    if (chordConfRef.current >= CHORD_CONFIRMATIONS) {
      // Try to collect all alive bonuses matching this chord.
      const collected: Bonus[] = [];
      setBonuses((prev) => {
        const now = performance.now();
        return prev.map((b) => {
          if (b.state === "alive" && b.chordName === top.name) {
            collected.push(b);
            return { ...b, state: "collected", endedAt: now };
          }
          return b;
        });
      });
      if (collected.length > 0) {
        // Apply each bonus's effect.
        for (const b of collected) applyBonusEffect(b.type);
      }
      chordConfRef.current = 0;
      lastChordNameRef.current = "";
    }
  }, [chords, running, gameOver, gateOpen]);

  function applyBonusEffect(type: BonusType): void {
    const now = performance.now();
    setEffects((e) => {
      switch (type) {
        case "hp":
          setHp((h) => Math.min(MAX_HP, h + HP_BONUS_AMOUNT));
          return e;
        case "shield":
          return { ...e, shieldUntil: Math.max(e.shieldUntil, now + SHIELD_DURATION_MS) };
        case "slow":
          return { ...e, slowUntil: Math.max(e.slowUntil, now + SLOW_DURATION_MS) };
        case "samenote": {
          const note = pickRandom(NOTE_POOL);
          return { ...e, sameNoteRemaining: SAME_NOTE_COUNT, sameNotePc: note.pc };
        }
      }
    });
  }

  function resetGame(): void {
    setEnemies([]);
    setBonuses([]);
    setEffects({ shieldUntil: 0, slowUntil: 0, sameNoteRemaining: 0, sameNotePc: null });
    setScore(0);
    setStreak(0);
    setBestStreak(0);
    setHp(MAX_HP);
    setGameOver(false);
    noteConfRef.current = 0;
    chordConfRef.current = 0;
    lastDetectedNoteRef.current = -1;
    lastChordNameRef.current = "";
    enemyIdRef.current = 0;
    bonusIdRef.current = 0;
    chromaBufferRef.current = [];
  }

  // --- Computed UI values ---
  const now = performance.now();
  const shieldRemaining = Math.max(0, effects.shieldUntil - now);
  const slowRemaining = Math.max(0, effects.slowUntil - now);
  const shieldOn = shieldRemaining > 0;
  const slowOn = slowRemaining > 0;
  const currentTravelMs = computeTravelMs(score);

  // For display: smoothed top-1 note.
  const smoothedDisplay = useMemo(() => {
    const buf = chromaBufferRef.current;
    if (buf.length === 0) return { idx: -1, value: 0 };
    const s = new Float32Array(CHROMA_SIZE);
    for (const c of buf) for (let i = 0; i < CHROMA_SIZE; i++) s[i] += c[i];
    for (let i = 0; i < CHROMA_SIZE; i++) s[i] /= buf.length;
    return argmax(s);
    // recompute on every chroma update
  }, [instantaneousChroma]);
  const detectedNoteName =
    smoothedDisplay.idx >= 0 ? (findNoteDef(smoothedDisplay.idx)?.name ?? "—") : "—";
  const topChord = chords[0]?.name ?? "—";
  const topChordProb = chords[0]?.probability ?? 0;

  return (
    <div className="jumper">
      <div className="jumper-topbar">
        <div className="jumper-stats">
          <div>
            <span className="jumper-stat-label">Score</span>
            <span className="jumper-stat-value">{score}</span>
          </div>
          <div>
            <span className="jumper-stat-label">Streak</span>
            <span className="jumper-stat-value">{streak}</span>
          </div>
          <div>
            <span className="jumper-stat-label">Meilleur</span>
            <span className="jumper-stat-value">{bestStreak}</span>
          </div>
          <div>
            <span className="jumper-stat-label">Vitesse</span>
            <span className="jumper-stat-value">{(currentTravelMs / 1000).toFixed(1)}s</span>
          </div>
        </div>

        <div className="jumper-hp">
          <span className="jumper-hp-label">PV</span>
          <div className="jumper-hp-hearts">
            {Array.from({ length: MAX_HP }, (_, i) => (
              <span key={i} className={i < hp ? "heart full" : "heart empty"}>
                {i < hp ? "❤" : "♡"}
              </span>
            ))}
          </div>
        </div>
      </div>

      <div className="jumper-effects">
        {shieldOn && (
          <div className="jumper-effect shield">
            🛡 <span>{(shieldRemaining / 1000).toFixed(1)}s</span>
          </div>
        )}
        {slowOn && (
          <div className="jumper-effect slow">
            🐢 <span>{(slowRemaining / 1000).toFixed(1)}s</span>
          </div>
        )}
        {effects.sameNoteRemaining > 0 && effects.sameNotePc !== null && (
          <div
            className="jumper-effect samenote"
            style={{ borderColor: findNoteDef(effects.sameNotePc)?.color }}
          >
            🎯{" "}
            <span>
              {findNoteDef(effects.sameNotePc)?.name} ×{effects.sameNoteRemaining}
            </span>
          </div>
        )}
        {!shieldOn && !slowOn && effects.sameNoteRemaining === 0 && (
          <div className="jumper-effect placeholder">aucun effet actif</div>
        )}
      </div>

      <div
        className={`jumper-scene ${slowOn ? "slow-tint" : ""}`}
        style={{ width: SCENE_WIDTH, height: SCENE_HEIGHT }}
      >
        <div className="jumper-sky" />
        <div className="jumper-ground" style={{ top: GROUND_Y }} />

        <div
          className={`jumper-wolf-wrap ${shieldOn ? "shielded" : ""}`}
          style={{ left: WOLF_X, top: GROUND_Y - 50 }}
        >
          {shieldOn && <div className="jumper-wolf-shield" />}
          <div className="jumper-wolf">🐺</div>
        </div>

        {enemies.map((e) => {
          const x = SCENE_WIDTH - e.progress * (SCENE_WIDTH - WOLF_X);
          const cls =
            "jumper-enemy " +
            (e.state === "killed" ? "killed " : "") +
            (e.state === "reached" ? "reached " : "");
          return (
            <div
              key={e.id}
              className={cls}
              style={{
                left: x - ENEMY_SIZE / 2,
                top: GROUND_Y - ENEMY_SIZE + e.laneY,
                width: ENEMY_SIZE,
                height: ENEMY_SIZE,
                background: e.color,
                borderColor: e.color,
              }}
            >
              <span>{e.name}</span>
            </div>
          );
        })}

        {bonuses.map((b) => {
          const x = SCENE_WIDTH - b.progress * (SCENE_WIDTH - WOLF_X);
          const cls =
            "jumper-bonus " +
            (b.state === "collected" ? "collected " : "") +
            (b.state === "expired" ? "expired " : "");
          const typeDef = BONUS_TYPES.find((t) => t.id === b.type)!;
          return (
            <div
              key={b.id}
              className={cls}
              style={{
                left: x - BONUS_SIZE / 2,
                top: GROUND_Y - BONUS_SIZE - 20 + b.laneY,
                width: BONUS_SIZE,
                height: BONUS_SIZE,
                borderColor: typeDef.color,
              }}
              title={typeDef.label}
            >
              <span className="jumper-bonus-icon">{typeDef.icon}</span>
              <span className="jumper-bonus-chord">{b.chordName}</span>
              <span className="jumper-bonus-short">{typeDef.short}</span>
            </div>
          );
        })}

        {gameOver && (
          <div className="jumper-overlay">
            <div className="jumper-overlay-card">
              <h3>Game Over</h3>
              <p>
                Score : <strong>{score}</strong> · Meilleur streak : <strong>{bestStreak}</strong>
              </p>
              <button type="button" className="mic-btn mic-start" onClick={resetGame}>
                Rejouer
              </button>
            </div>
          </div>
        )}
      </div>

      <div className="jumper-noisegate">
        <div className="jumper-noisegate-header">
          <label htmlFor="gate">Noise gate</label>
          <span className="jumper-noisegate-value">{noiseGateDb.toFixed(0)} dB</span>
        </div>
        <div className="jumper-noisegate-meter">
          <div
            className="jumper-noisegate-bar"
            style={{ width: `${(signalNorm * 100).toFixed(1)}%` }}
          />
          <div
            className={`jumper-noisegate-threshold ${gateOpen ? "open" : "closed"}`}
            style={{ left: `${(gateNorm * 100).toFixed(1)}%` }}
            title="Seuil du noise gate"
          />
          <span className="jumper-noisegate-current">{signalLevelDb.toFixed(0)} dB</span>
        </div>
        <input
          id="gate"
          type="range"
          min={-90}
          max={-20}
          step={1}
          value={noiseGateDb}
          onChange={(e) => setNoiseGateDb(Number(e.target.value))}
        />
      </div>

      <div className="jumper-status">
        <div className="jumper-status-row">
          <span className="jumper-status-label">Note détectée :</span>
          <span className="jumper-status-detected">{gateOpen ? detectedNoteName : "—"}</span>
          <span className="jumper-status-energy">
            ({(smoothedDisplay.value * 100).toFixed(0)}%)
          </span>
          <span className="jumper-status-label">| Accord :</span>
          <span className="jumper-status-detected">{gateOpen ? topChord : "—"}</span>
          <span className="jumper-status-energy">({(topChordProb * 100).toFixed(0)}%)</span>
          {!gateOpen && <span className="jumper-status-gated">[gate fermé]</span>}
        </div>
      </div>

      {!running && (
        <div className="game-mic-prompt">
          <p>🎤 Démarre le micro pour lancer le jeu.</p>
          {onStart && (
            <button type="button" className="mic-btn mic-start" onClick={onStart}>
              Démarrer le micro
            </button>
          )}
        </div>
      )}

      <div className="game-actions">
        <button type="button" className="mic-btn mic-reset" onClick={resetGame}>
          Reset
        </button>
      </div>

      <p className="game-hint">
        Joue la <strong>note</strong> sur l'obstacle pour le détruire (kill chain : toutes les notes
        identiques sur l'écran tombent d'un coup). Les bonus dorés sont des <strong>accords</strong>{" "}
        à jouer pour activer un effet : ❤+2, 🛡 7 s, 🐢 7 s, 🎯 5 notes identiques. La vitesse
        augmente avec le score ({(INITIAL_TRAVEL_MS / 1000).toFixed(1)} s →{" "}
        {(MIN_TRAVEL_MS / 1000).toFixed(1)} s). Détection note ≈ 300 ms (smoothing 3 frames + 2
        frames de confirmation). Détection accord = top-1 sur la fenêtre 1 s + 3 frames de
        confirmation.
      </p>
    </div>
  );
}
