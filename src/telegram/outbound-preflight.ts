import { listUnreadHumanChats } from "./backend.js";

export type TelegramUnreadOutboundNotice = {
  checked: boolean;
  checkedAt?: string;
  totalUnreadHumanDialogs?: number;
  hasUnread: boolean | null;
  unreadDialogs?: Array<{
    telegramUserId: string;
    username?: string;
    displayName: string;
    unreadCount: number;
    latestMessage?: unknown;
  }>;
  warning?: string;
  safety: string;
};

/** Read-only notice used immediately before Telegram writes. */
export async function inspectUnreadBeforeTelegramWrite(limit = 100): Promise<TelegramUnreadOutboundNotice> {
  try {
    const snapshot = await listUnreadHumanChats(limit);
    const unreadDialogs = snapshot.chats.map((chat) => ({
      telegramUserId: chat.telegramUserId,
      ...(chat.username ? { username: `@${chat.username}` } : {}),
      displayName: chat.displayName,
      unreadCount: chat.unreadCount,
      ...(chat.latestMessage ? { latestMessage: chat.latestMessage } : {}),
    }));
    return {
      checked: true,
      checkedAt: snapshot.checkedAt,
      totalUnreadHumanDialogs: snapshot.totalUnreadHumanDialogs,
      hasUnread: unreadDialogs.length > 0,
      unreadDialogs,
      ...(unreadDialogs.length > 0 ? { warning: "There are new unread human Telegram messages; review them after this send." } : {}),
      safety: "Read-only unread preflight; no messages were sent and no dialog was marked read.",
    };
  } catch (error) {
    return {
      checked: false,
      hasUnread: null,
      warning: `Unread Telegram preflight could not be completed: ${error instanceof Error ? error.message : String(error)}`,
      safety: "Unread check failed, but the requested write was not blocked; no dialog was marked read.",
    };
  }
}
