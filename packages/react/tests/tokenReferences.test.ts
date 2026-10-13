import { readFileSync, readdirSync, statSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

const SRC = join(__dirname, "..", "src");

function sourceFiles(dir: string): string[] {
  return readdirSync(dir).flatMap((name) => {
    const path = join(dir, name);
    if (statSync(path).isDirectory()) return sourceFiles(path);
    return /\.(tsx?|css)$/.test(name) ? [path] : [];
  });
}

describe("design token references", () => {
  it("reference global tokens only through their --al- prefix", () => {
    const offenders = sourceFiles(SRC).flatMap((file) =>
      [
        ...readFileSync(file, "utf8").matchAll(
          /var\(--(?:viz|color|sp|r|font|step|p|leading|tracking|plot)-[\w-]+/g,
        ),
      ].map((m) => `${file.slice(SRC.length + 1)}: ${m[0]}`),
    );
    expect(offenders).toEqual([]);
  });
});
