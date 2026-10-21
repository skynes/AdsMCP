import { db } from "../dist/db.js";
import { upsertTelegramAiSearchQuery } from "../dist/telegram-ai-search-queries.js";

const projectId = valueOf("--project=", "neron");
const windowDays = Math.max(7, Math.min(Number(valueOf("--window-days=", "30")) || 30, 365));
const maxNewQueries = Math.max(1, Math.min(Number(valueOf("--max-new-queries=", "8")) || 8, 20));
const apply = process.argv.includes("--apply");
const nowMs = Date.now();
const cutoffMs = nowMs - windowDays * 24 * 60 * 60 * 1000;

const KNOWN_CANDIDATE_DEFAULTS = new Map([
  ["нужна нейросеть для видео", ["video_generation", "recommendation"]],
  ["не получается сделать видео нейросетью", ["video_generation", "troubleshooting"]],
  ["нужна нейросеть для картинок", ["image_generation", "recommendation"]],
  ["ищу AI-сервис для работы с файлами", ["file_agent", "tool_search"]],
  ["ChatGPT лимит что делать", ["chatgpt_limits", "troubleshooting"]],
  ["у ChatGPT закончился лимит что делать", ["chatgpt_limits", "troubleshooting"]],
]);

function valueOf(prefix, fallback) {
  const arg = process.argv.find((item) => item.startsWith(prefix));
  return arg ? arg.slice(prefix.length) : fallback;
}

function text(value) {
  return String(value || "").replace(/\s+/g, " ").trim();
}

function uniqueRows(rows) {
  return [...new Map(rows.map((row) => [row.public_url || `${row.telegram_chat_id}:${row.telegram_message_id}`, row])).values()];
}

function postedAtMs(row) {
  const value = Date.parse(row.posted_at || "");
  return Number.isFinite(value) ? value : null;
}

function isFresh(row) {
  const time = postedAtMs(row);
  return time != null && time <= nowMs && time >= cutoffMs;
}

function isExplicitSignal(row) {
  return Number(row.explicit_request) === 1
    && ["request", "opportunity"].includes(row.classification)
    && Number(row.relevance_score || 0) >= 70;
}

function topicFor(value) {
  const normalized = text(value).toLocaleLowerCase("ru-RU");
  if (/видео|ролик|video/.test(normalized)) return "video";
  if (/картин|фото|изображ|image|дизайн|figma/.test(normalized)) return "image";
  if (/файл|документ|таблиц/.test(normalized)) return "files";
  if (/лимит|законч|доступ|подписк|chatgpt/.test(normalized)) return "limits";
  if (/голос|озвуч|аудио|voice/.test(normalized)) return "voice";
  if (/фон|вырез|обработк/.test(normalized)) return "editing";
  return null;
}

function candidateQueries(row) {
  const topic = topicFor(`${row.title}\n${row.description}`);
  if (topic === "video") return [
    ["нужна нейросеть для видео", "video_generation", "recommendation", 95],
    ["не получается сделать видео нейросетью", "video_generation", "troubleshooting", 95],
  ];
  if (topic === "image") return [
    ["нужна нейросеть для картинок", "image_generation", "recommendation", 90],
    ["нужна нейросеть для обработки фото", "image_editing", "recommendation", 88],
  ];
  if (topic === "files") return [
    ["ищу AI-сервис для работы с файлами", "file_agent", "tool_search", 88],
  ];
  if (topic === "limits") return [
    ["ChatGPT лимит что делать", "chatgpt_limits", "troubleshooting", 85],
    ["у ChatGPT закончился лимит что делать", "chatgpt_limits", "troubleshooting", 82],
  ];
  if (topic === "voice") return [
    ["нужна нейросеть для озвучки", "voice_generation", "recommendation", 84],
  ];
  if (topic === "editing") return [
    ["нужна нейросеть чтобы убрать фон", "background_removal", "tool_search", 84],
  ];
  return [];
}

function qualityFor(rows) {
  const unique = uniqueRows(rows);
  const fresh = unique.filter(isFresh);
  const explicit = unique.filter(isExplicitSignal);
  const freshExplicit = fresh.filter(isExplicitSignal);
  const noise = unique.filter((row) => ["promotion", "repost"].includes(row.classification));
  const precision = fresh.length ? Number((freshExplicit.length / fresh.length).toFixed(3)) : 0;
  const noiseRate = unique.length ? Number((noise.length / unique.length).toFixed(3)) : 0;
  return {
    total: unique.length,
    fresh: fresh.length,
    explicit: explicit.length,
    freshExplicit: freshExplicit.length,
    promotionOrRepost: noise.length,
    precision,
    noiseRate,
    role: freshExplicit.length > 0 ? "lead_discovery" : "trend_only",
  };
}

function recommendation(query, quality) {
  if (quality.freshExplicit > 0 && quality.precision >= 0.15) {
    return `lead_discovery: ${quality.freshExplicit} fresh explicit result(s); keep and test narrower variants`;
  }
  if (quality.fresh > 0 && quality.noiseRate >= 0.45) {
    return `trend_only: ${Math.round(quality.noiseRate * 100)}% promotion/repost noise; do not use for outreach`;
  }
  if (quality.fresh === 0) return "trend_only: no result in the current freshness window";
  return "trend_only: no fresh explicit request passed the lead gate";
}

