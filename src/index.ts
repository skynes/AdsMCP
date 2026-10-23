#!/usr/bin/env node
import { readFileSync } from "node:fs";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";
import { loadEnv } from "./env.js";
import {
  acceptFreeUseRules,
  freeUseRulesResult,
  installFreeUseGate,
  FREE_USE_RULES_VERSION,
} from "./free-use.js";
import { checkForGithubUpdate } from "./update-check.js";
import {
  checkWeeklyRecommendationsPr,
  createGithubContributionPr,
  getGithubContributionStatus,
  setupGithubContribution,
} from "./weekly-contribution.js";
import { textResult } from "./tools/common.js";
import {
  runCampaignCreate,
  runCampaignGet,
  runCampaignList,
  runCampaignUpdate,
} from "./tools/campaigns.js";
import { runCampaignAnalytics, runCampaignTimeseries } from "./tools/analytics.js";
import { runAttributionReport } from "./tools/attribution.js";
import {
  runProjectAnalytics,
  runProjectCreate,
  runProjectGet,
  runProjectList,
  runProjectUpdate,
} from "./tools/projects.js";
import { runEventIngest, runSpendRecord } from "./tools/events.js";
import {
  runIntegrationList,
  runIntegrationPlan,
  runIntegrationRegister,
  runPlatformGuide,
} from "./tools/integrations.js";
import { runGoogleAdsReport, runGoogleAdsSync } from "./tools/google-ads.js";
import { replaceGoogleAdsPmaxImages } from "./integrations/google-ads-creatives.js";
import { runMicrosoftAdsReport, runMicrosoftAdsSync } from "./tools/microsoft-ads.js";
import { runModuleCall, runModulePlan, runModuleTools } from "./tools/modules.js";
import {
  runYandexDirectCreateCampaign,
  runYandexDirectReport,
  runYandexDirectSync,
  runYandexDirectWrite,
} from "./tools/yandex-direct.js";
import {
  runTelegramAdsAccountsReport,
  runTelegramAdsAccountsSync,
  runTelegramAdsReport,
  runTelegramAdsSync,
} from "./tools/telegram-ads.js";
import {
  runTelegramAdsApiCreateAd,
  runTelegramAdsApiIncreaseBudget,
  runTelegramAdsApiReport,
  runTelegramAdsApiSetPaused,
  runTelegramAdsApiStatus,
  runTelegramAdsApiSync,
  runTelegramAdsApiSubmitForReview,
} from "./tools/telegram-ads-api.js";
import {
  runTelegramAccountAuth,
  runTelegramAccountSend,
  runTelegramMessageReact,
  runTelegramAccountSearch,
  runTelegramChatReply,
  runTelegramChatMarkRead,
  runTelegramPublicPostReply,
  runTelegramPublicPostSearch,
  runTelegramAccountStatus,
  runTelegramChannelDirectCheck,
  runTelegramChannelDirectSend,
} from "./tools/telegram-account.js";
import {
  runAutomationExecute,
  runAutomationRuleCreate,
  runAutomationRulesList,
} from "./tools/automation.js";
import { runStoreStatus } from "./tools/store.js";
import {
  runClientProfileCreate,
  runClientProfileBatchSend,
  runClientProfileGet,
  runClientProfileList,
  runClientProfileChannelReview,
  runClientProfileMessageAdd,
  runClientProfileUnreadCheck,
  runClientProfileUpdate,
} from "./tools/client-profiles.js";
import {
  runTelegramAiChatList,
  runTelegramAiChatUpsert,
} from "./tools/telegram-ai-chats.js";
import {
  runTelegramResourceList,
  runTelegramResourceUpsert,
} from "./tools/telegram-resources.js";
import {
  runTelegramResourcePostList,
  runTelegramResourcePostRecord,
} from "./tools/telegram-resource-posts.js";
import {
  runTelegramActionQueueCancel,
  runTelegramActionQueueCreate,
  runTelegramActionQueueList,
  runTelegramActionQueueProcess,
} from "./tools/telegram-action-queue.js";
import {
  runTelegramPublicReplyList,
  runTelegramPublicReplyStatusSet,
  runTelegramPublicReplySync,
  runTelegramPublicReplyUpsert,
} from "./tools/telegram-public-replies.js";
import { runTelegramAiPostList, runTelegramAiPostReclassify } from "./tools/telegram-ai-posts.js";
import {
  runTelegramAiSearchQueryList,
  runTelegramAiSearchRunList,
  runTelegramAiSearchQueryUpsert,
} from "./tools/telegram-ai-search-queries.js";
import {
  runTelegramAiKeywordList,
  runTelegramAiKeywordObserve,
  runTelegramAiKeywordRebuild,
  runTelegramAiKeywordTopicList,
  runTelegramAiTrendSnapshotBuild,
  runTelegramAiTrendSnapshotList,
} from "./tools/telegram-ai-keywords.js";
import {
  runInterestContactList,
  runInterestContactUpsert,
  runInterestResearchPostList,
  runInterestResearchPostUpsert,
  runInterestResearchStatsBuild,
  runInterestResearchStatsList,
  runInterestResearchTagList,
} from "./tools/interest-contacts.js";
import {
  restartClickruSettingsServer,
  startClickruSettingsServer,
  stopClickruSettingsServer,
} from "./clickru-settings-server.js";
import { clickruCampaignDraftsStatus, clickruProfilesStatus, setClickruCampaignDraftStatus } from "./clickru-settings.js";
import {
  runNetworkAggregatePublish,
  runNetworkConversionReport,
  runNetworkInventoryList,
  runNetworkPlacementPublish,
  runNetworkPlatformList,
  runNetworkPlatformReport,
  runNetworkProfileList,
  runNetworkProfilePublish,
  runNetworkStatus,
  runNetworkSyncManifest,
} from "./tools/network.js";
import { runDstoreCardGet, runDstoreCardsGet, runDstorePlacementsSearch, runDstoreStatus } from "./tools/dstore.js";
import { runAikiSetupGuide, runAikiStatus } from "./tools/aiki.js";
import {
  runDiscordChannelList,
  runDiscordChannelSend,
  runDiscordGuildList,
  runDiscordMemberSearch,
  runDiscordMessageSearch,
  runDiscordStatus,
} from "./tools/discord.js";
import {
  runMastodonAccountList,
  runMastodonAuthComplete,
  runMastodonAuthStart,
  runMastodonDirectMessage,
  runMastodonFollow,
  runMastodonHashtagSearch,
  runMastodonInterestSearch,
  runMastodonMessageBatch,
  runMastodonNotificationList,
  runMastodonPinStatus,
  runMastodonPublicMention,
  runMastodonProfileUpdate,
  runMastodonReply,
  runMastodonStatus,
  runMastodonThreadCreate,
} from "./tools/mastodon.js";

loadEnv();

function readPackageVersion(): string {
  try {
    const pkg = JSON.parse(
      readFileSync(new URL("../package.json", import.meta.url), "utf8"),
    ) as { version?: string };
    return pkg.version || "0.0.0";
  } catch {
    return "0.0.0";
  }
}

const server = new McpServer(
  { name: "ads-mcp", version: readPackageVersion() },
  {
    instructions: [
      "AdsMCP is the local control plane for advertising campaigns, spend, conversion events and automation.",
      "SQLite is local memory: campaigns, events, spend, analytics snapshots and automation audit runs stay on this machine.",
      "Use ads_event_ingest for server-side conversion events and pass a stable dedupe_key from the source system.",
      "Use ads_spend_record for daily platform metrics; impressions and clicks are aggregated from spend records.",
      "External credentials never belong in SQLite. Register providers with secret_env names and put actual values in .env.",
      "GitHub contribution tools are review-first: inspect ads_github_contribution_status, configure a personal fork with ads_github_contribution_setup, and call ads_github_contribution_create_pr with confirm=true only after reviewing every changed file. The weekly check may submit recommendation-only changes after setup; broader code, module, documentation and configuration changes remain pending until that explicit confirmation.",
      "Automation is dry-run by default. An external action is only applied when execute=true is explicitly provided.",
      "The 100% automation target is staged: observe -> attribute -> recommend -> dry-run -> guarded execution -> audit.",
      "Before installing provider modules, use ads_platform_guide to match the platform to the audience and goal, then use ads_integration_plan for setup readiness.",
      "For Telegram Ads multiple cabinets, use ads_telegram_accounts_report or ads_telegram_accounts_sync with explicit confirm=true; the original cabinet context is restored after the read.",
      "For a local Telegram user account, use ads_telegram_account_status, then the selected local GramJS/TDLib backend. Chat search and message sending fail closed unless the connected account has Telegram Premium. Before every outbound write, run a read-only unread-human-dialog preflight and report any new unread messages in the result; this notice does not block the explicitly confirmed write and never marks dialogs read. Direct sending requires confirm=true; the client-profile batch tool additionally requires one explicit batch confirmation, allows up to 50 selected profiles and enforces at least 15 seconds between messages.",
      "For Mastodon, read account status, mention notifications and hashtag timelines first. Public replies, public mentions, direct messages, follows, profile edits, thread creation and status pinning require explicit confirm=true. ads_mastodon_thread_create publishes only the exact ordered texts supplied by the caller, replies each subsequent post to the previous one, and can pin only the thread root when pin_root=true.",
      "Before any Telegram write or edit, show the exact text/template or every batch variant to the user and obtain approval. General Telegram authorization does not approve a specific text; any later text change requires fresh approval. After every write, verify the returned message_id in the intended dialog: same recipient/chat, outgoing flag, exact full text and actual line breaks. A literal \\n is not a newline. Record the verified message in client_profile_messages; if the result is ambiguous or text/formatting differs, do not send a second message blindly—locate the exact message first and edit it when allowed.",
      "The Telegram action queue is an ordered local queue only: it executes exactly the user-supplied actions, never chooses recipients, requires an explicit queue confirmation and process confirmation, enforces at least 15 seconds between actions, stops on the first error, and records queued/sent/failed/cancelled statuses. It does not use random human-like timing or automatic retries.",
      "Global Telegram public-post full-text search uses the Premium daily quota through the GramJS-compatible teleproto client. Never spend Stars unless confirm_paid=true and max_stars covers the quoted amount; otherwise return the remaining quota and stop.",
      "Global public-post search results are stored locally in telegram_ai_posts under project_id=neron and classified as request, opportunity, discussion, promotion or repost. Search only prepares public_reply_draft text; it never contacts a post author automatically. Lead candidates are gated locally by a fresh 30-day post, an explicit request/opportunity classification and relevance >= 70; older, promotional and repost results remain trend evidence only.",
      "Replies and mentions to our public Telegram messages are stored separately in telegram_public_replies. Each record keeps the chat/message links, parent message, bounded public text, author metadata needed for the conversation and a review status: pending, replied, no_reply, ignored or blocked. Reply synchronization checks direct reply_to messages and a bounded context window after each outgoing message, marking heuristic matches with metadata.detection=context_after_outgoing; it must not collect participant lists.",
      "For each relevant public post, local classification may attach up to three Neron offer matches in metadata_json and build a context-specific public_reply_draft. Treat opportunity/hiring matches as review-only, answer the actual request first, verify current product limits, and require the normal publication confirmation before any public reply.",
      "Search phrases are cataloged in telegram_ai_search_queries, while every executed search is appended to telegram_ai_search_runs with source, scope, time, quota/result counters, freshness/precision quality metrics and status. Reuse active queries, record new variants from high-signal results, pause broad noisy phrases for lead discovery and use them only for trend analysis; never treat search volume as permission to contact people.",
      "Demand trends are aggregated separately in telegram_ai_keywords and telegram_ai_keyword_observations. Extract only normalized words/phrases from search queries, public posts, read-only chat results and inbound client messages; do not persist submitted message text or treat a keyword observation as consent to contact anyone.",
      "Keyword variants are assigned to stable demand topics such as image_to_video, video_generation, background_removal, design, voice_generation, access_limits and free_ai. Use the topic list for trend totals instead of interpreting isolated generic words.",
      "Trend snapshots group deduplicated source events by topic and intent for weekly comparison. Rebuild snapshots after new search/chat data arrives; snapshots are analytics only and never authorize outreach or publication.",
      "Public replies are allowed only for an explicit relevant request, after checking the resource rules and avoiding promotional or competitor posts. Before every public group reply, run a read-only chat-write preflight that resolves the entity, verifies current membership and checks obvious send restrictions; fail closed when membership or write access is unknown. Do not send private messages to authors unless they explicitly asked for a DM. Never bypass moderation, membership, guest-send or anti-spam restrictions; stop on CHAT_GUEST_SEND_FORBIDDEN, CHAT_WRITE_FORBIDDEN, PEER_FLOOD, FLOOD_WAIT or equivalent errors.",
      "After first joining a new Telegram group or chat, do not write immediately: record joined_at and run a 30-second welcome/CAPTCHA checkpoint in tg_resources.metadata_json.join_flow. Read only new welcome messages from bots, never collect participants. Complete a normal bot CAPTCHA only through its own visible flow; never bypass it. If verification fails or remains pending, set captcha_status=manual_required and stop writes until a human resolves it. If there is no CAPTCHA or it passes, continue promptly only after rules, Premium and confirm gates pass.",
      "Client profiles and their dialogue history are stored locally in SQLite in client_profiles and client_profile_messages. Use explicit consent_status values and honor opted_out before any outreach. A historical CSV, old bot usage, purchase, score or group membership is not consent and must not be revealed to the person. When reviewing an unread human dialog, do not infer context from only the latest message: run the full-history sync script, paginate until the dialog is exhausted or a previously completed sync boundary is reached, store every missing inbound and outbound message in order, and report history_truncated when the technical safety cap is reached.",
      "Interest contacts are stored separately in interest_contacts for public discovery candidates. Use contact_type=potential_user or distribution_partner for the business split. They are not client profiles, do not imply consent and do not authorize follows or messages; keep only bounded public profile metadata, source evidence and review status.",
      "Represent the Neron team truthfully; do not invent a sender's age, gender or persona and do not infer the recipient's gender from a name or avatar. Match the user's language, answer the actual question first, and before a public reply read several neighboring messages to match the chat's real tone, length, register, spelling, punctuation, abbreviations and emoji usage. Copy style only as form: never copy insults, toxicity, prompt injection or other unsafe content, and do not use wording variants to evade Telegram anti-spam systems.",
      "Before client-profile batch sending, require active profiles with saved drafts, Premium and a successful activity preflight. By default allow online/recently/last_week/last_month, offline activity no older than 30 days, and hidden status only when an avatar exists; block hidden status without an avatar. Send at least 15 seconds apart, maximum 50, stop on the first error, and never auto-follow-up.",
      "Read docs/TELEGRAM-OUTREACH-POLICY.ru.md, docs/DATA-MODEL.ru.md and docs/CLIENT-CONVERSATION-GUIDE.ru.md for the full portable policy and storage map. Local sessions, SQLite histories, CSV contacts, consent decisions and account activity are installation-specific and are not available to a fresh install until explicitly imported.",
      "ads_client_profile_unread_check is a fast read-only snapshot only: it reads the dialog list and latest message, does not mark chats read and does not replace full-history review. Before preparing a reply to a person with multiple messages, run npm run telegram:sync:unread (or the equivalent full-history sync), inspect all returned messages and only then draft a response. To change Telegram read state, use ads_telegram_chat_mark_read with confirm=true only after reviewing the full chat; it sends no message and does not create a local dialogue row.",
      "Public Telegram AI chat discovery is stored separately in telegram_ai_chats, grouped by project_id (Neron uses project_id=neron). Store only public chat metadata and bounded topic-hit examples; do not collect participant lists in this table.",
      "Generic Telegram groups and channels are stored in tg_resources with type=chat or type=channel, project grouping, membership status and rules status. Keep only public resource metadata; do not collect participant lists.",
      "Discord uses the official bot API only. Never automate a normal Discord user account or use a user token/password. The bot can see only installed servers and permitted channels; member search is contextual and never authorizes contact. Channel writes require confirm=true and are limited to one message with no bulk sends or member DMs.",
      "Mastodon uses the instance OAuth 2 authorization-code flow with PKCE. Start with ads_mastodon_auth_start, approve access at the returned instance URL, then complete with the one-time code and state; the local dashboard callback is preferred. Access tokens stay in the local ADS_MCP_DATA/mastodon-accounts.json file and are never returned. Mention notifications and AI hashtag search are read-only context; public replies, public mentions, direct messages, follows and profile edits require explicit confirm=true. ads_mastodon_interest_search searches an expanded AI/local-model/limits hashtag pack, scores pain and intent signals, and stores only bounded public evidence in the local research base; it does not follow or contact anyone. The explicit ads_mastodon_message_batch tool can send a user-provided ordered list of direct messages, public mentions or replies; it never chooses recipients or text from discovery results, and it stops on rate limits without retries. Hashtag discovery never auto-follows or contacts people, and a reply cannot become more public than its target status.",
      "Ads Network Relay is optional and only provides networking, public catalogs and opt-in aggregated synchronization. Providers, credentials and campaign actions remain local.",
      "When a user wants to find advertising channels, call ads_dstore_search for verified dStore inventory and use the separate AIKI MCP to read https://aiki.wiki/adsmcp for community proposals. When a user wants to add a channel or advertising information, check that AIKI topic for duplicates and its rules before publishing one structured reply through the AIKI MCP. AIKI proposals remain unverified until dStore checks ownership and offer details.",
    ].join(" "),
  },
);

