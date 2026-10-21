import { execFile } from "node:child_process";
import {
  existsSync,
  mkdirSync,
  readFileSync,
  renameSync,
  writeFileSync,
} from "node:fs";
import { promisify } from "node:util";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { resolveDataDir } from "./env.js";

const execFileAsync = promisify(execFile);
const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const CHECK_INTERVAL_MS = 24 * 60 * 60 * 1000;
const REQUEST_TIMEOUT_MS = 15_000;
const MAX_ARCHIVE_BYTES = 100 * 1024 * 1024;

type GithubRepository = { owner: string; name: string };
type RemoteUpdate = {
  version: string;
  ref: string;
  archiveUrl: string;
  source: "release" | "tag";
};

export type GithubUpdateStatus = {
  repository?: string;
  currentVersion: string;
  latestVersion?: string;
  latestRef?: string;
  status: "skipped" | "up-to-date" | "downloaded" | "error";
  lastCheckedAt: string;
  downloadedAt?: string;
  archivePath?: string;
  error?: string;
};

type GithubRelease = {
  tag_name?: unknown;
};

function parseBoolean(value: string | undefined, fallback: boolean): boolean {
  if (!value?.trim()) return fallback;
  return !["0", "false", "no", "off"].includes(value.trim().toLowerCase());
}

