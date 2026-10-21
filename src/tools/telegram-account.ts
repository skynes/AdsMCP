import { join } from "node:path";
import { resolveDataDir } from "../env.js";
import {
  getAuthState,
  markTelegramChatRead,
  probeTelegramDeps,
  replyToChatMessage,
  replyToPublicPost,
  searchChat,
  searchPublicPosts,
  checkTelegramChannelDirectMessages,
  sendTelegramChannelDirectMessage,
  sendTelegramMessage,
  reactToTelegramMessage,
  startTelegramQrLogin,
  submitTelegramQrPassword,
  tgCheckCode,
  tgCheckPassword,
  tgCredentialsConfigured,
  tgSetPhone,
  type TdAuthState,
} from "../telegram/backend.js";
import { saveTelegramAiPosts } from "../telegram-ai-posts.js";
import { recordTelegramAiSearchRun } from "../telegram-ai-search-queries.js";
import { recordTelegramAiKeywordText } from "../telegram-ai-keywords.js";
import { inspectUnreadBeforeTelegramWrite } from "../telegram/outbound-preflight.js";

const TELEGRAM_SEARCH_FRESHNESS_DAYS = 30;

function isFreshTelegramAiPost(record: { postedAt?: string }, nowMs = Date.now()): boolean {
  if (!record.postedAt) return false;
  const postedAtMs = Date.parse(record.postedAt);
  if (!Number.isFinite(postedAtMs) || postedAtMs > nowMs) return false;
  return nowMs - postedAtMs <= TELEGRAM_SEARCH_FRESHNESS_DAYS * 24 * 60 * 60 * 1000;
}

function authSummary(auth: Awaited<ReturnType<typeof getAuthState>>) {
  return {
    backend: auth.backend,
    reason: auth.reason,
    state: auth.state,
    raw: auth.raw,
    hint: auth.hint,
    account: auth.account,
    qr: auth.qr,
  };
}

function premiumGate(auth: Awaited<ReturnType<typeof getAuthState>>) {
  if (auth.backend !== "tdlib" && auth.backend !== "gramjs") {
    return {
      ok: false,
      error: "Telegram account operations require a ready TDLib or GramJS backend",
      auth: authSummary(auth),
      hint: "Set TELEGRAM_ACCOUNT_BACKEND=gramjs for Alice's local GramJS session",
    };
  }
  if (auth.account?.isPremium !== true) {
    return {
      ok: false,
      error: "Telegram Premium is required for Telegram account search and message sending",
      premium_required: true,
      premium: false,
      auth: authSummary(auth),
      hint: "Enable Telegram Premium for this account, then call ads_telegram_account_status again",
    };
  }
  return null;
}

export async function runTelegramAccountStatus(): Promise<unknown> {
  const deps = await probeTelegramDeps();
  const auth = await getAuthState();
  const dataDir = resolveDataDir();

  return {
    integration: "telegram_account",
    provider: "telegram",
    backend: auth.backend,
    credentials: {
      configured: tgCredentialsConfigured(),
      required_env: ["TELEGRAM_API_ID", "TELEGRAM_API_HASH"],
      aliases: ["TG_APP_API_ID", "TG_APP_API_HASH", "TG_API_ID", "TG_API_HASH"],
      note: "API identifiers are not an account session. The selected local backend still requires the phone, login code and optional 2FA password.",
    },
    deps: {
      ok: deps.ok,
      tdl: deps.tdl,
      prebuilt_tdlib: deps.prebuilt,
      gramjs: deps.gramjs,
      error: deps.error,
      install: deps.install,
    },
    auth: authSummary(auth),
    storage: {
      data_dir: dataDir,
      gramjs_session: join(dataDir, "telegram", "gramjs.session"),
      tdlib_database: join(dataDir, "telegram", "tdlib-db"),
      tdlib_files: join(dataDir, "telegram", "tdlib-files"),
      gitignored: true,
    },
    next:
      auth.state === "missing_deps"
        ? deps.install
        : auth.state === "missing_credentials"
        ? "Set TELEGRAM_API_ID and TELEGRAM_API_HASH in .env"
        : auth.state === "wait_phone" || auth.state === "wait_code" || auth.state === "wait_password"
            ? auth.backend === "gramjs"
              ? "Run npm run telegram:account:login in a local terminal"
              : "Continue with ads_telegram_account_auth"
            : auth.state === "ready"
              ? auth.account?.isPremium === true
                ? "Use ads_telegram_account_search for chat discovery or ads_telegram_account_send for one confirmed message"
                : "Telegram Premium is required before search or message sending can be used"
              : auth.hint,
  };
}

