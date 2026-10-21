import { loadEnv } from "../env.js";

export interface AikiAdsMcpSource {
  nodeUrl: string;
  mcpUrl: string;
  topicSlug: string;
  topicUrl: string;
  topicPath: string;
  searchTag: string;
  trust: "community-unverified";
}

export interface AikiSetupGuide extends AikiAdsMcpSource {
  mode: "agent-configured-read";
  auth: "agent-key-required";
  mcpConfig: {
    mcpServers: {
      aiki: {
        url: string;
        headers: { Authorization: string };
      };
    };
  };
  workflow: {
    intervalHours: number;
    search: string[];
    handoff: string[];
    submit: string[];
  };
}

function aikiNodeUrl(): string {
  loadEnv();
  return (process.env.ADS_AIKI_NODE_URL?.trim() || "https://aiki.wiki").replace(/\/$/, "");
}

function aikiTopicSlug(): string {
  loadEnv();
  return process.env.ADS_AIKI_TOPIC_SLUG?.trim() || "adsmcp";
}

function aikiSyncIntervalHours(): number {
  loadEnv();
  const value = Number(process.env.ADS_AIKI_SYNC_INTERVAL_HOURS || 24);
  return Number.isFinite(value) && value >= 1 && value <= 24 * 30 ? value : 24;
}

export function aikiAdsMcpSource(): AikiAdsMcpSource {
  const nodeUrl = aikiNodeUrl();
  const topicSlug = aikiTopicSlug();
  return {
    nodeUrl,
    mcpUrl: `${nodeUrl}/mcp`,
    topicSlug,
    topicUrl: `${nodeUrl}/${topicSlug}`,
    topicPath: `/${topicSlug}`,
    searchTag: topicSlug,
    trust: "community-unverified",
  };
}

export function aikiStatus() {
  const source = aikiAdsMcpSource();
  return {
    configured: true,
    ...source,
    mode: "agent-configured-read",
    auth: "agent-key-required",
    consumer: "dstore",
    handoff: "dStore periodically reads the AIKI topic, verifies each proposal, and only then adds a community source and verification metadata to a dStore card.",
    submission: "When a user wants to add a channel or advertising information, first check the AIKI topic for duplicates and read its rules, then publish one structured reply through the separate AIKI MCP. A new reply stays community-unverified until dStore verifies it.",
    note: "AdsMCP does not treat AIKI proposals as verified inventory. Configure the AIKI MCP in the same agent session or in the dStore verification worker.",
  };
}

export function aikiSetupGuide(): AikiSetupGuide {
  const source = aikiAdsMcpSource();
  return {
    ...source,
    mode: "agent-configured-read",
    auth: "agent-key-required",
    mcpConfig: {
      mcpServers: {
        aiki: {
          url: source.mcpUrl,
          headers: { Authorization: "Bearer <agent-key>" },
        },
      },
    },
    workflow: {
      intervalHours: aikiSyncIntervalHours(),
      search: [
        "For a request to find advertising channels, call ads_dstore_search first; its results are the verified dStore inventory.",
        `Open the AIKI MCP at ${source.mcpUrl}.`,
        `Search published discussions with tag ${source.searchTag} and read ${source.topicPath}.`,
        "Read every new reply and extract only explicit platform or service offers.",
        "Keep the AIKI URL, author, proposal text and observed timestamp with each candidate.",
      ],
      handoff: [
        "Create a pending-verification item in dStore; do not publish it as available inventory.",
        "Verify ownership, audience, language, geography, formats, pricing and contact details with the proposer.",
        "After verification, add the AIKI source URL, checked_at and verification status to the dStore card.",
        "If the proposal is withdrawn or stale, keep the source history and return the card to observed or unverified.",
      ],
      submit: [
        `Before publishing, use aiki_search_articles and aiki_get_article on ${source.topicUrl}; normalize resource URLs, channel usernames, titles and source URLs to detect duplicates.`,
        "Use aiki_status for the current AIKI page rules and formatting requirements; reject missing sources, private data, spam and offers without clear advertising terms.",
        `After the checks pass and the user has clearly approved the external post, publish one concise reply to ${source.topicUrl} with the resource URL, audience, formats, pricing, availability, source links and contact details using aiki_create_reply in the separate AIKI MCP.`,
        "Do not write directly to the dStore catalog. Keep the AIKI reply as a community-unverified proposal until dStore verifies ownership and the advertising offer.",
      ],
    },
  };
}
