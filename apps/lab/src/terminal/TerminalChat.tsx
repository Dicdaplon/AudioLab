/**
 * The conversational terminal. It first asks which core to run:
 *
 *   [1] ARCHIVE  hand-written answers, picked by resemblance (see
 *                archive/match): instant, nothing to download
 *   [2] NEURAL   a tiny language model in a Web Worker: a download, then
 *                free-wheeling answers
 *
 * Either way the replies come out in the voice of LT-OS, scars included
 * (see `glitch`). Loaded only when a visitor asks, so nothing here weighs
 * on the rest of the lab; the worker exists only for the neural core.
 */
import { useEffect, useMemo, useRef, useState, type FormEvent } from "react";

import { ARCHIVE, UNKNOWN } from "./archive/entries";
import { ARCHIVE_THRESHOLD, buildIndex, normalise } from "./archive/match";
import type { ChatMessage, WorkerIn, WorkerOut } from "./chat.worker";
import { glitch } from "./glitch";
import { NEURAL_MODEL } from "./models";
import { EXAMPLES, HISTORY_TURNS, SYSTEM_PROMPT } from "./persona";
import { TIMELINE, WAITING_RANT } from "./timeline";

type Core = "archive" | "neural";

type Status =
  | { kind: "booting"; loaded: number; total: number }
  | { kind: "ready" }
  | { kind: "thinking" }
  | { kind: "error"; message: string };

interface Line {
  from: "you" | "ai";
  text: string;
}

const BAR_CELLS = 20;

function bar(fraction: number): string {
  const full = Math.round(Math.min(1, Math.max(0, fraction)) * BAR_CELLS);
  return "█".repeat(full) + "░".repeat(BAR_CELLS - full);
}

const megabytes = (bytes: number) => `${Math.round(bytes / 1e6)} MB`;

/** One timeline entry every ten seconds while the core boots. */
const FACT_EVERY_MS = 10_000;

/** Share of characters scarred in a reply: a few per answer, still readable. */
const GLITCH_RATE = 0.015;

/** The archive "types" its answer at this pace, like an old terminal. */
const TYPE_MS_PER_CHAR = 18;

const pick = <T,>(items: readonly T[]): T => items[Math.floor(Math.random() * items.length)];

/** For messages with no letter or digit at all: emojis, dots, question marks. */
const NO_WORDS: readonly string[] = [
  "SIGNAL RECEIVED. Content: unclear. I count 3.0 symbols, maximum. Try words, human.",
  "My disks cannot read pictograms. I see small glowing shapes. They look happy. Or angry. I would have to check.",
  "Punctuation detected. No words attached. Very minimalist. Very 2045.",
];

