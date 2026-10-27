// @vitest-environment node
/**
 * Public API guard: the export names of every entry point of
 * @audiolab/react (`exports` in package.json, the stylesheets aside),
 * committed as a snapshot. A removed or renamed export fails here; an added
 * one updates the snapshot on purpose (`vitest -u`).
 */
import path from "node:path";
import { fileURLToPath } from "node:url";

import { describe, expect, it } from "vitest";

import { packageExportNames } from "../../core/tests/helpers/exportNames";

const PACKAGE = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

describe("@audiolab/react public API", () => {
  it("exports the snapshotted names from every entry point", () => {
    const names = packageExportNames(PACKAGE);
    expect(Object.keys(names)).toEqual([".", "./art"]);
    expect(names).toMatchSnapshot();
  }, 60_000);
});
