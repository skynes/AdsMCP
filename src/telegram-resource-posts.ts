import { randomUUID } from "node:crypto";
import { db, jsonOrNull, parseJson } from "./db.js";

export type TelegramResourcePostStatus = "posted" | "deleted" | "unknown";
export type TelegramResourcePostModerationStatus = "unknown" | "allowed" | "blocked";

export type TelegramResourcePost = {
  id: string;
  projectId: string;
  resourceId: string;
  telegramMessageId?: string;
  publicUrl: string;
  postedAt?: string;
  recordedAt: string;
  status: TelegramResourcePostStatus;
  moderationStatus: TelegramResourcePostModerationStatus;
  notes?: string;
  metadata?: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
};

type TelegramResourcePostRow = {
  id: string;
  project_id: string;
  resource_id: string;
  telegram_message_id: string | null;
  public_url: string;
  posted_at: string | null;
  recorded_at: string;
  status: string;
  moderation_status: string;
  notes: string | null;
  metadata_json: string | null;
  created_at: string;
  updated_at: string;
};

function toTelegramResourcePost(row: TelegramResourcePostRow): TelegramResourcePost {
  const metadata = parseJson<Record<string, unknown>>(row.metadata_json);
  return {
    id: row.id,
    projectId: row.project_id,
    resourceId: row.resource_id,
    ...(row.telegram_message_id ? { telegramMessageId: row.telegram_message_id } : {}),
    publicUrl: row.public_url,
    ...(row.posted_at ? { postedAt: row.posted_at } : {}),
    recordedAt: row.recorded_at,
    status: row.status as TelegramResourcePostStatus,
    moderationStatus: row.moderation_status as TelegramResourcePostModerationStatus,
    ...(row.notes ? { notes: row.notes } : {}),
    ...(metadata ? { metadata } : {}),
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function normalizeUsername(value?: string): string | undefined {
  const normalized = value?.trim().replace(/^@+/, "");
  return normalized || undefined;
}

function parseTelegramUrl(publicUrl: string): { username?: string; messageId?: string } {
  try {
    const url = new URL(publicUrl);
    const parts = url.pathname.split("/").filter(Boolean);
    const last = parts.at(-1);
    const messageId = last && /^\d+$/.test(last) ? last : undefined;
    const username = normalizeUsername(parts[0] && !/^\d+$/.test(parts[0]) ? parts[0] : undefined);
    return { username, messageId };
  } catch {
    return {};
  }
}

export function recordTelegramResourcePost(input: {
  projectId: string;
  resourceId?: string;
  telegramResourceId?: string;
  username?: string;
  publicUrl: string;
  telegramMessageId?: string;
  postedAt?: string;
  recordedAt?: string;
  status?: TelegramResourcePostStatus;
  moderationStatus?: TelegramResourcePostModerationStatus;
  notes?: string;
  metadata?: Record<string, unknown>;
}): TelegramResourcePost {
  const conn = db();
  const parsedUrl = parseTelegramUrl(input.publicUrl);
  const username = normalizeUsername(input.username) ?? parsedUrl.username;
  let resource: { id: string } | undefined;

  if (input.resourceId) {
    resource = conn.prepare(
      "SELECT id FROM tg_resources WHERE project_id = ? AND id = ?",
    ).get(input.projectId, input.resourceId) as { id: string } | undefined;
  } else if (input.telegramResourceId) {
    resource = conn.prepare(
      "SELECT id FROM tg_resources WHERE project_id = ? AND telegram_resource_id = ?",
    ).get(input.projectId, input.telegramResourceId) as { id: string } | undefined;
  } else if (username) {
    resource = conn.prepare(
      "SELECT id FROM tg_resources WHERE project_id = ? AND lower(username) = lower(?)",
    ).get(input.projectId, username) as { id: string } | undefined;
  }

  if (!resource) {
    throw new Error(`Telegram resource not found for project ${input.projectId}; provide resource_id or telegram_resource_id`);
  }

  const now = new Date().toISOString();
  const recordedAt = input.recordedAt ?? now;
  const telegramMessageId = input.telegramMessageId ?? parsedUrl.messageId;
  conn.prepare(
    `INSERT INTO tg_resource_posts (
       id, project_id, resource_id, telegram_message_id, public_url, posted_at,
       recorded_at, status, moderation_status, notes, metadata_json, created_at, updated_at
     ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
     ON CONFLICT(project_id, public_url) DO UPDATE SET
       resource_id = excluded.resource_id,
       telegram_message_id = excluded.telegram_message_id,
       posted_at = excluded.posted_at,
       recorded_at = excluded.recorded_at,
       status = excluded.status,
       moderation_status = excluded.moderation_status,
       notes = excluded.notes,
       metadata_json = excluded.metadata_json,
       updated_at = excluded.updated_at`,
  ).run(
    randomUUID(),
    input.projectId,
    resource.id,
    telegramMessageId ?? null,
    input.publicUrl.trim(),
    input.postedAt ?? null,
    recordedAt,
    input.status ?? "posted",
    input.moderationStatus ?? "unknown",
    input.notes?.trim() || null,
    jsonOrNull(input.metadata),
    now,
    now,
  );

  conn.prepare(
    `UPDATE tg_resources
     SET has_posted = 1,
         post_count = (SELECT COUNT(*) FROM tg_resource_posts WHERE resource_id = ?),
         last_post_recorded_at = ?,
         last_post_url = ?,
         updated_at = ?
     WHERE id = ?`,
  ).run(resource.id, recordedAt, input.publicUrl.trim(), now, resource.id);

  const row = conn.prepare(
    "SELECT * FROM tg_resource_posts WHERE project_id = ? AND public_url = ?",
  ).get(input.projectId, input.publicUrl.trim()) as TelegramResourcePostRow;
  return toTelegramResourcePost(row);
}

export function listTelegramResourcePosts(filters?: {
  projectId?: string;
  resourceId?: string;
  status?: TelegramResourcePostStatus;
  limit?: number;
}): TelegramResourcePost[] {
  const conditions: string[] = [];
  const params: (string | number)[] = [];
  if (filters?.projectId) {
    conditions.push("project_id = ?");
    params.push(filters.projectId);
  }
  if (filters?.resourceId) {
    conditions.push("resource_id = ?");
    params.push(filters.resourceId);
  }
  if (filters?.status) {
    conditions.push("status = ?");
    params.push(filters.status);
  }
  const limit = Math.max(1, Math.min(filters?.limit ?? 200, 500));
  params.push(limit);
  const where = conditions.length ? `WHERE ${conditions.join(" AND ")}` : "";
  const rows = conn().prepare(
    `SELECT * FROM tg_resource_posts ${where}
     ORDER BY recorded_at DESC, public_url ASC
     LIMIT ?`,
  ).all(...params) as unknown as TelegramResourcePostRow[];
  return rows.map(toTelegramResourcePost);
}

function conn() {
  return db();
}
