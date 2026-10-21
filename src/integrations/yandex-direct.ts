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

const DEFAULT_MODULE_ID = "yandex_direct";
const DEFAULT_TOOL = "get_statistics";
const DEFAULT_FIELDS = [
  "Date",
  "CampaignId",
  "CampaignName",
  "Impressions",
  "Clicks",
  "Cost",
  "Conversions",
  "Ctr",
  "AvgCpc",
];

export interface YandexDirectDay {
  date: string;
  campaignId: string;
  campaignName: string;
  impressions: number;
  clicks: number;
  cost: number;
  conversions: number;
  ctr: number;
  averageCpc: number;
  raw: Record<string, unknown>;
}

export interface YandexDirectReport {
  moduleId: string;
  tool: string;
  from: string;
  to: string;
  currency: string;
  days: YandexDirectDay[];
  totals: {
    cost: number;
    impressions: number;
    clicks: number;
    conversions: number;
  };
  raw: unknown;
}

function stringValue(value: unknown): string {
  return value === undefined || value === null ? "" : String(value).trim();
}

function numberValue(value: unknown): number {
  if (typeof value === "number") return Number.isFinite(value) ? value : 0;
  const raw = stringValue(value).replace(/[\u00a0\s]/g, "");
  if (!raw) return 0;
  const normalized = raw.includes(".")
    ? raw.replace(/,/g, "")
    : raw.replace(/,/g, ".");
  const parsed = Number(normalized.replace(/[^\d+\-.]/g, ""));
  return Number.isFinite(parsed) ? parsed : 0;
}