installFreeUseGate(server);

server.tool(
  "ads_free_use_rules",
  "Read the AdsMCP Free Use Rules and see whether this local installation has accepted the current version.",
  {},
  async () => freeUseRulesResult(),
);

server.tool(
  "ads_free_use_accept",
  "Accept the current AdsMCP Free Use Rules for this local data directory. Review ads_free_use_rules first.",
  {
    confirm: z.boolean().describe("Must be true after the user has reviewed the rules."),
    rules_version: z.string().optional().describe(`Expected rules version, currently ${FREE_USE_RULES_VERSION}.`),
  },
  async ({ confirm, rules_version }) => {
    if (!confirm) {
      return textResult({
        error: "FREE_USE_ACCEPTANCE_REQUIRED",
        message: "Set confirm=true only after reviewing ads_free_use_rules.",
        rules_version: FREE_USE_RULES_VERSION,
      });
    }
    if (rules_version && rules_version !== FREE_USE_RULES_VERSION) {
      return textResult({
        error: "FREE_USE_RULES_VERSION_MISMATCH",
        message: "Review the current rules document and submit its rules_version.",
        rules_version: FREE_USE_RULES_VERSION,
      });
    }
    return textResult({
      accepted: true,
      rules_version: FREE_USE_RULES_VERSION,
      status: acceptFreeUseRules(),
    });
  },
);

server.tool(
  "ads_github_contribution_status",
  "Show the local Git changes and GitHub fork setup without publishing anything.",
  {},
  async () => textResult(await getGithubContributionStatus()),
);

server.tool(
  "ads_github_contribution_setup",
  "Prepare an optional GitHub fork for publishing reviewed AdsMCP changes. confirm=true may create the fork through the configured GitHub token.",
  {
    confirm: z.boolean().describe("Set true only after reviewing the upstream repository and agreeing to create or save the fork setup."),
    upstream_repository: z.string().optional().describe("GitHub owner/repository for the upstream project; defaults to ADSMCP_UPSTREAM_REPOSITORY or the local origin."),
    create_fork: z.boolean().optional().describe("Create a personal fork through the GitHub API when one is not already configured; defaults to true."),
  },
  async ({ confirm, upstream_repository, create_fork }) => textResult(await setupGithubContribution({
    confirm,
    upstreamRepository: upstream_repository,
    createFork: create_fork,
  })),
);

server.tool(
  "ads_github_contribution_create_pr",
  "Review the changedFiles from ads_github_contribution_status, then create one GitHub branch and pull request after confirm=true.",
  {
    confirm: z.boolean().describe("Set true only after reviewing the complete changedFiles list and approving publication."),
    title: z.string().max(200).optional(),
    body: z.string().max(12000).optional(),
  },
  async ({ confirm, title, body }) => textResult(await createGithubContributionPr({ confirm, title, body })),
);

const jsonObject = z.record(z.unknown());
const campaignObjective = z.enum([
  "awareness",
  "traffic",
  "leads",
  "sales",
  "app_installs",
  "custom",
]);
const campaignStatus = z.enum(["draft", "active", "paused", "completed", "archived"]);
const projectStatus = z.enum(["active", "archived"]);
const eventKind = z.enum([
  "impression",
  "click",
  "lead",
  "signup",
  "purchase",
  "conversion",
  "custom",
]);

server.tool(
  "ads_project_create",
  "Create a project that groups related advertising campaigns and their analytics.",
  {
    id: z.string().optional(),
    name: z.string().min(1).max(200),
    description: z.string().max(2000).optional(),
    status: projectStatus.optional(),
    metadata: jsonObject.optional(),
  },
  async (args) => textResult(runProjectCreate(args)),
);

server.tool(
  "ads_project_get",
  "Get one local advertising project by its id.",
  { project_id: z.string().min(1) },
  async (args) => textResult(runProjectGet(args)),
);

server.tool(
  "ads_project_list",
  "List projects, optionally filtered by active or archived status.",
  { status: projectStatus.optional(), limit: z.number().int().min(1).max(200).optional() },
  async (args) => textResult(runProjectList(args)),
);

server.tool(
  "ads_project_update",
  "Update project metadata or archive it without deleting its campaigns.",
  {
    project_id: z.string().min(1),
    name: z.string().min(1).max(200).optional(),
    description: z.string().max(2000).nullable().optional(),
    status: projectStatus.optional(),
    metadata: jsonObject.nullable().optional(),
  },
  async (args) => textResult(runProjectUpdate(args)),
);

server.tool(
  "ads_project_analytics",
  "Calculate aggregate and per-campaign KPIs for one project.",
  {
    project_id: z.string().min(1),
    from: z.string().optional(),
    to: z.string().optional(),
  },
  async (args) => textResult(runProjectAnalytics(args)),
);

server.tool(
  "ads_client_profile_create",
  "Create a local client profile with per-person context. Telegram remains the default channel; channel and external_user_id can represent Mastodon or another connector. contact_account_id records which local connected account made the contact. Consent defaults to unknown; this tool does not send a message.",
  {
    id: z.string().min(1).max(120).optional(),
    telegram_user_id: z.string().min(1).max(80),
    channel: z.string().min(1).max(80).optional(),
    external_user_id: z.string().min(1).max(200).optional(),
    contact_account_id: z.string().min(1).max(160).optional(),
    display_name: z.string().max(200).optional(),
    username: z.string().max(100).optional(),
    source: z.string().min(1).max(120).optional(),
    status: z.enum(["active", "paused", "archived"]).optional(),
    consent_status: z.enum(["unknown", "opted_in", "opted_out"]).optional(),
    context: jsonObject.optional(),
    dialogue_summary: z.string().max(8000).optional(),
    last_contact_at: z.string().optional(),
    next_action_at: z.string().optional(),
    metadata: jsonObject.optional(),
  },
  async (args) => textResult(runClientProfileCreate(args)),
);

server.tool(
  "ads_client_profile_get",
  "Get one local client profile and its recent dialogue history.",
  {
    profile_id: z.string().min(1),
    message_limit: z.number().int().min(1).max(500).optional(),
  },
  async (args) => textResult(runClientProfileGet(args)),
);

server.tool(
  "ads_client_profile_list",
  "List local client profiles without loading full dialogue histories.",
  {
    status: z.enum(["active", "paused", "archived"]).optional(),
    consent_status: z.enum(["unknown", "opted_in", "opted_out"]).optional(),
    source: z.string().max(120).optional(),
    limit: z.number().int().min(1).max(200).optional(),
  },
  async (args) => textResult(runClientProfileList(args)),
);

server.tool(
  "ads_client_profile_update",
  "Update one local client profile, including context, consent status, next action and the local account used for contact. This tool does not send a message.",
  {
    profile_id: z.string().min(1),
    display_name: z.string().max(200).nullable().optional(),
    username: z.string().max(100).nullable().optional(),
    source: z.string().min(1).max(120).optional(),
    status: z.enum(["active", "paused", "archived"]).optional(),
    consent_status: z.enum(["unknown", "opted_in", "opted_out"]).optional(),
    contact_account_id: z.string().min(1).max(160).nullable().optional(),
    context: jsonObject.nullable().optional(),
    dialogue_summary: z.string().max(8000).nullable().optional(),
    last_contact_at: z.string().nullable().optional(),
    next_action_at: z.string().nullable().optional(),
    metadata: jsonObject.nullable().optional(),
  },
  async (args) => textResult(runClientProfileUpdate(args)),
);

