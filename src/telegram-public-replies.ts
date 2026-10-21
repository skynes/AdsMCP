import { randomUUID } from "node:crypto";
import { db, jsonOrNull, parseJson } from "./db.js";
import { getGramjsClient } from "./telegram/gramjs.js";

export type TelegramPublicReplyRelation = "reply" | "mention";
export type TelegramPublicReplyStatus = "pending" | "replied" | "no_reply" | "ignored" | "blocked";

export type TelegramPublicReply = {
  id: string;
  projectId: string;
  telegramChatId: string;
  chatUsername?: string;
  chatTitle?: string;
  telegramMessageId: string;
  publicUrl: string;
  relationType: TelegramPublicReplyRelation;
  parentMessageId?: string;
  parentPublicUrl?: string;
  authorTelegramId?: string;
  authorUsername?: string;
  authorDisplayName?: string;
  text: string;
  postedAt?: string;
  status: TelegramPublicReplyStatus;
  decisionNote?: string;
  ourReplyMessageId?: string;
  ourReplyUrl?: string;
  reviewedAt?: string;
  firstSeenAt: string;
  lastSeenAt: string;
  metadata?: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
};

type TelegramPublicReplyRow = {
  id: string;
  project_id: string;
  telegram_chat_id: string;
  chat_username: string | null;
  chat_title: string | null;
  telegram_message_id: string;
  public_url: string;
  relation_type: string;
  parent_message_id: string | null;
  parent_public_url: string | null;
  author_telegram_id: string | null;
  author_username: string | null;
  author_display_name: string | null;
  text: string;
  posted_at: string | null;
  status: string;
  decision_note: string | null;
  our_reply_message_id: string | null;
  our_reply_url: string | null;
  reviewed_at: string | null;
  first_seen_at: string;
  last_seen_at: string;
  metadata_json: string | null;
  created_at: string;
  updated_at: string;
};

function clean(value?: string | null): string | undefined {
  const result = value?.trim();
  return result || undefined;
}

function toPublicReply(row: TelegramPublicReplyRow): TelegramPublicReply {
  const metadata = parseJson<Record<string, unknown>>(row.metadata_json);
  return {
    id: row.id,
    projectId: row.project_id,
    telegramChatId: row.telegram_chat_id,
    ...(clean(row.chat_username) ? { chatUsername: clean(row.chat_username) } : {}),
    ...(clean(row.chat_title) ? { chatTitle: clean(row.chat_title) } : {}),
    telegramMessageId: row.telegram_message_id,
    publicUrl: row.public_url,
    relationType: row.relation_type as TelegramPublicReplyRelation,
    ...(clean(row.parent_message_id) ? { parentMessageId: clean(row.parent_message_id) } : {}),
    ...(clean(row.parent_public_url) ? { parentPublicUrl: clean(row.parent_public_url) } : {}),
    ...(clean(row.author_telegram_id) ? { authorTelegramId: clean(row.author_telegram_id) } : {}),
    ...(clean(row.author_username) ? { authorUsername: clean(row.author_username) } : {}),
    ...(clean(row.author_display_name) ? { authorDisplayName: clean(row.author_display_name) } : {}),
    text: row.text,
    ...(clean(row.posted_at) ? { postedAt: clean(row.posted_at) } : {}),
    status: row.status as TelegramPublicReplyStatus,
    ...(clean(row.decision_note) ? { decisionNote: clean(row.decision_note) } : {}),
    ...(clean(row.our_reply_message_id) ? { ourReplyMessageId: clean(row.our_reply_message_id) } : {}),
    ...(clean(row.our_reply_url) ? { ourReplyUrl: clean(row.our_reply_url) } : {}),
    ...(clean(row.reviewed_at) ? { reviewedAt: clean(row.reviewed_at) } : {}),
    firstSeenAt: row.first_seen_at,
    lastSeenAt: row.last_seen_at,
    ...(metadata ? { metadata } : {}),
    createdAt: row.created_at,
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
  ).run(projectId, projectId === "neron" ? "Neron" : projectId, "Telegram public reply audit", jsonOrNull({ source: "telegram_public_replies" }), now, now);
}

