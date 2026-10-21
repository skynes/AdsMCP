export type TdAuthState =
  | "missing_deps"
  | "missing_credentials"
  | "wait_phone"
  | "wait_code"
  | "wait_qr"
  | "wait_password"
  | "wait_registration"
  | "ready"
  | "logging_out"
  | "closed"
  | "unknown";

export type TgMessageHit = {
  id: string;
  platform: "telegram";
  kind: "gig";
  title: string;
  description: string;
  link: string;
  date: string;
  chat: string;
  chatId: number;
  messageId: number;
};

export type TelegramPublicPostHit = {
  id: string;
  platform: "telegram";
  kind: "public_post";
  title: string;
  description: string;
  link?: string;
  date: string;
  chat: string;
  chatId: number;
  messageId: number;
};

export type TelegramPublicPostSearchResult = {
  ok: boolean;
  status: "ok" | "payment_required";
  backend: "teleproto";
  query: string;
  checkedAt: string;
  totalDaily?: number;
  remainingFree?: number;
  queryIsFree?: boolean;
  starsAmount?: number;
  paidSearchAttempted: boolean;
  results: TelegramPublicPostHit[];
};

export type TelegramChannelTopicHit = {
  messageId: number;
  date: string;
  text: string;
  link: string;
  query: string;
};

export type TelegramLinkedChannelReview = {
  userId: string;
  status: "not_found" | "linked_public_channel" | "linked_non_public_chat";
  ownership: "telegram_linked" | "unknown";
  channelId?: number;
  title?: string;
  username?: string;
  link?: string;
  checkedAt: string;
  queries: string[];
  topicHits: TelegramChannelTopicHit[];
};

export type TelegramUnreadHumanMessage = {
  messageId: number;
  date: string;
  text?: string;
  incoming: boolean;
};

export type TelegramUnreadHumanChat = {
  telegramUserId: string;
  username?: string;
  displayName: string;
  unreadCount: number;
  latestMessage?: TelegramUnreadHumanMessage;
};

export type TelegramUnreadHumanSnapshot = {
  checkedAt: string;
  backend: "gramjs";
  totalUnreadHumanDialogs: number;
  returnedDialogs: number;
  chats: TelegramUnreadHumanChat[];
};

/** Read-only preflight for a public Telegram group reply. */
export type TelegramChatWritePreflight = {
  chat: string;
  chatId: number;
  entityType: "chat" | "megagroup" | "broadcast" | "unknown";
  membership: "joined" | "not_joined" | "unknown";
  canWrite: boolean;
  reason: string;
  checkedAt: string;
  participantClass?: string;
};

/** Read-only preflight for Telegram channel Direct Messages (monoforums). */
export type TelegramChannelLinkedDiscussion = {
  id: string;
  title?: string;
  username?: string;
  entityType: "chat" | "megagroup" | "unknown";
  isPublic: boolean;
  joinToSend?: boolean;
  joinRequest?: boolean;
};

export type TelegramChannelDirectMessagePreflight = {
  channel: string;
  channelId: number;
  entityType: "broadcast" | "unknown";
  directMessagesEnabled: boolean;
  canWrite: boolean;
  reason: string;
  checkedAt: string;
  linkedMonoforumId?: string;
  description?: string;
  contacts: string[];
  linkedDiscussionChecked: boolean;
  linkedChatId?: string;
  linkedDiscussion?: TelegramChannelLinkedDiscussion;
};

export type TgBackend = "gramjs" | "tdlib" | "none";

/** Safe identity summary for the locally connected Telegram account. */
export type TelegramAccountIdentity = {
  id: string;
  name?: string;
  username?: string;
  /** Telegram user Premium status. Missing/false must be treated as blocked for writes/search. */
  isPremium?: boolean;
};

export type TelegramPeerActivity = {
  peer: string;
  checkedAt: string;
  status: "online" | "offline" | "recently" | "last_week" | "last_month" | "unknown";
  hasAvatar?: boolean;
  lastSeenAt?: string;
  ageDays?: number;
  eligible: boolean;
  reason?: string;
};
