import { randomBytes } from "node:crypto";
import { existsSync, mkdirSync, readFileSync, renameSync, statSync, writeFileSync } from "node:fs";
import { dirname, isAbsolute, join, relative } from "node:path";
import { fileURLToPath } from "node:url";
import { callModuleTool } from "./integrations/mcp-modules.js";
import { resolveDataDir } from "./env.js";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const YANDEX_DIRECT_REDIRECT_URI = "https://oauth.yandex.ru/verification_code";
const SETTINGS_FILE = "yandex-direct-settings.json";

interface YandexDirectSettings {
  clientId?: string;
  clientLogin?: string;
  updatedAt?: string;
}

export interface YandexDirectSettingsStatus {
  configured: boolean;
  tokenConfigured: boolean;
  clientId?: string;
  clientIdMasked?: string;
  clientLogin?: string;
  tokenPath: string;
  settingsPath: string;
  updatedAt?: string;
  redirectUri: string;
  writeEnabled: boolean;
}

function settingsPath(): string {
  return join(resolveDataDir(), SETTINGS_FILE);
}

function tokenPath(): string {
  const configured = process.env.ADS_YANDEX_DIRECT_TOKEN_FILE?.trim();
  if (configured) {
    return isAbsolute(configured) ? configured : join(ROOT, configured);
  }
  return join(resolveDataDir(), "secrets", "yandex-direct.token");
}

function readSettings(): YandexDirectSettings {
  const path = settingsPath();
  if (!existsSync(path)) return {};
  try {
    const parsed = JSON.parse(readFileSync(path, "utf8")) as YandexDirectSettings;
    return parsed && typeof parsed === "object" ? parsed : {};
  } catch {
    return {};
  }
}

function writeSettings(value: YandexDirectSettings): void {
  const dir = resolveDataDir();
  if (!existsSync(dir)) mkdirSync(dir, { recursive: true });
  writeFileSync(settingsPath(), `${JSON.stringify(value, null, 2)}\n`, { encoding: "utf8", mode: 0o600 });
}

function maskClientId(value: string): string {
  const clientId = value.trim();
  if (clientId.length <= 8) return "••••";
  return `${clientId.slice(0, 4)}••••${clientId.slice(-4)}`;
}

function validateClientId(value: string): string {
  const clientId = value.trim();
  if (!/^[0-9a-fA-F]{32}$/.test(clientId)) {
    throw new Error("Yandex OAuth Client ID должен содержать 32 шестнадцатеричных символа");
  }
  return clientId;
}

function validateClientLogin(value: string | undefined): string | undefined {
  const clientLogin = value?.trim() || undefined;
  if (clientLogin && !/^[a-zA-Z0-9._-]{1,128}$/.test(clientLogin)) {
    throw new Error("Yandex Client-Login содержит недопустимые символы");
  }
  return clientLogin;
}

function validateToken(value: string): string {
  const token = value.trim();
  if (!token) throw new Error("Yandex OAuth token обязателен");
  if (token.length > 4096 || /\s/.test(token)) throw new Error("Yandex OAuth token имеет неверный формат");
  return token;
}

function envFilePath(): string {
  return join(ROOT, ".env");
}

function updateEnvFile(entries: Record<string, string>): void {
  const path = envFilePath();
  let content = existsSync(path) ? readFileSync(path, "utf8") : "";
  for (const [key, value] of Object.entries(entries)) {
    const escapedKey = key.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const line = `${key}=${value}`;
    const pattern = new RegExp(`^\\s*#?\\s*${escapedKey}=.*$`, "m");
    if (pattern.test(content)) {
      content = content.replace(pattern, line);
    } else {
      if (content && !content.endsWith("\n")) content += "\n";
      content += `${line}\n`;
    }
  }
  writeFileSync(path, content, { encoding: "utf8", mode: 0o600 });
}

function relativeTokenPath(path: string): string {
  const value = relative(ROOT, path).replaceAll("\\", "/");
  return value && !value.startsWith("..") ? value : path;
}

function applyRuntimeSettings(clientLogin: string | undefined, tokenFile: string): void {
  process.env.ADS_YANDEX_DIRECT_TOKEN_FILE = tokenFile;
  if (clientLogin) process.env.ADS_YANDEX_DIRECT_CLIENT_LOGIN = clientLogin;
  else delete process.env.ADS_YANDEX_DIRECT_CLIENT_LOGIN;
}