const conn = db();
const postRows = conn.prepare(
  `SELECT query, title, description, public_url, telegram_chat_id, telegram_message_id,
          posted_at, classification, relevance_score, explicit_request
     FROM telegram_ai_posts
    WHERE project_id = ?
    ORDER BY updated_at DESC`,
).all(projectId);
const runRows = conn.prepare(
  `SELECT query, status, remaining_free, result_count, actionable_count, finished_at
     FROM telegram_ai_search_runs
    WHERE project_id = ? AND source = 'telegram_public_post_search'
    ORDER BY finished_at DESC
    LIMIT 200`,
).all(projectId);
const queryRows = conn.prepare(
  `SELECT query, topic, intent, status, priority, source, notes, metadata_json
     FROM telegram_ai_search_queries
    WHERE project_id = ?
    ORDER BY priority DESC, updated_at DESC`,
).all(projectId);

const byQuery = new Map();
for (const row of postRows) {
  const list = byQuery.get(row.query) || [];
  list.push(row);
  byQuery.set(row.query, list);
}

const learned = [];
for (const [query, rows] of byQuery) {
  const quality = qualityFor(rows);
  learned.push({
    query,
    quality,
    recommendation: recommendation(query, quality),
    lastRun: runRows.find((run) => run.query === query) || null,
  });
}
learned.sort((a, b) => (b.quality.freshExplicit - a.quality.freshExplicit)
  || (b.quality.precision - a.quality.precision)
  || (b.quality.fresh - a.quality.fresh));

const generated = new Map();
for (const item of learned.filter((entry) => entry.quality.freshExplicit > 0)) {
  const evidence = uniqueRows((byQuery.get(item.query) || [])
    .filter((row) => isFresh(row) && isExplicitSignal(row)))
    .slice(0, 5)
    .map((row) => ({
      source: row.public_url || `${row.telegram_chat_id}:${row.telegram_message_id}`,
      title: text(row.title).slice(0, 160),
    }));
  generated.set(item.query, {
    query: item.query,
    topic: topicFor(item.query) || "ai_tool_discovery",
    intent: "recommendation",
    priority: Math.min(100, 90 + item.quality.freshExplicit * 3),
    evidence,
  });
}
for (const row of postRows.filter((item) => isFresh(item) && isExplicitSignal(item))) {
  for (const [query, topic, intent, priority] of candidateQueries(row)) {
    if (!generated.has(query)) generated.set(query, { query, topic, intent, priority, evidence: [] });
    generated.get(query).evidence.push({
      source: row.public_url || `${row.telegram_chat_id}:${row.telegram_message_id}`,
      title: text(row.title).slice(0, 160),
    });
  }
}

// Keep existing manually prepared learned candidates in the next queue, but do
// not let an old broad query outrank a fresh explicit-signal variant.
for (const row of queryRows) {
  const notes = text(row.notes);
  if (notes.includes("lead_discovery_candidate") || notes.includes("candidate:")) {
    if (!generated.has(row.query)) {
      const defaults = KNOWN_CANDIDATE_DEFAULTS.get(row.query);
      generated.set(row.query, {
        query: row.query,
        topic: row.topic && row.topic !== "learned_candidate" ? row.topic : defaults?.[0] || "learned_candidate",
        intent: row.intent && row.intent !== "tool_search" ? row.intent : defaults?.[1] || "tool_search",
        priority: Number(row.priority || 0),
        evidence: [],
      });
    }
  }
}

const nextQueries = [...generated.values()]
  .sort((a, b) => b.priority - a.priority || a.query.localeCompare(b.query, "ru"))
  .slice(0, maxNewQueries);

if (apply) {
  for (const item of learned) {
    const qualityNote = recommendation(item.query, item.quality);
    upsertTelegramAiSearchQuery({
      projectId,
      query: item.query,
      source: "learned_from_search",
      notes: qualityNote,
      metadata: {
        learned_role: item.quality.role,
        last_quality_review: item.quality,
        reviewed_at: new Date(nowMs).toISOString(),
        selection_rule: "fresh30d + explicit request/opportunity + relevance >= 70",
      },
    });
  }
  for (const item of nextQueries) {
    upsertTelegramAiSearchQuery({
      projectId,
      query: item.query,
      topic: item.topic,
      intent: item.intent,
      language: "ru",
      source: "learned_from_search",
      status: "active",
      priority: item.priority,
      notes: "learned candidate: run one at a time; keep only fresh explicit requests and never contact automatically",
      metadata: {
        learned_role: "lead_discovery_candidate",
        evidence: item.evidence.slice(0, 5),
        selection_rule: "fresh30d + explicit request/opportunity + relevance >= 70",
      },
    });
  }
}

const remainingFree = runRows.find((run) => run.remaining_free != null)?.remaining_free ?? null;
console.log(JSON.stringify({
  ok: true,
  projectId,
  mode: apply ? "apply" : "dry_run",
  freshnessWindowDays: windowDays,
  postsAnalyzed: postRows.length,
  queriesAnalyzed: learned.length,
  nextQueries,
  latestRemainingFree: remainingFree,
  queryQuality: learned,
  note: apply
    ? "Local query catalog and quality metadata updated; no Telegram search, join, participant collection or message send was performed."
    : "Dry run only. Re-run with --apply to update the local query catalog; no Telegram search or message send was performed.",
}, null, 2));
