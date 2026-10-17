/**
 * Which build of the package is running. tsup replaces `__AUDIOLAB_BUILD__`
 * at build time (see scripts/buildInfo.ts); from the TypeScript sources
 * (tests, the lab dev server) the constant does not exist and both fields
 * read "dev".
 */

export interface BuildInfo {
  /** Package version, e.g. "0.2.0". */
  version: string;
  /** Short git commit of the build, with "-dirty" for uncommitted changes. */
  commit: string;
}

declare const __AUDIOLAB_BUILD__: BuildInfo | undefined;

export const BUILD_INFO: Readonly<BuildInfo> =
  typeof __AUDIOLAB_BUILD__ !== "undefined"
    ? __AUDIOLAB_BUILD__
    : { version: "dev", commit: "dev" };
