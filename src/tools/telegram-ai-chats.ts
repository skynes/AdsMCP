import {
  listTelegramAiChats,
  upsertTelegramAiChat,
} from "../telegram-ai-chats.js";
import type {
  TelegramAiChatStatus,
  TelegramAiChatTopicHit,
  TelegramAiChatType,
} from "../telegram-ai-chats.js";

export function runTelegramAiChatUpsert(args: {
  project_id: string;
  telegram_chat_id: string;
  title: string;
  username?: string;
  chat_type?: TelegramAiChatType;
  public_url?: string;
  status?: TelegramAiChatStatus;
  relevance_score?: number;
  discovery_queries?: string[];
  topic_hits?: TelegramAiChatTopicHit[];
  notes?: string;
  metadata?: Record<string, unknown>;
  first_seen_at?: string;
  last_scanned_at?: string;
}) {
  return {
    saved: true,
    chat: upsertTelegramAiChat({
      projectId: args.project_id,
      telegramChatId: args.telegram_chat_id,
      title: args.title,
      username: args.username,
      chatType: args.chat_type,
      publicUrl: args.public_url,
      status: args.status,
      relevanceScore: args.relevance_score,
      discoveryQueries: args.discovery_queries,
      topicHits: args.topic_hits,
      notes: args.notes,
      metadata: args.metadata,
      firstSeenAt: args.first_seen_at,
      lastScannedAt: args.last_scanned_at,
    }),
  };
}

export function runTelegramAiChatList(args: {
  project_id?: string;
  status?: TelegramAiChatStatus;
  chat_type?: TelegramAiChatType;
  limit?: number;
}) {
  return {
    chats: listTelegramAiChats({
      projectId: args.project_id,
      status: args.status,
      chatType: args.chat_type,
      limit: args.limit,
    }),
  };
}
