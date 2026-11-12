/**
 * Demo audio, for trying the overlay (and taking screenshots) without an
 * audio interface: either a built-in synth band or an audio file, rendered
 * into MediaStreams the SDK sessions take instead of getUserMedia.
 *
 * The synth plays a minor ii–V–i turnaround with a bass, strummed chords, a
 * kick on every beat and a lead line on its own stream (the "dry guitar"),
 * so every analysis has something to find: a key, chord changes, a tempo,
 * attacks and a monophonic note (held notes with a vibrato).
 */

export interface DemoAudio {
  context: AudioContext;
  /** Everything: what the harmony session listens to. */
  mix: MediaStream;
  /** The lead alone (synth), or the mix again (file): what the notes session listens to. */
  lead: MediaStream;
  stop(): void;
}

const BPM = 96;
const BEAT = 60 / BPM;

/** Am – Dm – E7 – Am – F – Dm – E7 – Am, one bar each (MIDI notes). */
const BARS: { bass: number; chord: number[] }[] = [
  { bass: 45, chord: [57, 60, 64] },
  { bass: 50, chord: [57, 62, 65] },
  { bass: 40, chord: [56, 59, 62, 64] },
  { bass: 45, chord: [57, 60, 64] },
  { bass: 41, chord: [57, 60, 65] },
  { bass: 50, chord: [57, 62, 65] },
  { bass: 40, chord: [56, 59, 62, 64] },
  { bass: 45, chord: [57, 60, 64] },
];

/** Lead: A minor / harmonic minor phrases, one note per eighth (null = rest). */
const LEAD: (number | null)[] = [
  76,
  null,
  74,
  72,
  71,
  null,
  72,
  74,
  77,
  null,
  76,
  74,
  72,
  null,
  69,
  null,
  68,
  71,
  74,
  76,
  74,
  null,
  71,
  68,
  69,
  null,
  null,
  72,
  76,
  null,
  81,
  null,
  77,
  null,
  76,
  72,
  69,
  null,
  72,
  76,
  74,
  null,
  72,
  74,
  77,
  null,
  74,
  72,
  71,
  74,
  76,
  80,
  76,
  null,
  74,
  71,
  69,
  null,
  null,
  null,
  76,
  72,
  69,
  null,
];

function hz(midi: number): number {
  return 440 * Math.pow(2, (midi - 69) / 12);
}

function pluck(
  ctx: AudioContext,
  out: AudioNode,
  midi: number,
  at: number,
  duration: number,
  gain: number,
  type: OscillatorType,
  cutoff: number,
  vibratoHz = 0,
): void {
  const osc = ctx.createOscillator();
  osc.type = type;
  osc.frequency.value = hz(midi);
  if (vibratoHz > 0) {
    // A guitarist's vibrato: it starts after the attack, about ±25 cents.
    const lfo = ctx.createOscillator();
    lfo.frequency.value = vibratoHz;
    const depth = ctx.createGain();
    depth.gain.setValueAtTime(0, at);
    depth.gain.linearRampToValueAtTime(hz(midi) * 0.015, at + 0.15);
    lfo.connect(depth).connect(osc.frequency);
    lfo.start(at);
    lfo.stop(at + duration + 0.05);
  }
  const filter = ctx.createBiquadFilter();
  filter.type = "lowpass";
  filter.frequency.setValueAtTime(cutoff * 3, at);
  filter.frequency.exponentialRampToValueAtTime(cutoff, at + 0.25);
  const env = ctx.createGain();
  env.gain.setValueAtTime(0, at);
  env.gain.linearRampToValueAtTime(gain, at + 0.008);
  env.gain.exponentialRampToValueAtTime(gain * 0.35, at + duration * 0.5);
  env.gain.exponentialRampToValueAtTime(0.0001, at + duration);
  osc.connect(filter).connect(env).connect(out);
  osc.start(at);
  osc.stop(at + duration + 0.05);
}

function kick(ctx: AudioContext, out: AudioNode, at: number, gain: number): void {
  const osc = ctx.createOscillator();
  osc.frequency.setValueAtTime(140, at);
  osc.frequency.exponentialRampToValueAtTime(45, at + 0.12);
  const env = ctx.createGain();
  env.gain.setValueAtTime(gain, at);
  env.gain.exponentialRampToValueAtTime(0.0001, at + 0.18);
  osc.connect(env).connect(out);
  osc.start(at);
  osc.stop(at + 0.2);
}

function startSynth(ctx: AudioContext, mixOut: AudioNode, leadOut: AudioNode): () => void {
  const band = ctx.createGain();
  band.gain.value = 0.5;
  band.connect(mixOut);
  const lead = ctx.createGain();
  lead.gain.value = 0.5;
  lead.connect(mixOut);
  lead.connect(leadOut);

  let nextBar = 0;
  let barTime = ctx.currentTime + 0.1;
  const schedule = () => {
    // Keep two bars scheduled ahead.
    while (barTime < ctx.currentTime + 4 * BEAT * 2) {
      const bar = BARS[nextBar % BARS.length];
      for (let beat = 0; beat < 4; beat++) {
        const t = barTime + beat * BEAT;
        kick(ctx, band, t, beat === 0 ? 0.9 : 0.6);
        pluck(ctx, band, bar.bass - (beat % 2 ? 0 : 12) + 12, t, BEAT * 0.9, 0.5, "sawtooth", 500);
        bar.chord.forEach((n, i) =>
          pluck(ctx, band, n, t + i * 0.012, BEAT * 1.6, 0.14, "triangle", 2400),
        );
      }
      for (let e = 0; e < 8; e++) {
        const note = LEAD[(nextBar % BARS.length) * 8 + e];
        if (note === null) continue;
        // Notes followed by a rest are held longer, with a vibrato.
        const held = LEAD[(nextBar % BARS.length) * 8 + e + 1] === null;
        pluck(
          ctx,
          lead,
          note,
          barTime + e * (BEAT / 2),
          held ? BEAT * 1.4 : BEAT * 0.9,
          0.3,
          "sawtooth",
          1800,
          held ? 5.5 : 0,
        );
      }
      nextBar += 1;
      barTime += 4 * BEAT;
    }
  };
  schedule();
  const timer = setInterval(schedule, 250);
  return () => {
    clearInterval(timer);
    band.disconnect();
    lead.disconnect();
  };
}

async function startFile(ctx: AudioContext, url: string, out: AudioNode): Promise<() => void> {
  const response = await fetch(url);
  if (!response.ok) throw new Error(`Demo file: HTTP ${response.status} for ${url}`);
  const buffer = await ctx.decodeAudioData(await response.arrayBuffer());
  const source = ctx.createBufferSource();
  source.buffer = buffer;
  source.loop = true;
  source.connect(out);
  source.start();
  return () => source.stop();
}

/** Start the demo: "synth" or the URL of an audio file. */
export async function startDemo(which: string, listen: boolean): Promise<DemoAudio> {
  const context = new AudioContext();
  if (context.state === "suspended") await context.resume().catch(() => undefined);
  const mixOut = context.createMediaStreamDestination();
  const leadOut = context.createMediaStreamDestination();
  const bus = context.createGain();
  bus.connect(mixOut);
  if (listen) bus.connect(context.destination);

  let stopSource: () => void;
  if (which === "synth") {
    stopSource = startSynth(context, bus, leadOut);
  } else {
    stopSource = await startFile(context, which, bus);
  }
  return {
    context,
    mix: mixOut.stream,
    lead: which === "synth" ? leadOut.stream : mixOut.stream,
    stop() {
      stopSource();
      void context.close();
    },
  };
}
