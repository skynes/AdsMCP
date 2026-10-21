import { loadEnv } from "../env.js";
import { randomUUID } from "node:crypto";
import {
  syncTelegramAdsReport,
  type TelegramAdsReport,
  type TelegramAdsSnapshot,
} from "./telegram-ads.js";
import type { CampaignStatus } from "../types.js";

const OFFICIAL_API_BASE_URL = "https://promoteapi.telegram.org";
const OFFICIAL_API_DOCS_URL = "https://ads.telegram.org/docs/api";
const TOKEN_ENV = "ADS_TELEGRAM_ADS_API_TOKEN";
const DEFAULT_TIMEOUT_MS = 30_000;

const READ_METHODS = [
  "getCurrentAccount",
  "getAccountInfo",
  "getRelatedAccountsList",
  "getAccountsById",
  "getAdsById",
  "getAdsList",
  "getAdStats",
  "getAccountStats",
  "getAccountReport",
  "getAdTransactionsList",
  "getAccountTransactionsList",
  "getAudiencesById",
  "getAudiencesList",
  "getPixel",
  "getPixelEventsById",
  "getPixelEventsList",
  "getTargetLanguagesList",
  "getTargetTopicsList",
  "getTargetCountriesList",
  "getTargetLocationsById",
  "getTargetLocationsList",
  "getTargetChannel",
  "getTargetBot",
] as const;

const WRITE_METHODS = [
  "createAd",
  "editAd",
  "editAdStatus",
  "increaseAdBudget",
  "decreaseAdBudget",
  "submitAdForReview",
  "deleteAd",
  "increaseAccountBudget",
  "decreaseAccountBudget",
  "createAudience",
  "editAudience",
  "deleteAudience",
  "createPixel",
  "createPixelEvent",
  "editPixelEvent",
  "deletePixelEvent",
] as const;

type JsonObject = Record<string, unknown>;

export interface TelegramAdsOfficialApiPlan {
  provider: "telegram_ads";
  layer: "official_api";
  docsUrl: string;
  baseUrl: string;
  tokenEnv: string;
  configured: boolean;
  readOnly: false;
  readMethods: readonly string[];
  writeMethods: readonly string[];
  writeEnabled: boolean;
  nextActions: string[];
}

export interface TelegramAdsOfficialApiStatus extends TelegramAdsOfficialApiPlan {
  probed: boolean;
  healthy?: boolean;
  account?: {
    accountId?: string;
    title?: string;
    currency?: string;
  };
  error?: string;
}

export interface TelegramAdsOfficialApiCreateAdInput {
  accountId?: string;
  title: string;
  text?: string;
  promoteUrl: string;
  cpm: number;
  placement: "channel_post" | "bot_banner" | "search_result" | "video_banner";
  target: Record<string, unknown>;
  impressionFrequency?: number;
  showUserpic?: boolean;
  initialBudget?: number;
  dailyBudgetLimit?: number;
  isPaused?: boolean;
  returnTarget?: boolean;
  idempotencyKey?: string;
  timeoutMs?: number;
  confirm?: boolean;
}

interface DateRange {
  from: number;
  to: number;
  fromIso: string;
  toIso: string;
}

function stringValue(value: unknown): string {
  return value === undefined || value === null ? "" : String(value).trim();
}

function numberValue(value: unknown): number {
  if (typeof value === "number") return Number.isFinite(value) ? value : 0;
  const raw = stringValue(value).replace(/\u00a0/g, "").replace(/\s/g, "");
  if (!raw) return 0;
  const normalized = raw.includes(".") ? raw.replace(/,/g, "") : raw.replace(/,/g, ".");
  const parsed = Number(normalized.replace(/[^\d+\-.]/g, ""));
  return Number.isFinite(parsed) ? parsed : 0;
}

function optionalNumber(value: unknown): number | null {
  if (value === undefined || value === null || value === "") return null;
  return numberValue(value);
}

function objectValue(value: unknown): JsonObject {
  return value && typeof value === "object" && !Array.isArray(value) ? value as JsonObject : {};
}

function firstValue(row: JsonObject, ...keys: string[]): unknown {
  for (const key of keys) {
    if (row[key] !== undefined && row[key] !== null) return row[key];
  }
  const normalized = new Map(
    Object.entries(row).map(([key, value]) => [key.toLowerCase().replace(/[^a-z0-9]/g, ""), value]),
  );
  for (const key of keys) {
    const value = normalized.get(key.toLowerCase().replace(/[^a-z0-9]/g, ""));
    if (value !== undefined && value !== null) return value;
  }
  return undefined;
}

