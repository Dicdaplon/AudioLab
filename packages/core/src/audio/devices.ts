/**
 * Audio input selection: list the capture devices, find one by name, and put
 * its id into the getUserMedia constraints.
 *
 * Browsers hide device labels until the page has been granted a microphone
 * once, so a host that matches inputs by name ("Loopback", "Analogue 1")
 * lists with `unlockLabels`: when every label is empty, a throwaway stream is
 * opened and stopped, and the list is read again.
 *
 * Chrome on Windows adds two aliases, `default` and `communications`,
 * labelled after the device they point to ("Default - Loopback (...)").
 * `findAudioInput` prefers the real device over its alias, so the id it
 * returns stays valid when the Windows default changes.
 */

/** One capture device, as a plain object (not a live `MediaDeviceInfo`). */
export interface AudioInput {
  deviceId: string;
  groupId: string;
  /** Empty until the page has been granted microphone access once. */
  label: string;
}

export interface ListAudioInputsOptions {
  /**
   * When every label is empty, open and immediately stop a stream so the
   * browser reveals the labels, then list again. Prompts for permission the
   * first time. Default false.
   */
  unlockLabels?: boolean;
}

/** Ids Chrome uses for aliases of a real device. */
const ALIAS_IDS = new Set(["default", "communications"]);

interface MediaDevicesLike {
  enumerateDevices?: () => Promise<MediaDeviceInfo[]>;
  getUserMedia?: (constraints: MediaStreamConstraints) => Promise<MediaStream>;
}

function mediaDevices(): MediaDevicesLike | undefined {
  const g = globalThis as unknown as { navigator?: { mediaDevices?: MediaDevicesLike } };
  return g.navigator?.mediaDevices;
}

async function enumerateInputs(devices: MediaDevicesLike): Promise<AudioInput[]> {
  const all = await devices.enumerateDevices!();
  return all
    .filter((d) => d.kind === "audioinput")
    .map((d) => ({ deviceId: d.deviceId, groupId: d.groupId, label: d.label }));
}

/**
 * The audio inputs the browser exposes. Resolves to `[]` where there is no
 * `navigator.mediaDevices` (server, insecure context), so it is safe to call
 * anywhere.
 */
export async function listAudioInputs(options: ListAudioInputsOptions = {}): Promise<AudioInput[]> {
  const devices = mediaDevices();
  if (typeof devices?.enumerateDevices !== "function") return [];
  const inputs = await enumerateInputs(devices);
  const unlabelled = inputs.length > 0 && inputs.every((i) => i.label === "");
  if (!options.unlockLabels || !unlabelled || typeof devices.getUserMedia !== "function") {
    return inputs;
  }
  const stream = await devices.getUserMedia({ audio: true, video: false });
  for (const track of stream.getTracks()) track.stop();
  return enumerateInputs(devices);
}

/**
 * The input whose id equals `query`, or whose label contains it (case
 * insensitive). Real devices win over the `default` / `communications`
 * aliases; an alias is returned only when nothing else matches. Null when
 * the query is empty or matches nothing.
 */
export function findAudioInput(inputs: readonly AudioInput[], query: string): AudioInput | null {
  const q = query.trim();
  if (!q) return null;
  const byId = inputs.find((i) => i.deviceId === q);
  if (byId) return byId;
  const needle = q.toLowerCase();
  const matches = inputs.filter((i) => i.label.toLowerCase().includes(needle));
  return matches.find((i) => !ALIAS_IDS.has(i.deviceId)) ?? matches[0] ?? null;
}

/**
 * `constraints` with the audio track pinned to `deviceId` (`exact`, so a
 * missing device fails instead of silently falling back to the default).
 * `audio: true` becomes an object; an explicit `deviceId` in the constraints
 * is overridden. Returned unchanged when `deviceId` is undefined.
 */
export function withDeviceId(
  constraints: MediaStreamConstraints,
  deviceId: string | undefined,
): MediaStreamConstraints {
  if (deviceId === undefined) return constraints;
  const audio = typeof constraints.audio === "object" ? constraints.audio : {};
  return { ...constraints, audio: { ...audio, deviceId: { exact: deviceId } } };
}