function firstValue(row: Record<string, unknown>, ...keys: string[]): unknown {
  for (const key of keys) {
    if (row[key] !== undefined) return row[key];
  }
  const normalized = new Map(
    Object.entries(row).map(([key, value]) => [key.toLowerCase().replace(/[^a-z0-9]/g, ""), value]),
  );
  for (const key of keys) {
    const value = normalized.get(key.toLowerCase().replace(/[^a-z0-9]/g, ""));
    if (value !== undefined) return value;
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

function rowsFromUnknown(value: unknown): Record<string, unknown>[] {
  if (Array.isArray(value)) return value.filter((row): row is Record<string, unknown> => Boolean(row && typeof row === "object"));
  if (!value || typeof value !== "object") return [];
  const object = value as Record<string, unknown>;
  for (const key of ["rows", "data", "items", "report", "results", "result", "output"]) {
    const rows = rowsFromUnknown(object[key]);
    if (rows.length) return rows;
  }
  if (Object.keys(object).some((key) => /campaign|impression|click|cost/i.test(key))) return [object];
  return [];
}

function textFromUnknown(value: unknown): string | undefined {
  if (typeof value === "string") return value;
  if (!value || typeof value !== "object") return undefined;
  const object = value as Record<string, unknown>;
  for (const key of ["text", "tsv", "report", "result", "output", "data"]) {
    const text = textFromUnknown(object[key]);
    if (text) return text;
  }
  return undefined;
}

function parseTsv(text: string, fields: string[]): Record<string, unknown>[] {
  const lines = text
    .replace(/^```(?:tsv|text)?\s*/i, "")
    .replace(/\s*```$/, "")
    .split(/\r?\n/)
    .map((line) => line.trimEnd())
    .filter((line) => line.trim() && !line.startsWith("[_truncated"));
  return lines.map((line) => {
    const values = line.split("\t");
    const row: Record<string, unknown> = {};
    fields.forEach((field, index) => {
      row[field] = values[index] ?? "";
    });
    return row;
  });
}

function extractModulePayload(result: Awaited<ReturnType<typeof callModuleTool>>): unknown {
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

export function parseYandexDirectRows(
  payload: unknown,
  fields: string[] = DEFAULT_FIELDS,
): YandexDirectDay[] {
  const structuredRows = typeof payload === "string" ? [] : rowsFromUnknown(payload);
  const textPayload = typeof payload === "string" ? payload : textFromUnknown(payload);
  const rows = structuredRows.length
    ? structuredRows
    : textPayload
      ? parseTsv(textPayload, fields)
      : [];
  return rows
    .map((row) => {
      const campaignId = stringValue(firstValue(row, "CampaignId", "CampaignID", "campaign_id", "id"));
      if (!campaignId) return undefined;
      const cost = numberValue(firstValue(row, "Cost", "cost", "spend", "amount"));
      const clicks = numberValue(firstValue(row, "Clicks", "clicks"));
      const impressions = numberValue(firstValue(row, "Impressions", "impressions", "shows"));
      const conversions = numberValue(firstValue(row, "Conversions", "conversions", "goals"));
      return {
        date: stringValue(firstValue(row, "Date", "date")),
        campaignId,
        campaignName: stringValue(firstValue(row, "CampaignName", "campaign_name", "name")) || `Yandex Direct campaign ${campaignId}`,
        impressions,
        clicks,
        cost,
        conversions,
        ctr: numberValue(firstValue(row, "Ctr", "CTR", "ctr")),
        averageCpc: numberValue(firstValue(row, "AvgCpc", "AverageCpc", "Cpc", "cpc")),
        raw: row,
      } satisfies YandexDirectDay;
    })
    .filter((row): row is YandexDirectDay => Boolean(row));
}

function defaults(input: { from?: string; to?: string }) {
  const to = input.to ?? new Date().toISOString().slice(0, 10);
  const from = input.from ?? new Date(Date.now() - 30 * 86_400_000).toISOString().slice(0, 10);
  return { from, to };
}

export async function pullYandexDirectReport(input: {
  from?: string;
  to?: string;
  moduleId?: string;
  tool?: string;
  currency?: string;
  campaignIds?: string[];
  fields?: string[];
}): Promise<YandexDirectReport> {
  const { from, to } = defaults(input);
  const moduleId = input.moduleId || DEFAULT_MODULE_ID;
  const tool = input.tool || (moduleId === "yandex_mcp_zai" ? "direct_get_statistics" : DEFAULT_TOOL);
  const fields = input.fields?.length ? input.fields : DEFAULT_FIELDS;
  const nativeArgs: Record<string, unknown> = tool === "direct_get_statistics"
    ? {
        date_from: from,
        date_to: to,
        report_type: "CAMPAIGN_PERFORMANCE_REPORT",
        field_names: fields,
        ...(input.campaignIds?.length
          ? { campaign_ids: input.campaignIds.map((campaignId) => Number(campaignId)) }
          : {}),
      }
    : {
        dateRangeType: "CUSTOM_DATE",
        dateFrom: from,
        dateTo: to,
        reportType: "CAMPAIGN_PERFORMANCE_REPORT",
        fieldNames: fields,
        includeVat: true,
        ...(input.campaignIds?.length ? { campaignIds: input.campaignIds } : {}),
      };
  const result = await callModuleTool({ moduleId, toolName: tool, arguments: nativeArgs });
  if (result.is_error) throw new Error(`Yandex Direct module ${tool} returned an error`);
  const payload = extractModulePayload(result);
  const days = parseYandexDirectRows(payload, fields);
  const totals = days.reduce(
    (sum, day) => ({
      cost: sum.cost + day.cost,
      impressions: sum.impressions + day.impressions,
      clicks: sum.clicks + day.clicks,
      conversions: sum.conversions + day.conversions,
    }),
    { cost: 0, impressions: 0, clicks: 0, conversions: 0 },
  );
  return {
    moduleId,
    tool,
    from,
    to,
    currency: input.currency || process.env.ADS_YANDEX_DIRECT_CURRENCY?.trim() || "RUB",
    days,
    totals,
    raw: payload,
  };
}

function localCampaignId(moduleId: string, campaignId: string): string {
  const digest = createHash("sha256").update(`yandex_direct:${moduleId}:${campaignId}`).digest("hex").slice(0, 32);
  return `ydirect_${digest}`;
}

export function syncYandexDirectReport(report: YandexDirectReport, projectId?: string) {
  const campaigns = new Map<string, { id: string; name: string; status: CampaignStatus }>();
  let campaignsCreated = 0;
  let campaignsUpdated = 0;
  let spendRecords = 0;
  let conversionEvents = 0;
  let conversionCount = 0;
  let skippedRows = 0;
  for (const day of report.days) {
    if (!day.campaignId || !day.date) {
      skippedRows += 1;
      continue;
    }
    const id = localCampaignId(report.moduleId, day.campaignId);
    let local = campaigns.get(id);
    if (!local) {
      const existing = getCampaign(id);
      if (!existing) {
        const created = createCampaign({
          id,
          ...(projectId ? { projectId } : {}),
          source: "yandex_direct",
          name: day.campaignName,
          objective: "custom",
          status: "active",
          currency: report.currency,
          metadata: { integrationProvider: "yandex_direct", moduleId: report.moduleId, externalCampaignId: day.campaignId },
        });
        local = { id: created.id, name: created.name, status: created.status };
        campaignsCreated += 1;
      } else {
        const updated = updateCampaign(id, {
          ...(projectId ? { projectId } : {}),
          source: "yandex_direct",
          name: day.campaignName || existing.name,
          currency: report.currency || existing.currency,
          metadata: { ...(existing.metadata || {}), integrationProvider: "yandex_direct", moduleId: report.moduleId, externalCampaignId: day.campaignId },
        });
        local = { id, name: updated?.name || existing.name, status: updated?.status || existing.status };
        campaignsUpdated += 1;
      }
      campaigns.set(id, local);
    }
    const spend = recordSpend({
      campaignId: local.id,
      day: day.date,
      provider: "yandex_direct",
      amount: day.cost,
      currency: report.currency,
      impressions: Math.round(day.impressions),
      clicks: Math.round(day.clicks),
      externalId: `${report.moduleId}:${day.campaignId}:${day.date}`,
      dedupeKey: `yandex_direct:spend:${report.moduleId}:${day.campaignId}:${day.date}`,
      metadata: { moduleId: report.moduleId, externalCampaignId: day.campaignId, ctr: day.ctr, averageCpc: day.averageCpc, raw: day.raw },
    });
    if (!spend.duplicate) spendRecords += 1;
    if (day.conversions > 0) {
      const event = ingestEvent({
        campaignId: local.id,
        kind: "conversion",
        eventName: "yandex_direct.conversions",
        occurredAt: `${day.date}T23:59:59.999Z`,
        count: day.conversions,
        currency: report.currency,
        provider: "yandex_direct",
        externalId: `${report.moduleId}:${day.campaignId}:${day.date}:conversions`,
        dedupeKey: `yandex_direct:conversions:${report.moduleId}:${day.campaignId}:${day.date}`,
        metadata: { moduleId: report.moduleId, externalCampaignId: day.campaignId, raw: day.raw },
      });
      if (!event.duplicate) {
        conversionEvents += 1;
        conversionCount += day.conversions;
      }
    }
  }
  return {
    moduleId: report.moduleId,
    from: report.from,
    to: report.to,
    campaignsCreated,
    campaignsUpdated,
    spendRecords,
    conversionEvents,
    conversionCount,
    skippedRows,
  };
}
