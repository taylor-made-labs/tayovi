// Req 13: Feature 1 is the Tayovi template contract and validator only.
//
// EXACT SCOPE. These checks cover Feature 1 implementation outputs only:
//   src/, fixtures/, test/, scripts/, .github/, and the root config files
//   package.json, tsconfig.json, tsconfig.test.json, vitest.config.ts, .gitignore.
//
// OUT OF SCOPE. These are not Feature 1 outputs and are not scanned:
//   .kiro/ (suite steering and specs) and docs/ (including docs/tayovi-system-map.html).
//   They predate Feature 1 and may describe later example work.
//
// This test supports scripts/check-deps.mjs. Neither proves anything about
// the rest of the repository's documentation.

import { describe, it, expect } from "vitest";
import { execFileSync } from "node:child_process";
import { existsSync, readFileSync, readdirSync, statSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { join, relative } from "node:path";

const root = fileURLToPath(new URL("../../", import.meta.url));
const self = fileURLToPath(import.meta.url);

const SCANNED_DIRS = ["src", "fixtures", "test", "scripts", ".github"];
const SCANNED_ROOT_FILES = ["package.json", "tsconfig.json", "tsconfig.test.json", "vitest.config.ts", ".gitignore"];
// Known example-application names. Kept narrow on purpose.
const DENY = [new RegExp(["m", "ira"].join(""), "i")];
const FORBIDDEN_DIR_NAMES = new Set(["adapters", "integrations", "examples", "journeys", "apps"]);

function walk(dir: string, files: string[] = [], dirs: string[] = []): { files: string[]; dirs: string[] } {
  for (const entry of readdirSync(dir)) {
    const p = join(dir, entry);
    if (statSync(p).isDirectory()) {
      dirs.push(p);
      walk(p, files, dirs);
    } else {
      files.push(p);
    }
  }
  return { files, dirs };
}

const scanned = (() => {
  const files: string[] = [];
  const dirs: string[] = [];
  for (const d of SCANNED_DIRS) {
    const p = join(root, d);
    if (!existsSync(p)) continue;
    const w = walk(p);
    files.push(...w.files);
    dirs.push(p, ...w.dirs);
  }
  for (const f of SCANNED_ROOT_FILES) {
    const p = join(root, f);
    if (existsSync(p)) files.push(p);
  }
  return { files, dirs };
})();

describe("Feature 1 implementation-output boundary (Req 13)", () => {
  it("scans the files it says it scans", () => {
    const rel = scanned.files.map((f) => relative(root, f));
    expect(rel).toContain("src/index.ts");
    expect(rel).toContain("package.json");
    expect(rel.some((f) => f.startsWith("fixtures/contract/"))).toBe(true);
    expect(rel.some((f) => f.startsWith("test/"))).toBe(true);
    expect(rel.some((f) => f.startsWith(".kiro/") || f.startsWith("docs/"))).toBe(false);
  });

  it("finds no example-application name in Feature 1 implementation outputs", () => {
    const hits: string[] = [];
    for (const file of scanned.files) {
      if (file === self) continue; // holds the scope description
      if (file.endsWith("scripts/check-deps.mjs")) continue; // holds the deny list
      const text = readFileSync(file, "utf8");
      if (DENY.some((re) => re.test(text)) || DENY.some((re) => re.test(relative(root, file)))) {
        hits.push(relative(root, file));
      }
    }
    expect(hits).toEqual([]);
  });

  it("has no adapter, integration, example, or journey folder in those outputs", () => {
    const bad = scanned.dirs.filter((d) => FORBIDDEN_DIR_NAMES.has(d.split("/").pop() ?? ""));
    expect(bad.map((d) => relative(root, d))).toEqual([]);
  });

  it("has no dependency on or link to an example repository (scripts/check-deps.mjs)", () => {
    const out = execFileSync("node", ["scripts/check-deps.mjs"], { cwd: root, encoding: "utf8" });
    expect(out).toContain("check-deps: ok");
  });

  it("keeps the public API free of host-domain names", () => {
    const text = readFileSync(join(root, "src/index.ts"), "utf8");
    expect(DENY.some((re) => re.test(text))).toBe(false);
  });
});