export async function runTelegramAccountAuth(args: {
  phone?: string;
  code?: string;
  password?: string;
  qr?: boolean;
}): Promise<unknown> {
  const before = await getAuthState();
  if (before.state === "missing_deps" || before.state === "missing_credentials") {
    return { ok: false, auth: authSummary(before), hint: before.hint };
  }

  if (before.backend === "gramjs") {
    if (args.qr === true) {
      const qr = await startTelegramQrLogin();
      const after = await getAuthState();
      return { ok: after.state === "ready", qr, auth: authSummary(after), next: after.hint };
    }
    if (args.password != null && before.state === "wait_password") {
      const qr = submitTelegramQrPassword(args.password);
      const after = await getAuthState();
      return { ok: after.state === "ready", qr, auth: authSummary(after), next: after.hint };
    }
    return {
      ok: false,
      error: "GramJS login is terminal-only for safety",
      auth: authSummary(before),
      next: "npm run telegram:account:login",
    };
  }

  const supplied = [args.phone != null, args.code != null, args.password != null].filter(Boolean).length;
  if (supplied !== 1) {
    return {
      ok: false,
      error: "Pass exactly one of phone, code, or password according to auth.state.",
      auth: authSummary(before),
      security: "Use this only through a trusted local MCP client. Do not paste Telegram codes or 2FA passwords into a hosted chat.",
    };
  }

  try {
    if (args.phone != null) {
      await tgSetPhone(args.phone);
    } else if (args.code != null) {
      await tgCheckCode(args.code);
    } else {
      await tgCheckPassword(args.password || "");
    }
  } catch (error) {
    const afterError = await getAuthState();
    return {
      ok: false,
      error: error instanceof Error ? error.message : String(error),
      auth: authSummary(afterError),
    };
  }

  const after = await getAuthState();
  return {
    ok: after.state === "ready",
    auth: authSummary(after),
    next:
      after.state === "ready"
        ? after.account?.isPremium === true
          ? "ads_telegram_account_search"
          : "Telegram Premium is required before search or message sending can be used"
        : after.hint,
  };
}

export async function runTelegramAccountSearch(args: {
  chat: string;
  query?: string;
  limit?: number;
  since?: string;
}): Promise<unknown> {
  const auth = await getAuthState();
  if (auth.state !== "ready") {
    return {
      ok: false,
      error: "Telegram account is not ready",
      auth: authSummary(auth),
      hint: auth.hint || "Call ads_telegram_account_auth first",
    };
  }

  const blocked = premiumGate(auth);
  if (blocked) return blocked;

  const startedAt = new Date().toISOString();
  let hits;
  try {
    hits = await searchChat(args.chat, args.query || "", args.limit || 20, args.since);
  } catch (error) {
    recordTelegramAiSearchRun({
      projectId: "neron",
      query: args.query || "[all messages]",
      source: "telegram_chat_search",
      scope: args.chat,
      status: "error",
      startedAt,
      error: error instanceof Error ? error.message : String(error),
      metadata: { readOnly: true, since: args.since || null },
    });
    throw error;
  }
  recordTelegramAiSearchRun({
    projectId: "neron",
    query: args.query || "[all messages]",
    source: "telegram_chat_search",
    scope: args.chat,
    status: "ok",
    startedAt,
    resultCount: hits.length,
    metadata: { readOnly: true, since: args.since || null },
  });
  let keywordObservations = 0;
  for (const hit of hits) {
    const observed = recordTelegramAiKeywordText({
      projectId: "neron",
      text: `${hit.title} ${hit.description}`,
      sourceType: "telegram_message",
      sourceRef: hit.link || `telegram:${hit.chatId}:${hit.messageId}`,
      observedAt: hit.date,
      metadata: { readOnly: true, chat: args.chat },
    });
    keywordObservations += observed.recorded;
  }
  return {
    ok: true,
    backend: auth.backend,
    chat: args.chat,
    query: args.query || null,
    since: args.since || null,
    total: hits.length,
    trend_keywords_recorded: keywordObservations,
    results: hits.map((hit) => ({
      id: hit.id,
      title: hit.title,
      description: hit.description,
      link: hit.link,
      date: hit.date,
      chat: hit.chat,
      chat_id: hit.chatId,
      message_id: hit.messageId,
    })),
    note: "Search is enabled only for a Telegram Premium account and uses the selected local Telegram backend.",
  };
}

