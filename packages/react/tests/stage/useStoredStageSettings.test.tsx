import { afterEach, describe, expect, it } from "vitest";
import { act, renderHook, waitFor } from "@testing-library/react";

import { DEFAULT_STAGE_SETTINGS } from "@audiolab/core";

import { useStoredStageSettings } from "../../src/stage/useStoredStageSettings";

describe("useStoredStageSettings", () => {
  afterEach(() => localStorage.clear());

  it("starts from initial + overrides, then reads what was stored", async () => {
    localStorage.setItem("k", JSON.stringify({ chordWindowSeconds: 4, songSeconds: 9999 }));
    const { result } = renderHook(() =>
      useStoredStageSettings({ storageKey: "k", initial: { chordSource: "notes" }, overrides: {} }),
    );
    await waitFor(() => expect(result.current.settings.chordWindowSeconds).toBe(4));
    expect(result.current.settings.songSeconds).toBe(300);
    expect(result.current.settings.chordSource).toBe("notes");
  });

  it("stores updates, keeps this page's overrides on top, and shares through storage events", async () => {
    const { result } = renderHook(() =>
      useStoredStageSettings({ storageKey: "k2", overrides: { gateStrictness: "0.9" } }),
    );
    await waitFor(() => expect(result.current.settings.gateStrictness).toBe(0.9));
    act(() => result.current.update({ ...DEFAULT_STAGE_SETTINGS, chordWindowSeconds: 6 }));
    expect(JSON.parse(localStorage.getItem("k2")!).chordWindowSeconds).toBe(6);
    expect(result.current.settings).toMatchObject({ chordWindowSeconds: 6, gateStrictness: 0.9 });

    // Another page stored new values: applied, the override still wins.
    act(() => {
      window.dispatchEvent(
        new StorageEvent("storage", {
          key: "k2",
          newValue: JSON.stringify({ chordWindowSeconds: 2, gateStrictness: 0 }),
        }),
      );
    });
    expect(result.current.settings).toMatchObject({ chordWindowSeconds: 2, gateStrictness: 0.9 });

    // Other keys and corrupt values are ignored.
    act(() => {
      window.dispatchEvent(new StorageEvent("storage", { key: "other", newValue: "{}" }));
      window.dispatchEvent(new StorageEvent("storage", { key: "k2", newValue: "{oops" }));
    });
    expect(result.current.settings.chordWindowSeconds).toBe(2);
  });

  it("uses the defaults without storage or options", () => {
    const { result } = renderHook(() => useStoredStageSettings());
    expect(result.current.settings).toEqual(DEFAULT_STAGE_SETTINGS);
  });
});
