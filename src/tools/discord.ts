import { resolveDataDir } from "../env.js";
import {
  discordCredentialsConfigured,
  getDiscordCurrentUser,
  listDiscordChannelMessages,
  listDiscordGuildChannels,
  listDiscordGuilds,
  searchDiscordGuildMembers,
  sendDiscordChannelMessage,
  type DiscordMessage,
} from "../discord/client.js";

function normalizeUser(user: { id: string; username?: string; global_name?: string | null; bot?: boolean } | undefined) {
  if (!user) return undefined;
  return {
    id: user.id,
    username: user.username || null,
    global_name: user.global_name || null,
    bot: user.bot === true,
  };
}
function normalizeMessage(message: DiscordMessage) {
  return {
    id: message.id,
    channel_id: message.channel_id,
    author: normalizeUser(message.author),
    content: message.content || "",
    timestamp: message.timestamp || null,
    edited_timestamp: message.edited_timestamp || null,
    type: message.type ?? null,
  };
}

export async function runDiscordStatus(): Promise<unknown> {
  const configured = discordCredentialsConfigured();
  if (!configured) {
    return {
      ok: false,
      integration: "discord",
      mode: "bot",
      state: "missing_credentials",
      credentials: {
        configured: false,
        required_env: ["DISCORD_BOT_TOKEN"],
        optional_env: ["DISCORD_APPLICATION_ID", "DISCORD_API_BASE_URL"],
      },
      hint: "Create a Discord Developer Application, add a bot, invite it to a server, then set DISCORD_BOT_TOKEN in .env",
      policy: "A normal Discord user token/password is not accepted; user-account automation is not supported.",
    };
  }

  try {
    const user = await getDiscordCurrentUser();
    return {
      ok: true,
      integration: "discord",
      provider: "discord",
      mode: "bot",
      state: "ready",
      account: normalizeUser(user),
      storage: { data_dir: resolveDataDir(), persistent_message_storage: false },
      capabilities: ["guilds.read", "channels.read", "messages.read", "members.search", "channel_messages.write"],
      limitations: [
        "Only servers where this bot is installed are visible",
        "Member search is limited to an accessible server",
        "No normal-user account automation or bulk direct messages",
      ],
    };
  } catch (error) {
    return {
      ok: false,
      integration: "discord",
      mode: "bot",
      state: "error",
      error: error instanceof Error ? error.message : String(error),
      hint: "Check DISCORD_BOT_TOKEN, bot installation and channel/server permissions",
    };
  }
}

export async function runDiscordGuildList(args: { limit?: number }): Promise<unknown> {
  const guilds = await listDiscordGuilds(args.limit);
  return {
    ok: true,
    count: guilds.length,
    guilds: guilds.map((guild) => ({
      id: guild.id,
      name: guild.name,
      icon: guild.icon || null,
      owner: guild.owner === true,
      permissions: guild.permissions || null,
      approximate_member_count: guild.approximate_member_count ?? null,
      approximate_presence_count: guild.approximate_presence_count ?? null,
      features: guild.features || [],
    })),
    note: "This is the bot's installed-server list, not a global Discord server directory.",
  };
}

export async function runDiscordChannelList(args: { guild_id: string }): Promise<unknown> {
  const channels = await listDiscordGuildChannels(args.guild_id);
  return {
    ok: true,
    guild_id: args.guild_id,
    channels: channels
      .filter((channel) => [0, 5, 10, 11, 12, 15, 16].includes(channel.type))
      .map((channel) => ({
        id: channel.id,
        guild_id: channel.guild_id || args.guild_id,
        name: channel.name || null,
        type: channel.type,
        parent_id: channel.parent_id || null,
        topic: channel.topic || null,
        position: channel.position ?? null,
        last_message_id: channel.last_message_id || null,
      })),
    note: "Discord returns only channels the bot can view; threads are not included by this endpoint.",
  };
}

export async function runDiscordMemberSearch(args: {
  guild_id: string;
  query: string;
  limit?: number;
}): Promise<unknown> {
  const members = await searchDiscordGuildMembers(args.guild_id, args.query, args.limit);
  return {
    ok: true,
    guild_id: args.guild_id,
    query: args.query,
    members: members.map((member) => ({
      id: member.user?.id || null,
      username: member.user?.username || null,
      global_name: member.user?.global_name || null,
      nick: member.nick || null,
      bot: member.user?.bot === true,
      joined_at: member.joined_at || null,
      roles: member.roles || [],
    })),
    note: "Member search is for locating context inside an installed server; it does not authorize contacting a member.",
  };
}

export async function runDiscordMessageSearch(args: {
  channel_id: string;
  query?: string;
  limit?: number;
  before?: string;
  after?: string;
}): Promise<unknown> {
  const messages = await listDiscordChannelMessages(args.channel_id, args.limit, args.before, args.after);
  const needle = args.query?.trim().toLocaleLowerCase();
  const filtered = needle
    ? messages.filter((message) => (message.content || "").toLocaleLowerCase().includes(needle))
    : messages;
  return {
    ok: true,
    channel_id: args.channel_id,
    query: args.query || null,
    scanned: messages.length,
    count: filtered.length,
    messages: filtered.map(normalizeMessage),
    note: "The Discord API returns a bounded recent page here; this tool does not crawl or persist channel history.",
  };
}

export async function runDiscordChannelSend(args: {
  channel_id: string;
  text: string;
  confirm?: boolean;
}): Promise<unknown> {
  if (args.confirm !== true) {
    return {
      ok: false,
      error: "Sending a Discord channel message requires explicit confirm=true",
      safety: "One plain-text message to one selected channel only; no bulk sends and no member DMs.",
    };
  }
  const text = args.text.trim();
  if (!text) return { ok: false, error: "Message text must not be empty" };
  if (text.length > 2000) return { ok: false, error: "Discord channel messages are limited to 2000 characters" };

  const message = await sendDiscordChannelMessage(args.channel_id, text);
  return {
    ok: true,
    channel_id: args.channel_id,
    message: normalizeMessage(message),
    safety: "One manually confirmed channel message was sent through the Discord bot; no private message was sent.",
  };
}
