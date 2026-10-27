// @vitest-environment node
/**
 * Public API guard: the export names of every entry point of
 * @audiolab/core (`exports` in package.json), committed as a snapshot. A
 * removed or renamed export fails here; an added one updates the snapshot
 * on purpose (`vitest -u`), in the same change as its changeset.
 */
import path from "node:path";
import { fileURLToPath } from "node:url";

import { describe, expect, it } from "vitest";

import { packageExportNames } from "../helpers/exportNames";

const PACKAGE = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");

describe("@audiolab/core public API", () => {
  it("exports the snapshotted names from every entry point", () => {
    const names = packageExportNames(PACKAGE);
    expect(Object.keys(names)).toEqual([".", "./games", "./rhythm", "./offline"]);
    expect(names).toMatchSnapshot();
  }, 60_000);
});
