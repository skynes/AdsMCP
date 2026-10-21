import { createHash } from "node:crypto";
import { callModuleTool } from "./mcp-modules.js";
import {
  createCampaign,
  getCampaign,
  ingestEvent,
  recordSpend,
  updateCampaign,
} from "../store.js";
import type { CampaignStatus } from "../types.js";

const DEFAULT_MODULE_ID = "microsoft_ads_official";
const DEFAULT_TOOL = "get_campaigns";
const DEFAULT_CURRENCY = "USD";
const PAGE_SIZE = 100;
const MAX_PAGES = 20;

export type MicrosoftAdsRangePreset =
  | "Today"
  | "Yesterday"
  | "LastSevenDays"
  | "LastFourteenDays"
  | "LastThirtyDays"
  | "ThisMonth"
  | "LastMonth";

export interface MicrosoftAdsCampaignRow {
  date: string;
  campaignId: string;
  campaignName: string;
  campaignStatus: string;
  currency: string;
  dailyBudget: number;
  spend: number;
  impressions: number;
  clicks: number;
  conversions: number;
  revenue: number;
  ctr: number;
  averageCpc: number;
  roas: number;
  raw: Record<string, unknown>;
}

export interface MicrosoftAdsReport {
  moduleId: string;
  tool: string;
  customerId: string;
  accountId: string;
  currency: string;
  preset: MicrosoftAdsRangePreset;
  from: string;
  to: string;
  campaigns: MicrosoftAdsCampaignRow[];
  totals: {
    spend: number;
    impressions: number;
    clicks: number;
    conversions: number;
    revenue: number;
  };
  raw: unknown;
}

function asRecord(value: unknown): Record<string, unknown> | undefined {
  return value && typeof value === "object" && !Array.isArray(value)
    ? value as Record<string, unknown>
    : undefined;
}

function normalizedKey(value: string): string {
  return value.toLowerCase().replace(/[^a-z0-9]/g, "");
}

function stringValue(value: unknown): string {
  return value === undefined || value === null ? "" : String(value).trim();
}

function numberValue(value: unknown): number {
  if (typeof value === "number") return Number.isFinite(value) ? value : 0;
  if (value && typeof value === "object") {
    const object = value as Record<string, unknown>;
    return numberValue(object.Amount ?? object.amount ?? object.Value ?? object.value);
  }
  const raw = stringValue(value).replace(/[,%$\s]/g, "");
  if (!raw) return 0;
  const parsed = Number(raw);
  return Number.isFinite(parsed) ? parsed : 0;
}

function firstDeepValue(
  value: unknown,
  names: string[],
  depth = 0,
): unknown {
  const record = asRecord(value);
  if (!record) return undefined;
  const wanted = new Set(names.map(normalizedKey));
  for (const [key, item] of Object.entries(record)) {
    if (wanted.has(normalizedKey(key))) return item;
  }
  if (depth >= 4) return undefined;
  for (const item of Object.values(record)) {
    const found = firstDeepValue(item, names, depth + 1);
    if (found !== undefined) return found;
  }
  return undefined;
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

function extractPayload(result: Awaited<ReturnType<typeof callModuleTool>>): unknown {
  if (result.structured_content !== undefined) return result.structured_content;
  for (const block of result.content) {
    const text = typeof block.text === "string" ? block.text : undefined;
    if (!text) continue;
    const json = parseJsonText(text);
    if (json !== undefined) return json;
    return text;
  }
  return undefined;
}

function rowsFromUnknown(value: unknown): Record<string, unknown>[] {
  if (Array.isArray(value)) {
    return value.filter((row): row is Record<string, unknown> => Boolean(asRecord(row)));
  }
  const record = asRecord(value);
  if (!record) {
    if (typeof value === "string") {
      const parsed = parseJsonText(value);
      return parsed === undefined ? [] : rowsFromUnknown(parsed);
    }
    return [];
  }
  for (const key of ["Entities", "entities", "Accounts", "accounts", "data", "items", "results", "result", "output"]) {
    const rows = rowsFromUnknown(record[key]);
    if (rows.length) return rows;
  }
  if (Object.keys(record).some((key) => /campaign|account|impression|spend|click/i.test(key))) {
    return [record];
  }
  return [];
}

function nextPageToken(value: unknown): string | undefined {
  const token = firstDeepValue(value, ["NextPageToken", "nextPageToken"]);
  const result = stringValue(token);
  return result || undefined;
}

function dateOnly(value: Date): string {
  return value.toISOString().slice(0, 10);
}

function addDays(value: Date, days: number): Date {
  const result = new Date(value.getTime());
  result.setUTCDate(result.getUTCDate() + days);
  return result;
}

function rangeForPreset(preset: MicrosoftAdsRangePreset, now = new Date()): { from: string; to: string } {
  const today = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
  if (preset === "Today") return { from: dateOnly(today), to: dateOnly(today) };
  if (preset === "Yesterday") {
    const yesterday = addDays(today, -1);
    return { from: dateOnly(yesterday), to: dateOnly(yesterday) };
  }
  if (preset === "LastSevenDays") return { from: dateOnly(addDays(today, -6)), to: dateOnly(today) };
  if (preset === "LastFourteenDays") return { from: dateOnly(addDays(today, -13)), to: dateOnly(today) };
  if (preset === "LastThirtyDays") return { from: dateOnly(addDays(today, -29)), to: dateOnly(today) };
  if (preset === "ThisMonth") {
    const start = new Date(Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), 1));
    return { from: dateOnly(start), to: dateOnly(today) };
  }
  const start = new Date(Date.UTC(today.getUTCFullYear(), today.getUTCMonth() - 1, 1));
  const end = new Date(Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), 0));
  return { from: dateOnly(start), to: dateOnly(end) };
}

