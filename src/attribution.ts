import { db, parseJson } from "./db.js";
import type {
  AttributionModel,
  AttributionReport,
  AttributionRow,
  TrackingContext,
} from "./types.js";

type AttributionEventRow = {
  id: string;
  campaign_id: string;
  project_id: string | null;
  campaign_name: string;
  kind: string;
  occurred_at: string;
  amount: number | null;
  event_count: number;
  visitor_id: string | null;
  session_id: string | null;
  provider: string | null;
  tracking_json: string | null;
};

const CONVERSION_KINDS = new Set(["lead", "signup", "purchase", "conversion"]);

function identity(row: AttributionEventRow): string | undefined {
  if (row.visitor_id) return `visitor:${row.visitor_id}`;
  if (row.session_id) return `session:${row.session_id}`;
  return undefined;
}

function tracking(row: AttributionEventRow): TrackingContext | undefined {
  return parseJson<TrackingContext>(row.tracking_json);
}

function isTouch(row: AttributionEventRow): boolean {
  return row.kind === "impression" || row.kind === "click" || row.kind === "custom";
}

function weights(model: AttributionModel, count: number): number[] {
  if (count <= 0) return [];
  if (model === "first_touch") return [1, ...Array.from({ length: count - 1 }, () => 0)];
  if (model === "last_touch") return [...Array.from({ length: count - 1 }, () => 0), 1];
  if (model === "linear") return Array.from({ length: count }, () => 1 / count);
  if (count === 1) return [1];
  if (count === 2) return [0.5, 0.5];
  return [0.4, ...Array.from({ length: count - 2 }, () => 0.2 / (count - 2)), 0.4];
}

function rowKey(input: {
  campaignId: string;
  provider?: string;
  tracking?: TrackingContext;
}): string {
  const context = input.tracking || {};
  return [
    input.campaignId,
    input.provider || "",
    context.channel || "",
    context.source || "",
    context.medium || "",
    context.campaign || "",
    context.content || "",
    context.clickId || "",
  ].join("\u001f");
}

function addAttribution(
  rows: Map<string, AttributionRow>,
  event: AttributionEventRow,
  weight: number,
): void {
  const context = tracking(event);
  const key = rowKey({ campaignId: event.campaign_id, provider: event.provider || undefined, tracking: context });
  const current = rows.get(key) || {
    campaignId: event.campaign_id,
    campaignName: event.campaign_name,
    ...(event.provider ? { provider: event.provider } : {}),
    ...(context?.channel ? { channel: context.channel } : {}),
    ...(context?.source ? { source: context.source } : {}),
    ...(context?.medium ? { medium: context.medium } : {}),
    ...(context?.campaign ? { campaign: context.campaign } : {}),
    ...(context?.content ? { content: context.content } : {}),
    ...(context?.clickId ? { clickId: context.clickId } : {}),
    conversions: 0,
    revenue: 0,
  } satisfies AttributionRow;
  current.conversions += weight * event.event_count;
  current.revenue += Number(event.amount || 0) * weight;
  rows.set(key, current);
}

export function attributionReport(input: {
  from: string;
  to: string;
  model: AttributionModel;
  campaignId?: string;
  projectId?: string;
  lookbackDays?: number;
}): AttributionReport {
  const fromDate = new Date(input.from);
  if (Number.isNaN(fromDate.getTime())) throw new Error("from must be a valid ISO date");
  const lookbackDays = Math.max(0, Math.min(90, Math.floor(input.lookbackDays ?? 30)));
  const touchFrom = new Date(fromDate.getTime() - lookbackDays * 86_400_000).toISOString();
  const events = db()
    .prepare(
      `SELECT e.id, e.campaign_id, c.project_id, c.name AS campaign_name, e.kind, e.occurred_at,
              e.amount, e.event_count, e.visitor_id, e.session_id, e.provider, e.tracking_json
       FROM marketing_events e
       JOIN campaigns c ON c.id = e.campaign_id
       WHERE e.occurred_at >= ? AND e.occurred_at <= ?
       ORDER BY e.occurred_at ASC`,
    )
    .all(touchFrom, input.to) as unknown as AttributionEventRow[];

  const conversions = events.filter(
    (event) =>
      CONVERSION_KINDS.has(event.kind) &&
      event.occurred_at >= input.from &&
      (!input.campaignId || event.campaign_id === input.campaignId) &&
      (!input.projectId || event.project_id === input.projectId),
  );
  const rows = new Map<string, AttributionRow>();

  for (const conversion of conversions) {
    const conversionIdentity = identity(conversion);
    const touches = conversionIdentity
      ? events.filter(
          (event) =>
            isTouch(event) &&
            identity(event) === conversionIdentity &&
            event.occurred_at <= conversion.occurred_at,
        )
      : [];
    const sources = touches.length > 0 ? touches : [conversion];
    const sourceWeights = weights(input.model, sources.length);
    sources.forEach((source, index) => addAttribution(rows, source, sourceWeights[index] || 0));
  }

  const reportRows = [...rows.values()].sort((left, right) => right.conversions - left.conversions);
  return {
    model: input.model,
    period: { from: input.from, to: input.to },
    lookbackDays,
    conversionEvents: conversions.reduce((sum, event) => sum + event.event_count, 0),
    attributedConversions: reportRows.reduce((sum, row) => sum + row.conversions, 0),
    attributedRevenue: reportRows.reduce((sum, row) => sum + row.revenue, 0),
    rows: reportRows,
  };
}
