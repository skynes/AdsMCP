import { loadEnv } from "../env.js";

export interface NetworkPlatform {
  id: string;
  provider: string;
  name: string;
  url?: string;
  region?: string;
  kind?: string;
  capabilities: string[];
  status: string;
  reportedAt: string;
  updatedAt: string;
}

export interface NetworkPlacement {
  id: string;
  publisherRef: string;
  name: string;
  channelType: string;
  url?: string;
  description?: string;
  regions: string[];
  formats: string[];
  audience?: Record<string, unknown>;
  pricing: Record<string, unknown>;
  availability?: string;
  verificationStatus: string;
  createdAt: string;
  updatedAt: string;
}

export function networkUrl(): string | undefined {
  loadEnv();
  return process.env.ADS_NETWORK_URL?.trim().replace(/\/$/, "") || undefined;
}

export function networkConfigured(): boolean {
  return Boolean(networkUrl());
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const base = networkUrl();
  if (!base) throw new Error("ADS_NETWORK_URL is not configured");
  loadEnv();
  const headers = new Headers(init?.headers);
  headers.set("accept", "application/json");
  if (init?.body) headers.set("content-type", "application/json");
  const token = process.env.ADS_NETWORK_WRITE_TOKEN?.trim();
  if (token) headers.set("x-ads-network-token", token);
  const response = await fetch(`${base}${path}`, {
    ...init,
    headers,
    signal: AbortSignal.timeout(10_000),
  });
  const payload = (await response.json().catch(() => ({}))) as T & { error?: string };
  if (!response.ok) throw new Error(payload.error || `Ads Network returned HTTP ${response.status}`);
  return payload;
}

export function networkStatus(): Promise<unknown> {
  return request("/v1/status");
}

export async function networkListPlatforms(input?: { region?: string; status?: string }): Promise<{ platforms: NetworkPlatform[] }> {
  const query = new URLSearchParams();
  if (input?.region) query.set("region", input.region);
  if (input?.status) query.set("status", input.status);
  return request(`/v1/platforms${query.size ? `?${query}` : ""}`);
}

export function networkReportPlatform(payload: Record<string, unknown>): Promise<unknown> {
  return request("/v1/platforms/report", { method: "POST", body: JSON.stringify(payload) });
}

export async function networkListProfiles(input?: { kind?: string; region?: string }): Promise<unknown> {
  const query = new URLSearchParams();
  if (input?.kind) query.set("kind", input.kind);
  if (input?.region) query.set("region", input.region);
  return request(`/v1/profiles${query.size ? `?${query}` : ""}`);
}

export function networkPublishProfile(payload: Record<string, unknown>): Promise<unknown> {
  return request("/v1/profiles", { method: "POST", body: JSON.stringify(payload) });
}

export async function networkListInventory(input?: { channel_type?: string; region?: string; status?: string }): Promise<{ inventory: NetworkPlacement[] }> {
  const query = new URLSearchParams();
  if (input?.channel_type) query.set("channel_type", input.channel_type);
  if (input?.region) query.set("region", input.region);
  if (input?.status) query.set("status", input.status);
  return request(`/v1/inventory${query.size ? `?${query}` : ""}`);
}

export function networkPublishPlacement(payload: Record<string, unknown>): Promise<unknown> {
  return request("/v1/inventory/placements", { method: "POST", body: JSON.stringify(payload) });
}

export function networkReportConversion(payload: Record<string, unknown>): Promise<unknown> {
  return request("/v1/conversions/report", { method: "POST", body: JSON.stringify(payload) });
}

export function networkPublishAggregate(payload: Record<string, unknown>): Promise<unknown> {
  return request("/v1/analytics/aggregate", { method: "POST", body: JSON.stringify(payload) });
}

export function networkSyncManifest(since?: string): Promise<unknown> {
  const query = since ? `?since=${encodeURIComponent(since)}` : "";
  return request(`/v1/sync/manifest${query}`);
}
