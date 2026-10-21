/**
 * GramJS (pure JS MTProto) — works on win32-arm64 where prebuilt-tdlib does not.
 * Session: ADS_MCP_DATA/telegram/gramjs.session
 */
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { resolveDataDir } from "../env.js";
import QRCode from "qrcode";
import { tgApiHash, tgApiId, tgCredentialsConfigured } from "./credentials.js";
import type {
  TelegramAccountIdentity,
  TelegramChannelLinkedDiscussion,
  TelegramPeerActivity,
  TelegramChannelTopicHit,
  TelegramLinkedChannelReview,
  TelegramUnreadHumanSnapshot,
  TelegramPublicPostSearchResult,
  TelegramChatWritePreflight,
  TelegramChannelDirectMessagePreflight,
  TdAuthState,
  TgMessageHit,
} from "./types.js";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AnyClient = any;

let client: AnyClient | null = null;
let teleprotoClient: AnyClient | null = null;
let publicPostSearchTail: Promise<void> = Promise.resolve();

export type GramjsQrLoginStatus = {
  state: "idle" | "starting" | "wait_qr" | "wait_password" | "ready" | "error";
  url?: string;
  dataUrl?: string;
  expiresAt?: string;
  passwordHint?: string;
  error?: string;
};

let qrLogin: GramjsQrLoginStatus & {
  passwordResolve?: (password: string) => void;
  promise?: Promise<void>;
} = { state: "idle" };

function getAccountIdentity(me: AnyClient): TelegramAccountIdentity | undefined {
  const id = String(me?.id || "").trim();
  if (!id) return undefined;
  const name = [me?.firstName, me?.lastName]
    .map((value) => String(value || "").trim())
    .filter(Boolean)
    .join(" ");
  const username = String(me?.username || "").trim();
  return {
    id,
    ...(name ? { name } : {}),
    ...(username ? { username } : {}),
    isPremium: me?.premium === true || me?.isPremium === true,
  };
}

async function assertPremium(c: AnyClient): Promise<void> {
  const me = await c.getMe();
  if (!(me?.premium === true || me?.isPremium === true)) {
    throw new Error("Telegram Premium is required for Telegram account search and message sending");
  }
}

function activeSendRestriction(rights: AnyClient): boolean {
  if (!rights?.sendMessages) return false;
  const untilDate = Number(rights.untilDate || 0);
  return untilDate <= 0 || untilDate > Math.floor(Date.now() / 1000);
}

export function gramjsSessionPath(): string {
  const dir = join(resolveDataDir(), "telegram");
  mkdirSync(dir, { recursive: true });
  return join(dir, "gramjs.session");
}

export function hasGramjsSession(): boolean {
  try {
    const p = gramjsSessionPath();
    return existsSync(p) && readFileSync(p, "utf8").trim().length > 20;
  } catch {
    return false;
  }
}

export async function probeGramjs(): Promise<{
  ok: boolean;
  error?: string;
  install: string;
}> {
  const install = "Install the optional Telegram dependency with: npm install";
  try {
    await import("telegram");
    await import("telegram/sessions/index.js");
    return { ok: true, install };
  } catch (e) {
    return { ok: false, error: (e as Error)?.message || String(e), install };
  }
}

async function loadClientModules() {
  const telegram = await import("telegram");
  const sessions = await import("telegram/sessions/index.js");
  return {
    TelegramClient: (telegram as { TelegramClient: new (...a: unknown[]) => AnyClient }).TelegramClient,
    StringSession: (sessions as { StringSession: new (s?: string) => unknown }).StringSession,
    Api: (telegram as unknown as { Api: AnyClient }).Api,
  };
}

async function loadTeleprotoModules() {
  const teleproto = await import("teleproto");
  const sessions = teleproto.sessions as unknown as {
    StringSession: new (s?: string) => unknown;
  };
  return {
    TelegramClient: (teleproto as { TelegramClient: new (...a: unknown[]) => AnyClient }).TelegramClient,
    StringSession: sessions.StringSession,
    Api: (teleproto as unknown as { Api: AnyClient }).Api,
  };
}

export async function getGramjsClient(): Promise<AnyClient> {
  if (client) return client;
  if (!tgCredentialsConfigured()) {
    throw new Error("Set TELEGRAM_API_ID + TELEGRAM_API_HASH in .env (create an app at https://my.telegram.org/apps)");
  }
  const deps = await probeGramjs();
  if (!deps.ok) throw new Error(`${deps.error}. ${deps.install}`);

  const { TelegramClient, StringSession } = await loadClientModules();
  const saved = hasGramjsSession() ? readFileSync(gramjsSessionPath(), "utf8").trim() : "";
  const session = new StringSession(saved);
  client = new TelegramClient(session, tgApiId(), tgApiHash(), {
    connectionRetries: 5,
    deviceModel: "AdsMCP",
    appVersion: "0.1",
  });
  await client.connect();
  if (!(await client.checkAuthorization())) {
    await client.disconnect().catch(() => null);
    client = null;
    throw new Error("Not logged in — run: npm run telegram:account:login");
  }
  return client;
}

function qrStatus(): GramjsQrLoginStatus {
  return {
    state: qrLogin.state,
    ...(qrLogin.url ? { url: qrLogin.url } : {}),
    ...(qrLogin.dataUrl ? { dataUrl: qrLogin.dataUrl } : {}),
    ...(qrLogin.expiresAt ? { expiresAt: qrLogin.expiresAt } : {}),
    ...(qrLogin.passwordHint ? { passwordHint: qrLogin.passwordHint } : {}),
    ...(qrLogin.error ? { error: qrLogin.error } : {}),
  };
}

