// Read-only publication gate. Findings contain locations and categories, never values.
import { execFileSync, spawnSync } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(fileURLToPath(new URL("..", import.meta.url)));
const git = (args, options = {}) => {
  try {
    return execFileSync("git", args, { cwd: root, maxBuffer: 128 * 1024 * 1024, ...options });
  } catch {
    // Sync process errors can embed stdout, which may contain a credential blob.
    throw new Error(`Git ${args[0]} failed; publication check could not complete (output redacted)`);
  }
};
const list = (args) => git(args).toString("utf8").split("\0").filter(Boolean);
const findings = new Set();
const report = (scope, path, line, category) => findings.add(`${scope}: ${path}:${line} (${category})`);
const patterns = [
  ["private key", /-----BEGIN (?:RSA |EC |OPENSSH |DSA |ENCRYPTED )?PRIVATE KEY-----/g],
  ["GitHub token", /\b(?:gh[pousr]_[A-Za-z0-9]{30,}|github_pat_[A-Za-z0-9_]{40,})\b/g],
  ["Google API key", /\bAIza[0-9A-Za-z_-]{30,}\b/g],
  ["AWS access key", /\b(?:AKIA|ASIA)[A-Z0-9]{16}\b/g],
  ["Telegram bot token", /\b\d{8,12}:[A-Za-z0-9_-]{30,}\b/g],
  ["JWT", /\beyJ[A-Za-z0-9_-]{15,}\.[A-Za-z0-9_-]{15,}\.[A-Za-z0-9_-]{15,}\b/g],
  ["credential in URL", /(?:https?|postgres(?:ql)?|mysql|mongodb(?:\+srv)?|redis):\/\/[^\s/:]+:[^\s/@]+@/g],
];
const secretKey = /(?:api[_-]?key|api[_-]?hash|token|secret|password|session(?:[_-]?string)?)$/i;
const placeholder = (value) => /\$\{|^(?:your[_-]|example|placeholder|replace[_-]|<)/i.test(value) || /^[A-Z][A-Z0-9_]+$/.test(value);
const localSecrets = [];
const envPath = resolve(root, ".env");
if (existsSync(envPath)) {
  for (const line of readFileSync(envPath, "utf8").split(/\r?\n/)) {
    const match = line.match(/^\s*(?:export\s+)?([\w]+)\s*=\s*(.*?)\s*$/);
    if (!match || !secretKey.test(match[1])) continue;
    const value = match[2].replace(/^(["'])(.*)\1$/, "$2");
    if (value.length >= 12 && !placeholder(value)) localSecrets.push(value);
  }
}

function scan(scope, path, bytes) {
  if (bytes.includes(0)) return; // Binary assets are checked by path, not decoded as source.
  const text = bytes.toString("utf8");
  for (const [category, pattern] of patterns) {
    for (const match of text.matchAll(pattern)) {
      report(scope, path, text.slice(0, match.index).split("\n").length, category);
    }
  }
  // Detect compact literal credentials while allowing env references and examples.
  const assignment = /([\w-]+)["']?\s*[:=]\s*["']([A-Za-z0-9_./+=:-]{20,})["']/g;
  for (const match of text.matchAll(assignment)) {
    const [, key, value] = match;
    if (secretKey.test(key) && !placeholder(value) && /[a-z]/.test(value) && /[0-9]/.test(value)) {
      report(scope, path, text.slice(0, match.index).split("\n").length, "literal credential");
    }
  }
  for (const value of localSecrets) {
    const index = text.indexOf(value);
    if (index !== -1) report(scope, path, text.slice(0, index).split("\n").length, "matches a local .env secret");
  }
}

// Include new files, tracked files, and the index: a corrected worktree can still
// have an older credential staged for the next commit.
const paths = new Set(list(["ls-files", "--cached", "--others", "--exclude-standard", "-z"]));
for (const path of list(["ls-files", "--cached", "--ignored", "--exclude-standard", "-z"])) {
  report("index", path, 1, "tracked despite .gitignore");
}
for (const path of paths) {
  const fullPath = resolve(root, path);
  if (existsSync(fullPath)) scan("worktree", path, readFileSync(fullPath));
}
const objects = new Map();
for (const entry of list(["ls-files", "--stage", "-z"])) {
  const match = entry.match(/^\d+ ([a-f0-9]+) \d\t([\s\S]+)$/);
  if (match) objects.set(match[1], { scope: "index", path: match[2] });
}
let historyObjects = 0;
if (process.argv.includes("--history")) {
  if (git(["rev-parse", "--is-shallow-repository"]).toString().trim() === "true") {
    report("history", ".git", 1, "shallow checkout; fetch full history before publication");
  }
  // Only HEAD is published by a normal branch push. Local archive branches and
  // application checkpoints need a separate audit before an all-refs export.
  const refs = process.argv.includes("--all-refs") ? ["--all"] : ["HEAD"];
  for (const entry of git(["rev-list", "--objects", ...refs]).toString("utf8").split("\n")) {
    const separator = entry.indexOf(" ");
    if (separator < 0 || separator === entry.length - 1) continue;
    const oid = entry.slice(0, separator);
    if (!objects.has(oid)) {
      objects.set(oid, { scope: "history", path: entry.slice(separator + 1) });
      historyObjects += 1;
    }
  }
}
if (objects.size) {
  const ignored = spawnSync("git", ["check-ignore", "--no-index", "--stdin", "-z"], {
    cwd: root, input: `${[...new Set([...objects.values()].map(({ path }) => path))].join("\0")}\0`,
    encoding: "utf8", maxBuffer: 16 * 1024 * 1024,
  });
  if (ignored.error || ![0, 1].includes(ignored.status)) throw new Error("Cannot check ignored Git object paths");
  const ignoredPaths = new Set(ignored.stdout.split("\0").filter(Boolean));
  const batch = git(["cat-file", "--batch"], { input: `${[...objects.keys()].join("\n")}\n` });
  let offset = 0;
  for (const [oid, { scope, path }] of objects) {
    const end = batch.indexOf(10, offset);
    const [actualOid, type, rawSize] = batch.subarray(offset, end).toString().split(" ");
    if (actualOid !== oid || !/^\d+$/.test(rawSize)) throw new Error("Cannot read Git object for publication check");
    const size = Number(rawSize);
    const bytes = batch.subarray(end + 1, end + 1 + size);
    if (type === "blob") {
      if (ignoredPaths.has(path)) report(scope, path, 1, "private path in Git objects");
      scan(scope, path, bytes);
    }
    offset = end + 1 + size + 1;
  }
}
if (findings.size) {
  console.error(`Publication check failed (${findings.size} finding(s); values redacted):`);
  for (const finding of findings) console.error(`- ${finding}`);
  process.exitCode = 1;
} else {
  console.log(`Publication check passed: ${paths.size} files, index${process.argv.includes("--history") ? ` and ${process.argv.includes("--all-refs") ? "all-refs" : "HEAD"} history (${historyObjects} additional objects)` : ""}.`);
}
