// @vitest-environment jsdom
import { afterEach, describe, it, expect, vi } from "vitest";

import { MicrophoneError } from "../../src/audio/errors";
import { MIC_CONSTRAINTS, openMicrophone } from "../../src/audio/micStream";
import { installWebAudioFakes, makeFakeStream, type InstalledFakes } from "../helpers/fakeWebAudio";

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
