import { randomUUID } from "node:crypto";
import { db, jsonOrNull, parseJson } from "./db.js";
import { recordTelegramAiKeywordText } from "./telegram-ai-keywords.js";

export type TelegramAiSearchQueryStatus = "active" | "paused" | "archived";
export type TelegramAiSearchRunStatus = "never" | "ok" | "payment_required" | "error" | "blocked";
export type TelegramAiSearchHistoryStatus = Exclude<TelegramAiSearchRunStatus, "never">;

export type TelegramAiSearchQuery = {
  id: string;
  projectId: string;
  query: string;
  normalizedQuery: string;
  topic?: string;
  intent?: string;
  language: string;
  source: string;
  status: TelegramAiSearchQueryStatus;
  priority: number;
  notes?: string;
  metadata?: Record<string, unknown>;
  lastRunAt?: string;
  lastRunStatus: TelegramAiSearchRunStatus;
  lastRemainingFree?: number;
  lastResultCount: number;
  lastActionableCount: number;
  createdAt: string;
  updatedAt: string;
};

type SearchQueryRow = {
  id: string;
  project_id: string;
  query: string;
  normalized_query: string;
  topic: string | null;
  intent: string | null;
  language: string;
  source: string;
  status: string;
  priority: number;
  notes: string | null;
  metadata_json: string | null;
  last_run_at: string | null;
  last_run_status: string;
  last_remaining_free: number | null;
  last_result_count: number;
  last_actionable_count: number;
  created_at: string;
  updated_at: string;
};

export type TelegramAiSearchRun = {
  id: string;
  projectId: string;
  queryId?: string;
  query: string;
  source: string;
  scope?: string;
  status: TelegramAiSearchHistoryStatus;
  startedAt?: string;
  finishedAt: string;
  remainingFree?: number;
  resultCount?: number;
  actionableCount?: number;
  paidSearchAttempted: boolean;
  starsAmount?: number;
  error?: string;
  metadata?: Record<string, unknown>;
};

type SearchRunRow = {
  id: string;
  project_id: string;
  query_id: string | null;
  query: string;
  source: string;
  scope: string | null;
  status: string;
  started_at: string | null;
  finished_at: string;
  remaining_free: number | null;
  result_count: number | null;
  actionable_count: number | null;
  paid_search_attempted: number;
  stars_amount: number | null;
  error: string | null;
  metadata_json: string | null;
};

function text(value: unknown): string {
  return String(value || "").replace(/\s+/g, " ").trim();
}

export function normalizeTelegramAiSearchQuery(value: string): string {
  return text(value).toLocaleLowerCase("ru-RU");
}

