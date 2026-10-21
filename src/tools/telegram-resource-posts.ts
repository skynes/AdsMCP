import {
  listTelegramResourcePosts,
  recordTelegramResourcePost,
} from "../telegram-resource-posts.js";
import type {
  TelegramResourcePostModerationStatus,
  TelegramResourcePostStatus,
} from "../telegram-resource-posts.js";

export function runTelegramResourcePostRecord(args: {
  project_id: string;
  resource_id?: string;
  telegram_resource_id?: string;
  username?: string;
  public_url: string;
  telegram_message_id?: string;
  posted_at?: string;
  recorded_at?: string;
  status?: TelegramResourcePostStatus;
  moderation_status?: TelegramResourcePostModerationStatus;
  notes?: string;
  metadata?: Record<string, unknown>;
}) {
  return {
    saved: true,
    post: recordTelegramResourcePost({
      projectId: args.project_id,
      resourceId: args.resource_id,
      telegramResourceId: args.telegram_resource_id,
      username: args.username,
      publicUrl: args.public_url,
      telegramMessageId: args.telegram_message_id,
      postedAt: args.posted_at,
      recordedAt: args.recorded_at,
      status: args.status,
      moderationStatus: args.moderation_status,
      notes: args.notes,
      metadata: args.metadata,
    }),
  };
}

export function runTelegramResourcePostList(args: {
  project_id?: string;
  resource_id?: string;
  status?: TelegramResourcePostStatus;
  limit?: number;
}) {
  return {
    posts: listTelegramResourcePosts({
      projectId: args.project_id,
      resourceId: args.resource_id,
      status: args.status,
      limit: args.limit,
    }),
  };
}
