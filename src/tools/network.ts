import {
  networkConfigured,
  networkListInventory,
  networkListPlatforms,
  networkListProfiles,
  networkPublishAggregate,
  networkPublishPlacement,
  networkPublishProfile,
  networkReportConversion,
  networkReportPlatform,
  networkStatus,
  networkSyncManifest,
  networkUrl,
} from "../network/client.js";

export async function runNetworkStatus() {
  if (!networkConfigured()) return { configured: false, url: null, hint: "Set ADS_NETWORK_URL to enable the optional relay." };
  return { configured: true, url: networkUrl(), remote: await networkStatus() };
}

export function runNetworkPlatformList(args: { region?: string; status?: string }) {
  return networkListPlatforms(args);
}

export function runNetworkPlatformReport(args: {
  provider: string;
  name: string;
  url?: string;
  region?: string;
  kind?: string;
  capabilities?: string[];
  notes?: string;
}) {
  return networkReportPlatform(args);
}

export function runNetworkProfilePublish(args: {
  id?: string;
  display_name: string;
  kind: string;
  regions?: string[];
  capabilities?: string[];
  contact_relay?: string;
}) {
  return networkPublishProfile(args);
}

export function runNetworkProfileList(args: { kind?: string; region?: string }) {
  return networkListProfiles(args);
}

export function runNetworkPlacementPublish(args: {
  id?: string;
  publisher_ref: string;
  name: string;
  channel_type: string;
  url?: string;
  description?: string;
  regions?: string[];
  formats?: string[];
  audience?: Record<string, unknown>;
  pricing: Record<string, unknown>;
  availability?: string;
}) {
  return networkPublishPlacement(args);
}

export function runNetworkInventoryList(args: { channel_type?: string; region?: string; status?: string }) {
  return networkListInventory(args);
}

export function runNetworkConversionReport(args: {
  dedupe_key: string;
  node_ref: string;
  campaign_ref: string;
  period: string;
  event_type: string;
  count?: number;
  value?: number;
  currency?: string;
}) {
  return networkReportConversion(args);
}

export function runNetworkAggregatePublish(args: {
  dedupe_key: string;
  node_ref: string;
  scope_ref: string;
  period_from: string;
  period_to: string;
  impressions?: number;
  clicks?: number;
  conversions?: number;
  spend?: number;
  revenue?: number;
  currency?: string;
}) {
  return networkPublishAggregate(args);
}

export function runNetworkSyncManifest(args: { since?: string }) {
  return networkSyncManifest(args.since);
}
