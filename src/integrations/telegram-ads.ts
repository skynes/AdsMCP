import { createHash } from "node:crypto";
import { callModuleTool } from "./mcp-modules.js";
import {
  createCampaign,
  getCampaign,
  recordSpend,
  upsertCampaignMetricPoints,
  updateCampaign,
} from "../store.js";
import type { CampaignStatus } from "../types.js";

const DEFAULT_MODULE_ID = "telegram_ads";
const DEFAULT_LIST_TOOL = "get_ads";
const DEFAULT_STATS_TOOL = "get_ad_stats";

export interface TelegramAdsSnapshot {
  adId: string;
  accountId: string;
  name: string;
  status: CampaignStatus;
  externalStatus: string;
  currency: string;
  date: string;
  spend: number;
  impressions: number;
  clicks: number;
  conversions: number;
  ctr: number | null;
  cpc: number | null;
  cpm: number | null;
  budget: number | null;
  dailyBudget: number | null;
  promoteUrl?: string;
  targetType?: string;
  rawAd: Record<string, unknown>;
  rawStats?: Record<string, unknown>;
  statsError?: string;
}

export interface TelegramAdsReport {
  moduleId: string;
  sourceLayer?: "session" | "official_api";
  apiBaseUrl?: string;
  listTool: string;
  statsTool?: string;
  statsPeriod: "5min" | "day";
  date: string;
  account: Record<string, unknown>;
  ads: TelegramAdsSnapshot[];
  nextOffsetId?: string;
  statsErrors: Array<{ adId: string; error: string }>;
  totals: {
    spend: number;
    impressions: number;
    clicks: number;
  };
}

export interface TelegramAdsAccountsReport {
  moduleId: string;
  activeAccountId?: string;
  requestedAccountId?: string;
  all: boolean;
  restoredAccountId?: string;
  accounts: Array<{
    accountId: string;
    title?: string;
    description?: string;
    url?: string;
    report?: TelegramAdsReport;
    error?: string;
  }>;
}

