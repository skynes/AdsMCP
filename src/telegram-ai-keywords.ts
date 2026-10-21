import { createHash, randomUUID } from "node:crypto";
import { db, jsonOrNull, parseJson } from "./db.js";

export type TelegramAiKeywordSourceType =
  | "search_query"
  | "telegram_message"
  | "public_post"
  | "client_message"
  | "web_search";

export type TelegramAiTrendIntent =
  | "tool_discovery"
  | "how_to"
  | "troubleshooting"
  | "comparison"
  | "free_access"
  | "pricing_access"
  | "hiring_request"
  | "feedback"
  | "other";

export type TelegramAiKeywordStatus = "active" | "ignored";

export type TelegramAiKeywordTopicTrend = {
  projectId: string;
  topic: string;
  keywordCount: number;
  totalCount: number;
  queryCount: number;
  telegramMessageCount: number;
  publicPostCount: number;
  clientMessageCount: number;
  webSearchCount: number;
  recentCount: number;
  previousCount: number;
  trendDelta: number;
  trendDirection: "up" | "down" | "flat";
};

export type TelegramAiKeyword = {
  id: string;
  projectId: string;
  keyword: string;
  normalizedKeyword: string;
  kind: "word" | "phrase";
  language: string;
  topic?: string;
  status: TelegramAiKeywordStatus;
  totalCount: number;
  queryCount: number;
  telegramMessageCount: number;
  publicPostCount: number;
  clientMessageCount: number;
  webSearchCount: number;
  firstSeenAt: string;
  lastSeenAt: string;
  lastSourceType: TelegramAiKeywordSourceType;
  recentCount: number;
  previousCount: number;
  trendDelta: number;
  trendDirection: "up" | "down" | "flat";
  metadata?: Record<string, unknown>;
};

type KeywordRow = {
  id: string;
  project_id: string;
  keyword: string;
  normalized_keyword: string;
  kind: string;
  language: string;
  topic: string | null;
  status: string;
  total_count: number;
  query_count: number;
  telegram_message_count: number;
  public_post_count: number;
  client_message_count: number;
  web_search_count: number;
  first_seen_at: string;
  last_seen_at: string;
  last_source_type: string;
  metadata_json: string | null;
  updated_at: string;
  recent_count: number;
  previous_count: number;
};

const STOPWORDS = new Set([
  "а", "без", "бы", "был", "быть", "в", "вам", "вас", "ведь", "во", "вот", "все", "всё", "вы",
  "где", "да", "для", "до", "его", "ее", "её", "если", "есть", "же", "за", "и", "из", "или",
  "им", "как", "какая", "какие", "какой", "когда", "кто", "ли", "мне", "мы", "на", "над", "нам",
  "нас", "не", "него", "нее", "неё", "нет", "но", "ну", "о", "об", "один", "от", "по", "под",
  "после", "потому", "при", "про", "раз", "с", "сам", "себя", "со", "так", "такой", "там", "те",
  "тебе", "тем", "то", "только", "том", "у", "уже", "чего", "чем", "что", "чтобы", "это", "этот",
  "я", "сделать", "работа", "работы", "который", "которые", "можно", "просто", "задача", "задачи", "теперь",
  "будет", "нужно", "сейчас", "сегодня", "через", "может", "хочу", "хотим", "использовать", "пользоваться",
  "помогите", "подскажите", "напишите", "люди", "человек", "новый", "новая", "наш", "наша", "наши",
  "about", "after", "and", "are", "can", "for", "from", "how", "into", "not", "of", "on",
  "or", "the", "this", "to", "what", "when", "where", "with", "you", "site", "http", "https", "www",
  "tme", "курс", "реклама",
]);

const SOURCE_COLUMNS: Record<TelegramAiKeywordSourceType, string> = {
  search_query: "query_count",
  telegram_message: "telegram_message_count",
  public_post: "public_post_count",
  client_message: "client_message_count",
  web_search: "web_search_count",
};

function text(value: unknown): string {
  return String(value || "").replace(/\s+/g, " ").trim();
}

