// @vitest-environment jsdom
import { afterEach, describe, it, expect, vi } from "vitest";

import { MicrophoneError } from "../../src/audio/errors";
import { MIC_CONSTRAINTS, openMicrophone } from "../../src/audio/micStream";
import {
  installWebAudioFakes,
  makeFakeAudioContextClass,
  makeFakeStream,
  type InstalledFakes,
} from "../helpers/fakeWebAudio";

function trackOf(stream: MediaStream): { stop: ReturnType<typeof vi.fn> } {
  return stream.getTracks()[0] as unknown as { stop: ReturnType<typeof vi.fn> };
}

function domError(name: string): Error {
  const e = new Error(name);
  e.name = name;
  return e;
}

describe("openMicrophone", () => {
  let fakes: InstalledFakes | null = null;

  afterEach(() => {
    fakes?.restore();
    fakes = null;
  });

  it("requests audio with AGC, noise suppression and echo cancellation disabled", async () => {
    fakes = installWebAudioFakes();
    const mic = await openMicrophone();
    expect(fakes.getUserMedia).toHaveBeenCalledTimes(1);
    const constraints = fakes.getUserMedia.mock.calls[0][0] as typeof MIC_CONSTRAINTS;
    const audio = constraints.audio as MediaTrackConstraints;
    expect(audio.autoGainControl).toBe(false);
    expect(audio.noiseSuppression).toBe(false);
    expect(audio.echoCancellation).toBe(false);
    expect(constraints.video).toBe(false);
    await mic.dispose();
  });

  it("resumes a suspended context and exposes the track settings", async () => {
    fakes = installWebAudioFakes({
      initialState: "suspended",
      getUserMedia: vi.fn(async () => makeFakeStream({ autoGainControl: true })),
    });
    const mic = await openMicrophone();
    expect(fakes.instances[0].resume).toHaveBeenCalledTimes(1);
    expect(mic.context.state).toBe("running");
    expect(mic.trackSettings.autoGainControl).toBe(true);
    await mic.dispose();
  });

  it("does not call resume() on a running context", async () => {
    fakes = installWebAudioFakes({ initialState: "running" });
    const mic = await openMicrophone();
    expect(fakes.instances[0].resume).not.toHaveBeenCalled();
    await mic.dispose();
  });

  it("dispose() stops every track and closes the context exactly once", async () => {
    fakes = installWebAudioFakes();
    const mic = await openMicrophone();
    const track = mic.stream.getTracks()[0] as unknown as { stop: ReturnType<typeof vi.fn> };
    await mic.dispose();
    await mic.dispose();
    expect(track.stop).toHaveBeenCalledTimes(1);
    expect(fakes.instances[0].close).toHaveBeenCalledTimes(1);
  });

  it("maps a rejected getUserMedia to a MicrophoneError with a code", async () => {
    fakes = installWebAudioFakes({
      getUserMedia: vi.fn(async () => {
        throw domError("NotAllowedError");
      }),
    });
    const err = await openMicrophone().catch((e: unknown) => e);
    expect(err).toBeInstanceOf(MicrophoneError);
    expect((err as MicrophoneError).code).toBe("permission-denied");
    expect(fakes.instances).toHaveLength(0); // no context was created
  });

  it("stops the tracks and closes the context when setup fails after capture", async () => {
    const stream = makeFakeStream();
    fakes = installWebAudioFakes({
      failSource: true,
      getUserMedia: vi.fn(async () => stream),
    });
    const err = await openMicrophone().catch((e: unknown) => e);
    expect(err).toBeInstanceOf(MicrophoneError);
    expect((err as MicrophoneError).code).toBe("unknown");
    const track = stream.getTracks()[0] as unknown as { stop: ReturnType<typeof vi.fn> };
    expect(track.stop).toHaveBeenCalledTimes(1);
    expect(fakes.instances[0].close).toHaveBeenCalledTimes(1);
  });

  it("passes custom constraints through to getUserMedia", async () => {
    fakes = installWebAudioFakes();
    const constraints: MediaStreamConstraints = { audio: { deviceId: "abc" }, video: false };
    const mic = await openMicrophone({ constraints });
    expect(fakes.getUserMedia.mock.calls[0][0]).toBe(constraints);
    await mic.dispose();
  });

  it("fails with 'unsupported' when getUserMedia is missing", async () => {
    fakes = installWebAudioFakes();
    Object.defineProperty(navigator, "mediaDevices", { configurable: true, value: undefined });
    const err = await openMicrophone().catch((e: unknown) => e);
    expect((err as MicrophoneError).code).toBe("unsupported");
  });

  it("fails with 'insecure-context' on an insecure origin", async () => {
    fakes = installWebAudioFakes();
    (globalThis as unknown as Record<string, unknown>).isSecureContext = false;
    const err = await openMicrophone().catch((e: unknown) => e);
    expect((err as MicrophoneError).code).toBe("insecure-context");
    expect(fakes.getUserMedia).not.toHaveBeenCalled();
  });
});

