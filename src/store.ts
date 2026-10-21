import { randomUUID } from "node:crypto";
import { db, jsonOrNull, parseJson } from "./db.js";
import type {
  AutomationRule,
  AutomationRun,
  Campaign,
  CampaignAnalytics,
  CampaignMetricPoint,
  CampaignObjective,
  CampaignStatus,
  EventKind,
  Integration,
  IntegrationStatus,
  IntegrationSyncState,
  IntegrationSyncStatus,
  MarketingEvent,
  Project,
  ProjectAnalytics,
  ProjectStatus,
  SpendRecord,
  StoreStats,
} from "./types.js";

type CampaignRow = {
  id: string;
  project_id: string | null;
  source: string | null;
  name: string;
  objective: string;
  status: string;
  currency: string;
  budget_amount: number | null;
  daily_budget: number | null;
  starts_at: string | null;
  ends_at: string | null;
  targeting_json: string | null;
  tracking_json: string | null;
  metadata_json: string | null;
  created_at: string;
  updated_at: string;
};

type ProjectRow = {
  id: string;
  name: string;
  description: string | null;
  status: string;
  metadata_json: string | null;
  created_at: string;
  updated_at: string;
};

type EventRow = {
  id: string;
  campaign_id: string;
  kind: string;
  event_name: string;
  occurred_at: string;
  amount: number | null;
  event_count: number;
  currency: string | null;
  visitor_id: string | null;
  session_id: string | null;
  provider: string | null;
  external_id: string | null;
  dedupe_key: string | null;
  tracking_json: string | null;
  metadata_json: string | null;
};

type SpendRow = {
  id: string;
  campaign_id: string;
  day: string;
  provider: string;
  amount: number;
  currency: string;
  impressions: number;
  clicks: number;
  external_id: string | null;
  dedupe_key: string | null;
  metadata_json: string | null;
};

type CampaignMetricPointRow = {
  id: string;
  campaign_id: string;
  provider: string;
  period: string;
  bucket_at: string;
  interval_seconds: number;
  spend: number;
  impressions: number;
  clicks: number;
  conversions: number;
  metrics_json: string | null;
  metadata_json: string | null;
  created_at: string;
  updated_at: string;
};

type IntegrationRow = {
  id: string;
  provider: string;
  name: string;
  status: string;
  secret_env_json: string;
  config_json: string | null;
  last_sync_at: string | null;
  last_error: string | null;
  created_at: string;
  updated_at: string;
};

type IntegrationSyncRow = {
  provider: string;
  scope: string;
  status: string;
  last_attempt_at: string | null;
  last_success_at: string | null;
  last_success_to: string | null;
  last_error: string | null;
  consecutive_failures: number;
  updated_at: string;
};

type RuleRow = {
  id: string;
  campaign_id: string | null;
  name: string;
  metric: string;
  operator: string;
  threshold: number;
  action: string;
  enabled: number;
  cooldown_minutes: number;
  created_at: string;
  updated_at: string;
};

function optionalNumber(value: number | null): number | undefined {
  return value === null ? undefined : value;
}