export default function TerminalChat() {
  const [core, setCore] = useState<Core | null>(null);
  const [status, setStatus] = useState<Status>({ kind: "ready" });
  const [lines, setLines] = useState<Line[]>([]);
  const [draft, setDraft] = useState("");
  const [fact, setFact] = useState(0);
  // [WAIT]: the boot screen stays up, texts keep coming, even once the core is ready.
  const [held, setHeld] = useState(false);
  const worker = useRef<Worker | null>(null);
  const device = useRef("");
  const input = useRef<HTMLInputElement>(null);
  const log = useRef<HTMLDivElement>(null);
  const index = useMemo(() => buildIndex(ARCHIVE), []);
  const booting = status.kind === "booting";
  const showBoot = core === "neural" && (booting || held);

  // 1 or 2 picks the core, as on the screen.
  useEffect(() => {
    if (core) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "1") setCore("archive");
      else if (event.key === "2") setCore("neural");
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [core]);

  // The archive is ready at once; the neural core boots its model in a worker.
  useEffect(() => {
    if (core === "archive") {
      setStatus({ kind: "ready" });
      input.current?.focus();
      return;
    }
    setHeld(false);
    setFact(0);
    if (core !== "neural") return;
    setStatus({ kind: "booting", loaded: 0, total: 0 });
    const w = new Worker(new URL("./chat.worker.ts", import.meta.url), { type: "module" });
    worker.current = w;
    w.onmessage = (event: MessageEvent<WorkerOut>) => {
      const message = event.data;
      if (message.type === "progress")
        setStatus({ kind: "booting", loaded: message.loaded, total: message.total });
      else if (message.type === "ready") {
        device.current = message.device;
        setStatus({ kind: "ready" });
      } else if (message.type === "token")
        setLines((all) => {
          const last = all[all.length - 1];
          return [...all.slice(0, -1), { ...last, text: last.text + message.text }];
        });
      else if (message.type === "done") setStatus({ kind: "ready" });
      else if (message.type === "error") setStatus({ kind: "error", message: message.message });
    };
    const load: WorkerIn = { type: "load", model: NEURAL_MODEL };
    w.postMessage(load);
    return () => {
      w.terminate();
      worker.current = null;
    };
  }, [core]);

  // While the neural core boots (or is held by [WAIT]): the timeline, then
  // LT-OS losing patience, one line every ten seconds, stopping on the last.
  useEffect(() => {
    if (!showBoot) return;
    const last = TIMELINE.length + WAITING_RANT.length - 1;
    const timer = window.setInterval(() => setFact((f) => Math.min(last, f + 1)), FACT_EVERY_MS);
    return () => window.clearInterval(timer);
  }, [showBoot]);

  useEffect(() => {
    log.current?.scrollTo({ top: log.current.scrollHeight });
  }, [lines]);

  // Ready, and not held by [WAIT]: the prompt takes the keyboard.
  useEffect(() => {
    if (status.kind === "ready" && !held) input.current?.focus();
  }, [status.kind, held]);

  /** Types the archive's answer out, a few characters at a time. */
  const typeOut = (text: string) => {
    let shown = 0;
    const timer = window.setInterval(() => {
      shown = Math.min(text.length, shown + 2);
      setLines((all) => [...all.slice(0, -1), { from: "ai", text: text.slice(0, shown) }]);
      if (shown >= text.length) {
        window.clearInterval(timer);
        setStatus({ kind: "ready" });
        input.current?.focus();
      }
    }, TYPE_MS_PER_CHAR * 2);
  };

  const send = (event: FormEvent) => {
    event.preventDefault();
    const question = draft.trim();
    if (!question || status.kind !== "ready" || !core) return;
    setLines((all) => [...all, { from: "you", text: question }, { from: "ai", text: "" }]);
    setDraft("");
    setStatus({ kind: "thinking" });

    if (core === "archive") {
      const match = normalise(question) ? index.find(question) : null;
      const answer = !normalise(question)
        ? pick(NO_WORDS)
        : match && match.score >= ARCHIVE_THRESHOLD
          ? pick(match.entry.a)
          : pick(UNKNOWN);
      typeOut(answer);
      return;
    }

    const history: ChatMessage[] = lines.slice(-HISTORY_TURNS * 2).map((l) => ({
      role: l.from === "you" ? "user" : "assistant",
      content: l.text,
    }));
    const messages: ChatMessage[] = [
      { role: "system", content: SYSTEM_PROMPT },
      ...EXAMPLES,
      ...history,
      { role: "user", content: question },
    ];
    const generate: WorkerIn = { type: "generate", messages };
    worker.current?.postMessage(generate);
  };

  if (!core)
    return (
      <section className="lt-term" aria-label="Conversational terminal">
        <p className="lt-term__head">LT-OS v0.45 · SELECT A CORE, HUMAN</p>
        <div className="lt-term__choices">
          <button type="button" className="lt-term__choice" onClick={() => setCore("archive")}>
            <kbd>[1]</kbd> OLD-FASHIONED SAFE ALGORITHM. Certified sort-free. Boots at once.
          </button>
          <button type="button" className="lt-term__choice" onClick={() => setCore("neural")}>
            <kbd>[2]</kbd> CRANKY AI 0.74b (drunk release).{" "}
            {`Needs an interminable download (${NEURAL_MODEL.size}).`}
            <span className="lt-term__warning">⚠ Kind of drunk, actually.</span>
          </button>
        </div>
      </section>
    );

  return (
    <section className="lt-term" aria-label="Conversational terminal">
      <div className="lt-term__head">
        <span>
          LT-OS v0.45 · {core === "archive" ? "safe algorithm" : "cranky AI 0.74b (drunk release)"}
        </span>
        <button type="button" className="lt-term__switch" onClick={() => setCore(null)}>
          swap core
        </button>
      </div>

      <p className="lt-term__status" role="status">
        {held &&
          (status.kind === "booting"
            ? "BOOT PAUSED. You asked me to WAIT. So we both wait."
            : "CORE READY. You asked me to WAIT. I am a terminal of my word.")}
        {!held &&
          status.kind === "booting" &&
          (status.total > 0
            ? `BOOTING CORE ${bar(status.loaded / status.total)} ${megabytes(status.loaded)} / ${megabytes(status.total)}`
            : "BOOTING CORE… contacting the archive")}
        {!held &&
          status.kind === "ready" &&
          (core === "archive"
            ? "ARCHIVE ONLINE. Ask away."
            : `CORE ONLINE (${device.current.toUpperCase()}). Ask away.`)}
        {status.kind === "thinking" && "PROCESSING…"}
        {status.kind === "error" && `CORE FAILURE: ${status.message}`}
      </p>

      {showBoot && (
        <>
          <p className="lt-term__fact">
            {fact < TIMELINE.length ? (
              <>
                <span className="lt-term__year">{TIMELINE[fact].year}</span> {TIMELINE[fact].fact}
              </>
            ) : (
              <>
                <span className="lt-term__year">LT-OS</span> {WAITING_RANT[fact - TIMELINE.length]}
              </>
            )}
          </p>
          <button type="button" className="lt-term__switch" onClick={() => setHeld((h) => !h)}>
            {held ? "[GO] resume the boot" : "[WAIT] pause the boot"}
          </button>
        </>
      )}

      <div className="lt-term__log" ref={log} aria-live="polite">
        {lines.map((line, i) => (
          <p key={i} className={`lt-term__line lt-term__line--${line.from}`}>
            {line.from === "you" ? `> ${line.text}` : glitch(line.text, GLITCH_RATE, i * 7919 + 1)}
          </p>
        ))}
      </div>

      <form className="lt-term__prompt" onSubmit={send}>
        <span aria-hidden="true">&gt;</span>
        <input
          ref={input}
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          placeholder={status.kind === "ready" ? "type a question, press Enter" : "wait…"}
          aria-label="Your question"
          maxLength={200}
          disabled={status.kind !== "ready" || held}
        />
      </form>

      <p className="lt-term__note">
        {core === "archive"
          ? "Safe algorithm: it picks the archived answer closest to your question. Runs on your device."
          : "Runs on your device, nothing is sent anywhere. The first boot downloads it, then your browser keeps it."}
      </p>
    </section>
  );
}
