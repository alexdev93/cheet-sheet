// envvault (https://env-vault-api.alexdev93.workers.dev) writes
// `export KEY=${JSON.stringify(String(value))}` and pipes it through `eval`.
// JSON.stringify double-quotes the value but doesn't shell-escape it, so any
// value containing "$" followed by a word character (bcrypt hashes always
// start with "$2a$12$...") gets interpreted as a shell variable expansion by
// `eval` instead of passed through literally. This patches the installed
// CLI to shell-single-quote the value instead, which is what its own
// Python fallback branch already does correctly via shlex.quote.
import { readFileSync, writeFileSync } from "node:fs";
import { homedir } from "node:os";

const path = process.argv[2] ?? `${homedir()}/.local/bin/envvault`;
const source = readFileSync(path, "utf8");

const bad = "process.stdout.write(`export ${k}=${JSON.stringify(String(v))}\\n`);";
const good =
  'const Q = String.fromCharCode(39); const shq = (s) => Q + s.replace(new RegExp(Q, "g"), Q + "\\\\" + Q + Q) + Q; ' +
  "process.stdout.write(`export ${k}=${shq(String(v))}\\n`);";

if (!source.includes(bad)) {
  console.log(`envvault: expected buggy line not found in ${path} (already patched, or upstream changed) — leaving as-is`);
  process.exit(0);
}

writeFileSync(path, source.replace(bad, good));
console.log(`envvault: patched unsafe eval of "$"-containing secret values in ${path}`);