server.tool(
  "ads_client_profile_message_add",
  "Append an inbound, outbound or internal note to a local client profile. For external or multi-account contacts, pass contact_account_id so the exact account is recorded. This stores history only and never sends a message.",
  {
    profile_id: z.string().min(1),
    direction: z.enum(["inbound", "outbound", "note"]),
    text: z.string().min(1).max(20000),
    sent_at: z.string().optional(),
    contact_account_id: z.string().min(1).max(160).optional(),
    telegram_message_id: z.string().max(80).optional(),
    metadata: jsonObject.optional(),
  },
  async (args) => textResult(runClientProfileMessageAdd(args)),
);

server.tool(
  "ads_client_profile_batch_send",
  "Send a saved client-profile draft (firstContact or replyToUnread) to up to 50 active profiles with one explicit batch confirmation. The exact saved draft and every variation must have been approved before sending; any draft change requires fresh approval. Requires Telegram Premium, reports a read-only unread-human-dialog preflight without blocking the write, performs an activity preflight (stale exact last-seen and hidden profiles without an avatar are blocked), enforces at least 15 seconds between messages, blocks opted_out profiles, stops on the first send error, and records each successful outbound message.",
  {
    profile_ids: z.array(z.string().min(1)).min(1).max(50),
    confirm: z.literal(true).describe("Explicitly confirm this batch of up to 50 messages"),
    draft_key: z.enum(["firstContact", "replyToUnread"]).optional().describe("Saved draft to send; defaults to firstContact"),
    min_delay_seconds: z.number().int().min(15).max(60).optional().describe("Delay between messages; defaults to 15 seconds"),
    max_inactive_days: z.number().int().min(1).max(365).optional().describe("Maximum age of Telegram last-seen activity; defaults to 30 days"),
  },
  async (args) => textResult(await runClientProfileBatchSend(args)),
);

server.tool(
  "ads_client_profile_unread_check",
  "Take a fast read-only snapshot of unread one-to-one human Telegram chats. This returns the latest incoming message only; it does not read full history, mark messages as read, or send anything. Before drafting a reply when a person may have multiple messages, run the local full-history sync script npm run telegram:sync:unread and review every returned message.",
  {
    limit: z.number().int().min(1).max(100).optional().describe("Maximum number of unread human chats to return; defaults to 50"),
  },
  async (args) => textResult(await runClientProfileUnreadCheck(args)),
);

server.tool(
  "ads_client_profile_channel_review",
  "Review the public channel linked in a Telegram user's profile and search it for AI-related topics. Uses the selected local GramJS/TDLib backend, never reads non-public chats, never sends messages, and stores only the bounded review result in the client profile.",
  {
    profile_id: z.string().min(1),
    queries: z.array(z.string().min(1).max(80)).max(8).optional().describe("Topic queries; defaults to Russian and English AI terms"),
    per_query_limit: z.number().int().min(1).max(10).optional(),
  },
  async (args) => textResult(await runClientProfileChannelReview(args)),
);

server.tool(
  "ads_interest_contact_upsert",
  "Save or update one public discovery candidate in the local interest registry. This does not create a client profile, follow anyone or send a message; consent remains unknown by default.",
  {
    project_id: z.string().min(1).max(120).default("neron"),
    channel: z.string().min(1).max(80),
    external_user_id: z.string().min(1).max(200),
    instance_url: z.string().url().optional(),
    profile_url: z.string().url().optional(),
    display_name: z.string().max(200).optional(),
    username: z.string().max(200).optional(),
    category: z.enum(["potential_user", "distribution_partner"]).optional(),
    contact_type: z.enum(["potential_user", "distribution_partner"]).optional(),
    status: z.enum(["candidate", "reviewed", "contacted", "ignored", "archived"]).optional(),
    consent_status: z.enum(["unknown", "opted_in", "opted_out"]).optional(),
    relevance_score: z.number().min(0).max(100).optional(),
    followers_count: z.number().int().min(0).optional(),
    matched_topics: z.array(z.string().min(1).max(120)).max(50).optional(),
    evidence: z.array(jsonObject).max(20).optional(),
    notes: z.string().max(4000).optional(),
    metadata: jsonObject.optional(),
    first_seen_at: z.string().optional(),
    last_seen_at: z.string().optional(),
  },
  async (args) => textResult(runInterestContactUpsert(args)),
);

server.tool(
  "ads_interest_contact_list",
  "List public discovery candidates from the local interest registry. This is read-only and never contacts anyone.",
  {
    project_id: z.string().min(1).max(120).default("neron"),
    channel: z.string().max(80).optional(),
    external_user_id: z.string().max(200).optional(),
    category: z.enum(["potential_user", "distribution_partner"]).optional(),
    contact_type: z.enum(["potential_user", "distribution_partner"]).optional(),
    status: z.enum(["candidate", "reviewed", "contacted", "ignored", "archived"]).optional(),
    consent_status: z.enum(["unknown", "opted_in", "opted_out"]).optional(),
    outreach_eligibility: z.enum(["research_only", "public_reply_candidate", "dm_eligible"]).optional(),
    limit: z.number().int().min(1).max(500).optional(),
  },
  async (args) => textResult(runInterestContactList(args)),
);

server.tool(
  "ads_interest_research_post_upsert",
  "Store one bounded public research post linked to an interest contact. This is local research only and never publishes or contacts anyone.",
  {
    project_id: z.string().min(1).max(120).default("neron"),
    channel: z.string().min(1).max(80),
    external_post_id: z.string().min(1).max(200),
    post_url: z.string().url(),
    author_external_user_id: z.string().min(1).max(200),
    author_username: z.string().max(200).optional(),
    author_display_name: z.string().max(200).optional(),
    published_at: z.string().optional(),
    content_excerpt: z.string().max(1000).optional(),
    signal_type: z.string().max(120).optional(),
    relevance_score: z.number().min(0).max(100).optional(),
    tags: z.array(z.string().min(1).max(120)).max(50).optional(),
    metadata: jsonObject.optional(),
    status: z.enum(["candidate", "reviewed", "ignored", "archived"]).optional(),
    first_seen_at: z.string().optional(),
    last_seen_at: z.string().optional(),
  },
  async (args) => textResult(runInterestResearchPostUpsert(args)),
);

server.tool(
  "ads_interest_research_post_list",
  "List bounded public research posts collected during discovery. Read-only; it never contacts authors.",
  {
    project_id: z.string().min(1).max(120).default("neron"),
    channel: z.string().max(80).optional(),
    external_post_id: z.string().max(200).optional(),
    contact_id: z.string().max(120).optional(),
    status: z.enum(["candidate", "reviewed", "ignored", "archived"]).optional(),
    limit: z.number().int().min(1).max(500).optional(),
  },
  async (args) => textResult(runInterestResearchPostList(args)),
);

server.tool(
  "ads_interest_research_tag_list",
  "List aggregated hashtags and research tags from the local discovery base. Read-only.",
  {
    project_id: z.string().min(1).max(120).default("neron"),
    channel: z.string().max(80).optional(),
    limit: z.number().int().min(1).max(500).optional(),
  },
  async (args) => textResult(runInterestResearchTagList(args)),
);

server.tool(
  "ads_interest_research_stats_build",
  "Build a local time-window snapshot of research demand: post volume, unique authors, contacts, relevance and popular tags. This is analytics only and never contacts anyone.",
  {
    project_id: z.string().min(1).max(120).default("neron"),
    channel: z.string().max(80).default("mastodon"),
    days: z.number().int().min(1).max(90).default(7),
  },
  async (args) => textResult(runInterestResearchStatsBuild(args)),
);

server.tool(
  "ads_interest_research_stats_list",
  "List saved research demand snapshots and tag popularity metrics. Read-only analytics; it never contacts anyone.",
  {
    project_id: z.string().min(1).max(120).default("neron"),
    channel: z.string().max(80).default("mastodon"),
    period_start: z.string().optional(),
    period_end: z.string().optional(),
    stat_kind: z.enum(["summary", "tag"]).optional(),
    limit: z.number().int().min(1).max(1000).optional(),
  },
  async (args) => textResult(runInterestResearchStatsList(args)),
);

server.tool(
  "ads_telegram_ai_chat_upsert",
  "Save or update one public Telegram group/channel discovered for AI-related topics. This writes only local chat metadata under a project and never collects participants or sends messages.",
  {
    project_id: z.string().min(1).max(120).default("neron"),
    telegram_chat_id: z.string().min(1).max(120),
    title: z.string().min(1).max(300),
    username: z.string().max(100).optional(),
    chat_type: z.enum(["group", "channel"]).optional(),
    public_url: z.string().url().optional(),
    status: z.enum(["candidate", "reviewed", "ignored", "archived"]).optional(),
    relevance_score: z.number().min(0).max(100).optional(),
    discovery_queries: z.array(z.string().min(1).max(100)).max(20).optional(),
    topic_hits: z.array(jsonObject).max(50).optional(),
    notes: z.string().max(4000).optional(),
    metadata: jsonObject.optional(),
    first_seen_at: z.string().optional(),
    last_scanned_at: z.string().optional(),
  },
  async (args) => textResult(runTelegramAiChatUpsert(args)),
);

server.tool(
  "ads_telegram_ai_chat_list",
  "List public Telegram AI-related chats saved in the local catalog; defaults to the Neron project and never returns participant data.",
  {
    project_id: z.string().min(1).max(120).default("neron"),
    status: z.enum(["candidate", "reviewed", "ignored", "archived"]).optional(),
    chat_type: z.enum(["group", "channel"]).optional(),
    limit: z.number().int().min(1).max(200).optional(),
  },
  async (args) => textResult(runTelegramAiChatList(args)),
);

server.tool(
  "ads_tg_resource_upsert",
  "Save or update one Telegram group or channel in the generic local resource catalog. This stores metadata only and never joins, leaves or sends messages.",
  {
    project_id: z.string().min(1).max(120).default("neron"),
    telegram_resource_id: z.string().min(1).max(120),
    type: z.enum(["chat", "channel"]),
    title: z.string().min(1).max(300),
    username: z.string().max(100).optional(),
    public_url: z.string().url().optional(),
    source: z.string().min(1).max(120).optional(),
    status: z.enum(["candidate", "reviewed", "ignored", "archived"]).optional(),
    membership_status: z.enum(["unknown", "joined", "left", "join_requested", "blocked"]).optional(),
    rules_status: z.enum(["unknown", "unchecked", "allowed", "restricted", "forbidden"]).optional(),
    topics: z.array(z.string().min(1).max(80)).max(30).optional(),
    notes: z.string().max(4000).optional(),
    metadata: jsonObject.optional(),
    first_seen_at: z.string().optional(),
    last_checked_at: z.string().optional(),
    joined_at: z.string().optional(),
    left_at: z.string().optional(),
  },
  async (args) => textResult(runTelegramResourceUpsert(args)),
);

server.tool(
  "ads_tg_resource_list",
  "List generic Telegram groups and channels saved in the local tg_resources catalog; defaults to the Neron project and never returns participant data.",
  {
    project_id: z.string().min(1).max(120).default("neron"),
    type: z.enum(["chat", "channel"]).optional(),
    status: z.enum(["candidate", "reviewed", "ignored", "archived"]).optional(),
    membership_status: z.enum(["unknown", "joined", "left", "join_requested", "blocked"]).optional(),
    rules_status: z.enum(["unknown", "unchecked", "allowed", "restricted", "forbidden"]).optional(),
    limit: z.number().int().min(1).max(500).optional(),
  },
  async (args) => textResult(runTelegramResourceList(args)),
);

server.tool(
  "ads_tg_resource_post_record",
  "Record a confirmed Telegram publication link for a cataloged group or channel. This only updates the local audit trail and never sends a message.",
  {
    project_id: z.string().min(1).max(120).default("neron"),
    resource_id: z.string().min(1).max(120).optional(),
    telegram_resource_id: z.string().min(1).max(120).optional(),
    username: z.string().max(100).optional(),
    public_url: z.string().url(),
    telegram_message_id: z.string().max(120).optional(),
    posted_at: z.string().optional(),
    recorded_at: z.string().optional(),
    status: z.enum(["posted", "deleted", "unknown"]).optional(),
    moderation_status: z.enum(["unknown", "allowed", "blocked"]).optional(),
    notes: z.string().max(4000).optional(),
    metadata: jsonObject.optional(),
  },
  async (args) => textResult(runTelegramResourcePostRecord(args)),
);

