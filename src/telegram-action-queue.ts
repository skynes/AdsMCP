import { randomUUID } from "node:crypto";
import { db, jsonOrNull, parseJson } from "./db.js";

export type TelegramQueueActionType = "send_message" | "chat_reply" | "public_post_reply" | "reaction";
export type TelegramQueueActionStatus = "queued" | "running" | "sent" | "failed" | "cancelled";

export type TelegramQueueActionInput = {
  type: TelegramQueueActionType;
  target: string;
  messageId?: number;
  text?: string;
  reaction?: string;
  expectedText?: string;
};

export type TelegramQueueAction = TelegramQueueActionInput & {
  id: string;
  queueId: string;
  projectId: string;
  sequenceNo: number;
  minDelaySeconds: number;
  status: TelegramQueueActionStatus;
  attempts: number;
  result?: unknown;
  error?: string;
  createdAt: string;
  startedAt?: string;
  completedAt?: string;
  updatedAt: string;
};

type QueueRow = {
  id: string;
  queue_id: string;
  project_id: string;
  sequence_no: number;
  action_type: TelegramQueueActionType;
  target_ref: string;
  target_message_id: number | null;
  text: string | null;
  reaction: string | null;
  expected_text: string | null;
  min_delay_seconds: number;
  status: TelegramQueueActionStatus;
  attempts: number;
  result_json: string | null;
  error_text: string | null;
  created_at: string;
  started_at: string | null;
  completed_at: string | null;
  updated_at: string;
};

function clean(value?: string | null): string | undefined {
  const result = value?.trim();
  return result || undefined;
}

function toAction(row: QueueRow): TelegramQueueAction {
  const text = clean(row.text);
  const reaction = clean(row.reaction);
  const expectedText = clean(row.expected_text);
  const error = clean(row.error_text);
  const startedAt = clean(row.started_at);
  const completedAt = clean(row.completed_at);
  return {
    id: row.id,
    queueId: row.queue_id,
    projectId: row.project_id,
    sequenceNo: row.sequence_no,
    type: row.action_type,
    target: row.target_ref,
    ...(row.target_message_id === null ? {} : { messageId: row.target_message_id }),
    ...(text ? { text } : {}),
    ...(reaction ? { reaction } : {}),
    ...(expectedText ? { expectedText } : {}),
    minDelaySeconds: row.min_delay_seconds,
    status: row.status,
    attempts: row.attempts,
    ...(row.result_json ? { result: parseJson<unknown>(row.result_json) } : {}),
    ...(error ? { error } : {}),
    createdAt: row.created_at,
    ...(startedAt ? { startedAt } : {}),
    ...(completedAt ? { completedAt } : {}),
    updatedAt: row.updated_at,
  };
}

function ensureProject(projectId: string): void {
  const conn = db();
  const found = conn.prepare("SELECT id FROM projects WHERE id = ?").get(projectId) as { id?: string } | undefined;
  if (found?.id) return;
  const now = new Date().toISOString();
  conn.prepare(
    `INSERT INTO projects (id, name, description, status, metadata_json, created_at, updated_at)
     VALUES (?, ?, ?, 'active', ?, ?, ?)`,
  ).run(projectId, projectId === "neron" ? "Neron" : projectId, "Telegram action queue", jsonOrNull({ source: "telegram_action_queue" }), now, now);
}

function validateAction(action: TelegramQueueActionInput): void {
  if (!action.target.trim()) throw new Error("Every Telegram queue action needs a target");
  if (action.type === "send_message" && !action.text?.trim()) throw new Error("send_message requires text");
  if (action.type === "chat_reply" && (!Number.isInteger(action.messageId) || Number(action.messageId) <= 0 || !action.text?.trim())) {
    throw new Error("chat_reply requires a positive messageId and text");
  }
  if (action.type === "public_post_reply" && (!Number.isInteger(action.messageId) || Number(action.messageId) <= 0 || !action.text?.trim())) {
    throw new Error("public_post_reply requires a positive messageId and text");
  }
  if (action.type === "reaction" && (!Number.isInteger(action.messageId) || Number(action.messageId) <= 0 || !action.reaction?.trim())) {
    throw new Error("reaction requires a positive messageId and reaction");
  }
}

function randomDelaySeconds(min: number, max: number): number {
  return min + Math.floor(Math.random() * (max - min + 1));
}

