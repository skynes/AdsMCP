import { loadEnv } from "../env.js";

const DEFAULT_API_BASE = "https://discord.com/api/v10";

type DiscordRequestOptions = {
  method?: "GET" | "POST";
  body?: Record<string, unknown>;
};

export type DiscordUser = {
  id: string;
  username?: string;
  global_name?: string | null;
  bot?: boolean;
};

export type DiscordGuild = {
  id: string;
  name: string;
  icon?: string | null;
  owner?: boolean;
  permissions?: string;
  approximate_member_count?: number;
  approximate_presence_count?: number;
  features?: string[];
};

export type DiscordChannel = {
  id: string;
  guild_id?: string;
  name?: string;
  type: number;
  parent_id?: string | null;
  topic?: string | null;
  position?: number;
  last_message_id?: string | null;
};

export type DiscordMember = {
  user?: DiscordUser;
  nick?: string | null;
  roles?: string[];
  joined_at?: string | null;
};

export type DiscordMessage = {
  id: string;
  channel_id: string;
  author?: DiscordUser;
  content?: string;
  timestamp?: string;
  edited_timestamp?: string | null;
  type?: number;
};

function token(): string {
  loadEnv();
  return process.env.DISCORD_BOT_TOKEN?.trim() || "";
}
function apiBase(): string {
  loadEnv();
  const configured = process.env.DISCORD_API_BASE_URL?.trim();
  return (configured || DEFAULT_API_BASE).replace(/\/$/, "");
}

function requireToken(): string {
  const value = token();
  if (!value) {
    throw new Error("Set DISCORD_BOT_TOKEN in .env; never use a normal Discord user token or password");
  }
  return value;
}

function queryString(params: Record<string, string | number | boolean | undefined>): string {
  const query = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined) query.set(key, String(value));
  }
  const encoded = query.toString();
  return encoded ? `?${encoded}` : "";
}

async function discordRequest<T>(path: string, options: DiscordRequestOptions = {}): Promise<T> {
  const response = await fetch(`${apiBase()}${path}`, {
    method: options.method || "GET",
    headers: {
      Authorization: `Bot ${requireToken()}`,
      Accept: "application/json",
      ...(options.body ? { "Content-Type": "application/json" } : {}),
    },
    ...(options.body ? { body: JSON.stringify(options.body) } : {}),
  });

  const raw = await response.text();
  let payload: unknown = null;
  if (raw) {
    try {
      payload = JSON.parse(raw);
    } catch {
      payload = raw;
    }
  }
  if (!response.ok) {
    const details = typeof payload === "object" && payload !== null
      ? JSON.stringify(payload)
      : String(payload || response.statusText);
    throw new Error(`Discord API ${response.status}: ${details}`);
  }
  return payload as T;
}

function boundedLimit(value: number | undefined, fallback: number, max: number): number {
  return Math.max(1, Math.min(max, Math.floor(value || fallback)));
}

export function discordCredentialsConfigured(): boolean {
  return Boolean(token());
}

export async function getDiscordCurrentUser(): Promise<DiscordUser> {
  return discordRequest<DiscordUser>("/users/@me");
}

export async function listDiscordGuilds(limit?: number): Promise<DiscordGuild[]> {
  return discordRequest<DiscordGuild[]>(`/users/@me/guilds${queryString({
    with_counts: true,
    limit: boundedLimit(limit, 200, 200),
  })}`);
}

export async function listDiscordGuildChannels(guildId: string): Promise<DiscordChannel[]> {
  return discordRequest<DiscordChannel[]>(`/guilds/${encodeURIComponent(guildId)}/channels`);
}

export async function searchDiscordGuildMembers(
  guildId: string,
  query: string,
  limit?: number,
): Promise<DiscordMember[]> {
  return discordRequest<DiscordMember[]>(
    `/guilds/${encodeURIComponent(guildId)}/members/search${queryString({
      query,
      limit: boundedLimit(limit, 25, 1000),
    })}`,
  );
}

export async function listDiscordChannelMessages(
  channelId: string,
  limit?: number,
  before?: string,
  after?: string,
): Promise<DiscordMessage[]> {
  return discordRequest<DiscordMessage[]>(
    `/channels/${encodeURIComponent(channelId)}/messages${queryString({
      limit: boundedLimit(limit, 100, 100),
      before,
      after,
    })}`,
  );
}

export async function sendDiscordChannelMessage(channelId: string, content: string): Promise<DiscordMessage> {
  return discordRequest<DiscordMessage>(`/channels/${encodeURIComponent(channelId)}/messages`, {
    method: "POST",
    body: { content },
  });
}
