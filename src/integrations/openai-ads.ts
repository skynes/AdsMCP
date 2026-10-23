import { loadEnv } from "../env.js";

export const OPENAI_ADS_DEFAULT_BASE_URL = "https://api.ads.openai.com/v1";

export type OpenAIAdsQueryValue = string | number | boolean | readonly (string | number | boolean)[] | undefined;

export interface OpenAIAdsRequestOptions {
  path: string;
  query?: Record<string, OpenAIAdsQueryValue>;
}

function apiKey(): string {
  loadEnv();
  const value = process.env.OPENAI_ADS_API_KEY?.trim();
  if (!value) throw new Error("OPENAI_ADS_API_KEY is not configured");
  return value;
}

function baseUrl(): string {
  loadEnv();
  return (process.env.OPENAI_ADS_BASE_URL?.trim() || OPENAI_ADS_DEFAULT_BASE_URL).replace(/\/+$/, "");
}

function requestUrl({ path, query }: OpenAIAdsRequestOptions): URL {
  if (!path.startsWith("/") || path.includes("://") || path.includes("?")) {
    throw new Error("OpenAI Ads API path must be an internal path without a query string");
  }
  const url = new URL(`${baseUrl()}${path}`);
  for (const [key, value] of Object.entries(query || {})) {
    if (value === undefined) continue;
    if (Array.isArray(value)) {
      for (const item of value) url.searchParams.append(key, String(item));
    } else {
      url.searchParams.set(key, String(value));
    }
  }
  return url;
}

function responseBody(text: string): unknown {
  if (!text.trim()) return null;
  try {
    return JSON.parse(text) as unknown;
  } catch {
    return text;
  }
}

function errorDetail(body: unknown): string {
  const text = typeof body === "string" ? body : JSON.stringify(body);
  return text.length > 1200 ? `${text.slice(0, 1200)}…` : text;
}

/**
 * Read-only client for the official OpenAI Ads Advertiser API.
 * The public bridge intentionally has no generic mutation method.
 */
export async function openaiAdsGet<T = unknown>(options: OpenAIAdsRequestOptions): Promise<T> {
  const response = await fetch(requestUrl(options), {
    method: "GET",
    headers: {
      Accept: "application/json",
      Authorization: `Bearer ${apiKey()}`,
    },
    cache: "no-store",
  });
  const body = responseBody(await response.text());
  if (!response.ok) {
    throw new Error(`OpenAI Ads API request failed (${response.status}): ${errorDetail(body)}`);
  }
  return body as T;
}