function presetForRange(from: string, to: string): MicrosoftAdsRangePreset | undefined {
  const now = new Date();
  const presets: MicrosoftAdsRangePreset[] = [
    "Today",
    "Yesterday",
    "LastSevenDays",
    "LastFourteenDays",
    "LastThirtyDays",
    "ThisMonth",
    "LastMonth",
  ];
  return presets.find((preset) => {
    const range = rangeForPreset(preset, now);
    return range.from === from && range.to === to;
  });
}

function resolveRange(input: {
  from?: string;
  to?: string;
  preset?: MicrosoftAdsRangePreset;
}): { preset: MicrosoftAdsRangePreset; from: string; to: string } {
  if (input.preset) {
    return { preset: input.preset, ...rangeForPreset(input.preset) };
  }
  const defaultRange = rangeForPreset("LastThirtyDays");
  const from = input.from || defaultRange.from;
  const to = input.to || defaultRange.to;
  const preset = presetForRange(from, to);
  if (!preset) {
    throw new Error(
      "Microsoft Advertising MCP supports preset performance ranges only; use preset=LastThirtyDays or a matching from/to range",
    );
  }
  return { preset, from, to };
}

function statusValue(value: unknown): CampaignStatus {
  const status = stringValue(value).toLowerCase();
  if (status.includes("deleted") || status.includes("removed")) return "archived";
  if (status.includes("paused") || status.includes("suspended")) return "paused";
  if (status.includes("active") || status.includes("enabled")) return "active";
  return "draft";
}

function campaignMetric(row: Record<string, unknown>, names: string[], performance: unknown): number {
  return numberValue(firstDeepValue(performance, names) ?? firstDeepValue(row, names));
}

export function parseMicrosoftAdsRows(
  rows: Record<string, unknown>[],
  reportDate: string,
  currency: string,
): MicrosoftAdsCampaignRow[] {
  return rows
    .map((row) => {
      const campaignId = stringValue(firstDeepValue(row, ["CampaignId", "CampaignID", "Id", "id"]));
      if (!campaignId) return undefined;
      const performance = firstDeepValue(row, ["PerformanceMetrics", "Performance", "Metrics"]);
      const impressions = campaignMetric(row, ["Impressions"], performance);
      const clicks = campaignMetric(row, ["Clicks"], performance);
      const spend = campaignMetric(row, ["Spend", "Cost"], performance);
      const conversions = campaignMetric(row, ["Conversions"], performance);
      const revenue = campaignMetric(row, ["Revenue", "ConversionsValue"], performance);
      const ctr = campaignMetric(row, ["ClickThroughRate", "Ctr", "CTR"], performance)
        || (impressions > 0 ? clicks / impressions : 0);
      const averageCpc = campaignMetric(row, ["AverageCostPerClick", "AverageCpc", "Cpc"], performance)
        || (clicks > 0 ? spend / clicks : 0);
      const roas = campaignMetric(row, ["ReturnOnAdSpend", "Roas", "ROAS"], performance)
        || (spend > 0 ? revenue / spend : 0);
      return {
        date: stringValue(firstDeepValue(row, ["Date", "date"])) || reportDate,
        campaignId,
        campaignName: stringValue(firstDeepValue(row, ["CampaignName", "Name", "name"])) || `Microsoft Ads campaign ${campaignId}`,
        campaignStatus: stringValue(firstDeepValue(row, ["CampaignStatus", "Status"])) || "Unknown",
        currency: stringValue(firstDeepValue(row, ["Currency", "CurrencyCode"])) || currency,
        dailyBudget: numberValue(firstDeepValue(row, ["DailyBudget", "BudgetAmount"])),
        spend,
        impressions,
        clicks,
        conversions,
        revenue,
        ctr,
        averageCpc,
        roas,
        raw: row,
      } satisfies MicrosoftAdsCampaignRow;
    })
    .filter((row): row is MicrosoftAdsCampaignRow => Boolean(row));
}

