import { afterEach, describe, it, expect } from "vitest";
import { act, renderHook, waitFor } from "@testing-library/react";

import { useAudioInputs } from "../../src/hooks/useAudioInputs";
import {
  installWebAudioFakes,
  type InstalledFakes,
} from "../../../core/tests/helpers/fakeWebAudio";

describe("useAudioInputs", () => {
  let fakes: InstalledFakes | null = null;

  afterEach(() => {
    fakes?.restore();
    fakes = null;
  });

  it("starts empty, then lists the inputs", async () => {
    fakes = installWebAudioFakes({ devices: [{ deviceId: "lb", label: "Loopback" }] });
    const { result } = renderHook(() => useAudioInputs());
    expect(result.current.inputs).toEqual([]);
    await waitFor(() => expect(result.current.inputs).toHaveLength(1));
    expect(result.current.labelled).toBe(true);
  });

  it("follows devicechange and stops listening on unmount", async () => {
    fakes = installWebAudioFakes({ devices: [{ deviceId: "lb", label: "Loopback" }] });
    const { result, unmount } = renderHook(() => useAudioInputs());
    await waitFor(() => expect(result.current.inputs).toHaveLength(1));

    act(() => fakes!.setDevices([]));
    await waitFor(() => expect(result.current.inputs).toHaveLength(0));

    unmount();
    const calls = fakes.enumerateDevices.mock.calls.length;
    fakes.setDevices([{ deviceId: "a1", label: "Analogue 1" }]);
    await act(async () => {});
    expect(fakes.enumerateDevices.mock.calls.length).toBe(calls);
  });

  it("keeps labels hidden until refresh() after permission, or unlocks them on mount", async () => {
    fakes = installWebAudioFakes({
      devices: [{ deviceId: "lb", label: "Loopback" }],
      hideLabelsUntilPermission: true,
    });
    const hidden = renderHook(() => useAudioInputs());
    await waitFor(() => expect(hidden.result.current.inputs).toHaveLength(1));
    expect(hidden.result.current.labelled).toBe(false);

    const unlocked = renderHook(() => useAudioInputs({ unlockLabels: true }));
    await waitFor(() => expect(unlocked.result.current.labelled).toBe(true));

    await act(() => hidden.result.current.refresh());
    expect(hidden.result.current.inputs[0].label).toBe("Loopback");
  });

  it("keeps the previous list when listing fails", async () => {
    fakes = installWebAudioFakes({ devices: [{ deviceId: "lb", label: "Loopback" }] });
    const { result } = renderHook(() => useAudioInputs());
    await waitFor(() => expect(result.current.inputs).toHaveLength(1));
    fakes.enumerateDevices.mockRejectedValueOnce(new Error("boom"));
    await act(() => result.current.refresh());
    expect(result.current.inputs).toHaveLength(1);
  });
});
