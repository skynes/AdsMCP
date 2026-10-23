import type { IntegrationAdapterInfo, IntegrationAdapterPlan } from "./contracts.js";
import { getCapabilityProfile } from "./capability-profile.js";
import { listConfiguredModules } from "./mcp-modules.js";
import { mastodonCredentialsConfigured } from "../mastodon/client.js";

const ADAPTERS: IntegrationAdapterInfo[] = [
  {
    provider: "google_ads",
    label: "Google Ads",
    mode: "mcp_module",
    intro: "Сеть с высоким поисковым намерением и широким инвентарём Google: Search, Shopping, YouTube, Display и приложения.",
    audiences: ["поисковый спрос", "покупатели товаров", "аудитория YouTube", "широкий охват"],
    bestFor: ["поисковый спрос", "e-commerce", "YouTube и видео", "продвижение приложений"],
    setupLevel: "high",
    capabilities: ["accounts.read", "campaigns.read", "metrics.read", "keywords.read", "audiences.read"],
    secretEnv: [
      "ADS_GOOGLE_ADS_CUSTOMER_ID",
      "ADS_GOOGLE_ADS_DEVELOPER_TOKEN",
      "ADS_GOOGLE_ADS_JSON_KEY_FILE_PATH",
    ],
    optionalEnv: ["ADS_GOOGLE_ADS_LOGIN_CUSTOMER_ID", "ADS_GOOGLE_ADS_API_VERSION"],
    moduleIds: ["google_ads_official", "google_ads_api_agent"],
    implementation: "local_or_module",
    writePolicy: "manual_only",
    notes: "Use google_ads_official for Google-native read-only GAQL tools and google_ads_api_agent for the guarded action surface from itallstartedwithaidea/google-ads-api-agent. The local GAQL adapter remains the SQLite normalization fallback; provider mutations require confirm=true after explicit user approval.",
  },
  {
    provider: "yandex_direct",
    label: "Yandex Direct",
    mode: "mcp_module",
    intro: "Поисковая реклама и рекламная сеть Yandex с сильным фокусом на русскоязычный спрос и регионы СНГ.",
    audiences: ["Россия и СНГ", "русскоязычный поиск", "локальный спрос", "сегменты CRM и Metrica"],
    bestFor: ["привлечение в СНГ", "поисковый спрос", "исследование спроса Wordstat", "локальный бизнес"],
    setupLevel: "medium",
    capabilities: ["campaigns.read", "campaigns.write", "metrics.read"],
    secretEnv: ["ADS_YANDEX_DIRECT_TOKEN_FILE"],
    optionalEnv: [
      "ADS_YANDEX_DIRECT_CLIENT_LOGIN",
      "ADS_YANDEX_METRIKA_TOKEN_FILE",
      "ADS_YANDEX_WEBMASTER_TOKEN_FILE",
      "ADS_YANDEX_MCP_DIR",
      "YANDEX_DIRECT_TOKEN",
    ],
    moduleIds: ["yandex_mcp_zai", "yandex_direct"],
    implementation: "module",
    writePolicy: "guarded_api",
    notes: "Primary module: ZAI.ONE yandex-mcp (yandex_mcp_zai, stdio via scripts/yandex-direct-mcp.py) with guarded Direct writes; ads_yandex_direct_write requires confirm=true, an idempotency key and provider readback, while ads_yandex_direct_create_campaign creates only a paused text campaign with serving off. ads_yandex_direct_sync with module_id=yandex_mcp_zai uses direct_get_statistics. The community mcp-yandex-direct module (YANDEX_DIRECT_TOKEN) remains a fallback."
  },
  {
    provider: "meta_ads",
    label: "Meta Ads",
    mode: "mcp_module",
    intro: "Социальная реклама Facebook и Instagram: интересы, похожие аудитории, ретаргетинг и визуальные креативы.",
    audiences: ["широкая социальная аудитория", "интересы", "lookalike", "ретаргетинг"],
    bestFor: ["визуальное привлечение", "ретаргетинг", "лидогенерация", "масштабирование спроса"],
    setupLevel: "high",
    capabilities: ["accounts.read", "campaigns.read", "ad_groups.read", "ads.read", "creatives.read", "audiences.read", "targeting.read", "metrics.read", "reports.read", "pixels.read", "pages.read", "catalogs.read"],
    secretEnv: ["META_ACCESS_TOKEN"],
    optionalEnv: ["META_ENABLE_WRITES", "META_API_VERSION"],
    moduleIds: ["meta_ads"],
    implementation: "module",
    writePolicy: "manual_only",
    notes: "Use @getmcpads/meta-ads-mcp-server v2.0.1 against the official Meta Graph/Marketing API. All 41 read tools are allowlisted; the package's 23 writes stay disabled by META_ENABLE_WRITES=0 and are not exposed to AdsMCP.",
  },
  {
    provider: "openai_ads",
    label: "OpenAI Ads / ChatGPT",
    mode: "api",
    intro: "Планируемый рекламный канал экосистемы OpenAI и ChatGPT для спроса, который уже сформулирован в AI-диалоге.",
    audiences: ["пользователи ChatGPT", "AI-first спрос", "B2B и software", "исследовательские запросы"],
    bestFor: ["AI-native продукты", "B2B demand generation", "сценарии с высоким intent", "привлечение разработчиков"],
    setupLevel: "high",
    capabilities: ["campaigns.read", "metrics.read", "audiences.read"],
    secretEnv: [],
    implementation: "plan",
    writePolicy: "manual_only",
    notes: "Planned OpenAI Ads / ChatGPT Ads adapter. Provider availability, account model, targeting and API surface must be verified before implementation.",
  },
  {
    provider: "spotify_ads",
    label: "Spotify Ads",
    mode: "mcp_module",
    intro: "Аудио- и video-first канал Spotify для охвата, контекстных интересов и brand consideration.",
    audiences: ["слушатели музыки и подкастов", "аудио-аудитория", "mobile-first пользователи", "контекстные интересы"],
    bestFor: ["brand awareness", "аудио-продукты", "подкасты и creators", "охват верхнего уровня воронки"],
    setupLevel: "high",
    capabilities: ["accounts.read", "campaigns.read", "ad_groups.read", "ads.read", "metrics.read", "reports.read", "targeting.read", "creatives.read"],
    secretEnv: [],
    optionalEnv: ["ADPORT_HOME"],
    moduleIds: ["spotify_ads"],
    implementation: "module",
    writePolicy: "manual_only",
    notes: "Use local Adport v0.6.1: its Spotify provider talks directly to the official Spotify Ads API and stores BYO credentials locally. AdsMCP exposes only accounts/reporting/recommendation reads; provider writes remain outside the allowlist until a separate approval.",
  },
  {
    provider: "x_ads",
    label: "X Ads",
    mode: "mcp_module",
    intro: "Канал X для real-time обсуждений, интересов и контекстного спроса вокруг событий и тем.",
    audiences: ["real-time communities", "технологические и business-аудитории", "подписчики тем", "event-driven спрос"],
    bestFor: ["launch и announcements", "developer-аудитория", "контекстные кампании", "conversation-led demand"],
    setupLevel: "high",
    capabilities: ["accounts.read", "campaigns.read", "ad_groups.read", "ads.read", "funding.read", "targeting.read", "creatives.read", "pixels.read", "metrics.read", "reports.read"],
    secretEnv: ["X_ADS_ACCESS_TOKEN", "X_ADS_ACCOUNT_IDS"],
    optionalEnv: ["X_ADS_SCOPES", "X_ADS_ENABLE_WRITES"],
    moduleIds: ["x_ads"],
    implementation: "module",
    writePolicy: "manual_only",
    notes: "Use the local @getmcpads/x-ads-mcp-server module against the official X Ads API. Read tools only are allowlisted; provider writes stay disabled. The official remote X Ads MCP remains the preferred future path once the bridge supports OAuth2 PKCE and rotating refresh tokens.",
  },
  {
    provider: "telegram_ads",
    label: "Telegram Ads",
    mode: "mcp_module",
    intro: "Нативное размещение внутри Telegram-каналов и ботов; особенно полезно для сообществ, нишевых продуктов и Telegram-first воронок.",
    audiences: ["подписчики каналов", "пользователи ботов", "тематические сообщества", "технические и crypto-ниши"],
    bestFor: ["привлечение в сообщества", "продвижение каналов и ботов", "Telegram-first продукты", "СНГ и нишевые аудитории"],
    setupLevel: "high",
    capabilities: ["accounts.read", "accounts.context_switch", "campaigns.read", "metrics.read", "placements.read"],
    secretEnv: [],
    optionalEnv: ["ADS_TELEGRAM_MCP_DIR"],
    moduleIds: ["telegram_ads"],
    implementation: "module",
    writePolicy: "manual_only",
    notes: "Use the ZAI HTTP-session module; it does not start Chromium during normal work. The dedicated AdsMCP account workflow may switch cabinets only with confirm=true and restores the original cabinet; provider writes stay disabled by the allowlist.",
  },
  {
    provider: "telegram_ads_official_api",
    label: "Telegram Ads Official API",
    mode: "api",
    intro: "Официальный HTTP API Telegram Ads для точных периодов статистики, бюджетов, аудиторий, pixels и транзакций.",
    audiences: ["каналы и боты Telegram", "пользователи Telegram", "search targeting", "ретаргетинг через аудитории"],
    bestFor: ["date-bounded reporting", "сверка с кабинетом", "ежедневные бюджеты", "будущий guarded campaign management"],
    setupLevel: "medium",
    capabilities: [
      "accounts.read",
      "campaigns.read",
      "metrics.read",
      "audiences.read",
      "pixels.read",
      "transactions.read",
      "targeting.read",
    ],
    secretEnv: ["ADS_TELEGRAM_ADS_API_TOKEN"],
    optionalEnv: ["ADS_TELEGRAM_ADS_API_BASE_URL"],
    implementation: "local",
    writePolicy: "guarded_api",
    notes: "Official endpoint is https://promoteapi.telegram.org. AdsMCP currently exposes only read/report/sync tools; official write methods are catalogued but disabled until a separate confirmation, idempotency and provider-readback workflow is implemented.",
  },
  {
    provider: "telegram_account",
    label: "Telegram user account / Lead Proxy",
    mode: "api",
    intro: "Локальный пользовательский Telegram-клиент для Agentic Lead Engagement: discovery и контекстные диалоги через TDLib.",
    audiences: ["Telegram-чаты и каналы", "лиды", "сообщества", "relationship-first outreach"],
    bestFor: ["lead discovery", "research по чатам", "контекстная память", "будущий Conversational Lead Proxy"],
    setupLevel: "high",
    capabilities: ["account.auth", "chats.read", "messages.read"],
    secretEnv: ["TELEGRAM_API_ID", "TELEGRAM_API_HASH"],
    optionalEnv: ["TG_APP_API_ID", "TG_APP_API_HASH", "TG_API_ID", "TG_API_HASH", "TELEGRAM_TDLIB_VERBOSITY"],
    implementation: "local",
    writePolicy: "manual_only",
    notes: "Uses the local TDLib account flow by default. TDLib database and files stay under the ignored ADS_MCP_DATA/telegram directory. Chat search and one-message sending fail closed unless the connected account has Telegram Premium; sending also requires explicit confirm=true.",
  },
  {
    provider: "discord",
    label: "Discord bot / community connector",
    mode: "api",
    intro: "Официальный Discord bot-коннектор для разрешённых серверов, каналов и контекстного community research.",
    audiences: ["Discord-серверы", "тематические сообщества", "участники доступных guild", "community-led demand"],
    bestFor: ["исследование разрешённых каналов", "поиск контекста и вопросов", "опросы в собственном community", "ручная публикация в канале"],
    setupLevel: "medium",
    capabilities: ["account.auth", "guilds.read", "channels.read", "messages.read", "members.search", "channel_messages.write"],
    secretEnv: ["DISCORD_BOT_TOKEN"],
    optionalEnv: ["DISCORD_APPLICATION_ID", "DISCORD_API_BASE_URL"],
    implementation: "local",
    writePolicy: "manual_only",
    notes: "Uses the official bot API only. The bot sees installed servers and permitted channels; it does not automate a normal user account, scrape a global member directory or send bulk/private promotional messages.",
  },
  {
    provider: "mastodon",
    label: "Mastodon / fediverse account connector",
    mode: "api",
    intro: "OAuth-подключение аккаунта Mastodon к выбранному серверу fediverse для чтения упоминаний, единичных ответов и ручного обновления профиля.",
    audiences: ["Mastodon и fediverse", "публичные обсуждения", "подписчики и упоминания", "community-led demand"],
    bestFor: ["контекстные ответы на упоминания", "ручное ведение профиля", "fediverse community research", "relationship-first engagement"],
    setupLevel: "medium",
    capabilities: ["account.auth", "account.read", "notifications.read", "status_reply.write", "profile.write"],
    secretEnv: [],
    optionalEnv: ["MASTODON_INSTANCE_URL", "MASTODON_ACCESS_TOKEN", "MASTODON_ACCOUNT_ID", "MASTODON_SCOPES", "MASTODON_CLIENT_NAME", "MASTODON_APP_WEBSITE"],
    implementation: "local",
    writePolicy: "manual_only",
    notes: "Uses the instance OAuth 2 authorization-code flow with PKCE. Tokens are stored locally in ADS_MCP_DATA/mastodon-accounts.json; replies and profile edits require explicit confirm=true and are limited to one selected action.",
  },
  {
    provider: "bing_ads",
    label: "Bing / Microsoft Advertising",
    mode: "mcp_module",
    intro: "Дополнительный поисковый охват в экосистеме Microsoft; обычно используется как расширение Google для desktop и западных рынков.",
    audiences: ["поисковый спрос", "desktop-аудитория", "западные рынки", "экосистема Microsoft"],
    bestFor: ["дополнение Google", "B2B и поиск", "западные рынки", "desktop-конверсии"],
    setupLevel: "medium",
    capabilities: ["campaigns.read", "metrics.read", "keywords.read"],
    secretEnv: ["MICROSOFT_ADS_ACCESS_TOKEN"],
    optionalEnv: ["BING_ADS_DEVELOPER_TOKEN", "BING_ADS_CUSTOMER_ID", "BING_ADS_ACCOUNT_ID"],
    moduleIds: ["microsoft_ads_official"],
    implementation: "module",
    writePolicy: "manual_only",
    notes: "Official Microsoft Advertising MCP is remote and OAuth-based; keep Bing writes manual-only until the local OAuth flow is integrated.",
  },
  {
    provider: "avito_ads",
    label: "Avito Ads",
    mode: "mcp_module",
    intro: "Медийная и performance-реклама в кабинете Авито Рекламы для российского рынка и аудитории объявлений.",
    audiences: ["аудитория Авито", "российский рынок", "покупатели товаров и услуг", "performance и brand кампании"],
    bestFor: ["реклама на Авито", "кампании и группы", "анализ расхода", "агентские аккаунты"],
    setupLevel: "medium",
    capabilities: ["accounts.read", "balances.read", "campaigns.read", "ad_groups.read", "creatives.read", "reports.read", "contracts.read", "users.read"],
    secretEnv: ["AVITO_ADS_CLIENT_ID", "AVITO_ADS_CLIENT_SECRET", "AVITO_ADS_ACCOUNT_ID"],
    optionalEnv: ["AVITO_ADS_ENVIRONMENT", "AVITO_ADS_TIMEOUT_MS", "AVITO_ADS_MAX_RETRIES", "AVITO_ADS_TOKEN_LEEWAY_SECONDS", "ASKADS_TELEMETRY"],
    moduleIds: ["avito_ads"],
    implementation: "module",
    writePolicy: "manual_only",
    notes: "A1-x-tech mcp-avito-ads v1.1.0 runs locally over stdio and calls the official Avito Ads API with client_credentials. AdsMCP exposes only account, balance, campaign, group, creative, contract, user and statistics reads; writes, money transfers and raw_request stay outside the allowlist.",
  },
  {
    provider: "apple_search_ads",
    label: "Apple Search Ads",
    mode: "mcp_module",
    intro: "Реклама в App Store в момент поиска приложения или категории; канал с очень сильным намерением установить приложение.",
    audiences: ["пользователи iOS", "поиск в App Store", "покупатели приложений", "аудитория категорий приложений"],
    bestFor: ["установки iOS", "рост приложения", "подписочные приложения", "App Store discovery"],
    setupLevel: "high",
    capabilities: ["accounts.read", "apps.read", "campaigns.read", "ad_groups.read", "ads.read", "creatives.read", "keywords.read", "targeting.read", "metrics.read", "reports.read", "insights.read", "recommendations.read", "audit.read"],
    secretEnv: ["APPLE_ADS_CLIENT_ID", "APPLE_ADS_TEAM_ID", "APPLE_ADS_KEY_ID", "APPLE_ADS_PRIVATE_KEY_PATH", "APPLE_ADS_AD_ACCOUNT_ID"],
    optionalEnv: ["APPLE_ADS_PROFILE", "APPLE_ADS_MCP_CONFIG", "APPLE_ADS_ALLOW_WRITES", "APPLE_ADS_ALLOW_DELETES"],
    moduleIds: ["apple_search_ads"],
    implementation: "module",
    writePolicy: "manual_only",
    notes: "Use zelentsov-dev/apple-ads-mcp release v0.3.7 for the official Apple Ads Platform API v1. All 57 read tools are allowlisted; the module's mutation/preview tools stay outside AdsMCP and both write gates are false.",
  },
  {
    provider: "tiktok_ads",
    label: "TikTok Ads",
    mode: "mcp_module",
    intro: "Discovery через короткие видео и creator-style креативы; подходит для быстрого тестирования идей и широкого верхнего уровня воронки.",
    audiences: ["молодая аудитория", "интересы и discovery", "creator и entertainment", "mobile-first пользователи"],
    bestFor: ["видеопривлечение", "узнаваемость", "тестирование креативов", "масштабирование mobile-продуктов"],
    setupLevel: "high",
    capabilities: ["accounts.read", "campaigns.read", "ad_groups.read", "ads.read", "creatives.read", "audiences.read", "targeting.read", "metrics.read", "reports.read", "pixels.read", "catalogs.read", "events.read"],
    secretEnv: ["TIKTOK_ACCESS_TOKEN", "TIKTOK_APP_ID", "TIKTOK_APP_SECRET"],
    optionalEnv: ["TIKTOK_ADVERTISER_ID", "TIKTOK_BC_ID", "TIKTOK_ENABLE_WRITES", "LOG_LEVEL"],
    moduleIds: ["tiktok_ads"],
    implementation: "module",
    writePolicy: "manual_only",
    notes: "Use @getmcpads/tiktok-ads-mcp-server v2.0.1 against the TikTok Business API. All 35 read tools are allowlisted; the package's 29 writes stay disabled by TIKTOK_ENABLE_WRITES=0 and are not exposed to AdsMCP.",
  },
  {
    provider: "reddit_ads",
    label: "Reddit Ads",
    mode: "mcp_module",
    intro: "Контекст сообществ и subreddit-ов; полезен там, где решение принимается через обсуждения, доверие и нишевую экспертизу.",
    audiences: ["технологические сообщества", "gaming", "нишевые subreddit-ы", "обсуждающий и исследующий спрос"],
    bestFor: ["community-продукты", "техническая аудитория", "B2B и developer-аудитория", "trust-led consideration"],
    setupLevel: "medium",
    capabilities: ["accounts.read", "campaigns.read", "ad_groups.read", "ads.read", "creatives.read", "metrics.read", "reports.read", "targeting.read"],
    secretEnv: ["REDDIT_CLIENT_ID", "REDDIT_CLIENT_SECRET", "REDDIT_REFRESH_TOKEN"],
    optionalEnv: ["REDDIT_ADS_ACCOUNT_ID", "REDDIT_ADS_WRITE_TIER"],
    moduleIds: ["reddit_ads"],
    implementation: "module",
    writePolicy: "manual_only",
    notes: "Pinned camlowe/mcp-server-reddit-ads v0.5.5 uses the official Reddit Ads API v3. AdsMCP forces read tier and allowlists only account, entity, creative-read, targeting-read and report tools.",
  },
  {
    provider: "email",
    label: "Email / SMTP + IMAP",
    mode: "mcp_module",
    intro: "Подключение почтового ящика для проверки входящих писем через IMAP и отправки сообщений через SMTP.",
    audiences: ["рабочая почта", "поддержка и операции", "уведомления", "проверка кодов и входящих писем"],
    bestFor: ["чтение и поиск писем", "отправка ответов", "подготовка черновиков", "проверка соединения почты"],
    setupLevel: "medium",
    capabilities: ["accounts.read", "mailboxes.read", "messages.read", "messages.search", "attachments.read", "messages.write", "drafts.write"],
    secretEnv: ["MCP_EMAIL_ADDRESS", "MCP_EMAIL_PASSWORD", "MCP_EMAIL_IMAP_HOST", "MCP_EMAIL_SMTP_HOST"],
    optionalEnv: [
      "MCP_EMAIL_ACCOUNT_NAME",
      "MCP_EMAIL_FULL_NAME",
      "MCP_EMAIL_USERNAME",
      "MCP_EMAIL_IMAP_PORT",
      "MCP_EMAIL_IMAP_TLS",
      "MCP_EMAIL_SMTP_PORT",
      "MCP_EMAIL_SMTP_TLS",
      "MCP_EMAIL_SMTP_STARTTLS",
      "MCP_EMAIL_SMTP_VERIFY_SSL",
      "MCP_EMAIL_RATE_LIMIT",
      "MCP_EMAIL_SEND_SAVE_TO_SENT",
      "MCP_EMAIL_READ_ONLY",
      "EMAIL_ACCOUNTS",
    ],
    moduleIds: ["email"],
    implementation: "module",
    writePolicy: "manual_only",
    notes: "Pinned @codefuturist/email-mcp v0.6.0 (Node.js >=24). IMAP read/search and SMTP send/reply/forward/draft tools are allowlisted; delete, bulk, mailbox/label mutations, scheduling and notification tools stay disabled. MCP_EMAIL_READ_ONLY=true is an additional send kill-switch.",
  },
  {
    provider: "crm",
    label: "CRM / conversion source",
    mode: "api",
    intro: "Это не рекламная сеть, а источник правды о лидах, продажах и выручке для проверки качества трафика.",
    audiences: ["существующие лиды", "воронка продаж", "клиенты CRM", "офлайн-конверсии"],
    bestFor: ["атрибуция выручки", "проверка CPA и ROAS", "offline-конверсии", "обучение автоматизации"],
    setupLevel: "high",
    capabilities: ["conversions.read", "conversions.write"],
    secretEnv: ["ADS_CRM_BASE_URL", "ADS_CRM_API_TOKEN"],
    optionalEnv: ["ADS_CRM_CONVERSIONS_PATH"],
    implementation: "plan",
    writePolicy: "guarded_api",
    notes: "Generic REST conversion adapter; endpoint shape is configured per CRM.",
  },
  {
    provider: "webhook",
    label: "Generic webhook / server-side events",
    mode: "webhook",
    intro: "Локальный вход для server-side событий сайта или приложения: конверсии, покупки и postback без привязки к одной сети.",
    audiences: ["посетители сайта", "лиды", "покупатели", "пользователи приложения"],
    bestFor: ["отслеживание конверсий", "дедупликация событий", "postback", "сведение данных разных сетей"],
    setupLevel: "low",
    capabilities: ["events.write"],
    secretEnv: [],
    implementation: "local",
    writePolicy: "event_ingest",
    notes: "Local event ingest; no external credentials are required.",
  },
];

