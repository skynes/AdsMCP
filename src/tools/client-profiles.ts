import { randomUUID } from "node:crypto";
import {
  addClientProfileMessage,
  createClientProfile,
  getClientProfile,
  listClientProfileMessages,
  listClientProfiles,
  updateClientProfile,
} from "../client-profiles.js";
import {
  getAuthState,
  getTelegramPeerActivity,
  listUnreadHumanChats,
  reviewTelegramLinkedChannel,
  sendTelegramMessage,
} from "../telegram/backend.js";
import type {
  ClientConsentStatus,
  ClientProfileMessageDirection,
  ClientProfileStatus,
} from "../types.js";
import { inspectUnreadBeforeTelegramWrite } from "../telegram/outbound-preflight.js";

export function runClientProfileCreate(args: {
  id?: string;
  telegram_user_id: string;
  channel?: string;
  external_user_id?: string;
  contact_account_id?: string;
  display_name?: string;
  username?: string;
  source?: string;
  status?: ClientProfileStatus;
  consent_status?: ClientConsentStatus;
  context?: Record<string, unknown>;
  dialogue_summary?: string;
  last_contact_at?: string;
  next_action_at?: string;
  metadata?: Record<string, unknown>;
}) {
  return {
    created: true,
    profile: createClientProfile({
      id: args.id,
      telegramUserId: args.telegram_user_id,
      channel: args.channel,
      externalUserId: args.external_user_id,
      contactAccountId: args.contact_account_id,
      displayName: args.display_name,
      username: args.username,
      source: args.source,
      status: args.status,
      consentStatus: args.consent_status,
      context: args.context,
      dialogueSummary: args.dialogue_summary,
      lastContactAt: args.last_contact_at,
      nextActionAt: args.next_action_at,
      metadata: args.metadata,
    }),
  };
}

export function runClientProfileGet(args: { profile_id: string; message_limit?: number }) {
  const profile = getClientProfile(args.profile_id);
  if (!profile) return { error: `Client profile not found: ${args.profile_id}` };
  return {
    profile,
    messages: listClientProfileMessages(args.profile_id, args.message_limit ?? 100),
  };
}

export function runClientProfileList(args: {
  status?: ClientProfileStatus;
  consent_status?: ClientConsentStatus;
  source?: string;
  limit?: number;
}) {
  return {
    profiles: listClientProfiles({
      status: args.status,
      consentStatus: args.consent_status,
      source: args.source,
      limit: args.limit,
    }),
  };
}

export function runClientProfileUpdate(args: {
  profile_id: string;
  display_name?: string | null;
  username?: string | null;
  source?: string;
  status?: ClientProfileStatus;
  consent_status?: ClientConsentStatus;
  contact_account_id?: string | null;
  context?: Record<string, unknown> | null;
  dialogue_summary?: string | null;
  last_contact_at?: string | null;
  next_action_at?: string | null;
  metadata?: Record<string, unknown> | null;
}) {
  const profile = updateClientProfile(args.profile_id, {
    ...(args.display_name === undefined ? {} : { displayName: args.display_name }),
    ...(args.username === undefined ? {} : { username: args.username }),
    ...(args.source === undefined ? {} : { source: args.source }),
    ...(args.status === undefined ? {} : { status: args.status }),
    ...(args.consent_status === undefined ? {} : { consentStatus: args.consent_status }),
    ...(args.contact_account_id === undefined ? {} : { contactAccountId: args.contact_account_id }),
    ...(args.context === undefined ? {} : { context: args.context }),
    ...(args.dialogue_summary === undefined ? {} : { dialogueSummary: args.dialogue_summary }),
    ...(args.last_contact_at === undefined ? {} : { lastContactAt: args.last_contact_at }),
    ...(args.next_action_at === undefined ? {} : { nextActionAt: args.next_action_at }),
    ...(args.metadata === undefined ? {} : { metadata: args.metadata }),
  });
  return profile
    ? { updated: true, profile }
    : { error: `Client profile not found: ${args.profile_id}` };
}

export function runClientProfileMessageAdd(args: {
  profile_id: string;
  direction: ClientProfileMessageDirection;
  text: string;
  sent_at?: string;
  contact_account_id?: string;
  telegram_message_id?: string;
  metadata?: Record<string, unknown>;
}) {
  return {
    created: true,
    message: addClientProfileMessage({
      profileId: args.profile_id,
      direction: args.direction,
      text: args.text,
      sentAt: args.sent_at,
      contactAccountId: args.contact_account_id,
      telegramMessageId: args.telegram_message_id,
      metadata: args.metadata,
    }),
  };
}

type ClientProfileDraftKey = "firstContact" | "replyToUnread";

function draftForProfile(
  profile: ReturnType<typeof getClientProfile>,
  draftKey: ClientProfileDraftKey = "firstContact",
): string | undefined {
  const drafts = profile?.context?.drafts;
  if (!drafts || typeof drafts !== "object") return undefined;
  const draft = (drafts as Record<string, unknown>)[draftKey];
  return typeof draft === "string" && draft.trim() ? draft.trim() : undefined;
}

