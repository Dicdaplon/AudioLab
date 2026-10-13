/**
 * Microphone / Web Audio error mapping.
 *
 * Browsers report capture failures as DOMExceptions with terse, technical
 * messages ("Permission denied", "Requested device not found"). This module
 * turns them, and the environment checks that must run before calling
 * getUserMedia, into a stable error code plus an actionable English message.
 */

export type MicErrorCode =
  | "insecure-context"
  | "unsupported"
  | "permission-denied"
  | "blocked"
  | "no-device"
  | "device-busy"
  | "constraints"
  | "unknown";

export interface MicErrorInfo {
  code: MicErrorCode;
  message: string;
}

const MESSAGES: Record<Exclude<MicErrorCode, "unknown">, string> = {
  "insecure-context":
    "Microphone access requires a secure context: open this page over HTTPS or on localhost.",
  unsupported:
    "This browser does not support microphone capture with the Web Audio API. Try a recent Chrome, Firefox, Edge or Safari.",
  "permission-denied":
    "Microphone access was denied. Allow the microphone for this site (lock icon in the address bar) and try again.",
  blocked: "Microphone access is blocked by the browser or by the page's permissions policy.",
  "no-device": "No microphone was found. Connect or enable one and try again.",
  "device-busy":
    "The microphone could not be started. It may be in use by another application or tab.",
  constraints: "The microphone does not support the requested audio settings.",
};

/** Error thrown by the audio layer; carries a stable `code`. */
export class MicrophoneError extends Error {
  readonly code: MicErrorCode;

  constructor(info: MicErrorInfo, options?: { cause?: unknown }) {
    super(info.message, options);
    this.name = "MicrophoneError";
    this.code = info.code;
  }
}

/** Subset of the global environment the support check looks at. */
export interface MicEnvironment {
  isSecureContext?: boolean;
  mediaDevices?: { getUserMedia?: unknown } | undefined;
  AudioContext?: unknown;
}

function defaultEnvironment(): MicEnvironment {
  const g = globalThis as unknown as {
    isSecureContext?: boolean;
    navigator?: { mediaDevices?: { getUserMedia?: unknown } };
    AudioContext?: unknown;
    webkitAudioContext?: unknown;
  };
  return {
    isSecureContext: g.isSecureContext,
    mediaDevices: g.navigator?.mediaDevices,
    AudioContext: g.AudioContext ?? g.webkitAudioContext,
  };
}

/**
 * Check that the environment can capture audio at all. Returns `null` when
 * everything needed is present, otherwise the error to show.
 *
 * On plain http:// (not localhost) `navigator.mediaDevices` is undefined, so
 * the secure-context check runs first to give the right explanation.
 */
export function checkMicrophoneSupport(
  env: MicEnvironment = defaultEnvironment(),
): MicErrorInfo | null {
  if (env.isSecureContext === false) {
    return { code: "insecure-context", message: MESSAGES["insecure-context"] };
  }
  if (
    typeof env.mediaDevices?.getUserMedia !== "function" ||
    typeof env.AudioContext !== "function"
  ) {
    return { code: "unsupported", message: MESSAGES.unsupported };
  }
  return null;
}

function nameOf(err: unknown): string {
  if (err instanceof MicrophoneError) return "";
  if (typeof err === "object" && err !== null && "name" in err) {
    return String((err as { name: unknown }).name);
  }
  return "";
}

function messageOf(err: unknown): string {
  if (err instanceof Error) return err.message;
  return String(err);
}

/** Map any thrown value (DOMException, Error, string) to a MicErrorInfo. */
export function toMicError(err: unknown): MicErrorInfo {
  if (err instanceof MicrophoneError) return { code: err.code, message: err.message };

  switch (nameOf(err)) {
    case "NotAllowedError":
    case "PermissionDeniedError":
      return { code: "permission-denied", message: MESSAGES["permission-denied"] };
    case "SecurityError":
      return { code: "blocked", message: MESSAGES.blocked };
    case "NotFoundError":
    case "DevicesNotFoundError":
      return { code: "no-device", message: MESSAGES["no-device"] };
    case "NotReadableError":
    case "TrackStartError":
    case "AbortError":
      return { code: "device-busy", message: MESSAGES["device-busy"] };
    case "OverconstrainedError":
    case "ConstraintNotSatisfiedError":
      return { code: "constraints", message: MESSAGES.constraints };
    case "TypeError":
      // getUserMedia throws a TypeError when called with no media requested
      // or on an insecure origin in some browsers.
      return { code: "unsupported", message: MESSAGES.unsupported };
    default: {
      const detail = messageOf(err).trim();
      return {
        code: "unknown",
        message: detail
          ? `Could not start the microphone: ${detail}`
          : "Could not start the microphone.",
      };
    }
  }
}
