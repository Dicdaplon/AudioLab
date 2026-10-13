/**
 * Setup for the dom project. Vitest globals are off, so Testing Library
 * cannot register its automatic cleanup: unmount every rendered tree after
 * each test, otherwise a hook left mounted by one test keeps its timers
 * running and re-renders against the next test's fixtures.
 */
import { cleanup } from "@testing-library/react";
import { afterEach } from "vitest";

afterEach(() => {
  cleanup();
});