function toProject(row: ProjectRow): Project {
  return {
    id: row.id,
    name: row.name,
    ...(row.description ? { description: row.description } : {}),
    status: row.status as ProjectStatus,
    ...(parseJson<Record<string, unknown>>(row.metadata_json)
      ? { metadata: parseJson<Record<string, unknown>>(row.metadata_json) }
      : {}),
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function toCampaign(row: CampaignRow): Campaign {
  return {
    id: row.id,
    ...(row.project_id ? { projectId: row.project_id } : {}),
    ...(row.source ? { source: row.source } : {}),
    name: row.name,
    objective: row.objective as CampaignObjective,
    status: row.status as CampaignStatus,
    currency: row.currency,
    ...(row.budget_amount === null ? {} : { budgetAmount: row.budget_amount }),
    ...(row.daily_budget === null ? {} : { dailyBudget: row.daily_budget }),
    ...(row.starts_at ? { startsAt: row.starts_at } : {}),
    ...(row.ends_at ? { endsAt: row.ends_at } : {}),
    ...(parseJson<Record<string, unknown>>(row.targeting_json)
      ? { targeting: parseJson<Record<string, unknown>>(row.targeting_json) }
      : {}),
    ...(parseJson<Record<string, unknown>>(row.tracking_json)
      ? { tracking: parseJson<Record<string, unknown>>(row.tracking_json) }
      : {}),
    ...(parseJson<Record<string, unknown>>(row.metadata_json)
      ? { metadata: parseJson<Record<string, unknown>>(row.metadata_json) }
      : {}),
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function toEvent(row: EventRow): MarketingEvent {
  return {
    id: row.id,
    campaignId: row.campaign_id,
    kind: row.kind as EventKind,
    eventName: row.event_name,
    occurredAt: row.occurred_at,
    ...(row.amount === null ? {} : { amount: row.amount }),
    ...(row.event_count === 1 ? {} : { count: row.event_count }),
    ...(row.currency ? { currency: row.currency } : {}),
    ...(row.visitor_id ? { visitorId: row.visitor_id } : {}),
    ...(row.session_id ? { sessionId: row.session_id } : {}),
    ...(row.provider ? { provider: row.provider } : {}),
    ...(row.external_id ? { externalId: row.external_id } : {}),
    ...(row.dedupe_key ? { dedupeKey: row.dedupe_key } : {}),
    ...(parseJson<MarketingEvent["tracking"]>(row.tracking_json)
      ? { tracking: parseJson<MarketingEvent["tracking"]>(row.tracking_json) }
      : {}),
    ...(parseJson<Record<string, unknown>>(row.metadata_json)
      ? { metadata: parseJson<Record<string, unknown>>(row.metadata_json) }
      : {}),
  };
}

function toSpend(row: SpendRow): SpendRecord {
  return {
    id: row.id,
    campaignId: row.campaign_id,
    day: row.day,
    provider: row.provider,
    amount: row.amount,
    currency: row.currency,
    impressions: row.impressions,
    clicks: row.clicks,
    ...(row.external_id ? { externalId: row.external_id } : {}),
    ...(row.dedupe_key ? { dedupeKey: row.dedupe_key } : {}),
    ...(parseJson<Record<string, unknown>>(row.metadata_json)
      ? { metadata: parseJson<Record<string, unknown>>(row.metadata_json) }
      : {}),
  };
}

function toCampaignMetricPoint(row: CampaignMetricPointRow): CampaignMetricPoint {
  return {
    id: row.id,
    campaignId: row.campaign_id,
    provider: row.provider,
    period: row.period as CampaignMetricPoint["period"],
    bucketAt: row.bucket_at,
    intervalSeconds: row.interval_seconds,
    spend: Number(row.spend || 0),
    impressions: Number(row.impressions || 0),
    clicks: Number(row.clicks || 0),
    conversions: Number(row.conversions || 0),
    ...(parseJson<Record<string, number>>(row.metrics_json)
      ? { metrics: parseJson<Record<string, number>>(row.metrics_json) }
      : {}),
    ...(parseJson<Record<string, unknown>>(row.metadata_json)
      ? { metadata: parseJson<Record<string, unknown>>(row.metadata_json) }
      : {}),
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function toIntegration(row: IntegrationRow): Integration {
  return {
    id: row.id,
    provider: row.provider,
    name: row.name,
    status: row.status as IntegrationStatus,
    secretEnv: parseJson<string[]>(row.secret_env_json) ?? [],
    ...(parseJson<Record<string, unknown>>(row.config_json)
      ? { config: parseJson<Record<string, unknown>>(row.config_json) }
      : {}),
    ...(row.last_sync_at ? { lastSyncAt: row.last_sync_at } : {}),
    ...(row.last_error ? { lastError: row.last_error } : {}),
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function toRule(row: RuleRow): AutomationRule {
  return {
    id: row.id,
    ...(row.campaign_id ? { campaignId: row.campaign_id } : {}),
    name: row.name,
    metric: row.metric as AutomationRule["metric"],
    operator: row.operator as AutomationRule["operator"],
    threshold: row.threshold,
    action: row.action as AutomationRule["action"],
    enabled: Boolean(row.enabled),
    cooldownMinutes: row.cooldown_minutes,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export function createProject(input: {
  id?: string;
  name: string;
  description?: string;
  status?: ProjectStatus;
  metadata?: Record<string, unknown>;
}): Project {
  const now = new Date().toISOString();
  const project: Project = {
    id: input.id?.trim() || randomUUID(),
    name: input.name.trim(),
    ...(input.description?.trim() ? { description: input.description.trim() } : {}),
    status: input.status ?? "active",
    ...(input.metadata ? { metadata: input.metadata } : {}),
    createdAt: now,
    updatedAt: now,
  };
  db()
    .prepare(
      `INSERT INTO projects (id, name, description, status, metadata_json, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
    )
    .run(
      project.id,
      project.name,
      project.description ?? null,
      project.status,
      jsonOrNull(project.metadata),
      project.createdAt,
      project.updatedAt,
    );
  return project;
}

export function getProject(id: string): Project | undefined {
  const row = db().prepare("SELECT * FROM projects WHERE id = ?").get(id) as ProjectRow | undefined;
  return row ? toProject(row) : undefined;
}

export function listProjects(filters?: { status?: ProjectStatus; limit?: number }): Project[] {
  const rowLimit = Math.max(1, Math.min(filters?.limit ?? 50, 200));
  const rows = (filters?.status
    ? db()
        .prepare("SELECT * FROM projects WHERE status = ? ORDER BY updated_at DESC LIMIT ?")
        .all(filters.status, rowLimit)
    : db().prepare("SELECT * FROM projects ORDER BY updated_at DESC LIMIT ?").all(rowLimit)) as unknown as ProjectRow[];
  return rows.map(toProject);
}

export function updateProject(
  id: string,
  patch: {
    name?: string;
    description?: string | null;
    status?: ProjectStatus;
    metadata?: Record<string, unknown> | null;
  },
): Project | undefined {
  const current = getProject(id);
  if (!current) return undefined;
  const next = {
    ...current,
    ...patch,
    ...(patch.name === undefined ? {} : { name: patch.name.trim() }),
    updatedAt: new Date().toISOString(),
  } as Project;
  db()
    .prepare(
      `UPDATE projects SET name = ?, description = ?, status = ?, metadata_json = ?, updated_at = ?
       WHERE id = ?`,
    )
    .run(
      next.name,
      next.description ?? null,
      next.status,
      jsonOrNull(next.metadata),
      next.updatedAt,
      id,
    );
  return getProject(id);
}

export function createCampaign(input: {
  id?: string;
  projectId?: string;
  source?: string;
  name: string;
  objective: CampaignObjective;
  status?: CampaignStatus;
  currency?: string;
  budgetAmount?: number;
  dailyBudget?: number;
  startsAt?: string;
  endsAt?: string;
  targeting?: Record<string, unknown>;
  tracking?: Record<string, unknown>;
  metadata?: Record<string, unknown>;
}): Campaign {
  if (input.projectId && !getProject(input.projectId)) {
    throw new Error(`Project not found: ${input.projectId}`);
  }
  const now = new Date().toISOString();
  const campaign: Campaign = {
    id: input.id?.trim() || randomUUID(),
    ...(input.projectId ? { projectId: input.projectId } : {}),
    ...(input.source?.trim() ? { source: input.source.trim().toLowerCase() } : {}),
    name: input.name.trim(),
    objective: input.objective,
    status: input.status ?? "draft",
    currency: (input.currency || "USD").trim().toUpperCase(),
    ...(input.budgetAmount === undefined ? {} : { budgetAmount: input.budgetAmount }),
    ...(input.dailyBudget === undefined ? {} : { dailyBudget: input.dailyBudget }),
    ...(input.startsAt ? { startsAt: input.startsAt } : {}),
    ...(input.endsAt ? { endsAt: input.endsAt } : {}),
    ...(input.targeting ? { targeting: input.targeting } : {}),
    ...(input.tracking ? { tracking: input.tracking } : {}),
    ...(input.metadata ? { metadata: input.metadata } : {}),
    createdAt: now,
    updatedAt: now,
  };
  db()
    .prepare(
      `INSERT INTO campaigns
       (id, project_id, source, name, objective, status, currency, budget_amount, daily_budget,
        starts_at, ends_at, targeting_json, tracking_json, metadata_json, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    )
    .run(
      campaign.id,
      campaign.projectId ?? null,
      campaign.source ?? null,
      campaign.name,
      campaign.objective,
      campaign.status,
      campaign.currency,
      campaign.budgetAmount ?? null,
      campaign.dailyBudget ?? null,
      campaign.startsAt ?? null,
      campaign.endsAt ?? null,
      jsonOrNull(campaign.targeting),
      jsonOrNull(campaign.tracking),
      jsonOrNull(campaign.metadata),
      campaign.createdAt,
      campaign.updatedAt,
    );
  return campaign;
}

export function getCampaign(id: string): Campaign | undefined {
  const row = db().prepare("SELECT * FROM campaigns WHERE id = ?").get(id) as
    | CampaignRow
    | undefined;
  return row ? toCampaign(row) : undefined;
}

export function listCampaigns(filters?: {
  status?: CampaignStatus;
  projectId?: string;
  source?: string;
  limit?: number;
}): Campaign[] {
  const rowLimit = Math.max(1, Math.min(filters?.limit ?? 50, 200));
  const clauses = ["1 = 1"];
  const params: Array<string | number> = [];
  if (filters?.status) {
    clauses.push("status = ?");
    params.push(filters.status);
  }
  if (filters?.projectId) {
    clauses.push("project_id = ?");
    params.push(filters.projectId);
  }
  if (filters?.source) {
    clauses.push("source = ?");
    params.push(filters.source.trim().toLowerCase());
  }
  params.push(rowLimit);
  const rows = db()
    .prepare(`SELECT * FROM campaigns WHERE ${clauses.join(" AND ")} ORDER BY updated_at DESC LIMIT ?`)
    .all(...params) as unknown as CampaignRow[];
  return rows.map(toCampaign);
}

export function updateCampaign(
  id: string,
  patch: {
    projectId?: string | null;
    source?: string | null;
    name?: string;
    objective?: CampaignObjective;
    status?: CampaignStatus;
    currency?: string;
    budgetAmount?: number | null;
    dailyBudget?: number | null;
    startsAt?: string | null;
    endsAt?: string | null;
    targeting?: Record<string, unknown> | null;
    tracking?: Record<string, unknown> | null;
    metadata?: Record<string, unknown> | null;
  },
): Campaign | undefined {
  const current = getCampaign(id);
  if (!current) return undefined;
  if (patch.projectId && !getProject(patch.projectId)) {
    throw new Error(`Project not found: ${patch.projectId}`);
  }
  const next = {
    ...current,
    ...patch,
    ...(patch.currency ? { currency: patch.currency.toUpperCase() } : {}),
    ...(patch.source ? { source: patch.source.trim().toLowerCase() } : {}),
    updatedAt: new Date().toISOString(),
  } as Campaign;
  db()
    .prepare(
      `UPDATE campaigns SET name = ?, objective = ?, status = ?, currency = ?,
       project_id = ?, source = ?,
       budget_amount = ?, daily_budget = ?, starts_at = ?, ends_at = ?,
       targeting_json = ?, tracking_json = ?, metadata_json = ?, updated_at = ?
       WHERE id = ?`,
    )
    .run(
      next.name,
      next.objective,
      next.status,
      next.currency,
      next.projectId ?? null,
      next.source ?? null,
      next.budgetAmount ?? null,
      next.dailyBudget ?? null,
      next.startsAt ?? null,
      next.endsAt ?? null,
      jsonOrNull(next.targeting),
      jsonOrNull(next.tracking),
      jsonOrNull(next.metadata),
      next.updatedAt,
      id,
    );
  return getCampaign(id);
}

export function ingestEvent(input: Omit<MarketingEvent, "id"> & { id?: string }): {
  event: MarketingEvent;
  duplicate: boolean;
} {
  if (!getCampaign(input.campaignId)) throw new Error(`Campaign not found: ${input.campaignId}`);
  const id = input.id?.trim() || randomUUID();
  const result = db()
    .prepare(
      `INSERT OR IGNORE INTO marketing_events
       (id, campaign_id, kind, event_name, occurred_at, amount, event_count, currency,
        visitor_id, session_id, provider, external_id, dedupe_key, tracking_json, metadata_json)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    )
    .run(
      id,
      input.campaignId,
      input.kind,
      input.eventName,
      input.occurredAt,
      input.amount ?? null,
      input.count ?? 1,
      input.currency ?? null,
      input.visitorId ?? null,
      input.sessionId ?? null,
      input.provider ?? null,
      input.externalId ?? null,
      input.dedupeKey ?? null,
      jsonOrNull(input.tracking),
      jsonOrNull(input.metadata),
    );
  const row = (input.dedupeKey
    ? db().prepare("SELECT * FROM marketing_events WHERE dedupe_key = ?").get(input.dedupeKey)
    : db().prepare("SELECT * FROM marketing_events WHERE id = ?").get(id)) as EventRow;
  return { event: toEvent(row), duplicate: Number(result.changes) === 0 };
}

export function recordSpend(input: Omit<SpendRecord, "id"> & { id?: string }): {
  spend: SpendRecord;
  duplicate: boolean;
} {
  if (!getCampaign(input.campaignId)) throw new Error(`Campaign not found: ${input.campaignId}`);
  const id = input.id?.trim() || randomUUID();
  const existing = input.dedupeKey
    ? (db().prepare("SELECT id FROM spend_records WHERE dedupe_key = ?").get(input.dedupeKey) as
        | { id: string }
        | undefined)
    : undefined;
  const result = existing
    ? db()
        .prepare(
          `UPDATE spend_records SET campaign_id = ?, day = ?, provider = ?, amount = ?, currency = ?,
           impressions = ?, clicks = ?, external_id = ?, metadata_json = ?
           WHERE dedupe_key = ?`,
        )
        .run(
          input.campaignId,
          input.day,
          input.provider,
          input.amount,
          input.currency,
          input.impressions,
          input.clicks,
          input.externalId ?? null,
          jsonOrNull(input.metadata),
          input.dedupeKey!,
        )
    : db()
        .prepare(
          `INSERT OR IGNORE INTO spend_records
           (id, campaign_id, day, provider, amount, currency, impressions, clicks,
            external_id, dedupe_key, metadata_json)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        )
        .run(
          id,
          input.campaignId,
          input.day,
          input.provider,
          input.amount,
          input.currency,
          input.impressions,
          input.clicks,
          input.externalId ?? null,
          input.dedupeKey ?? null,
          jsonOrNull(input.metadata),
        );
  const row = (input.dedupeKey
    ? db().prepare("SELECT * FROM spend_records WHERE dedupe_key = ?").get(input.dedupeKey)
    : db().prepare("SELECT * FROM spend_records WHERE id = ?").get(id)) as SpendRow;
  return { spend: toSpend(row), duplicate: Boolean(existing) || Number(result.changes) === 0 };
}

export function upsertCampaignMetricPoints(
  inputs: Array<
    Omit<CampaignMetricPoint, "id" | "createdAt" | "updatedAt"> & {
      id?: string;
    }
  >,
): { points: CampaignMetricPoint[]; created: number; updated: number } {
  const points: CampaignMetricPoint[] = [];
  let created = 0;
  let updated = 0;

  for (const input of inputs) {
    if (!getCampaign(input.campaignId)) {
      throw new Error(`Campaign not found: ${input.campaignId}`);
    }
    const existing = db()
      .prepare(
        `SELECT * FROM campaign_metric_points
         WHERE campaign_id = ? AND provider = ? AND period = ? AND bucket_at = ?`,
      )
      .get(input.campaignId, input.provider, input.period, input.bucketAt) as CampaignMetricPointRow | undefined;
    const now = new Date().toISOString();

    if (existing) {
      db()
        .prepare(
          `UPDATE campaign_metric_points SET interval_seconds = ?, spend = ?, impressions = ?, clicks = ?,
           conversions = ?, metrics_json = ?, metadata_json = ?, updated_at = ?
           WHERE id = ?`,
        )
        .run(
          input.intervalSeconds,
          input.spend,
          input.impressions,
          input.clicks,
          input.conversions,
          jsonOrNull(input.metrics),
          jsonOrNull(input.metadata),
          now,
          existing.id,
        );
      updated += 1;
    } else {
      db()
        .prepare(
          `INSERT INTO campaign_metric_points
           (id, campaign_id, provider, period, bucket_at, interval_seconds, spend, impressions, clicks,
            conversions, metrics_json, metadata_json, created_at, updated_at)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        )
        .run(
          input.id?.trim() || randomUUID(),
          input.campaignId,
          input.provider,
          input.period,
          input.bucketAt,
          input.intervalSeconds,
          input.spend,
          input.impressions,
          input.clicks,
          input.conversions,
          jsonOrNull(input.metrics),
          jsonOrNull(input.metadata),
          now,
          now,
        );
      created += 1;
    }

    const row = db()
      .prepare(
        `SELECT * FROM campaign_metric_points
         WHERE campaign_id = ? AND provider = ? AND period = ? AND bucket_at = ?`,
      )
      .get(input.campaignId, input.provider, input.period, input.bucketAt) as CampaignMetricPointRow;
    points.push(toCampaignMetricPoint(row));
  }

  return { points, created, updated };
}

export function listCampaignMetricPoints(filters?: {
  campaignId?: string;
  projectId?: string;
  source?: string;
  provider?: string;
  period?: CampaignMetricPoint["period"];
  from?: string;
  to?: string;
  limit?: number;
}): CampaignMetricPoint[] {
  const clauses = ["1 = 1"];
  const params: Array<string | number> = [];
  if (filters?.campaignId) {
    clauses.push("m.campaign_id = ?");
    params.push(filters.campaignId);
  }
  if (filters?.projectId) {
    clauses.push("c.project_id = ?");
    params.push(filters.projectId);
  }
  if (filters?.source) {
    clauses.push("c.source = ?");
    params.push(filters.source.trim().toLowerCase());
  }
  if (filters?.provider) {
    clauses.push("m.provider = ?");
    params.push(filters.provider.trim().toLowerCase());
  }
  if (filters?.period) {
    clauses.push("m.period = ?");
    params.push(filters.period);
  }
  if (filters?.from) {
    clauses.push("m.bucket_at >= ?");
    params.push(filters.from);
  }
  if (filters?.to) {
    clauses.push("m.bucket_at <= ?");
    params.push(filters.to);
  }
  const limit = Math.max(1, Math.min(filters?.limit ?? 5000, 50_000));
  params.push(limit);
  const rows = db()
    .prepare(
      `SELECT m.* FROM campaign_metric_points m
       JOIN campaigns c ON c.id = m.campaign_id
       WHERE ${clauses.join(" AND ")}
       ORDER BY m.bucket_at ASC, m.campaign_id ASC
       LIMIT ?`,
    )
    .all(...params) as unknown as CampaignMetricPointRow[];
  return rows.map(toCampaignMetricPoint);
}

const CONVERSION_KINDS = "'lead', 'signup', 'purchase', 'conversion'";

function metric(value: number, denominator: number): number {
  return denominator > 0 ? value / denominator : 0;
}

export function campaignAnalytics(input: {
  from: string;
  to: string;
  campaignId?: string;
  projectId?: string;
  source?: string;
}): CampaignAnalytics[] {
  const rows = db()
    .prepare(
      `SELECT
         c.id AS campaign_id,
         c.project_id AS project_id,
         p.name AS project_name,
         c.source AS source,
         c.name AS campaign_name,
         c.currency AS currency,
         COALESCE((SELECT SUM(s.amount) FROM spend_records s
           WHERE s.campaign_id = c.id AND s.day >= ? AND s.day <= ?), 0) AS spend,
         COALESCE((SELECT SUM(s.impressions) FROM spend_records s
           WHERE s.campaign_id = c.id AND s.day >= ? AND s.day <= ?), 0) AS impressions,
         COALESCE((SELECT SUM(s.clicks) FROM spend_records s
           WHERE s.campaign_id = c.id AND s.day >= ? AND s.day <= ?), 0) AS clicks,
           COALESCE((SELECT SUM(e.event_count) FROM marketing_events e
           WHERE e.campaign_id = c.id AND e.occurred_at >= ? AND e.occurred_at <= ?
             AND e.kind IN (${CONVERSION_KINDS})), 0) AS conversions,
         COALESCE((SELECT SUM(COALESCE(e.amount, 0)) FROM marketing_events e
           WHERE e.campaign_id = c.id AND e.occurred_at >= ? AND e.occurred_at <= ?
             AND e.kind IN (${CONVERSION_KINDS})), 0) AS revenue
       FROM campaigns c
       LEFT JOIN projects p ON p.id = c.project_id
       WHERE (? IS NULL OR c.id = ?)
         AND (? IS NULL OR c.project_id = ?)
         AND (? IS NULL OR c.source = ?)
       ORDER BY c.updated_at DESC`,
    )
    .all(
      input.from,
      input.to,
      input.from,
      input.to,
      input.from,
      input.to,
      input.from,
      input.to,
      input.from,
      input.to,
      input.campaignId ?? null,
      input.campaignId ?? null,
      input.projectId ?? null,
      input.projectId ?? null,
      input.source?.trim().toLowerCase() ?? null,
      input.source?.trim().toLowerCase() ?? null,
    ) as unknown as Array<{
    campaign_id: string;
    project_id: string | null;
    project_name: string | null;
    source: string | null;
    campaign_name: string;
    currency: string;
    spend: number;
    impressions: number;
    clicks: number;
    conversions: number;
    revenue: number;
  }>;

  return rows.map((row) => ({
    campaignId: row.campaign_id,
    ...(row.project_id ? { projectId: row.project_id } : {}),
    ...(row.project_name ? { projectName: row.project_name } : {}),
    ...(row.source ? { source: row.source } : {}),
    campaignName: row.campaign_name,
    currency: row.currency,
    period: { from: input.from, to: input.to },
    spend: Number(row.spend || 0),
    impressions: Number(row.impressions || 0),
    clicks: Number(row.clicks || 0),
    conversions: Number(row.conversions || 0),
    revenue: Number(row.revenue || 0),
    ctr: metric(Number(row.clicks || 0), Number(row.impressions || 0)),
    cpc: metric(Number(row.spend || 0), Number(row.clicks || 0)),
    cpa: metric(Number(row.spend || 0), Number(row.conversions || 0)),
    conversionRate: metric(Number(row.conversions || 0), Number(row.clicks || 0)),
    roas: metric(Number(row.revenue || 0), Number(row.spend || 0)),
  }));
}

export function projectAnalytics(input: {
  projectId: string;
  from: string;
  to: string;
}): ProjectAnalytics | undefined {
  const project = getProject(input.projectId);
  if (!project) return undefined;
  const campaigns = campaignAnalytics({
    projectId: input.projectId,
    from: input.from,
    to: input.to,
  });
  const currencies = [...new Set(campaigns.map((campaign) => campaign.currency))].sort();
  const totals = campaigns.reduce(
    (sum, campaign) => ({
      spend: sum.spend + campaign.spend,
      impressions: sum.impressions + campaign.impressions,
      clicks: sum.clicks + campaign.clicks,
      conversions: sum.conversions + campaign.conversions,
      revenue: sum.revenue + campaign.revenue,
    }),
    { spend: 0, impressions: 0, clicks: 0, conversions: 0, revenue: 0 },
  );
  return {
    projectId: project.id,
    projectName: project.name,
    period: { from: input.from, to: input.to },
    currencies,
    totals: {
      ...totals,
      ctr: metric(totals.clicks, totals.impressions),
      cpc: metric(totals.spend, totals.clicks),
      cpa: metric(totals.spend, totals.conversions),
      conversionRate: metric(totals.conversions, totals.clicks),
      roas: metric(totals.revenue, totals.spend),
    },
    campaigns,
  };
}

export function registerIntegration(input: {
  id?: string;
  provider: string;
  name: string;
  status?: IntegrationStatus;
  secretEnv?: string[];
  config?: Record<string, unknown>;
}): Integration {
  const now = new Date().toISOString();
  const id = input.id?.trim() || randomUUID();
  db()
    .prepare(
      `INSERT INTO integrations
       (id, provider, name, status, secret_env_json, config_json, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)
       ON CONFLICT(id) DO UPDATE SET
         provider = excluded.provider, name = excluded.name, status = excluded.status,
         secret_env_json = excluded.secret_env_json, config_json = excluded.config_json,
         updated_at = excluded.updated_at`,
    )
    .run(
      id,
      input.provider.trim().toLowerCase(),
      input.name.trim(),
      input.status ?? "paused",
      JSON.stringify(input.secretEnv ?? []),
      jsonOrNull(input.config),
      now,
      now,
    );
  return toIntegration(db().prepare("SELECT * FROM integrations WHERE id = ?").get(id) as IntegrationRow);
}

export function listIntegrations(): Integration[] {
  return (db().prepare("SELECT * FROM integrations ORDER BY provider, name").all() as unknown as IntegrationRow[]).map(
    toIntegration,
  );
}

function toIntegrationSyncState(row: IntegrationSyncRow): IntegrationSyncState {
  return {
    provider: row.provider,
    scope: row.scope,
    status: row.status as IntegrationSyncStatus,
    ...(row.last_attempt_at ? { lastAttemptAt: row.last_attempt_at } : {}),
    ...(row.last_success_at ? { lastSuccessAt: row.last_success_at } : {}),
    ...(row.last_success_to ? { lastSuccessTo: row.last_success_to } : {}),
    ...(row.last_error ? { lastError: row.last_error } : {}),
    consecutiveFailures: row.consecutive_failures,
    updatedAt: row.updated_at,
  };
}

export function getIntegrationSyncState(provider: string, scope = "default"): IntegrationSyncState | undefined {
  const row = db()
    .prepare("SELECT * FROM integration_sync_state WHERE provider = ? AND scope = ?")
    .get(provider.trim().toLowerCase(), scope.trim()) as IntegrationSyncRow | undefined;
  return row ? toIntegrationSyncState(row) : undefined;
}

export function listIntegrationSyncStates(): IntegrationSyncState[] {
  return (
    db()
      .prepare("SELECT * FROM integration_sync_state ORDER BY updated_at DESC")
      .all() as unknown as IntegrationSyncRow[]
  ).map(toIntegrationSyncState);
}

export function markIntegrationSyncAttempt(provider: string, scope = "default"): IntegrationSyncState {
  const now = new Date().toISOString();
  const normalizedProvider = provider.trim().toLowerCase();
  const normalizedScope = scope.trim();
  db()
    .prepare(
      `INSERT INTO integration_sync_state
       (provider, scope, status, last_attempt_at, last_success_at, last_success_to,
        last_error, consecutive_failures, updated_at)
       VALUES (?, ?, 'running', ?, NULL, NULL, NULL, 0, ?)
       ON CONFLICT(provider, scope) DO UPDATE SET
       status = 'running', last_attempt_at = ?, last_error = NULL, updated_at = ?`,
    )
    .run(normalizedProvider, normalizedScope, now, now, now, now);
  return getIntegrationSyncState(normalizedProvider, normalizedScope)!;
}

export function markIntegrationSyncSuccess(
  provider: string,
  scope: string,
  lastSuccessTo: string,
): IntegrationSyncState {
  const now = new Date().toISOString();
  const normalizedProvider = provider.trim().toLowerCase();
  const normalizedScope = scope.trim();
  db()
    .prepare(
      `INSERT INTO integration_sync_state
       (provider, scope, status, last_attempt_at, last_success_at, last_success_to,
        last_error, consecutive_failures, updated_at)
       VALUES (?, ?, 'success', ?, ?, ?, NULL, 0, ?)
       ON CONFLICT(provider, scope) DO UPDATE SET
       status = 'success', last_success_at = ?, last_success_to = ?,
       last_error = NULL, consecutive_failures = 0, updated_at = ?`,
    )
    .run(normalizedProvider, normalizedScope, now, now, lastSuccessTo, now, now, lastSuccessTo, now);
  return getIntegrationSyncState(normalizedProvider, normalizedScope)!;
}

export function markIntegrationSyncFailure(
  provider: string,
  scope: string,
  message: string,
): IntegrationSyncState {
  const now = new Date().toISOString();
  const normalizedProvider = provider.trim().toLowerCase();
  const normalizedScope = scope.trim();
  const current = getIntegrationSyncState(normalizedProvider, normalizedScope);
  const failures = (current?.consecutiveFailures || 0) + 1;
  db()
    .prepare(
      `INSERT INTO integration_sync_state
       (provider, scope, status, last_attempt_at, last_success_at, last_success_to,
        last_error, consecutive_failures, updated_at)
       VALUES (?, ?, 'error', ?, NULL, NULL, ?, ?, ?)
       ON CONFLICT(provider, scope) DO UPDATE SET
       status = 'error', last_error = ?, consecutive_failures = ?, updated_at = ?`,
    )
    .run(normalizedProvider, normalizedScope, now, message.slice(0, 2000), failures, now, message.slice(0, 2000), failures, now);
  return getIntegrationSyncState(normalizedProvider, normalizedScope)!;
}

export function createAutomationRule(input: {
  id?: string;
  campaignId?: string;
  name: string;
  metric: AutomationRule["metric"];
  operator: AutomationRule["operator"];
  threshold: number;
  action: AutomationRule["action"];
  enabled?: boolean;
  cooldownMinutes?: number;
}): AutomationRule {
  if (input.campaignId && !getCampaign(input.campaignId)) {
    throw new Error(`Campaign not found: ${input.campaignId}`);
  }
  const now = new Date().toISOString();
  const id = input.id?.trim() || randomUUID();
  db()
    .prepare(
      `INSERT INTO automation_rules
       (id, campaign_id, name, metric, operator, threshold, action, enabled,
        cooldown_minutes, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    )
    .run(
      id,
      input.campaignId ?? null,
      input.name.trim(),
      input.metric,
      input.operator,
      input.threshold,
      input.action,
      input.enabled === false ? 0 : 1,
      Math.max(0, Math.floor(input.cooldownMinutes ?? 60)),
      now,
      now,
    );
  return toRule(db().prepare("SELECT * FROM automation_rules WHERE id = ?").get(id) as RuleRow);
}

export function listAutomationRules(input?: { campaignId?: string; enabledOnly?: boolean }): AutomationRule[] {
  const clauses = ["1 = 1"];
  const params: Array<string | number> = [];
  if (input?.campaignId) {
    clauses.push("(campaign_id = ? OR campaign_id IS NULL)");
    params.push(input.campaignId);
  }
  if (input?.enabledOnly) clauses.push("enabled = 1");
  return (
    db()
      .prepare(`SELECT * FROM automation_rules WHERE ${clauses.join(" AND ")} ORDER BY created_at`)
      .all(...params) as unknown as RuleRow[]
  ).map(toRule);
}

export function latestAutomationRun(ruleId: string): AutomationRun | undefined {
  const row = db()
    .prepare("SELECT * FROM automation_runs WHERE rule_id = ? ORDER BY evaluated_at DESC LIMIT 1")
    .get(ruleId) as
    | {
        id: string;
        rule_id: string;
        campaign_id: string | null;
        evaluated_at: string;
        metric_value: number | null;
        matched: number;
        executed: number;
        action: string | null;
        result: string | null;
      }
    | undefined;
  return row
    ? {
        id: row.id,
        ruleId: row.rule_id,
        ...(row.campaign_id ? { campaignId: row.campaign_id } : {}),
        evaluatedAt: row.evaluated_at,
        ...(row.metric_value === null ? {} : { metricValue: row.metric_value }),
        matched: Boolean(row.matched),
        executed: Boolean(row.executed),
        ...(row.action ? { action: row.action as AutomationRun["action"] } : {}),
        ...(row.result ? { result: row.result } : {}),
      }
    : undefined;
}

export function recordAutomationRun(input: Omit<AutomationRun, "id">): AutomationRun {
  const run: AutomationRun = { id: randomUUID(), ...input };
  db()
    .prepare(
      `INSERT INTO automation_runs
       (id, rule_id, campaign_id, evaluated_at, metric_value, matched, executed, action, result)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    )
    .run(
      run.id,
      run.ruleId,
      run.campaignId ?? null,
      run.evaluatedAt,
      run.metricValue ?? null,
      run.matched ? 1 : 0,
      run.executed ? 1 : 0,
      run.action ?? null,
      run.result ?? null,
    );
  return run;
}

export function storeStats(): StoreStats {
  const row = db()
    .prepare(
      `SELECT
         (SELECT COUNT(*) FROM projects) AS projects,
         (SELECT COUNT(*) FROM campaigns) AS campaigns,
         (SELECT COUNT(*) FROM marketing_events) AS events,
         (SELECT COUNT(*) FROM spend_records) AS spend_records,
         (SELECT COUNT(*) FROM integrations) AS integrations,
         (SELECT COUNT(*) FROM automation_rules) AS automation_rules,
         (SELECT COUNT(*) FROM automation_runs) AS automation_runs,
         (SELECT COUNT(*) FROM client_profiles) AS client_profiles,
         (SELECT COUNT(*) FROM client_profile_messages) AS client_profile_messages`,
    )
    .get() as {
    projects: number;
    campaigns: number;
    events: number;
    spend_records: number;
    integrations: number;
    automation_rules: number;
    automation_runs: number;
    client_profiles: number;
    client_profile_messages: number;
  };
  return {
    projects: Number(row.projects),
    campaigns: Number(row.campaigns),
    events: Number(row.events),
    spendRecords: Number(row.spend_records),
    integrations: Number(row.integrations),
    automationRules: Number(row.automation_rules),
    automationRuns: Number(row.automation_runs),
    clientProfiles: Number(row.client_profiles),
    clientProfileMessages: Number(row.client_profile_messages),
  };
}
