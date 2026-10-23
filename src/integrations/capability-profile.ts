/**
 * Capability labels for the integration registry.
 *
 * `capabilityTags` describes the surface currently exposed by AdsMCP.
 * `matrixCapabilityTags` describes the best verified provider/MCP path from
 * the research matrix. Keeping both prevents a read-only local allowlist from
 * being confused with a provider's broader API potential.
 */
export const CAPABILITY_TAGS = [
  "read",
  "write",
  "campaign_create",
  "account_create",
  "payment",
] as const;

export type CapabilityTag = (typeof CAPABILITY_TAGS)[number];

export type CapabilityTier =
  | "read_only"
  | "read_write"
  | "read_write_campaign_create"
  | "read_write_campaign_create_payment"
  | "write_only";

export interface CapabilityMatrixScores {
  a: number;
  b: number;
  c: number;
  d: number;
  total: number;
}

export interface CapabilityProfile {
  capabilityTags: CapabilityTag[];
  capabilityTier: CapabilityTier;
  matrixCapabilityTags: CapabilityTag[];
  matrixCapabilityTier: CapabilityTier;
  matrixScores?: CapabilityMatrixScores;
  matrixNote?: string;
}

const READ_ONLY: CapabilityProfile = {
  capabilityTags: ["read"],
  capabilityTier: "read_only",
  matrixCapabilityTags: ["read"],
  matrixCapabilityTier: "read_only",
};

