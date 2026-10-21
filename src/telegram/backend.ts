/**
 * Pick the account backend. GramJS is the configured local backend for the
 * current Alice session and works on win32-arm64. TDLib remains available
 * when explicitly selected with TELEGRAM_ACCOUNT_BACKEND=tdlib.
 */
import {
  probeGramjs,
  gramjsAuthState,
  gramjsListUnreadHumanChats,
  gramjsMarkChatRead,
  gramjsSearchChat,
  gramjsSearchPublicPosts,
  gramjsReviewLinkedChannel,
  gramjsGetPeerActivity,
  gramjsCheckChannelDirectMessages,
  gramjsSendChannelDirectMessage,
  gramjsReactToMessage,
  startGramjsQrLogin,
  submitGramjsQrPassword,
  gramjsQrLoginStatus,
  closeGramjs,
} from "./gramjs.js";
import { tgCredentialsConfigured } from "./credentials.js";
import type {
  TelegramAccountIdentity,
  TelegramLinkedChannelReview,
  TelegramUnreadHumanSnapshot,
  TelegramPublicPostSearchResult,
  TelegramPeerActivity,
  TelegramChannelDirectMessagePreflight,
  TdAuthState,
  TgBackend,
  TgMessageHit,
} from "./types.js";

export type { TdAuthState, TgMessageHit, TgBackend };

async function probeTdlibNative(): Promise<{ ok: boolean; error?: string }> {
  try {
    await import("tdl");
    const pre = await import("prebuilt-tdlib");
    const getTdjson = (pre as { getTdjson: () => string }).getTdjson;
    getTdjson(); // throws on unsupported platform (win32-arm64)
    return { ok: true };
  } catch (e) {
    return { ok: false, error: (e as Error)?.message || String(e) };
  }
}

export async function resolveBackend(): Promise<{
  backend: TgBackend;
  reason: string;
}> {
  const gram = await probeGramjs();
  const requested = String(process.env.TELEGRAM_ACCOUNT_BACKEND || "gramjs").trim().toLowerCase();
  if (gram.ok && requested !== "tdlib") {
    return { backend: "gramjs", reason: "GramJS selected for the local Alice account" };
  }
  if (requested === "gramjs") {
    return {
      backend: "none",
      reason: `GramJS was explicitly selected but is unavailable: ${gram.error || "dependency missing"}`,
    };
  }
  if (requested !== "tdlib") {
    return {
      backend: "none",
      reason: `Unsupported TELEGRAM_ACCOUNT_BACKEND=${requested}; use tdlib or gramjs`,
    };
  }

  const td = await probeTdlibNative();
  if (td.ok) {
    return { backend: "tdlib", reason: "TDLib prebuilt (default)" };
  }
  return {
    backend: "none",
    reason: `TDLib was explicitly selected but is unavailable: ${td.error || "n/a"}. Set TELEGRAM_ACCOUNT_BACKEND=gramjs to use the local GramJS session.`,
  };
}

export async function getAuthState(): Promise<{
  state: TdAuthState;
  raw?: string;
  hint?: string;
  account?: TelegramAccountIdentity;
  qr?: Record<string, unknown>;
  backend?: TgBackend;
  reason?: string;
}> {
  const { backend, reason } = await resolveBackend();
  if (backend === "none") {
    return { state: "missing_deps", hint: reason, backend, reason };
  }
  if (!tgCredentialsConfigured()) {
    return {
      state: "missing_credentials",
      hint: "TELEGRAM_API_ID + TELEGRAM_API_HASH in .env",
      backend,
      reason,
    };
  }
  if (backend === "gramjs") {
    const a = await gramjsAuthState();
    return { ...a, backend, reason };
  }
  // lazy TDLib path
  const td = await import("./tdlib.js");
  const a = await td.getAuthState();
  return { ...a, backend, reason };
}

export async function startTelegramQrLogin(): Promise<unknown> {
  const { backend } = await resolveBackend();
  if (backend !== "gramjs") {
    return { ok: false, error: "Dashboard QR login currently requires the GramJS backend", backend };
  }
  return startGramjsQrLogin();
}

