import { readdirSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

// Import protection blocks `**/server/**` and `**/*.server.*` from client bundles, so a
// route or component that statically imports one fails to load with a 500 in preview even
// though the typecheck passes. Server functions belong in `*.functions.ts` under src/lib.
const CLIENT_DIRS = ["src/routes", "src/components", "src/hooks"];
const BLOCKED = /from\s+["'](?:@|src)\/server\/|from\s+["'][^"']*\.server["']|import\(\s*["'][^"']*\/server\/|import\(\s*["'][^"']*\.server["']/;

function clientFiles(dir: string): string[] {
  return readdirSync(dir).flatMap((name) => {
    const p = join(dir, name);
    if (statSync(p).isDirectory()) return name === "node_modules" ? [] : clientFiles(p);
    return /\.(tsx?|jsx?)$/.test(name) ? [p] : [];
  });
}

describe("Client import boundaries", () => {
  it("no route or component statically imports a server-only module", () => {
    const offenders = CLIENT_DIRS.flatMap(clientFiles)
      .filter((f) => BLOCKED.test(readFileSync(f, "utf8")))
      .map((f) => f.replace(/\\/g, "/"));

    expect(offenders).toEqual([]);
  });
});
