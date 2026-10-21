import {
  listTelegramAiKeywords,
  listTelegramAiKeywordTopics,
  buildTelegramAiTrendSnapshot,
  listTelegramAiTrendSnapshots,
  rebuildTelegramAiKeywords,
  recordTelegramAiKeywordText,
  type TelegramAiKeywordSourceType,
  type TelegramAiKeywordStatus,
  type TelegramAiTrendIntent,
} from "../telegram-ai-keywords.js";

export function runTelegramAiKeywordObserve(args: {
  project_id?: string;
  text: string;
  source_type: TelegramAiKeywordSourceType;
  source_ref: string;
  observed_at?: string;
  language?: string;
  topic?: string;
  intent?: TelegramAiTrendIntent;
  metadata?: Record<string, unknown>;
}) {
  return {
    table: "telegram_ai_keywords",
    observation: recordTelegramAiKeywordText({
      projectId: args.project_id,
      text: args.text,
      sourceType: args.source_type,
      sourceRef: args.source_ref,
      observedAt: args.observed_at,
      language: args.language,
      topic: args.topic,
      intent: args.intent,
      metadata: args.metadata,
    }),
    privacy: "Only normalized keywords and source metadata are stored; the submitted text is not persisted.",
  };
}

export function runTelegramAiKeywordList(args: {
  project_id?: string;
  status?: TelegramAiKeywordStatus;
  source_type?: TelegramAiKeywordSourceType;
  topic?: string;
  kind?: "word" | "phrase";
  window_days?: number;
  limit?: number;
}) {
  return {
    table: "telegram_ai_keywords",
    window_days: args.window_days || 30,
    keywords: listTelegramAiKeywords({
      projectId: args.project_id,
      status: args.status,
      sourceType: args.source_type,
      topic: args.topic,
      kind: args.kind,
      windowDays: args.window_days,
      limit: args.limit,
    }),
  };
}

export function runTelegramAiKeywordTopicList(args: {
  project_id?: string;
  status?: TelegramAiKeywordStatus;
  window_days?: number;
  limit?: number;
}) {
  return {
    table: "telegram_ai_keywords",
    window_days: args.window_days || 30,
    topics: listTelegramAiKeywordTopics({
      projectId: args.project_id,
      status: args.status,
      windowDays: args.window_days,
      limit: args.limit,
    }),
  };
}

export function runTelegramAiKeywordRebuild(args: { project_id?: string; reset?: boolean }) {
  return {
    table: "telegram_ai_keywords",
    rebuild: rebuildTelegramAiKeywords(args.project_id || "neron", { reset: args.reset }),
    privacy: "Rebuild reads existing search queries, public post metadata and inbound client message text, but stores only normalized keywords and bounded source metadata.",
  };
}

export function runTelegramAiTrendSnapshotBuild(args: {
  project_id?: string;
  period_start?: string;
  source_scope?: "all" | TelegramAiKeywordSourceType;
  reset?: boolean;
}) {
  return {
    table: "telegram_ai_trend_snapshots",
    snapshot: buildTelegramAiTrendSnapshot({
      projectId: args.project_id,
      periodStart: args.period_start,
      sourceScope: args.source_scope,
      reset: args.reset,
    }),
  };
}

export function runTelegramAiTrendSnapshotList(args: {
  project_id?: string;
  period_start?: string;
  source_scope?: string;
  topic?: string;
  intent?: TelegramAiTrendIntent;
  limit?: number;
}) {
  return {
    table: "telegram_ai_trend_snapshots",
    snapshots: listTelegramAiTrendSnapshots({
      projectId: args.project_id,
      periodStart: args.period_start,
      sourceScope: args.source_scope,
      topic: args.topic,
      intent: args.intent,
      limit: args.limit,
    }),
  };
}
