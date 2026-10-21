/**
 * Optional TDLib client (x64/arm64 macOS/Linux + win x64).
 * On win32-arm64 use GramJS via backend.ts instead.
 */
import { mkdirSync } from "node:fs";
import { join } from "node:path";
import { resolveDataDir } from "../env.js";
import { tgApiHash, tgApiId, tgCredentialsConfigured } from "./credentials.js";
import type {
  TelegramAccountIdentity,
  TelegramLinkedChannelReview,
  TdAuthState,
  TgMessageHit,
} from "./types.js";

export type { TdAuthState, TgMessageHit };
export { tgCredentialsConfigured };

type TdClient = {
  invoke: (query: Record<string, unknown>) => Promise<Record<string, unknown>>;
  close?: () => Promise<void>;
  on?: (event: string, cb: (...args: unknown[]) => void) => void;
};

let configured = false;
let client: TdClient | null = null;
let loadError: string | null = null;

async function getAccountIdentity(c: TdClient): Promise<TelegramAccountIdentity | undefined> {
  try {
    const me = await c.invoke({ _: "getMe" });
    const firstName = String(me.first_name || "").trim();
    const lastName = String(me.last_name || "").trim();
    const name = [firstName, lastName].filter(Boolean).join(" ");
    const usernames = me.usernames as Record<string, unknown> | undefined;
    const activeUsernames = Array.isArray(usernames?.active_usernames)
      ? usernames.active_usernames
      : [];
    const username = String(me.username || activeUsernames[0] || "").trim();
    const id = String(me.id || "").trim();
    if (!id) return undefined;
    return {
      id,
      ...(name ? { name } : {}),
      ...(username ? { username } : {}),
      isPremium: me.is_premium === true,
    };
  } catch {
    return undefined;
  }
}

async function assertPremium(c: TdClient): Promise<void> {
  const me = await c.invoke({ _: "getMe" });
  if (me.is_premium !== true) {
    throw new Error("Telegram Premium is required for Telegram account search and message sending");
  }
}

export async function probeTdlibDeps(): Promise<{
  ok: boolean;
  tdl: boolean;
  prebuilt: boolean;
  error?: string;
  install: string;
}> {
  const install =
    "Install the optional TDLib dependencies with: npm install. Supported native platforms depend on prebuilt-tdlib.";
  let tdlOk = false;
  let preOk = false;
  let error: string | undefined;
  try {
    await import("tdl");
    tdlOk = true;
  } catch (e) {
    error = (e as Error)?.message || String(e);
  }
  try {
    const pre = await import("prebuilt-tdlib");
    (pre as { getTdjson: () => string }).getTdjson();
    preOk = true;
  } catch (e) {
    error = error || (e as Error)?.message || String(e);
  }
  return {
    ok: tdlOk && preOk,
    tdl: tdlOk,
    prebuilt: preOk,
    error: tdlOk && preOk ? undefined : error,
    install,
  };
}

async function configureTdlib(): Promise<void> {
  if (configured) return;
  const tdl = await import("tdl");
  const pre = await import("prebuilt-tdlib");
  const getTdjson = (pre as { getTdjson: () => string }).getTdjson;
  (tdl as { configure: (o: Record<string, unknown>) => void }).configure({
    tdjson: getTdjson(),
    verbosityLevel: Number(process.env.TELEGRAM_TDLIB_VERBOSITY || 1),
  });
  configured = true;
}

function sessionDirs() {
  const root = join(resolveDataDir(), "telegram");
  const databaseDirectory = join(root, "tdlib-db");
  const filesDirectory = join(root, "tdlib-files");
  mkdirSync(databaseDirectory, { recursive: true });
  mkdirSync(filesDirectory, { recursive: true });
  return { databaseDirectory, filesDirectory };
}

export async function getTdClient(): Promise<TdClient> {
  if (client) return client;
  loadError = null;
  if (!tgCredentialsConfigured()) {
    throw new Error(
      "Set TELEGRAM_API_ID and TELEGRAM_API_HASH in .env (create an app at https://my.telegram.org/apps)",
    );
  }
  const deps = await probeTdlibDeps();
  if (!deps.ok) {
    loadError = deps.error || "tdl/prebuilt-tdlib missing";
    throw new Error(`${loadError}. ${deps.install}`);
  }
  await configureTdlib();
  const tdl = await import("tdl");
  const { databaseDirectory, filesDirectory } = sessionDirs();
  client = (tdl as { createClient: (o: Record<string, unknown>) => TdClient }).createClient({
    apiId: tgApiId(),
    apiHash: tgApiHash(),
    databaseDirectory,
    filesDirectory,
    tdlibParameters: {
      use_message_database: true,
      use_secret_chats: false,
      system_language_code: "en",
      application_version: "adsmcp/0.1",
      device_model: "AdsMCP",
      system_version: process.platform,
    },
  });
  return client!;
}

