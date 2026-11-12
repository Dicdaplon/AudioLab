import { afterEach, describe, expect, it, vi } from "vitest";
import { act, fireEvent, render, screen } from "@testing-library/react";

import {
  DEFAULT_STAGE_SETTINGS,
  type ChordReading,
  type KeyReading,
  type PitchEstimate,
} from "@audiolab/core";

import { ChordPlate } from "../../src/stage/plates/ChordPlate";
import { ChordRibbon } from "../../src/stage/plates/ChordRibbon";
import { KeyPlate } from "../../src/stage/plates/KeyPlate";
import { StageSettingsPanel } from "../../src/stage/plates/StageSettingsPanel";
import { TunerPlate } from "../../src/stage/plates/TunerPlate";

const A_MINOR = { tonic: 9, mode: "min" as const };

function keyReading(over: Partial<KeyReading>): KeyReading {
  return { phase: "settled", key: A_MINOR, runnerUp: null, stability: 0.75, event: null, ...over };
}

function chordReading(
  chords: [number, "maj" | "min" | "dom7", number, number][],
  over: Partial<ChordReading> = {},
): ChordReading {
  const history = chords.map(([root, quality, start, end]) => ({
    chord: { root, quality, name: "" },
    start,
    end,
  }));
  return {
    current: history.length ? history[history.length - 1].chord : null,
    runnerUp: null,
    margin: 0.2,
    silent: false,
    changed: false,
    history,
    ...over,
  };
}

function note(midi: number, cents: number): PitchEstimate {
  return { frequency: 440, midi, pitchClass: midi % 12, cents, clarity: 0.9 };
}

describe("KeyPlate", () => {
  it("shows the settled key in French with the English name and a gauge", () => {
    const { container } = render(<KeyPlate reading={keyReading({})} />);
    expect(screen.getByText("La")).toBeTruthy();
    expect(screen.getByText("mineur")).toBeTruthy();
    expect(screen.getByText("Am")).toBeTruthy();
    const cells = container.querySelectorAll("[aria-hidden] > span");
    expect(cells).toHaveLength(12);
  });

  it("names the runner-up while hesitating, and listens without a key", () => {
    const { rerender } = render(
      <KeyPlate
        reading={keyReading({ phase: "hesitant", runnerUp: { tonic: 0, mode: "maj" } })}
        notation="en"
      />,
    );
    expect(screen.getByText("or C major")).toBeTruthy();
    expect(screen.queryByText("Am")).toBeNull();
    rerender(
      <KeyPlate
        reading={keyReading({ phase: "listening", key: null, stability: 0 })}
        notation="fr"
      />,
    );
    expect(screen.getByText("À l'écoute")).toBeTruthy();
    expect(screen.getByText("· · ·")).toBeTruthy();
  });
});

describe("KeyPlate with tempo and live light", () => {
  it("shows a confident BPM and the live light, and a compact one-line chip", () => {
    const { rerender, container } = render(
      <KeyPlate reading={keyReading({})} tempo={{ bpm: 96.4, confidence: 0.8 }} live />,
    );
    expect(screen.getByText("96 BPM")).toBeTruthy();
    expect(screen.getByLabelText("live")).toBeTruthy();
    expect(screen.queryByText("Am")).toBeNull();
    rerender(
      <KeyPlate
        reading={keyReading({})}
        tempo={{ bpm: 120, confidence: 0.2 }}
        live={false}
        compact
      />,
    );
    expect(screen.queryByText(/BPM/)).toBeNull();
    expect(screen.getByLabelText("idle")).toBeTruthy();
    expect(screen.queryByText("Tonalité")).toBeNull();
    expect(container.textContent).toContain("mineur");
  });
});

describe("ChordPlate", () => {
  it("shows the chord, its suffix and its degree in the key", () => {
    render(<ChordPlate reading={chordReading([[4, "dom7", 0, 1]])} songKey={A_MINOR} />);
    expect(screen.getByText("Mi")).toBeTruthy();
    expect(screen.getByText("7")).toBeTruthy();
    expect(screen.getByText("V7")).toBeTruthy();
    expect(screen.getByText("E7")).toBeTruthy();
  });

  it("shows a dash before the first chord, and a close runner-up", () => {
    const { rerender } = render(<ChordPlate reading={chordReading([])} songKey={null} />);
    expect(screen.getByText("—")).toBeTruthy();
    rerender(
      <ChordPlate
        reading={chordReading([[0, "maj", 0, 1]], {
          runnerUp: { root: 9, quality: "min", name: "Am" },
        })}
        songKey={null}
        notation="en"
      />,
    );
    expect(screen.getByText("or Am")).toBeTruthy();
  });
});

