import { afterEach, describe, it, expect, vi } from "vitest";
import { act, renderHook, waitFor } from "@testing-library/react";

import { useMicrophone } from "../../src/hooks/useMicrophone";
import {
  installWebAudioFakes,
  makeFakeStream,
  type InstalledFakes,
} from "../../../core/tests/helpers/fakeWebAudio";

/** A getUserMedia that resolves only when the test says so (permission prompt). */
function deferredGetUserMedia() {
  let resolve!: (s: MediaStream) => void;
  let reject!: (e: unknown) => void;
  const promise = new Promise<MediaStream>((res, rej) => {
    resolve = res;
    reject = rej;
  });
  const fn = vi.fn(() => promise);
  return { fn, resolve, reject };
}

describe("useMicrophone", () => {
  let fakes: InstalledFakes | null = null;

  afterEach(() => {
    fakes?.restore();
    fakes = null;
  });

  it("starts and stops a session", async () => {
    fakes = installWebAudioFakes();
    const { result } = renderHook(() => useMicrophone());
    expect(result.current.running).toBe(false);

    await act(() => result.current.start());
    expect(result.current.running).toBe(true);
    expect(result.current.mic).not.toBeNull();
    expect(fakes.getUserMedia).toHaveBeenCalledTimes(1);

    await act(() => result.current.stop());
    expect(result.current.running).toBe(false);
    expect(result.current.mic).toBeNull();
    expect(fakes.instances[0].close).toHaveBeenCalledTimes(1);
  });

  it("ignores a second start() while the first is pending (double click)", async () => {
    const gum = deferredGetUserMedia();
    fakes = installWebAudioFakes({ getUserMedia: gum.fn });
    const { result } = renderHook(() => useMicrophone());

    let first!: Promise<void>;
    let second!: Promise<void>;
    act(() => {
      first = result.current.start();
      second = result.current.start();
    });
    expect(result.current.starting).toBe(true);
    gum.resolve(makeFakeStream());
    await act(async () => {
      await Promise.all([first, second]);
    });

    expect(gum.fn).toHaveBeenCalledTimes(1);
    expect(fakes.instances).toHaveLength(1);
    expect(result.current.running).toBe(true);
  });

  it("ignores start() while already running", async () => {
    fakes = installWebAudioFakes();
    const { result } = renderHook(() => useMicrophone());
    await act(() => result.current.start());
    await act(() => result.current.start());
    expect(fakes.getUserMedia).toHaveBeenCalledTimes(1);
  });

  it("disposes the source if stop() happened during the permission prompt", async () => {
    const gum = deferredGetUserMedia();
    fakes = installWebAudioFakes({ getUserMedia: gum.fn });
    const { result } = renderHook(() => useMicrophone());

    let pending!: Promise<void>;
    act(() => {
      pending = result.current.start();
    });
    await act(() => result.current.stop());
    const stream = makeFakeStream();
    gum.resolve(stream);
    await act(async () => {
      await pending;
    });

    expect(result.current.running).toBe(false);
    expect(result.current.mic).toBeNull();
    const track = stream.getTracks()[0] as unknown as { stop: ReturnType<typeof vi.fn> };
    expect(track.stop).toHaveBeenCalledTimes(1);
    expect(fakes.instances[0].close).toHaveBeenCalledTimes(1);
  });

  it("disposes the source if the hook unmounted during the permission prompt", async () => {
    const gum = deferredGetUserMedia();
    fakes = installWebAudioFakes({ getUserMedia: gum.fn });
    const { result, unmount } = renderHook(() => useMicrophone());

    let pending!: Promise<void>;
    act(() => {
      pending = result.current.start();
    });
    unmount();
    const stream = makeFakeStream();
    gum.resolve(stream);
    await pending;

    const track = stream.getTracks()[0] as unknown as { stop: ReturnType<typeof vi.fn> };
    expect(track.stop).toHaveBeenCalledTimes(1);
    expect(fakes.instances[0].close).toHaveBeenCalledTimes(1);
  });

  it("stops the session on unmount", async () => {
    fakes = installWebAudioFakes();
    const { result, unmount } = renderHook(() => useMicrophone());
    await act(() => result.current.start());
    unmount();
    await waitFor(() => expect(fakes!.instances[0].close).toHaveBeenCalledTimes(1));
  });

  it("surfaces a friendly error and stays stopped when permission is denied", async () => {
    const err = new Error("Permission denied");
    err.name = "NotAllowedError";
    fakes = installWebAudioFakes({
      getUserMedia: vi.fn(async () => {
        throw err;
      }),
    });
    const { result } = renderHook(() => useMicrophone());
    await act(() => result.current.start());
    expect(result.current.running).toBe(false);
    expect(result.current.starting).toBe(false);
    expect(result.current.error).toMatch(/denied/);
    expect(result.current.error).not.toBe("Permission denied");

    // A later start() clears the error and can succeed.
    fakes.getUserMedia.mockImplementation(async () => makeFakeStream());
    await act(() => result.current.start());
    expect(result.current.error).toBeNull();
    expect(result.current.running).toBe(true);
  });

  it("can start again after stop()", async () => {
    fakes = installWebAudioFakes();
    const { result } = renderHook(() => useMicrophone());
    await act(() => result.current.start());
    await act(() => result.current.stop());
    await act(() => result.current.start());
    expect(result.current.running).toBe(true);
    expect(fakes.instances).toHaveLength(2);
  });
});