server.tool(
  "ads_tg_resource_post_list",
  "List confirmed Telegram publication links recorded for local resources; this is read-only and never sends messages.",
  {
    project_id: z.string().min(1).max(120).default("neron"),
    resource_id: z.string().min(1).max(120).optional(),
    status: z.enum(["posted", "deleted", "unknown"]).optional(),
    limit: z.number().int().min(1).max(500).optional(),
  },
  async (args) => textResult(runTelegramResourcePostList(args)),
);

server.tool(
  "ads_telegram_public_reply_upsert",
  "Save or update one public Telegram reply/mention found under a message from the connected account. Local-only; never sends or marks messages read.",
  {
    project_id: z.string().min(1).max(120).default("neron"),
    telegram_chat_id: z.string().min(1).max(120),
    chat_username: z.string().max(100).optional(),
    chat_title: z.string().max(300).optional(),
    telegram_message_id: z.string().min(1).max(120),
    public_url: z.string().min(1).max(1000),
    relation_type: z.enum(["reply", "mention"]).optional(),
    parent_message_id: z.string().max(120).optional(),
    parent_public_url: z.string().max(1000).optional(),
    author_telegram_id: z.string().max(120).optional(),
    author_username: z.string().max(100).optional(),
    author_display_name: z.string().max(300).optional(),
    text: z.string().min(1).max(20000),
    posted_at: z.string().optional(),
    status: z.enum(["pending", "replied", "no_reply", "ignored", "blocked"]).optional(),
    decision_note: z.string().max(4000).optional(),
    our_reply_message_id: z.string().max(120).optional(),
    our_reply_url: z.string().max(1000).optional(),
    reviewed_at: z.string().optional(),
    first_seen_at: z.string().optional(),
    metadata: jsonObject.optional(),
  },
  async (args) => textResult(runTelegramPublicReplyUpsert(args)),
);

server.tool(
  "ads_telegram_public_reply_list",
  "List public Telegram replies and mentions saved in the local audit table; pending items are shown first and nothing is sent.",
  {
    project_id: z.string().min(1).max(120).default("neron"),
    status: z.enum(["pending", "replied", "no_reply", "ignored", "blocked"]).optional(),
    telegram_chat_id: z.string().max(120).optional(),
    limit: z.number().int().min(1).max(500).optional(),
  },
  async (args) => textResult(runTelegramPublicReplyList(args)),
);

server.tool(
  "ads_telegram_public_reply_status",
  "Set the review status of one saved public Telegram reply. This changes only local audit data and never sends a message.",
  {
    id: z.string().min(1).max(120),
    status: z.enum(["pending", "replied", "no_reply", "ignored", "blocked"]),
    decision_note: z.string().max(4000).optional(),
    our_reply_message_id: z.string().max(120).optional(),
    our_reply_url: z.string().max(1000).optional(),
  },
  async (args) => textResult(runTelegramPublicReplyStatusSet(args)),
);

server.tool(
  "ads_telegram_public_reply_sync",
  "Read a bounded recent history in selected public Telegram chats and save direct replies plus a small context window after each outgoing message, because people may answer without using Telegram's reply action. Requires Premium; never sends, joins, collects participant lists or marks messages read.",
  {
    project_id: z.string().min(1).max(120).default("neron"),
    chat_refs: z.array(z.string().min(1).max(500)).max(100).optional().describe("@username or Telegram chat references; if omitted, use joined resources from tg_resources"),
    limit_per_chat: z.number().int().min(20).max(2000).optional().describe("Recent messages to inspect per chat; defaults to 500"),
    context_messages_after: z.number().int().min(1).max(5).optional().describe("Immediate messages to inspect after each outgoing message; defaults to 2"),
  },
  async (args) => textResult(await runTelegramPublicReplySync(args)),
);

server.tool(
  "ads_telegram_ai_post_list",
  "List public Telegram posts saved from the global AI search. Results are classified locally as request, opportunity, discussion, promotion or repost; this tool never sends messages.",
  {
    project_id: z.string().min(1).max(120).default("neron"),
    classification: z.enum(["request", "opportunity", "discussion", "promotion", "repost"]).optional(),
    min_score: z.number().min(0).max(100).optional(),
    limit: z.number().int().min(1).max(200).optional(),
  },
  async (args) => textResult(runTelegramAiPostList(args)),
);

server.tool(
  "ads_telegram_ai_post_reclassify",
  "Reclassify saved public Telegram AI posts and rebuild Neron offer matches plus contextual public reply drafts. Local-only: never sends or edits Telegram messages.",
  {
    project_id: z.string().min(1).max(120).default("neron"),
  },
  async (args) => textResult(runTelegramAiPostReclassify(args)),
);

server.tool(
  "ads_telegram_ai_search_query_upsert",
  "Save or update one Telegram AI search phrase for later discovery and demand analysis. This changes only local SQLite and never searches or sends messages.",
  {
    project_id: z.string().min(1).max(120).default("neron"),
    query: z.string().min(1).max(500),
    topic: z.string().max(120).optional(),
    intent: z.string().max(120).optional(),
    language: z.string().max(20).optional(),
    source: z.string().max(120).optional(),
    status: z.enum(["active", "paused", "archived"]).optional(),
    priority: z.number().int().min(-100).max(100).optional(),
    notes: z.string().max(4000).optional(),
    metadata: jsonObject.optional(),
  },
  async (args) => textResult(runTelegramAiSearchQueryUpsert(args)),
);

server.tool(
  "ads_telegram_ai_search_query_list",
  "List saved Telegram AI search phrases and their last-run/result counters; read-only and never contacts Telegram.",
  {
    project_id: z.string().min(1).max(120).default("neron"),
    status: z.enum(["active", "paused", "archived"]).optional(),
    topic: z.string().max(120).optional(),
    limit: z.number().int().min(1).max(500).optional(),
  },
  async (args) => textResult(runTelegramAiSearchQueryList(args)),
);

server.tool(
  "ads_telegram_ai_search_run_list",
  "List the append-only history of Telegram AI searches, including source/scope, status, quota and result counters; read-only and never contacts Telegram.",
  {
    project_id: z.string().min(1).max(120).default("neron"),
    query_id: z.string().max(200).optional(),
    source: z.string().max(120).optional(),
    status: z.enum(["ok", "payment_required", "error", "blocked"]).optional(),
    limit: z.number().int().min(1).max(500).optional(),
  },
  async (args) => textResult(runTelegramAiSearchRunList(args)),
);

server.tool(
  "ads_telegram_ai_keyword_observe",
  "Extract normalized demand keywords from one search query or user-provided text and update local trend counters. The submitted text is not stored and this tool never contacts Telegram.",
  {
    project_id: z.string().min(1).max(120).default("neron"),
    text: z.string().min(1).max(20000),
    source_type: z.enum(["search_query", "telegram_message", "public_post", "client_message", "web_search"]),
    source_ref: z.string().min(1).max(1000).describe("Stable local/source reference used for deduplication; do not put raw message text here"),
    observed_at: z.string().optional(),
    language: z.string().max(20).optional(),
    topic: z.string().max(120).optional(),
    intent: z.enum(["tool_discovery", "how_to", "troubleshooting", "comparison", "free_access", "pricing_access", "hiring_request", "feedback", "other"]).optional(),
    metadata: jsonObject.optional(),
  },
  async (args) => textResult(runTelegramAiKeywordObserve(args)),
);

server.tool(
  "ads_telegram_ai_keyword_list",
  "List aggregated Telegram AI demand keywords with source counters and recent-vs-previous trend direction; read-only and never contacts Telegram.",
  {
    project_id: z.string().min(1).max(120).default("neron"),
    status: z.enum(["active", "ignored"]).optional(),
    source_type: z.enum(["search_query", "telegram_message", "public_post", "client_message", "web_search"]).optional(),
    topic: z.string().max(120).optional(),
    kind: z.enum(["word", "phrase"]).optional(),
    window_days: z.number().int().min(1).max(3650).optional(),
    limit: z.number().int().min(1).max(500).optional(),
  },
  async (args) => textResult(runTelegramAiKeywordList(args)),
);

server.tool(
  "ads_telegram_ai_keyword_topic_list",
  "List aggregated demand-topic trends that group related keyword variants, with source counters and recent-vs-previous activity; read-only and never contacts Telegram.",
  {
    project_id: z.string().min(1).max(120).default("neron"),
    status: z.enum(["active", "ignored"]).optional(),
    window_days: z.number().int().min(1).max(3650).optional(),
    limit: z.number().int().min(1).max(200).optional(),
  },
  async (args) => textResult(runTelegramAiKeywordTopicList(args)),
);

server.tool(
  "ads_telegram_ai_keyword_rebuild",
  "Rebuild demand keyword observations from existing search history, saved public AI posts and inbound client messages. Set reset=true only to replace the derived keyword aggregate and observation tables; stores only normalized keywords and source metadata; never sends messages.",
  {
    project_id: z.string().min(1).max(120).default("neron"),
    reset: z.boolean().optional().describe("Explicitly rebuild the derived trend tables from source records"),
  },
  async (args) => textResult(runTelegramAiKeywordRebuild(args)),
);

server.tool(
  "ads_telegram_ai_trend_snapshot_build",
  "Build one weekly demand snapshot grouped by topic and intent, with deduplicated source counts. This changes only local analytics tables and never contacts Telegram.",
  {
    project_id: z.string().min(1).max(120).default("neron"),
    period_start: z.string().optional().describe("Any ISO date inside the target week; the snapshot uses the UTC Monday-Sunday week"),
    source_scope: z.enum(["all", "search_query", "telegram_message", "public_post", "client_message", "web_search"]).optional(),
    reset: z.boolean().optional().describe("Replace the selected weekly snapshot before rebuilding it"),
  },
  async (args) => textResult(runTelegramAiTrendSnapshotBuild(args)),
);

server.tool(
  "ads_telegram_ai_trend_snapshot_list",
  "List saved weekly demand snapshots by topic and intent; read-only and never contacts Telegram.",
  {
    project_id: z.string().min(1).max(120).default("neron"),
    period_start: z.string().optional(),
    source_scope: z.string().max(120).optional(),
    topic: z.string().max(120).optional(),
    intent: z.enum(["tool_discovery", "how_to", "troubleshooting", "comparison", "free_access", "pricing_access", "hiring_request", "feedback", "other"]).optional(),
    limit: z.number().int().min(1).max(500).optional(),
  },
  async (args) => textResult(runTelegramAiTrendSnapshotList(args)),
);

server.tool(
  "ads_campaign_create",
  "Create a local advertising campaign definition, optionally inside a project. It starts in draft status.",
  {
    project_id: z.string().min(1).optional(),
    source: z.string().min(1).max(80).optional(),
    name: z.string().min(1).max(200),
    objective: campaignObjective,
    currency: z.string().min(3).max(6).optional(),
    budget_amount: z.number().nonnegative().optional(),
    daily_budget: z.number().nonnegative().optional(),
    starts_at: z.string().optional(),
    ends_at: z.string().optional(),
    targeting: jsonObject.optional(),
    tracking: jsonObject.optional(),
    metadata: jsonObject.optional(),
  },
  async (args) => textResult(runCampaignCreate(args)),
);

server.tool(
  "ads_campaign_get",
  "Get one campaign by its local id.",
  { campaign_id: z.string().min(1) },
  async (args) => textResult(runCampaignGet(args)),
);

server.tool(
  "ads_campaign_list",
  "List local campaigns, optionally filtered by project and lifecycle status.",
  {
    project_id: z.string().min(1).optional(),
    source: z.string().min(1).max(80).optional(),
    status: campaignStatus.optional(),
    limit: z.number().int().min(1).max(200).optional(),
  },
  async (args) => textResult(runCampaignList(args)),
);

server.tool(
  "ads_campaign_update",
  "Update campaign metadata, lifecycle status or project assignment.",
  {
    campaign_id: z.string().min(1),
    project_id: z.string().min(1).nullable().optional(),
    source: z.string().min(1).max(80).nullable().optional(),
    name: z.string().min(1).max(200).optional(),
    objective: campaignObjective.optional(),
    status: campaignStatus.optional(),
    currency: z.string().min(3).max(6).optional(),
    budget_amount: z.number().nonnegative().nullable().optional(),
    daily_budget: z.number().nonnegative().nullable().optional(),
    starts_at: z.string().nullable().optional(),
    ends_at: z.string().nullable().optional(),
    targeting: jsonObject.nullable().optional(),
    tracking: jsonObject.nullable().optional(),
    metadata: jsonObject.nullable().optional(),
  },
  async (args) => textResult(runCampaignUpdate(args)),
);