export async function getAuthState(): Promise<{
  state: TdAuthState;
  raw?: string;
  hint?: string;
  account?: TelegramAccountIdentity;
  deps?: Awaited<ReturnType<typeof probeTdlibDeps>>;
}> {
  const deps = await probeTdlibDeps();
  if (!deps.ok) {
    return {
      state: "missing_deps",
      hint: deps.install,
      deps,
    };
  }
  if (!tgCredentialsConfigured()) {
    return {
      state: "missing_credentials",
      hint: "Create an app at https://my.telegram.org/apps and set TELEGRAM_API_ID / TELEGRAM_API_HASH in .env",
      deps,
    };
  }
  try {
    const c = await getTdClient();
    const auth = await c.invoke({ _: "getAuthorizationState" });
    const type = String(auth._ || "");
    const map: Record<string, TdAuthState> = {
      authorizationStateWaitPhoneNumber: "wait_phone",
      authorizationStateWaitCode: "wait_code",
      authorizationStateWaitPassword: "wait_password",
      authorizationStateWaitRegistration: "wait_registration",
      authorizationStateReady: "ready",
      authorizationStateLoggingOut: "logging_out",
      authorizationStateClosing: "closed",
      authorizationStateClosed: "closed",
      authorizationStateWaitTdlibParameters: "unknown",
      authorizationStateWaitEncryptionKey: "unknown",
    };
    const state = map[type] || "unknown";
    return {
      state,
      raw: type,
      account: state === "ready" ? await getAccountIdentity(c) : undefined,
      deps,
      hint:
        map[type] === "wait_phone"
          ? "Call ads_telegram_account_auth with phone:+888…"
          : map[type] === "wait_code"
            ? "Call ads_telegram_account_auth with code from Telegram/SMS"
            : map[type] === "wait_password"
              ? "Call ads_telegram_account_auth with password (2FA)"
              : undefined,
    };
  } catch (e) {
    return {
      state: "unknown",
      hint: (e as Error)?.message || String(e),
      deps,
    };
  }
}

export async function tgSetPhone(phone: string): Promise<unknown> {
  const c = await getTdClient();
  const normalized = String(phone || "").trim();
  if (!normalized.startsWith("+")) {
    throw new Error("phone must be international, e.g. +79001234567");
  }
  return c.invoke({
    _: "setAuthenticationPhoneNumber",
    phone_number: normalized,
    settings: { _: "phoneNumberAuthenticationSettings" },
  });
}

export async function tgCheckCode(code: string): Promise<unknown> {
  const c = await getTdClient();
  return c.invoke({
    _: "checkAuthenticationCode",
    code: String(code || "").trim(),
  });
}

export async function tgCheckPassword(password: string): Promise<unknown> {
  const c = await getTdClient();
  return c.invoke({
    _: "checkAuthenticationPassword",
    password: String(password || ""),
  });
}

