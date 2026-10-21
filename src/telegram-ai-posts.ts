import { createHash } from "node:crypto";
import { db, jsonOrNull, parseJson } from "./db.js";
import type { TelegramPublicPostHit } from "./telegram/types.js";
import { buildNeronPublicReply, type NeronOfferMatch } from "./telegram-ai-offers.js";

export type TelegramAiPostClassification =
  | "request"
  | "opportunity"
  | "discussion"
  | "promotion"
  | "repost";

export type TelegramAiPost = {
  id: string;
  projectId: string;
  telegramMessageKey: string;
  query: string;
  title: string;
  description: string;
  publicUrl?: string;
  telegramChatId: string;
  telegramMessageId: string;
  chatTitle?: string;
  postedAt?: string;
  classification: TelegramAiPostClassification;
  relevanceScore: number;
  explicitRequest: boolean;
  publicReplyDraft?: string;
  status: string;
  metadata?: Record<string, unknown>;
  firstSeenAt: string;
  lastSeenAt: string;
  updatedAt: string;
};

type TelegramAiPostRow = {
  id: string;
  project_id: string;
  telegram_message_key: string;
  query: string;
  title: string;
  description: string;
  public_url: string | null;
  telegram_chat_id: string;
  telegram_message_id: string;
  chat_title: string | null;
  posted_at: string | null;
  classification: string;
  relevance_score: number;
  explicit_request: number;
  public_reply_draft: string | null;
  status: string;
  metadata_json: string | null;
  first_seen_at: string;
  last_seen_at: string;
  updated_at: string;
};

function text(value: unknown): string {
  return String(value || "").replace(/\s+/g, " ").trim();
}

function fingerprint(value: string): string {
  return createHash("sha1").update(value.toLowerCase()).digest("hex");
}

function toPost(row: TelegramAiPostRow): TelegramAiPost {
  const metadata = parseJson<Record<string, unknown>>(row.metadata_json);
  return {
    id: row.id,
    projectId: row.project_id,
    telegramMessageKey: row.telegram_message_key,
    query: row.query,
    title: row.title,
    description: row.description,
    ...(row.public_url ? { publicUrl: row.public_url } : {}),
    telegramChatId: row.telegram_chat_id,
    telegramMessageId: row.telegram_message_id,
    ...(row.chat_title ? { chatTitle: row.chat_title } : {}),
    ...(row.posted_at ? { postedAt: row.posted_at } : {}),
    classification: row.classification as TelegramAiPostClassification,
    relevanceScore: Number(row.relevance_score || 0),
    explicitRequest: row.explicit_request === 1,
    ...(row.public_reply_draft ? { publicReplyDraft: row.public_reply_draft } : {}),
    status: row.status,
    ...(metadata ? { metadata } : {}),
    firstSeenAt: row.first_seen_at,
    lastSeenAt: row.last_seen_at,
    updatedAt: row.updated_at,
  };
}

function ensureProject(projectId: string): void {
  const existing = db().prepare("SELECT id FROM projects WHERE id = ?").get(projectId) as { id?: string } | undefined;
  if (existing?.id) return;
  const now = new Date().toISOString();
  db()
    .prepare(
      `INSERT INTO projects (id, name, description, status, metadata_json, created_at, updated_at)
       VALUES (?, ?, ?, 'active', ?, ?, ?)`,
    )
    .run(projectId, projectId === "neron" ? "Neron" : projectId, "Telegram AI discovery records", jsonOrNull({ source: "telegram_public_posts" }), now, now);
}

