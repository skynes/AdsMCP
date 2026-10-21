import {
  completeMastodonAuthorization,
  createMastodonStatus,
  followMastodonAccount,
  getMastodonCurrentAccount,
  listMastodonHashtagStatuses,
  listMastodonAccounts,
  listMastodonNotifications,
  pinMastodonStatus,
  replyToMastodonStatus,
  sendMastodonDirectMessage,
  sendMastodonPublicMention,
  startMastodonAuthorization,
  updateMastodonProfile,
  type MastodonAccount,
  type MastodonNotification,
  type MastodonStatus,
} from "../mastodon/client.js";
import {
  buildInterestResearchStats,
  upsertInterestContact,
  upsertInterestResearchPost,
} from "../interest-contacts.js";

export const MASTODON_INTEREST_DISCOVERY_HASHTAGS = [
  "aiagents",
  "mcp",
  "hermes",
  "qwen",
  "opencode",
  "localai",
  "localmodels",
  "selfhosted",
  "ollama",
  "nousportal",
  "лимиты",
  "локальныемодели",
  "модели",
  "тарифы",
] as const;

type MastodonInterestAnalysis = {
  score: number;
  signalType: string;
  matchedSignals: string[];
  matchedKeywords: string[];
};

type HashtagPost = {
  status: MastodonStatus;
  hashtags: string[];
  analysis: MastodonInterestAnalysis;
};

type MastodonCandidate = {
  account: MastodonAccount;
  postCount: number;
  matchedHashtags: Set<string>;
  matchedSignals: Set<string>;
  matchedKeywords: Set<string>;
  signalScore: number;
  signalType: string;
  evidence: HashtagPost[];
};

const INTEREST_SIGNAL_RULES: Array<{
  name: string;
  weight: number;
  patterns: RegExp[];
}> = [
  {
    name: "cost_or_limits",
    weight: 30,
    patterns: [
      /лимит|limits?|quota|подписк|тариф|дорог|стоим|цен[аы]|кредит|сжира|expensive|cost|burn|\$|€/iu,
    ],
  },
  {
    name: "local_or_self_hosted",
    weight: 24,
    patterns: [
      /локальн|local\s+model|self[- ]?host|ollama|lm\s+studio|on[- ]device|qwen|deepseek|llama|модел/iu,
    ],
  },
  {
    name: "agent_or_mcp_workflow",
    weight: 20,
    patterns: [
      /ai[- ]?agent|агент|mcp|tool\s+call|инструмент|контекст|context|hermes|opencode|nous/iu,
    ],
  },
  {
    name: "alternative_or_question",
    weight: 16,
    patterns: [
      /замен|альтернатив|alternative|what\s+(?:can|could)\s+replace|что\s+выбрать|ищу|recommend|совет|как\s+(?:это|польз)|непонятно|не\s+знаю/iu,
    ],
  },
  {
    name: "friction_or_failure",
    weight: 14,
    patterns: [
      /не\s+работ|не\s+хвата|слаб|дорог|проблем|сложн|ошиб|weak|issue|fail|broken|friction|pain/iu,
    ],
  },
];

function statusText(status: MastodonStatus): string {
  return stripHtml(status.content);
}
function analyzeMastodonInterest(status: MastodonStatus): MastodonInterestAnalysis {
  // The timeline hashtag is only a discovery route. Do not treat it as text
  // from the post, otherwise a generic #лимиты timeline makes every post look
  // like a cost/limits lead. Only the post body and its actual hashtags count.
  const body = statusText(status);
  const text = `${body} ${(status.tags || []).map((tag) => tag.name).join(" ")}`;
  const hasAiBodyContext = /\bai\b|\bllms?\b|\bии\b|модел|qwen|mcp|agent|агент|ollama|deepseek|claude|codex|gemini|openai|anthropic|opencode/iu.test(body);
  if (!hasAiBodyContext) {
    return { score: 0, signalType: "non_ai_noise", matchedSignals: [], matchedKeywords: [] };
  }
  const matchedSignals: string[] = [];
  const matchedKeywords: string[] = [];
  let score = 0;
  for (const rule of INTEREST_SIGNAL_RULES) {
    const matches = rule.patterns.filter((pattern) => pattern.test(text));
    if (!matches.length) continue;
    matchedSignals.push(rule.name);
    score += rule.weight;
    for (const pattern of matches) matchedKeywords.push(pattern.source);
  }
  const signalType = matchedSignals.includes("cost_or_limits") && matchedSignals.includes("local_or_self_hosted")
    ? "cost_and_local_model_pain"
    : matchedSignals.includes("cost_or_limits")
      ? "cloud_ai_cost_or_limits"
      : matchedSignals.includes("local_or_self_hosted")
        ? "local_model_interest"
        : matchedSignals.includes("agent_or_mcp_workflow")
          ? "agent_or_mcp_workflow"
          : "general_ai_signal";
  return {
    score: Math.min(100, score),
    signalType,
    matchedSignals,
    matchedKeywords: [...new Set(matchedKeywords)],
  };
}

