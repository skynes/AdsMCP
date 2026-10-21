import { readFileSync } from "node:fs";
import { join } from "node:path";
import { upsertTelegramResource } from "../dist/telegram-resources.js";

const projectId = "neron";
const registryPath = join(process.cwd(), "data", "telegram", "chat-registry.json");
const registry = JSON.parse(readFileSync(registryPath, "utf8"));
const now = new Date().toISOString();

const knownMembership = new Map([
  ["promtyichat", "joined"],
  ["ai_community_chat", "joined"],
  ["zerocoders", "joined"],
  ["chat_GPT_zerocoder", "joined"],
  ["produckty", "joined"],
]);

const extraResources = [
  { id: "promtyichat", type: "chat", title: "Промты ИИ Чат", topics: ["ai", "prompting"], source: "internet", membership: "joined" },
  { id: "ai_community_chat", type: "chat", title: "Бизнес-чат AI Community", topics: ["ai", "startups", "business"], source: "internet", membership: "joined" },
  { id: "zerocoders", type: "chat", title: "🛠 Я — зерокодер", topics: ["ai", "nocode", "startups"], source: "internet", membership: "joined" },
  { id: "chat_GPT_zerocoder", type: "chat", title: "ChatGPT Чат & Сообщество", topics: ["ai", "chatgpt"], source: "internet", membership: "joined" },
  { id: "produckty", type: "chat", title: "PRO-дакты (моб. приложения, продакты)", topics: ["product", "mobile"], source: "internet", membership: "joined" },
  { id: "aiistyping", type: "chat", title: "AI печатает…", topics: ["ai", "startups"], source: "internet", membership: "unknown" },
  { id: "n8n_community", type: "chat", title: "n8n Чат & Сообщество", topics: ["ai", "automation", "n8n"], source: "internet", membership: "unknown" },
  { id: "cursor_community_zerocoder", type: "chat", title: "Cursor Community", topics: ["ai", "development"], source: "user_list", membership: "unknown" },
  { id: "vibe_coders_zerocoder", type: "chat", title: "Vibe Coders Chat", topics: ["ai", "development", "nocode"], source: "user_list", membership: "unknown" },
  { id: "vibe_marketing_zerocoder", type: "chat", title: "Vibe Marketing Chat", topics: ["ai", "marketing"], source: "user_list", membership: "unknown" },
  { id: "midjourney_community_zerocoder", type: "chat", title: "Midjourney Чат & Сообщество", topics: ["ai", "midjourney", "images"], source: "user_list", membership: "unknown" },
  { id: "deepseek_community", type: "chat", title: "DeepSeek & Qwen Сообщество", topics: ["ai", "deepseek", "qwen"], source: "user_list", membership: "unknown" },
  { id: "freelance_community_zerocoder", type: "chat", title: "На фрилансе", topics: ["freelance", "ai"], source: "user_list", membership: "unknown" },
  { id: "neural_houses", type: "channel", title: "Нейросетевые покои: нейросети, ChatGPT, Midjourney", topics: ["ai", "chatgpt", "midjourney"], source: "user_list", membership: "unknown" },
  { id: "oqode", type: "channel", title: "Зерокодер", topics: ["ai", "nocode", "startups", "education"], source: "user_list", membership: "unknown" },
  { id: "productradar_chat", type: "chat", title: "Чат Радара", topics: ["startups", "product", "feedback"], source: "telegram", membership: "joined", rules: "allowed" },
];

let saved = 0;
for (const chat of registry.chats || []) {
  const username = String(chat.username || "").replace(/^@+/, "") || undefined;
  const resourceId = String(chat.telegramChatId || username || "").trim();
  if (!resourceId || !chat.title) continue;
  const membership = username && knownMembership.has(username) ? knownMembership.get(username) : "unknown";
  upsertTelegramResource({
    projectId,
    telegramResourceId: resourceId,
    type: chat.chatType === "channel" ? "channel" : "chat",
    title: chat.title,
    username,
    publicUrl: chat.publicUrl || (username ? `https://t.me/${username}` : undefined),
    source: "chat_registry",
    status: chat.status === "reviewed" || chat.status === "ignored" || chat.status === "archived" ? chat.status : "candidate",
    membershipStatus: membership,
    topics: chat.topics,
    notes: chat.notes,
    metadata: { registrySources: chat.source, registryKey: chat.key },
    firstSeenAt: chat.firstSeenAt || now,
    lastCheckedAt: chat.lastCheckedAt || now,
    ...(membership === "joined" ? { joinedAt: now } : {}),
  });
  saved += 1;
}

for (const resource of extraResources) {
  const username = resource.id;
  upsertTelegramResource({
    projectId,
    telegramResourceId: resource.id,
    type: resource.type,
    title: resource.title,
    username,
    publicUrl: `https://t.me/${username}`,
    source: resource.source,
    status: "candidate",
    membershipStatus: resource.membership,
    rulesStatus: resource.rules || "unknown",
    topics: resource.topics,
    firstSeenAt: now,
    lastCheckedAt: now,
    ...(resource.membership === "joined" ? { joinedAt: now } : {}),
  });
  saved += 1;
}

console.log(JSON.stringify({ projectId, registryRecords: (registry.chats || []).length, saved, outputTable: "tg_resources" }, null, 2));