async function waitForQrState(timeoutMs = 2_000): Promise<void> {
  const startedAt = Date.now();
  while (qrLogin.state === "starting" && Date.now() - startedAt < timeoutMs) {
    await new Promise((resolve) => setTimeout(resolve, 25));
  }
}

/** Start a local QR login flow for the dashboard without exposing the token to a third party. */
export async function startGramjsQrLogin(): Promise<GramjsQrLoginStatus> {
  if (qrLogin.state === "wait_qr" || qrLogin.state === "wait_password" || qrLogin.state === "starting") {
    return qrStatus();
  }
  if (qrLogin.state === "ready") return qrStatus();
  if (!tgCredentialsConfigured()) {
    qrLogin = { state: "error", error: "Set TELEGRAM_API_ID + TELEGRAM_API_HASH in .env" };
    return qrStatus();
  }

  const { TelegramClient, StringSession } = await loadClientModules();
  const loginClient = new TelegramClient(new StringSession(""), tgApiId(), tgApiHash(), {
    connectionRetries: 5,
    deviceModel: "AdsMCP Dashboard",
    appVersion: "0.1",
  });
  qrLogin = { state: "starting" };
  qrLogin.promise = (async () => {
    try {
      await loginClient.connect();
      await loginClient.signInUserWithQrCode(
        { apiId: tgApiId(), apiHash: tgApiHash() },
        {
          qrCode: async (code: AnyClient) => {
            const token = Buffer.from(code.token).toString("base64url");
            const url = `tg://login?token=${token}`;
            const dataUrl = await QRCode.toDataURL(url, { errorCorrectionLevel: "M", margin: 2, width: 280 });
            const expires = Number(code.expires || 0);
            qrLogin = {
              ...qrLogin,
              state: "wait_qr",
              url,
              dataUrl,
              ...(expires > 0 ? { expiresAt: new Date(expires * 1000).toISOString() } : {}),
            };
          },
          password: async (hint: string) => new Promise<string>((resolve) => {
            qrLogin = { ...qrLogin, state: "wait_password", passwordHint: String(hint || "") };
            qrLogin.passwordResolve = resolve;
          }),
          onError: (error: unknown) => {
            const message = error instanceof Error ? error.message : String(error);
            if (!/readline was closed/i.test(message)) qrLogin = { ...qrLogin, error: message };
          },
        },
      );
      saveGramjsSession(loginClient);
      qrLogin = { state: "ready" };
    } catch (error) {
      qrLogin = { state: "error", error: error instanceof Error ? error.message : String(error) };
    } finally {
      await loginClient.disconnect().catch(() => null);
      qrLogin.passwordResolve = undefined;
      qrLogin.promise = undefined;
    }
  })();
  await waitForQrState();
  return qrStatus();
}

export function submitGramjsQrPassword(password: string): GramjsQrLoginStatus {
  if (qrLogin.state !== "wait_password" || !qrLogin.passwordResolve) {
    return { state: "error", error: "QR login is not waiting for a 2FA password" };
  }
  const resolve = qrLogin.passwordResolve;
  qrLogin.passwordResolve = undefined;
  resolve(String(password || ""));
  return qrStatus();
}

export function gramjsQrLoginStatus(): GramjsQrLoginStatus {
  return qrStatus();
}

/**
 * Teleproto is the maintained GramJS-compatible fork with the current TL
 * schema. It is used only for global full-text post search because the
 * archived GramJS schema bundled with the project predates channels.searchPosts
 * query support. It reuses the existing local GramJS StringSession.
 */
async function getTeleprotoSearchClient(): Promise<{ client: AnyClient; Api: AnyClient }> {
  if (teleprotoClient) {
    const { Api } = await loadTeleprotoModules();
    return { client: teleprotoClient, Api };
  }
  if (!tgCredentialsConfigured()) {
    throw new Error("Set TELEGRAM_API_ID + TELEGRAM_API_HASH in .env (create an app at https://my.telegram.org/apps)");
  }
  if (!hasGramjsSession()) {
    throw new Error("Not logged in — run: npm run telegram:account:login");
  }

  const { TelegramClient, StringSession, Api } = await loadTeleprotoModules();
  const saved = readFileSync(gramjsSessionPath(), "utf8").trim();
  const session = new StringSession(saved);
  teleprotoClient = new TelegramClient(session, tgApiId(), tgApiHash(), {
    connectionRetries: 5,
    deviceModel: "AdsMCP-Search",
    appVersion: "0.1",
  });
  await teleprotoClient.connect();
  if (!(await teleprotoClient.checkAuthorization())) {
    await teleprotoClient.disconnect().catch(() => null);
    teleprotoClient = null;
    throw new Error("Not logged in — run: npm run telegram:account:login");
  }
  return { client: teleprotoClient, Api };
}

function extractPublicContacts(about: string): string[] {
  const matches = about.match(/@[A-Za-z0-9_]{4,}|https?:\/\/[^\s]+|(?:t\.me|telegram\.me)\/[A-Za-z0-9_+/?=-]+/gi) || [];
  return Array.from(new Set(matches.map((value) => value.replace(/[),.;!?]+$/g, "")))).slice(0, 20);
}

function summarizeLinkedDiscussion(chat: AnyClient): TelegramChannelLinkedDiscussion {
  return {
    id: String(chat?.id || ""),
    ...(chat?.title ? { title: String(chat.title) } : {}),
    ...(chat?.username ? { username: String(chat.username) } : {}),
    entityType: chat?.megagroup === true
      ? "megagroup"
      : chat?.className === "Chat"
        ? "chat"
        : "unknown",
    isPublic: Boolean(String(chat?.username || "").trim()),
    ...(chat?.joinToSend === true ? { joinToSend: true } : {}),
    ...(chat?.joinRequest === true ? { joinRequest: true } : {}),
  };
}