const PROFILES: Record<string, CapabilityProfile> = {
  google_ads: {
    capabilityTags: ["read", "write"],
    capabilityTier: "read_write",
    matrixCapabilityTags: ["read", "write", "campaign_create"],
    matrixCapabilityTier: "read_write_campaign_create",
    matrixScores: { a: 0, b: 28, c: 5, d: 18, total: 56 },
  },
  yandex_direct: {
    capabilityTags: ["read", "write", "campaign_create"],
    capabilityTier: "read_write_campaign_create",
    matrixCapabilityTags: ["read", "write", "campaign_create"],
    matrixCapabilityTier: "read_write_campaign_create",
    matrixScores: { a: 0, b: 30, c: 5, d: 17, total: 57 },
  },
  meta_ads: {
    capabilityTags: ["read"],
    capabilityTier: "read_only",
    matrixCapabilityTags: ["read", "write", "campaign_create"],
    matrixCapabilityTier: "read_write_campaign_create",
    matrixScores: { a: 0, b: 28, c: 5, d: 15, total: 52 },
    matrixNote: "Provider/MCP potential; AdsMCP Graph runtime is not enabled.",
  },
  openai_ads: READ_ONLY,
  spotify_ads: READ_ONLY,
  x_ads: {
    capabilityTags: ["read"],
    capabilityTier: "read_only",
    matrixCapabilityTags: ["read", "write", "campaign_create"],
    matrixCapabilityTier: "read_write_campaign_create",
    matrixScores: { a: 0, b: 20, c: 5, d: 14, total: 39 },
    matrixNote: "Provider/MCP potential; the selected local module keeps writes disabled.",
  },
  telegram_ads: {
    capabilityTags: ["read", "write", "campaign_create"],
    capabilityTier: "read_write_campaign_create",
    matrixCapabilityTags: ["read", "write", "campaign_create", "account_create", "payment"],
    matrixCapabilityTier: "read_write_campaign_create_payment",
    matrixScores: { a: 5, b: 22, c: 12, d: 13, total: 52 },
    matrixNote: "Payment is partial in the matrix: TON funding and KYC still require an external flow.",
  },
  telegram_ads_official_api: {
    capabilityTags: ["read", "write", "campaign_create"],
    capabilityTier: "read_write_campaign_create",
    matrixCapabilityTags: ["read", "write", "campaign_create", "account_create", "payment"],
    matrixCapabilityTier: "read_write_campaign_create_payment",
    matrixScores: { a: 5, b: 22, c: 12, d: 13, total: 52 },
    matrixNote: "Payment is partial in the matrix: TON funding and KYC still require an external flow.",
  },
  telegram_account: {
    capabilityTags: ["read", "write"],
    capabilityTier: "read_write",
    matrixCapabilityTags: ["read", "write"],
    matrixCapabilityTier: "read_write",
  },
  discord: {
    capabilityTags: ["read", "write"],
    capabilityTier: "read_write",
    matrixCapabilityTags: ["read", "write"],
    matrixCapabilityTier: "read_write",
  },
  mastodon: {
    capabilityTags: ["read", "write"],
    capabilityTier: "read_write",
    matrixCapabilityTags: ["read", "write"],
    matrixCapabilityTier: "read_write",
  },
  bing_ads: {
    capabilityTags: ["read"],
    capabilityTier: "read_only",
    matrixCapabilityTags: ["read"],
    matrixCapabilityTier: "read_only",
    matrixScores: { a: 0, b: 0, c: 5, d: 15, total: 25 },
    matrixNote: "Official Microsoft Advertising pilot is read-only; aggregator write claims are not our selected runtime.",
  },
  vk_ads: {
    capabilityTags: ["read"],
    capabilityTier: "read_only",
    matrixCapabilityTags: ["read", "write", "campaign_create"],
    matrixCapabilityTier: "read_write_campaign_create",
    matrixScores: { a: 0, b: 24, c: 5, d: 14, total: 48 },
    matrixNote: "Click.ru broker is read-only; the matrix score refers to a separate direct MCP candidate.",
  },
  avito_ads: {
    capabilityTags: ["read"],
    capabilityTier: "read_only",
    matrixCapabilityTags: ["read", "write", "campaign_create"],
    matrixCapabilityTier: "read_write_campaign_create",
    matrixScores: { a: 0, b: 22, c: 5, d: 14, total: 41 },
    matrixNote: "The selected Avito API module keeps budget, bid, money-transfer and create tools outside the allowlist.",
  },
  apple_search_ads: {
    capabilityTags: ["read"],
    capabilityTier: "read_only",
    matrixCapabilityTags: ["read", "write", "campaign_create"],
    matrixCapabilityTier: "read_write_campaign_create",
    matrixScores: { a: 0, b: 24, c: 5, d: 14, total: 48 },
    matrixNote: "Provider candidates support preview/approve writes; the selected local allowlist is read-only.",
  },
  tiktok_ads: {
    capabilityTags: ["read"],
    capabilityTier: "read_only",
    matrixCapabilityTags: ["read", "write", "campaign_create"],
    matrixCapabilityTier: "read_write_campaign_create",
    matrixScores: { a: 0, b: 30, c: 5, d: 15, total: 55 },
    matrixNote: "Official/hosted TikTok paths can write; the selected local package is fail-closed read-only.",
  },
  reddit_ads: {
    capabilityTags: ["read"],
    capabilityTier: "read_only",
    matrixCapabilityTags: ["read", "write", "campaign_create"],
    matrixCapabilityTier: "read_write_campaign_create",
    matrixScores: { a: 0, b: 22, c: 5, d: 16, total: 48 },
    matrixNote: "Community candidates expose CRUD; the selected Reddit module keeps management and creative tools disabled.",
  },
  email: {
    capabilityTags: ["read", "write"],
    capabilityTier: "read_write",
    matrixCapabilityTags: ["read", "write"],
    matrixCapabilityTier: "read_write",
    matrixNote: "IMAP reads and SMTP sends are enabled; destructive mailbox management, bulk actions and scheduling stay outside the selected allowlist.",
  },
  crm: {
    capabilityTags: ["read", "write"],
    capabilityTier: "read_write",
    matrixCapabilityTags: ["read", "write"],
    matrixCapabilityTier: "read_write",
  },
  webhook: {
    capabilityTags: ["write"],
    capabilityTier: "write_only",
    matrixCapabilityTags: ["write"],
    matrixCapabilityTier: "write_only",
  },
};

export function getCapabilityProfile(provider: string): CapabilityProfile {
  const profile = PROFILES[provider.trim().toLowerCase()] || READ_ONLY;
  return {
    ...profile,
    capabilityTags: [...profile.capabilityTags],
    matrixCapabilityTags: [...profile.matrixCapabilityTags],
    ...(profile.matrixScores ? { matrixScores: { ...profile.matrixScores } } : {}),
  };
}
