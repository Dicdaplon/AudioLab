import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";

import type { PitchEstimate } from "@audiolab/core";
import type { MicrophoneSession, PitchState } from "@audiolab/react";
import {
  installCanvasStub,
  type CanvasRecorder,
} from "../../../packages/react/tests/helpers/canvasStub";

const session: MicrophoneSession & { start: () => void; stop: () => void } = {
  mic: null,
  running: false,
  starting: false,
  error: null,
  unsupported: null,
  start: vi.fn(),
  stop: vi.fn(),
};

/** What the (mocked) pitch hook reports; `null` keeps the real hook. */
const pitch: { state: PitchState | null } = { state: null };
/** Presence histogram injected into the real `useTonality` result; `null` keeps it. */
const presence: { histogram: Float32Array | null } = { histogram: null };

// The microphone session (with its environment check) is the only part of the
// SDK the shell test replaces by default; everything else renders for real
// (idle). The pitch hook and the presence histogram can be overridden per test.
vi.mock("@audiolab/react", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@audiolab/react")>();
  return {
    ...actual,
    useMicrophone: () => session,
    usePitch: (...args: Parameters<typeof actual.usePitch>) => {
      const real = actual.usePitch(...args);
      return pitch.state ?? real;
    },
    useTonality: (...args: Parameters<typeof actual.useTonality>) => {
      const real = actual.useTonality(...args);
      return presence.histogram ? { ...real, presenceHistogram: presence.histogram } : real;
    },
  };
});

import App from "../src/App";

