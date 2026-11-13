// Fails when the project depends on, imports from, or links to an example
// application. Tayovi's template must stay free of example-app code (Req 13).
import { readFileSync, readdirSync, statSync } from "node:fs";
import { join } from "node:path";

const root = new URL("..", import.meta.url).pathname;
const DENY = [/\bmira\b/i];
const problems = [];

const pkg = JSON.parse(readFileSync(join(root, "package.json"), "utf8"));
for (const field of ["dependencies", "devDependencies", "peerDependencies", "optionalDependencies"]) {
  for (const [name, spec] of Object.entries(pkg[field] ?? {})) {
    if (DENY.some((re) => re.test(name)) || /^(file:|link:|workspace:|git\+|github:)/.test(String(spec))) {
      problems.push(`package.json ${field}: ${name}@${spec}`);
    }
  }
}

function walk(dir, out = []) {
  for (const entry of readdirSync(dir)) {
    const p = join(dir, entry);
    if (statSync(p).isDirectory()) walk(p, out);
    else if (/\.(ts|mjs|js|json)$/.test(entry)) out.push(p);
  }
  return out;
}

for (const dir of ["src", "test"]) {
  for (const file of walk(join(root, dir))) {
    const text = readFileSync(file, "utf8");
    const imports = text.match(/(?:from|import)\s*\(?\s*["'][^"']+["']/g) ?? [];
    for (const imp of imports) {
      if (/["'](\.\.\/){3,}/.test(imp) || DENY.some((re) => re.test(imp))) {
        problems.push(`${file}: ${imp}`);
      }
    }
  }
}

if (problems.length) {
  console.error("Example-application dependency found:\n" + problems.join("\n"));
  process.exit(1);
}
console.log("check-deps: ok");