export async function runClientProfileBatchSend(args: {
  profile_ids: string[];
  confirm?: boolean;
  min_delay_seconds?: number;
  max_inactive_days?: number;
  draft_key?: ClientProfileDraftKey;
}) {
  const profileIds = Array.from(new Set(args.profile_ids.map((id) => id.trim()).filter(Boolean)));
  if (profileIds.length === 0) return { ok: false, error: "profile_ids must contain at least one profile" };
  if (profileIds.length > 50) {
    return { ok: false, error: "A batch may contain at most 50 client profiles" };
  }
  if (args.confirm !== true) {
    return {
      ok: false,
      error: "Batch sending requires explicit confirm=true",
      safety: "One batch confirmation is required for up to 50 selected profiles; no automatic follow-up is sent.",
    };
  }

  const minDelaySeconds = Math.floor(args.min_delay_seconds ?? 15);
  if (!Number.isFinite(minDelaySeconds) || minDelaySeconds < 15 || minDelaySeconds > 60) {
    return { ok: false, error: "min_delay_seconds must be between 15 and 60" };
  }

  const maxInactiveDays = Math.floor(args.max_inactive_days ?? 30);
  if (!Number.isFinite(maxInactiveDays) || maxInactiveDays < 1 || maxInactiveDays > 365) {
    return { ok: false, error: "max_inactive_days must be between 1 and 365" };
  }

  const draftKey = args.draft_key ?? "firstContact";

  const profiles = profileIds.map((id) => getClientProfile(id));
  const missing = profileIds.filter((_, index) => !profiles[index]);
  if (missing.length > 0) return { ok: false, error: "Client profiles not found", missing_profile_ids: missing };

  const preflightErrors: Array<{ profile_id: string; error: string }> = [];
  const readyProfiles = profiles.filter((profile): profile is NonNullable<typeof profile> => Boolean(profile));
  for (const profile of readyProfiles) {
    if (profile.status !== "active") {
      preflightErrors.push({ profile_id: profile.id, error: `Profile status is ${profile.status}` });
    } else if (profile.consentStatus === "opted_out") {
      preflightErrors.push({ profile_id: profile.id, error: "Profile is opted_out" });
    } else if (!draftForProfile(profile, draftKey)) {
      preflightErrors.push({ profile_id: profile.id, error: `Profile has no saved ${draftKey} draft` });
    }
  }
  if (preflightErrors.length > 0) {
    return {
      ok: false,
      error: "Batch preflight failed; no messages were sent",
      preflight_errors: preflightErrors,
    };
  }

  const auth = await getAuthState();
  if (auth.state !== "ready") {
    return { ok: false, error: "Telegram account is not ready", auth, hint: auth.hint };
  }
  if (auth.backend !== "gramjs" && auth.backend !== "tdlib") {
    return { ok: false, error: "A ready GramJS or TDLib backend is required", auth };
  }
  if (auth.account?.isPremium !== true) {
    return {
      ok: false,
      error: "Telegram Premium is required for batch sending",
      premium_required: true,
      premium: false,
      auth,
    };
  }

  const unreadPreflight = await inspectUnreadBeforeTelegramWrite();

  const activityChecks: Array<Record<string, unknown>> = [];
  for (const profile of readyProfiles) {
    const peer = profile.username ? `@${profile.username}` : profile.telegramUserId;
    try {
      const activity = await getTelegramPeerActivity(peer, maxInactiveDays);
      activityChecks.push({ profile_id: profile.id, username: profile.username ? `@${profile.username}` : undefined, ...activity });
      if (!activity.eligible) {
        preflightErrors.push({
          profile_id: profile.id,
          error: `Telegram activity check failed: ${activity.reason || activity.status}`,
        });
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      activityChecks.push({ profile_id: profile.id, username: profile.username ? `@${profile.username}` : undefined, status: "error", eligible: false, reason: message });
      preflightErrors.push({ profile_id: profile.id, error: `Telegram activity check failed: ${message}` });
    }
  }
  if (preflightErrors.length > 0) {
    return {
      ok: false,
      error: "Batch preflight failed; no messages were sent",
      preflight_errors: preflightErrors,
      activity_checks: activityChecks,
      max_inactive_days: maxInactiveDays,
    };
  }

  const batchId = randomUUID();
  const results: Array<Record<string, unknown>> = [];
  for (let index = 0; index < readyProfiles.length; index += 1) {
    const profile = readyProfiles[index];
    if (index > 0) await new Promise((resolve) => setTimeout(resolve, minDelaySeconds * 1000));
    const perMessageUnreadPreflight = index === 0 ? unreadPreflight : await inspectUnreadBeforeTelegramWrite();
    const text = draftForProfile(profile, draftKey)!;
    try {
      const peer = profile.username ? `@${profile.username}` : profile.telegramUserId;
      const sent = await sendTelegramMessage(peer, text);
      const history = addClientProfileMessage({
        profileId: profile.id,
        direction: "outbound",
        text,
        telegramMessageId: String(sent.messageId),
        metadata: { batchId, backend: auth.backend, confirmed: true },
      });
      results.push({
        ok: true,
        profile_id: profile.id,
        username: profile.username ? `@${profile.username}` : undefined,
        telegram_message_id: String(sent.messageId),
        history_message_id: history.id,
        unread_preflight: perMessageUnreadPreflight,
      });
    } catch (error) {
      results.push({
        ok: false,
        profile_id: profile.id,
        username: profile.username ? `@${profile.username}` : undefined,
        error: error instanceof Error ? error.message : String(error),
      });
      break;
    }
  }

  const sentCount = results.filter((result) => result.ok === true).length;
  return {
    ok: sentCount === readyProfiles.length,
    batch_id: batchId,
    requested_count: readyProfiles.length,
    sent_count: sentCount,
    stopped_on_error: sentCount < readyProfiles.length,
    draft_key: draftKey,
    min_delay_seconds: minDelaySeconds,
    max_inactive_days: maxInactiveDays,
    activity_checks: activityChecks,
    unread_preflight: unreadPreflight,
    results,
    safety: "One explicit batch confirmation; maximum 50 profiles; no automatic follow-up; opted_out profiles are blocked.",
  };
}

export async function runClientProfileUnreadCheck(args: { limit?: number }) {
  try {
    const snapshot = await listUnreadHumanChats(args.limit ?? 50);
    const profiles = listClientProfiles({ limit: 200 });
    const items = snapshot.chats.map((chat) => {
      const profile =
        profiles.find((item) => item.telegramUserId === chat.telegramUserId) ||
        (chat.username
          ? profiles.find((item) => String(item.username || "").toLowerCase() === chat.username!.toLowerCase())
          : undefined);
      const history = profile ? listClientProfileMessages(profile.id, 500) : [];
      const inbound = history.filter((message) => message.direction === "inbound");
      const outbound = history.filter((message) => message.direction === "outbound");
      const lastInbound = inbound[inbound.length - 1];
      const lastOutbound = outbound[outbound.length - 1];
      const drafts = profile?.context?.drafts;
      const replyDraftReady =
        Boolean(drafts && typeof drafts === "object" && typeof (drafts as Record<string, unknown>).replyToUnread === "string");
      let status: "unanswered" | "answered" | "needs_review" = "needs_review";
      if (chat.latestMessage?.incoming === true) {
        status = !lastOutbound || lastOutbound.sentAt < chat.latestMessage.date ? "unanswered" : "answered";
      }
      return {
        profile_id: profile?.id,
        telegram_user_id: chat.telegramUserId,
        username: chat.username ? `@${chat.username}` : undefined,
        display_name: chat.displayName,
        unread_count: chat.unreadCount,
        status,
        latest_unread_message: chat.latestMessage,
        last_local_inbound_at: lastInbound?.sentAt,
        last_local_outbound_at: lastOutbound?.sentAt,
        reply_draft_ready: replyDraftReady,
      };
    });
    return {
      ok: true,
      checked_at: snapshot.checkedAt,
      backend: snapshot.backend,
      total_unread_human_dialogs: snapshot.totalUnreadHumanDialogs,
      returned_dialogs: snapshot.returnedDialogs,
      unanswered_count: items.filter((item) => item.status === "unanswered").length,
      needs_review_count: items.filter((item) => item.status === "needs_review").length,
      items,
      safety: "Read-only dialog snapshot; bots and channels are excluded; Telegram read state is not changed; no messages are sent.",
    };
  } catch (error) {
    return {
      ok: false,
      error: error instanceof Error ? error.message : String(error),
      hint: "The quick unread check requires the connected local GramJS account.",
    };
  }
}

export async function runClientProfileChannelReview(args: {
  profile_id: string;
  queries?: string[];
  per_query_limit?: number;
}) {
  const profile = getClientProfile(args.profile_id);
  if (!profile) return { ok: false, error: `Client profile not found: ${args.profile_id}` };
  if (profile.consentStatus === "opted_out") {
    return {
      ok: false,
      error: "Channel review is disabled for an opted-out client profile",
      profile_id: profile.id,
    };
  }

  try {
    const review = await reviewTelegramLinkedChannel(
      profile.telegramUserId,
      args.queries,
      args.per_query_limit ?? 5,
    );
    const context = {
      ...(profile.context ?? {}),
      channelReview: review,
    };
    const updated = updateClientProfile(profile.id, { context });
    return {
      ok: true,
      profile: updated,
      review,
      next_actions: [
        "Use only the verified public topic hits for personalization",
        "Do not mention internal scores, payment data or the research process",
        "Draft a transparent developer/ambassador message and wait for human confirmation",
      ],
    };
  } catch (error) {
    return {
      ok: false,
      error: error instanceof Error ? error.message : String(error),
      hint: "Linked-channel review requires a Premium account and a ready GramJS or TDLib backend",
    };
  }
}