function rowsFromUnknown(value: unknown): JsonObject[] {
  if (Array.isArray(value)) {
    return value.filter((row): row is JsonObject => Boolean(row && typeof row === "object" && !Array.isArray(row)));
  }
  const object = objectValue(value);
  for (const key of ["ads", "items", "accounts", "audiences", "transactions", "data", "result"]) {
    const rows = rowsFromUnknown(object[key]);
    if (rows.length) return rows;
  }
  return [];
}

function normalizeCurrency(value: unknown): string {
  const currency = stringValue(value).toUpperCase();
  if (currency === "GRM" || currency === "TON") return "GRAM";
  return currency || "GRAM";
}

function statusForAd(value: unknown): CampaignStatus {
  return stringValue(value).toLowerCase() === "active" ? "active" : "paused";
}

function apiBaseUrl(): string {
  loadEnv();
  return (process.env.ADS_TELEGRAM_ADS_API_BASE_URL?.trim() || OFFICIAL_API_BASE_URL).replace(/\/+$/, "");
}

function apiToken(): string {
  loadEnv();
  return process.env[TOKEN_ENV]?.trim() || "";
}

function apiPlan(): TelegramAdsOfficialApiPlan {
  const configured = Boolean(apiToken());
  return {
    provider: "telegram_ads",
    layer: "official_api",
    docsUrl: OFFICIAL_API_DOCS_URL,
    baseUrl: apiBaseUrl(),
    tokenEnv: TOKEN_ENV,
    configured,
    readOnly: false,
    readMethods: [...READ_METHODS],
    writeMethods: [...WRITE_METHODS],
    writeEnabled: configured,
    nextActions: configured
      ? ["Call ads_telegram_ads_api_status with probe=true to verify the token.", "Use ads_telegram_ads_api_report for official date-bounded metrics.", "Provider writes are guarded and require confirm=true."]
      : [`Create an API token in Telegram Ads account settings and store it in ${TOKEN_ENV}.`, "Restart AdsMCP after adding the token."],
  };
}

function safeError(value: unknown): string {
  const text = value instanceof Error ? value.message : String(value);
  return text.replace(/Bearer\s+[^\s]+/gi, "Bearer [redacted]").slice(0, 500);
}

async function requestApi<T = unknown>(
  method: string,
  parameters: JsonObject = {},
  timeoutMs = DEFAULT_TIMEOUT_MS,
  idempotencyKey?: string,
): Promise<T> {
  const token = apiToken();
  if (!token) throw new Error(`${TOKEN_ENV} is not configured`);
  const response = await fetch(`${apiBaseUrl()}/${method}`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
      Accept: "application/json",
      ...(idempotencyKey ? { "Idempotency-Key": idempotencyKey } : {}),
    },
    body: JSON.stringify(parameters),
    signal: AbortSignal.timeout(timeoutMs),
  });
  const text = await response.text();
  let payload: JsonObject;
  try {
    payload = objectValue(JSON.parse(text));
  } catch {
    throw new Error(`Telegram Ads official API returned non-JSON HTTP ${response.status}`);
  }
  if (!response.ok || payload.ok !== true) {
    throw new Error(`Telegram Ads official API ${method} failed: ${stringValue(payload.error) || `HTTP ${response.status}`}`);
  }
  return payload.result as T;
}

export async function createTelegramAdsOfficialApiAd(input: TelegramAdsOfficialApiCreateAdInput) {
  if (input.confirm !== true) {
    throw new Error("Creating a Telegram Ads advertisement requires confirm=true");
  }
  if (!input.title.trim()) throw new Error("Telegram Ads ad title is required");
  if (!input.promoteUrl.trim()) throw new Error("Telegram Ads promote URL is required");
  if (!Number.isFinite(input.cpm) || input.cpm <= 0) throw new Error("Telegram Ads CPM must be a positive number");
  if (!input.target || typeof input.target !== "object") throw new Error("Telegram Ads target is required");

  const accountId = input.accountId?.trim();
  const idempotencyKey = input.idempotencyKey?.trim() || randomUUID();
  const parameters: JsonObject = {
    ...(accountId ? { account_id: accountId } : {}),
    title: input.title.trim(),
    ...(input.text?.trim() ? { text: input.text.trim() } : {}),
    promote_url: input.promoteUrl.trim(),
    cpm: input.cpm,
    placement: input.placement,
    target: input.target,
    impression_frequency: input.impressionFrequency ?? 1,
    show_userpic: input.showUserpic ?? false,
    initial_budget: input.initialBudget ?? 0,
    daily_budget_limit: input.dailyBudgetLimit ?? 0,
    is_paused: input.isPaused ?? true,
    return_target: input.returnTarget ?? true,
    idempotency_key: idempotencyKey,
  };
  const ad = objectValue(await requestApi("createAd", parameters, input.timeoutMs ?? DEFAULT_TIMEOUT_MS, idempotencyKey));
  return {
    provider: "telegram_ads",
    layer: "official_api",
    method: "createAd",
    writeEnabled: true,
    accountId: accountId || undefined,
    idempotent: true,
    ad,
  };
}

