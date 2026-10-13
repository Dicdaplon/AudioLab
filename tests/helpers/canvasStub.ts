/**
 * Minimal 2D canvas stub for jsdom: records every method call made on the
 * context so component tests can assert drawing behaviour (not pixels).
 */
import { vi } from "vitest";

export interface CanvasCall {
  method: string;
  args: unknown[];
}

export interface CanvasRecorder {
  calls: CanvasCall[];
  /** Calls to a given method. */
  of(method: string): CanvasCall[];
  /** Restore the original getContext / clientWidth. */
  restore(): void;
}

/**
 * Install the stub. `clientWidth` reports `width` for every element so the
 * plots (which read `parentElement.clientWidth`) get a usable size.
 */
export function installCanvasStub(width = 600): CanvasRecorder {
  const calls: CanvasCall[] = [];
  const context = new Proxy(
    {},
    {
      get(_target, prop) {
        if (typeof prop !== "string") return undefined;
        // Style properties are plain assignable fields.
        if (
          ["fillStyle", "strokeStyle", "lineWidth", "font", "textAlign", "textBaseline"].includes(
            prop,
          )
        ) {
          return undefined;
        }
        return (...args: unknown[]) => {
          calls.push({ method: prop, args });
          return undefined;
        };
      },
      set() {
        return true;
      },
    },
  );

  const originalGetContext = HTMLCanvasElement.prototype.getContext;
  const originalClientWidth = Object.getOwnPropertyDescriptor(HTMLElement.prototype, "clientWidth");

  HTMLCanvasElement.prototype.getContext = vi.fn(
    () => context,
  ) as unknown as typeof HTMLCanvasElement.prototype.getContext;
  Object.defineProperty(HTMLElement.prototype, "clientWidth", {
    configurable: true,
    get: () => width,
  });

  return {
    calls,
    of: (method) => calls.filter((c) => c.method === method),
    restore: () => {
      HTMLCanvasElement.prototype.getContext = originalGetContext;
      if (originalClientWidth) {
        Object.defineProperty(HTMLElement.prototype, "clientWidth", originalClientWidth);
      } else {
        delete (HTMLElement.prototype as unknown as Record<string, unknown>).clientWidth;
      }
    },
  };
}