async function getTeleprotoChannelDirectContext(channelRef: string): Promise<{
  client: AnyClient;
  channel: AnyClient;
  monoforum?: AnyClient;
  linkedMonoforumId?: string;
  linkedChatId?: string;
  linkedChat?: AnyClient;
  description?: string;
  contacts: string[];
  linkedDiscussionChecked: boolean;
  Api: AnyClient;
}> {
  await disconnectPrimaryClient();
  const { client, Api } = await getTeleprotoSearchClient();
  const ref = String(channelRef || "").trim();
  if (!ref) throw new Error("Telegram channel is required");
  const channel = await client.getEntity(parseUsername(ref));
  if (channel?.className !== "Channel" || channel?.broadcast !== true) {
    return { client, channel, contacts: [], linkedDiscussionChecked: false, Api };
  }

  const full = await client.invoke(
    new Api.channels.GetFullChannel({ channel: await client.getInputEntity(channel) }),
  );
  const description = String(full?.fullChat?.about || "").trim();
  const contacts = extractPublicContacts(description);
  const linkedChatId = full?.fullChat?.linkedChatId == null
    ? undefined
    : String(full.fullChat.linkedChatId);
  const linkedChat = (full?.chats || []).find(
    (chat: AnyClient) => linkedChatId && String(chat?.id || "") === linkedChatId,
  );
  const linkedMonoforumId = channel?.linkedMonoforumId == null
    ? undefined
    : String(channel.linkedMonoforumId);
  const monoforum = (full?.chats || []).find(
    (chat: AnyClient) => String(chat?.id || "") === linkedMonoforumId && chat?.monoforum === true,
  );
  return {
    client,
    channel,
    ...(monoforum ? { monoforum } : {}),
    ...(linkedMonoforumId ? { linkedMonoforumId } : {}),
    ...(linkedChatId ? { linkedChatId } : {}),
    ...(linkedChat ? { linkedChat } : {}),
    ...(description ? { description } : {}),
    contacts,
    linkedDiscussionChecked: true,
    Api,
  };
}

/** Check whether a broadcast channel accepts Direct Messages. */
export async function gramjsCheckChannelDirectMessages(
  channelRef: string,
): Promise<TelegramChannelDirectMessagePreflight> {
  const checkedAt = new Date().toISOString();
  const {
    client,
    channel,
    monoforum,
    linkedMonoforumId,
    linkedChatId,
    linkedChat,
    description,
    contacts,
    linkedDiscussionChecked,
  } = await getTeleprotoChannelDirectContext(channelRef);
  try {
    await assertPremium(client);
    const username = String(channel?.username || "").trim();
    const channelName = username ? `@${username}` : String(channel?.title || channelRef);
    const base = {
      channel: channelName,
      channelId: Number(channel?.id || 0),
      entityType: channel?.className === "Channel" && channel?.broadcast === true ? "broadcast" as const : "unknown" as const,
      checkedAt,
      ...(description ? { description } : {}),
      contacts,
      linkedDiscussionChecked,
      ...(linkedChatId ? { linkedChatId } : {}),
      ...(linkedChat ? { linkedDiscussion: summarizeLinkedDiscussion(linkedChat) } : {}),
    };
    if (base.entityType !== "broadcast") {
      return { ...base, directMessagesEnabled: false, canWrite: false, reason: "The target is not a broadcast channel." };
    }
    if (channel?.broadcastMessagesAllowed !== true || !linkedMonoforumId || !monoforum) {
      return {
        ...base,
        directMessagesEnabled: false,
        canWrite: false,
        ...(linkedMonoforumId ? { linkedMonoforumId } : {}),
        reason: linkedChatId
          ? "Direct Messages are not enabled; Telegram exposed a linked discussion chat, which was included in this preflight but is not written to automatically."
          : "Direct Messages are not enabled and Telegram did not expose a linked discussion chat.",
      };
    }
    return {
      ...base,
      directMessagesEnabled: true,
      canWrite: true,
      linkedMonoforumId,
      reason: linkedChatId
        ? "The channel accepts Direct Messages through its linked monoforum; the linked discussion chat was also checked and no public post will be created."
        : "The channel accepts Direct Messages through its linked monoforum; no linked discussion chat was exposed and no public post will be created.",
    };
  } finally {
    await disconnectTeleprotoClient();
  }
}

/** Send one message to a channel's Direct Messages monoforum. */
export async function gramjsSendChannelDirectMessage(
  channelRef: string,
  text: string,
): Promise<{ ok: true; peer: string; chatId: number; messageId: number; directChatId: string; readStateCleared: boolean; verified: boolean }> {
  const { client, channel, monoforum, linkedMonoforumId } = await getTeleprotoChannelDirectContext(channelRef);
  try {
    await assertPremium(client);
    const username = String(channel?.username || "").trim();
    const peer = username ? `@${username}` : String(channel?.title || channelRef);
    if (
      channel?.className !== "Channel" ||
      channel?.broadcast !== true ||
      channel?.broadcastMessagesAllowed !== true ||
      !linkedMonoforumId ||
      !monoforum
    ) {
      throw new Error("Telegram channel Direct Messages are not enabled for this channel");
    }
    const sent = await client.sendMessage(monoforum, { message: String(text) });
    const messageId = Number(sent?.id || 0);
    let verified = false;
    try {
      const fetched = await client.getMessages(monoforum, { ids: [messageId] });
      const message = Array.isArray(fetched) ? fetched[0] : fetched;
      verified =
        Number(message?.id || 0) === messageId &&
        message?.out === true &&
        String(message?.message || "") === String(text);
    } catch {
      verified = false;
    }
    let readStateCleared = false;
    try {
      readStateCleared = (await client.markAsRead(monoforum)) === true;
    } catch {
      // Sending succeeded; read-state cleanup is best effort.
    }
    return {
      ok: true,
      peer,
      chatId: Number(channel?.id || 0),
      messageId,
      directChatId: linkedMonoforumId,
      readStateCleared,
      verified,
    };
  } finally {
    await disconnectTeleprotoClient();
  }
}

