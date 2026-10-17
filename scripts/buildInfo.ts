/**
 * Build stamp for the tsup configs: the package version and the git commit
 * it was built from (`-dirty` when tracked files had uncommitted changes;
 * untracked files are ignored, tsup writes its bundled config next to the
 * package while it builds), passed
 * to esbuild as the `__AUDIOLAB_BUILD__` constant. A host can then tell
 * which commit a packed tarball comes from (`BUILD_INFO`).
 */
import { execSync } from "node:child_process";
import { readFileSync } from "node:fs";

function git(command: string): string {
  try {
    return execSync(`git ${command}`, {
      encoding: "utf8",
      stdio: ["ignore", "pipe", "ignore"],
    }).trim();
  } catch {
    return "";
  }
}

export function buildInfoDefine(packageJsonPath: string): Record<string, string> {
  const { version } = JSON.parse(readFileSync(packageJsonPath, "utf8")) as { version: string };
  const sha = git("rev-parse --short HEAD") || "unknown";
  const commit = git("status --porcelain --untracked-files=no") ? `${sha}-dirty` : sha;
  return { __AUDIOLAB_BUILD__: JSON.stringify({ version, commit }) };
}