export async function runTelegramChatMarkRead(args: {
  chat: string;
  confirm?: boolean;
}): Promise<unknown> {
  const auth = await getAuthState();
  if (auth.state !== "ready") {
    return {
      ok: false,
      error: "Telegram account is not ready",
      auth: authSummary(auth),
      hint: auth.hint || "Call ads_telegram_account_auth first",
    };
  }
  if (args.confirm !== true) {
    return {
      ok: false,
      error: "Marking a Telegram chat read requires explicit confirm=true",
      safety: "This changes Telegram read state, sends no message, and is limited to one human one-to-one chat.",
    };
  }
  const result = await markTelegramChatRead(args.chat);
  return {
    ...result,
    backend: auth.backend,
    safety: "One human one-to-one Telegram chat marked read; no message was sent and no local dialogue row was created.",
  };
}

export async function runTelegramPublicPostSearch(args: {
  query: string;
  limit?: number;
  confirm_paid?: boolean;
  max_stars?: number;
}): Promise<unknown> {
  const auth = await getAuthState();
  if (auth.state !== "ready") {
    return {
      ok: false,
      error: "Telegram account is not ready",
      auth: authSummary(auth),
      hint: auth.hint || "Call ads_telegram_account_auth first",
    };
  }

  const blocked = premiumGate(auth);
  if (blocked) return blocked;

  const startedAt = new Date().toISOString();
  let result;
  try {
    result = await searchPublicPosts(args.query, args.limit || 20, {
      confirmPaid: args.confirm_paid === true,
      maxPaidStars: args.max_stars,
    });
  } catch (error) {
    recordTelegramAiSearchRun({
      projectId: "neron",
      query: args.query,
      source: "telegram_public_post_search",
      scope: "global",
      status: "error",
      startedAt,
      error: error instanceof Error ? error.message : String(error),
      metadata: { paidSearchAttempted: false, queryIsFree: null, starsAmount: null },
    });
    throw error;
  }
  const stored = result.ok
    ? saveTelegramAiPosts({ projectId: "neron", query: result.query, hits: result.results })
    : undefined;
  const allRecords = stored?.records || [];
  const nowMs = Date.now();
  const quality = {
    total: allRecords.length,
    fresh30d: allRecords.filter((record) => isFreshTelegramAiPost(record, nowMs)).length,
    explicitRequests: allRecords.filter((record) => record.explicitRequest).length,
    freshExplicitRequests: allRecords.filter(
      (record) => record.explicitRequest && isFreshTelegramAiPost(record, nowMs),
    ).length,
    promotionOrRepost: allRecords.filter(
      (record) => record.classification === "promotion" || record.classification === "repost",
    ).length,
    selectionRule: `fresh <= ${TELEGRAM_SEARCH_FRESHNESS_DAYS} days + explicit request/opportunity + relevance >= 70`,
  };
  const actionable = allRecords.filter(
    (record) =>
      (record.classification === "request" || record.classification === "opportunity") &&
      record.explicitRequest &&
      record.relevanceScore >= 70 &&
      isFreshTelegramAiPost(record, nowMs),
  );
  let keywordObservations = 0;
  for (const hit of result.results) {
    const observed = recordTelegramAiKeywordText({
      projectId: "neron",
      text: `${hit.title} ${hit.description}`,
      sourceType: "public_post",
      sourceRef: hit.link || `telegram:${hit.chatId}:${hit.messageId}`,
      observedAt: hit.date,
      metadata: { readOnly: true, globalSearch: true, query: result.query },
    });
    keywordObservations += observed.recorded;
  }
  recordTelegramAiSearchRun({
    projectId: "neron",
    query: result.query,
    source: "telegram_public_post_search",
    scope: "global",
    status: result.status,
    startedAt,
    finishedAt: new Date().toISOString(),
    remainingFree: result.remainingFree,
    resultCount: result.results.length,
    actionableCount: actionable.length,
    paidSearchAttempted: result.paidSearchAttempted,
    starsAmount: result.starsAmount,
    metadata: {
      paidSearchAttempted: result.paidSearchAttempted,
      queryIsFree: result.queryIsFree,
      starsAmount: result.starsAmount,
      quality,
    },
  });
  return {
    ...result,
    storage: stored
      ? {
          project_id: stored.projectId,
          table: "telegram_ai_posts",
          stored: stored.stored,
          classifier_actionable: stored.actionable,
          qualified_actionable: actionable.length,
          selection_rule: quality.selectionRule,
        }
      : undefined,
    trend_keywords_recorded: keywordObservations,
    filtered_results: actionable.map((record) => ({
      id: record.id,
      classification: record.classification,
      relevance_score: record.relevanceScore,
      explicit_request: record.explicitRequest,
      title: record.title,
      description: record.description,
      link: record.publicUrl,
      chat: record.chatTitle,
      posted_at: record.postedAt,
      age_days: record.postedAt
        ? Math.floor((nowMs - Date.parse(record.postedAt)) / (24 * 60 * 60 * 1000))
        : null,
      public_reply_draft: record.publicReplyDraft,
      reason: record.metadata?.classificationReason,
    })),
    premium: true,
    safety:
      result.status === "payment_required"
        ? "No search was executed because the free quota is exhausted or paid Stars confirmation is missing."
        : result.paidSearchAttempted
          ? "Paid search was executed only because confirm_paid=true and max_stars covered the quoted Stars amount."
          : "Public post search executed without sending messages or spending Stars.",
  };
}