export function saveGramjsSession(c: AnyClient): void {
  const s = String(c.session.save());
  writeFileSync(gramjsSessionPath(), s, "utf8");
}

export async function gramjsAuthState(): Promise<{
  state: TdAuthState;
  raw?: string;
  hint?: string;
  account?: TelegramAccountIdentity;
  qr?: GramjsQrLoginStatus;
}> {
  const deps = await probeGramjs();
  if (!deps.ok) {
    return { state: "missing_deps", hint: deps.install };
  }
  if (!tgCredentialsConfigured()) {
    return {
      state: "missing_credentials",
      hint: "TELEGRAM_API_ID + TELEGRAM_API_HASH in .env (https://my.telegram.org/apps)",
    };
  }
  if (qrLogin.state === "starting" || qrLogin.state === "wait_qr" || qrLogin.state === "wait_password") {
    return {
      state: qrLogin.state === "wait_password" ? "wait_password" : "wait_qr",
      hint: qrLogin.state === "wait_password" ? "Введите пароль облачной 2FA" : "Отсканируйте QR-код в Telegram на телефоне",
      qr: qrStatus(),
    };
  }
  if (!hasGramjsSession()) {
    return {
      state: "wait_phone",
      hint: "Run in terminal: npm run telegram:account:login",
    };
  }
  try {
    const c = await getGramjsClient();
    const me = await c.getMe();
    return {
      state: "ready",
      raw: `gramjs:${me?.username || me?.id || "ok"}`,
      account: getAccountIdentity(me),
      hint: "ads_telegram_account_search",
    };
  } catch (e) {
    return {
      state: "wait_phone",
      hint: (e as Error)?.message || String(e),
    };
  }
}

function parseUsername(ref: string): string {
  const raw = String(ref || "").trim();
  if (raw.startsWith("@")) return raw.slice(1);
  const m = raw.match(/(?:t\.me|telegram\.me)\/(?:s\/)?([A-Za-z0-9_]+)/i);
  if (m) return m[1];
  return raw.replace(/[^\w\d_]/g, "");
}

export async function gramjsGetPeerActivity(peerRef: string, maxInactiveDays = 30): Promise<TelegramPeerActivity> {
  const c = await getGramjsClient();
  const ref = String(peerRef || "").trim();
  if (!ref) throw new Error("Telegram peer is required");
  const arg = ref.startsWith("+") || /^-?\d+$/.test(ref) ? ref : parseUsername(ref);
  let entity: AnyClient;
  try {
    entity = await c.getEntity(arg);
  } catch (error) {
    if (!/^-?\d+$/.test(ref)) throw error;
    const dialogs = await c.getDialogs({ limit: 500 });
    const dialog = dialogs.find((item: AnyClient) => String(item?.entity?.id || "") === ref);
    if (!dialog?.entity) throw error;
    entity = dialog.entity;
  }

  const checkedAt = new Date().toISOString();
  const statusClass = String(entity?.status?.className || "");
  const hasAvatar = Boolean(entity?.photo);
  if (statusClass === "UserStatusOnline") {
    return { peer: ref, checkedAt, status: "online", hasAvatar, ageDays: 0, eligible: true, reason: "Telegram profile is online" };
  }
  if (statusClass === "UserStatusRecently") {
    return { peer: ref, checkedAt, status: "recently", hasAvatar, eligible: true, reason: "Telegram exposes recent activity" };
  }
  if (statusClass === "UserStatusLastWeek") {
    return { peer: ref, checkedAt, status: "last_week", hasAvatar, eligible: true, reason: "Telegram exposes activity within the last week" };
  }
  if (statusClass === "UserStatusLastMonth") {
    return { peer: ref, checkedAt, status: "last_month", hasAvatar, eligible: true, reason: "Telegram exposes activity within the last month" };
  }
  if (statusClass === "UserStatusOffline") {
    const wasOnline = numberValue(entity?.status?.wasOnline ?? entity?.status?.originalArgs?.wasOnline);
    if (wasOnline > 0) {
      const lastSeenAt = new Date(wasOnline * 1000).toISOString();
      const ageDays = Math.max(0, Math.floor((Date.now() - wasOnline * 1000) / 86_400_000));
      return {
        peer: ref,
        checkedAt,
        status: "offline",
        hasAvatar,
        lastSeenAt,
        ageDays,
        eligible: ageDays <= maxInactiveDays,
        reason:
          ageDays <= maxInactiveDays
            ? `Last seen ${ageDays} day(s) ago`
            : `Last seen ${ageDays} day(s) ago, older than the ${maxInactiveDays}-day limit`,
      };
    }
  }

  return {
    peer: ref,
    checkedAt,
    status: "unknown",
    hasAvatar,
    eligible: hasAvatar,
    reason: hasAvatar
      ? "Last-seen status is hidden, but the Telegram profile has an avatar"
      : "Telegram did not expose a usable last-seen status and the profile has no avatar",
  };
}

function messageDate(value: AnyClient): string {
  const raw = value?.date;
  if (raw instanceof Date) return raw.toISOString();
  const n = numberValue(raw);
  if (!Number.isFinite(n) || n <= 0) return new Date().toISOString();
  return new Date(n < 1_000_000_000_000 ? n * 1000 : n).toISOString();
}