export function submitTelegramQrPassword(password: string): unknown {
  return submitGramjsQrPassword(password);
}

export function getTelegramQrLoginStatus(): unknown {
  return gramjsQrLoginStatus();
}

export async function searchChat(
  chatRef: string,
  query: string,
  limit = 20,
  since?: string,
): Promise<TgMessageHit[]> {
  const { backend } = await resolveBackend();
  if (backend === "gramjs") return gramjsSearchChat(chatRef, query, limit, since);
  if (backend === "tdlib") {
    const td = await import("./tdlib.js");
    return td.searchChat(chatRef, query, limit, since);
  }
  throw new Error("No Telegram backend — run npm install");
}

export async function searchPublicPosts(
  query: string,
  limit = 20,
  options?: { confirmPaid?: boolean; maxPaidStars?: number },
): Promise<TelegramPublicPostSearchResult> {
  const { backend } = await resolveBackend();
  if (backend === "gramjs") return gramjsSearchPublicPosts(query, limit, options);
  if (backend === "tdlib") {
    throw new Error("Global Telegram post search currently requires the GramJS-compatible teleproto search client");
  }
  throw new Error("No Telegram backend — run npm install");
}

export async function listUnreadHumanChats(limit = 50): Promise<TelegramUnreadHumanSnapshot> {
  const { backend } = await resolveBackend();
  if (backend === "gramjs") return gramjsListUnreadHumanChats(limit);
  throw new Error("Unread human chat check currently requires the GramJS backend");
}

export async function markTelegramChatRead(
  chatRef: string,
): Promise<{ ok: true; peer: string; chatId: number; readStateCleared: boolean }> {
  const { backend } = await resolveBackend();
  if (backend === "gramjs") return gramjsMarkChatRead(chatRef);
  if (backend === "tdlib") {
    const td = await import("./tdlib.js");
    return td.markChatRead(chatRef);
  }
  throw new Error("Marking Telegram chats read requires a ready GramJS or TDLib backend");
}

export async function getTelegramPeerActivity(peer: string, maxInactiveDays = 30): Promise<TelegramPeerActivity> {
  const { backend } = await resolveBackend();
  if (backend === "gramjs") return gramjsGetPeerActivity(peer, maxInactiveDays);
  if (backend === "tdlib") {
    return {
      peer,
      checkedAt: new Date().toISOString(),
      status: "unknown",
      eligible: false,
      reason: "Telegram profile activity gate currently requires the GramJS backend",
    };
  }
  throw new Error("No Telegram backend — run npm install");
}

export async function sendTelegramMessage(
  to: string,
  text: string,
): Promise<{ ok: true; peer: string; chatId: number; messageId: number; link?: string; readStateCleared?: boolean }> {
  const { backend } = await resolveBackend();
  if (backend === "tdlib") {
    const td = await import("./tdlib.js");
    return td.sendMessage(to, text);
  }
  if (backend === "gramjs") {
    const gram = await import("./gramjs.js");
    return gram.gramjsSendMessage(to, text);
  }
  throw new Error("No Telegram backend — install TDLib or explicitly select a supported backend");
}

export async function reactToTelegramMessage(
  chatRef: string,
  messageId: number,
  reaction: string,
  expectedText?: string,
): Promise<{ ok: true; chat: string; chatId?: number; messageId: number; reaction: string; link?: string; verifiedText?: string }> {
  const { backend } = await resolveBackend();
  if (backend === "gramjs") return gramjsReactToMessage(chatRef, messageId, reaction, expectedText);
  if (backend === "tdlib") {
    const td = await import("./tdlib.js");
    return td.addMessageReaction(chatRef, messageId, reaction, expectedText);
  }
  throw new Error("Adding Telegram reactions requires a ready GramJS or TDLib backend");
}

export async function checkTelegramChannelDirectMessages(
  channelRef: string,
): Promise<TelegramChannelDirectMessagePreflight> {
  const { backend } = await resolveBackend();
  if (backend === "gramjs") return gramjsCheckChannelDirectMessages(channelRef);
  throw new Error("Telegram channel Direct Messages currently require the GramJS-compatible teleproto backend");
}

