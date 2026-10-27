/**
 * The export names of a package's entry points, read by the TypeScript
 * checker from the sources (types included, which a runtime import would
 * miss), for the public API snapshot tests.
 */
import { readFileSync } from "node:fs";
import path from "node:path";

import ts from "typescript";

/** Sorted names per entry ("./games"), each type-only export prefixed with "type ". */
export function packageExportNames(packageDir: string): Record<string, string[]> {
  const pkg = JSON.parse(readFileSync(path.join(packageDir, "package.json"), "utf8")) as {
    exports: Record<string, string | { "audiolab-source"?: string }>;
  };
  const entries: [string, string][] = [];
  for (const [subpath, target] of Object.entries(pkg.exports)) {
    const source = typeof target === "string" ? undefined : target["audiolab-source"];
    if (source && /\.tsx?$/.test(source)) entries.push([subpath, path.join(packageDir, source)]);
  }

  const config = ts.getParsedCommandLineOfConfigFile(
    path.join(packageDir, "tsconfig.json"),
    {},
    { ...ts.sys, onUnRecoverableConfigFileDiagnostic: () => undefined },
  );
  if (!config) throw new Error(`no tsconfig in ${packageDir}`);
  const program = ts.createProgram(
    entries.map(([, file]) => file),
    { ...config.options, noEmit: true },
  );
  const checker = program.getTypeChecker();

  const out: Record<string, string[]> = {};
  for (const [subpath, file] of entries) {
    const source = program.getSourceFile(file);
    const module = source && checker.getSymbolAtLocation(source);
    if (!module) throw new Error(`cannot read ${file}`);
    out[subpath] = checker
      .getExportsOfModule(module)
      .map((symbol) => {
        const target =
          symbol.flags & ts.SymbolFlags.Alias ? checker.getAliasedSymbol(symbol) : symbol;
        return target.flags & ts.SymbolFlags.Value ? symbol.name : `type ${symbol.name}`;
      })
      .sort((a, b) => a.replace(/^type /, "").localeCompare(b.replace(/^type /, "")));
  }
  return out;
}