describe("TunerPlate", () => {
  afterEach(() => vi.useRealTimers());

  it("shows the note, its octave, its degree and the cents", () => {
    render(<TunerPlate note={note(69, 12)} songKey={A_MINOR} />);
    expect(screen.getByText("La")).toBeTruthy();
    expect(screen.getByText("4")).toBeTruthy();
    expect(screen.getByText("Degré 1")).toBeTruthy();
    expect(screen.getByText("+12 ¢")).toBeTruthy();
  });

  it("flags notes out of the key", () => {
    render(<TunerPlate note={note(70, -3)} songKey={A_MINOR} notation="en" />);
    expect(screen.getByText("Out of key")).toBeTruthy();
    expect(screen.getByText("-3 ¢")).toBeTruthy();
  });

  it("lights 'in tune' after 300 ms within 5 cents, and fades the note out on silence", () => {
    vi.useFakeTimers();
    let now = 0;
    vi.spyOn(performance, "now").mockImplementation(() => now);
    const { rerender } = render(<TunerPlate note={note(69, 2)} songKey={null} />);
    expect(screen.queryByText("Juste")).toBeNull();
    now = 400;
    rerender(<TunerPlate note={note(69, 1)} songKey={null} />);
    expect(screen.getByText("Juste")).toBeTruthy();

    rerender(<TunerPlate note={null} songKey={null} />);
    expect(screen.queryByText("Juste")).toBeNull();
    expect(screen.getByText("La")).toBeTruthy();
    act(() => {
      vi.advanceTimersByTime(1600);
    });
    expect(screen.getByText("—")).toBeTruthy();
  });
});

describe("TunerPlate vibrato", () => {
  it("shows an active vibrato with its rate and width", () => {
    const { rerender } = render(
      <TunerPlate
        note={note(64, 4)}
        songKey={null}
        vibrato={{ active: true, rateHz: 5.83, extentCents: 21.6 }}
      />,
    );
    expect(screen.getByText("VIBRATO")).toBeTruthy();
    expect(screen.getByText(/5\.8 Hz · ±22 ¢/)).toBeTruthy();
    rerender(
      <TunerPlate
        note={note(64, 4)}
        songKey={null}
        vibrato={{ active: false, rateHz: 0, extentCents: 3 }}
      />,
    );
    expect(screen.queryByText("VIBRATO")).toBeNull();
  });
});

describe("StageSettingsPanel", () => {
  it("edits each setting and the chord source, and restores the defaults", () => {
    const onChange = vi.fn();
    render(<StageSettingsPanel settings={DEFAULT_STAGE_SETTINGS} onChange={onChange} />);
    fireEvent.change(screen.getByLabelText("Fenêtre des accords"), { target: { value: "4" } });
    expect(onChange).toHaveBeenLastCalledWith({ ...DEFAULT_STAGE_SETTINGS, chordWindowSeconds: 4 });
    fireEvent.click(screen.getByText("l'instrument"));
    expect(onChange).toHaveBeenLastCalledWith({ ...DEFAULT_STAGE_SETTINGS, chordSource: "notes" });
    fireEvent.click(screen.getByText("Défauts"));
    expect(onChange).toHaveBeenLastCalledWith(DEFAULT_STAGE_SETTINGS);
  });

  it("speaks English and formats the values", () => {
    render(
      <StageSettingsPanel
        settings={{ ...DEFAULT_STAGE_SETTINGS, songBreakSeconds: 0 }}
        onChange={() => {}}
        notation="en"
      />,
    );
    expect(screen.getByText("Chord window")).toBeTruthy();
    expect(screen.getByText("never")).toBeTruthy();
    expect(screen.getByText("50 %")).toBeTruthy();
  });
});

describe("ChordRibbon", () => {
  it("draws one block per chord, with names and degrees", () => {
    render(
      <ChordRibbon
        reading={chordReading([
          [9, "min", 0, 2],
          [2, "min", 2, 4],
          [4, "dom7", 4, 5],
        ])}
        songKey={A_MINOR}
        width={800}
      />,
    );
    expect(screen.getByText("Lam")).toBeTruthy();
    expect(screen.getByText("Rém")).toBeTruthy();
    expect(screen.getByText("Mi7")).toBeTruthy();
    expect(screen.getByText("iv")).toBeTruthy();
    expect(screen.queryByText(/GRILLE/)).toBeNull();
  });

  it("marks a repeated four-chord loop", () => {
    const loop: [number, "maj" | "min" | "dom7", number, number][] = [];
    const roots: [number, "maj" | "min" | "dom7"][] = [
      [9, "min"],
      [2, "min"],
      [4, "dom7"],
      [9, "min"],
    ];
    for (let i = 0; i < 12; i++) loop.push([...roots[i % 4], i, i + 1]);
    render(<ChordRibbon reading={chordReading(loop)} songKey={null} width={1200} notation="en" />);
    expect(screen.getByText("LOOP ×3")).toBeTruthy();
  });
});