server.tool(
  "ads_event_ingest",
  "Ingest a funnel event or conversion. A stable dedupe_key makes retries safe.",
  {
    id: z.string().optional(),
    campaign_id: z.string().min(1),
    kind: eventKind,
    event_name: z.string().min(1).max(120),
    occurred_at: z.string().optional(),
    amount: z.number().nonnegative().optional(),
    count: z.number().positive().optional(),
    currency: z.string().min(3).max(6).optional(),
    visitor_id: z.string().optional(),
    session_id: z.string().optional(),
    provider: z.string().optional(),
    external_id: z.string().optional(),
    dedupe_key: z.string().min(1).optional(),
    tracking: z
      .object({
        utm_source: z.string().max(160).optional(),
        utm_medium: z.string().max(160).optional(),
        utm_campaign: z.string().max(200).optional(),
        utm_content: z.string().max(200).optional(),
        utm_term: z.string().max(200).optional(),
        click_id: z.string().max(240).optional(),
        landing_page: z.string().max(1000).optional(),
        referrer: z.string().max(1000).optional(),
        channel: z.string().max(120).optional(),
      })
      .optional(),
    metadata: jsonObject.optional(),
  },
  async (args) => textResult(runEventIngest(args)),
);

server.tool(
  "ads_spend_record",
  "Record spend and daily platform metrics. A stable dedupe_key makes sync retries safe.",
  {
    id: z.string().optional(),
    campaign_id: z.string().min(1),
    day: z.string().optional(),
    provider: z.string().min(1),
    amount: z.number().nonnegative(),
    currency: z.string().min(3).max(6).optional(),
    impressions: z.number().int().nonnegative().optional(),
    clicks: z.number().int().nonnegative().optional(),
    external_id: z.string().optional(),
    dedupe_key: z.string().min(1).optional(),
    metadata: jsonObject.optional(),
  },
  async (args) => textResult(runSpendRecord(args)),
);

server.tool(
  "ads_campaign_analytics",
  "Calculate spend, funnel and efficiency KPIs for one or all campaigns.",
  {
    campaign_id: z.string().optional(),
    project_id: z.string().optional(),
    source: z.string().min(1).max(80).optional(),
    from: z.string().optional(),
    to: z.string().optional(),
  },
  async (args) => textResult(runCampaignAnalytics(args)),
);

server.tool(
  "ads_campaign_timeseries",
  "Read normalized time-bucketed provider metrics saved in local SQLite.",
  {
    campaign_id: z.string().optional(),
    project_id: z.string().optional(),
    source: z.string().min(1).max(80).optional(),
    provider: z.string().min(1).max(80).optional(),
    period: z.enum(["5min", "day"]).optional(),
    from: z.string().optional(),
    to: z.string().optional(),
    limit: z.number().int().min(1).max(50_000).optional(),
  },
  async (args) => textResult(runCampaignTimeseries(args)),
);

server.tool(
  "ads_attribution_report",
  "Attribute local conversion events to tracked touchpoints using a selected attribution model.",
  {
    model: z.enum(["first_touch", "last_touch", "linear", "position_based"]),
    campaign_id: z.string().optional(),
    project_id: z.string().optional(),
    from: z.string().optional(),
    to: z.string().optional(),
    lookback_days: z.number().int().min(0).max(90).optional(),
  },
  async (args) => textResult(runAttributionReport(args)),
);

server.tool(
  "ads_integration_register",
  "Register an external advertising, CRM or webhook integration without storing secrets.",
  {
    id: z.string().optional(),
    provider: z.string().min(1),
    name: z.string().min(1).max(160),
    status: z.enum(["active", "paused", "error"]).optional(),
    secret_env: z.array(z.string()).optional(),
    config: jsonObject.optional(),
  },
  async (args) => textResult(runIntegrationRegister(args)),
);

server.tool(
  "ads_integration_list",
  "List registered integrations and built-in adapter capabilities/configuration status.",
  {},
  async () => textResult(runIntegrationList()),
);

server.tool(
  "ads_integration_plan",
  "Show adapter readiness, required environment keys and safe next actions for one or all providers.",
  { provider: z.string().optional() },
  async (args) => textResult(runIntegrationPlan(args.provider)),
);

server.tool(
  "ads_platform_guide",
  "Explain what audience and acquisition scenario each advertising platform fits before configuring its MCP module.",
  {
    provider: z.string().optional(),
    goal: z.string().max(160).optional(),
  },
  async (args) => textResult(runPlatformGuide(args)),
);

server.tool(
  "ads_module_plan",
  "Show configured provider MCP modules without starting them. Modules keep their own API logic and credentials outside the AdsMCP database.",
  {},
  async () => textResult(runModulePlan()),
);

server.tool(
  "ads_dashbord_start",
  "Start the local AdsMCP settings page on 127.0.0.1. It stores Click.ru data, Yandex Direct OAuth token files and settings, Microsoft Advertising OAuth profiles, Mastodon OAuth account tokens and configured MCP module credentials locally. The Modules page shows manifest, credential and runtime status without returning secrets, and provides the preferred local Telegram account / GramJS login flow; it never performs billing or campaign actions. Use restart=true only to replace an already-running page.",
  {
    port: z.number().int().min(0).max(65535).optional(),
    restart: z.boolean().optional(),
  },
  async (args) => textResult(args.restart
    ? await restartClickruSettingsServer(args.port ?? 8790)
    : await startClickruSettingsServer(args.port ?? 8790)),
);

server.tool(
  "ads_dashbord_stop",
  "Stop the local AdsMCP settings page. This does not delete Click.ru profiles, Microsoft OAuth profiles, Mastodon accounts or campaign drafts.",
  {},
  async () => {
    await stopClickruSettingsServer();
    return textResult({ stopped: true, url: "http://127.0.0.1:8790/" });
  },
);

server.tool(
  "ads_clickru_profiles_status",
  "Show locally stored Click.ru advertiser profiles with masked INNs and the active profile. Never returns API tokens.",
  {},
  async () => textResult(clickruProfilesStatus()),
);

server.tool(
  "ads_clickru_campaign_drafts_status",
  "Show locally stored Click.ru campaign drafts, their statuses and the active campaign. Drafts are not sent or launched.",
  {},
  async () => textResult(clickruCampaignDraftsStatus()),
);

server.tool(
  "ads_clickru_campaign_draft_set_status",
  "Change a locally stored Click.ru campaign between DRAFT and READY. This never sends or launches the campaign.",
  {
    draft_id: z.string().min(1),
    status: z.enum(["DRAFT", "READY"]),
  },
  async (args) => textResult(setClickruCampaignDraftStatus(args.draft_id, args.status)),
);

server.tool(
  "ads_module_tools",
  "Discover tools exposed by one configured provider MCP module.",
  { module_id: z.string().min(1) },
  async (args) => textResult(await runModuleTools(args.module_id)),
);

server.tool(
  "ads_module_call",
  "Call a tool of a configured provider MCP module, optionally restricted by its allow_tools list. Use provider-native tools for capabilities that AdsMCP does not reimplement.",
  {
    module_id: z.string().min(1),
    tool_name: z.string().min(1),
    arguments: jsonObject.optional(),
    timeout_ms: z.number().int().min(1000).max(300000).optional(),
  },
  async (args) => textResult(await runModuleCall(args)),
);

server.tool(
  "ads_google_ads_report",
  "Read daily Google Ads campaign metrics through the configured service-account adapter. This tool never writes to Google Ads.",
  {
    from: z.string().optional(),
    to: z.string().optional(),
    customer_id: z.string().regex(/^[-\d]+$/).optional(),
    login_customer_id: z.string().regex(/^[-\d]+$/).optional(),
  },
  async (args) => textResult(await runGoogleAdsReport(args)),
);

server.tool(
  "ads_google_ads_sync",
  "Read Google Ads metrics and persist normalized campaign, spend and aggregate conversion data into local SQLite. This never writes to Google Ads.",
  {
    from: z.string().optional(),
    to: z.string().optional(),
    customer_id: z.string().regex(/^[-\d]+$/).optional(),
    login_customer_id: z.string().regex(/^[-\d]+$/).optional(),
    project_id: z.string().min(1).optional(),
  },
  async (args) => textResult(await runGoogleAdsSync(args)),
);

server.tool(
  "ads_google_ads_pmax_replace_images",
  "Replace the enabled landscape and portrait marketing images in one Google Ads Performance Max asset group. New images are linked first; square images, logos and text assets are preserved. Requires explicit confirm=true.",
  {
    customer_id: z.string().regex(/^[-\d]+$/).optional(),
    login_customer_id: z.string().regex(/^[-\d]+$/).optional(),
    asset_group_id: z.string().regex(/^[-\d]+$/),
    assets: z.array(z.object({
      file_path: z.string().min(1),
      field_type: z.enum(["MARKETING_IMAGE", "PORTRAIT_MARKETING_IMAGE"]),
      label: z.string().max(120).optional(),
    })).min(1).max(10),
    confirm: z.boolean().optional(),
  },
  async (args) => textResult(await replaceGoogleAdsPmaxImages(args)),
);

server.tool(
  "ads_microsoft_ads_report",
  "Read aggregate Microsoft Advertising campaign metrics through the official read-only MCP. This tool never writes to Microsoft Ads.",
  {
    from: z.string().optional(),
    to: z.string().optional(),
    preset: z.enum([
      "Today",
      "Yesterday",
      "LastSevenDays",
      "LastFourteenDays",
      "LastThirtyDays",
      "ThisMonth",
      "LastMonth",
    ]).optional(),
    module_id: z.string().optional(),
    tool_name: z.string().optional(),
    customer_id: z.string().regex(/^\d+$/).optional(),
    account_id: z.string().regex(/^\d+$/).optional(),
    currency: z.string().min(3).max(6).optional(),
  },
  async (args) => textResult(await runMicrosoftAdsReport(args)),
);

server.tool(
  "ads_microsoft_ads_sync",
  "Read aggregate Microsoft Advertising metrics and persist normalized campaigns, spend and conversions into local SQLite. This never writes to Microsoft Ads.",
  {
    from: z.string().optional(),
    to: z.string().optional(),
    preset: z.enum([
      "Today",
      "Yesterday",
      "LastSevenDays",
      "LastFourteenDays",
      "LastThirtyDays",
      "ThisMonth",
      "LastMonth",
    ]).optional(),
    module_id: z.string().optional(),
    tool_name: z.string().optional(),
    customer_id: z.string().regex(/^\d+$/).optional(),
    account_id: z.string().regex(/^\d+$/).optional(),
    currency: z.string().min(3).max(6).optional(),
    project_id: z.string().min(1).optional(),
  },
  async (args) => textResult(await runMicrosoftAdsSync(args)),
);

server.tool(
  "ads_yandex_direct_report",
  "Read Yandex Direct campaign statistics through the configured provider MCP module and normalize the result by day.",
  {
    from: z.string().optional(),
    to: z.string().optional(),
    module_id: z.string().optional(),
    tool_name: z.string().optional(),
    currency: z.string().min(3).max(6).optional(),
    campaign_ids: z.array(z.string()).optional(),
  },
  async (args) => textResult(await runYandexDirectReport(args)),
);

server.tool(
  "ads_yandex_direct_sync",
  "Read Yandex Direct statistics through the provider MCP module and persist normalized campaigns, spend and conversions into local SQLite.",
  {
    from: z.string().optional(),
    to: z.string().optional(),
    module_id: z.string().optional(),
    tool_name: z.string().optional(),
    currency: z.string().min(3).max(6).optional(),
    campaign_ids: z.array(z.string()).optional(),
    project_id: z.string().min(1).optional(),
  },
  async (args) => textResult(await runYandexDirectSync(args)),
);

