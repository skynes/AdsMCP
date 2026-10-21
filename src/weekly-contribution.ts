import { createHash } from "node:crypto";
import { execFile } from "node:child_process";
import { existsSync, mkdirSync, readFileSync, renameSync, writeFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { promisify } from "node:util";
import { fileURLToPath } from "node:url";
import { getFreeUseStatus } from "./free-use.js";
import { resolveDataDir } from "./env.js";

const execFileAsync = promisify(execFile);
const ROOT = resolve(fileURLToPath(new URL("..", import.meta.url)));
const WEEK_MS = 7 * 24 * 60 * 60 * 1000;
const REQUEST_TIMEOUT_MS = 20_000;
const RECOMMENDATIONS_DIR = "docs/recommendations";
const CONFIG_FILE = "github-contribution.json";

type GithubRepository = { owner: string; name: string };
type LocalChange = { status: string; path: string; content?: Buffer };
type ContributionConfig = { upstream?: string; fork?: string; configuredAt?: string };

export type WeeklyContributionStatus = {
  repository?: string;
  status: "disabled" | "skipped" | "no_changes" | "pending_confirmation" | "blocked" | "created" | "error";
  lastCheckedAt: string;
  fingerprint?: string;
  branch?: string;
  prUrl?: string;
  changedFiles?: string[];
  reason?: string;
};

export type GithubContributionStatus = WeeklyContributionStatus & {
  upstreamRepository?: string;
  forkRepository?: string;
  githubTokenConfigured: boolean;
  freeUseAccepted: boolean;
  setupRequired?: boolean;
};

function parseBoolean(value: string | undefined, fallback: boolean): boolean {
  if (!value?.trim()) return fallback;
  return !["0", "false", "no", "off"].includes(value.trim().toLowerCase());
}

function configuredRecommendationsDir(): string {
  const value = process.env.ADSMCP_RECOMMENDATIONS_DIR?.trim() || RECOMMENDATIONS_DIR;
  return value.replaceAll("\\", "/").replace(/^\.\//, "").replace(/\/$/, "") || RECOMMENDATIONS_DIR;
}

function parseGithubRepository(value: string | undefined): GithubRepository | undefined {
  const raw = value?.trim();
  if (!raw) return undefined;
  const shorthand = raw.match(/^([^/\s]+)\/([^/\s]+?)(?:\.git)?$/);
  if (shorthand) return { owner: shorthand[1], name: shorthand[2] };
  const url = raw.match(/github\.com[/:]([^/\s]+)\/([^/#\s]+?)(?:\.git)?$/i);
  return url ? { owner: url[1], name: url[2] } : undefined;
}

async function repositoryFromOrigin(): Promise<GithubRepository | undefined> {
  try {
    const result = await execFileAsync("git", ["remote", "get-url", "origin"], {
      cwd: ROOT,
      timeout: 5_000,
      windowsHide: true,
      maxBuffer: 16 * 1024,
    });
    return parseGithubRepository(result.stdout.trim());
  } catch {
    return undefined;
  }
}

function repositoryLabel(repository: GithubRepository): string {
  return `${repository.owner}/${repository.name}`;
}

function statePath(): string {
  return join(resolveDataDir(), "updates", "weekly-contribution.json");
}

function configPath(): string {
  return join(resolveDataDir(), "updates", CONFIG_FILE);
}

function readConfig(): ContributionConfig {
  try {
    if (!existsSync(configPath())) return {};
    const value = JSON.parse(readFileSync(configPath(), "utf8")) as ContributionConfig;
    return value && typeof value === "object" ? value : {};
  } catch {
    return {};
  }
}

function writeConfig(config: ContributionConfig): void {
  const path = configPath();
  mkdirSync(dirname(path), { recursive: true });
  const temporaryPath = `${path}.${process.pid}.tmp`;
  writeFileSync(temporaryPath, `${JSON.stringify(config, null, 2)}\n`, "utf8");
  renameSync(temporaryPath, path);
}

function readState(path: string): WeeklyContributionStatus | undefined {
  try {
    if (!existsSync(path)) return undefined;
    const value = JSON.parse(readFileSync(path, "utf8")) as WeeklyContributionStatus;
    return value && typeof value.lastCheckedAt === "string" ? value : undefined;
  } catch {
    return undefined;
  }
}

function writeState(path: string, state: WeeklyContributionStatus): void {
  mkdirSync(dirname(path), { recursive: true });
  const temporaryPath = `${path}.${process.pid}.tmp`;
  writeFileSync(temporaryPath, `${JSON.stringify(state, null, 2)}\n`, "utf8");
  renameSync(temporaryPath, path);
}

function debugEnabled(): boolean {
  return parseBoolean(process.env.ADSMCP_UPDATE_DEBUG, false);
}

function log(message: string): void {
  console.error(`[AdsMCP weekly contribution] ${message}`);
}

async function allLocalChanges(): Promise<LocalChange[]> {
  const result = await execFileAsync(
    "git",
    ["status", "--porcelain=v1", "-z", "--untracked-files=all"],
    { cwd: ROOT, timeout: 5_000, windowsHide: true, maxBuffer: 256 * 1024 },
  );
  const tokens = result.stdout.split("\0").filter(Boolean);
  const changes: LocalChange[] = [];
  const readChange = (status: string, rawPath: string): LocalChange => {
    const path = rawPath.replaceAll("\\", "/");
    const fullPath = resolve(ROOT, path);
    return { status, path, content: existsSync(fullPath) ? readFileSync(fullPath) : undefined };
  };
  for (let index = 0; index < tokens.length; index += 1) {
    const token = tokens[index];
    const status = token.slice(0, 2);
    const path = token.slice(3);
    if (status.includes("R") || status.includes("C")) {
      const destination = tokens[index + 1];
      if (destination) {
        index += 1;
        if (status.includes("R")) changes.push(readChange("D ", path));
        changes.push(readChange("A ", destination));
        continue;
      }
    }
    changes.push(readChange(status, path));
  }
  return changes;
}

async function publicationCheckPassed(): Promise<boolean> {
  try {
    await execFileAsync(process.execPath, ["scripts/check-publication.mjs"], {
      cwd: ROOT,
      timeout: 30_000,
      windowsHide: true,
      maxBuffer: 256 * 1024,
    });
    return true;
  } catch {
    return false;
  }
}

function isAllowedRecommendation(change: LocalChange, recommendationsDir: string): boolean {
  return (
    (change.path === recommendationsDir || change.path.startsWith(`${recommendationsDir}/`)) &&
    /\.(?:md|markdown|txt)$/i.test(change.path) &&
    !change.path.includes("..")
  );
}

function isSafeContributionPath(path: string): boolean {
  const normalized = path.replaceAll("\\", "/");
  if (!normalized || normalized.startsWith("/") || normalized.includes("..")) return false;
  if (/^(?:\.env(?:\.|$)|data\/|node_modules\/|dist\/|coverage\/)/i.test(normalized)) return false;
  return true;
}

function fingerprint(changes: LocalChange[]): string {
  const hash = createHash("sha256");
  for (const change of [...changes].sort((a, b) => a.path.localeCompare(b.path))) {
    hash.update(change.status);
    hash.update("\0");
    hash.update(change.path);
    hash.update("\0");
    hash.update(change.content ?? Buffer.from("<deleted>"));
    hash.update("\0");
  }
  return hash.digest("hex");
}

function apiHeaders(): Record<string, string> {
  const token = process.env.ADSMCP_GITHUB_TOKEN?.trim();
  return {
    Accept: "application/vnd.github+json",
    "Content-Type": "application/json",
    "User-Agent": "AdsMCP-weekly-contribution",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
}

async function githubApi<T>(url: string, init: RequestInit = {}): Promise<T> {
  const response = await fetch(url, {
    ...init,
    headers: { ...apiHeaders(), ...(init.headers ?? {}) },
    signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
  });
  if (!response.ok) {
    const detail = (await response.text()).slice(0, 400).replace(/\s+/g, " ");
    throw new Error(`GitHub API returned HTTP ${response.status}${detail ? `: ${detail}` : ""}`);
  }
  return (await response.json()) as T;
}

function apiBase(repository: GithubRepository): string {
  return `https://api.github.com/repos/${encodeURIComponent(repository.owner)}/${encodeURIComponent(repository.name)}`;
}

function repositoryFromConfig(value: string | undefined): GithubRepository | undefined {
  return parseGithubRepository(value);
}

function repositoryLabelOrUndefined(repository: GithubRepository | undefined): string | undefined {
  return repository ? repositoryLabel(repository) : undefined;
}

type RepositoryInfo = { full_name?: string; parent?: { full_name?: string }; fork?: boolean };

async function repositoryInfo(repository: GithubRepository): Promise<RepositoryInfo> {
  return githubApi<RepositoryInfo>(apiBase(repository));
}

async function resolveContributionRepositories(): Promise<{ upstream?: GithubRepository; fork?: GithubRepository }> {
  const config = readConfig();
  const origin = await repositoryFromOrigin();
  let upstream = repositoryFromConfig(process.env.ADSMCP_UPSTREAM_REPOSITORY)
    ?? repositoryFromConfig(process.env.ADSMCP_UPDATE_REPOSITORY)
    ?? repositoryFromConfig(config.upstream);
  let fork = repositoryFromConfig(process.env.ADSMCP_FORK_REPOSITORY) ?? repositoryFromConfig(config.fork);

  if (!fork && origin && upstream && repositoryLabel(origin) !== repositoryLabel(upstream)) fork = origin;
  if (!upstream && origin) {
    if (process.env.ADSMCP_GITHUB_TOKEN?.trim()) {
      try {
        const info = await repositoryInfo(origin);
        const parent = parseGithubRepository(info.parent?.full_name);
        if (parent) {
          upstream = parent;
          fork = origin;
        } else {
          upstream = origin;
        }
      } catch {
        upstream = origin;
      }
    } else {
      upstream = origin;
    }
  }
  if (!fork && origin && upstream && repositoryLabel(origin) !== repositoryLabel(upstream)) fork = origin;
  return { upstream, fork };
}

export async function getGithubContributionStatus(): Promise<GithubContributionStatus> {
  const { upstream, fork } = await resolveContributionRepositories();
  const changes = await allLocalChanges();
  const config = readConfig();
  return {
    repository: repositoryLabelOrUndefined(upstream),
    upstreamRepository: repositoryLabelOrUndefined(upstream),
    forkRepository: repositoryLabelOrUndefined(fork),
    githubTokenConfigured: Boolean(process.env.ADSMCP_GITHUB_TOKEN?.trim()),
    freeUseAccepted: getFreeUseStatus().accepted,
    setupRequired: !upstream || !fork || !process.env.ADSMCP_GITHUB_TOKEN?.trim(),
    status: changes.length === 0 ? "no_changes" : (fork ? "pending_confirmation" : "skipped"),
    lastCheckedAt: new Date().toISOString(),
    fingerprint: fingerprint(changes),
    changedFiles: changes.map((change) => change.path),
    reason: changes.length === 0
      ? "No local Git changes found."
      : !process.env.ADSMCP_GITHUB_TOKEN?.trim()
        ? "Configure ADSMCP_GITHUB_TOKEN before publishing changes."
        : !upstream || !fork
          ? "Configure a GitHub upstream repository and fork before publishing changes."
          : !getFreeUseStatus().accepted
            ? "Accept the Free Use Rules before publishing changes."
            : config.configuredAt
              ? "Local changes are ready for review before creating a PR."
              : "GitHub contribution setup is ready; review the changed files before creating a PR.",
  };
}

export async function setupGithubContribution(options: {
  confirm: boolean;
  upstreamRepository?: string;
  createFork?: boolean;
}): Promise<GithubContributionStatus> {
  const token = process.env.ADSMCP_GITHUB_TOKEN?.trim();
  const configured = readConfig();
  const current = await getGithubContributionStatus();
  const upstream = repositoryFromConfig(options.upstreamRepository)
    ?? repositoryFromConfig(process.env.ADSMCP_UPSTREAM_REPOSITORY)
    ?? repositoryFromConfig(process.env.ADSMCP_UPDATE_REPOSITORY)
    ?? repositoryFromConfig(configured.upstream)
    ?? (current.upstreamRepository ? parseGithubRepository(current.upstreamRepository) : undefined);
  if (!token) return { ...current, setupRequired: true, reason: "Set ADSMCP_GITHUB_TOKEN before configuring a GitHub fork." };
  if (!upstream) return { ...current, setupRequired: true, reason: "Set ADSMCP_UPSTREAM_REPOSITORY=owner/repository or provide upstream_repository." };

  let fork = repositoryFromConfig(process.env.ADSMCP_FORK_REPOSITORY)
    ?? repositoryFromConfig(configured.fork)
    ?? (current.forkRepository ? parseGithubRepository(current.forkRepository) : undefined);
  if (!options.confirm) {
    return {
      ...current,
      upstreamRepository: repositoryLabel(upstream),
      forkRepository: repositoryLabelOrUndefined(fork),
      setupRequired: !fork,
      reason: fork
        ? "Fork is configured. Set confirm=true only after reviewing the contribution setup."
        : "Set confirm=true to create a personal GitHub fork through the configured token.",
    };
  }

  if (!fork && (options.createFork ?? true)) {
    const created = await githubApi<{ full_name?: string }>(`${apiBase(upstream)}/forks`, {
      method: "POST",
      body: JSON.stringify({}),
    });
    fork = parseGithubRepository(created.full_name);
  }
  if (!fork) return { ...current, setupRequired: true, reason: "GitHub did not return the created fork repository." };
  writeConfig({ upstream: repositoryLabel(upstream), fork: repositoryLabel(fork), configuredAt: new Date().toISOString() });
  const status = await getGithubContributionStatus();
  return { ...status, upstreamRepository: repositoryLabel(upstream), forkRepository: repositoryLabel(fork), setupRequired: false, reason: "GitHub fork contribution setup is ready." };
}

async function createPullRequest(
  upstream: GithubRepository,
  fork: GithubRepository,
  changes: LocalChange[],
  baseBranch: string,
  title?: string,
  body?: string,
): Promise<{ branch: string; url: string }> {
  const base = apiBase(fork);
  const ref = await githubApi<{ object?: { sha?: string } }>(`${base}/git/ref/heads/${encodeURIComponent(baseBranch)}`);
  const baseSha = ref.object?.sha;
  if (!baseSha) throw new Error(`GitHub base branch ${baseBranch} has no commit SHA`);
  const baseCommit = await githubApi<{ tree?: { sha?: string } }>(`${base}/git/commits/${baseSha}`);
  const baseTree = baseCommit.tree?.sha;
  if (!baseTree) throw new Error("GitHub base commit has no tree SHA");

  const entries: Array<{ path: string; mode: "100644"; type: "blob"; sha: string | null }> = [];
  for (const change of changes) {
    if (change.status.includes("D") || !change.content) {
      entries.push({ path: change.path, mode: "100644", type: "blob", sha: null });
      continue;
    }
    const blob = await githubApi<{ sha?: string }>(`${base}/git/blobs`, {
      method: "POST",
      body: JSON.stringify({ content: change.content.toString("base64"), encoding: "base64" }),
    });
    if (!blob.sha) throw new Error(`GitHub did not return a blob SHA for ${change.path}`);
    entries.push({ path: change.path, mode: "100644", type: "blob", sha: blob.sha });
  }

  const tree = await githubApi<{ sha?: string }>(`${base}/git/trees`, {
    method: "POST",
    body: JSON.stringify({ base_tree: baseTree, tree: entries }),
  });
  if (!tree.sha) throw new Error("GitHub did not return a tree SHA");

  const branch = `codex/contribution-${new Date().toISOString().replace(/[-:.TZ]/g, "").slice(0, 14)}`;
  const commit = await githubApi<{ sha?: string }>(`${base}/git/commits`, {
    method: "POST",
    body: JSON.stringify({
      message: title?.trim() || "chore: contribute AdsMCP changes",
      tree: tree.sha,
      parents: [baseSha],
    }),
  });
  if (!commit.sha) throw new Error("GitHub did not return a commit SHA");

  await githubApi(`${base}/git/refs`, {
    method: "POST",
    body: JSON.stringify({ ref: `refs/heads/${branch}`, sha: commit.sha }),
  });

  const pull = await githubApi<{ html_url?: string }>(`${apiBase(upstream)}/pulls`, {
    method: "POST",
    body: JSON.stringify({
      title: title?.trim() || "chore: contribute AdsMCP changes",
      head: `${fork.owner}:${branch}`,
      base: baseBranch,
      body: body?.trim() || [
        "## Summary",
        "",
        "This contribution was prepared from reviewed local AdsMCP changes.",
        "",
        `- Changed files: ${changes.length}.`,
        "- The local user accepted AdsMCP Free Use Rules v1.0.",
        "- Credentials, local data and ignored installation state are excluded.",
        "- Please review the diff before merging.",
        "",
        "This PR was created by the AdsMCP contribution workflow.",
      ].join("\n"),
    }),
  });
  if (!pull.html_url) throw new Error("GitHub did not return the pull request URL");
  return { branch, url: pull.html_url };
}

export async function createGithubContributionPr(options: {
  confirm: boolean;
  title?: string;
  body?: string;
}): Promise<WeeklyContributionStatus> {
  const current = await getGithubContributionStatus();
  const { upstream, fork } = await resolveContributionRepositories();
  const path = statePath();
  const changes = await allLocalChanges();
  const base: WeeklyContributionStatus = {
    ...current,
    repository: repositoryLabelOrUndefined(upstream),
    lastCheckedAt: new Date().toISOString(),
    fingerprint: fingerprint(changes),
    changedFiles: changes.map((change) => change.path),
  };
  if (!options.confirm) {
    const preview = { ...base, status: "pending_confirmation" as const, reason: changes.length ? "Review changedFiles and call this tool with confirm=true to create the PR." : "No local Git changes found." };
    writeState(path, preview);
    return preview;
  }
  if (!getFreeUseStatus().accepted) return { ...base, status: "skipped", reason: "Free Use Rules must be accepted before creating a public contribution." };
  if (!process.env.ADSMCP_GITHUB_TOKEN?.trim()) return { ...base, status: "skipped", reason: "ADSMCP_GITHUB_TOKEN is required to create a GitHub PR." };
  if (!upstream || !fork) return { ...base, status: "skipped", reason: "Configure a GitHub upstream repository and fork first." };
  if (changes.length === 0) return { ...base, status: "no_changes", reason: "No local Git changes found." };
  if (changes.some((change) => !isSafeContributionPath(change.path))) {
    return { ...base, status: "blocked", reason: "One or more changed files are local, generated or unsafe to publish." };
  }
  if (!(await publicationCheckPassed())) return { ...base, status: "blocked", reason: "Publication safety check rejected the pending changes." };
  const latestChanges = await allLocalChanges();
  if (fingerprint(latestChanges) !== base.fingerprint) return { ...base, status: "blocked", reason: "Local files changed while preparing the PR; review again." };
  try {
    const result = await createPullRequest(upstream, fork, changes, process.env.ADSMCP_CONTRIBUTION_BASE_BRANCH?.trim() || "main", options.title, options.body);
    const created = { ...base, status: "created" as const, branch: result.branch, prUrl: result.url };
    writeState(path, created);
    log(`Created ${result.url} from ${changes.length} local change(s).`);
    return created;
  } catch (error) {
    const failed = { ...base, status: "error" as const, reason: error instanceof Error ? error.message : String(error) };
    writeState(path, failed);
    return failed;
  }
}

export async function checkWeeklyRecommendationsPr(): Promise<WeeklyContributionStatus | undefined> {
  if (!parseBoolean(process.env.ADSMCP_WEEKLY_PR_ENABLED, true)) return undefined;

  const path = statePath();
  const previous = readState(path);
  const now = Date.now();
  const { upstream: repository, fork } = await resolveContributionRepositories();
  const label = repository ? repositoryLabel(repository) : undefined;
  const recommendationsDir = configuredRecommendationsDir();
  const changes = await allLocalChanges();
  const recommendationChanges = changes.filter((change) => isAllowedRecommendation(change, recommendationsDir));
  const currentFingerprint = fingerprint(changes);
  const previousCheckedAt = previous ? Date.parse(previous.lastCheckedAt) : Number.NaN;
  if (
    Number.isFinite(previousCheckedAt) &&
    now - previousCheckedAt < WEEK_MS &&
    previous?.repository === label &&
    previous?.fingerprint === currentFingerprint
  ) return previous;

  const base: WeeklyContributionStatus = {
    repository: label,
    status: "skipped",
    lastCheckedAt: new Date(now).toISOString(),
    fingerprint: currentFingerprint,
    changedFiles: changes.map((change) => change.path),
  };

  if (!repository || !fork) {
    const skipped = { ...base, reason: "Configure ADSMCP_UPDATE_REPOSITORY or a GitHub origin remote." };
    writeState(path, skipped);
    if (debugEnabled()) log(skipped.reason ?? "GitHub repository is not configured.");
    return skipped;
  }
  if (!getFreeUseStatus().accepted) {
    const skipped = { ...base, reason: "Free Use Rules must be accepted before creating a public contribution." };
    writeState(path, skipped);
    if (debugEnabled()) log(skipped.reason ?? "Free Use Rules are not accepted.");
    return skipped;
  }
  if (!process.env.ADSMCP_GITHUB_TOKEN?.trim()) {
    const skipped = { ...base, reason: "ADSMCP_GITHUB_TOKEN is required to create a GitHub PR." };
    writeState(path, skipped);
    if (debugEnabled()) log(skipped.reason ?? "GitHub token is not configured.");
    return skipped;
  }
  if (changes.length === 0) {
    const clean = { ...base, status: "no_changes" as const, reason: "No local Git changes found." };
    writeState(path, clean);
    if (debugEnabled()) log(clean.reason ?? "No local changes found.");
    return clean;
  }
  if (recommendationChanges.length === 0) {
    const pending = { ...base, status: "pending_confirmation" as const, reason: "Project changes were detected. Review them and call ads_github_contribution_create_pr with confirm=true to publish them." };
    writeState(path, pending);
    if (debugEnabled()) log(pending.reason);
    return pending;
  }
  if (changes.length !== recommendationChanges.length || recommendationChanges.some((change) => !isAllowedRecommendation(change, recommendationsDir))) {
    const pending = { ...base, status: "pending_confirmation" as const, reason: "Project changes were detected. Review them and call ads_github_contribution_create_pr with confirm=true to publish them." };
    writeState(path, pending);
    if (debugEnabled()) log(pending.reason);
    return pending;
  }

  const latestChanges = await allLocalChanges();
  if (fingerprint(latestChanges) !== currentFingerprint) {
    const changed = { ...base, reason: "Recommendation files changed while preparing the PR." };
    writeState(path, changed);
    log(changed.reason ?? "Recommendation files changed during preparation.");
    return changed;
  }

  if (!(await publicationCheckPassed())) {
    const blocked = { ...base, status: "blocked" as const, reason: "Publication safety check rejected the pending recommendation changes." };
    writeState(path, blocked);
    log(blocked.reason);
    return blocked;
  }

  try {
    const result = await createPullRequest(
      repository,
      fork,
      recommendationChanges,
      process.env.ADSMCP_CONTRIBUTION_BASE_BRANCH?.trim() || "main",
    );
    const created: WeeklyContributionStatus = {
      ...base,
      status: "created",
      branch: result.branch,
      prUrl: result.url,
    };
    writeState(path, created);
    log(`Created ${result.url} from ${recommendationChanges.length} recommendation file(s).`);
    return created;
  } catch (error) {
    const failed: WeeklyContributionStatus = {
      ...base,
      status: "error",
      reason: error instanceof Error ? error.message : String(error),
    };
    writeState(path, failed);
    log(`PR creation failed for ${label}: ${failed.reason}`);
    return failed;
  }
}