export function listAdapterInfo(): Array<IntegrationAdapterInfo & { configured: boolean }> {
  const modules = listConfiguredModules();
  return ADAPTERS.map((adapter) => ({
    ...adapter,
    ...getCapabilityProfile(adapter.provider),
    configured:
      (adapter.provider === "mastodon"
        ? mastodonCredentialsConfigured()
        : ((adapter.implementation === "local" || adapter.implementation === "local_or_module") &&
        adapter.secretEnv.every((key) => Boolean(process.env[key]?.trim()))) ||
          Boolean(adapter.moduleIds?.some((id) => modules.some((module) => module.id === id && module.configured)))),
  }));
}

export function getAdapterInfo(provider: string): IntegrationAdapterInfo | undefined {
  const adapter = ADAPTERS.find((item) => item.provider === provider.trim().toLowerCase());
  return adapter ? { ...adapter, ...getCapabilityProfile(adapter.provider) } : undefined;
}

export function adapterPlan(provider?: string): IntegrationAdapterPlan[] {
  const selected = provider?.trim().toLowerCase();
  const modules = listConfiguredModules();
  return ADAPTERS.filter((adapter) => !selected || adapter.provider === selected).map((adapter) => {
    const missingEnv = adapter.secretEnv.filter((key) => !process.env[key]?.trim());
    const moduleConfigured = Boolean(
      adapter.moduleIds?.some((id) => modules.some((module) => module.id === id && module.configured)),
    );
    const envConfigured = missingEnv.length === 0;
    const localConfigured = adapter.provider === "mastodon"
      ? mastodonCredentialsConfigured()
      : (adapter.implementation === "local" || adapter.implementation === "local_or_module") && envConfigured;
    const configured = localConfigured || moduleConfigured;
    const readReady = configured || adapter.mode === "browser_assisted" || adapter.mode === "webhook";
    const writeReady = configured && adapter.writePolicy === "guarded_api";
    const nextActions: string[] = [];
    if (missingEnv.length > 0) nextActions.push(`Set ${missingEnv.join(", ")} in .env`);
    if (adapter.moduleIds?.length && !moduleConfigured) {
      nextActions.push(`Configure one of the provider modules: ${adapter.moduleIds.join(", ")}`);
    }
    if (adapter.mode === "browser_assisted") nextActions.push("Complete the provider login/export flow manually before importing data");
    if (adapter.provider === "mastodon" && !configured) {
      nextActions.push("Run ads_mastodon_auth_start with the selected instance, then complete the one-time OAuth code flow");
    }
    if (writeReady) nextActions.push("Keep writes in dry-run until guardrails and explicit execute=true are enabled");
    if (adapter.writePolicy === "event_ingest") nextActions.push("Send normalized conversion events through ads_event_ingest");
    return {
      provider: adapter.provider,
      label: adapter.label,
      mode: adapter.mode,
      intro: adapter.intro,
      audiences: adapter.audiences,
      bestFor: adapter.bestFor,
      setupLevel: adapter.setupLevel,
      configured,
      readReady,
      writeReady,
      requiredEnv: adapter.secretEnv,
      missingEnv,
      moduleIds: adapter.moduleIds,
      moduleConfigured,
      implementation: adapter.implementation,
      capabilities: adapter.capabilities,
      writePolicy: adapter.writePolicy,
      ...getCapabilityProfile(adapter.provider),
      notes: adapter.notes,
      nextActions,
    };
  });
}

