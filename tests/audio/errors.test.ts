// @vitest-environment node
import { describe, it, expect } from "vitest";

import { MicrophoneError, checkMicrophoneSupport, toMicError } from "../../src/audio/errors";

/** Minimal DOMException stand-in (Node has DOMException, but be explicit). */
function domError(name: string, message = ""): Error {
  const e = new Error(message);
  e.name = name;
  return e;
}

describe("checkMicrophoneSupport", () => {
  const ok = { isSecureContext: true, mediaDevices: { getUserMedia() {} }, AudioContext: class {} };

  it("passes on a capable, secure environment", () => {
    expect(checkMicrophoneSupport(ok)).toBeNull();
  });

  it("reports an insecure context before anything else", () => {
    // On plain http:// mediaDevices is undefined too; the secure-context
    // explanation must win.
    const r = checkMicrophoneSupport({ isSecureContext: false, mediaDevices: undefined });
    expect(r?.code).toBe("insecure-context");
    expect(r?.message).toMatch(/HTTPS|localhost/);
  });

  it("reports an unsupported browser when getUserMedia or AudioContext is missing", () => {
    expect(checkMicrophoneSupport({ ...ok, mediaDevices: undefined })?.code).toBe("unsupported");
    expect(checkMicrophoneSupport({ ...ok, mediaDevices: {} })?.code).toBe("unsupported");
    expect(checkMicrophoneSupport({ ...ok, AudioContext: undefined })?.code).toBe("unsupported");
  });

  it("does not block when isSecureContext is undefined (non-browser hosts)", () => {
    expect(checkMicrophoneSupport({ ...ok, isSecureContext: undefined })).toBeNull();
  });
});

describe("toMicError", () => {
  it.each([
    ["NotAllowedError", "permission-denied"],
    ["PermissionDeniedError", "permission-denied"],
    ["SecurityError", "blocked"],
    ["NotFoundError", "no-device"],
    ["DevicesNotFoundError", "no-device"],
    ["NotReadableError", "device-busy"],
    ["AbortError", "device-busy"],
    ["OverconstrainedError", "constraints"],
    ["TypeError", "unsupported"],
  ])("maps %s to %s", (name, code) => {
    const r = toMicError(domError(name, "raw browser text"));
    expect(r.code).toBe(code);
    expect(r.message).not.toContain("raw browser text");
    expect(r.message.length).toBeGreaterThan(20);
  });

  it("gives an actionable hint for a denied permission", () => {
    expect(toMicError(domError("NotAllowedError")).message).toMatch(/lock icon/);
  });

  it("falls back to an unknown error that keeps the original detail", () => {
    const r = toMicError(new Error("boom"));
    expect(r.code).toBe("unknown");
    expect(r.message).toBe("Could not start the microphone: boom");
    expect(toMicError("plain string").message).toBe("Could not start the microphone: plain string");
    expect(toMicError(new Error("")).message).toBe("Could not start the microphone.");
  });

  it("passes a MicrophoneError through unchanged", () => {
    const e = new MicrophoneError({ code: "no-device", message: "custom" });
    expect(toMicError(e)).toEqual({ code: "no-device", message: "custom" });
    expect(e.name).toBe("MicrophoneError");
    expect(e).toBeInstanceOf(Error);
  });
});