async function fetchPagedEntities(input: {
  moduleId: string;
  tool: string;
  request: Record<string, unknown>;
}): Promise<{ rows: Record<string, unknown>[]; raw: unknown[] }> {
  const rows: Record<string, unknown>[] = [];
  const raw: unknown[] = [];
  let request = { ...input.request };
  for (let page = 0; page < MAX_PAGES; page += 1) {
    const result = await callModuleTool({
      moduleId: input.moduleId,
      toolName: input.tool,
      arguments: { request },
    });
    if (result.is_error) {
      throw new Error(`Microsoft Ads module ${input.tool} returned an error: ${JSON.stringify(result.content).slice(0, 1200)}`);
    }
    const payload = extractPayload(result);
    raw.push(payload);
    rows.push(...rowsFromUnknown(payload));
    const token = nextPageToken(payload);
    if (!token) break;
    request = { ...request, NextPageToken: token };
  }
  return { rows, raw };
}

function localCampaignId(customerId: string, accountId: string, campaignId: string): string {
  const digest = createHash("sha256")
    .update(`microsoft_ads:${customerId}:${accountId}:${campaignId}`)
    .digest("hex")
    .slice(0, 32);
  return `mads_${digest}`;
}

export async function pullMicrosoftAdsReport(input: {
  from?: string;
  to?: string;
  preset?: MicrosoftAdsRangePreset;
  moduleId?: string;
  tool?: string;
  customerId?: string;
  accountId?: string;
  currency?: string;
}): Promise<MicrosoftAdsReport> {
  const moduleId = input.moduleId || DEFAULT_MODULE_ID;
  const tool = input.tool || DEFAULT_TOOL;
  const range = resolveRange(input);
  let customerId = stringValue(input.customerId);
  let accountId = stringValue(input.accountId);
  let accountCurrency = input.currency?.trim().toUpperCase() || DEFAULT_CURRENCY;
  let accountRaw: unknown;

  if (!accountId || !customerId) {
    const accounts = await fetchPagedEntities({
      moduleId,
      tool: "get_accounts",
      request: {
        ...(customerId ? { CustomerId: Number(customerId) } : {}),
        PageSize: PAGE_SIZE,
      },
    });
    const candidates = accounts.rows
      .map((row) => ({
        row,
        accountId: stringValue(firstDeepValue(row, ["AccountId", "AccountID", "Id"])),
        customerId: stringValue(firstDeepValue(row, ["CustomerId", "ParentCustomerId", "BillingCustomerId"])),
        currency: stringValue(firstDeepValue(row, ["Currency", "CurrencyCode"])),
      }))
      .filter((item) => item.accountId);
    if (!accountId && candidates.length !== 1) {
      throw new Error(
        `Microsoft Ads returned ${candidates.length} accounts; provide account_id explicitly: ${JSON.stringify(
          candidates.map((item) => ({ account_id: item.accountId, customer_id: item.customerId })),
        )}`,
      );
    }
    const selected = candidates.find((item) => item.accountId === accountId) || candidates[0];
    if (!selected) throw new Error("Microsoft Ads returned no accessible accounts");
    accountId ||= selected.accountId;
    customerId ||= selected.customerId;
    accountCurrency = selected.currency || accountCurrency;
    accountRaw = selected.row;
  }
  if (!customerId || !accountId) {
    throw new Error("Microsoft Ads report requires customer_id and account_id");
  }

  const campaigns = await fetchPagedEntities({
    moduleId,
    tool,
    request: {
      CustomerId: Number(customerId),
      AccountId: Number(accountId),
      PerformanceDateRange: { Preset: range.preset },
      PageSize: PAGE_SIZE,
    },
  });
  const campaignRows = parseMicrosoftAdsRows(campaigns.rows, range.to, accountCurrency);
  const totals = campaignRows.reduce(
    (sum, row) => ({
      spend: sum.spend + row.spend,
      impressions: sum.impressions + row.impressions,
      clicks: sum.clicks + row.clicks,
      conversions: sum.conversions + row.conversions,
      revenue: sum.revenue + row.revenue,
    }),
    { spend: 0, impressions: 0, clicks: 0, conversions: 0, revenue: 0 },
  );
  return {
    moduleId,
    tool,
    customerId,
    accountId,
    currency: accountCurrency,
    ...range,
    campaigns: campaignRows,
    totals: {
      spend: Number(totals.spend.toFixed(2)),
      impressions: Math.round(totals.impressions),
      clicks: Math.round(totals.clicks),
      conversions: Number(totals.conversions.toFixed(4)),
      revenue: Number(totals.revenue.toFixed(2)),
    },
    raw: { account: accountRaw, campaigns: campaigns.raw },
  };
}

