import {
  listTelegramResources,
  upsertTelegramResource,
} from "../telegram-resources.js";
import type {
  TelegramResourceMembershipStatus,
  TelegramResourceRulesStatus,
  TelegramResourceStatus,
  TelegramResourceType,
} from "../telegram-resources.js";

export function runTelegramResourceUpsert(args: {
  project_id: string;
  telegram_resource_id: string;
  type: TelegramResourceType;
  title: string;
  username?: string;
  public_url?: string;
  source?: string;
  status?: TelegramResourceStatus;
  membership_status?: TelegramResourceMembershipStatus;
  rules_status?: TelegramResourceRulesStatus;
  topics?: string[];
  notes?: string;
  metadata?: Record<string, unknown>;
  first_seen_at?: string;
  last_checked_at?: string;
  joined_at?: string;
  left_at?: string;
}) {
  return {
    saved: true,
    resource: upsertTelegramResource({
      projectId: args.project_id,
      telegramResourceId: args.telegram_resource_id,
      type: args.type,
      title: args.title,
      username: args.username,
      publicUrl: args.public_url,
      source: args.source,
      status: args.status,
      membershipStatus: args.membership_status,
      rulesStatus: args.rules_status,
      topics: args.topics,
      notes: args.notes,
      metadata: args.metadata,
      firstSeenAt: args.first_seen_at,
      lastCheckedAt: args.last_checked_at,
      joinedAt: args.joined_at,
      leftAt: args.left_at,
    }),
  };
}

export function runTelegramResourceList(args: {
  project_id?: string;
  type?: TelegramResourceType;
  status?: TelegramResourceStatus;
  membership_status?: TelegramResourceMembershipStatus;
  rules_status?: TelegramResourceRulesStatus;
  limit?: number;
}) {
  return {
    resources: listTelegramResources({
      projectId: args.project_id,
      type: args.type,
      status: args.status,
      membershipStatus: args.membership_status,
      rulesStatus: args.rules_status,
      limit: args.limit,
    }),
  };
}