function numberValue(value: unknown): number {
  if (typeof value === "bigint") return Number(value);
  if (value && typeof value === "object" && "value" in value) {
    return numberValue((value as { value?: unknown }).value);
  }
  return Number(value ?? 0);
}

async function withTimeout<T>(operation: Promise<T>, timeoutMs: number, label: string): Promise<T> {
  let timer: ReturnType<typeof setTimeout> | undefined;
  try {
    return await Promise.race([
      operation,
      new Promise<T>((_, reject) => {
        timer = setTimeout(() => reject(new Error(label)), timeoutMs);
      }),
    ]);
  } finally {
    if (timer) clearTimeout(timer);
  }
}

function entityDisplayName(entity: AnyClient): string {
  return [entity?.firstName, entity?.lastName]
    .map((value) => String(value || "").trim())
    .filter(Boolean)
    .join(" ") || String(entity?.username || entity?.id || "Telegram contact");
}

/**
 * Fast, read-only snapshot of unread one-to-one human chats.
 * It intentionally reads only the dialog list and each dialog's latest message;
 * it does not call readHistory/readMessages and never changes Telegram read state.
 */
export async function gramjsListUnreadHumanChats(limit = 50): Promise<TelegramUnreadHumanSnapshot> {
  const c = await getGramjsClient();
  const checkedAt = new Date().toISOString();
  const boundedLimit = Math.min(Math.max(Number(limit) || 50, 1), 100);
  const dialogs = await c.getDialogs({ limit: 500 });
  const humanDialogs = dialogs.filter((dialog: AnyClient) => {
    const entity = dialog?.entity;
    return entity?.className === "User" && entity?.bot !== true && Number(dialog?.unreadCount || 0) > 0;
  });
  const chats = humanDialogs.slice(0, boundedLimit).map((dialog: AnyClient) => {
    const entity = dialog.entity;
    const latest = dialog.message;
    const text = String(latest?.message || "").trim();
    return {
      telegramUserId: String(entity.id),
      ...(String(entity.username || "").trim() ? { username: String(entity.username).trim() } : {}),
      displayName: entityDisplayName(entity),
      unreadCount: Number(dialog.unreadCount || 0),
      ...(latest?.id
        ? {
            latestMessage: {
              messageId: Number(latest.id),
              date: messageDate(latest),
              ...(text ? { text: text.slice(0, 4000) } : {}),
              incoming: latest.out !== true,
            },
          }
        : {}),
    };
  });
  return {
    checkedAt,
    backend: "gramjs",
    totalUnreadHumanDialogs: humanDialogs.length,
    returnedDialogs: chats.length,
    chats,
  };
}

/** Mark one human Telegram dialog as read after an explicit user confirmation. */
export async function gramjsMarkChatRead(
  peerRef: string,
): Promise<{ ok: true; peer: string; chatId: number; readStateCleared: boolean }> {
  const c = await getGramjsClient();
  const ref = String(peerRef || "").trim();
  if (!ref) throw new Error("Telegram chat is required");
  const arg = ref.startsWith("+") || /^-?\d+$/.test(ref) ? ref : parseUsername(ref);
  let entity: AnyClient;
  try {
    entity = await c.getEntity(arg);
  } catch (error) {
    if (!/^-?\d+$/.test(ref)) throw error;
    const dialogs = await c.getDialogs({ limit: 500 });
    const dialog = dialogs.find((item: AnyClient) => String(item?.entity?.id || "") === ref);
    if (!dialog?.entity) throw error;
    entity = dialog.entity;
  }
  if (entity?.className !== "User" || entity?.bot === true) {
    throw new Error("Only one-to-one human Telegram chats can be marked read");
  }
  const readStateCleared = (await c.markAsRead(entity)) === true;
  const chatId = Number(entity.id ?? 0);
  const username = String(entity.username || "").trim();
  return {
    ok: true,
    peer: username ? `@${username}` : String(chatId),
    chatId,
    readStateCleared,
  };
}

export async function gramjsSearchChat(
  chatRef: string,
  query: string,
  limit = 20,
  since?: string,
): Promise<TgMessageHit[]> {
  const c = await getGramjsClient();
  await assertPremium(c);
  const username = parseUsername(chatRef);
  const entity = await c.getEntity(username.startsWith("+") || /^-?\d+$/.test(chatRef) ? chatRef : username);
  const requested = Math.min(Math.max(Number(limit) || 20, 1), 50);
  const cutoff = since ? new Date(since).getTime() : 0;
  const lim = cutoff ? 50 : requested;
  const q = String(query || "").trim();

  const out: TgMessageHit[] = [];
  const opts: Record<string, unknown> = { limit: lim };
  if (q) opts.search = q;

  for await (const msg of c.iterMessages(entity, opts)) {
    const text = String(msg.message || "").trim();
    if (!text) continue;
    const messageId = Number(msg.id);
    const chatId = Number(entity.id ?? msg.chatId ?? 0);
    const uname = entity.username || username;
    const link = uname
      ? `https://t.me/${uname}/${messageId}`
      : `https://t.me/c/${String(chatId).replace(/^-100/, "")}/${messageId}`;
    const title = entity.title || entity.firstName || uname || "telegram";
    const dateMs = msg.date ? Number(msg.date) * 1000 : Date.now();
    const date = new Date(dateMs).toISOString();
    const titleLine = text.split("\n").find((l: string) => l.trim()) || String(title);
    if (cutoff && dateMs < cutoff) continue;
    out.push({
      id: `tg_${chatId}_${messageId}`,
      platform: "telegram",
      kind: "gig",
      title: titleLine.slice(0, 160),
      description: text.slice(0, 4000),
      link,
      date,
      chat: String(title),
      chatId,
      messageId,
    });
    if (out.length >= requested) break;
  }
  return out;
}

