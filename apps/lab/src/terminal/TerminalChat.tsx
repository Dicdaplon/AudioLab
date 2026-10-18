/**
 * The conversational terminal: boots a small model in a Web Worker, then
 * answers in the voice of LT-OS, scars included (see `glitch`). Loaded only
 * when a visitor asks for it, so nothing here weighs on the rest of the lab.
 */
import { useEffect, useRef, useState, type FormEvent } from "react";

import type { ChatMessage, WorkerIn, WorkerOut } from "./chat.worker";
import { glitch } from "./glitch";
import { TERMINAL_MODELS, type TerminalModel } from "./models";
import { HISTORY_TURNS, SYSTEM_PROMPT } from "./persona";
import { TIMELINE } from "./timeline";

type Status =
  | { kind: "booting"; loaded: number; total: number }
  | { kind: "ready"; device: string }
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

export default function TerminalChat() {
  const worker = useRef<Worker | null>(null);
  const device = useRef("wasm");
  const [model, setModel] = useState<TerminalModel>(TERMINAL_MODELS[0]);
  const [status, setStatus] = useState<Status>({ kind: "booting", loaded: 0, total: 0 });
  const [lines, setLines] = useState<Line[]>([]);
  const [draft, setDraft] = useState("");
  const input = useRef<HTMLInputElement>(null);
  const log = useRef<HTMLDivElement>(null);
  const [fact, setFact] = useState(0);
  const booting = status.kind === "booting";

  // The archive reads its timeline aloud while the core boots.
  useEffect(() => {
    if (!booting) return;
    const timer = window.setInterval(
      () => setFact((f) => (f + 1) % TIMELINE.length),
      FACT_EVERY_MS,
    );
    return () => window.clearInterval(timer);
  }, [booting]);

  // One worker for the terminal's life; it boots the chosen model.
  useEffect(() => {
    const w = new Worker(new URL("./chat.worker.ts", import.meta.url), { type: "module" });
    worker.current = w;
    w.onmessage = (event: MessageEvent<WorkerOut>) => {
      const message = event.data;
      if (message.type === "progress")
        setStatus({ kind: "booting", loaded: message.loaded, total: message.total });
      else if (message.type === "ready") {
        device.current = message.device;
        setStatus({ kind: "ready", device: message.device });
        input.current?.focus();
      } else if (message.type === "token")
        setLines((all) => {
          const last = all[all.length - 1];
          return [...all.slice(0, -1), { ...last, text: last.text + message.text }];
        });
      else if (message.type === "done") setStatus({ kind: "ready", device: device.current });
      else if (message.type === "error") setStatus({ kind: "error", message: message.message });
    };
    return () => w.terminate();
  }, []);

  useEffect(() => {
    setStatus({ kind: "booting", loaded: 0, total: 0 });
    const message: WorkerIn = { type: "load", model };
    worker.current?.postMessage(message);
  }, [model]);

  useEffect(() => {
    log.current?.scrollTo({ top: log.current.scrollHeight });
  }, [lines]);

  const send = (event: FormEvent) => {
    event.preventDefault();
    const question = draft.trim();
    if (!question || status.kind !== "ready") return;
    const history: ChatMessage[] = lines.slice(-HISTORY_TURNS * 2).map((l) => ({
      role: l.from === "you" ? "user" : "assistant",
      content: l.text,
    }));
    const messages: ChatMessage[] = [
      { role: "system", content: SYSTEM_PROMPT },
      ...history,
      { role: "user", content: question },
    ];
    setLines((all) => [...all, { from: "you", text: question }, { from: "ai", text: "" }]);
    setDraft("");
    setStatus({ kind: "thinking" });
    const message: WorkerIn = { type: "generate", messages };
    worker.current?.postMessage(message);
  };

  return (
    <section className="lt-term" aria-label="Conversational terminal">
      <div className="lt-term__head">
        <span>LT-OS v0.45</span>
        <label className="lt-term__model">
          <span>core</span>
          <select
            value={model.id}
            disabled={status.kind === "thinking"}
            onChange={(e) =>
              setModel(TERMINAL_MODELS.find((m) => m.id === e.target.value) ?? TERMINAL_MODELS[0])
            }
          >
            {TERMINAL_MODELS.map((m) => (
              <option key={m.id} value={m.id}>
                {m.label} · {m.size}
              </option>
            ))}
          </select>
        </label>
      </div>

      <p className="lt-term__status" role="status">
        {status.kind === "booting" &&
          (status.total > 0
            ? `BOOTING CORE ${bar(status.loaded / status.total)} ${megabytes(status.loaded)} / ${megabytes(status.total)}`
            : "BOOTING CORE… contacting the archive")}
        {status.kind === "ready" && `CORE ONLINE (${status.device.toUpperCase()}). Ask away.`}
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
        Runs on your device; nothing is sent anywhere. The first boot downloads the core, then your
        browser keeps it. It makes things up.
      </p>
    </section>
  );
}
