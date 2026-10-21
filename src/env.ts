import { config } from "dotenv";
import { existsSync } from "node:fs";
import { dirname, isAbsolute, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
let loaded = false;

export function loadEnv(): void {
  if (loaded) return;
  const rootEnv = join(ROOT, ".env");
  // MCP stdio reserves stdout for protocol messages.
  if (existsSync(rootEnv)) config({ path: rootEnv, quiet: true });

  // Keep provider secrets in the ignored data directory. The legacy Google Ads
  // project stores its service-account configuration with GOOGLE_ADS_* names;
  // map those names into AdsMCP's canonical ADS_GOOGLE_ADS_* namespace without
  // ever logging the values.
  const configuredData = process.env.ADS_MCP_DATA?.trim();
  const dataRoot = configuredData
    ? (isAbsolute(configuredData) ? resolve(configuredData) : resolve(ROOT, configuredData))
    : join(ROOT, "data");
  const googleAdsEnv = join(dataRoot, "secrets", "google-ads.env");
  if (existsSync(googleAdsEnv)) config({ path: googleAdsEnv, quiet: true });

  const aliases: Record<string, string> = {
    ADS_GOOGLE_ADS_DEVELOPER_TOKEN: "GOOGLE_ADS_DEVELOPER_TOKEN",
    ADS_GOOGLE_ADS_CUSTOMER_ID: "GOOGLE_ADS_CUSTOMER_ID",
    ADS_GOOGLE_ADS_LOGIN_CUSTOMER_ID: "GOOGLE_ADS_LOGIN_CUSTOMER_ID",
    ADS_GOOGLE_ADS_JSON_KEY_FILE_PATH: "GOOGLE_ADS_JSON_KEY_FILE_PATH",
    ADS_GOOGLE_ADS_CLIENT_ID: "GOOGLE_ADS_CLIENT_ID",
    ADS_GOOGLE_ADS_CLIENT_SECRET: "GOOGLE_ADS_CLIENT_SECRET",
    ADS_GOOGLE_ADS_REFRESH_TOKEN: "GOOGLE_ADS_REFRESH_TOKEN",
  };
  for (const [canonical, legacy] of Object.entries(aliases)) {
    if (!process.env[canonical] && process.env[legacy]) process.env[canonical] = process.env[legacy];
  }

  loaded = true;
}

export function resolveDataDir(): string {
  loadEnv();
  const value = process.env.ADS_MCP_DATA?.trim();
  return value ? (isAbsolute(value) ? resolve(value) : resolve(ROOT, value)) : join(ROOT, "data");
}
