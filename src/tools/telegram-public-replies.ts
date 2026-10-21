import {
  listTelegramPublicReplies,
  syncTelegramPublicReplies,
  updateTelegramPublicReplyStatus,
  upsertTelegramPublicReply,
} from "../telegram-public-replies.js";
import type { TelegramPublicReplyStatus, TelegramPublicReplyRelation } from "../telegram-public-replies.js";

export function runTelegramPublicReplyUpsert(args: {
  project_id?: string;
  telegram_chat_id: string;
  chat_username?: string;
  chat_title?: string;
  telegram_message_id: string;
  public_url: string;
  relation_type?: TelegramPublicReplyRelation;
  parent_message_id?: string;
  parent_public_url?: string;
  author_telegram_id?: string;
  author_username?: string;
  author_display_name?: string;
  text: string;
  posted_at?: string;
  status?: TelegramPublicReplyStatus;
  decision_note?: string;
  our_reply_message_id?: string;
  our_reply_url?: string;
  reviewed_at?: string;
  first_seen_at?: string;
  metadata?: Record<string, unknown>;
}) {
  return {
    saved: true,
    reply: upsertTelegramPublicReply({
      projectId: args.project_id,
      telegramChatId: args.telegram_chat_id,
      chatUsername: args.chat_username,
      chatTitle: args.chat_title,
      telegramMessageId: args.telegram_message_id,
      publicUrl: args.public_url,
      relationType: args.relation_type,
      parentMessageId: args.parent_message_id,
      parentPublicUrl: args.parent_public_url,
      authorTelegramId: args.author_telegram_id,
      authorUsername: args.author_username,
      authorDisplayName: args.author_display_name,
      text: args.text,
      postedAt: args.posted_at,
      status: args.status,
      decisionNote: args.decision_note,
      ourReplyMessageId: args.our_reply_message_id,
      ourReplyUrl: args.our_reply_url,
      reviewedAt: args.reviewed_at,
      firstSeenAt: args.first_seen_at,
      metadata: args.metadata,
    }),
  };
}

export function runTelegramPublicReplyList(args: {
  project_id?: string;
  status?: TelegramPublicReplyStatus;
  telegram_chat_id?: string;
  limit?: number;
}) {
  return {
    replies: listTelegramPublicReplies({
      projectId: args.project_id,
      status: args.status,
      telegramChatId: args.telegram_chat_id,
      limit: args.limit,
    }),
  };
}

export function runTelegramPublicReplyStatusSet(args: {
  id: string;
  status: TelegramPublicReplyStatus;
  decision_note?: string;
  our_reply_message_id?: string;
  our_reply_url?: string;
}) {
  const reply = updateTelegramPublicReplyStatus({
    id: args.id,
    status: args.status,
    decisionNote: args.decision_note,
    ourReplyMessageId: args.our_reply_message_id,
    ourReplyUrl: args.our_reply_url,
  });
  return { updated: Boolean(reply), reply };
}

export async function runTelegramPublicReplySync(args: {
  project_id?: string;
  chat_refs?: string[];
  limit_per_chat?: number;
  context_messages_after?: number;
}) {
  return syncTelegramPublicReplies({
    projectId: args.project_id,
    chatRefs: args.chat_refs,
    limitPerChat: args.limit_per_chat,
    contextMessagesAfter: args.context_messages_after,
  });
}