function normalizeHashtags(hashtags: string[], max = 20): string[] {
  return [...new Set(hashtags.map((tag) => tag.trim().replace(/^#/, "").toLowerCase()).filter(Boolean))].slice(0, max);
}

function instanceOrigin(accountUrl: string | undefined): string | undefined {
  if (!accountUrl) return undefined;
  try { return new URL(accountUrl).origin; } catch { return undefined; }
}

function postUrl(status: MastodonStatus, account: MastodonAccount, fallbackOrigin?: string): string {
  if (status.url) return status.url;
  const username = account.acct?.split("@")[0] || account.username || account.id;
  return `${fallbackOrigin || instanceOrigin(account.url) || "https://mastodon.social"}/@${username}/${status.id}`;
}

async function collectMastodonHashtagCandidates(input: {
  accountId?: string;
  hashtags: string[];
  perHashtagLimit: number;
}): Promise<{ hashtags: string[]; posts: HashtagPost[]; candidates: MastodonCandidate[] }> {
  const hashtags = normalizeHashtags(input.hashtags);
  const batches = await Promise.all(hashtags.map(async (hashtag) => ({
    hashtag,
    statuses: await listMastodonHashtagStatuses(input.accountId, hashtag, input.perHashtagLimit),
  })));
  const postMap = new Map<string, { status: MastodonStatus; hashtags: Set<string> }>();
  for (const batch of batches) {
    for (const status of batch.statuses) {
      const existing = postMap.get(status.id) || { status, hashtags: new Set<string>() };
      existing.hashtags.add(batch.hashtag);
      postMap.set(status.id, existing);
    }
  }
  const posts = [...postMap.values()].map(({ status, hashtags: matched }) => {
    const tags = [...matched];
    return { status, hashtags: tags, analysis: analyzeMastodonInterest(status) };
  });
  const candidates = new Map<string, MastodonCandidate>();
  for (const evidence of posts) {
    const account = evidence.status.account;
    if (!account?.id) continue;
    const existing = candidates.get(account.id) || {
      account,
      postCount: 0,
      matchedHashtags: new Set<string>(),
      matchedSignals: new Set<string>(),
      matchedKeywords: new Set<string>(),
      signalScore: 0,
      signalType: evidence.analysis.signalType,
      evidence: [],
    };
    existing.postCount += 1;
    for (const hashtag of evidence.hashtags) existing.matchedHashtags.add(hashtag);
    for (const signal of evidence.analysis.matchedSignals) existing.matchedSignals.add(signal);
    for (const keyword of evidence.analysis.matchedKeywords) existing.matchedKeywords.add(keyword);
    if (evidence.analysis.score > existing.signalScore) {
      existing.signalScore = evidence.analysis.score;
      existing.signalType = evidence.analysis.signalType;
    }
    existing.evidence.push(evidence);
    existing.evidence.sort((left, right) => right.analysis.score - left.analysis.score);
    existing.evidence = existing.evidence.slice(0, 3);
    candidates.set(account.id, existing);
  }
  return { hashtags, posts, candidates: [...candidates.values()] };
}

function candidateView(candidate: MastodonCandidate): unknown {
  return {
    account: accountView(candidate.account),
    post_count: candidate.postCount,
    signal_score: candidate.signalScore,
    signal_type: candidate.signalType,
    matched_hashtags: [...candidate.matchedHashtags],
    matched_signals: [...candidate.matchedSignals],
    matched_keywords: [...candidate.matchedKeywords],
    evidence: candidate.evidence.map((item) => ({
      ...statusView(item.status) as Record<string, unknown>,
      matched_hashtags: item.hashtags,
      signal_score: item.analysis.score,
      signal_type: item.analysis.signalType,
      matched_signals: item.analysis.matchedSignals,
    })),
    review_note: "Это публичный сигнал для ручной проверки; он не означает согласие на подписку или контакт.",
  };
}

function stripHtml(value: string | undefined): string {
  return (value || "")
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<[^>]*>/g, "")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/\s+\n/g, "\n")
    .trim();
}

function accountView(account: MastodonAccount | undefined): unknown {
  if (!account) return null;
  return {
    id: account.id,
    username: account.username || null,
    acct: account.acct || null,
    display_name: account.display_name || null,
    url: account.url || null,
    note: stripHtml(account.note),
    avatar: account.avatar || null,
    header: account.header || null,
    locked: account.locked ?? null,
    discoverable: account.discoverable ?? null,
    indexable: account.indexable ?? null,
    bot: account.bot ?? null,
    followers_count: account.followers_count ?? null,
    following_count: account.following_count ?? null,
    statuses_count: account.statuses_count ?? null,
    fields: account.fields || [],
  };
}

function statusView(status: MastodonStatus | undefined): unknown {
  if (!status) return null;
  return {
    id: status.id,
    url: status.url || null,
    created_at: status.created_at || null,
    edited_at: status.edited_at || null,
    content_html: status.content || "",
    content_text: stripHtml(status.content),
    visibility: status.visibility || null,
    sensitive: status.sensitive === true,
    spoiler_text: status.spoiler_text || null,
    in_reply_to_id: status.in_reply_to_id || null,
    in_reply_to_account_id: status.in_reply_to_account_id || null,
    account: accountView(status.account),
    mentions: status.mentions || [],
    tags: status.tags || [],
  };
}

function notificationView(notification: MastodonNotification): unknown {
  return {
    id: notification.id,
    type: notification.type,
    created_at: notification.created_at || null,
    account: accountView(notification.account),
    status: statusView(notification.status),
  };
}

export function runMastodonAccountList(): unknown {
  return { ok: true, provider: "mastodon", accounts: listMastodonAccounts() };
}

export async function runMastodonAuthStart(args: {
  instance_url: string;
  account_id?: string;
  scopes?: string[];
  force_login?: boolean;
  client_name?: string;
}): Promise<unknown> {
  const result = await startMastodonAuthorization({
    instanceUrl: args.instance_url,
    accountId: args.account_id,
    scopes: args.scopes,
    forceLogin: args.force_login,
    clientName: args.client_name,
  });
  return {
    ok: true,
    provider: "mastodon",
    ...result,
    next_step: "Откройте authorization_url, подтвердите доступ на Mastodon и передайте показанный код вместе со state в ads_mastodon_auth_complete.",
    security: "Код авторизации одноразовый. Access token сохраняется только в локальном ADS_MCP_DATA/mastodon-accounts.json и не возвращается MCP-клиенту.",
  };
}

export async function runMastodonAuthComplete(args: { state: string; code: string }): Promise<unknown> {
  const result = await completeMastodonAuthorization(args.state, args.code);
  return {
    ok: true,
    provider: "mastodon",
    account_id: result.accountId,
    instance_url: result.instanceUrl,
    account: accountView(result.account),
    state_file: result.stateFile,
  };
}

export async function runMastodonStatus(args: { account_id?: string }): Promise<unknown> {
  const account = await getMastodonCurrentAccount(args.account_id);
  return { ok: true, provider: "mastodon", account: accountView(account) };
}

export async function runMastodonThreadCreate(args: {
  account_id?: string;
  posts: string[];
  visibility?: "public" | "unlisted" | "private";
  delay_ms?: number;
  pin_root?: boolean;
  confirm?: boolean;
}): Promise<unknown> {
  if (args.confirm !== true) {
    return {
      ok: false,
      error: "Создание треда Mastodon требует явного confirm=true",
      safety: "Публикуются только явно переданные тексты; закрепление корневого поста также выполняется только при pin_root=true.",
    };
  }
  const posts = args.posts.map((post) => post.trim()).filter(Boolean);
  if (!posts.length) return { ok: false, error: "Нужен хотя бы один непустой пост для треда" };
  if (posts.length > 15) return { ok: false, error: "Тред ограничен 15 постами за один вызов" };
  const delayMs = Math.max(0, Math.min(60_000, Math.floor(args.delay_ms || 0)));
  const statuses: unknown[] = [];
  let parentId: string | undefined;
  for (let index = 0; index < posts.length; index += 1) {
    if (index > 0 && delayMs > 0) await new Promise((resolve) => setTimeout(resolve, delayMs));
    try {
      const status = await createMastodonStatus({
        accountId: args.account_id,
        text: posts[index],
        visibility: args.visibility || "public",
        inReplyToId: parentId,
      });
      statuses.push(statusView(status));
      parentId = status.id;
    } catch (error) {
      return {
        ok: false,
        provider: "mastodon",
        requested: posts.length,
        processed: statuses.length,
        statuses,
        error: error instanceof Error ? error.message : String(error),
        safety: "Публикация остановлена на первой ошибке; автоматические повторы не выполняются.",
      };
    }
  }
  let pinned: unknown = null;
  if (args.pin_root) {
    try {
      const rootId = (statuses[0] as { id?: string } | undefined)?.id;
      if (!rootId) throw new Error("Корневой статус не вернул id");
      pinned = statusView(await pinMastodonStatus({ accountId: args.account_id, statusId: rootId }));
    } catch (error) {
      return {
        ok: false,
        provider: "mastodon",
        requested: posts.length,
        processed: statuses.length,
        statuses,
        pin_error: error instanceof Error ? error.message : String(error),
        safety: "Тред опубликован, но закрепление остановилось на ошибке.",
      };
    }
  }
  return {
    ok: true,
    provider: "mastodon",
    requested: posts.length,
    processed: statuses.length,
    statuses,
    pinned_root: args.pin_root === true,
    pinned,
    safety: "Опубликован только явно переданный тред; при pin_root=true закреплён его корневой пост.",
  };
}

export async function runMastodonPinStatus(args: {
  account_id?: string;
  status_id: string;
  confirm?: boolean;
}): Promise<unknown> {
  if (args.confirm !== true) {
    return {
      ok: false,
      error: "Закрепление статуса Mastodon требует явного confirm=true",
      safety: "Закрепляется только один явно выбранный статус за вызов.",
    };
  }
  const status = await pinMastodonStatus({ accountId: args.account_id, statusId: args.status_id });
  return {
    ok: true,
    provider: "mastodon",
    status: statusView(status),
    safety: "Закреплён один явно выбранный публичный статус через Mastodon API.",
  };
}

export async function runMastodonNotificationList(args: {
  account_id?: string;
  limit?: number;
  since_id?: string;
}): Promise<unknown> {
  const notifications = await listMastodonNotifications(args.account_id, args.limit, args.since_id);
  return {
    ok: true,
    provider: "mastodon",
    count: notifications.length,
    notifications: notifications.map(notificationView),
    note: "Возвращаются только mention-уведомления, чтобы подготовить контекст ответа. Публикация выполняется отдельным инструментом с confirm=true.",
  };
}

export async function runMastodonHashtagSearch(args: {
  account_id?: string;
  hashtags: string[];
  per_hashtag_limit?: number;
  min_signal_score?: number;
}): Promise<unknown> {
  const hashtags = normalizeHashtags(args.hashtags);
  if (!hashtags.length) return { ok: false, error: "Укажи хотя бы один AI-хештег" };
  const perHashtagLimit = Math.max(1, Math.min(40, Math.floor(args.per_hashtag_limit || 20)));
  const minSignalScore = Math.max(0, Math.min(100, Math.floor(args.min_signal_score ?? 0)));
  const collected = await collectMastodonHashtagCandidates({
    accountId: args.account_id,
    hashtags,
    perHashtagLimit,
  });
  const ranked = collected.candidates
    .filter((candidate) => candidate.signalScore >= minSignalScore)
    .sort((left, right) => right.signalScore - left.signalScore
      || right.postCount - left.postCount
      || (right.account.followers_count || 0) - (left.account.followers_count || 0))
    .map(candidateView);
  return {
    ok: true,
    provider: "mastodon",
    hashtags,
    per_hashtag_limit: perHashtagLimit,
    min_signal_score: minSignalScore,
    posts_scanned: collected.posts.length,
    candidate_count: ranked.length,
    candidates: ranked,
    next_step: "Сначала проверь signal_score и evidence; ads_mastodon_follow подписывает только один выбранный аккаунт за вызов и требует confirm=true.",
  };
}

export async function runMastodonInterestSearch(args: {
  account_id?: string;
  project_id?: string;
  hashtags?: string[];
  per_hashtag_limit?: number;
  min_signal_score?: number;
  save_to_research?: boolean;
}): Promise<unknown> {
  const requestedHashtags = args.hashtags?.length
    ? args.hashtags
    : [...MASTODON_INTEREST_DISCOVERY_HASHTAGS];
  const hashtags = normalizeHashtags(requestedHashtags);
  if (!hashtags.length) return { ok: false, error: "Не удалось собрать список хештегов для discovery" };
  const perHashtagLimit = Math.max(1, Math.min(40, Math.floor(args.per_hashtag_limit || 20)));
  const minSignalScore = Math.max(1, Math.min(100, Math.floor(args.min_signal_score ?? 30)));
  const saveToResearch = args.save_to_research !== false;
  const collected = await collectMastodonHashtagCandidates({
    accountId: args.account_id,
    hashtags,
    perHashtagLimit,
  });
  const selected = collected.candidates
    .filter((candidate) => candidate.signalScore >= minSignalScore)
    .sort((left, right) => right.signalScore - left.signalScore
      || right.postCount - left.postCount
      || (right.account.followers_count || 0) - (left.account.followers_count || 0));
  let savedContacts = 0;
  let savedPosts = 0;
  const projectId = args.project_id || "neron";
  if (saveToResearch) {
    const now = new Date().toISOString();
    for (const candidate of selected) {
      const profileUrl = candidate.account.url || undefined;
      const candidateTopics = [...new Set([
        ...[...candidate.matchedHashtags].map((tag) => `#${tag}`),
        ...candidate.matchedSignals,
      ])].slice(0, 50);
      const contact = upsertInterestContact({
        projectId,
        channel: "mastodon",
        externalUserId: candidate.account.id,
        instanceUrl: instanceOrigin(profileUrl),
        profileUrl,
        displayName: candidate.account.display_name,
        username: candidate.account.acct || candidate.account.username,
        category: "potential_user",
        contactType: "potential_user",
        status: "candidate",
        consentStatus: "unknown",
        relevanceScore: candidate.signalScore,
        followersCount: candidate.account.followers_count,
        matchedTopics: candidateTopics,
        evidence: candidate.evidence.map((item) => ({
          post_id: item.status.id,
          url: postUrl(item.status, candidate.account, instanceOrigin(profileUrl)),
          created_at: item.status.created_at,
          excerpt: statusText(item.status).slice(0, 1000),
          matched_signals: item.analysis.matchedSignals,
        })),
        notes: "Публичная discovery-находка по сигналам боли/интереса; требуется ручная проверка перед любым контактом.",
        metadata: {
          source: "mastodon_interest_signal_search",
          search_account_id: args.account_id || "default",
          matched_hashtags: [...candidate.matchedHashtags],
          matched_signals: [...candidate.matchedSignals],
          matched_keywords: [...candidate.matchedKeywords],
          signal_type: candidate.signalType,
        },
        firstSeenAt: candidate.evidence.at(-1)?.status.created_at,
        lastSeenAt: now,
      });
      savedContacts += contact ? 1 : 0;
      for (const item of candidate.evidence) {
        upsertInterestResearchPost({
          projectId,
          channel: "mastodon",
          externalPostId: item.status.id,
          postUrl: postUrl(item.status, candidate.account, instanceOrigin(profileUrl)),
          authorExternalUserId: candidate.account.id,
          authorUsername: candidate.account.acct || candidate.account.username,
          authorDisplayName: candidate.account.display_name,
          publishedAt: item.status.created_at,
          contentExcerpt: statusText(item.status).slice(0, 1000),
          signalType: item.analysis.signalType,
          relevanceScore: item.analysis.score,
          tags: [...new Set([
            ...item.hashtags.map((tag) => `#${tag}`),
            ...(item.status.tags || []).map((tag) => `#${tag.name}`),
            ...item.analysis.matchedSignals,
          ])].slice(0, 50),
          status: "candidate",
          metadata: {
            source: "mastodon_interest_signal_search",
            search_account_id: args.account_id || "default",
            matched_signals: item.analysis.matchedSignals,
            matched_keywords: item.analysis.matchedKeywords,
          },
        });
        savedPosts += 1;
      }
    }
  }
  return {
    ok: true,
    provider: "mastodon",
    project_id: projectId,
    hashtags,
    per_hashtag_limit: perHashtagLimit,
    min_signal_score: minSignalScore,
    posts_scanned: collected.posts.length,
    candidate_count: selected.length,
    saved_to_research: saveToResearch,
    saved_contacts: savedContacts,
    saved_posts: savedPosts,
    candidates: selected.map(candidateView),
    ...(saveToResearch ? { stats_7d: buildInterestResearchStats({ projectId, channel: "mastodon", days: 7 }) } : {}),
    note: "Поиск читает публичные hashtag timelines, включая федеративные посты Friendica, если они попали в timeline инстанса; подписки и сообщения не выполняются.",
  };
}

export async function runMastodonFollow(args: {
  account_id?: string;
  target_account_id: string;
  reblogs?: boolean;
  notify?: boolean;
  confirm?: boolean;
}): Promise<unknown> {
  if (args.confirm !== true) {
    return {
      ok: false,
      error: "Подписка на аккаунт Mastodon требует явного confirm=true",
      safety: "Один выбранный аккаунт за вызов; поиск по AI-хештегам сам по себе не запускает подписку.",
    };
  }
  const relationship = await followMastodonAccount({
    accountId: args.account_id,
    targetAccountId: args.target_account_id,
    reblogs: args.reblogs,
    notify: args.notify,
  });
  return {
    ok: true,
    provider: "mastodon",
    target_account_id: args.target_account_id,
    relationship,
    safety: "Подписка выполнена одним явно подтверждённым вызовом Mastodon API.",
  };
}

export async function runMastodonReply(args: {
  account_id?: string;
  status_id: string;
  text: string;
  visibility?: "public" | "unlisted" | "private" | "direct";
  confirm?: boolean;
}): Promise<unknown> {
  if (args.confirm !== true) {
    return {
      ok: false,
      error: "Ответ в Mastodon требует явного confirm=true",
      safety: "Один ответ на один выбранный статус; массовые ответы и автоматические личные сообщения не поддерживаются.",
    };
  }
  const result = await replyToMastodonStatus({
    accountId: args.account_id,
    statusId: args.status_id,
    text: args.text,
    visibility: args.visibility,
  });
  return {
    ok: true,
    provider: "mastodon",
    status: statusView(result.status),
    source_visibility: result.sourceVisibility,
    visibility: result.visibility,
    mention: result.mention,
    safety: "Отправлен один явно подтверждённый ответ через Mastodon API; видимость не может стать шире исходного статуса.",
  };
}

export async function runMastodonDirectMessage(args: {
  account_id?: string;
  target_account_id: string;
  text: string;
  confirm?: boolean;
}): Promise<unknown> {
  if (args.confirm !== true) {
    return {
      ok: false,
      error: "Личное сообщение Mastodon требует явного confirm=true",
      safety: "Один direct-статус одному выбранному аккаунту за вызов; массовая рассылка не поддерживается.",
    };
  }
  const result = await sendMastodonDirectMessage({
    accountId: args.account_id,
    targetAccountId: args.target_account_id,
    text: args.text,
  });
  return {
    ok: true,
    provider: "mastodon",
    target: accountView(result.target),
    status: statusView(result.status),
    visibility: result.visibility,
    safety: "Отправлен один direct-статус с автоматическим mention выбранного аккаунта; массовые и скрытые пакетные отправки не выполняются.",
  };
}

export async function runMastodonPublicMention(args: {
  account_id?: string;
  target_account_id: string;
  text: string;
  in_reply_to_id?: string;
  confirm?: boolean;
}): Promise<unknown> {
  if (args.confirm !== true) {
    return {
      ok: false,
      error: "Публичное упоминание Mastodon требует явного confirm=true",
      safety: "Один публичный mention одному выбранному аккаунту за вызов; массовые публикации не поддерживаются.",
    };
  }
  const result = await sendMastodonPublicMention({
    accountId: args.account_id,
    targetAccountId: args.target_account_id,
    text: args.text,
    inReplyToId: args.in_reply_to_id,
  });
  return {
    ok: true,
    provider: "mastodon",
    target: accountView(result.target),
    status: statusView(result.status),
    visibility: result.visibility,
    safety: "Опубликован один публичный mention выбранного аккаунта; массовые публикации не выполняются.",
  };
}

export async function runMastodonMessageBatch(args: {
  account_id?: string;
  messages: Array<{
    mode: "direct" | "public_mention" | "reply";
    target_account_id: string;
    status_id?: string;
    text: string;
    visibility?: "public" | "unlisted" | "private" | "direct";
  }>;
  delay_ms?: number;
  confirm?: boolean;
}): Promise<unknown> {
  if (args.confirm !== true) {
    return {
      ok: false,
      error: "Пакет отправки Mastodon требует явного confirm=true",
      safety: "Список получателей и точные тексты должны быть переданы явно; поиск сам не формирует рассылку.",
    };
  }
  if (!args.messages.length) {
    return { ok: false, error: "Нужен хотя бы один явно выбранный message item" };
  }
  const delayMs = Math.max(0, Math.min(60_000, Math.floor(args.delay_ms || 0)));
  const results: Array<Record<string, unknown>> = [];
  for (let index = 0; index < args.messages.length; index += 1) {
    if (index > 0 && delayMs > 0) await new Promise((resolve) => setTimeout(resolve, delayMs));
    const item = args.messages[index];
    try {
      if (item.mode === "direct") {
        const result = await sendMastodonDirectMessage({
          accountId: args.account_id,
          targetAccountId: item.target_account_id,
          text: item.text,
        });
        results.push({
          index,
          mode: item.mode,
          target_account_id: item.target_account_id,
          ok: true,
          status: statusView(result.status),
          visibility: result.visibility,
        });
      } else if (item.mode === "public_mention") {
        const result = await sendMastodonPublicMention({
          accountId: args.account_id,
          targetAccountId: item.target_account_id,
          text: item.text,
          inReplyToId: item.status_id,
        });
        results.push({
          index,
          mode: item.mode,
          target_account_id: item.target_account_id,
          ok: true,
          status: statusView(result.status),
          visibility: result.visibility,
        });
      } else {
        if (!item.status_id) throw new Error("reply mode requires status_id");
        const result = await replyToMastodonStatus({
          accountId: args.account_id,
          statusId: item.status_id,
          text: item.text,
          visibility: item.visibility,
        });
        results.push({
          index,
          mode: item.mode,
          target_account_id: item.target_account_id,
          status_id: item.status_id,
          ok: true,
          status: statusView(result.status),
          source_visibility: result.sourceVisibility,
          visibility: result.visibility,
            mention: result.mention,
        });
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      results.push({ index, mode: item.mode, target_account_id: item.target_account_id, ok: false, error: message });
      if (/429|rate.?limit|flood|too many requests/i.test(message)) break;
    }
  }
  return {
    ok: results.length === args.messages.length && results.every((item) => item.ok === true),
    provider: "mastodon",
    requested: args.messages.length,
    processed: results.length,
    results,
    safety: "Отправлены только явно переданные сообщения в заданном порядке; один сбой или rate limit не запускает автоматические повторы.",
  };
}

export async function runMastodonProfileUpdate(args: {
  account_id?: string;
  display_name?: string;
  note?: string;
  locked?: boolean;
  discoverable?: boolean;
  indexable?: boolean;
  hide_collections?: boolean;
  language?: string;
  fields?: Array<{ name: string; value: string }>;
  confirm?: boolean;
}): Promise<unknown> {
  if (args.confirm !== true) {
    return {
      ok: false,
      error: "Изменение профиля Mastodon требует явного confirm=true",
      safety: "Передайте только те поля, которые действительно нужно изменить; остальные останутся без изменений.",
    };
  }
  const account = await updateMastodonProfile({
    accountId: args.account_id,
    displayName: args.display_name,
    note: args.note,
    locked: args.locked,
    discoverable: args.discoverable,
    indexable: args.indexable,
    hideCollections: args.hide_collections,
    language: args.language,
    fields: args.fields,
  });
  return {
    ok: true,
    provider: "mastodon",
    account: accountView(account),
    safety: "Профиль обновлён одним явно подтверждённым вызовом Mastodon API.",
  };
}
