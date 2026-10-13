import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";

import { MicNotice } from "../../src/components/MicNotice";
import { MicTransport } from "../../src/components/MicTransport";

describe("MicNotice", () => {
  afterEach(cleanup);

  it("announces a failed start as an alert and offers a retry", () => {
    const onRetry = vi.fn();
    render(<MicNotice message="Microphone access was denied." kind="error" onRetry={onRetry} />);
    const alert = screen.getByRole("alert");
    expect(alert.textContent).toContain("Microphone access was denied.");
    expect(alert.querySelector("details")).not.toBeNull();
    fireEvent.click(screen.getByRole("button", { name: /try again/i }));
    expect(onRetry).toHaveBeenCalledTimes(1);
  });

  it("shows an unsupported environment without a retry", () => {
    render(<MicNotice message="Needs HTTPS." kind="unsupported" onRetry={() => {}} />);
    const alert = screen.getByRole("alert");
    expect(alert.textContent).toContain("Needs HTTPS.");
    expect(screen.queryByRole("button")).toBeNull();
    expect(alert.querySelector("details")).toBeNull();
  });
});

describe("MicTransport", () => {
  afterEach(cleanup);

  const noop = () => {};

  it("shows Start while idle and Stop while live", () => {
    const onStart = vi.fn();
    const onStop = vi.fn();
    const view = render(
      <MicTransport state="idle" onStart={onStart} onStop={onStop} onReset={noop} />,
    );
    expect(screen.getByRole("status").textContent).toBe("Mic off");
    fireEvent.click(screen.getByRole("button", { name: /start mic/i }));
    expect(onStart).toHaveBeenCalledTimes(1);

    view.rerender(<MicTransport state="live" onStart={onStart} onStop={onStop} onReset={noop} />);
    expect(screen.getByRole("status").textContent).toBe("Live");
    fireEvent.click(screen.getByRole("button", { name: /stop/i }));
    expect(onStop).toHaveBeenCalledTimes(1);
  });

  it("disables Start while starting or unsupported and flags the error state", () => {
    const view = render(
      <MicTransport state="starting" onStart={noop} onStop={noop} onReset={noop} />,
    );
    expect(screen.getByRole("button", { name: /start mic/i })).toHaveProperty("disabled", true);

    view.rerender(<MicTransport state="unsupported" onStart={noop} onStop={noop} onReset={noop} />);
    expect(screen.getByRole("button", { name: /start mic/i })).toHaveProperty("disabled", true);
    expect(screen.getByRole("status").getAttribute("data-state")).toBe("unsupported");

    view.rerender(<MicTransport state="error" onStart={noop} onStop={noop} onReset={noop} />);
    expect(screen.getByRole("status").textContent).toBe("Error");
    expect(screen.getByRole("button", { name: /start mic/i })).toHaveProperty("disabled", false);
  });
});
