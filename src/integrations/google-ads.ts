import { createSign } from "node:crypto";
import { readFile } from "node:fs/promises";
import { loadEnv } from "../env.js";

const GOOGLE_SCOPE = "https://www.googleapis.com/auth/adwords";
const TOKEN_URL = "https://oauth2.googleapis.com/token";
const DEFAULT_API_VERSION = "v22";

type ServiceAccount = {
  client_email?: string;
  private_key?: string;
};

export interface GoogleAdsDay {
  date: string;
  campaignId?: string;
  campaignName?: string;
  campaignStatus?: string;
  cost: number;
  clicks: number;
  impressions: number;
  conversions: number;
  allConversions: number;
  conversionsValue: number;
  averageCpc: number;
}

export interface GoogleAdsReport {
  customerId: string;
  loginCustomerId?: string;
  accountName?: string;
  currency?: string;
  timeZone?: string;
  from: string;
  to: string;
  days: GoogleAdsDay[];
  totals: {
    cost: number;
    clicks: number;
    impressions: number;
    conversions: number;
    allConversions: number;
    costPerConversion: number | null;
  };
}

function digitsOnly(value: string | undefined): string {
  return String(value || "").replace(/\D/g, "");
}

function base64Url(value: string): string {
  return Buffer.from(value).toString("base64").replace(/=/g, "").replace(/\+/g, "-").replace(/\//g, "_");
}

function numberValue(value: unknown): number {
  const parsed = Number(value || 0);
  return Number.isFinite(parsed) ? parsed : 0;
}

function field(input: Record<string, unknown> | undefined, camel: string, snake: string): unknown {
  return input?.[camel] ?? input?.[snake];
}

function moneyFromMicros(value: unknown): number {
  return Number((numberValue(value) / 1_000_000).toFixed(2));
}

async function accessToken(keyPath: string): Promise<string> {
  const raw = await readFile(keyPath, "utf8");
  const serviceAccount = JSON.parse(raw) as ServiceAccount;
  if (!serviceAccount.client_email || !serviceAccount.private_key) {
    throw new Error("Google Ads service account JSON must contain client_email and private_key");
  }

  const now = Math.floor(Date.now() / 1000);
  const header = base64Url(JSON.stringify({ alg: "RS256", typ: "JWT" }));
  const claim = base64Url(
    JSON.stringify({
      iss: serviceAccount.client_email,
      scope: GOOGLE_SCOPE,
      aud: TOKEN_URL,
      iat: now,
      exp: now + 3600,
    }),
  );
  const signer = createSign("RSA-SHA256");
  signer.update(`${header}.${claim}`);
  const signature = signer.sign(serviceAccount.private_key, "base64")
    .replace(/=/g, "")
    .replace(/\+/g, "-")
    .replace(/\//g, "_");
  const response = await fetch(TOKEN_URL, {
    method: "POST",
    headers: { "content-type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      grant_type: "urn:ietf:params:oauth:grant-type:jwt-bearer",
      assertion: `${header}.${claim}.${signature}`,
    }),
  });
  const payload = (await response.json()) as { access_token?: string; error?: string; error_description?: string };
  if (!response.ok || !payload.access_token) {
    throw new Error(`Google OAuth failed: ${payload.error_description || payload.error || `HTTP ${response.status}`}`);
  }
  return payload.access_token;
}

async function searchStream(input: {
  accessToken: string;
  developerToken: string;
  loginCustomerId?: string;
  customerId: string;
  apiVersion: string;
  query: string;
}): Promise<Array<Record<string, unknown>>> {
  const headers: Record<string, string> = {
    authorization: `Bearer ${input.accessToken}`,
    "developer-token": input.developerToken,
    "content-type": "application/json",
  };
  if (input.loginCustomerId) headers["login-customer-id"] = input.loginCustomerId;
  const response = await fetch(
    `https://googleads.googleapis.com/${input.apiVersion}/customers/${input.customerId}/googleAds:searchStream`,
    { method: "POST", headers, body: JSON.stringify({ query: input.query }) },
  );
  const text = await response.text();
  let payload: unknown;
  try {
    payload = JSON.parse(text);
  } catch {
    throw new Error(`Google Ads returned non-JSON HTTP ${response.status}: ${text.slice(0, 400)}`);
  }
  if (!response.ok) throw new Error(`Google Ads HTTP ${response.status}: ${JSON.stringify(payload).slice(0, 1200)}`);

  const rows: Array<Record<string, unknown>> = [];
  for (const batch of Array.isArray(payload) ? payload : [payload]) {
    const item = batch as { error?: unknown; results?: Array<Record<string, unknown>> };
    if (item.error) throw new Error(`Google Ads query failed: ${JSON.stringify(item.error).slice(0, 1200)}`);
    rows.push(...(item.results || []));
  }
  return rows;
}

export async function pullGoogleAdsReport(input: {
  from: string;
  to: string;
  customerId?: string;
  loginCustomerId?: string;
}): Promise<GoogleAdsReport> {
  loadEnv();
  const customerId = digitsOnly(input.customerId || process.env.ADS_GOOGLE_ADS_CUSTOMER_ID);
  const loginCustomerId = digitsOnly(input.loginCustomerId || process.env.ADS_GOOGLE_ADS_LOGIN_CUSTOMER_ID) || undefined;
  const developerToken = process.env.ADS_GOOGLE_ADS_DEVELOPER_TOKEN?.trim();
  const keyPath = process.env.ADS_GOOGLE_ADS_JSON_KEY_FILE_PATH?.trim();
  const apiVersion = process.env.ADS_GOOGLE_ADS_API_VERSION?.trim() || DEFAULT_API_VERSION;
  if (!customerId || !developerToken || !keyPath) {
    throw new Error("Google Ads requires ADS_GOOGLE_ADS_CUSTOMER_ID, ADS_GOOGLE_ADS_DEVELOPER_TOKEN and ADS_GOOGLE_ADS_JSON_KEY_FILE_PATH");
  }

  const token = await accessToken(keyPath);
  const request = { accessToken: token, developerToken, loginCustomerId, customerId, apiVersion };
  const customerRows = await searchStream({
    ...request,
    query: "SELECT customer.id, customer.descriptive_name, customer.currency_code, customer.time_zone FROM customer LIMIT 1",
  });
  const customer = customerRows[0]?.customer as Record<string, unknown> | undefined;
  const rows = await searchStream({
    ...request,
    query: `
      SELECT segments.date, campaign.id, campaign.name, campaign.status,
             metrics.cost_micros, metrics.clicks, metrics.impressions,
             metrics.conversions, metrics.all_conversions,
             metrics.conversions_value, metrics.average_cpc
      FROM campaign
      WHERE segments.date BETWEEN '${input.from}' AND '${input.to}'
      ORDER BY segments.date`,
  });

  const days = rows.map((row) => {
    const metrics = row.metrics as Record<string, unknown> | undefined;
    const campaign = row.campaign as Record<string, unknown> | undefined;
    const segments = row.segments as Record<string, unknown> | undefined;
    return {
      date: String(segments?.date || ""),
      ...(campaign?.id ? { campaignId: String(campaign.id) } : {}),
      ...(campaign?.name ? { campaignName: String(campaign.name) } : {}),
      ...(campaign?.status ? { campaignStatus: String(campaign.status) } : {}),
      cost: moneyFromMicros(field(metrics, "costMicros", "cost_micros")),
      clicks: numberValue(metrics?.clicks),
      impressions: numberValue(metrics?.impressions),
      conversions: numberValue(metrics?.conversions),
      allConversions: numberValue(field(metrics, "allConversions", "all_conversions")),
      conversionsValue: numberValue(field(metrics, "conversionsValue", "conversions_value")),
      averageCpc: moneyFromMicros(field(metrics, "averageCpc", "average_cpc")),
    } satisfies GoogleAdsDay;
  });
  const totals = days.reduce(
    (acc, day) => {
      acc.cost += day.cost;
      acc.clicks += day.clicks;
      acc.impressions += day.impressions;
      acc.conversions += day.conversions;
      acc.allConversions += day.allConversions;
      return acc;
    },
    { cost: 0, clicks: 0, impressions: 0, conversions: 0, allConversions: 0 },
  );
  totals.cost = Number(totals.cost.toFixed(2));
  totals.conversions = Number(totals.conversions.toFixed(2));
  totals.allConversions = Number(totals.allConversions.toFixed(2));
  return {
    customerId,
    ...(loginCustomerId ? { loginCustomerId } : {}),
    ...(customer?.descriptiveName || customer?.descriptive_name
      ? { accountName: String(customer.descriptiveName || customer.descriptive_name) }
      : {}),
    ...(customer?.currencyCode || customer?.currency_code
      ? { currency: String(customer.currencyCode || customer.currency_code) }
      : {}),
    ...(customer?.timeZone || customer?.time_zone
      ? { timeZone: String(customer.timeZone || customer.time_zone) }
      : {}),
    from: input.from,
    to: input.to,
    days,
    totals: {
      ...totals,
      costPerConversion: totals.conversions > 0 ? Number((totals.cost / totals.conversions).toFixed(4)) : null,
    },
  };
}
