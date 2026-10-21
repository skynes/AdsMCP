import { createSign } from "node:crypto";
import { readFile } from "node:fs/promises";
import { existsSync } from "node:fs";
import { basename, extname, isAbsolute, resolve } from "node:path";
import { loadEnv } from "../env.js";

const GOOGLE_SCOPE = "https://www.googleapis.com/auth/adwords";
const TOKEN_URL = "https://oauth2.googleapis.com/token";
const DEFAULT_API_VERSION = "v22";
const REPLACEABLE_FIELD_TYPES = new Set(["MARKETING_IMAGE", "PORTRAIT_MARKETING_IMAGE"]);

type ServiceAccount = {
  client_email?: string;
  private_key?: string;
};

type CreativeInput = {
  file_path: string;
  field_type: "MARKETING_IMAGE" | "PORTRAIT_MARKETING_IMAGE";
  label?: string;
};

type AssetGroupAssetRow = {
  resourceName: string;
  asset: string;
  fieldType: string;
  status: string;
};

function digitsOnly(value: string | undefined): string {
  return String(value || "").replace(/\D/g, "");
}

function base64Url(value: string): string {
  return Buffer.from(value).toString("base64").replace(/=/g, "").replace(/\+/g, "-").replace(/\//g, "_");
}

function resolveLocalPath(value: string): string {
  return isAbsolute(value) ? value : resolve(process.cwd(), value);
}

function imageMimeType(filePath: string): string {
  const extension = extname(filePath).toLowerCase();
  if (extension === ".jpg" || extension === ".jpeg") return "image/jpeg";
  if (extension === ".png") return "image/png";
  if (extension === ".gif") return "image/gif";
  throw new Error(`Unsupported image format: ${extension || "unknown"}. Use PNG, JPEG or GIF.`);
}

async function accessToken(keyPath: string): Promise<string> {
  const raw = await readFile(resolveLocalPath(keyPath), "utf8");
  const serviceAccount = JSON.parse(raw) as ServiceAccount;
  if (!serviceAccount.client_email || !serviceAccount.private_key) {
    throw new Error("Google Ads service account JSON must contain client_email and private_key");
  }

  const now = Math.floor(Date.now() / 1000);
  const header = base64Url(JSON.stringify({ alg: "RS256", typ: "JWT" }));
  const claim = base64Url(JSON.stringify({
    iss: serviceAccount.client_email,
    scope: GOOGLE_SCOPE,
    aud: TOKEN_URL,
    iat: now,
    exp: now + 3600,
  }));
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

async function googleAdsRequest(input: {
  accessToken: string;
  developerToken: string;
  loginCustomerId?: string;
  customerId: string;
  apiVersion: string;
  path: string;
  body: Record<string, unknown>;
}): Promise<Record<string, unknown>> {
  const headers: Record<string, string> = {
    authorization: `Bearer ${input.accessToken}`,
    "developer-token": input.developerToken,
    "content-type": "application/json",
  };
  if (input.loginCustomerId) headers["login-customer-id"] = input.loginCustomerId;
  const response = await fetch(
    `https://googleads.googleapis.com/${input.apiVersion}/customers/${input.customerId}/${input.path}`,
    { method: "POST", headers, body: JSON.stringify(input.body) },
  );
  const text = await response.text();
  let payload: Record<string, unknown>;
  try {
    payload = JSON.parse(text) as Record<string, unknown>;
  } catch {
    throw new Error(`Google Ads returned non-JSON HTTP ${response.status}: ${text.slice(0, 400)}`);
  }
  if (!response.ok) {
    throw new Error(`Google Ads HTTP ${response.status}: ${JSON.stringify(payload).slice(0, 1600)}`);
  }
  return payload;
}

async function searchAssetGroupAssets(input: {
  accessToken: string;
  developerToken: string;
  loginCustomerId?: string;
  customerId: string;
  apiVersion: string;
  assetGroupResourceName: string;
}): Promise<AssetGroupAssetRow[]> {
  const query = `
    SELECT asset_group_asset.resource_name, asset_group_asset.asset,
           asset_group_asset.field_type, asset_group_asset.status
    FROM asset_group_asset
    WHERE asset_group_asset.asset_group = '${input.assetGroupResourceName}'
      AND asset_group_asset.field_type IN ('MARKETING_IMAGE', 'PORTRAIT_MARKETING_IMAGE')
      AND asset_group_asset.status = 'ENABLED'`;
  const payload = await googleAdsRequest({
    ...input,
    path: "googleAds:searchStream",
    body: { query },
  });
  const rows: AssetGroupAssetRow[] = [];
  const batches = Array.isArray(payload) ? payload : [payload];
  for (const batch of batches) {
    const results = (batch as { results?: Array<Record<string, unknown>> }).results || [];
    for (const row of results) {
      const assetGroupAsset = (row.assetGroupAsset || row.asset_group_asset || {}) as Record<string, unknown>;
      rows.push({
        resourceName: String(assetGroupAsset.resourceName || assetGroupAsset.resource_name || ""),
        asset: String(assetGroupAsset.asset || ""),
        fieldType: String(assetGroupAsset.fieldType || assetGroupAsset.field_type || ""),
        status: String(assetGroupAsset.status || ""),
      });
    }
  }
  return rows.filter((row) => row.resourceName && row.asset && REPLACEABLE_FIELD_TYPES.has(row.fieldType));
}

function resultResourceNames(payload: Record<string, unknown>, key: string): string[] {
  const results = (payload.results || []) as Array<Record<string, unknown>>;
  return results
    .map((result) => String(result[key] || result.resourceName || result.resource_name || ""))
    .filter(Boolean);
}

export async function replaceGoogleAdsPmaxImages(input: {
  customer_id?: string;
  login_customer_id?: string;
  asset_group_id: string;
  assets: CreativeInput[];
  confirm?: boolean;
}) {
  loadEnv();
  const customerId = digitsOnly(input.customer_id || process.env.ADS_GOOGLE_ADS_CUSTOMER_ID);
  const loginCustomerId = digitsOnly(input.login_customer_id || process.env.ADS_GOOGLE_ADS_LOGIN_CUSTOMER_ID) || undefined;
  const developerToken = process.env.ADS_GOOGLE_ADS_DEVELOPER_TOKEN?.trim();
  const keyPath = process.env.ADS_GOOGLE_ADS_JSON_KEY_FILE_PATH?.trim();
  const apiVersion = process.env.ADS_GOOGLE_ADS_API_VERSION?.trim() || DEFAULT_API_VERSION;
  const assetGroupId = digitsOnly(input.asset_group_id);

  if (!customerId || !developerToken || !keyPath) {
    throw new Error("Google Ads requires customer ID, developer token and service-account JSON path");
  }
  if (!assetGroupId) throw new Error("asset_group_id must contain digits");
  if (!input.assets.length || input.assets.length > 10) throw new Error("assets must contain 1 to 10 images");

  const assets = input.assets.map((asset) => {
    const filePath = resolveLocalPath(asset.file_path);
    if (!existsSync(filePath)) throw new Error(`Creative file not found: ${filePath}`);
    imageMimeType(filePath);
    if (!REPLACEABLE_FIELD_TYPES.has(asset.field_type)) {
      throw new Error(`Unsupported asset field type: ${asset.field_type}`);
    }
    return { ...asset, filePath };
  });

  const assetGroupResourceName = `customers/${customerId}/assetGroups/${assetGroupId}`;
  const token = await accessToken(keyPath);
  const requestBase = {
    accessToken: token,
    developerToken,
    loginCustomerId,
    customerId,
    apiVersion,
  };
  const oldLinks = await searchAssetGroupAssets({ ...requestBase, assetGroupResourceName });
  const proposed = {
    customer_id: customerId,
    asset_group: assetGroupResourceName,
    add: assets.map((asset) => ({ field_type: asset.field_type, file_path: asset.filePath, label: asset.label || basename(asset.filePath) })),
    remove: oldLinks.map((link) => ({ field_type: link.fieldType, asset: link.asset, resource_name: link.resourceName })),
    preserved_fields: ["SQUARE_MARKETING_IMAGE", "LOGO", "HEADLINE", "DESCRIPTION", "LONG_HEADLINE", "BUSINESS_NAME"],
  };

  if (input.confirm !== true) {
    return { status: "confirmation_required", proposed, note: "No Google Ads changes were sent." };
  }

  const assetPayload = await googleAdsRequest({
    ...requestBase,
    path: "assets:mutate",
    body: {
      operations: await Promise.all(assets.map(async (asset) => ({
        create: {
          name: `Neron Google Ads ${asset.label || basename(asset.filePath)}`.slice(0, 255),
          imageAsset: { data: (await readFile(asset.filePath)).toString("base64") },
        },
      }))),
    },
  });
  const createdAssetNames = resultResourceNames(assetPayload, "asset");
  if (createdAssetNames.length !== assets.length) {
    throw new Error(`Google Ads created ${createdAssetNames.length} assets, expected ${assets.length}`);
  }

  const addPayload = await googleAdsRequest({
    ...requestBase,
    path: "assetGroupAssets:mutate",
    body: {
      operations: assets.map((asset, index) => ({
        create: {
          assetGroup: assetGroupResourceName,
          asset: createdAssetNames[index],
          fieldType: asset.field_type,
        },
      })),
    },
  });

  let removePayload: Record<string, unknown> | null = null;
  if (oldLinks.length) {
    removePayload = await googleAdsRequest({
      ...requestBase,
      path: "assetGroupAssets:mutate",
      body: { operations: oldLinks.map((link) => ({ remove: link.resourceName })) },
    });
  }

  const currentLinks = await searchAssetGroupAssets({ ...requestBase, assetGroupResourceName });
  return {
    status: "success",
    api_version: apiVersion,
    customer_id: customerId,
    asset_group: assetGroupResourceName,
    created_assets: createdAssetNames,
    added_links: resultResourceNames(addPayload, "assetGroupAsset"),
    removed_links: oldLinks.map((link) => link.resourceName),
    remaining_replaceable_assets: currentLinks.map((link) => ({ asset: link.asset, field_type: link.fieldType, status: link.status })),
    preserved_fields: proposed.preserved_fields,
    rollback_note: "The new image assets are retained in the account; to roll back, link the removed asset-group assets again and remove the new links.",
    remove_response_received: Boolean(removePayload),
  };
}