export async function resolveChatId(urlOrUser: string): Promise<{
  chatId: number;
  title: string;
  username?: string;
}> {
  const c = await getTdClient();
  const username = urlOrUser.includes("t.me") || urlOrUser.startsWith("@")
    ? urlOrUser.replace(/^@/, "").replace(/^https?:\/\/(t\.me|telegram\.me)\//i, "").split("/")[0]
    : urlOrUser;

  if (/^-?\d+$/.test(String(urlOrUser).trim())) {
    const chat = await c.invoke({
      _: "getChat",
      chat_id: Number(urlOrUser),
    });
    return {
      chatId: Number(chat.id),
      title: String(chat.title || ""),
      username: undefined,
    };
  }

  const pub = await c.invoke({
    _: "searchPublicChat",
    username: username.replace(/[^\w\d_]/g, ""),
  });
  const chatId = Number(pub.id);
  await c.invoke({ _: "openChat", chat_id: chatId }).catch(() => null);
  return {
    chatId,
    title: String(pub.title || username),
    username,
  };
}

function messageText(msg: Record<string, unknown>): string {
  const content = msg.content as Record<string, unknown> | undefined;
  if (!content) return "";
  if (content._ === "messageText") {
    const text = content.text as { text?: string } | undefined;
    return String(text?.text || "");
  }
  if (content._ === "messagePhoto" || content._ === "messageDocument") {
    const cap = content.caption as { text?: string } | undefined;
    return String(cap?.text || "");
  }
  return "";
}

function messageLink(username: string | undefined, chatId: number, messageId: number): string {
  if (username) return `https://t.me/${username}/${messageId}`;
  // private / supergroup without username
  const abs = String(chatId).replace(/^-100/, "");
  return `https://t.me/c/${abs}/${messageId}`;
}

function chatUsername(chat: Record<string, unknown>): string | undefined {
  const usernames = chat.usernames as Record<string, unknown> | undefined;
  const active = Array.isArray(usernames?.active_usernames) ? usernames.active_usernames : [];
  const username = String(active[0] || "").trim();
  return username || undefined;
}

function chatIsChannel(chat: Record<string, unknown>): boolean {
  const type = chat.type as Record<string, unknown> | undefined;
  return type?._ === "chatTypeSupergroup" && type.is_channel === true;
}

/**
 * Review the public channel linked to a user's Telegram profile, if TDLib
 * reports one. This intentionally never guesses ownership from a username or
 * avatar: personal_chat_id is the only ownership signal used here.
 */
export async function reviewLinkedChannel(
  userId: string,
  queries = ["нейронки", "нейросети", "AI", "ИИ", "ChatGPT", "LLM"],
  perQueryLimit = 5,
): Promise<TelegramLinkedChannelReview> {
  const c = await getTdClient();
  await assertPremium(c);
  const normalizedUserId = String(userId || "").trim();
  if (!/^\d+$/.test(normalizedUserId)) throw new Error("userId must be a numeric Telegram user id");
  const checkedAt = new Date().toISOString();
  const normalizedQueries = [...new Set(queries.map((query) => String(query || "").trim()).filter(Boolean))].slice(0, 8);
  const full = await c.invoke({ _: "getUserFullInfo", user_id: Number(normalizedUserId) });
  const channelId = Number(full.personal_chat_id || 0);
  if (!channelId) {
    return {
      userId: normalizedUserId,
      status: "not_found",
      ownership: "unknown",
      checkedAt,
      queries: normalizedQueries,
      topicHits: [],
    };
  }

  const chat = await c.invoke({ _: "getChat", chat_id: channelId });
  const username = chatUsername(chat);
  if (!chatIsChannel(chat) || !username) {
    return {
      userId: normalizedUserId,
      status: "linked_non_public_chat",
      ownership: "telegram_linked",
      channelId,
      title: String(chat.title || "") || undefined,
      checkedAt,
      queries: normalizedQueries,
      topicHits: [],
    };
  }

  const topicHits: TelegramLinkedChannelReview["topicHits"] = [];
  const seen = new Set<string>();
  const limit = Math.min(Math.max(Math.floor(perQueryLimit) || 5, 1), 10);
  for (const query of normalizedQueries) {
    const result = await c.invoke({
      _: "searchChatMessages",
      chat_id: channelId,
      query,
      from_message_id: 0,
      offset: 0,
      limit,
      filter: { _: "searchMessagesFilterEmpty" },
      message_thread_id: 0,
    });
    const messages = (result.messages as Record<string, unknown>[]) || [];
    for (const message of messages) {
      const messageId = Number(message.id || 0);
      const text = messageText(message).trim();
      if (!messageId || !text || seen.has(String(messageId))) continue;
      seen.add(String(messageId));
      const dateSec = Number(message.date || 0);
      topicHits.push({
        messageId,
        date: dateSec ? new Date(dateSec * 1000).toISOString() : checkedAt,
        text: text.slice(0, 1000),
        link: `https://t.me/${username}/${messageId}`,
        query,
      });
    }
  }

  return {
    userId: normalizedUserId,
    status: "linked_public_channel",
    ownership: "telegram_linked",
    channelId,
    title: String(chat.title || "") || undefined,
    username,
    link: `https://t.me/${username}`,
    checkedAt,
    queries: normalizedQueries,
    topicHits: topicHits.slice(0, 40),
  };
}

export async function searchChat(
  chatRef: string,
  query: string,
  limit = 20,
  since?: string,
): Promise<TgMessageHit[]> {
  const c = await getTdClient();
  await assertPremium(c);
  const { chatId, title, username } = await resolveChatId(chatRef);
  await c.invoke({ _: "openChat", chat_id: chatId }).catch(() => null);

  const q = String(query || "").trim();
  const lim = Math.min(Math.max(Number(limit) || 20, 1), 50);
  const cutoff = since ? new Date(since).getTime() : 0;

  let messages: Record<string, unknown>[] = [];
  if (q) {
    const res = await c.invoke({
      _: "searchChatMessages",
      chat_id: chatId,
      query: q,
      from_message_id: 0,
      offset: 0,
      limit: lim,
      filter: { _: "searchMessagesFilterEmpty" },
      message_thread_id: 0,
    });
    messages = (res.messages as Record<string, unknown>[]) || [];
  } else {
    const res = await c.invoke({
      _: "getChatHistory",
      chat_id: chatId,
      from_message_id: 0,
      offset: 0,
      limit: lim,
      only_local: false,
    });
    messages = (res.messages as Record<string, unknown>[]) || [];
  }

  const out: TgMessageHit[] = [];
  for (const msg of messages) {
    const text = messageText(msg).trim();
    if (!text) continue;
    const messageId = Number(msg.id);
    const dateSec = Number(msg.date || 0);
    if (cutoff && dateSec * 1000 < cutoff) continue;
    const link = messageLink(username, chatId, messageId);
    const titleLine = text.split("\n").find((l) => l.trim()) || title;
    out.push({
      id: `tg_${chatId}_${messageId}`,
      platform: "telegram",
      kind: "gig",
      title: titleLine.slice(0, 160),
      description: text.slice(0, 4000),
      link,
      date: dateSec ? new Date(dateSec * 1000).toISOString() : new Date().toISOString(),
      chat: title,
      chatId,
      messageId,
    });
  }
  return out;
}

/** Mark one Telegram chat inbox as read after an explicit user confirmation. */
export async function markChatRead(
  chatRef: string,
): Promise<{ ok: true; peer: string; chatId: number; readStateCleared: boolean }> {
  const c = await getTdClient();
  const { chatId, title, username } = await resolveChatId(chatRef);
  await c.invoke({ _: "openChat", chat_id: chatId }).catch(() => null);
  const history = await c.invoke({
    _: "getChatHistory",
    chat_id: chatId,
    from_message_id: 0,
    offset: 0,
    limit: 1,
    only_local: false,
  });
  const latest = Array.isArray(history?.messages) ? history.messages[0] : undefined;
  const maxMessageId = Number(latest?.id || 0);
  if (maxMessageId > 0) {
    await c.invoke({
      _: "readChatInbox",
      chat_id: chatId,
      max_message_id: maxMessageId,
      force_read: true,
    });
  }
  return {
    ok: true,
    peer: username ? `@${username}` : title || String(chatId),
    chatId,
    readStateCleared: maxMessageId > 0,
  };
}

/**
 * Send one plain-text message through TDLib.
 * The caller must enforce the account Premium gate and explicit confirmation.
 */
export async function sendMessage(
  to: string,
  text: string,
): Promise<{ ok: true; peer: string; chatId: number; messageId: number; link?: string }> {
  const c = await getTdClient();
  await assertPremium(c);
  const body = String(text || "").trim();
  if (!body) throw new Error("text must not be empty");
  if (body.length > 4096) throw new Error("text must be 4096 characters or less");

  const { chatId, title, username } = await resolveChatId(to);
  const result = await c.invoke({
    _: "sendMessage",
    chat_id: chatId,
    input_message_content: {
      _: "inputMessageText",
      text: {
        _: "formattedText",
        text: body,
      },
      clear_draft: true,
    },
  });
  const messageId = Number(result.id || 0);
  return {
    ok: true,
    peer: username ? `@${username}` : title || String(chatId),
    chatId,
    messageId,
    link: username && messageId ? `https://t.me/${username}/${messageId}` : undefined,
  };
}

/** Add one standard emoji reaction to one existing Telegram message. */
export async function addMessageReaction(
  chatRef: string,
  messageId: number,
  reaction: string,
  expectedText?: string,
): Promise<{ ok: true; chat: string; chatId: number; messageId: number; reaction: string; link?: string }> {
  const c = await getTdClient();
  await assertPremium(c);
  const emoji = String(reaction || "").trim();
  const id = Number(messageId);
  if (!Number.isInteger(id) || id <= 0) throw new Error("Telegram message_id must be a positive integer");
  if (!emoji || emoji.length > 32) throw new Error("reaction must be one standard emoji (up to 32 characters)");

  const { chatId, title, username } = await resolveChatId(chatRef);
  const history = await c.invoke({
    _: "getChatHistory",
    chat_id: chatId,
    from_message_id: id,
    offset: 0,
    limit: 1,
    only_local: false,
  });
  const target = Array.isArray(history?.messages)
    ? (history.messages as Record<string, unknown>[]).find((message) => Number(message.id) === id)
    : undefined;
  if (!target) throw new Error(`Telegram message ${id} was not found in ${chatRef}`);
  if (expectedText !== undefined && messageText(target).trim() !== String(expectedText).trim()) {
    throw new Error("Telegram target text does not match expected_text; no reaction was added");
  }

  await c.invoke({
    _: "addMessageReaction",
    chat_id: chatId,
    message_id: id,
    reaction_type: { _: "reactionTypeEmoji", emoji },
    is_big: false,
    update_recent_reactions: true,
  });
  return {
    ok: true,
    chat: username ? `@${username}` : title || String(chatId),
    chatId,
    messageId: id,
    reaction: emoji,
    link: messageLink(username, chatId, id),
  };
}

export async function closeTdClient(): Promise<void> {
  if (!client) return;
  try {
    await client.invoke({ _: "close" });
  } catch {
    /* ignore */
  }
  client = null;
  configured = false;
}

export function lastLoadError(): string | null {
  return loadError;
}