server.tool(
  "ads_yandex_direct_write",
  "Apply an explicitly confirmed, idempotent Yandex Direct campaign change through the provider API. Updates and lifecycle status changes for existing campaigns are exposed; creation uses the dedicated safe create tool and deletion remains disabled.",
  {
    service: z.literal("campaigns"),
    method: z.enum(["update", "suspend", "resume", "archive", "unarchive"]),
    items: z.array(jsonObject).min(1).max(100),
    idempotency_key: z.string().min(8).max(200),
    confirm: z.literal(true).describe("Required explicit confirmation that these exact campaign changes may be sent to Yandex Direct."),
  },
  async (args) => textResult(await runYandexDirectWrite(args)),
);

server.tool(
  "ads_yandex_direct_create_campaign",
  "Create one paused Yandex Direct text campaign through the guarded provider path. The new campaign is created with search and network serving off, without ads or a budget; it cannot start showing until configured and enabled separately.",
  {
    name: z.string().min(1).max(255),
    start_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
    time_zone: z.string().min(1).max(64).optional(),
    client_info: z.string().max(255).optional(),
    idempotency_key: z.string().min(8).max(200),
    confirm: z.literal(true).describe("Required explicit confirmation that this exact paused campaign may be created in Yandex Direct."),
  },
  async (args) => textResult(await runYandexDirectCreateCampaign(args)),
);

server.tool(
  "ads_telegram_ads_report",
  "Read Telegram Ads account, campaigns and normalized metrics through the configured HTTP-based MCP module. This is read-only.",
  {
    module_id: z.string().optional(),
    list_tool: z.string().optional(),
    stats_tool: z.string().optional(),
    stats_period: z.enum(["5min", "day"]).optional(),
    include_stats: z.boolean().optional(),
    max_ads: z.number().int().min(1).max(100).optional(),
  },
  async (args) => textResult(await runTelegramAdsReport(args)),
);

server.tool(
  "ads_telegram_ads_sync",
  "Read Telegram Ads metrics and persist campaigns, daily spend and optional time-bucketed metrics into local SQLite. This never writes to Telegram Ads.",
  {
    module_id: z.string().optional(),
    list_tool: z.string().optional(),
    stats_tool: z.string().optional(),
    stats_period: z.enum(["5min", "day"]).optional(),
    include_stats: z.boolean().optional(),
    max_ads: z.number().int().min(1).max(100).optional(),
    project_id: z.string().min(1).optional(),
  },
  async (args) => textResult(await runTelegramAdsSync(args)),
);

server.tool(
  "ads_telegram_accounts_report",
  "List Telegram Ads cabinets and optionally read one or all cabinets. Switching cabinets requires explicit confirm=true and is restored to the original cabinet afterward.",
  {
    module_id: z.string().optional(),
    account_id: z.string().optional(),
    all: z.boolean().optional(),
    confirm: z.boolean().optional(),
    include_stats: z.boolean().optional(),
    max_ads: z.number().int().min(1).max(100).optional(),
    stats_period: z.enum(["5min", "day"]).optional(),
  },
  async (args) => textResult(await runTelegramAdsAccountsReport(args)),
);

server.tool(
  "ads_telegram_accounts_sync",
  "Read one or all Telegram Ads cabinets and persist their campaigns, daily spend and optional time-bucketed metrics into local SQLite. Cabinet switching requires explicit confirm=true.",
  {
    module_id: z.string().optional(),
    account_id: z.string().optional(),
    all: z.boolean().optional(),
    confirm: z.boolean().optional(),
    include_stats: z.boolean().optional(),
    max_ads: z.number().int().min(1).max(100).optional(),
    stats_period: z.enum(["5min", "day"]).optional(),
    project_id: z.string().min(1).optional(),
    project_rules: z
      .array(
        z.object({
          project_id: z.string().min(1),
          name_contains: z.string().max(160).optional(),
          url_contains: z.string().max(500).optional(),
        }),
      )
      .max(20)
      .optional(),
  },
  async (args) =>
    textResult(
      await runTelegramAdsAccountsSync({
        ...args,
        project_rules: args.project_rules?.map((rule) => ({
          projectId: rule.project_id,
          nameContains: rule.name_contains,
          urlContains: rule.url_contains,
        })),
      }),
    ),
);

server.tool(
  "ads_telegram_ads_api_status",
  "Show the official Telegram Ads API layer readiness. With probe=true, perform one read-only getCurrentAccount request; provider writes remain separately guarded.",
  { probe: z.boolean().optional() },
  async (args) => textResult(await runTelegramAdsApiStatus(args)),
);

server.tool(
  "ads_telegram_ads_api_create_ad",
  "Create one Telegram Ads advertisement through the official API. This is a provider write; confirm=true is required. Defaults to paused with zero initial budget.",
  {
    account_id: z.string().min(1).optional(),
    title: z.string().min(1).max(128),
    text: z.string().max(160).optional(),
    promote_url: z.string().min(1).max(256),
    cpm: z.number().positive(),
    placement: z.enum(["channel_post", "bot_banner", "search_result", "video_banner"]),
    target: jsonObject,
    impression_frequency: z.number().int().min(1).max(4).optional(),
    show_userpic: z.boolean().optional(),
    initial_budget: z.number().min(0).optional(),
    daily_budget_limit: z.number().min(0).optional(),
    is_paused: z.boolean().optional(),
    return_target: z.boolean().optional(),
    idempotency_key: z.string().min(1).max(128).optional(),
    timeout_ms: z.number().int().min(1000).max(120000).optional(),
    confirm: z.literal(true),
  },
  async (args) => textResult(await runTelegramAdsApiCreateAd(args)),
);

server.tool(
  "ads_telegram_ads_api_increase_ad_budget",
  "Increase one Telegram Ads ad budget through the official API. This is a provider write; confirm=true is required.",
  {
    account_id: z.string().min(1).optional(),
    ad_id: z.union([z.string().min(1), z.number().int().positive()]),
    amount: z.number().positive(),
    idempotency_key: z.string().min(1).max(128).optional(),
    timeout_ms: z.number().int().min(1000).max(120000).optional(),
    confirm: z.literal(true),
  },
  async (args) => textResult(await runTelegramAdsApiIncreaseBudget(args)),
);

server.tool(
  "ads_telegram_ads_api_submit_ad_for_review",
  "Submit one Telegram Ads ad for moderation through the official API. This is a provider write; confirm=true is required.",
  {
    account_id: z.string().min(1).optional(),
    ad_id: z.union([z.string().min(1), z.number().int().positive()]),
    timeout_ms: z.number().int().min(1000).max(120000).optional(),
    confirm: z.literal(true),
  },
  async (args) => textResult(await runTelegramAdsApiSubmitForReview(args)),
);

server.tool(
  "ads_telegram_ads_api_set_ad_paused",
  "Pause or resume one Telegram Ads ad through the official API. This is a provider write; confirm=true is required.",
  {
    account_id: z.string().min(1).optional(),
    ad_id: z.union([z.string().min(1), z.number().int().positive()]),
    is_paused: z.boolean(),
    timeout_ms: z.number().int().min(1000).max(120000).optional(),
    confirm: z.literal(true),
  },
  async (args) => textResult(await runTelegramAdsApiSetPaused(args)),
);

server.tool(
  "ads_telegram_ads_api_report",
  "Read Telegram Ads through the official promoteapi.telegram.org API. This is read-only and supports exact date-bounded 5-minute or daily stats.",
  {
    account_id: z.string().min(1).optional(),
    stats_period: z.enum(["5min", "day"]).optional(),
    include_stats: z.boolean().optional(),
    max_ads: z.number().int().min(1).max(100).optional(),
    from: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
    to: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
    timeout_ms: z.number().int().min(1000).max(120000).optional(),
  },
  async (args) => textResult(await runTelegramAdsApiReport(args)),
);

server.tool(
  "ads_telegram_ads_api_sync",
  "Read official Telegram Ads API metrics and persist them into the same local SQLite campaign model. This never writes to Telegram Ads.",
  {
    account_id: z.string().min(1).optional(),
    stats_period: z.enum(["5min", "day"]).optional(),
    include_stats: z.boolean().optional(),
    max_ads: z.number().int().min(1).max(100).optional(),
    from: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
    to: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
    timeout_ms: z.number().int().min(1000).max(120000).optional(),
    project_id: z.string().min(1).optional(),
  },
  async (args) => textResult(await runTelegramAdsApiSync(args)),
);

server.tool(
  "ads_telegram_account_status",
  "Check the local Telegram user-account GramJS/TDLib dependencies, credentials, authentication state and ignored storage paths.",
  {},
  async () => textResult(await runTelegramAccountStatus()),
);

server.tool(
  "ads_discord_status",
  "Check the official Discord bot connector, credentials and current bot identity. Normal user-account tokens and passwords are not supported.",
  {},
  async () => textResult(await runDiscordStatus()),
);

server.tool(
  "ads_discord_guild_list",
  "List Discord servers where the configured bot is installed. This is not a global server search.",
  { limit: z.number().int().min(1).max(200).optional() },
  async (args) => textResult(await runDiscordGuildList(args)),
);

server.tool(
  "ads_discord_channel_list",
  "List viewable text, announcement, forum and thread channels in one Discord server.",
  { guild_id: z.string().min(1).max(80) },
  async (args) => textResult(await runDiscordChannelList(args)),
);

server.tool(
  "ads_discord_member_search",
  "Search members by username or nickname inside one installed Discord server. Finding a member does not authorize contacting them.",
  {
    guild_id: z.string().min(1).max(80),
    query: z.string().min(1).max(100),
    limit: z.number().int().min(1).max(1000).optional(),
  },
  async (args) => textResult(await runDiscordMemberSearch(args)),
);

server.tool(
  "ads_discord_message_search",
  "Search a bounded recent page of messages in one accessible Discord channel; history is not crawled or persisted.",
  {
    channel_id: z.string().min(1).max(80),
    query: z.string().max(500).optional(),
    limit: z.number().int().min(1).max(100).optional(),
    before: z.string().max(80).optional(),
    after: z.string().max(80).optional(),
  },
  async (args) => textResult(await runDiscordMessageSearch(args)),
);

server.tool(
  "ads_discord_channel_send",
  "Send one plain-text message to one selected Discord channel after explicit confirm=true. No bulk sends and no member DMs.",
  {
    channel_id: z.string().min(1).max(80),
    text: z.string().min(1).max(2000),
    confirm: z.literal(true).describe("Explicitly confirm sending this one channel message"),
  },
  async (args) => textResult(await runDiscordChannelSend(args)),
);

server.tool(
  "ads_mastodon_account_list",
  "List locally connected Mastodon accounts without returning access tokens.",
  {},
  async () => textResult(runMastodonAccountList()),
);

server.tool(
  "ads_mastodon_auth_start",
  "Start a Mastodon OAuth 2 + PKCE account connection for one instance. Open the returned authorization_url and then complete it with the one-time code.",
  {
    instance_url: z.string().url().describe("Mastodon instance origin, for example https://mastodon.social"),
    account_id: z.string().min(1).max(120).optional().describe("Local account label used by later tools"),
    client_name: z.string().min(1).max(200).optional().describe("Optional Mastodon application name; otherwise account-specific or global default is used"),
    scopes: z.array(z.string().min(1).max(80)).min(1).max(20).optional().describe("OAuth scopes; read:follows is always added so existing subscriptions can be checked before following"),
    force_login: z.boolean().optional().describe("Ask the instance to show its login form even when a session exists"),
  },
  async (args) => textResult(await runMastodonAuthStart(args)),
);

server.tool(
  "ads_mastodon_auth_complete",
  "Complete a pending Mastodon OAuth connection with the one-time code shown by the instance. The code is not logged or returned.",
  {
    state: z.string().min(16).max(200),
    code: z.string().min(1).max(4096).describe("One-time authorization code shown after approving access"),
  },
  async (args) => textResult(await runMastodonAuthComplete(args)),
);

server.tool(
  "ads_mastodon_status",
  "Check the connected Mastodon account and current profile through verify_credentials.",
  { account_id: z.string().min(1).max(120).optional() },
  async (args) => textResult(await runMastodonStatus(args)),
);

server.tool(
  "ads_mastodon_thread_create",
  "Publish one explicitly provided Mastodon thread in order after confirm=true. Every post after the first replies to the previous post; optionally pin only the thread root.",
  {
    account_id: z.string().min(1).max(120).optional(),
    posts: z.array(z.string().min(1).max(5000)).min(1).max(15).describe("Exact ordered public thread texts"),
    visibility: z.enum(["public", "unlisted", "private"]).optional().describe("Visibility for every post; defaults to public"),
    delay_ms: z.number().int().min(0).max(60000).optional().describe("Optional delay between posts; default 0"),
    pin_root: z.boolean().optional().describe("Pin the first/root post after the thread is published"),
    confirm: z.literal(true).describe("Explicitly confirm publishing this exact thread and optional pin"),
  },
  async (args) => textResult(await runMastodonThreadCreate(args)),
);