export function syncMicrosoftAdsReport(report: MicrosoftAdsReport, projectId?: string) {
  let campaignsCreated = 0;
  let campaignsUpdated = 0;
  let spendRecords = 0;
  let conversionEvents = 0;
  let conversionCount = 0;
  let skippedRows = 0;

  for (const row of report.campaigns) {
    if (!row.campaignId || !row.date) {
      skippedRows += 1;
      continue;
    }
    const id = localCampaignId(report.customerId, report.accountId, row.campaignId);
    const importedStatus = statusValue(row.campaignStatus);
    const existing = getCampaign(id);
    if (!existing) {
      createCampaign({
        id,
        ...(projectId ? { projectId } : {}),
        source: "microsoft_ads",
        name: row.campaignName,
        objective: "custom",
        status: importedStatus,
        currency: report.currency,
        ...(row.dailyBudget > 0 ? { dailyBudget: row.dailyBudget } : {}),
        metadata: {
          integrationProvider: "microsoft_ads",
          moduleId: report.moduleId,
          customerId: report.customerId,
          accountId: report.accountId,
          externalCampaignId: row.campaignId,
          reportPreset: report.preset,
        },
      });
      campaignsCreated += 1;
    } else {
      updateCampaign(id, {
        ...(projectId ? { projectId } : {}),
        source: "microsoft_ads",
        name: row.campaignName || existing.name,
        status: importedStatus,
        currency: report.currency || existing.currency,
        ...(row.dailyBudget > 0 ? { dailyBudget: row.dailyBudget } : {}),
        metadata: {
          ...(existing.metadata || {}),
          integrationProvider: "microsoft_ads",
          moduleId: report.moduleId,
          customerId: report.customerId,
          accountId: report.accountId,
          externalCampaignId: row.campaignId,
          reportPreset: report.preset,
        },
      });
      campaignsUpdated += 1;
    }

    const rangeKey = `${report.from}:${report.to}:${report.preset}`;
    const spend = recordSpend({
      campaignId: id,
      day: report.to,
      provider: "microsoft_ads",
      amount: row.spend,
      currency: report.currency,
      impressions: Math.round(row.impressions),
      clicks: Math.round(row.clicks),
      externalId: `${report.customerId}:${report.accountId}:${row.campaignId}:${rangeKey}`,
      dedupeKey: `microsoft_ads:spend:${report.customerId}:${report.accountId}:${row.campaignId}:${rangeKey}`,
      metadata: {
        moduleId: report.moduleId,
        customerId: report.customerId,
        accountId: report.accountId,
        externalCampaignId: row.campaignId,
        aggregation: "range",
        from: report.from,
        to: report.to,
        preset: report.preset,
        conversions: row.conversions,
        revenue: row.revenue,
        ctr: row.ctr,
        averageCpc: row.averageCpc,
        roas: row.roas,
        raw: row.raw,
      },
    });
    if (!spend.duplicate) spendRecords += 1;

    if (row.conversions > 0) {
      const event = ingestEvent({
        campaignId: id,
        kind: "conversion",
        eventName: "microsoft_ads.conversions",
        occurredAt: `${report.to}T23:59:59.999Z`,
        count: row.conversions,
        currency: report.currency,
        provider: "microsoft_ads",
        externalId: `${report.customerId}:${report.accountId}:${row.campaignId}:${rangeKey}:conversions`,
        dedupeKey: `microsoft_ads:conversions:${report.customerId}:${report.accountId}:${row.campaignId}:${rangeKey}`,
        metadata: {
          moduleId: report.moduleId,
          from: report.from,
          to: report.to,
          preset: report.preset,
          revenue: row.revenue,
          raw: row.raw,
        },
      });
      if (!event.duplicate) {
        conversionEvents += 1;
        conversionCount += row.conversions;
      }
    }
  }

  return {
    moduleId: report.moduleId,
    customerId: report.customerId,
    accountId: report.accountId,
    from: report.from,
    to: report.to,
    preset: report.preset,
    campaignsCreated,
    campaignsUpdated,
    spendRecords,
    conversionEvents,
    conversionCount,
    skippedRows,
    note: "Official Microsoft MCP returns aggregate metrics for the selected preset; imported spend is stored on report.to with aggregation=range.",
  };
}
