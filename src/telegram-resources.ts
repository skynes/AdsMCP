import { randomUUID } from "node:crypto";
import { db, jsonOrNull, parseJson } from "./db.js";

export type TelegramResourceType = "chat" | "channel";
export type TelegramResourceStatus = "candidate" | "reviewed" | "ignored" | "archived";
export type TelegramResourceMembershipStatus = "unknown" | "joined" | "left" | "join_requested" | "blocked";
export type TelegramResourceRulesStatus = "unknown" | "unchecked" | "allowed" | "restricted" | "forbidden";

export type TelegramResource = {
  id: string;
  projectId: string;
  telegramResourceId: string;
  type: TelegramResourceType;
  title: string;
  username?: string;
  publicUrl?: string;
  source: string;
  status: TelegramResourceStatus;
  membershipStatus: TelegramResourceMembershipStatus;
  rulesStatus: TelegramResourceRulesStatus;
  topics?: string[];
  notes?: string;
  metadata?: Record<string, unknown>;
  firstSeenAt: string;
  lastCheckedAt?: string;
  joinedAt?: string;
  leftAt?: string;
  hasPosted: boolean;
  postCount: number;
  lastPostRecordedAt?: string;
  lastPostUrl?: string;
  createdAt: string;
  updatedAt: string;
};

type TelegramResourceRow = {
  id: string;
  project_id: string;
  telegram_resource_id: string;
  type: string;
  title: string;
  username: string | null;
  public_url: string | null;
  source: string;
  status: string;
  membership_status: string;
  rules_status: string;
  topics_json: string | null;
  notes: string | null;
  metadata_json: string | null;
  first_seen_at: string;
  last_checked_at: string | null;
  joined_at: string | null;
  left_at: string | null;
  has_posted: number;
  post_count: number;
  last_post_recorded_at: string | null;
  last_post_url: string | null;
  created_at: string;
  updated_at: string;
};