export function upsertTelegramPublicReply(input: {
  projectId?: string;
  telegramChatId: string;
  chatUsername?: string;
  chatTitle?: string;
  telegramMessageId: string;
  publicUrl: string;
  relationType?: TelegramPublicReplyRelation;
  parentMessageId?: string;
  parentPublicUrl?: string;
  authorTelegramId?: string;
  authorUsername?: string;
  authorDisplayName?: string;
  text: string;
  postedAt?: string;
  status?: TelegramPublicReplyStatus;
  decisionNote?: string;
  ourReplyMessageId?: string;
  ourReplyUrl?: string;
  reviewedAt?: string;
  firstSeenAt?: string;
  metadata?: Record<string, unknown>;
}): TelegramPublicReply {
  const projectId = clean(input.projectId) || "neron";
  const chatId = input.telegramChatId.trim();
  const messageId = input.telegramMessageId.trim();
  const text = input.text.trim();
  if (!chatId || !messageId || !text) throw new Error("telegram_chat_id, telegram_message_id and text are required");
  if (!input.publicUrl.trim()) throw new Error("public_url is required");
  ensureProject(projectId);
  const conn = db();
  const now = new Date().toISOString();
  const firstSeenAt = input.firstSeenAt?.trim() || now;
  conn.prepare(
    `INSERT INTO telegram_public_replies (
       id, project_id, telegram_chat_id, chat_username, chat_title, telegram_message_id,
       public_url, relation_type, parent_message_id, parent_public_url,
       author_telegram_id, author_username, author_display_name, text, posted_at,
       status, decision_note, our_reply_message_id, our_reply_url, reviewed_at,
       first_seen_at, last_seen_at, metadata_json, created_at, updated_at
     ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
     ON CONFLICT(project_id, telegram_chat_id, telegram_message_id) DO UPDATE SET
       chat_username = excluded.chat_username,
       chat_title = excluded.chat_title,
       public_url = excluded.public_url,
       relation_type = excluded.relation_type,
       parent_message_id = excluded.parent_message_id,
       parent_public_url = excluded.parent_public_url,
       author_telegram_id = excluded.author_telegram_id,
       author_username = excluded.author_username,
       author_display_name = excluded.author_display_name,
       text = excluded.text,
       posted_at = excluded.posted_at,
       metadata_json = excluded.metadata_json,
       last_seen_at = excluded.last_seen_at,
       updated_at = excluded.updated_at`,
  ).run(
    randomUUID(), projectId, chatId, clean(input.chatUsername) || null, clean(input.chatTitle) || null,
    messageId, input.publicUrl.trim(), input.relationType || "reply", clean(input.parentMessageId) || null,
    clean(input.parentPublicUrl) || null, clean(input.authorTelegramId) || null, clean(input.authorUsername) || null,
    clean(input.authorDisplayName) || null, text, clean(input.postedAt) || null, input.status || "pending",
    clean(input.decisionNote) || null, clean(input.ourReplyMessageId) || null, clean(input.ourReplyUrl) || null,
    clean(input.reviewedAt) || null, firstSeenAt, now, jsonOrNull(input.metadata), now, now,
  );
  const row = conn.prepare(
    "SELECT * FROM telegram_public_replies WHERE project_id = ? AND telegram_chat_id = ? AND telegram_message_id = ?",
  ).get(projectId, chatId, messageId) as TelegramPublicReplyRow;
  return toPublicReply(row);
}

export function listTelegramPublicReplies(filters?: {
  projectId?: string;
  status?: TelegramPublicReplyStatus;
  telegramChatId?: string;
  limit?: number;
}): TelegramPublicReply[] {
  const conditions = ["project_id = ?"];
  const params: Array<string | number> = [clean(filters?.projectId) || "neron"];
  if (filters?.status) {
    conditions.push("status = ?");
    params.push(filters.status);
  }
  if (filters?.telegramChatId) {
    conditions.push("telegram_chat_id = ?");
    params.push(filters.telegramChatId.trim());
  }
  const limit = Math.max(1, Math.min(filters?.limit ?? 200, 500));
  params.push(limit);
  const rows = db().prepare(
    `SELECT * FROM telegram_public_replies WHERE ${conditions.join(" AND ")}
     ORDER BY CASE status WHEN 'pending' THEN 0 ELSE 1 END, posted_at DESC, updated_at DESC LIMIT ?`,
  ).all(...params) as unknown as TelegramPublicReplyRow[];
  return rows.map(toPublicReply);
}