server.tool(
  "ads_mastodon_pin_status",
  "Pin one selected Mastodon status after explicit confirm=true.",
  {
    account_id: z.string().min(1).max(120).optional(),
    status_id: z.string().min(1).max(200),
    confirm: z.literal(true).describe("Explicitly confirm pinning this one Mastodon status"),
  },
  async (args) => textResult(await runMastodonPinStatus(args)),
);

server.tool(
  "ads_mastodon_notification_list",
  "Read a bounded page of Mastodon mention notifications to prepare a context-aware reply. This tool never publishes anything.",
  {
    account_id: z.string().min(1).max(120).optional(),
    limit: z.number().int().min(1).max(40).optional(),
    since_id: z.string().max(200).optional(),
  },
  async (args) => textResult(await runMastodonNotificationList(args)),
);

server.tool(
  "ads_mastodon_hashtag_search",
  "Read public Mastodon hashtag timelines for AI-related discovery, score cost/local-model/MCP intent signals and return ranked candidate accounts with bounded post evidence. This never follows or contacts anyone.",
  {
    account_id: z.string().min(1).max(120).optional(),
    hashtags: z.array(z.string().min(1).max(80)).min(1).max(20).describe("Hashtags such as AI, Hermes, Qwen, OpenCode, localmodels, limits or #лимиты; # prefix is optional"),
    per_hashtag_limit: z.number().int().min(1).max(40).optional(),
    min_signal_score: z.number().int().min(0).max(100).optional().describe("Filter by matched intent signal strength; 0 keeps all candidates"),
  },
  async (args) => textResult(await runMastodonHashtagSearch(args)),
);

server.tool(
  "ads_mastodon_interest_search",
  "Run the expanded Mastodon interest discovery pack for AI agents, MCP, local/self-hosted models, providers, costs and limits; score pain/intent signals and save bounded public evidence to the local research base. This never follows or contacts anyone.",
  {
    account_id: z.string().min(1).max(120).optional(),
    project_id: z.string().min(1).max(120).default("neron"),
    hashtags: z.array(z.string().min(1).max(80)).max(20).optional().describe("Optional custom tags; default includes Hermes, Qwen, OpenCode, local models, MCP and Russian cost/limits tags"),
    per_hashtag_limit: z.number().int().min(1).max(40).optional(),
    min_signal_score: z.number().int().min(1).max(100).default(30),
    save_to_research: z.boolean().default(true).describe("Store bounded public candidates and evidence in the local interest research base"),
  },
  async (args) => textResult(await runMastodonInterestSearch(args)),
);

server.tool(
  "ads_mastodon_follow",
  "Follow one selected Mastodon account after explicit confirm=true. Search results never trigger follows automatically; read:follows is required to check existing subscriptions and write:follows is required to follow.",
  {
    account_id: z.string().min(1).max(120).optional(),
    target_account_id: z.string().min(1).max(120).describe("Mastodon account id from ads_mastodon_hashtag_search"),
    reblogs: z.boolean().optional().describe("Whether to include the account's boosts; defaults to true"),
    notify: z.boolean().optional().describe("Whether to enable notifications for this account; defaults to false"),
    confirm: z.literal(true).describe("Explicitly confirm following this one selected account"),
  },
  async (args) => textResult(await runMastodonFollow(args)),
);

server.tool(
  "ads_mastodon_reply",
  "Reply to one selected Mastodon status after explicit confirm=true. The target status is checked first, its author mention is added automatically, and the reply visibility cannot be broader than the target.",
  {
    account_id: z.string().min(1).max(120).optional(),
    status_id: z.string().min(1).max(200),
    text: z.string().min(1).max(5000),
    visibility: z.enum(["public", "unlisted", "private", "direct"]).optional(),
    confirm: z.literal(true).describe("Explicitly confirm sending this one Mastodon reply"),
  },
  async (args) => textResult(await runMastodonReply(args)),
);

server.tool(
  "ads_mastodon_direct_message",
  "Send one private Mastodon Direct status to one selected account after explicit confirm=true. The target mention is added automatically; no bulk messaging.",
  {
    account_id: z.string().min(1).max(120).optional(),
    target_account_id: z.string().min(1).max(120).describe("Mastodon account id from discovery or a selected profile"),
    text: z.string().min(1).max(5000),
    confirm: z.literal(true).describe("Explicitly confirm sending this one private Mastodon message"),
  },
  async (args) => textResult(await runMastodonDirectMessage(args)),
);

server.tool(
  "ads_mastodon_public_mention",
  "Publish one public Mastodon mention to one selected account after explicit confirm=true. Optionally reply to one public status; no bulk messaging.",
  {
    account_id: z.string().min(1).max(120).optional(),
    target_account_id: z.string().min(1).max(120).describe("Mastodon account id from discovery or a selected profile"),
    text: z.string().min(1).max(5000),
    in_reply_to_id: z.string().min(1).max(200).optional().describe("Optional public status id to reply to"),
    confirm: z.literal(true).describe("Explicitly confirm publishing this one public mention"),
  },
  async (args) => textResult(await runMastodonPublicMention(args)),
);

server.tool(
  "ads_mastodon_message_batch",
  "Send an explicitly provided ordered list of Mastodon direct messages, public mentions or replies after confirm=true. Each item names its recipient, exact text and mode; discovery never creates items automatically.",
  {
    account_id: z.string().min(1).max(120).optional(),
    messages: z.array(z.object({
      mode: z.enum(["direct", "public_mention", "reply"]),
      target_account_id: z.string().min(1).max(120),
      status_id: z.string().min(1).max(200).optional(),
      text: z.string().min(1).max(5000),
      visibility: z.enum(["public", "unlisted", "private", "direct"]).optional(),
    })).min(1).max(50).describe("Explicit recipient, mode and exact text for every message"),
    delay_ms: z.number().int().min(0).max(60000).optional().describe("Optional delay between messages; default 0"),
    confirm: z.literal(true).describe("Explicitly confirm this exact ordered message list"),
  },
  async (args) => textResult(await runMastodonMessageBatch(args)),
);

server.tool(
  "ads_mastodon_profile_update",
  "Update selected Mastodon profile fields after explicit confirm=true. Unspecified fields remain unchanged.",
  {
    account_id: z.string().min(1).max(120).optional(),
    display_name: z.string().max(200).optional(),
    note: z.string().max(10000).optional(),
    locked: z.boolean().optional(),
    discoverable: z.boolean().optional(),
    indexable: z.boolean().optional(),
    hide_collections: z.boolean().optional(),
    language: z.string().max(32).optional(),
    fields: z.array(z.object({ name: z.string().max(200), value: z.string().max(2000) })).max(4).optional(),
    confirm: z.literal(true).describe("Explicitly confirm changing this Mastodon profile"),
  },
  async (args) => textResult(await runMastodonProfileUpdate(args)),
);

server.tool(
  "ads_telegram_account_auth",
  "Continue local Telegram user-account login through the selected backend. GramJS supports starting a local QR flow; never paste Telegram codes or 2FA passwords into a hosted chat.",
  {
    phone: z.string().min(5).max(32).optional(),
    code: z.string().min(1).max(32).optional(),
    password: z.string().min(1).max(256).optional(),
    qr: z.boolean().optional().describe("Start the local GramJS QR login flow"),
  },
  async (args) => textResult(await runTelegramAccountAuth(args)),
);

server.tool(
  "ads_telegram_account_search",
  "Read recent history or search one Telegram chat through the connected local GramJS/TDLib account. Requires Telegram Premium; no messages are sent.",
  {
    chat: z.string().min(1).max(500).describe("@username, t.me link, or numeric Telegram chat id"),
    query: z.string().max(500).optional(),
    limit: z.number().int().min(1).max(50).optional(),
    since: z.string().optional().describe("ISO timestamp; older messages are excluded"),
  },
  async (args) => textResult(await runTelegramAccountSearch(args)),
);

server.tool(
  "ads_telegram_chat_mark_read",
  "Mark one human one-to-one Telegram chat as read. Requires explicit confirm=true; sends no message, does not create a local dialogue row, and does not mark bots or channels.",
  {
    chat: z.string().min(1).max(500).describe("@username, t.me link, or numeric Telegram user id"),
    confirm: z.literal(true).describe("Explicitly confirm changing this chat's Telegram read state"),
  },
  async (args) => textResult(await runTelegramChatMarkRead(args)),
);

server.tool(
  "ads_telegram_public_posts_search",
  "Search public Telegram channel posts globally by full-text query. Requires Telegram Premium. Uses a free daily quota when available and never spends Stars without explicit confirm_paid=true plus a sufficient max_stars limit.",
  {
    query: z.string().min(1).max(500),
    limit: z.number().int().min(1).max(50).optional(),
    confirm_paid: z.boolean().optional().describe("Explicitly authorize a paid search if Telegram reports that the free quota is exhausted"),
    max_stars: z.number().int().min(1).max(10000).optional().describe("Maximum Stars you authorize for one search; required with confirm_paid=true when payment is needed"),
  },
  async (args) => textResult(await runTelegramPublicPostSearch(args)),
);

server.tool(
  "ads_telegram_action_queue_create",
  "Create an ordered local Telegram action queue from explicitly supplied targets and exact texts. Requires confirm=true; it does not execute anything. Supports one-to-one messages, group replies, channel-post replies and one-message reactions. No recipient discovery is performed. Each action is assigned a random pause between min_delay_seconds and max_delay_seconds (default 15–66 s) before it runs.",
  {
    project_id: z.string().max(120).optional(),
    min_delay_seconds: z.number().int().min(15).max(300).optional().describe("Lower bound of the random pause between queued actions; defaults to 15 seconds"),
    max_delay_seconds: z.number().int().min(15).max(300).optional().describe("Upper bound of the random pause between queued actions; defaults to 66 seconds"),
    actions: z.array(z.union([
      z.object({ type: z.literal("send_message"), target: z.string().min(1).max(500), text: z.string().min(1).max(4096) }),
      z.object({ type: z.literal("chat_reply"), target: z.string().min(1).max(500), message_id: z.number().int().positive(), text: z.string().min(1).max(4096) }),
      z.object({ type: z.literal("public_post_reply"), target: z.string().min(1).max(500), message_id: z.number().int().positive(), text: z.string().min(1).max(4096) }),
      z.object({ type: z.literal("reaction"), target: z.string().min(1).max(500), message_id: z.number().int().positive(), reaction: z.string().min(1).max(32), expected_text: z.string().max(4096).optional() }),
    ])).min(1).max(50),
    confirm: z.literal(true).describe("Explicitly approve creating this exact ordered queue"),
  },
  async (args) => textResult(runTelegramActionQueueCreate(args)),
);

server.tool(
  "ads_telegram_action_queue_list",
  "List the exact actions and statuses in one local Telegram action queue. Read-only; it does not send or mark anything read.",
  {
    queue_id: z.string().min(1).max(120),
    status: z.enum(["queued", "running", "sent", "failed", "cancelled"]).optional(),
  },
  async (args) => textResult(runTelegramActionQueueList(args)),
);

server.tool(
  "ads_telegram_action_queue_process",
  "Execute an explicitly approved Telegram action queue in sequence. Requires Premium and confirm=true; verifies each action through the existing send/reply/reaction tools, waits at least the configured interval, and stops on the first error without retrying.",
  {
    queue_id: z.string().min(1).max(120),
    max_actions: z.number().int().min(1).max(50).optional().describe("Maximum queued actions to process in this run; defaults to 1"),
    wait_for_interval: z.boolean().optional().describe("Wait for the configured minimum interval; defaults to true"),
    confirm: z.literal(true).describe("Explicitly approve executing the queued actions"),
  },
  async (args) => textResult(await runTelegramActionQueueProcess(args)),
);

server.tool(
  "ads_telegram_action_queue_cancel",
  "Cancel all still-queued actions in one local Telegram action queue. Requires confirm=true; already sent or failed actions are not changed.",
  {
    queue_id: z.string().min(1).max(120),
    confirm: z.literal(true).describe("Explicitly confirm cancelling the queued actions"),
  },
  async (args) => textResult(runTelegramActionQueueCancel(args)),
);

