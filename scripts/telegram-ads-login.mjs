/**
 * Open one persistent Chrome profile for Telegram Ads, wait for the human
 * login, and save only the ads.telegram.org session cookies into the shared
 * ADS_MCP_DATA/secrets directory. Cookie values are never printed.
 *
 * The script reuses an existing puppeteer-core installation (set
 * ADS_PUPPETEER_PACKAGE_JSON in .env to the package.json of a project that has
 * it, or install puppeteer-core here); AdsMCP does not download a second
 * browser or ask for credentials in chat.
 */
import { createRequire } from "node:module";
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, isAbsolute, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { config as loadDotenv } from "dotenv";

const HERE = dirname(fileURLToPath(import.meta.url));
const ROOT = join(HERE, "..");
const ENV_FILE = join(ROOT, ".env");
if (existsSync(ENV_FILE)) loadDotenv({ path: ENV_FILE, quiet: true });
const configuredData = process.env.ADS_MCP_DATA?.trim();
const DATA_ROOT = configuredData
  ? (isAbsolute(configuredData) ? resolve(configuredData) : resolve(ROOT, configuredData))
  : join(ROOT, "data");
const PROFILE_DIR = join(DATA_ROOT, "browser-profiles", "telegram-ads");
const SESSION_ENV_FILE = join(DATA_ROOT, "secrets", "telegram-ads-session.env");

function loadPuppeteer() {
  const requires = [];
  const configured = process.env.ADS_PUPPETEER_PACKAGE_JSON?.trim();
  if (configured) requires.push(createRequire(resolve(ROOT, configured)));
  requires.push(createRequire(import.meta.url));
  for (const requireFrom of requires) {
    for (const name of ["puppeteer-core", "puppeteer"]) {
      try {
        return requireFrom(name);
      } catch {
        // try the next candidate
      }
    }
  }
  throw new Error(
    "puppeteer-core not found. Set ADS_PUPPETEER_PACKAGE_JSON in .env to the package.json of a project " +
      "that has puppeteer-core installed, or run `npm install --no-save puppeteer-core` here.",
  );
}

const CHROME_CANDIDATES = [
  process.env.CHROME_PATH,
  "C:/Program Files/Google/Chrome/Application/chrome.exe",
  "C:/Program Files (x86)/Google/Chrome/Application/chrome.exe",
  process.env.LOCALAPPDATA && join(process.env.LOCALAPPDATA, "Google/Chrome/Application/chrome.exe"),
  "C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe",
  "C:/Program Files/Microsoft/Edge/Application/msedge.exe",
].filter(Boolean);

const executablePath = CHROME_CANDIDATES.find((path) => existsSync(path));
if (!executablePath) {
  throw new Error("Chrome/Edge not found. Set CHROME_PATH to a browser executable.");
}

const puppeteer = loadPuppeteer();
if (!existsSync(PROFILE_DIR)) mkdirSync(PROFILE_DIR, { recursive: true });

const browser = await puppeteer.launch({
  executablePath,
  headless: false,
  userDataDir: PROFILE_DIR,
  defaultViewport: null,
  args: [
    "--start-maximized",
    "--disable-blink-features=AutomationControlled",
    "--disable-gpu",
    "--disable-crash-reporter",
    "--no-sandbox",
  ],
});

const page = (await browser.pages())[0] || (await browser.newPage());
await page.goto("https://ads.telegram.org/", { waitUntil: "domcontentloaded" });

console.log("Telegram Ads Chrome opened.");
console.log("Log in only in the opened browser window; credentials are not read by AdsMCP.");
console.log("Waiting for stel_token and stel_ssid on ads.telegram.org (up to 10 minutes)…");

const client = await page.createCDPSession();
const deadline = Date.now() + 10 * 60 * 1000;
let sessionCookies = [];

while (Date.now() < deadline) {
  const result = await client.send("Network.getAllCookies");
  sessionCookies = result.cookies.filter(
    (cookie) =>
      /(^|\.)ads\.telegram\.org$/i.test(cookie.domain.replace(/^\./, "")) &&
      ["stel_token", "stel_ssid", "stel_adowner"].includes(cookie.name) &&
      cookie.value,
  );
  const names = new Set(sessionCookies.map((cookie) => cookie.name));
  if (names.has("stel_token") && names.has("stel_ssid")) break;
  await new Promise((resolve) => setTimeout(resolve, 5000));
}

const byName = new Map(sessionCookies.map((cookie) => [cookie.name, cookie.value]));
if (!byName.has("stel_token") || !byName.has("stel_ssid")) {
  console.error("Telegram Ads login was not detected. The browser is left open; run this script again after login.");
  browser.disconnect();
  process.exit(1);
}

let envText = existsSync(SESSION_ENV_FILE) ? readFileSync(SESSION_ENV_FILE, "utf8") : "";
const values = {
  ADS_TELEGRAM_STEL_TOKEN: byName.get("stel_token"),
  ADS_TELEGRAM_STEL_SSID: byName.get("stel_ssid"),
  ADS_TELEGRAM_STEL_ADOWNER: byName.get("stel_adowner") || "",
};

for (const [key, value] of Object.entries(values)) {
  const line = `${key}=${value}`;
  const pattern = new RegExp(`^\\s*${key}\\s*=.*$`, "m");
  envText = pattern.test(envText) ? envText.replace(pattern, line) : `${envText.trimEnd()}\n${line}\n`;
}
mkdirSync(join(DATA_ROOT, "secrets"), { recursive: true });
writeFileSync(SESSION_ENV_FILE, envText.trimStart(), "utf8");

console.log(`Saved Telegram Ads session locally to ${SESSION_ENV_FILE} (${sessionCookies.length} relevant cookies).`);
await browser.close();