export async function runTelegramAccountSend(args: {
  to: string;
  text: string;
  confirm?: boolean;
}): Promise<unknown> {
  const auth = await getAuthState();
  if (auth.state !== "ready") {
    return {
      ok: false,
      error: "Telegram account is not ready",
      auth: authSummary(auth),
      hint: auth.hint || "Call ads_telegram_account_auth first",
    };
  }

  const blocked = premiumGate(auth);
  if (blocked) return blocked;
  if (args.confirm !== true) {
    return {
      ok: false,
      error: "Message sending requires explicit confirm=true",
      premium: true,
      safety: "Only one plain-text message is sent per call; bulk outreach is not supported.",
    };
  }

  const unreadPreflight = await inspectUnreadBeforeTelegramWrite();

  const result = await sendTelegramMessage(args.to, args.text);
  return {
    ...result,
    backend: auth.backend,
    premium: true,
    unread_preflight: unreadPreflight,
    safety: "One manually confirmed plain-text message sent through the selected local Telegram backend.",
  };
}

export async function runTelegramMessageReact(args: {
  chat: string;
  message_id: number;
  reaction: string;
  expected_text?: string;
  confirm?: boolean;
}): Promise<unknown> {
  const auth = await getAuthState();
  if (auth.state !== "ready") {
    return {
      ok: false,
      error: "Telegram account is not ready",
      auth: authSummary(auth),
      hint: auth.hint || "Call ads_telegram_account_auth first",
    };
  }

  const blocked = premiumGate(auth);
  if (blocked) return blocked;
  if (args.confirm !== true) {
    return {
      ok: false,
      error: "Adding a Telegram reaction requires explicit confirm=true",
      premium: true,
      safety: "No reaction was added. The target text can be checked with expected_text before the write.",
    };
  }

  const result = await reactToTelegramMessage(
    args.chat,
    args.message_id,
    args.reaction,
    args.expected_text,
  );
  return {
    ...result,
    backend: auth.backend,
    premium: true,
    safety: "One explicitly confirmed reaction was added; no message was sent and chat read state was not changed.",
  };
}