export interface TelegramAdsProjectRule {
  projectId: string;
  nameContains?: string;
  urlContains?: string;
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

function firstValue(row: Record<string, unknown>, ...keys: string[]): unknown {
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

function objectValue(value: unknown): Record<string, unknown> {
  return value && typeof value === "object" && !Array.isArray(value) ? (value as Record<string, unknown>) : {};
}

function parseJsonText(value: string): unknown {
  const trimmed = value.trim().replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/, "");
  if (!trimmed.startsWith("{") && !trimmed.startsWith("[")) return undefined;
  try {
    return JSON.parse(trimmed) as unknown;
  } catch {
    return undefined;
  }
}

function extractModulePayload(result: Awaited<ReturnType<typeof callModuleTool>>): unknown {
  if (result.structured_content !== undefined) return result.structured_content;
  for (const block of result.content) {
    const text = typeof block.text === "string" ? block.text : undefined;
    if (!text) continue;
    return parseJsonText(text) ?? text;
  }
  return undefined;
}

function rowsFromUnknown(value: unknown, seen = new Set<object>()): Record<string, unknown>[] {
  if (Array.isArray(value)) {
    return value.filter((row): row is Record<string, unknown> => Boolean(row && typeof row === "object"));
  }
  const object = objectValue(value);
  if (!Object.keys(object).length || seen.has(object)) return [];
  seen.add(object);
  for (const key of ["items", "ads", "accounts", "data", "results", "result", "output"]) {
    const rows = rowsFromUnknown(object[key], seen);
    if (rows.length) return rows;
  }
  return [];
}

function normalizeCurrency(value: unknown): string {
  const currency = stringValue(value).toUpperCase();
  if (currency === "GRM" || currency === "TON") return "GRAM";
  return currency || "GRAM";
}

function isActive(value: unknown): boolean {
  return ["1", "active", "running", "delivering"].includes(stringValue(value).toLowerCase());
}

function statusForAd(ad: Record<string, unknown>): CampaignStatus {
  return isActive(firstValue(ad, "active", "status")) ? "active" : "paused";
}

function dateForReport(value?: string): string {
  return value || new Date().toISOString().slice(0, 10);
}

function localCampaignId(moduleId: string, accountId: string, adId: string): string {
  const digest = createHash("sha256")
    .update(`telegram_ads:${moduleId}:${accountId}:${adId}`)
    .digest("hex")
    .slice(0, 32);
  return `tgads_${digest}`;
}

function statsSummary(payload: unknown): Record<string, unknown> {
  const root = objectValue(payload);
  return objectValue(root.summary);
}

interface TelegramAdsMetricPoint {
  bucketAt: string;
  intervalSeconds: number;
  spend: number;
  impressions: number;
  clicks: number;
  conversions: number;
  metrics: Record<string, number>;
}

function numericSeries(value: unknown): number[] {
  return Array.isArray(value) ? value.map((item) => numberValue(item)) : [];
}

function chartSeries(value: unknown): Record<string, number[]> {
  const object = objectValue(value);
  return Object.fromEntries(Object.entries(object).map(([name, series]) => [name, numericSeries(series)]));
}

function timestampToIso(value: unknown): string | undefined {
  const timestamp = numberValue(value);
  if (!timestamp) return undefined;
  const milliseconds = timestamp > 10_000_000_000 ? timestamp : timestamp * 1000;
  const date = new Date(milliseconds);
  return Number.isNaN(date.getTime()) ? undefined : date.toISOString();
}

function metricPointSeries(
  payload: Record<string, unknown> | undefined,
): TelegramAdsMetricPoint[] {
  if (!payload) return [];
  const charts = objectValue(payload.charts);
  const officialItems = Array.isArray(payload.items)
    ? payload.items.filter((item): item is Record<string, unknown> => Boolean(item && typeof item === "object"))
    : [];
  if (officialItems.length) {
    return officialItems.flatMap((item) => {
      const bucketAt = timestampToIso(firstValue(item, "from_time", "fromTime"));
      if (!bucketAt) return [];
      const from = numberValue(firstValue(item, "from_time", "fromTime"));
      const to = numberValue(firstValue(item, "to_time", "toTime"));
      const metrics = {
        views: numberValue(firstValue(item, "views", "impressions")),
        opens: numberValue(firstValue(item, "opens")),
        clicks: numberValue(firstValue(item, "clicks")),
        actions: numberValue(firstValue(item, "actions", "joins", "conversions")),
        spent_budget: numberValue(firstValue(item, "spent_budget", "spend", "cost")),
      };
      return [{
        bucketAt,
        intervalSeconds: Math.max(1, to - from) || 300,
        spend: metrics.spent_budget,
        impressions: metrics.views,
        clicks: metrics.clicks,
        conversions: metrics.actions,
        metrics,
      }];
    });
  }
  const counts = objectValue(charts.counts);
  const budget = objectValue(charts.budget);
  const chartValues = [counts, budget].filter((chart) => Object.keys(chart).length > 0);
  if (!chartValues.length) return [];

  const timestampValues = chartValues
    .map((chart) => (Array.isArray(chart.timestamps) ? chart.timestamps : []))
    .find((timestamps) => timestamps.length > 0) || [];
  const intervalSeconds = numberValue(
    firstValue(counts, "interval_seconds", "intervalSeconds") ??
      firstValue(budget, "interval_seconds", "intervalSeconds") ??
      firstValue(objectValue(payload.summary), "interval_seconds", "intervalSeconds"),
  );
  const seriesByName = new Map<string, number[]>();
  for (const chart of chartValues) {
    for (const [name, series] of Object.entries(chartSeries(chart.series))) {
      seriesByName.set(name, series);
    }
  }

  return timestampValues.flatMap((timestamp, index) => {
    const bucketAt = timestampToIso(timestamp);
    if (!bucketAt) return [];
    const metrics: Record<string, number> = {};
    let spend = 0;
    let impressions = 0;
    let clicks = 0;
    let conversions = 0;
    for (const [name, series] of seriesByName) {
      const value = numberValue(series[index]);
      metrics[name] = value;
      const normalized = name.toLowerCase().replace(/[^a-z0-9]+/g, "");
      if (normalized.includes("view") || normalized.includes("impression")) impressions = value;
      else if (normalized.includes("click")) clicks = value;
      else if (
        normalized.includes("startedbot") ||
        normalized.includes("action") ||
        normalized.includes("join") ||
        normalized.includes("conversion") ||
        normalized.includes("lead") ||
        normalized.includes("signup") ||
        normalized.includes("purchase")
      ) conversions = value;
      else if (normalized.includes("spend") || normalized.includes("budget") || normalized.includes("cost")) {
        spend = value;
      }
    }
    return [{
      bucketAt,
      intervalSeconds: intervalSeconds || 300,
      spend,
      impressions,
      clicks,
      conversions,
      metrics,
    }];
  });
}

function moduleError(result: Awaited<ReturnType<typeof callModuleTool>>): string | undefined {
  const payload = extractModulePayload(result);
  const object = objectValue(payload);
  if (!result.is_error && object.ok !== false) return undefined;
  return stringValue(object.error || object.message) || "Telegram Ads module returned an error";
}

export async function pullTelegramAdsReport(input: {
  moduleId?: string;
  listTool?: string;
  statsTool?: string;
  statsPeriod?: "5min" | "day";
  includeStats?: boolean;
  maxAds?: number;
  date?: string;
}): Promise<TelegramAdsReport> {
  const moduleId = input.moduleId || DEFAULT_MODULE_ID;
  const listTool = input.listTool || DEFAULT_LIST_TOOL;
  const statsTool = input.statsTool || DEFAULT_STATS_TOOL;
  const statsPeriod = input.statsPeriod || "day";
  const date = dateForReport(input.date);
  const maxAds = Math.max(1, Math.min(input.maxAds ?? 50, 100));

  const accountResult = await callModuleTool({ moduleId, toolName: "get_account" });
  const accountError = moduleError(accountResult);
  if (accountError) throw new Error(`Telegram Ads get_account failed: ${accountError}`);
  const account = objectValue(extractModulePayload(accountResult));
  if (account.ok === false) throw new Error(`Telegram Ads account is not ready: ${stringValue(account.error)}`);

  const listResult = await callModuleTool({
    moduleId,
    toolName: listTool,
    arguments: { status: "any" },
  });
  const listError = moduleError(listResult);
  if (listError) throw new Error(`Telegram Ads ${listTool} failed: ${listError}`);
  const listPayload = extractModulePayload(listResult);
  const listObject = objectValue(listPayload);
  const rows = rowsFromUnknown(listPayload).slice(0, maxAds);
  const accountId = stringValue(firstValue(account, "owner_id", "account_id", "id")) || "default";
  const currency = normalizeCurrency(firstValue(account, "currency"));
  const statsErrors: Array<{ adId: string; error: string }> = [];
  const ads: TelegramAdsSnapshot[] = [];

  for (const ad of rows) {
    const adId = stringValue(firstValue(ad, "ad_id", "adId", "id"));
    if (!adId) continue;
    let statsPayload: unknown;
    let statsError: string | undefined;
    if (input.includeStats !== false) {
      try {
        const statsResult = await callModuleTool({
          moduleId,
          toolName: statsTool,
          arguments: { ad_id: adId, period: statsPeriod },
        });
        statsError = moduleError(statsResult);
        if (!statsError) statsPayload = extractModulePayload(statsResult);
      } catch (error) {
        statsError = error instanceof Error ? error.message : String(error);
      }
      if (statsError) statsErrors.push({ adId, error: statsError });
    }

    const summary = statsSummary(statsPayload);
    const spendValue = firstValue(summary, "spend", "cost", "amount", "budget");
    const impressionsValue = firstValue(summary, "views", "impressions");
    const clicksValue = firstValue(summary, "clicks");
    const conversionsValue = firstValue(summary, "actions", "joins", "conversions", "started_bot");
    const spend = spendValue === undefined
      ? numberValue(firstValue(ad, "spent", "spend", "cost"))
      : numberValue(spendValue);
    const impressions = impressionsValue === undefined
      ? numberValue(firstValue(ad, "views", "impressions"))
      : numberValue(impressionsValue);
    const clicks = clicksValue === undefined ? numberValue(firstValue(ad, "clicks")) : numberValue(clicksValue);
    const conversions = conversionsValue === undefined
      ? numberValue(firstValue(ad, "actions", "joins", "conversions", "started_bot"))
      : numberValue(conversionsValue);
    const rawStatus = stringValue(firstValue(ad, "status", "active"));
    ads.push({
      adId,
      accountId,
      name: stringValue(firstValue(ad, "title", "name")) || `Telegram Ads ${adId}`,
      status: statusForAd(ad),
      externalStatus: rawStatus,
      currency: normalizeCurrency(firstValue(ad, "currency") ?? currency),
      date,
      spend,
      impressions,
      clicks,
      conversions,
      ctr: optionalNumber(firstValue(summary, "ctr")) ?? optionalNumber(firstValue(ad, "ctr")),
      cpc: optionalNumber(firstValue(summary, "cpc")) ?? optionalNumber(firstValue(ad, "cpc")),
      cpm: optionalNumber(firstValue(summary, "cpm_actual", "cpm")) ?? optionalNumber(firstValue(ad, "cpm")),
      budget: optionalNumber(firstValue(ad, "budget")),
      dailyBudget: optionalNumber(firstValue(ad, "daily_budget", "dailyBudget")),
      ...(stringValue(firstValue(ad, "promote_url", "url", "tme_path"))
        ? { promoteUrl: stringValue(firstValue(ad, "promote_url", "url", "tme_path")) }
        : {}),
      ...(stringValue(firstValue(ad, "target_type", "trg_type"))
        ? { targetType: stringValue(firstValue(ad, "target_type", "trg_type")) }
        : {}),
      rawAd: ad,
      ...(statsPayload && typeof statsPayload === "object" ? { rawStats: objectValue(statsPayload) } : {}),
      ...(statsError ? { statsError } : {}),
    });
  }

  const totals = ads.reduce(
    (sum, ad) => ({
      spend: sum.spend + ad.spend,
      impressions: sum.impressions + ad.impressions,
      clicks: sum.clicks + ad.clicks,
    }),
    { spend: 0, impressions: 0, clicks: 0 },
  );
  const nextOffsetId = stringValue(firstValue(listObject, "next_offset_id", "nextOffsetId")) || undefined;
  return {
    moduleId,
    sourceLayer: "session",
    listTool,
    ...(input.includeStats === false ? {} : { statsTool }),
    statsPeriod,
    date,
    account,
    ads,
    ...(nextOffsetId ? { nextOffsetId } : {}),
    statsErrors,
    totals,
  };
}

function accountIdFrom(value: unknown): string {
  const account = objectValue(value);
  return stringValue(firstValue(account, "owner_id", "account_id", "id"));
}

function accountSummary(row: Record<string, unknown>) {
  const accountId = accountIdFrom(row) || "unknown";
  const title = stringValue(firstValue(row, "title", "name"));
  const description = stringValue(firstValue(row, "description"));
  const url = stringValue(firstValue(row, "url"));
  return {
    accountId,
    ...(title ? { title } : {}),
    ...(description ? { description } : {}),
    ...(url ? { url } : {}),
  };
}

async function selectTelegramAccount(moduleId: string, accountId: string): Promise<Record<string, unknown>> {
  const result = await callModuleTool({
    moduleId,
    toolName: "select_account",
    arguments: { owner_id: accountId, confirm: true },
    internal: true,
  });
  const error = moduleError(result);
  if (error) throw new Error(`Telegram Ads account switch failed: ${error}`);
  const payload = objectValue(extractModulePayload(result));
  if (payload.ok === false) throw new Error(`Telegram Ads account switch failed: ${stringValue(payload.error)}`);
  return payload;
}

export async function pullTelegramAdsAccountsReport(input: {
  moduleId?: string;
  listTool?: string;
  statsTool?: string;
  statsPeriod?: "5min" | "day";
  includeStats?: boolean;
  maxAds?: number;
  accountId?: string;
  all?: boolean;
  confirm?: boolean;
}): Promise<TelegramAdsAccountsReport> {
  const moduleId = input.moduleId || DEFAULT_MODULE_ID;
  const accountListResult = await callModuleTool({ moduleId, toolName: "list_accounts" });
  const listError = moduleError(accountListResult);
  if (listError) throw new Error(`Telegram Ads list_accounts failed: ${listError}`);
  const accountListPayload = objectValue(extractModulePayload(accountListResult));
  const accountRows = rowsFromUnknown(accountListPayload);
  const currentResult = await callModuleTool({ moduleId, toolName: "get_account" });
  const currentError = moduleError(currentResult);
  if (currentError) throw new Error(`Telegram Ads get_account failed: ${currentError}`);
  const currentAccount = objectValue(extractModulePayload(currentResult));
  const activeAccountId = accountIdFrom(currentAccount) || undefined;
  const requestedAccountId = input.accountId?.trim() || undefined;
  const readAll = input.all === true;

  if ((readAll || requestedAccountId) && input.confirm !== true) {
    throw new Error(
      "Reading a selected or all Telegram Ads cabinets requires confirm=true because the provider session is switched temporarily.",
    );
  }

  const selectedRows = requestedAccountId
    ? accountRows.filter((row) => accountIdFrom(row) === requestedAccountId)
    : readAll
      ? accountRows
      : [];
  if (requestedAccountId && selectedRows.length === 0) {
    throw new Error(`Telegram Ads account not found in list_accounts: ${requestedAccountId}`);
  }

  const result: TelegramAdsAccountsReport = {
    moduleId,
    ...(activeAccountId ? { activeAccountId } : {}),
    ...(requestedAccountId ? { requestedAccountId } : {}),
    all: readAll,
    accounts: accountRows.map(accountSummary),
  };
  if (!selectedRows.length) return result;

  const reports: TelegramAdsAccountsReport["accounts"] = [];
  let selectedAccountId = activeAccountId;
  for (const row of selectedRows) {
    const summary = accountSummary(row);
    try {
      if (summary.accountId !== "unknown" && summary.accountId !== selectedAccountId) {
        await selectTelegramAccount(moduleId, summary.accountId);
        selectedAccountId = summary.accountId;
      }
      const report = await pullTelegramAdsReport({
        moduleId,
        listTool: input.listTool,
        statsTool: input.statsTool,
        statsPeriod: input.statsPeriod,
        includeStats: input.includeStats,
        maxAds: input.maxAds,
      });
      reports.push({ ...summary, report });
    } catch (error) {
      reports.push({
        ...summary,
        error: error instanceof Error ? error.message : String(error),
      });
    }
  }

  if (activeAccountId && selectedAccountId && selectedAccountId !== activeAccountId) {
    try {
      await selectTelegramAccount(moduleId, activeAccountId);
      result.restoredAccountId = activeAccountId;
    } catch (error) {
      reports.push({
        accountId: activeAccountId,
        error: `Telegram Ads active account restore failed: ${error instanceof Error ? error.message : String(error)}`,
      });
    }
  }
  result.accounts = reports;
  return result;
}

export function syncTelegramAdsReport(report: TelegramAdsReport, projectId?: string) {
  let campaignsCreated = 0;
  let campaignsUpdated = 0;
  let spendRecords = 0;
  let timeSeriesCreated = 0;
  let timeSeriesUpdated = 0;

  for (const ad of report.ads) {
    const id = localCampaignId(report.moduleId, ad.accountId, ad.adId);
    const existing = getCampaign(id);
    const metadata = {
      integrationProvider: "telegram_ads",
      ...(report.sourceLayer ? { sourceLayer: report.sourceLayer } : {}),
      ...(report.apiBaseUrl ? { apiBaseUrl: report.apiBaseUrl } : {}),
      moduleId: report.moduleId,
      accountId: ad.accountId,
      externalCampaignId: ad.adId,
      externalStatus: ad.externalStatus,
      statsPeriod: report.statsPeriod,
      lastSyncedAt: new Date().toISOString(),
    };
    if (!existing) {
      createCampaign({
        id,
        ...(projectId ? { projectId } : {}),
        source: "telegram_ads",
        name: ad.name,
        objective: "custom",
        status: ad.status,
        currency: ad.currency,
        ...(ad.budget === null ? {} : { budgetAmount: ad.budget }),
        ...(ad.dailyBudget === null ? {} : { dailyBudget: ad.dailyBudget }),
        ...(ad.promoteUrl ? { tracking: { promoteUrl: ad.promoteUrl } } : {}),
        metadata,
      });
      campaignsCreated += 1;
    } else {
      updateCampaign(id, {
        ...(projectId ? { projectId } : {}),
        source: "telegram_ads",
        name: ad.name || existing.name,
        status: ad.status,
        currency: ad.currency || existing.currency,
        ...(ad.budget === null ? {} : { budgetAmount: ad.budget }),
        ...(ad.dailyBudget === null ? {} : { dailyBudget: ad.dailyBudget }),
        metadata: { ...(existing.metadata || {}), ...metadata },
      });
      campaignsUpdated += 1;
    }

    if (report.statsPeriod === "day") {
      const spend = recordSpend({
        campaignId: id,
        day: ad.date,
        provider: "telegram_ads",
        amount: ad.spend,
        currency: ad.currency,
        impressions: Math.round(ad.impressions),
        clicks: Math.round(ad.clicks),
        externalId: `${report.moduleId}:${ad.accountId}:${ad.adId}:${ad.date}`,
        dedupeKey: `telegram_ads:spend:${report.moduleId}:${ad.accountId}:${ad.adId}:${ad.date}`,
        metadata: {
          statsPeriod: report.statsPeriod,
          ctr: ad.ctr,
          cpc: ad.cpc,
          cpm: ad.cpm,
          conversions: ad.conversions,
          status: ad.externalStatus,
          ...(ad.statsError ? { statsError: ad.statsError } : {}),
        },
      });
      if (!spend.duplicate) spendRecords += 1;
    }

    const metricPoints = metricPointSeries(ad.rawStats);
    if (metricPoints.length) {
      const timeSeries = upsertCampaignMetricPoints(
        metricPoints.map((point) => ({
          campaignId: id,
          provider: "telegram_ads",
          period: report.statsPeriod,
          bucketAt: point.bucketAt,
          intervalSeconds: point.intervalSeconds,
          spend: point.spend,
          impressions: Math.round(point.impressions),
          clicks: Math.round(point.clicks),
          conversions: point.conversions,
          metrics: point.metrics,
          metadata: {
            moduleId: report.moduleId,
            accountId: ad.accountId,
            externalCampaignId: ad.adId,
            statsPeriod: report.statsPeriod,
          },
        })),
      );
      timeSeriesCreated += timeSeries.created;
      timeSeriesUpdated += timeSeries.updated;
    }
  }

  return {
    moduleId: report.moduleId,
    accountId: stringValue(firstValue(report.account, "owner_id", "account_id", "id")) || "default",
    date: report.date,
    campaignsCreated,
    campaignsUpdated,
    spendRecords,
    timeSeriesCreated,
    timeSeriesUpdated,
    timeSeriesPoints: timeSeriesCreated + timeSeriesUpdated,
    ads: report.ads.length,
    statsErrors: report.statsErrors.length,
  };
}

function subsetTelegramAdsReport(report: TelegramAdsReport, ads: TelegramAdsSnapshot[]): TelegramAdsReport {
  const adIds = new Set(ads.map((ad) => ad.adId));
  return {
    ...report,
    ads,
    statsErrors: report.statsErrors.filter((item) => adIds.has(item.adId)),
    totals: ads.reduce(
      (sum, ad) => ({
        spend: sum.spend + ad.spend,
        impressions: sum.impressions + ad.impressions,
        clicks: sum.clicks + ad.clicks,
      }),
      { spend: 0, impressions: 0, clicks: 0 },
    ),
  };
}

function matchesProjectRule(ad: TelegramAdsSnapshot, rule: TelegramAdsProjectRule): boolean {
  const name = ad.name.toLowerCase();
  const url = (ad.promoteUrl || "").toLowerCase();
  return Boolean(
    (rule.nameContains && name.includes(rule.nameContains.trim().toLowerCase())) ||
      (rule.urlContains && url.includes(rule.urlContains.trim().toLowerCase())),
  );
}

export function syncTelegramAdsAccountsReport(
  report: TelegramAdsAccountsReport,
  projectId?: string,
  projectRules?: TelegramAdsProjectRule[],
) {
  const syncs: Array<Record<string, unknown>> = [];
  for (const account of report.accounts) {
    if (!account.report) continue;
    if (!projectRules?.length) {
      syncs.push(syncTelegramAdsReport(account.report, projectId));
      continue;
    }

    const assigned = new Set<string>();
    for (const rule of projectRules) {
      const matched = account.report.ads.filter((ad) => !assigned.has(ad.adId) && matchesProjectRule(ad, rule));
      if (!matched.length) continue;
      matched.forEach((ad) => assigned.add(ad.adId));
      syncs.push({
        ...syncTelegramAdsReport(subsetTelegramAdsReport(account.report, matched), rule.projectId),
        projectId: rule.projectId,
      });
    }

    const unmatched = account.report.ads.filter((ad) => !assigned.has(ad.adId));
    if (unmatched.length) {
      syncs.push({
        ...syncTelegramAdsReport(subsetTelegramAdsReport(account.report, unmatched)),
        projectId: null,
      });
    }
  }
  return {
    moduleId: report.moduleId,
    projectId: projectId || null,
    accounts: syncs,
    campaignsCreated: syncs.reduce((sum, item) => sum + Number(item.campaignsCreated || 0), 0),
    campaignsUpdated: syncs.reduce((sum, item) => sum + Number(item.campaignsUpdated || 0), 0),
    spendRecords: syncs.reduce((sum, item) => sum + Number(item.spendRecords || 0), 0),
    ads: syncs.reduce((sum, item) => sum + Number(item.ads || 0), 0),
    statsErrors: syncs.reduce((sum, item) => sum + Number(item.statsErrors || 0), 0),
  };
}