export async function sendTelegramChannelDirectMessage(
  channelRef: string,
  text: string,
): Promise<{ ok: true; peer: string; chatId: number; messageId: number; directChatId: string; readStateCleared: boolean; verified: boolean }> {
  const { backend } = await resolveBackend();
  if (backend === "gramjs") return gramjsSendChannelDirectMessage(channelRef, text);
  throw new Error("Telegram channel Direct Messages currently require the GramJS-compatible teleproto backend");
}

export async function replyToPublicPost(
  channelRef: string,
  messageId: number,
  text: string,
): Promise<{ ok: true; channel: string; messageId: number; link?: string }> {
  const { backend } = await resolveBackend();
  if (backend === "gramjs") {
    const gram = await import("./gramjs.js");
    return gram.gramjsReplyToPublicPost(channelRef, messageId, text);
  }
  throw new Error("Public Telegram post comments currently require the GramJS backend");
}

export async function replyToChatMessage(
  chatRef: string,
  messageId: number,
  text: string,
): Promise<{ ok: true; chat: string; messageId: number; link?: string }> {
  const { backend } = await resolveBackend();
  if (backend === "gramjs") {
    const gram = await import("./gramjs.js");
    return gram.gramjsReplyToChatMessage(chatRef, messageId, text);
  }
  throw new Error("Telegram group replies currently require the GramJS backend");
}

export async function reviewTelegramLinkedChannel(
  userId: string,
  queries?: string[],
  perQueryLimit = 5,
): Promise<TelegramLinkedChannelReview> {
  const { backend } = await resolveBackend();
  if (backend === "gramjs") return gramjsReviewLinkedChannel(userId, queries, perQueryLimit);
  if (backend === "tdlib") {
    const td = await import("./tdlib.js");
    return td.reviewLinkedChannel(userId, queries, perQueryLimit);
  }
  throw new Error("Linked-channel review requires a ready GramJS or TDLib backend");
}

export async function tgSetPhone(phone: string): Promise<unknown> {
  const { backend } = await resolveBackend();
  if (backend === "tdlib") {
    const td = await import("./tdlib.js");
    return td.tgSetPhone(phone);
  }
  throw new Error("For GramJS use terminal: npm run telegram:account:login (do not pass phone/code in chat)");
}

export async function tgCheckCode(code: string): Promise<unknown> {
  const { backend } = await resolveBackend();
  if (backend === "tdlib") {
    const td = await import("./tdlib.js");
    return td.tgCheckCode(code);
  }
  throw new Error("For GramJS use terminal: npm run telegram:account:login");
}

export async function tgCheckPassword(password: string): Promise<unknown> {
  const { backend } = await resolveBackend();
  if (backend === "tdlib") {
    const td = await import("./tdlib.js");
    return td.tgCheckPassword(password);
  }
  throw new Error("For GramJS use terminal: npm run telegram:account:login");
}

export { tgCredentialsConfigured } from "./credentials.js";

export async function probeTelegramDeps(): Promise<{
  ok: boolean;
  backend: TgBackend;
  reason: string;
  install: string;
  tdl: boolean;
  prebuilt: boolean;
  gramjs: boolean;
  error?: string;
}> {
  const gram = await probeGramjs();
  const { backend, reason } = await resolveBackend();
  const td = backend === "tdlib" ? await probeTdlibNative() : { ok: false };
  return {
    ok: backend !== "none",
    backend,
    reason,
    install:
      backend === "none"
      ? `Set TELEGRAM_ACCOUNT_BACKEND=gramjs for the local GramJS session, or run TDLib on a supported platform (Windows x64, Linux or macOS). ${reason}`
        : reason,
    tdl: td.ok,
    prebuilt: td.ok,
    gramjs: gram.ok,
    error: backend === "none" ? reason : undefined,
  };
}

export async function closeTelegram(): Promise<void> {
  const { backend } = await resolveBackend();
  await closeGramjs();
  if (backend === "tdlib") {
    try {
      const td = await import("./tdlib.js");
      await td.closeTdClient();
    } catch {
      /* ignore */
    }
  }
}