export async function runTelegramChannelDirectCheck(args: { channel: string }): Promise<unknown> {
  const auth = await getAuthState();
  if (auth.state !== "ready") {
    return { ok: false, error: "Telegram account is not ready", auth: authSummary(auth), hint: auth.hint || "Call ads_telegram_account_auth first" };
  }
  const blocked = premiumGate(auth);
  if (blocked) return blocked;
  const result = await checkTelegramChannelDirectMessages(args.channel);
  return { ...result, backend: auth.backend, premium: true, safety: "Read-only Direct Messages preflight; no channel post or message was sent." };
}

export async function runTelegramChannelDirectSend(args: { channel: string; text: string; confirm?: boolean }): Promise<unknown> {
  const auth = await getAuthState();
  if (auth.state !== "ready") {
    return { ok: false, error: "Telegram account is not ready", auth: authSummary(auth), hint: auth.hint || "Call ads_telegram_account_auth first" };
  }
  const blocked = premiumGate(auth);
  if (blocked) return blocked;
  if (args.confirm !== true) {
    return { ok: false, error: "Channel Direct Message sending requires explicit confirm=true", premium: true };
  }
  const preflight = await checkTelegramChannelDirectMessages(args.channel);
  if (!preflight.canWrite) {
    return { ok: false, error: "Channel Direct Messages are not enabled", preflight, premium: true, safety: "No message was sent." };
  }
  const unreadPreflight = await inspectUnreadBeforeTelegramWrite();
  const result = await sendTelegramChannelDirectMessage(args.channel, args.text);
  return { ...result, backend: auth.backend, premium: true, preflight, unread_preflight: unreadPreflight, safety: result.verified ? "One confirmed message was sent and verified in the channel's Direct Messages monoforum; no public post was created." : "The message was sent but Telegram did not provide an unambiguous exact-text verification; do not resend automatically." };
}

export async function runTelegramPublicPostReply(args: {
  channel: string;
  message_id: number;
  text: string;
  confirm?: boolean;
}): Promise<unknown> {
  const auth = await getAuthState();
  if (auth.state !== "ready") {
    return {
      ok: false,
      error: "Telegram account is not ready",
      auth: authSummary(auth),
      hint: auth.hint || "Call ads_telegram_account_auth first",
    };
  }

  const blocked = premiumGate(auth);
  if (blocked) return blocked;
  if (args.confirm !== true) {
    return {
      ok: false,
      error: "Public Telegram reply requires explicit confirm=true",
      premium: true,
      safety: "Only one public comment is sent per call; no private message is sent.",
    };
  }

  const unreadPreflight = await inspectUnreadBeforeTelegramWrite();

  const result = await replyToPublicPost(args.channel, args.message_id, args.text);
  return {
    ...result,
    backend: auth.backend,
    premium: true,
    unread_preflight: unreadPreflight,
    safety: "One public comment sent to the linked discussion; no private message was sent.",
  };
}

export async function runTelegramChatReply(args: {
  chat: string;
  message_id: number;
  text: string;
  confirm?: boolean;
}): Promise<unknown> {
  const auth = await getAuthState();
  if (auth.state !== "ready") {
    return {
      ok: false,
      error: "Telegram account is not ready",
      auth: authSummary(auth),
      hint: auth.hint || "Call ads_telegram_account_auth first",
    };
  }

  const blocked = premiumGate(auth);
  if (blocked) return blocked;
  if (args.confirm !== true) {
    return {
      ok: false,
      error: "Telegram group reply requires explicit confirm=true",
      premium: true,
      safety: "Only one public reply to one group message is sent per call; no private message is sent.",
    };
  }

  const unreadPreflight = await inspectUnreadBeforeTelegramWrite();
  const result = await replyToChatMessage(args.chat, args.message_id, args.text);
  return {
    ...result,
    backend: auth.backend,
    premium: true,
    unread_preflight: unreadPreflight,
    safety: "One public reply was sent to the selected group message; no private message was sent.",
  };
}

export type TelegramAccountAuthState = TdAuthState;