export function updateTelegramPublicReplyStatus(input: {
  id: string;
  status: TelegramPublicReplyStatus;
  decisionNote?: string;
  ourReplyMessageId?: string;
  ourReplyUrl?: string;
}): TelegramPublicReply | undefined {
  const conn = db();
  const now = new Date().toISOString();
  conn.prepare(
    `UPDATE telegram_public_replies
     SET status = ?, decision_note = COALESCE(?, decision_note),
         our_reply_message_id = COALESCE(?, our_reply_message_id),
         our_reply_url = COALESCE(?, our_reply_url),
         reviewed_at = ?, updated_at = ?
     WHERE id = ?`,
  ).run(
    input.status,
    clean(input.decisionNote) || null,
    clean(input.ourReplyMessageId) || null,
    clean(input.ourReplyUrl) || null,
    now,
    now,
    input.id.trim(),
  );
  const row = conn.prepare("SELECT * FROM telegram_public_replies WHERE id = ?").get(input.id.trim()) as TelegramPublicReplyRow | undefined;
  return row ? toPublicReply(row) : undefined;
}

function messageDate(message: { date?: Date | number }): string | undefined {
  if (!message?.date) return undefined;
  const date = message.date instanceof Date ? message.date : new Date(Number(message.date) * 1000);
  return Number.isNaN(date.getTime()) ? undefined : date.toISOString();
}

function senderName(sender: { firstName?: string; lastName?: string; title?: string } | undefined): string | undefined {
  const value = [sender?.firstName, sender?.lastName, sender?.title]
    .map((part) => String(part || "").trim())
    .filter(Boolean)
    .join(" ");
  return value || undefined;
}

/**
 * Read-only scan of recent messages in selected public chats. It stores direct
 * replies to our messages and a small bounded context window after each of our
 * outgoing messages, because people sometimes answer without selecting
 * Telegram's reply action.
 */