/** Search public Telegram channel posts globally using the Premium post-search quota. */
export async function gramjsSearchPublicPosts(
  query: string,
  limit = 20,
  options?: { confirmPaid?: boolean; maxPaidStars?: number },
): Promise<TelegramPublicPostSearchResult> {
  const run = publicPostSearchTail.then(() => runGramjsSearchPublicPosts(query, limit, options));
  publicPostSearchTail = run.then(() => undefined, () => undefined);
  return run;
}

async function disconnectPrimaryClient(): Promise<void> {
  if (!client) return;
  try {
    await client.disconnect();
  } catch {
    /* ignore */
  }
  client = null;
}

async function disconnectTeleprotoClient(): Promise<void> {
  if (!teleprotoClient) return;
  try {
    await teleprotoClient.disconnect();
  } catch {
    /* ignore */
  }
  teleprotoClient = null;
}

async function runGramjsSearchPublicPosts(
  query: string,
  limit = 20,
  options?: { confirmPaid?: boolean; maxPaidStars?: number },
): Promise<TelegramPublicPostSearchResult> {
  const normalizedQuery = String(query || "").trim();
  if (!normalizedQuery) throw new Error("A non-empty full-text query is required");

  // GramJS and Teleproto must not stay connected at the same time while
  // reusing one local account session. Otherwise Telegram updates can be
  // decoded with the wrong TL layer and the GramJS update loop crashes.
  await disconnectPrimaryClient();
  await disconnectTeleprotoClient();

  try {
    const { client: c, Api } = await getTeleprotoSearchClient();
    await assertPremium(c);
    const checkedAt = new Date().toISOString();
    const boundedLimit = Math.min(Math.max(Number(limit) || 20, 1), 50);
    const flood = await withTimeout<AnyClient>(
      c.invoke(new Api.channels.CheckSearchPostsFlood({ query: normalizedQuery })),
      25_000,
      "Telegram public-post quota check timed out",
    );
    const totalDaily = numberValue(flood?.totalDaily);
    const remainingFree = numberValue(flood?.remains);
    const queryIsFree = flood?.queryIsFree === true;
    const starsAmount = numberValue(flood?.starsAmount);
    const paymentRequired = !queryIsFree && (!Number.isFinite(remainingFree) || remainingFree <= 0);
    const confirmPaid = options?.confirmPaid === true;
    const maxPaidStars = Number(options?.maxPaidStars);

    if (paymentRequired && (!confirmPaid || !Number.isFinite(maxPaidStars) || maxPaidStars < starsAmount || starsAmount <= 0)) {
      return {
        ok: false,
        status: "payment_required",
        backend: "teleproto",
        query: normalizedQuery,
        checkedAt,
        ...(Number.isFinite(totalDaily) ? { totalDaily } : {}),
        ...(Number.isFinite(remainingFree) ? { remainingFree } : {}),
        queryIsFree,
        ...(Number.isFinite(starsAmount) ? { starsAmount } : {}),
        paidSearchAttempted: false,
        results: [],
      };
    }

    const request: Record<string, unknown> = {
      query: normalizedQuery,
      offsetRate: 0,
      offsetPeer: new Api.InputPeerEmpty(),
      offsetId: 0,
      limit: boundedLimit,
    };
    if (paymentRequired) request.allowPaidStars = BigInt(starsAmount);

    const response = await withTimeout<AnyClient>(
      c.invoke(new Api.channels.SearchPosts(request)),
      35_000,
      "Telegram public-post search timed out",
    );
    const chats = new Map<string, AnyClient>();
    for (const chat of response?.chats || []) chats.set(String(numberValue(chat?.id)), chat);

    const results = (response?.messages || []).map((msg: AnyClient) => {
      const messageId = numberValue(msg?.id);
      const chatId = numberValue(msg?.peerId?.channelId ?? msg?.chatId);
      const chat = chats.get(String(chatId));
      const username = String(chat?.username || "").trim();
      const chatTitle = String(chat?.title || username || chatId || "Telegram channel").trim();
      const text = String(msg?.message || "").trim();
      const title = text.split("\n").find((line: string) => line.trim()) || chatTitle;
      return {
        id: `tg_public_${chatId}_${messageId}`,
        platform: "telegram" as const,
        kind: "public_post" as const,
        title: title.slice(0, 160),
        description: text.slice(0, 4000),
        ...(username && messageId ? { link: `https://t.me/${username}/${messageId}` } : {}),
        date: messageDate(msg),
        chat: chatTitle,
        chatId,
        messageId,
      };
    });

    const responseFlood = response?.searchFlood;
    const responseRemaining = numberValue(responseFlood?.remains);
    return {
      ok: true,
      status: "ok",
      backend: "teleproto",
      query: normalizedQuery,
      checkedAt,
      ...(Number.isFinite(totalDaily) ? { totalDaily } : {}),
      ...(Number.isFinite(responseRemaining) ? { remainingFree: responseRemaining } : Number.isFinite(remainingFree) ? { remainingFree } : {}),
      queryIsFree,
      ...(Number.isFinite(starsAmount) ? { starsAmount } : {}),
      paidSearchAttempted: paymentRequired,
      results,
    };
  } finally {
    await disconnectTeleprotoClient();
  }
}