function persistSettings(input: { clientId?: string; clientLogin?: string }): YandexDirectSettings {
  const current = readSettings();
  const next: YandexDirectSettings = {
    ...current,
    ...(input.clientId ? { clientId: input.clientId } : {}),
    ...(input.clientLogin ? { clientLogin: input.clientLogin } : { clientLogin: undefined }),
    updatedAt: new Date().toISOString(),
  };
  writeSettings(next);
  return next;
}

export function yandexDirectSettingsStatus(): YandexDirectSettingsStatus {
  const settings = readSettings();
  const path = tokenPath();
  let tokenConfigured = false;
  try {
    tokenConfigured = statSync(path).isFile() && readFileSync(path, "utf8").trim().length > 0;
  } catch {
    tokenConfigured = false;
  }
  const clientId = settings.clientId?.trim() || undefined;
  const clientLogin = process.env.ADS_YANDEX_DIRECT_CLIENT_LOGIN?.trim() || settings.clientLogin?.trim() || undefined;
  return {
    configured: tokenConfigured,
    tokenConfigured,
    ...(clientId ? { clientId, clientIdMasked: maskClientId(clientId) } : {}),
    ...(clientLogin ? { clientLogin } : {}),
    tokenPath: path,
    settingsPath: settingsPath(),
    ...(settings.updatedAt ? { updatedAt: settings.updatedAt } : {}),
    redirectUri: YANDEX_DIRECT_REDIRECT_URI,
    writeEnabled: process.env.ADS_YANDEX_DIRECT_WRITE_ENABLED?.trim().toLowerCase() === "true",
  };
}

export function yandexDirectAuthorizationUrl(input: {
  clientId: string;
  clientLogin?: string;
}): { authorizationUrl: string; status: YandexDirectSettingsStatus } {
  const clientId = validateClientId(input.clientId);
  const clientLogin = validateClientLogin(input.clientLogin);
  const settings = persistSettings({ clientId, clientLogin });
  const tokenFile = tokenPath();
  applyRuntimeSettings(clientLogin, tokenFile);
  updateEnvFile({
    ADS_YANDEX_DIRECT_TOKEN_FILE: relativeTokenPath(tokenFile),
    ADS_YANDEX_DIRECT_CLIENT_LOGIN: clientLogin || "",
  });
  const params = new URLSearchParams({ response_type: "token", client_id: clientId });
  return {
    authorizationUrl: `https://oauth.yandex.ru/authorize?${params.toString()}`,
    status: {
      ...yandexDirectSettingsStatus(),
      ...(settings.updatedAt ? { updatedAt: settings.updatedAt } : {}),
    },
  };
}

export function saveYandexDirectToken(input: {
  token: string;
  clientId?: string;
  clientLogin?: string;
}): YandexDirectSettingsStatus {
  const token = validateToken(input.token);
  const clientId = input.clientId?.trim() ? validateClientId(input.clientId) : readSettings().clientId;
  const clientLogin = validateClientLogin(input.clientLogin);
  if (clientId) persistSettings({ clientId, clientLogin });
  else persistSettings({ clientLogin });

  const path = tokenPath();
  const dir = dirname(path);
  if (!existsSync(dir)) mkdirSync(dir, { recursive: true });
  const temporary = `${path}.${process.pid}.${randomBytes(6).toString("hex")}.tmp`;
  writeFileSync(temporary, `${token}\n`, { encoding: "utf8", mode: 0o600 });
  renameSync(temporary, path);
  applyRuntimeSettings(clientLogin, path);
  updateEnvFile({
    ADS_YANDEX_DIRECT_TOKEN_FILE: relativeTokenPath(path),
    ADS_YANDEX_DIRECT_CLIENT_LOGIN: clientLogin || "",
  });
  return yandexDirectSettingsStatus();
}

export interface YandexDirectCampaignSummary {
  id: string;
  name: string;
  state?: string;
  status?: string;
  type?: string;
}