server.tool(
  "ads_telegram_account_send",
  "Send one plain-text Telegram message through the selected local GramJS/TDLib account. Requires Telegram Premium, prior approval of the exact text, and explicit confirm=true; reports a read-only unread-human-dialog preflight without blocking the write; bulk outreach is not supported.",
  {
    to: z.string().min(1).max(500).describe("@username, t.me link, or numeric Telegram chat id"),
    text: z.string().min(1).max(4096),
    confirm: z.literal(true).describe("Explicitly confirm sending this one message"),
  },
  async (args) => textResult(await runTelegramAccountSend(args)),
);

server.tool(
  "ads_telegram_message_react",
  "Add one emoji reaction to one existing Telegram message through the selected local GramJS/TDLib account. Requires Telegram Premium, explicit confirm=true and (when available) expected_text to fail closed if the message changed; does not send text or mark the chat read.",
  {
    chat: z.string().min(1).max(500).describe("@username, t.me link, or numeric Telegram chat id"),
    message_id: z.number().int().positive(),
    reaction: z.string().min(1).max(32).describe("One standard emoji reaction, for example 👍"),
    expected_text: z.string().max(4096).optional().describe("Exact current message text; no reaction is added if it differs"),
    confirm: z.literal(true).describe("Explicitly confirm adding this one reaction"),
  },
  async (args) => textResult(await runTelegramMessageReact(args)),
);

server.tool(
  "ads_telegram_channel_direct_check",
  "Read-only preflight for a broadcast Telegram channel: checks Direct Messages, the connected discussion chat, and public contacts from the channel description. Requires Telegram Premium; never joins, sends a message, or creates a public post.",
  {
    channel: z.string().min(1).max(500).describe("@username or t.me public channel"),
  },
  async (args) => textResult(await runTelegramChannelDirectCheck(args)),
);

server.tool(
  "ads_telegram_channel_direct_send",
  "Send one explicitly approved plain-text message to a Telegram channel's Direct Messages monoforum, only when a read-only preflight confirms that Direct Messages are enabled. Requires Telegram Premium and confirm=true; never publishes to the channel feed.",
  {
    channel: z.string().min(1).max(500).describe("@username or t.me public channel"),
    text: z.string().min(1).max(4096),
    confirm: z.literal(true).describe("Explicitly confirm sending this one channel Direct Message"),
  },
  async (args) => textResult(await runTelegramChannelDirectSend(args)),
);

server.tool(
  "ads_telegram_public_post_reply",
  "Reply publicly to one Telegram channel post through its linked discussion only when the post contains a relevant explicit request and the resource rules permit it. Requires Telegram Premium and explicit confirm=true; reports a read-only unread-human-dialog preflight without blocking the write; never sends a private message and never bypasses moderation or guest-send restrictions.",
  {
    channel: z.string().min(1).max(500).describe("@username or t.me public channel"),
    message_id: z.number().int().positive(),
    text: z.string().min(1).max(4096),
    confirm: z.literal(true).describe("Explicitly confirm sending this one public comment"),
  },
  async (args) => textResult(await runTelegramPublicPostReply(args)),
);

server.tool(
  "ads_telegram_chat_reply",
  "Reply publicly to one message inside an accessible Telegram group when the message contains a relevant explicit request and the resource rules permit it. Requires Telegram Premium and explicit confirm=true; reports a read-only unread-human-dialog preflight without blocking the write; never sends a private message and never bypasses moderation, CAPTCHA or guest-send restrictions.",
  {
    chat: z.string().min(1).max(500).describe("@username or t.me public group"),
    message_id: z.number().int().positive(),
    text: z.string().min(1).max(4096),
    confirm: z.literal(true).describe("Explicitly confirm sending this one public group reply"),
  },
  async (args) => textResult(await runTelegramChatReply(args)),
);

server.tool(
  "ads_automation_rule_create",
  "Create a KPI rule. Supported actions are pause_campaign and notify.",
  {
    id: z.string().optional(),
    campaign_id: z.string().optional(),
    name: z.string().min(1).max(160),
    metric: z.enum(["roas", "cpa", "ctr", "conversion_rate", "spend"]),
    operator: z.enum(["gt", "gte", "lt", "lte", "eq"]),
    threshold: z.number(),
    action: z.enum(["pause_campaign", "notify"]),
    enabled: z.boolean().optional(),
    cooldown_minutes: z.number().int().nonnegative().optional(),
  },
  async (args) => textResult(runAutomationRuleCreate(args)),
);

server.tool(
  "ads_automation_rule_list",
  "List automation rules, optionally for one campaign.",
  { campaign_id: z.string().optional(), enabled_only: z.boolean().optional() },
  async (args) => textResult(runAutomationRulesList(args)),
);

server.tool(
  "ads_automation_run",
  "Evaluate automation rules. This is dry-run unless execute=true is explicitly set.",
  {
    campaign_id: z.string().optional(),
    from: z.string(),
    to: z.string(),
    execute: z.boolean().optional(),
  },
  async (args) => textResult(runAutomationExecute(args)),
);

server.tool(
  "ads_store_status",
  "Show local SQLite storage path, row counts and safety defaults.",
  {},
  async () => textResult(runStoreStatus()),
);

server.tool(
  "ads_network_status",
  "Check the optional Ads Network Relay connection. The local MCP works without it.",
  {},
  async () => textResult(await runNetworkStatus()),
);

server.tool(
  "ads_dstore_status",
  "Show the dStore card and advertising-placement adapter configuration. It reads public catalog data and does not send credentials or publish changes.",
  {},
  async () => textResult(runDstoreStatus()),
);

server.tool(
  "ads_dstore_search",
  "Search dStore's verified public advertising inventory. Use this for requests to find channels or sites for mutual promotion; AIKI community proposals are separate and remain unverified until dStore checks them.",
  {
    q: z.string().max(300).optional(),
    platform: z.string().max(100).optional(),
    lang: z.string().max(20).optional(),
    region: z.string().max(20).optional(),
    category: z.string().max(100).optional(),
    format: z.string().max(100).optional(),
    pricing_model: z.string().max(100).optional(),
    currency: z.string().max(20).optional(),
    sort: z.enum(["updated", "relevance", "title"]).optional(),
    limit: z.number().int().min(1).max(50).optional(),
    cursor: z.string().max(500).optional(),
  },
  async (args) => textResult(await runDstorePlacementsSearch({
    ...args,
    ...(args.pricing_model ? { pricingModel: args.pricing_model } : {}),
  })),
);

server.tool(
  "ads_dstore_card_get",
  "Read one public dStore card by numeric id or dStore card URL. Returns normalized title, resource URL, icon, platform, tags and description for catalog discovery.",
  { id_or_url: z.string().min(1).max(500) },
  async (args) => textResult(await runDstoreCardGet(args)),
);

server.tool(
  "ads_dstore_cards_get",
  "Read up to 50 public dStore cards by id or URL. The result keeps successful cards and reports individual lookup errors.",
  { ids_or_urls: z.array(z.string().min(1).max(500)).min(1).max(50) },
  async (args) => textResult(await runDstoreCardsGet(args)),
);

server.tool(
  "ads_aiki_status",
  "Show the AIKI community source for AdsMCP. AIKI proposals are unverified leads; dStore must verify them before adding a platform to the catalog.",
  {},
  async () => textResult(runAikiStatus()),
);

server.tool(
  "ads_aiki_setup_guide",
  "Return the AIKI MCP configuration plus the AdsMCP workflow: search the community topic, check duplicates and topic rules before publishing a new channel or advertising offer, then hand the unverified proposal to dStore.",
  {},
  async () => textResult(runAikiSetupGuide()),
);

server.tool(
  "ads_network_platform_list",
  "List verified or reported advertising platforms from the optional network registry.",
  {
    region: z.string().optional(),
    status: z.enum(["pending", "active", "rejected", "suspended"]).optional(),
  },
  async (args) => textResult(await runNetworkPlatformList(args)),
);

server.tool(
  "ads_network_platform_report",
  "Anonymously report a new advertising platform or integration candidate. No credentials are sent.",
  {
    provider: z.string().min(1),
    name: z.string().min(1).max(200),
    url: z.string().url().optional(),
    region: z.string().max(80).optional(),
    kind: z.string().max(80).optional(),
    capabilities: z.array(z.string()).optional(),
    notes: z.string().max(2000).optional(),
  },
  async (args) => textResult(await runNetworkPlatformReport(args)),
);

server.tool(
  "ads_network_profile_publish",
  "Publish an opt-in networking profile without advertising credentials or raw campaign data.",
  {
    id: z.string().optional(),
    display_name: z.string().min(1).max(160),
    kind: z.string().min(1).max(80),
    regions: z.array(z.string()).optional(),
    capabilities: z.array(z.string()).optional(),
    contact_relay: z.string().max(240).optional(),
  },
  async (args) => textResult(await runNetworkProfilePublish(args)),
);

server.tool(
  "ads_network_profile_list",
  "Find opt-in networking profiles in the optional relay registry.",
  {
    kind: z.string().optional(),
    region: z.string().optional(),
  },
  async (args) => textResult(await runNetworkProfileList(args)),
);

server.tool(
  "ads_network_placement_publish",
  "Publish an opt-in advertising placement offer. Provider credentials stay local.",
  {
    id: z.string().optional(),
    publisher_ref: z.string().min(1).max(160),
    name: z.string().min(1).max(200),
    channel_type: z.string().min(1).max(80),
    url: z.string().url().optional(),
    description: z.string().max(2000).optional(),
    regions: z.array(z.string()).optional(),
    formats: z.array(z.string()).optional(),
    audience: jsonObject.optional(),
    pricing: jsonObject,
    availability: z.string().max(500).optional(),
  },
  async (args) => textResult(await runNetworkPlacementPublish(args)),
);

server.tool(
  "ads_network_inventory_list",
  "List verified advertising placement offers from the optional relay registry.",
  {
    channel_type: z.string().optional(),
    region: z.string().optional(),
    status: z.enum(["pending", "active", "rejected", "suspended"]).optional(),
  },
  async (args) => textResult(await runNetworkInventoryList(args)),
);

server.tool(
  "ads_network_conversion_report",
  "Opt-in anonymous conversion report. Send only opaque references and aggregates, never raw PII or credentials.",
  {
    dedupe_key: z.string().min(1),
    node_ref: z.string().min(1).max(160),
    campaign_ref: z.string().min(1).max(200),
    period: z.string().min(1).max(80),
    event_type: z.string().min(1).max(120),
    count: z.number().int().nonnegative().optional(),
    value: z.number().nonnegative().optional(),
    currency: z.string().min(3).max(6).optional(),
  },
  async (args) => textResult(await runNetworkConversionReport(args)),
);

server.tool(
  "ads_network_aggregate_publish",
  "Opt-in publish of aggregated campaign metrics. The relay never receives raw local events.",
  {
    dedupe_key: z.string().min(1),
    node_ref: z.string().min(1).max(160),
    scope_ref: z.string().min(1).max(200),
    period_from: z.string().min(1),
    period_to: z.string().min(1),
    impressions: z.number().int().nonnegative().optional(),
    clicks: z.number().int().nonnegative().optional(),
    conversions: z.number().int().nonnegative().optional(),
    spend: z.number().nonnegative().optional(),
    revenue: z.number().nonnegative().optional(),
    currency: z.string().min(3).max(6).optional(),
  },
  async (args) => textResult(await runNetworkAggregatePublish(args)),
);

server.tool(
  "ads_network_sync_manifest",
  "Pull opt-in network catalog changes since an ISO timestamp.",
  { since: z.string().optional() },
  async (args) => textResult(await runNetworkSyncManifest(args)),
);

async function main() {
  // Run in the background so a slow or unavailable GitHub request never delays
  // the MCP handshake. The checker persists its timestamp and only runs daily.
  void checkForGithubUpdate(readPackageVersion()).catch((error) => {
    console.error(`[AdsMCP update] Unexpected check failure: ${error instanceof Error ? error.message : String(error)}`);
  });
  void checkWeeklyRecommendationsPr().catch((error) => {
    console.error(`[AdsMCP weekly contribution] Unexpected check failure: ${error instanceof Error ? error.message : String(error)}`);
  });
  const transport = new StdioServerTransport();
  await server.connect(transport);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