export function classifyTelegramAiPost(
  hit: TelegramPublicPostHit,
  duplicate = false,
): {
  classification: TelegramAiPostClassification;
  relevanceScore: number;
  explicitRequest: boolean;
  reason: string;
  publicReplyDraft?: string;
  neronOfferMatches: NeronOfferMatch[];
} {
  const value = `${text(hit.title)}\n${text(hit.description)}`;
  const topicToken = "(?:нейросет\\w*|нейрон\\w*|искусственн\\w* интеллект|\\bai\\b|\\bии\\b|chatgpt|claude|seedance|veo|генерац\\w*|промпт\\w*|llm)";
  const topic = new RegExp(topicToken, "i").test(value);
  const requestNearTopic = new RegExp(
    `(?:помогите(?:\\s+(?:мне|нам|с|разобраться|найти|настроить|сделать|создать|выбрать|определиться))?|подскажите|посоветуйте|объясните|можно ли|кто знает|не (?:работает|получается)|ошибк\\w*|не могу|не знаю)[^.!?\\n]{0,120}${topicToken}|${topicToken}[^.!?\\n]{0,120}(?:подскажите|посоветуйте|объясните|можно ли|не (?:работает|получается)|ошибк\\w*)`,
    "i",
  ).test(value);
  const needToolNearTopic = new RegExp(
    `(?:ищ(?:у|ем|ут)\\s+(?:[^.!?\\n]{0,80})?${topicToken}|нужн(?:а|о|ы)\\s+(?:(?:мне|нам)\\s+)?(?:${topicToken}|сервис\\w*|инструмент\\w*|модел\\w*|промпт\\w*)|(?:выбираю|нужен совет)[^.!?\\n]{0,80}(?:${topicToken}|сервис\\w*|инструмент\\w*|модел\\w*))`,
    "i",
  ).test(value);
  const titleDirect = /^(?:помогите|подскажите|посоветуйте|ищ(?:у|ем|ут)|нужн(?:а|о|ы)|не (?:работает|получается)|ошибк)/i.test(text(hit.title));
  const firstPersonIssue = new RegExp(
    `(?:у меня|мне|нам|я не могу|я не знаю|я ищу|мы ищем)[^.!?\\n]{0,120}${topicToken}`,
    "i",
  ).test(value);
  const editorial = /семинар|вебинар|курс|канал|презентац|расскажу|рассказываю|ошибка новичк|навигаци|обучени|подписывай|реклам|инструкци|обзор|гайд|как я/i.test(value);
  const request = (requestNearTopic || needToolNearTopic) && (titleDirect || firstPersonIssue) && !editorial;
  const opportunity = new RegExp(
    `(?:ищ(?:у|ем|ут)|требу(?:ется|ются))\\s+(?:[^.!?\\n]{0,80})?(?:специалист\\w*|художник\\w*|подрядчик\\w*|${topicToken})`,
    "i",
  ).test(value);
  const promotional = /подписывай|промокод|скидк|курс|вебинар|записывай|цена|купить|заказ|услуг[аи]|рекламн|розыгрыш|партнёрск/i.test(value);
  const question = requestNearTopic || needToolNearTopic;

  let score = topic ? 20 : 0;
  if (request) score += 55;
  if (opportunity) score += 45;
  if (question) score += 10;
  if (promotional) score -= 35;
  if (duplicate) score -= 45;
  score = Math.max(0, Math.min(100, score));

  let classification: TelegramAiPostClassification = "discussion";
  let reason = topic ? "Текст связан с ИИ, но явный запрос не найден" : "Нет уверенного сигнала по теме";
  if (duplicate) {
    classification = "repost";
    reason = "Дубликат текста в выдаче, вероятный репост";
  } else if (opportunity) {
    classification = "opportunity";
    reason = "Автор ищет специалиста, инструмент или решение по теме ИИ";
  } else if (request) {
    classification = "request";
    reason = "Есть явный вопрос или просьба о помощи по ИИ";
  } else if (promotional) {
    classification = "promotion";
    reason = "Похоже на рекламу, продажу или промо-публикацию";
  }

  const offerReply = buildNeronPublicReply({
    title: text(hit.title),
    description: text(hit.description),
    classification,
  });
  return {
    classification,
    relevanceScore: score,
    explicitRequest: request || opportunity,
    reason,
    ...(offerReply.draft ? { publicReplyDraft: offerReply.draft } : {}),
    neronOfferMatches: offerReply.matches,
  };
}

export function reclassifyTelegramAiPosts(projectId = "neron"): {
  projectId: string;
  updated: number;
  byClassification: Record<string, number>;
} {
  const rows = db()
    .prepare("SELECT * FROM telegram_ai_posts WHERE project_id = ? ORDER BY first_seen_at ASC, id ASC")
    .all(projectId) as unknown as TelegramAiPostRow[];
  const seenContent = new Set<string>();
  const now = new Date().toISOString();
  const update = db().prepare(
    `UPDATE telegram_ai_posts SET classification = ?, relevance_score = ?, explicit_request = ?,
       public_reply_draft = ?, metadata_json = ?, updated_at = ? WHERE id = ?`,
  );
  const byClassification: Record<string, number> = {};
  for (const row of rows) {
    const hit: TelegramPublicPostHit = {
      id: row.telegram_message_key,
      platform: "telegram",
      kind: "public_post",
      title: row.title,
      description: row.description,
      ...(row.public_url ? { link: row.public_url } : {}),
      date: row.posted_at || row.updated_at,
      chat: row.chat_title || row.telegram_chat_id,
      chatId: Number(row.telegram_chat_id) || 0,
      messageId: Number(row.telegram_message_id) || 0,
    };
    const key = fingerprint(text(row.description));
    const classified = classifyTelegramAiPost(hit, seenContent.has(key));
    seenContent.add(key);
    const previousMetadata = parseJson<Record<string, unknown>>(row.metadata_json) || {};
    const metadata = {
      ...previousMetadata,
      classificationReason: classified.reason,
      contentFingerprint: key,
      reclassifiedAt: now,
      neronOfferMatches: classified.neronOfferMatches,
    };
    update.run(
      classified.classification,
      classified.relevanceScore,
      classified.explicitRequest ? 1 : 0,
      classified.publicReplyDraft || null,
      jsonOrNull(metadata),
      now,
      row.id,
    );
    byClassification[classified.classification] = (byClassification[classified.classification] || 0) + 1;
  }
  return { projectId, updated: rows.length, byClassification };
}

