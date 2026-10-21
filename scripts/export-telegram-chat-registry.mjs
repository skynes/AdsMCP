import { mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { listTelegramAiChats } from "../dist/telegram-ai-chats.js";
import { getGramjsClient } from "../dist/telegram/gramjs.js";

const projectId = "neron";
const generatedAt = new Date().toISOString();
const outputPath = join(process.cwd(), "data", "telegram", "chat-registry.json");

const categoryDefinitions = [
  {
    id: "travel",
    keywords: [
      "travel", "travelling", "путешеств", "туризм", "турист", "отдых", "туристичес",
      "vacation", "trip", "авиа", "перелет", "перелёт", "отел", "отел", "гид", "виза",
      "visа", "экскурс", "релокац", "relocat", "экспат", "expat",
    ],
  },
  {
    id: "dubai",
    keywords: ["дубай", "dubai", "dubay", "uae", "оаэ", "emirates", "эмират"],
  },
  {
    id: "armenia_yerevan",
    keywords: ["ереван", "yerevan", "армени", "armenia", "armeniarus"],
  },
  {
    id: "cyprus",
    keywords: ["кипр", "cyprus", "лимассол", "limassol", "paphos", "пафос", "nicosia", "никос"],
  },
  {
    id: "georgia_tbilisi",
    keywords: ["груз", "georgia", "tbilisi", "тбилиси", "батум", "batum"],
  },
  {
    id: "expat_relocation",
    keywords: ["релокац", "relocat", "экспат", "expat", "переезд", "иммиграц", "эмиграц"],
  },
  {
    id: "ai",
    keywords: ["нейрон", "нейросет", "ии", "ai", "gpt", "chatgpt", "claude", "midjourney", "генерац"],
  },
  {
    id: "castdev_research",
    keywords: ["кастдев", "castdev", "коридор", "исследован", "респондент", "интервью"],
  },
];

function normalizeUsername(username) {
  const value = String(username || "").trim().replace(/^@+/, "");
  return value || undefined;
}

function normalizeEntityId(value) {
  const raw = String(value || "").trim();
  return raw.startsWith("-100") ? raw.slice(4) : raw;
}

function classify(text) {
  const haystack = String(text || "").toLocaleLowerCase("ru-RU");
  const topics = categoryDefinitions
    .filter((definition) => definition.keywords.some((keyword) => {
      if (keyword === "ai") return /(^|[^a-z0-9])ai([^a-z0-9]|$)/i.test(haystack);
      if (keyword === "ии") return /(^|[^а-яё])ии([^а-яё]|$)/i.test(haystack);
      return haystack.includes(keyword);
    }))
    .map((definition) => definition.id);
  return topics.length ? topics : ["other"];
}

function mergeUnique(values) {
  return [...new Set(values.filter(Boolean))];
}

function localRecordToRegistryRecord(record) {
  const username = normalizeUsername(record.username);
  const sourceText = [
    record.title,
    username,
    ...(record.discoveryQueries || []),
    ...(record.topicHits || []).flatMap((hit) => [hit.query, hit.summary, hit.link]),
    record.notes,
  ].filter(Boolean).join(" ");
  const topics = classify(sourceText);
  return {
    key: normalizeEntityId(record.telegramChatId),
    telegramChatId: record.telegramChatId,
    title: record.title,
    ...(username ? { username } : {}),
    chatType: record.chatType,
    ...(record.publicUrl ? { publicUrl: record.publicUrl } : username ? { publicUrl: `https://t.me/${username}` } : {}),
    topics,
    projectId: record.projectId,
    source: ["local_catalog"],
    status: record.status,
    ...(record.relevanceScore === undefined ? {} : { relevanceScore: record.relevanceScore }),
    ...(record.discoveryQueries?.length ? { discoveryQueries: record.discoveryQueries } : {}),
    ...(record.topicHits?.length ? { topicHits: record.topicHits } : {}),
    ...(record.notes ? { notes: record.notes } : {}),
    ...(record.metadata ? { metadata: record.metadata } : {}),
    firstSeenAt: record.firstSeenAt,
    ...(record.lastScannedAt ? { lastScannedAt: record.lastScannedAt } : {}),
    lastCheckedAt: generatedAt,
  };
}

function liveEntityToRecord(entity) {
  const username = normalizeUsername(entity.username);
  const title = String(entity.title || entity.firstName || entity.username || "Без названия").trim();
  const chatType = entity.className === "Channel" && entity.broadcast === true ? "channel" : "group";
  const topics = classify([title, username].filter(Boolean).join(" "));
  return {
    key: normalizeEntityId(entity.id),
    telegramChatId: String(entity.id),
    title,
    ...(username ? { username } : {}),
    chatType,
    ...(username ? { publicUrl: `https://t.me/${username}` } : {}),
    topics,
    projectId,
    source: ["telegram_dialogs"],
    status: "candidate",
    metadata: {
      telegramClass: entity.className,
      ...(entity.megagroup === true ? { megagroup: true } : {}),
      ...(entity.broadcast === true ? { broadcast: true } : {}),
    },
    lastCheckedAt: generatedAt,
  };
}

function mergeRecord(existing, incoming) {
  const title = incoming.title || existing.title;
  const username = incoming.username || existing.username;
  const topics = mergeUnique([...(existing.topics || []), ...(incoming.topics || [])]);
  const source = mergeUnique([...(existing.source || []), ...(incoming.source || [])]);
  const metadata = { ...(existing.metadata || {}), ...(incoming.metadata || {}) };
  return {
    ...existing,
    ...incoming,
    title,
    ...(username ? { username } : {}),
    ...(incoming.publicUrl || existing.publicUrl ? { publicUrl: incoming.publicUrl || existing.publicUrl } : {}),
    topics,
    source,
    metadata,
    lastCheckedAt: generatedAt,
  };
}

function topicSortValue(topics) {
  const order = ["dubai", "armenia_yerevan", "cyprus", "travel", "georgia_tbilisi", "expat_relocation", "ai", "castdev_research", "other"];
  return Math.min(...topics.map((topic) => order.indexOf(topic)).filter((value) => value >= 0), order.length);
}

const localRecords = listTelegramAiChats({ projectId, limit: 200 }).map(localRecordToRegistryRecord);
const registryByKey = new Map();
for (const record of localRecords) registryByKey.set(record.key, record);

const client = await getGramjsClient();
try {
  const dialogs = await client.getDialogs({ limit: 1000 });
  for (const dialog of dialogs) {
    const entity = dialog?.entity;
    if (!entity || !["Channel", "Chat"].includes(entity.className)) continue;
    const record = liveEntityToRecord(entity);
    const existing = registryByKey.get(record.key);
    registryByKey.set(record.key, existing ? mergeRecord(existing, record) : record);
  }
} finally {
  await client.disconnect().catch(() => null);
}

const chats = [...registryByKey.values()]
  .map((record) => ({
    ...record,
    topics: [...record.topics].sort((a, b) => topicSortValue([a]) - topicSortValue([b]) || a.localeCompare(b)),
  }))
  .sort((a, b) => topicSortValue(a.topics) - topicSortValue(b.topics) || a.title.localeCompare(b.title, "ru"));

const categoryCounts = Object.fromEntries(
  ["dubai", "armenia_yerevan", "cyprus", "travel", "georgia_tbilisi", "expat_relocation", "ai", "castdev_research", "other"]
    .map((topic) => [topic, chats.filter((chat) => chat.topics.includes(topic)).length]),
);

const output = {
  schemaVersion: 1,
  projectId,
  generatedAt,
  readOnlyExport: true,
  source: {
    localCatalog: "telegram_ai_chats",
    telegramDialogsLimit: 1000,
    includedEntityTypes: ["group", "channel"],
    excludedEntityTypes: ["user", "bot"],
  },
  categoryCounts,
  chats,
};

mkdirSync(join(process.cwd(), "data", "telegram"), { recursive: true });
writeFileSync(outputPath, `${JSON.stringify(output, null, 2)}\n`, "utf8");

console.log(JSON.stringify({ outputPath, chats: chats.length, categoryCounts }, null, 2));
