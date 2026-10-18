import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";

import { DetectorTab, type DetectorData } from "../../src/components/DetectorTab";
import { DEFAULT_DETECTOR_SETTINGS } from "@audiolab/core";

const chroma = () => new Float32Array(12);

function data(withSignal: boolean): DetectorData {
  const keys = withSignal
    ? [
        {
          tonic: 7,
          mode: "maj" as const,
          name: "G major",
          shortName: "G",
          correlation: 0.83,
          probability: 0.412,
        },
        {
          tonic: 4,
          mode: "min" as const,
          name: "E minor",
          shortName: "Em",
          correlation: 0.8,
          probability: 0.3,
        },
      ]
    : [];
  const chords = withSignal
    ? [{ root: 7, quality: "maj" as const, name: "G", similarity: 0.9, probability: 0.5 }]
    : [];
  return {
    instantaneousChroma: chroma(),
    chordChroma: chroma(),
    liveAcquisitionChroma: chroma(),
    tonalityAcquisitionChroma: chroma(),
    chords,
    liveKeys: keys,
    tonalityKeys: keys,
    presenceHistogram: chroma(),
    filteredLiveChroma: chroma(),
    presenceIndicator: chroma(),
    presenceKeys: keys,
    filterThreshold: 0.1234,
    filterLastPeak: 0.5,
  };
}

function renderTab(withSignal: boolean, colourByPitch = false) {
  const onSettingsChange = vi.fn();
  const onColourByPitchChange = vi.fn();
  const view = render(
    <DetectorTab
      data={data(withSignal)}
      settings={DEFAULT_DETECTOR_SETTINGS}
      onSettingsChange={onSettingsChange}
      colourByPitch={colourByPitch}
      onColourByPitchChange={onColourByPitchChange}
    />,
  );
  return { view, onSettingsChange, onColourByPitchChange };
}

describe("DetectorTab", () => {
  afterEach(cleanup);

  it("shows waiting states everywhere before the first frame", () => {
    const { view } = renderTab(false);
    expect(screen.getAllByText("Waiting for signal…").length).toBeGreaterThanOrEqual(6);
    expect(view.container.querySelectorAll(".al-chroma")).toHaveLength(7);
    expect(view.container.querySelector(".al-chroma")?.getAttribute("data-colour")).toBe("single");
  });

  it("fills the hero readouts and the ranked lists from the scores", () => {
    const { view } = renderTab(true, true);
    const hero = screen.getByRole("group", { name: "Estimated key" });
    expect(hero.querySelector(".al-readout__value")?.textContent).toBe("G major");
    expect(hero.getAttribute("data-mode")).toBe("maj");
    expect(screen.getByRole("group", { name: "Chord" }).textContent).toContain("G");
    expect(screen.getAllByRole("list", { name: /candidates/i }).length).toBeGreaterThanOrEqual(3);
    expect(view.container.querySelector(".al-chroma")?.getAttribute("data-colour")).toBe("pitch");
    expect(screen.getByText("12.3 %")).toBeTruthy();
  });

  it("forwards settings and colour changes", () => {
    const { onSettingsChange, onColourByPitchChange } = renderTab(false);
    fireEvent.change(screen.getByLabelText("Live window"), { target: { value: "12" } });
    expect(onSettingsChange).toHaveBeenCalledWith({
      ...DEFAULT_DETECTOR_SETTINGS,
      liveAcquisitionSeconds: 12,
    });
    fireEvent.change(screen.getByLabelText("Peak aggregator"), { target: { value: "median" } });
    expect(onSettingsChange).toHaveBeenLastCalledWith({
      ...DEFAULT_DETECTOR_SETTINGS,
      maxFilterMode: "median",
    });
    fireEvent.click(screen.getByRole("switch"));
    expect(onColourByPitchChange).toHaveBeenCalledWith(true);
  });
});
