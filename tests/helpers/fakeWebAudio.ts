/**
 * Hand-written Web Audio / getUserMedia fakes for jsdom tests. Small and
 * explicit on purpose: tests assert on these spies directly.
 */
import { vi } from "vitest";

export interface FakeTrack {
  kind: string;
  stop: ReturnType<typeof vi.fn>;
  getSettings: () => MediaTrackSettings;
}

export function makeFakeStream(settings: MediaTrackSettings = {}): MediaStream {
  const track: FakeTrack = {
    kind: "audio",
    stop: vi.fn(),
    getSettings: () => settings,
  };
  return {
    getTracks: () => [track],
    getAudioTracks: () => [track],
  } as unknown as MediaStream;
}

export interface FakeAudioContextOptions {
  sampleRate?: number;
  initialState?: AudioContextState;
  /** Make createMediaStreamSource throw (to test cleanup on failure). */
  failSource?: boolean;
}

/** A spy-backed AudioContext constructor. Instances are collected in `instances`. */
export function makeFakeAudioContextClass(opts: FakeAudioContextOptions = {}) {
  const instances: FakeAudioContext[] = [];

  class FakeAudioContext {
    sampleRate = opts.sampleRate ?? 48000;
    state: AudioContextState = opts.initialState ?? "suspended";
    currentTime = 0;
    resume = vi.fn(async () => {
      this.state = "running";
    });
    close = vi.fn(async () => {
      this.state = "closed";
    });
    createMediaStreamSource = vi.fn(() => {
      if (opts.failSource) throw new Error("source failure");
      return { connect: vi.fn(), disconnect: vi.fn() };
    });
    createAnalyser = vi.fn(() => ({
      fftSize: 2048,
      frequencyBinCount: 1024,
      smoothingTimeConstant: 0.8,
      minDecibels: -100,
      maxDecibels: -30,
      connect: vi.fn(),
      disconnect: vi.fn(),
      getFloatFrequencyData: vi.fn((buf: Float32Array) => buf.fill(-Infinity)),
      getFloatTimeDomainData: vi.fn((buf: Float32Array) => buf.fill(0)),
    }));
    audioWorklet = { addModule: vi.fn(async () => undefined) };
    constructor() {
      instances.push(this);
    }
  }

  return { FakeAudioContext, instances };
}

export interface InstalledFakes {
  getUserMedia: ReturnType<typeof vi.fn>;
  instances: InstanceType<ReturnType<typeof makeFakeAudioContextClass>["FakeAudioContext"]>[];
  restore(): void;
}

/**
 * Install `navigator.mediaDevices.getUserMedia`, `AudioContext` and
 * `isSecureContext` on the jsdom globals.
 */
export function installWebAudioFakes(
  options: FakeAudioContextOptions & { getUserMedia?: ReturnType<typeof vi.fn> } = {},
): InstalledFakes {
  const { FakeAudioContext, instances } = makeFakeAudioContextClass(options);
  const getUserMedia = options.getUserMedia ?? vi.fn(async () => makeFakeStream());

  const g = globalThis as unknown as Record<string, unknown>;
  const previous = {
    AudioContext: g.AudioContext,
    isSecureContext: g.isSecureContext,
    mediaDevices: Object.getOwnPropertyDescriptor(navigator, "mediaDevices"),
  };

  g.AudioContext = FakeAudioContext;
  g.isSecureContext = true;
  Object.defineProperty(navigator, "mediaDevices", {
    configurable: true,
    value: { getUserMedia },
  });

  return {
    getUserMedia,
    instances,
    restore() {
      g.AudioContext = previous.AudioContext;
      g.isSecureContext = previous.isSecureContext;
      if (previous.mediaDevices) {
        Object.defineProperty(navigator, "mediaDevices", previous.mediaDevices);
      } else {
        delete (navigator as unknown as Record<string, unknown>).mediaDevices;
      }
    },
  };
}