function objectValue(object: Record<string, unknown>, names: string[]): unknown {
  const normalized = new Map(
    Object.entries(object).map(([key, value]) => [key.toLowerCase().replace(/[^a-z0-9]/g, ""), value]),
  );
  for (const name of names) {
    const value = normalized.get(name.toLowerCase().replace(/[^a-z0-9]/g, ""));
    if (value !== undefined && value !== null) return value;
  }
  return undefined;
}

function campaignSummary(value: unknown): YandexDirectCampaignSummary | undefined {
  if (!value || typeof value !== "object" || Array.isArray(value)) return undefined;
  const object = value as Record<string, unknown>;
  const id = objectValue(object, ["Id", "CampaignId", "CampaignID", "id"]);
  const name = objectValue(object, ["Name", "CampaignName", "name"]);
  if (id === undefined || name === undefined) return undefined;
  const summary: YandexDirectCampaignSummary = { id: String(id), name: String(name) };
  const state = objectValue(object, ["State", "state"]);
  const status = objectValue(object, ["Status", "status"]);
  const type = objectValue(object, ["Type", "type"]);
  if (state !== undefined) summary.state = String(state);
  if (status !== undefined) summary.status = String(status);
  if (type !== undefined) summary.type = String(type);
  return summary;
}

function collectCampaigns(value: unknown, output: YandexDirectCampaignSummary[], seen: Set<unknown>): void {
  if (!value || typeof value !== "object" || seen.has(value)) return;
  seen.add(value);
  if (Array.isArray(value)) {
    for (const item of value) {
      const campaign = campaignSummary(item);
      if (campaign) output.push(campaign);
      else collectCampaigns(item, output, seen);
    }
    return;
  }
  const campaign = campaignSummary(value);
  if (campaign) {
    output.push(campaign);
    return;
  }
  for (const nested of Object.values(value as Record<string, unknown>)) {
    collectCampaigns(nested, output, seen);
  }
}

function extractCampaigns(...values: unknown[]): YandexDirectCampaignSummary[] {
  const campaigns: YandexDirectCampaignSummary[] = [];
  const seen = new Set<unknown>();
  for (const value of values) collectCampaigns(value, campaigns, seen);
  const unique = new Map(campaigns.map((campaign) => [`${campaign.id}:${campaign.name}`, campaign]));
  return [...unique.values()];
}

function parseContentJson(value: unknown): unknown {
  if (!value || typeof value !== "object") return undefined;
  const text = (value as Record<string, unknown>).text;
  if (typeof text !== "string") return undefined;
  try {
    return JSON.parse(text) as unknown;
  } catch {
    return undefined;
  }
}

export async function checkYandexDirectConnection(): Promise<{
  connected: boolean;
  campaigns?: number;
  campaignList?: YandexDirectCampaignSummary[];
  checkedAt: string;
  error?: string;
}> {
  const status = yandexDirectSettingsStatus();
  if (!status.tokenConfigured) {
    return { connected: false, checkedAt: new Date().toISOString(), error: "Сначала сохрани OAuth-токен Яндекс Директа." };
  }
  try {
    const result = await callModuleTool({
      moduleId: "yandex_mcp_zai",
      toolName: "direct_list_campaigns",
      arguments: { selection_criteria: {} },
      timeoutMs: 60_000,
    });
    if (result.is_error) {
      return { connected: false, checkedAt: new Date().toISOString(), error: "Яндекс отклонил запрос. Проверь токен и доступ к кабинету." };
    }
    const campaignList = extractCampaigns(
      result.structured_content,
      ...(result.content || []).map((block) => parseContentJson(block)),
    );
    const providerPayloads = [
      result.structured_content,
      ...(result.content || []).map((block) => parseContentJson(block)),
    ];
    const hasProviderPayload = providerPayloads.some(
      (value) => value && typeof value === "object" && !Array.isArray(value) && Object.keys(value).length > 0,
    );
    if (!hasProviderPayload) {
      return {
        connected: false,
        checkedAt: new Date().toISOString(),
        error: "Yandex Direct вернул пустой ответ. Проверь созданный рекламный кабинет и принятые условия API.",
      };
    }
    return {
      connected: true,
      campaigns: campaignList.length,
      ...(campaignList.length ? { campaignList } : {}),
      checkedAt: new Date().toISOString(),
    };
  } catch {
    return { connected: false, checkedAt: new Date().toISOString(), error: "Не удалось запустить модуль Яндекс Директа." };
  }
}