function parseGithubRepository(value: string | undefined): GithubRepository | undefined {
  const raw = value?.trim();
  if (!raw) return undefined;

  const shorthand = raw.match(/^([^/\s]+)\/([^/\s]+?)(?:\.git)?$/);
  if (shorthand) return { owner: shorthand[1], name: shorthand[2] };

  const url = raw.match(/github\.com[/:]([^/\s]+)\/([^/#\s]+?)(?:\.git)?$/i);
  if (url) return { owner: url[1], name: url[2] };
  return undefined;
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

function updateStatePath(): string {
  return join(resolveDataDir(), "updates", "github-update.json");
}

function readState(path: string): GithubUpdateStatus | undefined {
  try {
    if (!existsSync(path)) return undefined;
    const parsed = JSON.parse(readFileSync(path, "utf8")) as GithubUpdateStatus;
    if (!parsed || typeof parsed !== "object" || typeof parsed.lastCheckedAt !== "string") {
      return undefined;
    }
    return parsed;
  } catch {
    return undefined;
  }
}

function writeState(path: string, state: GithubUpdateStatus): void {
  mkdirSync(dirname(path), { recursive: true });
  const temporaryPath = `${path}.${process.pid}.tmp`;
  writeFileSync(temporaryPath, `${JSON.stringify(state, null, 2)}\n`, "utf8");
  renameSync(temporaryPath, path);
}

function debugEnabled(): boolean {
  return parseBoolean(process.env.ADSMCP_UPDATE_DEBUG, false);
}

function log(message: string): void {
  console.error(`[AdsMCP update] ${message}`);
}

function normalizeVersion(value: string): string {
  return value.trim().replace(/^v/i, "");
}

function semverParts(value: string): [number, number, number] | undefined {
  const match = normalizeVersion(value).match(/^(\d+)\.(\d+)\.(\d+)(?:[-+].*)?$/);
  return match ? [Number(match[1]), Number(match[2]), Number(match[3])] : undefined;
}

function isNewer(current: string, latest: string): boolean {
  const currentParts = semverParts(current);
  const latestParts = semverParts(latest);
  if (currentParts && latestParts) {
    for (let index = 0; index < currentParts.length; index += 1) {
      if (latestParts[index] !== currentParts[index]) return latestParts[index] > currentParts[index];
    }
    return false;
  }
  return normalizeVersion(current) !== normalizeVersion(latest);
}

function githubHeaders(currentVersion: string): Record<string, string> {
  const headers: Record<string, string> = {
    Accept: "application/vnd.github+json",
    "User-Agent": `AdsMCP/${currentVersion}`,
  };
  const token = process.env.ADSMCP_GITHUB_TOKEN?.trim();
  if (token) headers.Authorization = `Bearer ${token}`;
  return headers;
}

async function githubJson<T>(url: string, currentVersion: string): Promise<T | undefined> {
  const response = await fetch(url, {
    headers: githubHeaders(currentVersion),
    signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
  });
  if (response.status === 404) return undefined;
  if (!response.ok) throw new Error(`GitHub API returned HTTP ${response.status}`);
  return (await response.json()) as T;
}

async function findLatestUpdate(
  repository: GithubRepository,
  currentVersion: string,
): Promise<RemoteUpdate | undefined> {
  const apiBase = `https://api.github.com/repos/${encodeURIComponent(repository.owner)}/${encodeURIComponent(repository.name)}`;
  const release = await githubJson<GithubRelease>(`${apiBase}/releases/latest`, currentVersion);
  const releaseTag = typeof release?.tag_name === "string" ? release.tag_name.trim() : "";
  if (releaseTag) {
    const archiveUrl = `https://github.com/${encodeURIComponent(repository.owner)}/${encodeURIComponent(repository.name)}/archive/refs/tags/${encodeURIComponent(releaseTag)}.tar.gz`;
    return { version: normalizeVersion(releaseTag), ref: releaseTag, archiveUrl, source: "release" };
  }

  // Repositories without a GitHub Release can still publish version tags.
  const tags = await githubJson<Array<{ name?: unknown }>>(`${apiBase}/tags?per_page=1`, currentVersion);
  const tag = typeof tags?.[0]?.name === "string" ? tags[0].name.trim() : "";
  if (!tag) return undefined;
  const archiveUrl = `https://github.com/${encodeURIComponent(repository.owner)}/${encodeURIComponent(repository.name)}/archive/refs/tags/${encodeURIComponent(tag)}.tar.gz`;
  return { version: normalizeVersion(tag), ref: tag, archiveUrl, source: "tag" };
}

function archivePathFor(repository: GithubRepository, reference: string): string {
  const safeReference = reference.replace(/[^a-zA-Z0-9._-]+/g, "_").slice(0, 120) || "latest";
  const safeRepository = `${repository.owner}-${repository.name}`.replace(/[^a-zA-Z0-9._-]+/g, "_");
  return join(resolveDataDir(), "updates", safeRepository, `${safeReference}.tar.gz`);
}

async function downloadArchive(url: string, destination: string, currentVersion: string): Promise<void> {
  const response = await fetch(url, {
    headers: githubHeaders(currentVersion),
    redirect: "follow",
    signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
  });
  if (!response.ok) throw new Error(`GitHub archive returned HTTP ${response.status}`);
  const contentLength = Number(response.headers.get("content-length") ?? 0);
  if (contentLength > MAX_ARCHIVE_BYTES) throw new Error("GitHub archive is larger than 100 MB");

  const body = Buffer.from(await response.arrayBuffer());
  if (body.byteLength > MAX_ARCHIVE_BYTES) throw new Error("GitHub archive is larger than 100 MB");
  mkdirSync(dirname(destination), { recursive: true });
  const temporaryPath = `${destination}.${process.pid}.tmp`;
  writeFileSync(temporaryPath, body);
  renameSync(temporaryPath, destination);
}

export async function checkForGithubUpdate(currentVersion: string): Promise<GithubUpdateStatus | undefined> {
  if (!parseBoolean(process.env.ADSMCP_UPDATE_ENABLED, true)) return undefined;

  const statePath = updateStatePath();
  const previous = readState(statePath);
  const now = Date.now();
  const repository = parseGithubRepository(process.env.ADSMCP_UPDATE_REPOSITORY) ?? await repositoryFromOrigin();
  const previousCheckedAt = previous ? Date.parse(previous.lastCheckedAt) : Number.NaN;
  const repositoryChanged = Boolean(repository && previous?.repository !== repositoryLabel(repository));
  if (
    Number.isFinite(previousCheckedAt) &&
    now - previousCheckedAt < CHECK_INTERVAL_MS &&
    !repositoryChanged
  ) {
    return previous;
  }

  if (!repository) {
    const skipped: GithubUpdateStatus = {
      currentVersion,
      status: "skipped",
      lastCheckedAt: new Date(now).toISOString(),
      error: "Configure ADSMCP_UPDATE_REPOSITORY or a GitHub origin remote to enable update checks.",
    };
    writeState(statePath, skipped);
    if (debugEnabled()) log(skipped.error ?? "GitHub update repository is not configured.");
    return skipped;
  }

  const base: GithubUpdateStatus = {
    repository: repositoryLabel(repository),
    currentVersion,
    status: "error",
    lastCheckedAt: new Date(now).toISOString(),
  };

  try {
    const latest = await findLatestUpdate(repository, currentVersion);
    if (!latest || !isNewer(currentVersion, latest.version)) {
      const current: GithubUpdateStatus = {
        ...base,
        status: "up-to-date",
        latestVersion: latest?.version,
        latestRef: latest?.ref,
      };
      writeState(statePath, current);
      if (debugEnabled()) log(`${repositoryLabel(repository)} is up to date.`);
      return current;
    }

    const archivePath = archivePathFor(repository, latest.ref);
    if (!existsSync(archivePath)) await downloadArchive(latest.archiveUrl, archivePath, currentVersion);
    const downloaded: GithubUpdateStatus = {
      ...base,
      status: "downloaded",
      latestVersion: latest.version,
      latestRef: latest.ref,
      downloadedAt: new Date().toISOString(),
      archivePath,
    };
    writeState(statePath, downloaded);
    log(`Downloaded ${repositoryLabel(repository)} ${latest.version} (${latest.source}) to ${archivePath}.`);
    return downloaded;
  } catch (error) {
    const failed: GithubUpdateStatus = {
      ...base,
      error: error instanceof Error ? error.message : String(error),
    };
    writeState(statePath, failed);
    log(`Check failed for ${repositoryLabel(repository)}: ${failed.error}`);
    return failed;
  }
}