function toTelegramResource(row: TelegramResourceRow): TelegramResource {
  const topics = parseJson<string[]>(row.topics_json);
  const metadata = parseJson<Record<string, unknown>>(row.metadata_json);
  return {
    id: row.id,
    projectId: row.project_id,
    telegramResourceId: row.telegram_resource_id,
    type: row.type as TelegramResourceType,
    title: row.title,
    ...(row.username ? { username: row.username } : {}),
    ...(row.public_url ? { publicUrl: row.public_url } : {}),
    source: row.source,
    status: row.status as TelegramResourceStatus,
    membershipStatus: row.membership_status as TelegramResourceMembershipStatus,
    rulesStatus: row.rules_status as TelegramResourceRulesStatus,
    ...(topics ? { topics } : {}),
    ...(row.notes ? { notes: row.notes } : {}),
    ...(metadata ? { metadata } : {}),
    firstSeenAt: row.first_seen_at,
    ...(row.last_checked_at ? { lastCheckedAt: row.last_checked_at } : {}),
    ...(row.joined_at ? { joinedAt: row.joined_at } : {}),
    ...(row.left_at ? { leftAt: row.left_at } : {}),
    hasPosted: row.has_posted === 1,
    postCount: row.post_count,
    ...(row.last_post_recorded_at ? { lastPostRecordedAt: row.last_post_recorded_at } : {}),
    ...(row.last_post_url ? { lastPostUrl: row.last_post_url } : {}),
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export function upsertTelegramResource(input: {
  projectId: string;
  telegramResourceId: string;
  type: TelegramResourceType;
  title: string;
  username?: string;
  publicUrl?: string;
  source?: string;
  status?: TelegramResourceStatus;
  membershipStatus?: TelegramResourceMembershipStatus;
  rulesStatus?: TelegramResourceRulesStatus;
  topics?: string[];
  notes?: string;
  metadata?: Record<string, unknown>;
  firstSeenAt?: string;
  lastCheckedAt?: string;
  joinedAt?: string;
  leftAt?: string;
}): TelegramResource {
  const conn = db();
  const project = conn.prepare("SELECT id FROM projects WHERE id = ?").get(input.projectId) as { id: string } | undefined;
  if (!project) throw new Error(`Project not found: ${input.projectId}`);

  const now = new Date().toISOString();
  const firstSeenAt = input.firstSeenAt ?? now;
  conn.prepare(
    `INSERT INTO tg_resources (
       id, project_id, telegram_resource_id, type, title, username, public_url,
       source, status, membership_status, rules_status, topics_json, notes,
       metadata_json, first_seen_at, last_checked_at, joined_at, left_at,
       created_at, updated_at
     ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
     ON CONFLICT(project_id, telegram_resource_id) DO UPDATE SET
       type = excluded.type,
       title = excluded.title,
       username = excluded.username,
       public_url = excluded.public_url,
       source = excluded.source,
       status = excluded.status,
       membership_status = excluded.membership_status,
       rules_status = excluded.rules_status,
       topics_json = excluded.topics_json,
       notes = excluded.notes,
       metadata_json = excluded.metadata_json,
       last_checked_at = excluded.last_checked_at,
       joined_at = excluded.joined_at,
       left_at = excluded.left_at,
       updated_at = excluded.updated_at`,
  ).run(
    randomUUID(),
    input.projectId,
    input.telegramResourceId.trim(),
    input.type,
    input.title.trim(),
    input.username?.trim().replace(/^@+/, "") || null,
    input.publicUrl?.trim() || null,
    input.source?.trim() || "manual",
    input.status ?? "candidate",
    input.membershipStatus ?? "unknown",
    input.rulesStatus ?? "unknown",
    jsonOrNull(input.topics),
    input.notes?.trim() || null,
    jsonOrNull(input.metadata),
    firstSeenAt,
    input.lastCheckedAt ?? null,
    input.joinedAt ?? null,
    input.leftAt ?? null,
    now,
    now,
  );

  const row = conn.prepare(
    "SELECT * FROM tg_resources WHERE project_id = ? AND telegram_resource_id = ?",
  ).get(input.projectId, input.telegramResourceId) as TelegramResourceRow;
  return toTelegramResource(row);
}

export function getTelegramResource(id: string): TelegramResource | undefined {
  const row = db().prepare("SELECT * FROM tg_resources WHERE id = ?").get(id) as TelegramResourceRow | undefined;
  return row ? toTelegramResource(row) : undefined;
}

export function listTelegramResources(filters?: {
  projectId?: string;
  type?: TelegramResourceType;
  status?: TelegramResourceStatus;
  membershipStatus?: TelegramResourceMembershipStatus;
  rulesStatus?: TelegramResourceRulesStatus;
  limit?: number;
}): TelegramResource[] {
  const conditions: string[] = [];
  const params: (string | number)[] = [];
  if (filters?.projectId) {
    conditions.push("project_id = ?");
    params.push(filters.projectId);
  }
  if (filters?.type) {
    conditions.push("type = ?");
    params.push(filters.type);
  }
  if (filters?.status) {
    conditions.push("status = ?");
    params.push(filters.status);
  }
  if (filters?.membershipStatus) {
    conditions.push("membership_status = ?");
    params.push(filters.membershipStatus);
  }
  if (filters?.rulesStatus) {
    conditions.push("rules_status = ?");
    params.push(filters.rulesStatus);
  }
  const limit = Math.max(1, Math.min(filters?.limit ?? 200, 500));
  params.push(limit);
  const where = conditions.length ? `WHERE ${conditions.join(" AND ")}` : "";
  const rows = db().prepare(
    `SELECT * FROM tg_resources ${where}
     ORDER BY updated_at DESC, title COLLATE NOCASE ASC
     LIMIT ?`,
  ).all(...params) as unknown as TelegramResourceRow[];
  return rows.map(toTelegramResource);
}