describe("openMicrophone with a host-owned context or stream", () => {
  let fakes: InstalledFakes | null = null;

  afterEach(() => {
    fakes?.restore();
    fakes = null;
  });

  it("uses the injected context, resumes it and leaves it running after dispose()", async () => {
    fakes = installWebAudioFakes();
    const { FakeAudioContext } = makeFakeAudioContextClass({ initialState: "suspended" });
    const context = new FakeAudioContext() as unknown as AudioContext;

    const mic = await openMicrophone({ context });
    expect(mic.context).toBe(context);
    expect(mic.ownsContext).toBe(false);
    expect(mic.ownsStream).toBe(true);
    expect(context.state).toBe("running");
    expect(fakes.instances).toHaveLength(0); // the SDK created no context of its own

    await mic.dispose();
    expect(context.state).toBe("running");
    expect(
      (context as unknown as { close: ReturnType<typeof vi.fn> }).close,
    ).not.toHaveBeenCalled();
    expect(
      (mic.source as unknown as { disconnect: ReturnType<typeof vi.fn> }).disconnect,
    ).toHaveBeenCalledTimes(1);
    expect(trackOf(mic.stream).stop).toHaveBeenCalledTimes(1); // the SDK acquired the stream
  });

  it("closes the context it created itself", async () => {
    fakes = installWebAudioFakes();
    const mic = await openMicrophone();
    expect(mic.ownsContext).toBe(true);
    await mic.dispose();
    expect(mic.context.state).toBe("closed");
  });

  it("does not stop the tracks of a caller-provided stream", async () => {
    fakes = installWebAudioFakes();
    const stream = makeFakeStream({ sampleRate: 48000 });
    const mic = await openMicrophone({ stream });
    expect(fakes.getUserMedia).not.toHaveBeenCalled();
    expect(mic.stream).toBe(stream);
    expect(mic.ownsStream).toBe(false);
    expect(mic.trackSettings.sampleRate).toBe(48000);
    await mic.dispose();
    expect(trackOf(stream).stop).not.toHaveBeenCalled();
    expect(mic.context.state).toBe("closed"); // the context was the SDK's
  });

  it("needs neither getUserMedia nor a global AudioContext when both are provided", async () => {
    fakes = installWebAudioFakes();
    Object.defineProperty(navigator, "mediaDevices", { configurable: true, value: undefined });
    const { FakeAudioContext } = makeFakeAudioContextClass({ initialState: "running" });
    const context = new FakeAudioContext() as unknown as AudioContext;
    const stream = makeFakeStream();
    const mic = await openMicrophone({ context, stream });
    expect(mic.ownsContext).toBe(false);
    expect(mic.ownsStream).toBe(false);
    await mic.dispose();
    expect(context.state).toBe("running");
    expect(trackOf(stream).stop).not.toHaveBeenCalled();
  });

  it("leaves a host-owned context and stream alone when setup fails", async () => {
    fakes = installWebAudioFakes();
    const { FakeAudioContext } = makeFakeAudioContextClass({
      initialState: "running",
      failSource: true,
    });
    const context = new FakeAudioContext() as unknown as AudioContext;
    const stream = makeFakeStream();
    const err = await openMicrophone({ context, stream }).catch((e: unknown) => e);
    expect(err).toBeInstanceOf(MicrophoneError);
    expect(context.state).toBe("running");
    expect(trackOf(stream).stop).not.toHaveBeenCalled();
  });

  it("dispose() survives a source already disconnected by the host", async () => {
    fakes = installWebAudioFakes();
    const { FakeAudioContext } = makeFakeAudioContextClass({ initialState: "running" });
    const context = new FakeAudioContext() as unknown as AudioContext;
    const mic = await openMicrophone({ context });
    (
      mic.source as unknown as { disconnect: ReturnType<typeof vi.fn> }
    ).disconnect.mockImplementation(() => {
      throw new Error("InvalidStateError");
    });
    await expect(mic.dispose()).resolves.toBeUndefined();
  });
});