interface TelegramAdsOfficialApiWriteInput {
  accountId?: string;
  adId: string | number;
  timeoutMs?: number;
  confirm?: boolean;
}

function requireWriteConfirmation(input: { confirm?: boolean }) {
  if (input.confirm !== true) {
    throw new Error("Telegram Ads provider writes require confirm=true");
  }
}

function adIdValue(value: string | number): number {
  const parsed = typeof value === "number" ? value : Number(value.trim());
  if (!Number.isInteger(parsed) || parsed <= 0) throw new Error("Telegram Ads ad_id must be a positive integer");
  return parsed;
}

export async function increaseTelegramAdsOfficialApiAdBudget(input: TelegramAdsOfficialApiWriteInput & {
  amount: number;
  idempotencyKey?: string;
}) {
  requireWriteConfirmation(input);
  if (!Number.isFinite(input.amount) || input.amount <= 0) throw new Error("Telegram Ads budget amount must be positive");
  const accountId = input.accountId?.trim();
  const idempotencyKey = input.idempotencyKey?.trim() || randomUUID();
  const ad = objectValue(await requestApi("increaseAdBudget", {
    ...(accountId ? { account_id: accountId } : {}),
    ad_id: adIdValue(input.adId),
    amount: input.amount,
    idempotency_key: idempotencyKey,
  }, input.timeoutMs ?? DEFAULT_TIMEOUT_MS, idempotencyKey));
  return { provider: "telegram_ads", layer: "official_api", method: "increaseAdBudget", writeEnabled: true, ad };
}

export async function submitTelegramAdsOfficialApiAdForReview(input: TelegramAdsOfficialApiWriteInput) {
  requireWriteConfirmation(input);
  const accountId = input.accountId?.trim();
  const ad = objectValue(await requestApi("submitAdForReview", {
    ...(accountId ? { account_id: accountId } : {}),
    ad_id: adIdValue(input.adId),
  }, input.timeoutMs ?? DEFAULT_TIMEOUT_MS));
  return { provider: "telegram_ads", layer: "official_api", method: "submitAdForReview", writeEnabled: true, ad };
}

export async function setTelegramAdsOfficialApiAdPaused(input: TelegramAdsOfficialApiWriteInput & { isPaused: boolean }) {
  requireWriteConfirmation(input);
  const accountId = input.accountId?.trim();
  const ad = objectValue(await requestApi("editAd", {
    ...(accountId ? { account_id: accountId } : {}),
    ad_id: adIdValue(input.adId),
    is_paused: input.isPaused,
  }, input.timeoutMs ?? DEFAULT_TIMEOUT_MS));
  return { provider: "telegram_ads", layer: "official_api", method: "editAd", writeEnabled: true, ad };
}

function dateOnly(value: string | undefined): string | undefined {
  const trimmed = value?.trim();
  if (!trimmed) return undefined;
  if (!/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) throw new Error(`Invalid date, expected YYYY-MM-DD: ${trimmed}`);
  const parsed = new Date(`${trimmed}T00:00:00.000Z`);
  if (Number.isNaN(parsed.getTime())) throw new Error(`Invalid date: ${trimmed}`);
  return trimmed;
}

function addDays(value: string, days: number): string {
  const date = new Date(`${value}T00:00:00.000Z`);
  date.setUTCDate(date.getUTCDate() + days);
  return date.toISOString().slice(0, 10);
}

