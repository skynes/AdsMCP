import {
  listTelegramAiSearchQueries,
  listTelegramAiSearchRuns,
  upsertTelegramAiSearchQuery,
  type TelegramAiSearchHistoryStatus,
  type TelegramAiSearchQueryStatus,
} from "../telegram-ai-search-queries.js";

export function runTelegramAiSearchQueryUpsert(args: {
  project_id?: string;
  query: string;
  topic?: string;
  intent?: string;
  language?: string;
  source?: string;
  status?: TelegramAiSearchQueryStatus;
  priority?: number;
  notes?: string;
  metadata?: Record<string, unknown>;
}) {
  return {
    table: "telegram_ai_search_queries",
    query: upsertTelegramAiSearchQuery({
      projectId: args.project_id,
      query: args.query,
      topic: args.topic,
      intent: args.intent,
      language: args.language,
      source: args.source,
      status: args.status,
      priority: args.priority,
      notes: args.notes,
      metadata: args.metadata,
    }),
  };
}

export function runTelegramAiSearchQueryList(args: {
  project_id?: string;
  status?: TelegramAiSearchQueryStatus;
  topic?: string;
  limit?: number;
}) {
  return {
    table: "telegram_ai_search_queries",
    queries: listTelegramAiSearchQueries({
      projectId: args.project_id,
      status: args.status,
      topic: args.topic,
      limit: args.limit,
    }),
  };
}

export function runTelegramAiSearchRunList(args: {
  project_id?: string;
  query_id?: string;
  source?: string;
  status?: TelegramAiSearchHistoryStatus;
  limit?: number;
}) {
  return {
    table: "telegram_ai_search_runs",
    runs: listTelegramAiSearchRuns({
      projectId: args.project_id,
      queryId: args.query_id,
      source: args.source,
      status: args.status,
      limit: args.limit,
    }),
  };
}