/** Review only the public channel Telegram officially links to a user's profile. */
export async function gramjsReviewLinkedChannel(
  userId: string,
  queries = ["нейронки", "нейросети", "AI", "ИИ", "ChatGPT", "LLM"],
  perQueryLimit = 5,
): Promise<TelegramLinkedChannelReview> {
  const c = await getGramjsClient();
  await assertPremium(c);
  const { Api } = await loadClientModules();
  const user = await c.getEntity(userId);
  const full = await c.invoke(new Api.users.GetFullUser({ id: user }));
  const fullUser = full?.fullUser;
  const personalChannelId = fullUser?.personalChannelId;
  const checkedAt = new Date().toISOString();
  const normalizedQueries = Array.from(
    new Set((queries || []).map((query) => String(query).trim()).filter(Boolean)),
  ).slice(0, 8);
  const boundedLimit = Math.min(Math.max(Number(perQueryLimit) || 5, 1), 10);

  const base = {
    userId: String(userId),
    checkedAt,
    queries: normalizedQueries,
    topicHits: [] as TelegramChannelTopicHit[],
  };
  if (!personalChannelId) return { ...base, status: "not_found", ownership: "unknown" };

  const channel = (full?.chats || []).find(
    (chat: AnyClient) => String(chat?.id) === String(personalChannelId),
  );
  const username = String(channel?.username || "").trim();
  if (!channel || !username) {
    return {
      ...base,
      status: "linked_non_public_chat",
      ownership: "telegram_linked",
      channelId: Number(personalChannelId),
      title: String(channel?.title || "").trim() || undefined,
    };
  }

  const topicHits: TelegramChannelTopicHit[] = [];
  const seen = new Set<string>();
  for (const query of normalizedQueries) {
    for await (const msg of c.iterMessages(channel, { search: query, limit: boundedLimit })) {
      const messageId = Number(msg?.id || 0);
      const text = String(msg?.message || "").trim();
      if (!messageId || !text || seen.has(String(messageId))) continue;
      seen.add(String(messageId));
      const date = msg?.date ? new Date(Number(msg.date) * 1000).toISOString() : checkedAt;
      topicHits.push({
        messageId,
        date,
        text: text.slice(0, 1000),
        link: `https://t.me/${username}/${messageId}`,
        query,
      });
      if (topicHits.length >= 40) break;
    }
    if (topicHits.length >= 40) break;
  }

  return {
    ...base,
    status: "linked_public_channel",
    ownership: "telegram_linked",
    channelId: Number(personalChannelId),
    title: String(channel.title || "").trim() || undefined,
    username,
    link: `https://t.me/${username}`,
    topicHits,
  };
}

/** Send one message to a user/chat from the logged-in account. */
export async function gramjsSendMessage(
  to: string,
  text: string,
): Promise<{ ok: true; peer: string; chatId: number; messageId: number; link?: string; readStateCleared: boolean }> {
  const c = await getGramjsClient();
  await assertPremium(c);
  const ref = String(to || "").trim();
  const arg = ref.startsWith("+") || /^-?\d+$/.test(ref) ? ref : parseUsername(ref);
  let entity: AnyClient;
  try {
    entity = await c.getEntity(arg);
  } catch (error) {
    if (!/^-?\d+$/.test(ref)) throw error;
    const dialogs = await c.getDialogs({ limit: 500 });
    const dialog = dialogs.find((item: AnyClient) => String(item?.entity?.id || "") === ref);
    if (!dialog?.entity) throw error;
    entity = dialog.entity;
  }
  const res = await c.sendMessage(entity, { message: String(text) });
  let readStateCleared = false;
  try {
    readStateCleared = (await c.markAsRead(entity)) === true;
  } catch {
    // Sending has already succeeded; do not turn a read-state cleanup issue
    // into a failed delivery.
  }
  const messageId = Number(res?.id ?? 0);
  const chatId = Number(entity.id ?? 0);
  const uname = entity.username as string | undefined;
  return {
    ok: true,
    peer: uname ? "@" + uname : String(chatId),
    chatId,
    messageId,
    readStateCleared,
    link: uname && messageId ? `https://t.me/${uname}/${messageId}` : undefined,
  };
}

/** Reply publicly to one broadcast-channel post through its linked discussion. */
export async function gramjsReplyToPublicPost(
  channelRef: string,
  messageId: number,
  text: string,
): Promise<{ ok: true; channel: string; messageId: number; link?: string }> {
  const c = await getGramjsClient();
  await assertPremium(c);
  const entity = await c.getEntity(parseUsername(channelRef));
  const res = await c.sendMessage(entity, {
    message: String(text),
    commentTo: Number(messageId),
  });
  const sentId = Number(res?.id ?? 0);
  const username = String(entity?.username || "").trim();
  return {
    ok: true,
    channel: username ? `@${username}` : String(entity?.id || channelRef),
    messageId: sentId,
    link: username && sentId ? `https://t.me/${username}/${sentId}` : undefined,
  };
}

/**
 * Check group membership and obvious Telegram write restrictions before a
 * public reply. This is deliberately fail-closed: membership alone is not
 * treated as permission to write, and an inconclusive participant lookup
 * blocks the write.
 */
