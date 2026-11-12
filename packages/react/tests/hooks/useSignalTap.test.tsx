import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { renderHook } from "@testing-library/react";

import * as core from "@audiolab/core";
import type { MicSource } from "@audiolab/core";
import { useSignalTap } from "../../src/hooks/useSignalTap";
import {
  installWebAudioFakes,
  type InstalledFakes,
} from "../../../core/tests/helpers/fakeWebAudio";

describe("useSignalTap", () => {
  let fakes: InstalledFakes;
  let mic: MicSource;

  beforeEach(async () => {
    fakes = installWebAudioFakes({ timeDomainSource: (buf) => buf.fill(0.25) });
    mic = await core.openMicrophone();
  });

  afterEach(async () => {
    await mic.dispose();
    fakes.restore();
  });

  it("is empty without a session", () => {
    const { result } = renderHook(() => useSignalTap(null));
    expect(result.current.current).toBeNull();
  });

  it("taps the session while mounted, and lets go on unmount", () => {
    const { result, unmount } = renderHook(() => useSignalTap(mic, { fftSize: 1024 }));
    const tap = result.current.current!;
    expect(tap.size).toBe(1024);
    const samples = new Float32Array(tap.size);
    tap.readTimeDomain(samples);
    expect(samples[0]).toBe(0.25);
    const source = mic.source as unknown as { disconnect: { mock: { calls: unknown[] } } };
    unmount();
    expect(result.current.current).toBeNull();
    expect(source.disconnect.mock.calls.length).toBe(1);
  });
});