export function enqueueTelegramActions(input: {
  projectId?: string;
  minDelaySeconds?: number;
  maxDelaySeconds?: number;
  actions: TelegramQueueActionInput[];
}): { queueId: string; projectId: string; minDelaySeconds: number; maxDelaySeconds: number; actions: TelegramQueueAction[] } {
  const projectId = clean(input.projectId) || "neron";
  const actions = input.actions || [];
  if (actions.length < 1 || actions.length > 50) throw new Error("A Telegram action queue must contain 1 to 50 actions");
  const minDelaySeconds = Math.floor(input.minDelaySeconds ?? 15);
  if (!Number.isFinite(minDelaySeconds) || minDelaySeconds < 15 || minDelaySeconds > 300) {
    throw new Error("minDelaySeconds must be between 15 and 300");
  }
  const maxDelaySeconds = Math.floor(input.maxDelaySeconds ?? Math.max(66, minDelaySeconds));
  if (!Number.isFinite(maxDelaySeconds) || maxDelaySeconds < minDelaySeconds || maxDelaySeconds > 300) {
    throw new Error("maxDelaySeconds must be between minDelaySeconds and 300");
  }
  actions.forEach(validateAction);
  ensureProject(projectId);
  const queueId = randomUUID();
  const now = new Date().toISOString();
  const conn = db();
  const insert = conn.prepare(
    `INSERT INTO telegram_action_queue
       (id, queue_id, project_id, sequence_no, action_type, target_ref, target_message_id,
        text, reaction, expected_text, min_delay_seconds, status, attempts,
        result_json, error_text, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'queued', 0, NULL, NULL, ?, ?)`,
  );
  actions.forEach((action, index) => insert.run(
    randomUUID(), queueId, projectId, index, action.type, action.target.trim(),
    action.messageId ?? null, clean(action.text) || null, clean(action.reaction) || null,
    // Each action gets its own random pause before it runs, fixed at enqueue time.
    clean(action.expectedText) || null, randomDelaySeconds(minDelaySeconds, maxDelaySeconds), now, now,
  ));
  return { queueId, projectId, minDelaySeconds, maxDelaySeconds, actions: listTelegramActions(queueId) };
}

export function listTelegramActions(queueId: string, status?: TelegramQueueActionStatus): TelegramQueueAction[] {
  const params: Array<string | number> = [queueId.trim()];
  const statusClause = status ? " AND status = ?" : "";
  if (status) params.push(status);
  return (db().prepare(
    `SELECT * FROM telegram_action_queue WHERE queue_id = ?${statusClause} ORDER BY sequence_no ASC`,
  ).all(...params) as unknown as QueueRow[]).map(toAction);
}

export function getNextTelegramAction(queueId: string): TelegramQueueAction | undefined {
  const row = db().prepare(
    `SELECT * FROM telegram_action_queue
     WHERE queue_id = ? AND status = 'queued'
     ORDER BY sequence_no ASC LIMIT 1`,
  ).get(queueId.trim()) as QueueRow | undefined;
  return row ? toAction(row) : undefined;
}

export function getLastSentTelegramAction(queueId: string): TelegramQueueAction | undefined {
  const row = db().prepare(
    `SELECT * FROM telegram_action_queue
     WHERE queue_id = ? AND status = 'sent'
     ORDER BY sequence_no DESC LIMIT 1`,
  ).get(queueId.trim()) as QueueRow | undefined;
  return row ? toAction(row) : undefined;
}

export function markTelegramActionRunning(id: string): TelegramQueueAction | undefined {
  const now = new Date().toISOString();
  db().prepare(
    `UPDATE telegram_action_queue
     SET status = 'running', attempts = attempts + 1, started_at = ?, updated_at = ?
     WHERE id = ? AND status = 'queued'`,
  ).run(now, now, id.trim());
  const row = db().prepare("SELECT * FROM telegram_action_queue WHERE id = ?").get(id.trim()) as QueueRow | undefined;
  return row ? toAction(row) : undefined;
}

export function markTelegramActionSent(id: string, result: unknown): TelegramQueueAction | undefined {
  const now = new Date().toISOString();
  db().prepare(
    `UPDATE telegram_action_queue
     SET status = 'sent', result_json = ?, error_text = NULL, completed_at = ?, updated_at = ?
     WHERE id = ? AND status = 'running'`,
  ).run(jsonOrNull(result), now, now, id.trim());
  const row = db().prepare("SELECT * FROM telegram_action_queue WHERE id = ?").get(id.trim()) as QueueRow | undefined;
  return row ? toAction(row) : undefined;
}

export function markTelegramActionFailed(id: string, error: string): TelegramQueueAction | undefined {
  const now = new Date().toISOString();
  db().prepare(
    `UPDATE telegram_action_queue
     SET status = 'failed', error_text = ?, completed_at = ?, updated_at = ?
     WHERE id = ? AND status = 'running'`,
  ).run(error.trim().slice(0, 4000), now, now, id.trim());
  const row = db().prepare("SELECT * FROM telegram_action_queue WHERE id = ?").get(id.trim()) as QueueRow | undefined;
  return row ? toAction(row) : undefined;
}

export function cancelTelegramActionQueue(queueId: string): { queueId: string; cancelled: number; actions: TelegramQueueAction[] } {
  const now = new Date().toISOString();
  const result = db().prepare(
    `UPDATE telegram_action_queue SET status = 'cancelled', completed_at = ?, updated_at = ?
     WHERE queue_id = ? AND status = 'queued'`,
  ).run(now, now, queueId.trim());
  return { queueId: queueId.trim(), cancelled: Number(result.changes || 0), actions: listTelegramActions(queueId) };
}
