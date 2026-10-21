import { randomUUID } from "node:crypto";
import { db, jsonOrNull, parseJson } from "./db.js";

export type TelegramAiChatType = "group" | "channel";
export type TelegramAiChatStatus = "candidate" | "reviewed" | "ignored" | "archived";

export type TelegramAiChatTopicHit = {
  query?: string;
  link?: string;
  summary?: string;
};

export type TelegramAiChat = {
  id: string;
  projectId: string;
  telegramChatId: string;
  title: string;
  username?: string;
  chatType: TelegramAiChatType;
  publicUrl?: string;
  status: TelegramAiChatStatus;
  relevanceScore?: number;
  discoveryQueries?: string[];
  topicHits?: TelegramAiChatTopicHit[];
  notes?: string;
  metadata?: Record<string, unknown>;
  firstSeenAt: string;
  lastScannedAt?: string;
  createdAt: string;
  updatedAt: string;
};

type TelegramAiChatRow = {
  id: string;
  project_id: string;
  telegram_chat_id: string;
  title: string;
  username: string | null;
  chat_type: string;
  public_url: string | null;
  status: string;
  relevance_score: number | null;
  discovery_queries_json: string | null;
  topic_hits_json: string | null;
  notes: string | null;
  metadata_json: string | null;
  first_seen_at: string;
  last_scanned_at: string | null;
  created_at: string;
  updated_at: string;
};

function toTelegramAiChat(row: TelegramAiChatRow): TelegramAiChat {
  const discoveryQueries = parseJson<string[]>(row.discovery_queries_json);
  const topicHits = parseJson<TelegramAiChatTopicHit[]>(row.topic_hits_json);
  const metadata = parseJson<Record<string, unknown>>(row.metadata_json);
  return {
    id: row.id,
    projectId: row.project_id,
    telegramChatId: row.telegram_chat_id,
    title: row.title,
    ...(row.username ? { username: row.username } : {}),
    chatType: row.chat_type as TelegramAiChatType,
    ...(row.public_url ? { publicUrl: row.public_url } : {}),
    status: row.status as TelegramAiChatStatus,
    ...(row.relevance_score === null ? {} : { relevanceScore: row.relevance_score }),
    ...(discoveryQueries ? { discoveryQueries } : {}),
    ...(topicHits ? { topicHits } : {}),
    ...(row.notes ? { notes: row.notes } : {}),
    ...(metadata ? { metadata } : {}),
    firstSeenAt: row.first_seen_at,
    ...(row.last_scanned_at ? { lastScannedAt: row.last_scanned_at } : {}),
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export function upsertTelegramAiChat(input: {
  projectId: string;
  telegramChatId: string;
  title: string;
  username?: string;
  chatType?: TelegramAiChatType;
  publicUrl?: string;
  status?: TelegramAiChatStatus;
  relevanceScore?: number;
  discoveryQueries?: string[];
  topicHits?: TelegramAiChatTopicHit[];
  notes?: string;
  metadata?: Record<string, unknown>;
  firstSeenAt?: string;
  lastScannedAt?: string;
}): TelegramAiChat {
  const conn = db();
  const project = conn.prepare("SELECT id FROM projects WHERE id = ?").get(input.projectId) as { id: string } | undefined;
  if (!project) throw new Error(`Project not found: ${input.projectId}`);

  const now = new Date().toISOString();
  const firstSeenAt = input.firstSeenAt ?? now;
  conn.prepare(
    `INSERT INTO telegram_ai_chats (
       id, project_id, telegram_chat_id, title, username, chat_type, public_url,
       status, relevance_score, discovery_queries_json, topic_hits_json, notes,
       metadata_json, first_seen_at, last_scanned_at, created_at, updated_at
     ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
     ON CONFLICT(project_id, telegram_chat_id) DO UPDATE SET
       title = excluded.title,
       username = excluded.username,
       chat_type = excluded.chat_type,
       public_url = excluded.public_url,
       status = excluded.status,
       relevance_score = excluded.relevance_score,
       discovery_queries_json = excluded.discovery_queries_json,
       topic_hits_json = excluded.topic_hits_json,
       notes = excluded.notes,
       metadata_json = excluded.metadata_json,
       last_scanned_at = excluded.last_scanned_at,
       updated_at = excluded.updated_at`,
  ).run(
    randomUUID(),
    input.projectId,
    input.telegramChatId,
    input.title.trim(),
    input.username?.trim() || null,
    input.chatType ?? "group",
    input.publicUrl?.trim() || null,
    input.status ?? "candidate",
    input.relevanceScore ?? null,
    jsonOrNull(input.discoveryQueries),
    jsonOrNull(input.topicHits),
    input.notes?.trim() || null,
    jsonOrNull(input.metadata),
    firstSeenAt,
    input.lastScannedAt ?? null,
    now,
    now,
  );

  const row = conn.prepare(
    "SELECT * FROM telegram_ai_chats WHERE project_id = ? AND telegram_chat_id = ?",
  ).get(input.projectId, input.telegramChatId) as TelegramAiChatRow;
  return toTelegramAiChat(row);
}

export function getTelegramAiChat(id: string): TelegramAiChat | undefined {
  const row = db().prepare("SELECT * FROM telegram_ai_chats WHERE id = ?").get(id) as TelegramAiChatRow | undefined;
  return row ? toTelegramAiChat(row) : undefined;
}

export function listTelegramAiChats(filters?: {
  projectId?: string;
  status?: TelegramAiChatStatus;
  chatType?: TelegramAiChatType;
  limit?: number;
}): TelegramAiChat[] {
  const conditions: string[] = [];
  const params: (string | number)[] = [];
  if (filters?.projectId) {
    conditions.push("project_id = ?");
    params.push(filters.projectId);
  }
  if (filters?.status) {
    conditions.push("status = ?");
    params.push(filters.status);
  }
  if (filters?.chatType) {
    conditions.push("chat_type = ?");
    params.push(filters.chatType);
  }
  const limit = Math.max(1, Math.min(filters?.limit ?? 50, 200));
  params.push(limit);
  const where = conditions.length ? `WHERE ${conditions.join(" AND ")}` : "";
  const rows = connRows(where, params);
  return rows.map(toTelegramAiChat);
}

function connRows(where: string, params: (string | number)[]): TelegramAiChatRow[] {
  return db().prepare(
    `SELECT * FROM telegram_ai_chats ${where}
     ORDER BY relevance_score DESC NULLS LAST, updated_at DESC
     LIMIT ?`,
  ).all(...params) as unknown as TelegramAiChatRow[];
}