export function platformGuide(provider?: string, goal?: string) {
  const selected = provider?.trim().toLowerCase();
  const needle = goal?.trim().toLowerCase();
  const candidates = ADAPTERS.filter((adapter) => !selected || adapter.provider === selected);
  const platforms = (needle
    ? candidates.filter((adapter) =>
        [adapter.provider, adapter.label, adapter.intro, ...adapter.audiences, ...adapter.bestFor]
          .join(" ")
          .toLowerCase()
          .includes(needle),
      )
    : candidates
  ).map((adapter) => ({
    provider: adapter.provider,
    label: adapter.label,
    intro: adapter.intro,
    audiences: adapter.audiences,
    bestFor: adapter.bestFor,
    setupLevel: adapter.setupLevel,
    mode: adapter.mode,
    implementation: adapter.implementation,
    capabilities: adapter.capabilities,
    moduleIds: adapter.moduleIds,
    writePolicy: adapter.writePolicy,
    ...getCapabilityProfile(adapter.provider),
    notes: adapter.notes,
  }));

  return {
    query: { provider: provider ?? null, goal: goal ?? null },
    principle:
      "Сначала выберите задачу и источник конверсии, затем подключайте одну-две подходящие сети. Не устанавливайте все модули без рекламного кабинета и понятного сценария.",
    recommendedStack: [
      "Одна acquisition-сеть под нужную аудиторию",
      "webhook или CRM для источника правды о конверсиях",
      "ads_campaign_analytics и ads_attribution_report для сравнения сетей",
    ],
    platforms,
    noMatch: platforms.length === 0,
  };
}