export async function syncTelegramPublicReplies(input?: {
  projectId?: string;
  chatRefs?: string[];
  limitPerChat?: number;
  contextMessagesAfter?: number;
}): Promise<{
  projectId: string;
  checkedChats: string[];
  imported: number;
  contextImported: number;
  skipped: number;
  errors: Array<{ chat: string; error: string }>;
}> {
  const projectId = clean(input?.projectId) || "neron";
  ensureProject(projectId);
  const limit = Math.max(20, Math.min(Number(input?.limitPerChat) || 500, 2000));
  const contextMessagesAfter = Math.max(1, Math.min(Number(input?.contextMessagesAfter) || 2, 5));
  const refs = (input?.chatRefs || []).map((ref) => ref.trim()).filter(Boolean);
  const discovered = refs.length
    ? refs
    : (db().prepare(
        `SELECT username FROM tg_resources
         WHERE project_id = ? AND membership_status = 'joined' AND username IS NOT NULL
         ORDER BY updated_at DESC LIMIT 200`,
      ).all(projectId) as Array<{ username?: string }>).map((row) => String(row.username || "").trim()).filter(Boolean);
  const uniqueRefs = Array.from(new Set(discovered));
  const client = await getGramjsClient();
  const me = await client.getMe();
  if (!(me?.premium === true || me?.isPremium === true)) {
    throw new Error("Telegram Premium is required for public reply synchronization");
  }

  const imported: TelegramPublicReply[] = [];
  const errors: Array<{ chat: string; error: string }> = [];
  let skipped = 0;
  let contextImported = 0;
  for (const ref of uniqueRefs) {
    try {
      const entity = await client.getEntity(ref);
      const chatId = String(entity?.id || ref);
      const chatUsername = clean(entity?.username);
      const chatTitle = clean(entity?.title || senderName(entity));
      const parentCache = new Map<string, Record<string, any> | null>();
      const messages: Array<Record<string, any>> = [];
      for await (const message of client.iterMessages(entity, { limit })) {
        messages.push(message as Record<string, any>);
      }
      const chronological = messages.sort((a, b) => Number(a?.id || 0) - Number(b?.id || 0));
      const messageById = new Map<string, Record<string, any>>(
        chronological
          .map((message) => [String(message?.id || "").trim(), message] as const)
          .filter(([messageId]) => Boolean(messageId)),
      );
      const recordedMessageIds = new Set<string>();

      const recordInbound = async (
        message: Record<string, any>,
        parentId: string,
        detection: "direct_reply" | "context_after_outgoing",
        contextDistance?: number,
      ): Promise<boolean> => {
        const messageId = String(message?.id || "").trim();
        const text = String(message?.message || "").trim();
        if (!messageId || !parentId || !text || message?.out === true || recordedMessageIds.has(messageId)) return false;
        let parent: Record<string, any> | null;
        if (!parentCache.has(parentId)) {
          const cachedParent = messageById.get(parentId);
          const parentMessages = cachedParent
            ? [cachedParent]
            : await client.getMessages(entity, { ids: [Number(parentId)] });
          parentCache.set(parentId, parentMessages?.[0] || null);
        }
        parent = parentCache.get(parentId) ?? null;
        if (!parent?.out) return false;
        let sender: Record<string, any> | undefined = message?.sender;
        if (!sender && typeof message?.getSender === "function") {
          try {
            sender = await message.getSender();
          } catch {
            sender = undefined;
          }
        }
        const publicUrl = chatUsername
          ? `https://t.me/${chatUsername.replace(/^@+/, "")}/${messageId}`
          : `telegram://${chatId}/message/${messageId}`;
        const parentPublicUrl = chatUsername
          ? `https://t.me/${chatUsername.replace(/^@+/, "")}/${parentId}`
          : `telegram://${chatId}/message/${parentId}`;
        imported.push(upsertTelegramPublicReply({
          projectId,
          telegramChatId: chatId,
          chatUsername,
          chatTitle,
          telegramMessageId: messageId,
          publicUrl,
          relationType: "reply",
          parentMessageId: parentId,
          parentPublicUrl,
          authorTelegramId: String(sender?.id || message?.senderId || "").trim() || undefined,
          authorUsername: clean(sender?.username),
          authorDisplayName: senderName(sender),
          text,
          postedAt: messageDate(message),
          metadata: {
            source: "telegram_public_reply_sync",
            detection,
            ...(detection === "context_after_outgoing"
              ? { directReply: false, contextDistance: contextDistance || 0 }
              : { directReply: true }),
            ...(sender?.bot === true ? { isBot: true } : {}),
          },
        }));
        recordedMessageIds.add(messageId);
        if (detection === "context_after_outgoing") contextImported += 1;
        return true;
      };

      for (const message of chronological) {
        if (message?.out === true) continue;
        const parentId = String(message?.replyTo?.replyToMsgId || "").trim();
        if (!parentId) {
          skipped += 1;
          continue;
        }
        await recordInbound(message, parentId, "direct_reply");
      }

      const outgoing = chronological.filter(
        (message) => message?.out === true && String(message?.message || "").trim(),
      );
      for (const outgoingMessage of outgoing) {
        const outgoingId = String(outgoingMessage?.id || "").trim();
        const outgoingIndex = chronological.indexOf(outgoingMessage);
        if (!outgoingId || outgoingIndex < 0) continue;
        let observedAfter = 0;
        for (let index = outgoingIndex + 1; index < chronological.length && observedAfter < contextMessagesAfter; index += 1) {
          const candidate = chronological[index];
          if (candidate?.out === true) break;
          observedAfter += 1;
          if (candidate?.replyTo?.replyToMsgId) continue;
          await recordInbound(candidate, outgoingId, "context_after_outgoing", observedAfter);
        }
      }
    } catch (error) {
      errors.push({ chat: ref, error: error instanceof Error ? error.message : String(error) });
    }
  }
  return {
    projectId,
    checkedChats: uniqueRefs,
    imported: imported.length,
    contextImported,
    skipped,
    errors,
  };
}