function toSearchQuery(row: SearchQueryRow): TelegramAiSearchQuery {
  const metadata = parseJson<Record<string, unknown>>(row.metadata_json);
  return {
    id: row.id,
    projectId: row.project_id,
    query: row.query,
    normalizedQuery: row.normalized_query,
    ...(row.topic ? { topic: row.topic } : {}),
    ...(row.intent ? { intent: row.intent } : {}),
    language: row.language,
    source: row.source,
    status: row.status as TelegramAiSearchQueryStatus,
    priority: Number(row.priority || 0),
    ...(row.notes ? { notes: row.notes } : {}),
    ...(metadata ? { metadata } : {}),
    ...(row.last_run_at ? { lastRunAt: row.last_run_at } : {}),
    lastRunStatus: row.last_run_status as TelegramAiSearchRunStatus,
    ...(row.last_remaining_free == null ? {} : { lastRemainingFree: Number(row.last_remaining_free) }),
    lastResultCount: Number(row.last_result_count || 0),
    lastActionableCount: Number(row.last_actionable_count || 0),
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export function upsertTelegramAiSearchQuery(input: {
  projectId?: string;
  query: string;
  topic?: string;
  intent?: string;
  language?: string;
  source?: string;
  status?: TelegramAiSearchQueryStatus;
  priority?: number;
  notes?: string;
  metadata?: Record<string, unknown>;
}): TelegramAiSearchQuery {
  const projectId = text(input.projectId) || "neron";
  const query = text(input.query);
  const normalizedQuery = normalizeTelegramAiSearchQuery(query);
  if (!query) throw new Error("query is required");
  const now = new Date().toISOString();
  const existing = db().prepare(
    "SELECT id, priority, status, source, language FROM telegram_ai_search_queries WHERE project_id = ? AND normalized_query = ?",
  ).get(projectId, normalizedQuery) as {
    id?: string;
    priority?: number;
    status?: string;
    source?: string;
    language?: string;
  } | undefined;
  const id = existing?.id || `${projectId}:query:${randomUUID()}`;
  const priority = input.priority === undefined
    ? Number(existing?.priority || 0)
    : Math.max(-100, Math.min(100, Number(input.priority) || 0));
  const status = input.status || existing?.status || "active";
  const source = text(input.source) || existing?.source || "manual";
  const language = text(input.language) || existing?.language || "ru";
  db().prepare(
    `INSERT INTO telegram_ai_search_queries (
       id, project_id, query, normalized_query, topic, intent, language, source,
       status, priority, notes, metadata_json, created_at, updated_at
     ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
     ON CONFLICT(project_id, normalized_query) DO UPDATE SET
       query = excluded.query,
       topic = COALESCE(excluded.topic, telegram_ai_search_queries.topic),
       intent = COALESCE(excluded.intent, telegram_ai_search_queries.intent),
       language = excluded.language,
       source = excluded.source,
       status = excluded.status,
       priority = excluded.priority,
       notes = COALESCE(excluded.notes, telegram_ai_search_queries.notes),
       metadata_json = COALESCE(excluded.metadata_json, telegram_ai_search_queries.metadata_json),
       updated_at = excluded.updated_at`,
  ).run(
    id,
    projectId,
    query,
    normalizedQuery,
    text(input.topic) || null,
    text(input.intent) || null,
    language,
    source,
    status,
    priority,
    text(input.notes) || null,
    jsonOrNull(input.metadata),
    now,
    now,
  );
  const row = db().prepare(
    "SELECT * FROM telegram_ai_search_queries WHERE project_id = ? AND normalized_query = ?",
  ).get(projectId, normalizedQuery) as SearchQueryRow;
  return toSearchQuery(row);
}

export function recordTelegramAiSearchRun(input: {
  projectId?: string;
  query: string;
  source?: string;
  scope?: string;
  status: TelegramAiSearchHistoryStatus;
  startedAt?: string;
  finishedAt?: string;
  remainingFree?: number;
  resultCount?: number;
  actionableCount?: number;
  paidSearchAttempted?: boolean;
  starsAmount?: number;
  error?: string;
  metadata?: Record<string, unknown>;
}): TelegramAiSearchQuery {
  const queryText = text(input.query) || "[all messages]";
  const query = upsertTelegramAiSearchQuery({
    projectId: input.projectId,
    query: queryText,
    source: text(input.source) || "telegram_public_post_search",
  });
  const now = new Date().toISOString();
  const finishedAt = input.finishedAt || now;
  const source = text(input.source) || "telegram_public_post_search";
  const metadata = input.metadata === undefined
    ? query.metadata
    : { ...(query.metadata || {}), ...input.metadata };
  const remainingFree = input.remainingFree == null ? null : Math.max(0, Math.floor(input.remainingFree));
  const resultCount = input.resultCount == null ? null : Math.max(0, Math.floor(input.resultCount));
  const actionableCount = input.actionableCount == null ? null : Math.max(0, Math.floor(input.actionableCount));
  const starsAmount = input.starsAmount == null ? null : Math.max(0, Math.floor(input.starsAmount));
  const runId = `${query.projectId}:run:${randomUUID()}`;
  db().prepare(
    `INSERT INTO telegram_ai_search_runs (
       id, project_id, query_id, query, source, scope, status, started_at,
       finished_at, remaining_free, result_count, actionable_count,
       paid_search_attempted, stars_amount, error, metadata_json
     ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
  ).run(
    runId,
    query.projectId,
    query.id,
    query.query,
    source,
    text(input.scope) || null,
    input.status,
    input.startedAt || null,
    finishedAt,
    remainingFree,
    resultCount,
    actionableCount,
    input.paidSearchAttempted === true ? 1 : 0,
    starsAmount,
    text(input.error) || null,
    jsonOrNull(metadata),
  );
  recordTelegramAiKeywordText({
    projectId: query.projectId,
    text: query.query,
    sourceType: source === "web_search" ? "web_search" : "search_query",
    sourceRef: `run:${runId}`,
    observedAt: finishedAt,
    metadata: { searchRunId: runId, searchSource: source },
  });
  db().prepare(
    `UPDATE telegram_ai_search_queries
     SET last_run_at = ?, last_run_status = ?, last_remaining_free = ?,
         last_result_count = ?, last_actionable_count = ?, metadata_json = ?, updated_at = ?
     WHERE id = ?`,
  ).run(
    finishedAt,
    input.status,
    remainingFree,
    resultCount ?? 0,
    actionableCount ?? 0,
    jsonOrNull(metadata),
    now,
    query.id,
  );
  return toSearchQuery(db().prepare("SELECT * FROM telegram_ai_search_queries WHERE id = ?").get(query.id) as SearchQueryRow);
}

function toSearchRun(row: SearchRunRow): TelegramAiSearchRun {
  const metadata = parseJson<Record<string, unknown>>(row.metadata_json);
  return {
    id: row.id,
    projectId: row.project_id,
    ...(row.query_id ? { queryId: row.query_id } : {}),
    query: row.query,
    source: row.source,
    ...(row.scope ? { scope: row.scope } : {}),
    status: row.status as TelegramAiSearchHistoryStatus,
    ...(row.started_at ? { startedAt: row.started_at } : {}),
    finishedAt: row.finished_at,
    ...(row.remaining_free == null ? {} : { remainingFree: Number(row.remaining_free) }),
    ...(row.result_count == null ? {} : { resultCount: Number(row.result_count) }),
    ...(row.actionable_count == null ? {} : { actionableCount: Number(row.actionable_count) }),
    paidSearchAttempted: Number(row.paid_search_attempted || 0) === 1,
    ...(row.stars_amount == null ? {} : { starsAmount: Number(row.stars_amount) }),
    ...(row.error ? { error: row.error } : {}),
    ...(metadata ? { metadata } : {}),
  };
}

export function listTelegramAiSearchRuns(input?: {
  projectId?: string;
  queryId?: string;
  source?: string;
  status?: TelegramAiSearchHistoryStatus;
  limit?: number;
}): TelegramAiSearchRun[] {
  const clauses = ["project_id = ?"];
  const params: Array<string | number> = [text(input?.projectId) || "neron"];
  if (input?.queryId) {
    clauses.push("query_id = ?");
    params.push(text(input.queryId));
  }
  if (input?.source) {
    clauses.push("source = ?");
    params.push(text(input.source));
  }
  if (input?.status) {
    clauses.push("status = ?");
    params.push(input.status);
  }
  params.push(Math.max(1, Math.min(Number(input?.limit) || 200, 500)));
  const rows = db().prepare(
    `SELECT * FROM telegram_ai_search_runs
     WHERE ${clauses.join(" AND ")}
     ORDER BY finished_at DESC
     LIMIT ?`,
  ).all(...params) as unknown as SearchRunRow[];
  return rows.map(toSearchRun);
}

export function listTelegramAiSearchQueries(input?: {
  projectId?: string;
  status?: TelegramAiSearchQueryStatus;
  topic?: string;
  limit?: number;
}): TelegramAiSearchQuery[] {
  const clauses = ["project_id = ?"];
  const params: Array<string | number> = [text(input?.projectId) || "neron"];
  if (input?.status) {
    clauses.push("status = ?");
    params.push(input.status);
  }
  if (input?.topic) {
    clauses.push("topic = ?");
    params.push(text(input.topic));
  }
  params.push(Math.max(1, Math.min(Number(input?.limit) || 200, 500)));
  const rows = db().prepare(
    `SELECT * FROM telegram_ai_search_queries
     WHERE ${clauses.join(" AND ")}
     ORDER BY priority DESC, updated_at DESC
     LIMIT ?`,
  ).all(...params) as unknown as SearchQueryRow[];
  return rows.map(toSearchQuery);
}