function normalizeKeyword(value: string): string {
  return text(value).toLocaleLowerCase("ru-RU").replace(/[‐‑‒–—]/g, "-");
}

function languageFor(value: string, fallback = "ru"): string {
  if (/[а-яё]/i.test(value)) return "ru";
  if (/[a-z]/i.test(value)) return "en";
  return fallback;
}

function isLikelyAutomatedClientText(value: string): boolean {
  return /^\[(?:медиа\/без текста|непрочитанное сообщение)/i.test(text(value))
    || /нажмите\s+кнопк|подобрали\s+(?:список|рекомендац)|рекомендац(?:ии|ий)\s+(?:обновлены|просмотреть)|ваших\s+интересов|ботов\s+на\s+основе|savemod|сообщение скрыто фильтром/i.test(value);
}

function inferKeywordTopic(value: string): string | undefined {
  const normalized = normalizeKeyword(value);
  if (/ожив|анимир|фото\s+(?:в|видео)|(?:видео|ролик)\s+из\s+фото|image\s*to\s*video/.test(normalized)) return "image_to_video";
  if (/фон|вырез|удалени[ея].{0,12}фон|background/.test(normalized)) return "background_removal";
  if (/голос|озвуч|аудио|speech|voice/.test(normalized)) return "voice_generation";
  if (/бесплат|free|без\s+лимит/.test(normalized)) return "free_ai";
  if (/vpn|лимит|доступ|бан|оплат|рубл/.test(normalized)) return "access_limits";
  if (/фигма|дизайн|макет|референс|художник|портфолио|design/.test(normalized)) return "design";
  if (/фото|изображ|картин|обработ/.test(normalized)) return "image_editing";
  if (/видео|ролик|генерац|video/.test(normalized)) return "video_generation";
  if (/нейросет|нейрон|chatgpt|claude|gemini|\bai\b|llm/.test(normalized)) return "ai_tool_discovery";
  return undefined;
}

function inferTrendIntent(value: string, sourceType: TelegramAiKeywordSourceType): TelegramAiTrendIntent {
  const normalized = normalizeKeyword(value);
  if (/ищу.{0,80}(?:художник|специалист|подрядчик|команд)|требу(?:ется|ются)|ваканси|заказ/.test(normalized)) return "hiring_request";
  if (/не\s+(?:работа|получа)|ошибк|не\s+могу|сломал|проблем|лимит|заблокир|не\s+открыва/.test(normalized)) return "troubleshooting";
  if (/бесплат|без\s+лимит|free|free\s+tier/.test(normalized)) return "free_access";
  if (/сколько\s+стоит|цена|оплат|рубл|тариф|стоимост/.test(normalized)) return "pricing_access";
  if (/сравн|лучше|или\s+|vs\.?|посовету|выбрать|какая\s+(?:нейросет|модел)/.test(normalized)) return "comparison";
  if (/как\s+(?:сделать|создать|настро|получить|использ)|помогите|подскажите|объясните|не\s+знаю/.test(normalized)) return "how_to";
  if (/понрав|нрав|пользовал|пользу|неинтересно|спасибо|отзыв/.test(normalized)) return "feedback";
  if (sourceType === "search_query" || sourceType === "web_search") return "tool_discovery";
  return "other";
}

function ensureProject(projectId: string): void {
  const existing = db().prepare("SELECT id FROM projects WHERE id = ?").get(projectId) as { id?: string } | undefined;
  if (existing?.id) return;
  const now = new Date().toISOString();
  db().prepare(
    `INSERT INTO projects (id, name, description, status, metadata_json, created_at, updated_at)
     VALUES (?, ?, ?, 'active', ?, ?, ?)`,
  ).run(projectId, projectId === "neron" ? "Neron" : projectId, "Telegram AI demand signals", jsonOrNull({ source: "telegram_ai_keywords" }), now, now);
}

function extractKeywords(value: string): Array<{ keyword: string; kind: "word" | "phrase" }> {
  const cleaned = text(value)
    .replace(/https?:\/\/\S+/giu, " ")
    .replace(/[@#][a-zа-яё0-9_]+/giu, " ")
    .replace(/[“”«»]/gu, " ");
  const tokens = (cleaned.toLocaleLowerCase("ru-RU").match(/[a-zа-яё][a-zа-яё0-9+#.-]{2,}/giu) || [])
    .map((token) => token.replace(/^[^a-zа-яё0-9]+|[^a-zа-яё0-9]+$/giu, ""))
    .filter((token) => token.length >= 3 && !STOPWORDS.has(token) && !/^\d+$/.test(token));
  const uniqueTokens = [...new Set(tokens)];
  const result: Array<{ keyword: string; kind: "word" | "phrase" }> = uniqueTokens.map((keyword) => ({ keyword, kind: "word" }));
  for (let index = 0; index < tokens.length - 1; index += 1) {
    const left = tokens[index];
    const right = tokens[index + 1];
    if (!left || !right || STOPWORDS.has(left) || STOPWORDS.has(right)) continue;
    const phrase = `${left} ${right}`;
    if (!result.some((item) => item.keyword === phrase)) result.push({ keyword: phrase, kind: "phrase" });
  }
  return result.slice(0, 80);
}

function toKeyword(row: KeywordRow): TelegramAiKeyword {
  const metadata = parseJson<Record<string, unknown>>(row.metadata_json);
  const recentCount = Number(row.recent_count || 0);
  const previousCount = Number(row.previous_count || 0);
  const trendDelta = recentCount - previousCount;
  return {
    id: row.id,
    projectId: row.project_id,
    keyword: row.keyword,
    normalizedKeyword: row.normalized_keyword,
    kind: row.kind as "word" | "phrase",
    language: row.language,
    ...(row.topic ? { topic: row.topic } : {}),
    status: row.status as TelegramAiKeywordStatus,
    totalCount: Number(row.total_count || 0),
    queryCount: Number(row.query_count || 0),
    telegramMessageCount: Number(row.telegram_message_count || 0),
    publicPostCount: Number(row.public_post_count || 0),
    clientMessageCount: Number(row.client_message_count || 0),
    webSearchCount: Number(row.web_search_count || 0),
    firstSeenAt: row.first_seen_at,
    lastSeenAt: row.last_seen_at,
    lastSourceType: row.last_source_type as TelegramAiKeywordSourceType,
    recentCount,
    previousCount,
    trendDelta,
    trendDirection: trendDelta > 0 ? "up" : trendDelta < 0 ? "down" : "flat",
    ...(metadata ? { metadata } : {}),
  };
}

function observeKeyword(input: {
  projectId: string;
  keyword: string;
  kind: "word" | "phrase";
  sourceType: TelegramAiKeywordSourceType;
  sourceRef: string;
  observedAt: string;
  language?: string;
  topic?: string;
  intent?: TelegramAiTrendIntent;
  metadata?: Record<string, unknown>;
}): boolean {
  const projectId = text(input.projectId) || "neron";
  const keyword = text(input.keyword);
  const normalizedKeyword = normalizeKeyword(keyword);
  const topic = text(input.topic) || inferKeywordTopic(keyword) || null;
  const sourceRef = text(input.sourceRef);
  if (!keyword || !normalizedKeyword || !sourceRef) return false;
  ensureProject(projectId);
  const now = new Date().toISOString();
  const existing = db().prepare(
    "SELECT id FROM telegram_ai_keywords WHERE project_id = ? AND normalized_keyword = ?",
  ).get(projectId, normalizedKeyword) as { id?: string } | undefined;
  const id = existing?.id || `${projectId}:keyword:${createHash("sha1").update(normalizedKeyword).digest("hex")}`;
  db().prepare(
    `INSERT INTO telegram_ai_keywords (
       id, project_id, keyword, normalized_keyword, kind, language, topic, status,
       first_seen_at, last_seen_at, last_source_type, metadata_json, updated_at
     ) VALUES (?, ?, ?, ?, ?, ?, ?, 'active', ?, ?, ?, ?, ?)
     ON CONFLICT(project_id, normalized_keyword) DO UPDATE SET
       keyword = excluded.keyword,
       kind = excluded.kind,
       language = excluded.language,
       topic = COALESCE(excluded.topic, telegram_ai_keywords.topic),
       metadata_json = COALESCE(excluded.metadata_json, telegram_ai_keywords.metadata_json),
       updated_at = excluded.updated_at`,
  ).run(
    id,
    projectId,
    keyword,
    normalizedKeyword,
    input.kind,
    text(input.language) || languageFor(keyword),
    topic,
    input.observedAt || now,
    input.observedAt || now,
    input.sourceType,
    jsonOrNull(input.metadata),
    now,
  );
  const inserted = db().prepare(
    `INSERT OR IGNORE INTO telegram_ai_keyword_observations
       (id, project_id, keyword_id, source_type, source_ref, observed_at, intent, metadata_json)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
  ).run(
    randomUUID(),
    projectId,
    id,
    input.sourceType,
    sourceRef,
    input.observedAt || now,
    input.intent || "other",
    jsonOrNull(input.metadata),
  );
  if (Number(inserted.changes || 0) !== 1) return false;
  const column = SOURCE_COLUMNS[input.sourceType];
  db().prepare(
    `UPDATE telegram_ai_keywords
     SET total_count = total_count + 1,
         ${column} = ${column} + 1,
         last_seen_at = ?, last_source_type = ?, updated_at = ?
     WHERE id = ?`,
  ).run(input.observedAt || now, input.sourceType, now, id);
  return true;
}

export function recordTelegramAiKeywordText(input: {
  projectId?: string;
  text: string;
  sourceType: TelegramAiKeywordSourceType;
  sourceRef: string;
  observedAt?: string;
  language?: string;
  topic?: string;
  intent?: TelegramAiTrendIntent;
  metadata?: Record<string, unknown>;
}): { projectId: string; sourceType: TelegramAiKeywordSourceType; sourceRef: string; extracted: number; recorded: number; keywords: string[] } {
  const projectId = text(input.projectId) || "neron";
  const sourceRef = text(input.sourceRef);
  if (input.sourceType === "client_message" && isLikelyAutomatedClientText(input.text)) {
    return { projectId, sourceType: input.sourceType, sourceRef, extracted: 0, recorded: 0, keywords: [] };
  }
  const extracted = extractKeywords(input.text);
  const intent = input.intent || inferTrendIntent(input.text, input.sourceType);
  const recorded = extracted.filter((item) => observeKeyword({
    projectId,
    keyword: item.keyword,
    kind: item.kind,
    sourceType: input.sourceType,
    sourceRef,
    observedAt: input.observedAt || new Date().toISOString(),
    language: input.language,
    topic: input.topic,
    intent,
    metadata: input.metadata,
  })).length;
  return {
    projectId,
    sourceType: input.sourceType,
    sourceRef,
    extracted: extracted.length,
    recorded,
    keywords: extracted.map((item) => item.keyword),
  };
}

export function listTelegramAiKeywords(input?: {
  projectId?: string;
  status?: TelegramAiKeywordStatus;
  sourceType?: TelegramAiKeywordSourceType;
  topic?: string;
  kind?: "word" | "phrase";
  windowDays?: number;
  limit?: number;
}): TelegramAiKeyword[] {
  const projectId = text(input?.projectId) || "neron";
  const days = Math.max(1, Math.min(Number(input?.windowDays) || 30, 3650));
  const now = Date.now();
  const recentStart = new Date(now - days * 24 * 60 * 60 * 1000).toISOString();
  const previousStart = new Date(now - days * 2 * 24 * 60 * 60 * 1000).toISOString();
  const clauses = ["k.project_id = ?"];
  const params: Array<string | number | null> = [recentStart, previousStart, recentStart];
  if (input?.sourceType) {
    params.push(input.sourceType);
  }
  params.push(projectId);
  if (input?.sourceType) {
    clauses.push("EXISTS (SELECT 1 FROM telegram_ai_keyword_observations ko WHERE ko.keyword_id = k.id AND ko.source_type = ?)");
    params.push(input.sourceType);
  }
  if (input?.status) {
    clauses.push("k.status = ?");
    params.push(input.status);
  }
  if (input?.topic) {
    clauses.push("k.topic = ?");
    params.push(text(input.topic));
  }
  if (input?.kind) {
    clauses.push("k.kind = ?");
    params.push(input.kind);
  }
  params.push(Math.max(1, Math.min(Number(input?.limit) || 100, 500)));
  const rows = db().prepare(
    `SELECT k.*,
       COALESCE(SUM(CASE WHEN o.observed_at >= ? THEN 1 ELSE 0 END), 0) AS recent_count,
       COALESCE(SUM(CASE WHEN o.observed_at >= ? AND o.observed_at < ? THEN 1 ELSE 0 END), 0) AS previous_count
     FROM telegram_ai_keywords k
     LEFT JOIN telegram_ai_keyword_observations o
       ON o.keyword_id = k.id
       ${input?.sourceType ? "AND o.source_type = ?" : ""}
     WHERE ${clauses.join(" AND ")}
     GROUP BY k.id
     ORDER BY recent_count DESC, k.total_count DESC, k.last_seen_at DESC
     LIMIT ?`,
  ).all(...params) as unknown as KeywordRow[];
  return rows.map(toKeyword);
}

export function listTelegramAiKeywordTopics(input?: {
  projectId?: string;
  status?: TelegramAiKeywordStatus;
  windowDays?: number;
  limit?: number;
}): TelegramAiKeywordTopicTrend[] {
  const projectId = text(input?.projectId) || "neron";
  const days = Math.max(1, Math.min(Number(input?.windowDays) || 30, 3650));
  const now = Date.now();
  const recentStart = new Date(now - days * 24 * 60 * 60 * 1000).toISOString();
  const previousStart = new Date(now - days * 2 * 24 * 60 * 60 * 1000).toISOString();
  const clauses = ["k.project_id = ?", "k.topic IS NOT NULL"];
  const params: Array<string | number> = [recentStart, previousStart, recentStart, projectId];
  if (input?.status) {
    clauses.push("k.status = ?");
    params.push(input.status);
  }
  params.push(Math.max(1, Math.min(Number(input?.limit) || 50, 200)));
  const rows = db().prepare(
    `SELECT k.topic AS topic,
       COUNT(DISTINCT k.id) AS keyword_count,
       COUNT(DISTINCT o.source_type || ':' || o.source_ref) AS total_count,
       COUNT(DISTINCT CASE WHEN o.source_type = 'search_query' THEN o.source_ref END) AS query_count,
       COUNT(DISTINCT CASE WHEN o.source_type = 'telegram_message' THEN o.source_ref END) AS telegram_message_count,
       COUNT(DISTINCT CASE WHEN o.source_type = 'public_post' THEN o.source_ref END) AS public_post_count,
       COUNT(DISTINCT CASE WHEN o.source_type = 'client_message' THEN o.source_ref END) AS client_message_count,
       COUNT(DISTINCT CASE WHEN o.source_type = 'web_search' THEN o.source_ref END) AS web_search_count,
       COUNT(DISTINCT CASE WHEN o.observed_at >= ? THEN o.source_type || ':' || o.source_ref END) AS recent_count,
       COUNT(DISTINCT CASE WHEN o.observed_at >= ? AND o.observed_at < ? THEN o.source_type || ':' || o.source_ref END) AS previous_count
     FROM telegram_ai_keywords k
     LEFT JOIN telegram_ai_keyword_observations o ON o.keyword_id = k.id
     WHERE ${clauses.join(" AND ")}
     GROUP BY k.topic
     ORDER BY recent_count DESC, total_count DESC
     LIMIT ?`,
  ).all(...params) as Array<{
    topic: string;
    keyword_count: number;
    total_count: number;
    query_count: number;
    telegram_message_count: number;
    public_post_count: number;
    client_message_count: number;
    web_search_count: number;
    recent_count: number;
    previous_count: number;
  }>;
  return rows.map((row) => {
    const recentCount = Number(row.recent_count || 0);
    const previousCount = Number(row.previous_count || 0);
    const trendDelta = recentCount - previousCount;
    return {
      projectId,
      topic: row.topic,
      keywordCount: Number(row.keyword_count || 0),
      totalCount: Number(row.total_count || 0),
      queryCount: Number(row.query_count || 0),
      telegramMessageCount: Number(row.telegram_message_count || 0),
      publicPostCount: Number(row.public_post_count || 0),
      clientMessageCount: Number(row.client_message_count || 0),
      webSearchCount: Number(row.web_search_count || 0),
      recentCount,
      previousCount,
      trendDelta,
      trendDirection: trendDelta > 0 ? "up" : trendDelta < 0 ? "down" : "flat",
    };
  });
}

export type TelegramAiTrendSnapshot = {
  id: string;
  projectId: string;
  periodStart: string;
  periodEnd: string;
  sourceScope: string;
  topic: string;
  intent: TelegramAiTrendIntent;
  sourceCount: number;
  keywordObservationCount: number;
  queryCount: number;
  telegramMessageCount: number;
  publicPostCount: number;
  clientMessageCount: number;
  webSearchCount: number;
  createdAt: string;
  metadata?: Record<string, unknown>;
};

function weekBounds(periodStart?: string): { start: string; end: string } {
  const value = periodStart ? new Date(periodStart) : new Date();
  if (Number.isNaN(value.getTime())) throw new Error("periodStart must be a valid ISO timestamp");
  const start = new Date(Date.UTC(value.getUTCFullYear(), value.getUTCMonth(), value.getUTCDate()));
  const day = start.getUTCDay();
  start.setUTCDate(start.getUTCDate() - ((day + 6) % 7));
  const end = new Date(start);
  end.setUTCDate(end.getUTCDate() + 7);
  return { start: start.toISOString(), end: end.toISOString() };
}

export function buildTelegramAiTrendSnapshot(input?: {
  projectId?: string;
  periodStart?: string;
  sourceScope?: TelegramAiKeywordSourceType | "all";
  reset?: boolean;
}): { projectId: string; periodStart: string; periodEnd: string; sourceScope: string; rows: number } {
  const projectId = text(input?.projectId) || "neron";
  const sourceScope = text(input?.sourceScope) || "all";
  const { start, end } = weekBounds(input?.periodStart);
  if (input?.reset !== false) {
    db().prepare(
      "DELETE FROM telegram_ai_trend_snapshots WHERE project_id = ? AND period_start = ? AND source_scope = ?",
    ).run(projectId, start, sourceScope);
  }
  const clauses = ["o.project_id = ?", "o.observed_at >= ?", "o.observed_at < ?"];
  const params: Array<string | number> = [projectId, start, end];
  if (sourceScope !== "all") {
    clauses.push("o.source_type = ?");
    params.push(sourceScope);
  }
  const rows = db().prepare(
    `SELECT COALESCE(k.topic, 'unclassified') AS topic,
       COALESCE(o.intent, 'other') AS intent,
       COUNT(DISTINCT o.source_type || ':' || o.source_ref) AS source_count,
       COUNT(*) AS keyword_observation_count,
       COUNT(DISTINCT CASE WHEN o.source_type = 'search_query' THEN o.source_ref END) AS query_count,
       COUNT(DISTINCT CASE WHEN o.source_type = 'telegram_message' THEN o.source_ref END) AS telegram_message_count,
       COUNT(DISTINCT CASE WHEN o.source_type = 'public_post' THEN o.source_ref END) AS public_post_count,
       COUNT(DISTINCT CASE WHEN o.source_type = 'client_message' THEN o.source_ref END) AS client_message_count,
       COUNT(DISTINCT CASE WHEN o.source_type = 'web_search' THEN o.source_ref END) AS web_search_count
     FROM telegram_ai_keyword_observations o
     JOIN telegram_ai_keywords k ON k.id = o.keyword_id
     WHERE ${clauses.join(" AND ")}
     GROUP BY k.topic, o.intent
     ORDER BY source_count DESC, keyword_observation_count DESC`,
  ).all(...params) as Array<{
    topic: string;
    intent: string;
    source_count: number;
    keyword_observation_count: number;
    query_count: number;
    telegram_message_count: number;
    public_post_count: number;
    client_message_count: number;
    web_search_count: number;
  }>;
  const now = new Date().toISOString();
  const insert = db().prepare(
    `INSERT INTO telegram_ai_trend_snapshots (
       id, project_id, period_start, period_end, source_scope, topic, intent,
       source_count, keyword_observation_count, query_count, telegram_message_count,
       public_post_count, client_message_count, web_search_count, created_at, metadata_json
     ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
     ON CONFLICT(project_id, period_start, source_scope, topic, intent) DO UPDATE SET
       period_end = excluded.period_end,
       source_count = excluded.source_count,
       keyword_observation_count = excluded.keyword_observation_count,
       query_count = excluded.query_count,
       telegram_message_count = excluded.telegram_message_count,
       public_post_count = excluded.public_post_count,
       client_message_count = excluded.client_message_count,
       web_search_count = excluded.web_search_count,
       created_at = excluded.created_at,
       metadata_json = excluded.metadata_json`,
  );
  for (const row of rows) {
    insert.run(
      `${projectId}:snapshot:${start}:${sourceScope}:${row.topic}:${row.intent}`,
      projectId,
      start,
      end,
      sourceScope,
      row.topic,
      row.intent,
      row.source_count,
      row.keyword_observation_count,
      row.query_count,
      row.telegram_message_count,
      row.public_post_count,
      row.client_message_count,
      row.web_search_count,
      now,
      jsonOrNull({ generatedBy: "telegram_ai_keywords" }),
    );
  }
  return { projectId, periodStart: start, periodEnd: end, sourceScope, rows: rows.length };
}

export function listTelegramAiTrendSnapshots(input?: {
  projectId?: string;
  periodStart?: string;
  sourceScope?: string;
  topic?: string;
  intent?: TelegramAiTrendIntent;
  limit?: number;
}): TelegramAiTrendSnapshot[] {
  const clauses = ["project_id = ?"];
  const params: Array<string | number> = [text(input?.projectId) || "neron"];
  if (input?.periodStart) {
    clauses.push("period_start = ?");
    params.push(weekBounds(input.periodStart).start);
  }
  if (input?.sourceScope) {
    clauses.push("source_scope = ?");
    params.push(text(input.sourceScope));
  }
  if (input?.topic) {
    clauses.push("topic = ?");
    params.push(text(input.topic));
  }
  if (input?.intent) {
    clauses.push("intent = ?");
    params.push(input.intent);
  }
  params.push(Math.max(1, Math.min(Number(input?.limit) || 100, 500)));
  const rows = db().prepare(
    `SELECT * FROM telegram_ai_trend_snapshots
     WHERE ${clauses.join(" AND ")}
     ORDER BY period_start DESC, source_count DESC, keyword_observation_count DESC
     LIMIT ?`,
  ).all(...params) as Array<{
    id: string;
    project_id: string;
    period_start: string;
    period_end: string;
    source_scope: string;
    topic: string;
    intent: string;
    source_count: number;
    keyword_observation_count: number;
    query_count: number;
    telegram_message_count: number;
    public_post_count: number;
    client_message_count: number;
    web_search_count: number;
    created_at: string;
    metadata_json: string | null;
  }>;
  return rows.map((row) => ({
    id: row.id,
    projectId: row.project_id,
    periodStart: row.period_start,
    periodEnd: row.period_end,
    sourceScope: row.source_scope,
    topic: row.topic,
    intent: row.intent as TelegramAiTrendIntent,
    sourceCount: Number(row.source_count || 0),
    keywordObservationCount: Number(row.keyword_observation_count || 0),
    queryCount: Number(row.query_count || 0),
    telegramMessageCount: Number(row.telegram_message_count || 0),
    publicPostCount: Number(row.public_post_count || 0),
    clientMessageCount: Number(row.client_message_count || 0),
    webSearchCount: Number(row.web_search_count || 0),
    createdAt: row.created_at,
    ...(parseJson<Record<string, unknown>>(row.metadata_json) ? { metadata: parseJson<Record<string, unknown>>(row.metadata_json) } : {}),
  }));
}

export function rebuildTelegramAiKeywords(projectId = "neron", options?: { reset?: boolean }): {
  projectId: string;
  reset: boolean;
  sourcesScanned: Record<string, number>;
  observationsRecorded: number;
  keywords: number;
} {
  const reset = options?.reset === true;
  if (reset) {
    db().prepare("DELETE FROM telegram_ai_keyword_observations WHERE project_id = ?").run(projectId);
    db().prepare("DELETE FROM telegram_ai_keywords WHERE project_id = ?").run(projectId);
  }
  const sourcesScanned: Record<string, number> = {};
  let observationsRecorded = 0;
  const runRows = db().prepare(
    "SELECT id, query, source, finished_at FROM telegram_ai_search_runs WHERE project_id = ? ORDER BY finished_at ASC, id ASC",
  ).all(projectId) as Array<{ id: string; query: string; source: string; finished_at: string }>;
  for (const row of runRows) {
    const sourceType: TelegramAiKeywordSourceType = row.source === "web_search" ? "web_search" : "search_query";
    const result = recordTelegramAiKeywordText({
      projectId,
      text: row.query,
      sourceType,
      sourceRef: `run:${row.id}`,
      observedAt: row.finished_at,
      metadata: { rebuilt: true, runId: row.id },
    });
    observationsRecorded += result.recorded;
    sourcesScanned[sourceType] = (sourcesScanned[sourceType] || 0) + 1;
  }
  const postRows = db().prepare(
    "SELECT telegram_message_key, title, description, public_url, posted_at, last_seen_at FROM telegram_ai_posts WHERE project_id = ? AND classification IN ('request', 'opportunity', 'discussion') ORDER BY COALESCE(posted_at, last_seen_at) ASC, id ASC",
  ).all(projectId) as Array<{ telegram_message_key: string; title: string; description: string; public_url: string | null; posted_at: string | null; last_seen_at: string }>;
  for (const row of postRows) {
    const result = recordTelegramAiKeywordText({
      projectId,
      text: `${row.title} ${row.description}`,
      sourceType: "public_post",
      sourceRef: `post:${row.public_url || row.telegram_message_key}`,
      observedAt: row.posted_at || row.last_seen_at,
      metadata: { rebuilt: true },
    });
    observationsRecorded += result.recorded;
    sourcesScanned.public_post = (sourcesScanned.public_post || 0) + 1;
  }
  const messageRows = db().prepare(
    `SELECT id, text, sent_at FROM client_profile_messages
     WHERE direction = 'inbound'
       AND (metadata_json IS NULL OR metadata_json NOT LIKE '%"automated_filter_notice":true%')
     ORDER BY sent_at ASC, id ASC`,
  ).all() as Array<{ id: string; text: string; sent_at: string }>;
  for (const row of messageRows) {
    if (isLikelyAutomatedClientText(row.text)) continue;
    const result = recordTelegramAiKeywordText({
      projectId,
      text: row.text,
      sourceType: "client_message",
      sourceRef: `client-message:${row.id}`,
      observedAt: row.sent_at,
      metadata: { rebuilt: true },
    });
    observationsRecorded += result.recorded;
    sourcesScanned.client_message = (sourcesScanned.client_message || 0) + 1;
  }
  return {
    projectId,
    reset,
    sourcesScanned,
    observationsRecorded,
    keywords: Number((db().prepare("SELECT COUNT(*) AS count FROM telegram_ai_keywords WHERE project_id = ?").get(projectId) as { count?: number } | undefined)?.count || 0),
  };
}