export async function gramjsCheckChatWriteAccess(
  chatRef: string,
): Promise<TelegramChatWritePreflight> {
  const c = await getGramjsClient();
  await assertPremium(c);
  const ref = String(chatRef || "").trim();
  if (!ref) throw new Error("Telegram chat is required");

  const entity = await c.getEntity(parseUsername(ref));
  const username = String(entity?.username || "").trim();
  const chat = username ? `@${username}` : String(entity?.title || ref);
  const chatId = Number(entity?.id || 0);
  const checkedAt = new Date().toISOString();
  const entityType: TelegramChatWritePreflight["entityType"] =
    entity?.className === "Chat"
      ? "chat"
      : entity?.className === "Channel" && entity?.broadcast === true
        ? "broadcast"
        : entity?.className === "Channel" && entity?.megagroup === true
          ? "megagroup"
          : "unknown";

  const base = { chat, chatId, entityType, checkedAt };

  if (entity?.left === true || entity?.kicked === true) {
    return {
      ...base,
      membership: "not_joined",
      canWrite: false,
      reason: "The connected Telegram account is not a current member of this chat.",
    };
  }

  if (activeSendRestriction(entity?.bannedRights) || activeSendRestriction(entity?.defaultBannedRights)) {
    return {
      ...base,
      membership: "joined",
      canWrite: false,
      reason: "Telegram reports an active send restriction for this account or chat.",
    };
  }

  if (entityType === "broadcast" && entity?.adminRights?.postMessages !== true) {
    return {
      ...base,
      membership: "joined",
      canWrite: false,
      reason: "This is a broadcast channel and the account has no post_messages admin right; use a linked discussion when appropriate.",
    };
  }

  if (entity?.className === "Channel") {
    const { Api } = await loadClientModules();
    try {
      const participantResponse = await c.invoke(
        new Api.channels.GetParticipant({
          channel: await c.getInputEntity(entity),
          participant: new Api.InputPeerSelf(),
        }),
      );
      const participant = participantResponse?.participant;
      const participantClass = String(participant?.className || participantResponse?.className || "");
      if (participantClass === "ChannelParticipantLeft" || participantClass === "ChannelParticipantBanned") {
        return {
          ...base,
          membership: "not_joined",
          canWrite: false,
          reason: `Telegram participant lookup returned ${participantClass}.`,
          participantClass,
        };
      }
      if (activeSendRestriction(participant?.bannedRights)) {
        return {
          ...base,
          membership: "joined",
          canWrite: false,
          reason: "Telegram participant lookup reports an active send restriction.",
          participantClass,
        };
      }
      return {
        ...base,
        membership: "joined",
        canWrite: true,
        reason: "The account is joined and Telegram returned no active membership or send restriction.",
        participantClass,
      };
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      const notMember = /USER_NOT_PARTICIPANT|CHANNEL_PRIVATE|CHAT_ADMIN_REQUIRED/i.test(message);
      return {
        ...base,
        membership: notMember ? "not_joined" : "unknown",
        canWrite: false,
        reason: `Telegram participant preflight failed: ${message}`,
      };
    }
  }

  if (entity?.className === "Chat") {
    return {
      ...base,
      membership: "joined",
      canWrite: true,
      reason: "The account is in the basic Telegram chat and no active send restriction was reported.",
    };
  }

  return {
    ...base,
    membership: "unknown",
    canWrite: false,
    reason: "The Telegram entity is not a writable group chat.",
  };
}

/** Reply to one message inside a public group, preserving the thread context. */
export async function gramjsReplyToChatMessage(
  chatRef: string,
  messageId: number,
  text: string,
): Promise<{ ok: true; chat: string; messageId: number; link?: string }> {
  const c = await getGramjsClient();
  await assertPremium(c);
  const ref = String(chatRef || "").trim();
  if (!ref) throw new Error("Telegram chat is required");
  const writeAccess = await gramjsCheckChatWriteAccess(ref);
  if (!writeAccess.canWrite) {
    throw new Error(`Telegram chat write preflight failed for ${writeAccess.chat}: ${writeAccess.reason}`);
  }
  const entity = await c.getEntity(parseUsername(ref));
  const res = await c.sendMessage(entity, {
    message: String(text),
    replyTo: Number(messageId),
  });
  const sentId = Number(res?.id ?? 0);
  const username = String(entity?.username || "").trim();
  return {
    ok: true,
    chat: username ? `@${username}` : String(entity?.id || ref),
    messageId: sentId,
    link: username && sentId ? `https://t.me/${username}/${sentId}` : undefined,
  };
}

/** Add one standard emoji reaction to one existing Telegram message. */
export async function gramjsReactToMessage(
  chatRef: string,
  messageId: number,
  reaction: string,
  expectedText?: string,
): Promise<{ ok: true; chat: string; messageId: number; reaction: string; link?: string; verifiedText?: string }> {
  const c = await getGramjsClient();
  await assertPremium(c);
  const ref = String(chatRef || "").trim();
  const emoji = String(reaction || "").trim();
  const id = Number(messageId);
  if (!ref) throw new Error("Telegram chat is required");
  if (!Number.isInteger(id) || id <= 0) throw new Error("Telegram message_id must be a positive integer");
  if (!emoji || emoji.length > 32) throw new Error("reaction must be one standard emoji (up to 32 characters)");

  const entity = await c.getEntity(parseUsername(ref));
  const messages = await c.getMessages(entity, { ids: [id] });
  const target = messages?.[0];
  if (!target) throw new Error(`Telegram message ${id} was not found in ${ref}`);
  const targetText = String(target?.message || "").trim();
  if (expectedText !== undefined && targetText !== String(expectedText).trim()) {
    throw new Error("Telegram target text does not match expected_text; no reaction was added");
  }

  const { Api } = await loadClientModules();
  await c.invoke(new Api.messages.SendReaction({
    peer: await c.getInputEntity(entity),
    msgId: id,
    reaction: [new Api.ReactionEmoji({ emoticon: emoji })],
    addToRecent: true,
  }));
  const username = String(entity?.username || "").trim();
  return {
    ok: true,
    chat: username ? `@${username}` : String(entity?.title || ref),
    messageId: id,
    reaction: emoji,
    ...(targetText ? { verifiedText: targetText } : {}),
    link: username ? `https://t.me/${username}/${id}` : undefined,
  };
}

export async function closeGramjs(): Promise<void> {
  await disconnectPrimaryClient();
  await disconnectTeleprotoClient();
}
