// @vitest-environment jsdom
import { afterEach, describe, it, expect } from "vitest";

import {
  findAudioInput,
  listAudioInputs,
  withDeviceId,
  type AudioInput,
} from "../../src/audio/devices";
import { MIC_CONSTRAINTS } from "../../src/audio/micStream";
import { installWebAudioFakes, type InstalledFakes } from "../helpers/fakeWebAudio";

const FOCUSRITE: AudioInput[] = [
  { deviceId: "default", groupId: "g1", label: "Default - Loopback (Focusrite USB Audio)" },
  { deviceId: "communications", groupId: "g2", label: "Communications - Analogue 1 + 2" },
  { deviceId: "a1", groupId: "g2", label: "Analogue 1 + 2 (Focusrite USB Audio)" },
  { deviceId: "lb", groupId: "g1", label: "Loopback (Focusrite USB Audio)" },
];

describe("findAudioInput", () => {
  it("matches a label substring, ignoring case", () => {
    expect(findAudioInput(FOCUSRITE, "analogue 1")?.deviceId).toBe("a1");
  });

  it("prefers the real device over the default / communications aliases", () => {
    expect(findAudioInput(FOCUSRITE, "Loopback")?.deviceId).toBe("lb");
  });

  it("falls back to an alias when it is the only match", () => {
    expect(findAudioInput(FOCUSRITE, "Default -")?.deviceId).toBe("default");
  });

  it("accepts an exact device id", () => {
    expect(findAudioInput(FOCUSRITE, "lb")?.label).toContain("Loopback");
  });

  it("returns null for an empty query or no match", () => {
    expect(findAudioInput(FOCUSRITE, "  ")).toBeNull();
    expect(findAudioInput(FOCUSRITE, "Scarlett Solo")).toBeNull();
    expect(findAudioInput([], "Loopback")).toBeNull();
  });
});

describe("withDeviceId", () => {
  it("returns the constraints unchanged without a device id", () => {
    expect(withDeviceId(MIC_CONSTRAINTS, undefined)).toBe(MIC_CONSTRAINTS);
  });

  it("pins the device with `exact` and keeps the other audio constraints", () => {
    const c = withDeviceId(MIC_CONSTRAINTS, "lb");
    const audio = c.audio as MediaTrackConstraints;
    expect(audio.deviceId).toEqual({ exact: "lb" });
    expect(audio.autoGainControl).toBe(false);
    expect(audio.echoCancellation).toBe(false);
    expect(c.video).toBe(false);
    // The shared default is not mutated.
    expect((MIC_CONSTRAINTS.audio as MediaTrackConstraints).deviceId).toBeUndefined();
  });

  it("turns `audio: true` into an object and overrides an existing deviceId", () => {
    expect(withDeviceId({ audio: true }, "a1").audio).toEqual({ deviceId: { exact: "a1" } });
    const c = withDeviceId({ audio: { deviceId: "old" } }, "a1");
    expect((c.audio as MediaTrackConstraints).deviceId).toEqual({ exact: "a1" });
  });
});

describe("listAudioInputs", () => {
  let fakes: InstalledFakes | null = null;

  afterEach(() => {
    fakes?.restore();
    fakes = null;
  });

  it("lists only audio inputs, as plain objects", async () => {
    fakes = installWebAudioFakes({
      devices: [
        { deviceId: "lb", groupId: "g1", label: "Loopback" },
        { deviceId: "spk", label: "Speakers", kind: "audiooutput" },
        { deviceId: "cam", label: "Webcam", kind: "videoinput" },
      ],
    });
    expect(await listAudioInputs()).toEqual([{ deviceId: "lb", groupId: "g1", label: "Loopback" }]);
  });

  it("returns [] where there is no mediaDevices", async () => {
    const saved = Object.getOwnPropertyDescriptor(navigator, "mediaDevices");
    Object.defineProperty(navigator, "mediaDevices", { configurable: true, value: undefined });
    try {
      expect(await listAudioInputs({ unlockLabels: true })).toEqual([]);
    } finally {
      if (saved) Object.defineProperty(navigator, "mediaDevices", saved);
      else delete (navigator as unknown as Record<string, unknown>).mediaDevices;
    }
  });

  it("leaves labels hidden without unlockLabels", async () => {
    fakes = installWebAudioFakes({
      devices: [{ deviceId: "lb", label: "Loopback" }],
      hideLabelsUntilPermission: true,
    });
    const inputs = await listAudioInputs();
    expect(inputs[0].label).toBe("");
    expect(fakes.getUserMedia).not.toHaveBeenCalled();
  });

  it("unlocks hidden labels with a throwaway stream, stopped at once", async () => {
    fakes = installWebAudioFakes({
      devices: [{ deviceId: "lb", label: "Loopback" }],
      hideLabelsUntilPermission: true,
    });
    const inputs = await listAudioInputs({ unlockLabels: true });
    expect(inputs[0].label).toBe("Loopback");
    expect(fakes.getUserMedia).toHaveBeenCalledTimes(1);
    const stream = (await fakes.getUserMedia.mock.results[0].value) as MediaStream;
    const track = stream.getTracks()[0] as unknown as { stop: { mock: { calls: unknown[] } } };
    expect(track.stop.mock.calls.length).toBe(1);
  });

  it("does not prompt when the labels are already visible or there is no input", async () => {
    fakes = installWebAudioFakes({ devices: [{ deviceId: "lb", label: "Loopback" }] });
    await listAudioInputs({ unlockLabels: true });
    fakes.setDevices([]);
    expect(await listAudioInputs({ unlockLabels: true })).toEqual([]);
    expect(fakes.getUserMedia).not.toHaveBeenCalled();
  });
});
