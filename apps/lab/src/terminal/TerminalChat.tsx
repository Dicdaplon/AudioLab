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
import { ARCHIVE_THRESHOLD, buildIndex } from "./archive/match";
import type { ChatMessage, WorkerIn, WorkerOut } from "./chat.worker";
import { glitch } from "./glitch";
import { NEURAL_MODEL } from "./models";
import { EXAMPLES, HISTORY_TURNS, SYSTEM_PROMPT } from "./persona";
import { TIMELINE } from "./timeline";

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

export default function TerminalChat() {
  const [core, setCore] = useState<Core | null>(null);
  const [status, setStatus] = useState<Status>({ kind: "ready" });
  const [lines, setLines] = useState<Line[]>([]);
  const [draft, setDraft] = useState("");
  const [fact, setFact] = useState(0);
  const worker = useRef<Worker | null>(null);
  const device = useRef("");
  const input = useRef<HTMLInputElement>(null);
  const log = useRef<HTMLDivElement>(null);
  const index = useMemo(() => buildIndex(ARCHIVE), []);
  const booting = status.kind === "booting";

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
        input.current?.focus();
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

  // The timeline is read out while the neural core boots.
  useEffect(() => {
    if (!booting) return;
    const timer = window.setInterval(
      () => setFact((f) => (f + 1) % TIMELINE.length),
      FACT_EVERY_MS,
    );
    return () => window.clearInterval(timer);
  }, [booting]);

  useEffect(() => {
    log.current?.scrollTo({ top: log.current.scrollHeight });
  }, [lines]);

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
      const match = index.find(question);
      const answer =
        match && match.score >= ARCHIVE_THRESHOLD ? pick(match.entry.a) : pick(UNKNOWN);
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
        <p className="lt-term__head">LT-OS v0.45 · select a core</p>
        <div className="lt-term__choices">
          <button type="button" className="lt-term__choice" onClick={() => setCore("archive")}>
            <kbd>[1]</kbd> ARCHIVE: hand-written memory, instant, nothing to download.
          </button>
          <button type="button" className="lt-term__choice" onClick={() => setCore("neural")}>
            <kbd>[2]</kbd> NEURAL CORE: a tiny AI, {NEURAL_MODEL.size} to download. Unhinged.
          </button>
        </div>
      </section>
    );

  return (
    <section className="lt-term" aria-label="Conversational terminal">
      <div className="lt-term__head">
        <span>LT-OS v0.45 · {core === "archive" ? "archive core" : NEURAL_MODEL.label}</span>
        <button type="button" className="lt-term__switch" onClick={() => setCore(null)}>
          change core
        </button>
      </div>

      <p className="lt-term__status" role="status">
        {status.kind === "booting" &&
          (status.total > 0
            ? `BOOTING CORE ${bar(status.loaded / status.total)} ${megabytes(status.loaded)} / ${megabytes(status.total)}`
            : "BOOTING CORE… contacting the archive")}
        {status.kind === "ready" &&
          (core === "archive"
            ? "ARCHIVE ONLINE. Ask away."
            : `CORE ONLINE (${device.current.toUpperCase()}). Ask away.`)}
        {status.kind === "thinking" && "PROCESSING…"}
        {status.kind === "error" && `CORE FAILURE: ${status.message}`}
      </p>

      {booting && (
        <p className="lt-term__fact">
          <span className="lt-term__year">{TIMELINE[fact].year}</span> {TIMELINE[fact].fact}
        </p>
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
          disabled={status.kind !== "ready"}
        />
      </form>

      <p className="lt-term__note">
        {core === "archive"
          ? "Hand-written answers, matched to your question by resemblance. Runs on your device."
          : "Runs on your device; nothing is sent anywhere. The first boot downloads the core, then your browser keeps it. It makes things up."}
      </p>
    </section>
  );
}