function rangeFor(period: "5min" | "day", fromInput?: string, toInput?: string): DateRange {
  const fromDate = dateOnly(fromInput);
  const toDate = dateOnly(toInput);
  if (period === "5min" && !fromDate && !toDate) {
    const to = new Date();
    const from = new Date(to.getTime() - 24 * 60 * 60 * 1000);
    return { from: Math.floor(from.getTime() / 1000), to: Math.floor(to.getTime() / 1000), fromIso: from.toISOString(), toIso: to.toISOString() };
  }
  if (period === "day" && !fromDate && !toDate) {
    const today = new Date().toISOString().slice(0, 10);
    const from = new Date(`${today}T00:00:00.000Z`);
    const to = new Date(`${addDays(today, 1)}T00:00:00.000Z`);
    return { from: Math.floor(from.getTime() / 1000), to: Math.floor(to.getTime() / 1000), fromIso: from.toISOString(), toIso: to.toISOString() };
  }
  const startDate = fromDate || toDate!;
  const endDate = toDate || fromDate!;
  const from = new Date(`${startDate}T00:00:00.000Z`);
  const to = new Date(`${addDays(endDate, 1)}T00:00:00.000Z`);
  const maxSeconds = period === "5min" ? 1000 * 300 : 1000 * 86400;
  const duration = (to.getTime() - from.getTime()) / 1000;
  if (duration > maxSeconds) {
    throw new Error(`Telegram Ads official API supports at most ${maxSeconds} seconds for ${period} stats in one request`);
  }
  return { from: Math.floor(from.getTime() / 1000), to: Math.floor(to.getTime() / 1000), fromIso: from.toISOString(), toIso: to.toISOString() };
}

function accountSummary(account: JsonObject) {
  const accountId = stringValue(firstValue(account, "account_id", "owner_id", "id"));
  const title = stringValue(firstValue(account, "title", "name"));
  const currency = normalizeCurrency(firstValue(account, "currency"));
  return {
    ...(accountId ? { account_id: accountId } : {}),
    ...(title ? { title } : {}),
    ...(currency ? { currency } : {}),
  };
}

function statsSummary(items: JsonObject[]): JsonObject {
  return items.reduce<JsonObject>((sum, item) => ({
    views: numberValue(sum.views) + numberValue(firstValue(item, "views", "impressions")),
    opens: numberValue(sum.opens) + numberValue(firstValue(item, "opens")),
    clicks: numberValue(sum.clicks) + numberValue(firstValue(item, "clicks")),
    actions: numberValue(sum.actions) + numberValue(firstValue(item, "actions", "joins", "conversions")),
    spend: numberValue(sum.spend) + numberValue(firstValue(item, "spent_budget", "spend", "cost")),
  }), { views: 0, opens: 0, clicks: 0, actions: 0, spend: 0 });
}

function statsRaw(items: JsonObject[], range: DateRange, period: "5min" | "day"): JsonObject {
  return {
    source: "telegram_ads_official_api",
    scope: "period",
    from_time: range.from,
    to_time: range.to,
    interval: period === "5min" ? 300 : 86400,
    items,
    summary: statsSummary(items),
  };
}

export function telegramAdsOfficialApiPlan(): TelegramAdsOfficialApiPlan {
  return apiPlan();
}

export async function telegramAdsOfficialApiStatus(input: { probe?: boolean } = {}): Promise<TelegramAdsOfficialApiStatus> {
  const plan = apiPlan();
  if (!input.probe) return { ...plan, probed: false };
  if (!plan.configured) return { ...plan, probed: true, healthy: false, error: `${TOKEN_ENV} is not configured` };
  try {
    const account = objectValue(await requestApi("getCurrentAccount"));
    return {
      ...plan,
      probed: true,
      healthy: true,
      account: {
        ...(stringValue(firstValue(account, "account_id", "owner_id", "id")) ? { accountId: stringValue(firstValue(account, "account_id", "owner_id", "id")) } : {}),
        ...(stringValue(firstValue(account, "title", "name")) ? { title: stringValue(firstValue(account, "title", "name")) } : {}),
        ...(stringValue(firstValue(account, "currency")) ? { currency: normalizeCurrency(firstValue(account, "currency")) } : {}),
      },
    };
  } catch (error) {
    return { ...plan, probed: true, healthy: false, error: safeError(error) };
  }
}

