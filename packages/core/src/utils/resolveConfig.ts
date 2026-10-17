/** Defaults overridden by the given fields; explicit `undefined` keeps the default. */
export function resolveConfig<T extends object>(defaults: T, patch: Partial<T> = {}): T {
  const resolved = { ...defaults };
  for (const key of Object.keys(patch) as (keyof T)[]) {
    if (patch[key] !== undefined) resolved[key] = patch[key] as T[keyof T];
  }
  return resolved;
}
