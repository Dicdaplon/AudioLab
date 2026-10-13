import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";

import type { MicrophoneSession } from "@audiolab/react";
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

// The microphone session (with its environment check) is the only part of the
// SDK the shell test replaces; everything else renders for real (idle).
vi.mock("@audiolab/react", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@audiolab/react")>()),
  useMicrophone: () => session,
}));

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
    canvas.restore();
    vi.clearAllMocks();
  });

  it("renders the shell with the detector tab selected and no French copy", () => {
    render(<App />);
    expect(screen.getByRole("heading", { level: 1 }).textContent).toBe("loup(e) — audio lab");
    expect(screen.getByRole("tab", { name: "Detector", selected: true })).toBeTruthy();
    expect(screen.getByRole("tabpanel").id).toBe("panel-detector");
    expect(screen.getByRole("group", { name: "Estimated key" })).toBeTruthy();
    expect(document.body.textContent).not.toMatch(/Détecteur|Démarrer|seuil|fenêtre/);
    expect(screen.queryByRole("alert")).toBeNull();
  });

  it("switches tabs and starts the microphone from the transport", () => {
    render(<App />);
    fireEvent.click(screen.getByRole("tab", { name: "Chord game" }));
    expect(screen.getByRole("tabpanel").id).toBe("panel-game");
    expect(screen.getByRole("group", { name: "Target chord" })).toBeTruthy();

    fireEvent.click(screen.getByRole("tab", { name: "Wolf Jumper" }));
    expect(screen.getByRole("img", { name: "the wolf" })).toBeTruthy();

    fireEvent.click(screen.getByRole("tab", { name: "FFT" }));
    expect(document.querySelector(".al-fft__status")?.textContent).toMatch(/Start the microphone/);

    fireEvent.click(screen.getByRole("button", { name: /start mic/i }));
    expect(session.start).toHaveBeenCalledTimes(1);
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

  it("shows Stop while live", () => {
    session.running = true;
    render(<App />);
    expect(screen.getByText("Live")).toBeTruthy();
    fireEvent.click(screen.getByRole("button", { name: /stop/i }));
    expect(session.stop).toHaveBeenCalledTimes(1);
  });
});