describe("App", () => {
  let canvas: CanvasRecorder;

  beforeEach(() => {
    canvas = installCanvasStub(900);
    session.running = false;
    session.starting = false;
    session.error = null;
    session.unsupported = null;
    localStorage.clear();
    delete document.documentElement.dataset.theme;
  });

  afterEach(() => {
    cleanup();
    history.replaceState(null, "", "/");
    canvas.restore();
    vi.clearAllMocks();
  });

  /** Opens a page: its room in the top bar, then its tab in the room. */
  const ROOM: Record<string, string> = {
    "Chords & keys": "Harmony Lab",
    Scales: "Harmony Lab",
    Tuner: "Harmony Lab",
    Spectrum: "Harmony Lab",
    "Play along": "Rhythm Lab",
    Tempo: "Rhythm Lab",
    "Chord game": "Game Room",
    "Wolf Jumper": "Game Room",
  };
  const open = (page: string) => {
    fireEvent.click(screen.getByRole("tab", { name: ROOM[page] }));
    fireEvent.click(screen.getByRole("tab", { name: page }));
  };
  const page = () => document.querySelector(".lab-page") as HTMLElement;

  it("renders the shell with the detector tab selected and no French copy", () => {
    render(<App />);
    expect(screen.getByRole("heading", { level: 1 }).textContent).toBe("loloupTech — audio lab");
    expect(screen.getByRole("tab", { name: "Harmony Lab", selected: true })).toBeTruthy();
    expect(screen.getByRole("tab", { name: "Chords & keys", selected: true })).toBeTruthy();
    expect(page().id).toBe("panel-detector");
    expect(screen.getByRole("group", { name: "Estimated key" })).toBeTruthy();
    expect(document.body.textContent).not.toMatch(/Détecteur|Démarrer|seuil|fenêtre/);
    expect(screen.queryByRole("alert")).toBeNull();
  });

  it("switches tabs and starts the microphone from the transport", () => {
    render(<App />);
    open("Chord game");
    expect(page().id).toBe("panel-game");
    expect(location.hash).toBe("#game");
    expect(screen.getByRole("group", { name: "Target chord" })).toBeTruthy();

    open("Wolf Jumper");
    expect(screen.getByRole("img", { name: "the wolf" })).toBeTruthy();

    open("Tempo");
    expect(document.querySelector(".al-fft__status")?.textContent).toMatch(/Start the microphone/);
    expect(screen.queryByRole("heading", { name: "Magnitude spectrum" })).toBeNull();

    fireEvent.click(screen.getByRole("button", { name: /start mic/i }));
    expect(session.start).toHaveBeenCalledTimes(1);
  });

  it("comes back to the last page of a room, and opens the page named in the URL", () => {
    render(<App />);
    open("Wolf Jumper");
    fireEvent.click(screen.getByRole("tab", { name: "Rhythm Lab" }));
    expect(page().id).toBe("panel-rhythm");
    fireEvent.click(screen.getByRole("tab", { name: "Game Room" }));
    expect(page().id).toBe("panel-jumper");
    cleanup();
    history.replaceState(null, "", "#scales");
    render(<App />);
    expect(page().id).toBe("panel-scales");
  });

  it("shows a failed start as an alert with a retry and an error LED", () => {
    session.error = "Microphone access was denied.";
    render(<App />);
    expect(screen.getByRole("alert").textContent).toContain("Microphone access was denied.");
    fireEvent.click(screen.getByRole("button", { name: /try again/i }));
    expect(session.start).toHaveBeenCalledTimes(1);
    expect(screen.getByText("Error")).toBeTruthy();
  });

  it("flags an unsupported environment and disables the transport", () => {
    session.unsupported = { code: "insecure-context", message: "Needs HTTPS." };
    render(<App />);
    expect(screen.getByRole("alert").textContent).toContain("Needs HTTPS.");
    expect(screen.getByRole("button", { name: /start mic/i })).toHaveProperty("disabled", true);
    expect(screen.getByText("Unavailable")).toBeTruthy();
  });

  it("offers the chord vocabulary, the match policy and the note source where they apply", () => {
    render(<App />);
    const vocabulary = screen.getByLabelText("Chords it knows") as HTMLSelectElement;
    expect(vocabulary.value).toBe("triads");
    expect(document.body.textContent).toContain("A C7 is read as C.");
    expect(screen.queryByLabelText("A chord counts when")).toBeNull();

    open("Chord game");
    const pools = () =>
      Array.from((screen.getByLabelText("Chord set") as HTMLSelectElement).options, (o) => o.value);
    expect(pools()).not.toContain("open-sevenths");
    fireEvent.change(screen.getByLabelText("Chords it knows"), { target: { value: "sevenths" } });
    expect(pools()).toContain("open-sevenths");
    expect(pools()).not.toContain("suspended");
    fireEvent.change(screen.getByLabelText("Chords it knows"), { target: { value: "all" } });
    expect(pools()).toContain("suspended");
    fireEvent.change(screen.getByLabelText("A chord counts when"), { target: { value: "triad" } });
    expect(screen.getByText(/The plain chord counts too/)).toBeTruthy();

    open("Wolf Jumper");
    // The pitch tracker by default: the chroma hears the fifth of the low strings.
    expect((screen.getByLabelText("Note detection") as HTMLSelectElement).value).toBe("pitch");
    fireEvent.change(screen.getByLabelText("Note detection"), { target: { value: "chroma" } });
    expect((screen.getByLabelText("Note detection") as HTMLSelectElement).value).toBe("chroma");
  });

  it("speaks to players, not to the detector", () => {
    render(<App />);
    for (const tab of ["Chord game", "Wolf Jumper"]) {
      open(tab);
      const copy = page().cloneNode(true) as HTMLElement;
      copy.querySelectorAll(".al-how").forEach((h) => h.remove());
      expect(copy.textContent).not.toMatch(
        /frame|top-1|probability|chroma bin|smoothing|confirmation|MPM/i,
      );
    }
  });

  it("shows the rhythm exercises in plain words, with the timing diagnostics beside them", () => {
    render(<App />);
    open("Play along");
    expect(page().id).toBe("panel-rhythm");
    const panel = (title: string) =>
      screen.getByRole("heading", { name: title }).closest("section") as HTMLElement;
    const play = () => panel("Play in time");
    expect(screen.getByLabelText("Rhythm", { selector: "select" })).toBeTruthy();
    expect(play().textContent).toMatch(/Start the microphone first/);
    fireEvent.change(screen.getByLabelText("Exercise"), { target: { value: "written" } });
    expect(play().textContent).toMatch(/play the rhythm/i);

    fireEvent.change(screen.getByLabelText("Exercise"), { target: { value: "notes" } });
    expect(play().textContent).toMatch(/Start the microphone first/);
    fireEvent.change(screen.getByLabelText("Exercise"), { target: { value: "chords" } });
    expect(screen.getByRole("button", { name: "Start" })).toHaveProperty("disabled", true);
    // The How? sheet explains the machinery on purpose; the rest speaks to players.
    const copy = play().cloneNode(true) as HTMLElement;
    copy.querySelectorAll(".al-how").forEach((h) => h.remove());
    expect(copy.textContent).not.toMatch(
      /frame|onset|latency|probability|chroma|flux|\bdB\b|\bms\b/i,
    );

    // The diagnostics are where the numbers live.
    expect(panel("Timing").textContent).toMatch(/Reaction delay/);
    expect(panel("Listening").textContent).toMatch(/Waiting for the microphone/);
    // The threshold follows the room unless set by hand.
    expect(screen.queryByRole("slider", { name: "Count a note above" })).toBeNull();
    fireEvent.click(screen.getByRole("switch", { name: "Set the threshold myself" }));
    expect(screen.getByRole("slider", { name: "Count a note above" })).toHaveProperty(
      "value",
      "-50",
    );
  });

  it("offers a How? sheet under every feature", () => {
    render(<App />);
    const topics: Record<string, string[]> = {
      "Chords & keys": [
        "three answers, one question",
        "what the knobs change",
        "what a chroma is",
        "the last 1 s, averaged",
        "the last 8 s, averaged",
        "the last 30 s, averaged",
        "ranking the chords",
        "ranking the keys",
        "ranking the keys",
        "who showed up, not who was loud",
        "finding the key",
        "naming the chord",
      ],
      Tuner: ["reading the pitch"],
      Scales: ["matching scales"],
      Spectrum: ["the spectrum"],
      "Chord game": ["when a chord counts"],
      "Wolf Jumper": ["notes, and a gate with no knob"],
      "Play along": ["grading the timing", "when a note starts", "latency and tolerance"],
      Tempo: ["the tempo"],
    };
    for (const [tab, expected] of Object.entries(topics)) {
      open(tab);
      const found = Array.from(document.querySelectorAll(".al-how__topic"), (t) => t.textContent);
      expect(found).toEqual(expected);
    }
  });

  it("shows Stop while live", () => {
    session.running = true;
    render(<App />);
    expect(screen.getByText("Live")).toBeTruthy();
    fireEvent.click(screen.getByRole("button", { name: /stop/i }));
    expect(session.stop).toHaveBeenCalledTimes(1);
  });

  describe("tuner tab", () => {
    const estimate = (overrides: Partial<PitchEstimate> = {}): PitchEstimate => ({
      frequency: 445,
      midi: 69,
      pitchClass: 9,
      cents: 19.6,
      clarity: 0.97,
      ...overrides,
    });

    afterEach(() => {
      pitch.state = null;
    });

    it("prompts for the microphone and waits for a note while idle", () => {
      render(<App />);
      open("Tuner");
      expect(page().id).toBe("panel-tuner");
      expect(document.querySelector(".al-notice--mic")).not.toBeNull();
      expect(screen.getByRole("group", { name: "Detected note" }).textContent).toContain(
        "Waiting for signal",
      );
      expect(
        screen.getByRole("meter", { name: "deviation in cents" }).hasAttribute("data-active"),
      ).toBe(false);
      expect(screen.getByRole("slider", { name: "Reference A4" })).toHaveProperty("value", "440");
    });

    it("shows the note, its octave, the cents and the frequency", () => {
      session.running = true;
      pitch.state = { estimate: estimate(), captureMethod: "worklet" };
      render(<App />);
      open("Tuner");

      const note = screen.getByRole("group", { name: "Detected note" });
      expect(note.querySelector(".al-readout__value")?.textContent).toBe("A4");
      expect(note.textContent).toContain("+19.6 cents");
      expect(note.hasAttribute("data-intune")).toBe(false);
      const meter = screen.getByRole("meter", { name: "deviation in cents" });
      expect(meter.getAttribute("aria-valuenow")).toBe("20");
      expect(meter.style.getPropertyValue("--cents")).toBe("19.6");
      expect(screen.getByText("445.0").textContent).toBe("445.0 Hz");
      expect(document.querySelector(".al-notice--mic")).toBeNull();
    });

    it("marks a note within 5 cents as in tune and shows flat deviations with a minus", () => {
      session.running = true;
      pitch.state = {
        estimate: estimate({ frequency: 130.3, midi: 48, pitchClass: 0, cents: -3.2 }),
        captureMethod: "analyser",
      };
      render(<App />);
      open("Tuner");
      const note = screen.getByRole("group", { name: "Detected note" });
      expect(note.querySelector(".al-readout__value")?.textContent).toBe("C3");
      expect(note.hasAttribute("data-intune")).toBe(true);
      expect(note.textContent).toContain("−3.2 cents");
      expect(
        screen.getByRole("meter", { name: "deviation in cents" }).hasAttribute("data-intune"),
      ).toBe(true);
    });

    it("changes the reference A4 from the slider", () => {
      render(<App />);
      open("Tuner");
      fireEvent.change(screen.getByRole("slider", { name: "Reference A4" }), {
        target: { value: "442" },
      });
      expect(screen.getByRole("group", { name: "Detected note" }).textContent).toContain(
        "A4 = 442 Hz",
      );
    });
  });

  describe("scales tab", () => {
    afterEach(() => {
      presence.histogram = null;
    });

    it("waits for signal while nothing was heard", () => {
      render(<App />);
      open("Scales");
      expect(page().id).toBe("panel-scales");
      expect(screen.queryByRole("list", { name: "Matching scales" })).toBeNull();
      expect(document.body.textContent).toContain("Waiting for signal");
      expect(document.querySelector(".al-notice--mic")).not.toBeNull();
    });

    it("ranks the scales containing the notes heard and lists what is missing", () => {
      session.running = true;
      const histogram = new Float32Array(12);
      for (const pc of [0, 2, 4, 7, 9]) histogram[pc] = 0.8; // C D E G A
      histogram[11] = 0.1; // a faint B, under the default threshold
      presence.histogram = histogram;
      render(<App />);
      open("Scales");

      const rows = screen.getAllByRole("listitem");
      expect(rows[0].textContent).toContain("C major pentatonic");
      expect(rows[0].textContent).toContain("complete");
      expect(rows[1].textContent).toContain("A minor pentatonic");
      expect(rows[2].textContent).toContain("A blues");
      expect(rows[2].textContent).toContain("missing D#");
      expect(rows).toHaveLength(8);
      expect(document.querySelector(".al-notice--mic")).toBeNull();

      // Lowering the threshold counts the faint B: the pentatonics now have an outside note.
      fireEvent.change(screen.getByRole("slider", { name: "Presence threshold" }), {
        target: { value: "0.05" },
      });
      const after = screen.getAllByRole("listitem");
      expect(after[0].textContent).toContain("C major");
      expect(after[0].textContent).toContain("missing F");
    });
  });

  it("shows the about page with a link to l’école du loup(é)", () => {
    render(<App />);
    fireEvent.click(screen.getByRole("tab", { name: "About" }));
    expect(screen.getByRole("heading", { name: /research library/i })).toBeTruthy();
    const link = screen.getByRole("link", { name: "ecoleduloup.fr" });
    expect(link.getAttribute("href")).toBe("https://ecoleduloup.fr");
  });
});
