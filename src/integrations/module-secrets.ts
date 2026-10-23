import { existsSync, mkdirSync, readFileSync, renameSync, unlinkSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { randomBytes } from "node:crypto";
import { loadEnv, resolveDataDir } from "../env.js";

const MODULE_SECRET_FILE = "module-secrets.json";
const MAX_SECRET_VALUE_LENGTH = 64_000;
const ENV_KEY = /^[A-Za-z_][A-Za-z0-9_]*$/;

interface ModuleSecretRecord {
  values: Record<string, string>;
  updatedAt: string;
}

interface ModuleSecretStore {
  modules?: Record<string, ModuleSecretRecord>;
}

export type ModuleSecretSource = "module_file" | "environment" | "missing";

export interface ModuleSecretStatus {
  key: string;
  configured: boolean;
  source: ModuleSecretSource;
  maskedValue?: string;
}

export function moduleSecretsPath(): string {
  return join(resolveDataDir(), "secrets", MODULE_SECRET_FILE);
}

function readStore(): ModuleSecretStore {
  const path = moduleSecretsPath();
  if (!existsSync(path)) return {};
  try {
    const parsed = JSON.parse(readFileSync(path, "utf8")) as ModuleSecretStore;
    return parsed && typeof parsed === "object" ? parsed : {};
  } catch {
    return {};
  }
}

function writeStore(value: ModuleSecretStore): void {
  const path = moduleSecretsPath();
  const directory = dirname(path);
  if (!existsSync(directory)) mkdirSync(directory, { recursive: true });
  const temporary = `${path}.${process.pid}.${randomBytes(6).toString("hex")}.tmp`;
  writeFileSync(temporary, `${JSON.stringify(value, null, 2)}\n`, { encoding: "utf8", mode: 0o600 });
  try {
    renameSync(temporary, path);
  } catch (error) {
    const code = (error as NodeJS.ErrnoException).code;
    if (!existsSync(path) || (code !== "EPERM" && code !== "EEXIST")) throw error;
    unlinkSync(path);
    renameSync(temporary, path);
  }
}

function storedValues(moduleId: string): Record<string, string> {
  const record = readStore().modules?.[moduleId];
  return record?.values && typeof record.values === "object" ? record.values : {};
}

function mask(value: string): string {
  const trimmed = value.trim();
  if (trimmed.length <= 4) return "••••";
  return `••••••••${trimmed.slice(-4)}`;
}

export function getModuleSecret(moduleId: string, key: string): string | undefined {
  loadEnv();
  const stored = storedValues(moduleId)[key];
  return typeof stored === "string" && stored.trim() ? stored.trim() : undefined;
}

export function moduleSecretValues(moduleId: string): Record<string, string> {
  return { ...storedValues(moduleId) };
}

export function moduleSecretStatuses(moduleId: string, keys: string[]): {
  statuses: ModuleSecretStatus[];
  updatedAt?: string;
} {
  loadEnv();
  const store = readStore();
  const record = store.modules?.[moduleId];
  const stored = record?.values || {};
  const statuses = [...new Set(keys.filter((key) => ENV_KEY.test(key)))].map((key) => {
    const storedValue = typeof stored[key] === "string" && stored[key].trim() ? stored[key].trim() : undefined;
    const environmentValue = process.env[key]?.trim();
    if (storedValue) {
      return { key, configured: true, source: "module_file" as const, maskedValue: mask(storedValue) };
    }
    if (environmentValue) {
      return { key, configured: true, source: "environment" as const, maskedValue: mask(environmentValue) };
    }
    return { key, configured: false, source: "missing" as const };
  });
  return { statuses, ...(record?.updatedAt ? { updatedAt: record.updatedAt } : {}) };
}

export function saveModuleSecrets(moduleId: string, values: Record<string, string>): {
  path: string;
  updatedAt: string;
  savedKeys: string[];
} {
  const normalizedId = moduleId.trim();
  if (!/^[A-Za-z0-9_.-]{1,120}$/.test(normalizedId)) throw new Error("moduleId has an invalid format");
  const current = readStore();
  const modules = { ...(current.modules || {}) };
  const existing = { ...(modules[normalizedId]?.values || {}) };
  const savedKeys: string[] = [];
  for (const [key, rawValue] of Object.entries(values)) {
    if (!ENV_KEY.test(key)) throw new Error(`invalid environment key: ${key}`);
    if (typeof rawValue !== "string") throw new Error(`value for ${key} must be a string`);
    const value = rawValue.trim();
    if (!value) continue;
    if (value.length > MAX_SECRET_VALUE_LENGTH) throw new Error(`value for ${key} is too long`);
    existing[key] = value;
    savedKeys.push(key);
  }
  const updatedAt = new Date().toISOString();
  modules[normalizedId] = { values: existing, updatedAt };
  writeStore({ ...current, modules });
  return { path: moduleSecretsPath(), updatedAt, savedKeys };
}