export function saveTelegramAiPosts(input: {
  projectId?: string;
  query: string;
  hits: TelegramPublicPostHit[];
}): { projectId: string; stored: number; actionable: number; records: TelegramAiPost[] } {
  const projectId = text(input.projectId) || "neron";
  const query = text(input.query);
  if (!query) throw new Error("query is required");
  ensureProject(projectId);

  const now = new Date().toISOString();
  const seenContent = new Set<string>();
  const records: TelegramAiPost[] = [];
  const statement = db().prepare(
    `INSERT INTO telegram_ai_posts (
       id, project_id, telegram_message_key, query, title, description, public_url,
       telegram_chat_id, telegram_message_id, chat_title, posted_at, classification,
       relevance_score, explicit_request, public_reply_draft, status, metadata_json,
       first_seen_at, last_seen_at, updated_at
     ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'candidate', ?, ?, ?, ?)
     ON CONFLICT(project_id, telegram_message_key) DO UPDATE SET
       query = excluded.query,
       title = excluded.title,
       description = excluded.description,
       public_url = excluded.public_url,
       chat_title = excluded.chat_title,
       posted_at = excluded.posted_at,
       classification = excluded.classification,
       relevance_score = excluded.relevance_score,
       explicit_request = excluded.explicit_request,
       public_reply_draft = excluded.public_reply_draft,
       metadata_json = excluded.metadata_json,
       last_seen_at = excluded.last_seen_at,
       updated_at = excluded.updated_at`,
  );

  for (const hit of input.hits) {
    const contentKey = fingerprint(text(hit.description));
    const classified = classifyTelegramAiPost(hit, seenContent.has(contentKey));
    seenContent.add(contentKey);
    const key = text(hit.id) || `tg_${hit.chatId}_${hit.messageId}`;
    const id = `${projectId}:${key}`;
    const metadata = {
      source: "telegram_public_post_search",
      classificationReason: classified.reason,
      contentFingerprint: contentKey,
      neronOfferMatches: classified.neronOfferMatches,
    };
    statement.run(
      id,
      projectId,
      key,
      query,
      text(hit.title) || text(hit.chat) || "Telegram post",
      text(hit.description),
      text(hit.link) || null,
      String(hit.chatId),
      String(hit.messageId),
      text(hit.chat) || null,
      text(hit.date) || null,
      classified.classification,
      classified.relevanceScore,
      classified.explicitRequest ? 1 : 0,
      classified.publicReplyDraft || null,
      jsonOrNull(metadata),
      now,
      now,
      now,
    );
    const row = db().prepare("SELECT * FROM telegram_ai_posts WHERE id = ?").get(id) as TelegramAiPostRow | undefined;
    if (row) records.push(toPost(row));
  }

  return {
    projectId,
    stored: records.length,
    actionable: records.filter((record) => record.classification === "request" || record.classification === "opportunity").length,
    records,
  };
}

export function listTelegramAiPosts(input?: {
  projectId?: string;
  classification?: TelegramAiPostClassification;
  minScore?: number;
  limit?: number;
}): TelegramAiPost[] {
  const clauses = ["project_id = ?"];
  const params: Array<string | number> = [text(input?.projectId) || "neron"];
  if (input?.classification) {
    clauses.push("classification = ?");
    params.push(input.classification);
  }
  if (input?.minScore !== undefined) {
    clauses.push("relevance_score >= ?");
    params.push(Math.max(0, Math.min(100, Number(input.minScore) || 0)));
  }
  params.push(Math.max(1, Math.min(Number(input?.limit) || 50, 200)));
  const rows = db()
    .prepare(`SELECT * FROM telegram_ai_posts WHERE ${clauses.join(" AND ")} ORDER BY relevance_score DESC, updated_at DESC LIMIT ?`)
    .all(...params) as unknown as TelegramAiPostRow[];
  return rows.map(toPost);
}