export async function pullTelegramAdsOfficialApiReport(input: {
  accountId?: string;
  statsPeriod?: "5min" | "day";
  includeStats?: boolean;
  maxAds?: number;
  from?: string;
  to?: string;
  timeoutMs?: number;
}): Promise<TelegramAdsReport> {
  const plan = apiPlan();
  if (!plan.configured) throw new Error(`${TOKEN_ENV} is not configured`);
  const statsPeriod = input.statsPeriod || "day";
  const maxAds = Math.max(1, Math.min(input.maxAds ?? 100, 100));
  const range = rangeFor(statsPeriod, input.from, input.to);
  const account = objectValue(await requestApi("getCurrentAccount", {}, input.timeoutMs));
  const accountId = input.accountId?.trim() || stringValue(firstValue(account, "account_id", "owner_id", "id")) || "default";
  const accountParameters = accountId === "default" ? {} : { account_id: accountId };
  const currency = normalizeCurrency(firstValue(account, "currency"));
  const ads: TelegramAdsSnapshot[] = [];
  const statsErrors: Array<{ adId: string; error: string }> = [];
  let offset = "";
  let nextOffsetId: string | undefined;

  for (let page = 0; page < 10 && ads.length < maxAds; page += 1) {
    const parameters: JsonObject = {
      ...accountParameters,
      limit: Math.min(100, maxAds - ads.length),
      return_target: true,
    };
    if (offset) parameters.offset = offset;
    const result = objectValue(await requestApi("getAdsList", parameters, input.timeoutMs));
    const rows = rowsFromUnknown(result).slice(0, maxAds - ads.length);
    if (!rows.length) break;
    for (const ad of rows) {
      const adId = stringValue(firstValue(ad, "ad_id", "id"));
      if (!adId) continue;
      let statsItems: JsonObject[] = [];
      let statsLoaded = false;
      let statsError: string | undefined;
      if (input.includeStats !== false) {
        try {
          const statsResult = await requestApi("getAdStats", {
            ...accountParameters,
            ad_id: Number(adId),
            from_time: range.from,
            to_time: range.to,
            interval: statsPeriod === "5min" ? 300 : 86400,
          }, input.timeoutMs);
          statsItems = rowsFromUnknown(statsResult);
          statsLoaded = true;
        } catch (error) {
          statsError = safeError(error);
          statsErrors.push({ adId, error: statsError });
        }
      }
      const summary = statsLoaded ? statsSummary(statsItems) : {};
      const views = statsLoaded ? numberValue(summary.views) : numberValue(firstValue(ad, "views", "impressions"));
      const clicks = statsLoaded ? numberValue(summary.clicks) : numberValue(firstValue(ad, "clicks"));
      const conversions = statsLoaded ? numberValue(summary.actions) : numberValue(firstValue(ad, "actions", "joins", "conversions"));
      const spend = statsLoaded ? numberValue(summary.spend) : numberValue(firstValue(ad, "spent_budget", "spent", "spend"));
      const rawStatus = stringValue(firstValue(ad, "status"));
      const target = objectValue(firstValue(ad, "target"));
      const adCurrency = normalizeCurrency(firstValue(ad, "currency") ?? currency);
      ads.push({
        adId,
        accountId,
        name: stringValue(firstValue(ad, "title", "name")) || `Telegram Ads ${adId}`,
        status: statusForAd(rawStatus),
        externalStatus: rawStatus,
        currency: adCurrency,
        date: input.to || input.from || new Date().toISOString().slice(0, 10),
        spend,
        impressions: views,
        clicks,
        conversions,
        ctr: views > 0 ? (clicks / views) * 100 : null,
        cpc: clicks > 0 ? spend / clicks : null,
        cpm: views > 0 ? (spend / views) * 1000 : optionalNumber(firstValue(ad, "cpm")),
        budget: optionalNumber(firstValue(ad, "remaining_budget", "budget")),
        dailyBudget: optionalNumber(firstValue(ad, "daily_budget_limit", "daily_budget")),
        ...(stringValue(firstValue(ad, "promote_url", "url")) ? { promoteUrl: stringValue(firstValue(ad, "promote_url", "url")) } : {}),
        ...(stringValue(firstValue(target, "type")) ? { targetType: stringValue(firstValue(target, "type")) } : {}),
        rawAd: ad,
        ...(statsLoaded ? { rawStats: statsRaw(statsItems, range, statsPeriod) } : {}),
        ...(statsError ? { statsError } : {}),
      });
    }
    const next = stringValue(firstValue(result, "next_offset", "next_offset_id", "nextOffsetId"));
    if (!next || next === offset) break;
    offset = next;
    nextOffsetId = next;
  }

  const reportDate = input.to || input.from || new Date().toISOString().slice(0, 10);
  return {
    moduleId: "telegram_ads",
    sourceLayer: "official_api",
    apiBaseUrl: apiBaseUrl(),
    listTool: "getAdsList",
    ...(input.includeStats === false ? {} : { statsTool: "getAdStats" }),
    statsPeriod,
    date: reportDate,
    account: accountSummary(account),
    ads,
    ...(nextOffsetId ? { nextOffsetId } : {}),
    statsErrors,
    totals: ads.reduce((sum, ad) => ({
      spend: sum.spend + ad.spend,
      impressions: sum.impressions + ad.impressions,
      clicks: sum.clicks + ad.clicks,
    }), { spend: 0, impressions: 0, clicks: 0 }),
  };
}

export function syncTelegramAdsOfficialApiReport(report: TelegramAdsReport, projectId?: string) {
  return syncTelegramAdsReport(report, projectId);
}
