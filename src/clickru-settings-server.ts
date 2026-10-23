import { createServer, type IncomingMessage, type Server, type ServerResponse } from "node:http";
import { randomBytes } from "node:crypto";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { resolveSettingsLanguage, SETTINGS_LANGUAGE_COOKIE, type SettingsLanguage } from "./settings-language.js";
import { settingsMessages, settingsTranslator } from "./settings-translations.js";
import {
  clickruCampaignDraftsStatus,
  clickruProfilesStatus,
  clickruSettingsStatus,
  getClickruCampaignDrafts,
  getClickruProfiles,
  maskClickruInn,
  saveClickruCampaignDraft,
  saveClickruProfile,
  saveClickruToken,
  setActiveClickruCampaignDraft,
  setActiveClickruProfile,
  setClickruCampaignDraftStatus,
  type ClickruCampaignStatus,
  type ClickruProfileType,
} from "./clickru-settings.js";
import {
  createMicrosoftOAuthState,
  exchangeMicrosoftOAuthCode,
  getMicrosoftAdsProfile,
  microsoftAdsProfilesStatus,
  microsoftAuthorizationUrl,
  MICROSOFT_ADS_REDIRECT_URI,
  MICROSOFT_ADS_SCOPE,
  saveMicrosoftAdsProfile,
  setActiveMicrosoftAdsProfile,
} from "./microsoft-ads-settings.js";
import { runTelegramAccountAuth, runTelegramAccountStatus } from "./tools/telegram-account.js";
import {
  completeMastodonAuthorization,
  listMastodonAccounts,
  mastodonLocalRedirectUri,
  startMastodonAuthorization,
} from "./mastodon/client.js";
import {
  checkYandexDirectConnection,
  saveYandexDirectToken,
  yandexDirectAuthorizationUrl,
  yandexDirectSettingsStatus,
} from "./yandex-direct-settings.js";
import { listModuleTools } from "./integrations/mcp-modules.js";
import { moduleDashboardCredentialKeys, moduleDashboardStatus } from "./integrations/module-status.js";
import { saveModuleSecrets } from "./integrations/module-secrets.js";

const HOST = "127.0.0.1";
const DEFAULT_PORT = 8790;
const MAX_BODY = 16_000;
const csrfToken = randomBytes(24).toString("hex");
const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const BRAND_LOGO_DATA_URI = `data:image/png;base64,${readFileSync(join(ROOT, "branding", "logo.png")).toString("base64")}`;
const microsoftOAuthStates = new Map<string, { profileId: string; clientId: string; codeVerifier: string; createdAt: number }>();
let runningServer: Server | undefined;
let runningUrl: string | undefined;

const PAGE = (nonce: string, language: SettingsLanguage, selection: SettingsLanguage | "auto") => {
  const t = settingsTranslator(language);
  return `<!doctype html>
<html lang="${language}">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width,initial-scale=1">
    <title>${t("AdsMCP · Local dashboard")}</title>
  <style>
    :root { color-scheme: dark; font-family: ui-sans-serif, system-ui, sans-serif; }
    body { margin: 0; min-height: 100vh; background: #0b1120; color: #e5e7eb; }
    main { box-sizing: border-box; width: min(94vw, 1080px); margin: 32px auto; padding: 28px; border: 1px solid #273449; border-radius: 22px; background: #111a2c; box-shadow: 0 24px 80px #0006; }
    h1 { margin: 0; font-size: 28px; letter-spacing: -0.02em; }
    h2 { margin: 0 0 8px; font-size: 21px; letter-spacing: -0.01em; }
    h3 { margin: 0 0 8px; font-size: 16px; }
    p { color: #9ca3af; line-height: 1.5; }
    label { display: block; margin: 24px 0 8px; font-size: 14px; color: #d1d5db; }
    input, select, textarea { box-sizing: border-box; width: 100%; padding: 12px 14px; border: 1px solid #4b5563; border-radius: 10px; background: #111827; color: #f9fafb; font: inherit; }
    textarea { min-height: 96px; resize: vertical; }
    button, .button-link { display: inline-block; margin-top: 16px; padding: 11px 16px; border: 0; border-radius: 10px; background: #60a5fa; color: #0f172a; font: inherit; font-weight: 700; cursor: pointer; text-decoration: none; }
    .button-link.secondary { background: #263852; color: #dbeafe; }
    button:disabled { cursor: wait; opacity: .6; }
    #status, #profileStatus, #microsoftStatus { min-height: 24px; margin-top: 18px; color: #93c5fd; }
    .grid { display: grid; grid-template-columns: 1fr 1fr; gap: 0 12px; }
    .grid label { margin-top: 18px; }
    .wide { grid-column: 1 / -1; }
    .hint { font-size: 13px; }
    .topbar { display: flex; align-items: center; justify-content: space-between; gap: 20px; margin-bottom: 24px; }
    .brand { display: flex; align-items: center; gap: 12px; }
    .brand-mark { display: block; width: 38px; height: 38px; padding: 2px; box-sizing: border-box; border-radius: 12px; background: #fff; object-fit: contain; }
    .subtitle { margin: 4px 0 0; font-size: 13px; }
    .nav { display: flex; flex-wrap: wrap; gap: 6px; padding: 6px; border: 1px solid #273449; border-radius: 14px; background: #0d1627; }
    .nav a { padding: 9px 12px; border-radius: 9px; color: #9ca3af; text-decoration: none; font-size: 14px; }
    .nav a:hover, .nav a.active { background: #263852; color: #f9fafb; }
    .topbar-controls { display: flex; flex-wrap: wrap; align-items: center; gap: 12px; }
    .language-control label { margin: 0 0 4px; font-size: 12px; }
    .language-control select { width: auto; min-width: 130px; padding: 8px 10px; font-size: 14px; }
    .page-section { display: none; }
    .page-section.active { display: block; }
    .section-head { display: flex; align-items: end; justify-content: space-between; gap: 16px; margin: 8px 0 20px; }
    .section-head p { margin: 4px 0 0; }
    .cards { display: grid; grid-template-columns: repeat(4, minmax(0, 1fr)); gap: 12px; margin: 22px 0; }
    .card, .panel { border: 1px solid #273449; border-radius: 16px; background: #162238; }
    .card { min-height: 108px; padding: 18px; }
    .card-label { color: #9ca3af; font-size: 13px; }
    .card-label.ok { color: #86efac; }
    .card-label.warn { color: #fcd34d; }
    .card-value { margin-top: 12px; font-size: 18px; font-weight: 750; }
    .card-value.ok { color: #86efac; }
    .card-value.warn { color: #fcd34d; }
    .panel { margin: 14px 0; padding: 20px; }
    .panel + .panel { margin-top: 16px; }
    .panel-head { display: flex; align-items: center; justify-content: space-between; gap: 12px; }
    .integration-group { padding: 0; overflow: hidden; }
    .integration-toggle { display: flex; align-items: center; justify-content: space-between; gap: 16px; width: 100%; margin: 0; padding: 20px; border: 0; border-radius: 16px; background: transparent; color: inherit; text-align: left; }
    .integration-toggle:hover, .integration-toggle:focus-visible { background: #1c2a43; }
    .integration-toggle .panel-head { flex: 1; min-width: 0; }
    .integration-title { font-size: 16px; font-weight: 700; }
    .integration-chevron { flex: 0 0 auto; color: #93c5fd; font-size: 24px; line-height: 1; transform: rotate(0deg); transition: transform .15s ease; }
    .integration-group.expanded .integration-chevron { transform: rotate(45deg); }
    .integration-body { padding: 0 20px 20px; }
    .actions { display: flex; flex-wrap: wrap; gap: 8px; }
    .actions button, .actions .button-link { margin-top: 0; }
    .status-line { min-height: 22px; margin-top: 14px; color: #93c5fd; }
    .table-wrap { overflow-x: auto; }
    .module-table { width: 100%; border-collapse: collapse; font-size: 13px; }
    .module-table th, .module-table td { padding: 10px 8px; border-bottom: 1px solid #273449; text-align: left; vertical-align: top; }
    .module-table th { color: #9ca3af; font-weight: 600; white-space: nowrap; }
    .module-table td code { white-space: nowrap; }
    .module-command { display: block; max-width: 360px; overflow-wrap: anywhere; color: #9ca3af; }
    .module-source { display: block; margin-top: 4px; color: #64748b; }
    .module-credential { display: block; margin-top: 5px; color: #9ca3af; font-size: 12px; }
    .module-credential.ok { color: #86efac; }
    .module-credential.missing { color: #fcd34d; }
    .module-check { margin-top: 0; padding: 7px 10px; font-size: 12px; }
    .module-credential-form { margin-top: 10px; }
    .module-credential-form label { margin-top: 14px; }
    .module-credential-form input { margin-bottom: 2px; }
    .module-hint { margin: 4px 0 0; color: #64748b; font-size: 12px; }
    .guide { margin: 16px 0; padding: 14px 16px; border-left: 3px solid #60a5fa; border-radius: 8px; background: #0d1627; color: #cbd5e1; font-size: 13px; line-height: 1.55; }
    .guide ol { margin: 8px 0 10px 20px; padding: 0; }
    .guide a { color: #93c5fd; }
    code { padding: 2px 5px; border-radius: 5px; background: #0b1120; color: #bfdbfe; font-size: 12px; }
    @media (max-width: 760px) { main { margin: 12px auto; padding: 18px; } .topbar { align-items: flex-start; flex-direction: column; } .cards { grid-template-columns: 1fr 1fr; } }
    @media (max-width: 520px) { .cards { grid-template-columns: 1fr; } .grid { grid-template-columns: 1fr; } .wide { grid-column: auto; } }
  </style>
</head>
<body>
  <main>
    <div class="topbar">
      <div class="brand">
        <img class="brand-mark" src="${BRAND_LOGO_DATA_URI}" alt="AdsMCP logo" width="38" height="38">
        <div><h1>AdsMCP</h1><p class="subtitle">${t("Local dashboard for advertising connections")}</p></div>
      </div>
      <div class="topbar-controls">
      <nav class="nav" aria-label="${t("Main navigation")}">
        <a href="#home" data-page="home" data-home-settings>${t("Home")}</a>
        <a href="#integrations" data-page="integrations">${t("Integrations")}</a>
        <a href="#modules" data-page="modules">${t("Modules")}</a>
        <a href="#profiles" data-page="profiles">${t("Profiles")}</a>
        <a href="#campaigns" data-page="campaigns">${t("Campaigns")}</a>
      </nav>
      <div class="language-control">
        <label for="settingsLanguage">${t("Language")}</label>
        <select id="settingsLanguage">
          <option value="auto"${selection === "auto" ? " selected" : ""}>${t("Browser language")}</option>
          <option value="en"${selection === "en" ? " selected" : ""}>English</option>
          <option value="ru"${selection === "ru" ? " selected" : ""}>Русский</option>
        </select>
      </div>
      </div>
    </div>

    <section id="home" class="page-section">
      <div class="section-head"><div><h2>${t("Home")}</h2><p>${t("Local connection status and quick access to your working data.")}</p></div></div>
      <div class="cards">
        <div class="card"><div class="card-label">Click.ru</div><div id="homeClickru" class="card-value">${t("Checking…")}</div></div>
        <div class="card"><div class="card-label">Yandex Direct</div><div id="homeYandex" class="card-value">${t("Checking…")}</div></div>
        <div class="card"><div class="card-label">Microsoft Advertising</div><div id="homeMicrosoft" class="card-value">${t("Checking…")}</div></div>
        <div class="card"><div class="card-label">Mastodon</div><div id="homeMastodon" class="card-value">${t("Checking…")}</div></div>
        <div class="card"><div class="card-label">${t("Profiles")}</div><div id="homeProfiles" class="card-value">${t("Checking…")}</div></div>
        <div class="card"><div class="card-label">${t("Campaigns")}</div><div id="homeCampaigns" class="card-value">${t("Checking…")}</div></div>
        <div class="card"><div class="card-label">${t("Modules")}</div><div id="homeModules" class="card-value">${t("Checking…")}</div></div>
      </div>
      <div class="panel">
        <h3>${t("Quick actions")}</h3>
        <p>${t("Set up a connection, select a profile or open a saved draft.")}</p>
        <div class="actions">
          <a class="button-link" href="#integrations">${t("Open integrations")}</a>
          <a class="button-link secondary" href="#profiles">${t("Open profiles")}</a>
          <a class="button-link secondary" href="#campaigns">${t("Open campaigns")}</a>
        </div>
      </div>
    </section>

    <section id="integrations" class="page-section">
      <div class="section-head"><div><h2>${t("Integrations")}</h2><p>${t("Secrets are stored locally. This dashboard does not make payments or launch ads.")}</p></div></div>
      <div class="panel integration-group" data-integration-group="clickru">
        <button class="integration-toggle" type="button" aria-expanded="false" aria-controls="integration-clickru-body">
          <span class="panel-head"><span class="integration-title">Click.ru</span><span id="clickruBadge" class="card-label">${t("checking status")}</span></span>
          <span class="integration-chevron" aria-hidden="true">+</span>
        </button>
        <div id="integration-clickru-body" class="integration-body" hidden>
        <p>${t("An API token is required for Click.ru brokers. Once saved, the full token is never displayed.")}</p>
        <label for="token">${t("Click.ru API token")}</label>
        <input id="token" type="password" autocomplete="off" placeholder="${t("Paste your API token")}">
        <button id="save" type="button">${t("Save token")}</button>
        <div id="status" class="status-line" role="status" aria-live="polite"></div>
        </div>
      </div>
      <div class="panel integration-group" data-integration-group="yandex">
        <button class="integration-toggle" type="button" aria-expanded="false" aria-controls="integration-yandex-body">
          <span class="panel-head"><span class="integration-title">Yandex Direct</span><span id="yandexBadge" class="card-label">${t("checking status")}</span></span>
          <span class="integration-chevron" aria-hidden="true">+</span>
        </button>
        <div id="integration-yandex-body" class="integration-body" hidden>
        <p>${t("Local OAuth connection to the Yandex Direct API. The token is saved in a separate private file; changes require explicit confirmation through a guarded MCP tool.")}</p>
        <div class="guide">
          <strong>${t("First-time setup")}</strong>
          <ol>
            <li>${t("Create an app in")} <a href="https://oauth.yandex.ru/" target="_blank" rel="noreferrer">Yandex OAuth</a>.</li>
            <li>${t("Add the permission")} <code>direct:api</code> ${t("and redirect URI")} <code>https://oauth.yandex.ru/verification_code</code>.</li>
            <li>${t("Save the Client ID below, open the authorization link and paste the issued token into the field.")}</li>
          </ol>
          <a id="yandexOAuthLink" class="button-link secondary" href="#" target="_blank" rel="noreferrer" hidden>${t("Open Yandex authorization")}</a>
        </div>
        <div class="grid">
          <label class="wide" for="yandexClientId">OAuth Client ID</label>
          <input class="wide" id="yandexClientId" autocomplete="off" placeholder="${t("32 characters from the app settings")}">
          <label class="wide" for="yandexClientLogin">${t("Client-Login (optional, for agency accounts)")}</label>
          <input class="wide" id="yandexClientLogin" autocomplete="off" placeholder="${t("Client login in Yandex Direct")}">
          <label class="wide" for="yandexToken">${t("OAuth token")}</label>
          <input class="wide" id="yandexToken" type="password" autocomplete="off" placeholder="${t("Paste the token from the URL after #access_token=")}">
        </div>
        <div class="actions">
          <button id="startYandexOAuth" type="button">${t("Get authorization link")}</button>
          <button id="saveYandexToken" type="button">${t("Save OAuth token")}</button>
          <button id="checkYandex" type="button" class="button-link secondary">${t("Check access")}</button>
        </div>
        <div id="yandexStatus" class="status-line" role="status" aria-live="polite"></div>
        <p id="yandexStorage" class="hint"></p>
        </div>
      </div>
      <div class="panel integration-group" data-integration-group="microsoft">
        <button class="integration-toggle" type="button" aria-expanded="false" aria-controls="integration-microsoft-body">
          <span class="panel-head"><span class="integration-title">Microsoft Advertising MCP</span><span id="microsoftBadge" class="card-label">${t("checking status")}</span></span>
          <span class="integration-chevron" aria-hidden="true">+</span>
        </button>
        <div id="integration-microsoft-body" class="integration-body" hidden>
    <p>${t("The official Microsoft Advertising MCP uses OAuth through Microsoft Entra ID. Google sign-in is supported by the Microsoft Advertising API, but is not listed in the official MCP setup guide.")}</p>
    <div class="guide">
      <strong>${t("Requirements for the official MCP")}</strong>
      <ol>
        <li>${t("Open")} <a href="https://portal.azure.com/#view/Microsoft_AAD_RegisteredApps/ApplicationsListBlade" target="_blank" rel="noreferrer">Microsoft Entra App registrations</a> ${t("and click")} <b>New registration</b>.</li>
        <li>${t("Name:")} <code>AdsMCP Microsoft</code>.</li>
        <li>${t("Account types:")} <code>Accounts in any organizational directory and personal Microsoft accounts</code>.</li>
        <li>${t("Add a public client/native redirect URI:")} <code>http://127.0.0.1:8790/api/microsoft/oauth/callback</code>.</li>
        <li>${t("Copy")} <b>Application (client) ID</b> ${t("and paste it below.")}</li>
      </ol>
      <a href="https://learn.microsoft.com/en-us/advertising/guides/mcp-setup" target="_blank" rel="noreferrer">${t("Official Microsoft MCP and OAuth setup guide")}</a><br>
      <a href="https://learn.microsoft.com/en-us/advertising/guides/authentication-oauth" target="_blank" rel="noreferrer">${t("Separate API guide: Google OAuth")}</a><br>
      <a href="https://developers.ads.microsoft.com/" target="_blank" rel="noreferrer">Microsoft Advertising Developer Portal — Developer Token</a>
    </div>
    <label for="microsoftProfileSelect">${t("Select a Microsoft profile")}</label>
    <select id="microsoftProfileSelect"></select>
    <div class="grid">
      <label class="wide" for="microsoftProfileName">${t("Profile name")}</label>
      <input class="wide" id="microsoftProfileName" autocomplete="off" placeholder="${t("For example, Microsoft Ads — primary")}">
      <label class="wide" for="microsoftClientId">OAuth Client ID</label>
      <input class="wide" id="microsoftClientId" autocomplete="off" placeholder="xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx">
      <label class="wide" for="microsoftDeveloperToken">${t("Developer Token (for the direct Bing Ads API)")}</label>
      <input class="wide" id="microsoftDeveloperToken" type="password" autocomplete="off" placeholder="${t("Paste your Developer Token, if available")}">
    </div>
    <button id="saveMicrosoftProfile" type="button">${t("Save Microsoft profile")}</button>
    <button id="connectMicrosoft" type="button">${t("Sign in and connect Microsoft Ads")}</button>
    <div id="microsoftStatus" role="status" aria-live="polite"></div>
    <p class="hint">${t("App registration callback:")} ${MICROSOFT_ADS_REDIRECT_URI}<br>Scope: ${MICROSOFT_ADS_SCOPE}</p>
        </div>
      </div>
      <div class="panel integration-group" data-integration-group="mastodon">
        <button class="integration-toggle" type="button" aria-expanded="false" aria-controls="integration-mastodon-body">
          <span class="panel-head"><span class="integration-title">Mastodon / fediverse</span><span id="mastodonBadge" class="card-label">${t("checking status")}</span></span>
          <span class="integration-chevron" aria-hidden="true">+</span>
        </button>
        <div id="integration-mastodon-body" class="integration-body" hidden>
        <p>${t("Secure sign-in through the local dashboard: the authorization code returns to")} <code>127.0.0.1</code> ${t("and is never placed in a chat or browser input.")}</p>
        <div class="grid">
          <label class="wide" for="mastodonInstance">${t("Mastodon instance")}</label>
          <input class="wide" id="mastodonInstance" autocomplete="url" placeholder="https://mastodon.social" value="https://mastodon.social">
          <label class="wide" for="mastodonAccountId">${t("Local connection name")}</label>
          <input class="wide" id="mastodonAccountId" autocomplete="off" placeholder="neron_one" value="neron_one">
        </div>
        <div class="actions">
          <button id="connectMastodon" type="button">${t("Sign in with Mastodon")}</button>
          <button id="refreshMastodon" type="button" class="button-link secondary">${t("Refresh status")}</button>
        </div>
        <div id="mastodonCurrentAccount" class="status-line"></div>
        <div id="mastodonStatus" class="status-line" role="status" aria-live="polite"></div>
        <p class="hint">${t("The token is saved locally in")} <code>ADS_MCP_DATA/mastodon-accounts.json</code>. Callback: <code>http://127.0.0.1:${DEFAULT_PORT}/api/mastodon/oauth/callback</code></p>
        </div>
      </div>
      <div class="panel integration-group" data-integration-group="telegram">
        <button class="integration-toggle" type="button" aria-expanded="false" aria-controls="integration-telegram-body">
          <span class="panel-head"><span class="integration-title">${t("Telegram account / Lead Proxy")}</span><span id="telegramBadge" class="card-label">${t("checking status")}</span></span>
          <span class="integration-chevron" aria-hidden="true">+</span>
        </button>
        <div id="integration-telegram-body" class="integration-body" hidden>
        <p>${t("Sign in to your local Telegram account here. Your phone number, code and 2FA password are never saved in the browser, SQLite or logs.")}</p>
        <div class="guide">
          <strong>${t("Before signing in")}</strong>
          <ol>
            <li>${t("Create a Telegram application at")} <a href="https://my.telegram.org/apps" target="_blank" rel="noreferrer">my.telegram.org/apps</a>.</li>
            <li>${t("Add")} <code>TELEGRAM_API_ID</code> ${t("and")} <code>TELEGRAM_API_HASH</code> ${t("in the local")} <code>.env</code>.</li>
            <li>${t("Click “Refresh status”, then enter only the value required for the current sign-in step.")}</li>
          </ol>
        </div>
        <div id="telegramQrPanel" class="guide" hidden>
          <strong>${t("QR sign-in")}</strong>
          <p>${t("Open Telegram on your phone → Settings → Devices → Link Desktop Device and scan the code below.")}</p>
          <img id="telegramQrImage" alt="${t("Telegram sign-in QR code")}" width="280" height="280" hidden>
          <p><a id="telegramQrUrl" href="#" rel="noreferrer"></a></p>
        </div>
        <div class="grid">
          <label class="wide" for="telegramPhone">${t("Phone (+ international format)")}</label>
          <input class="wide" id="telegramPhone" inputmode="tel" autocomplete="off" placeholder="+79001234567">
          <label class="wide" for="telegramCode">${t("Code from Telegram or SMS")}</label>
          <input class="wide" id="telegramCode" type="password" inputmode="numeric" autocomplete="off" placeholder="${t("The code is not saved")}">
          <label class="wide" for="telegramPassword">${t("2FA password")}</label>
          <input class="wide" id="telegramPassword" type="password" autocomplete="new-password" placeholder="${t("The password is not saved")}">
        </div>
        <div class="actions">
          <button id="refreshTelegram" type="button">${t("Refresh status")}</button>
          <button id="startTelegramQr" type="button" class="button-link secondary">${t("Sign in with QR")}</button>
          <button id="submitTelegramAuth" type="button" class="button-link secondary">${t("Continue sign-in")}</button>
        </div>
        <div id="telegramCurrentAccount" class="status-line"></div>
        <div id="telegramStatus" class="status-line" role="status" aria-live="polite"></div>
        <p id="telegramStorage" class="hint"></p>
        </div>
      </div>
    </section>

    <section id="modules" class="page-section">
      <div class="section-head"><div><h2>${t("Modules")}</h2><p>${t("Review configured MCP modules, credentials and runtime status without exposing secrets.")}</p></div></div>
      <div class="panel">
        <div class="panel-head"><h3>${t("Configured MCP modules")}</h3><button id="refreshModules" type="button" class="button-link secondary">${t("Refresh status")}</button></div>
        <p class="hint">${t("Module credentials are stored locally in") } <code id="moduleSecretsPath">${t("checking…")}</code>. ${t("Values are never returned to the browser; only masked status is shown.")}</p>
        <div id="moduleStatusMessage" class="status-line" role="status" aria-live="polite"></div>
        <div class="table-wrap">
          <table class="module-table">
            <thead><tr><th>${t("Module")}</th><th>${t("Credentials")}</th><th>${t("Runtime")}</th><th>${t("Source")}</th><th>${t("Action")}</th></tr></thead>
            <tbody id="moduleRows"></tbody>
          </table>
        </div>
      </div>
      <div class="panel">
        <h3>${t("Add or update module credentials")}</h3>
        <p>${t("Enter only the values you want to save. Existing values are kept when a field is left blank.")}</p>
        <label for="moduleSelect">${t("Select a module")}</label>
        <select id="moduleSelect"></select>
        <p id="moduleCredentialHelp" class="module-hint"></p>
        <div id="moduleCredentialsForm" class="grid module-credential-form"></div>
        <div class="actions"><button id="saveModuleCredentials" type="button">${t("Save module credentials")}</button></div>
        <div id="moduleCredentialStatus" class="status-line" role="status" aria-live="polite"></div>
      </div>
    </section>

    <section id="profiles" class="page-section">
      <div class="section-head"><div><h2>${t("Profiles")}</h2><p>${t("Advertiser profiles are saved locally and provide context for Click.ru.")}</p></div></div>
      <div class="panel">
    <p>${t("Profiles are stored locally. The active profile will be used for future Click.ru operations.")}</p>
    <label for="profileSelect">${t("Select a profile")}</label>
    <select id="profileSelect"></select>
    <div class="grid">
      <label class="wide" for="profileName">${t("Profile name")}</label>
      <input class="wide" id="profileName" autocomplete="off" placeholder="${t("For example, Personal profile")}">
      <label for="profileType">${t("Type")}</label>
      <label for="profileInn">${t("Tax ID (INN)")}</label>
      <select id="profileType">
        <option value="PERSON">${t("Individual")}</option>
        <option value="INDIVIDUAL">${t("Sole proprietor")}</option>
        <option value="BUSINESS">${t("Company")}</option>
      </select>
      <input id="profileInn" inputmode="numeric" autocomplete="off" placeholder="${t("10–12 digits")}">
      <label for="lastName">${t("Last name")}</label>
      <label for="firstName">${t("First name")}</label>
      <input id="lastName" autocomplete="family-name" placeholder="${t("Last name")}">
      <input id="firstName" autocomplete="given-name" placeholder="${t("First name")}">
      <label for="middleName">${t("Middle name")}</label>
      <label for="phone">${t("Phone")}</label>
      <input id="middleName" autocomplete="additional-name" placeholder="${t("Middle name")}">
      <input id="phone" autocomplete="tel" placeholder="${t("Optional")}">
    </div>
    <button id="saveProfile" type="button">${t("Save profile")}</button>
    <div id="profileStatus" role="status" aria-live="polite"></div>
      </div>
    </section>

    <section id="campaigns" class="page-section">
      <div class="section-head"><div><h2>${t("Campaigns")}</h2><p>${t("Local drafts are stored here. Changing a status manually does not submit the campaign automatically.")}</p></div></div>
      <div class="panel">
    <p>${t("Campaigns are saved locally. Changing the status does not submit a campaign to VK or start serving ads.")}</p>
    <label for="draftSelect">${t("Select a campaign")}</label>
    <select id="draftSelect"></select>
    <div class="grid">
      <label class="wide" for="draftName">${t("Campaign name")}</label>
      <input class="wide" id="draftName" autocomplete="off" placeholder="${t("For example, Neron.one — VK traffic")}">
      <label for="draftStatus">${t("Status")}</label>
      <label for="draftAccountId">${t("VK account ID")}</label>
      <select id="draftStatus">
        <option value="DRAFT">${t("Draft")}</option>
        <option value="READY">${t("Ready to launch")}</option>
      </select>
      <input id="draftAccountId" inputmode="numeric" autocomplete="off" placeholder="123456">
      <label class="wide" for="draftWebsite">${t("Website")}</label>
      <input class="wide" id="draftWebsite" autocomplete="url" placeholder="https://neron.one/">
      <label for="draftObjective">${t("Objective")}</label>
      <label for="draftRegions">${t("Regions")}</label>
      <select id="draftObjective">
        <option value="TRAFFIC">${t("Website traffic")}</option>
      </select>
      <input id="draftRegions" autocomplete="off" placeholder="${t("All regions of Russia")}">
      <label class="wide" for="draftAudience">${t("Audience")}</label>
      <textarea class="wide" id="draftAudience" placeholder="${t("Audience description")}"></textarea>
      <label for="draftBudget">${t("Daily budget, ₽")}</label>
      <label for="draftHeadline">${t("Headline")}</label>
      <input id="draftBudget" type="number" min="1" step="1" placeholder="100">
      <input id="draftHeadline" autocomplete="off" placeholder="${t("400+ AI models in one chat")}">
      <label class="wide" for="draftAdText">${t("Ad text")}</label>
      <textarea class="wide" id="draftAdText" placeholder="${t("Ad text")}"></textarea>
      <label class="wide" for="draftCta">${t("Call to action")}</label>
      <input class="wide" id="draftCta" autocomplete="off" placeholder="${t("Visit website")}">
    </div>
    <button id="saveDraft" type="button">${t("Save campaign")}</button>
    <div id="draftStatusMessage" role="status" aria-live="polite"></div>
      </div>
    </section>
    <p class="hint">${t("This page is only available through 127.0.0.1.")}</p>
  </main>
  <script nonce="local-settings">
    const language = ${JSON.stringify(language)};
    const messages = ${JSON.stringify(settingsMessages(language)).replace(/</g, "\\u003c")};
    function t(message) {
      return Object.prototype.hasOwnProperty.call(messages, message) ? messages[message] : message;
    }
    function countLabel(count, singular, plural, russianForms) {
      const form = new Intl.PluralRules(language).select(count);
      const noun = language === 'ru'
        ? russianForms[form === 'one' ? 0 : form === 'few' ? 1 : 2]
        : (form === 'one' ? singular : plural);
      return count + ' ' + noun;
    }
    document.querySelector('#settingsLanguage').addEventListener('change', (event) => {
      const url = new URL(window.location.href);
      url.searchParams.set('lang', event.target.value);
      window.location.assign(url.href);
    });
    const tokenInput = document.querySelector('#token');
    const saveToken = document.querySelector('#save');
    const tokenStatus = document.querySelector('#status');
    const yandexClientId = document.querySelector('#yandexClientId');
    const yandexClientLogin = document.querySelector('#yandexClientLogin');
    const yandexToken = document.querySelector('#yandexToken');
    const startYandexOAuth = document.querySelector('#startYandexOAuth');
    const saveYandexToken = document.querySelector('#saveYandexToken');
    const checkYandex = document.querySelector('#checkYandex');
    const yandexOAuthLink = document.querySelector('#yandexOAuthLink');
    const yandexBadge = document.querySelector('#yandexBadge');
    const yandexStatus = document.querySelector('#yandexStatus');
    const yandexStorage = document.querySelector('#yandexStorage');
    const microsoftProfileSelect = document.querySelector('#microsoftProfileSelect');
    const microsoftProfileName = document.querySelector('#microsoftProfileName');
    const microsoftClientId = document.querySelector('#microsoftClientId');
    const microsoftDeveloperToken = document.querySelector('#microsoftDeveloperToken');
    const saveMicrosoftProfile = document.querySelector('#saveMicrosoftProfile');
    const connectMicrosoft = document.querySelector('#connectMicrosoft');
    const microsoftStatus = document.querySelector('#microsoftStatus');
    const clickruBadge = document.querySelector('#clickruBadge');
    const microsoftBadge = document.querySelector('#microsoftBadge');
    const telegramBadge = document.querySelector('#telegramBadge');
    const telegramPhone = document.querySelector('#telegramPhone');
    const telegramCode = document.querySelector('#telegramCode');
    const telegramPassword = document.querySelector('#telegramPassword');
    const refreshTelegram = document.querySelector('#refreshTelegram');
    const startTelegramQr = document.querySelector('#startTelegramQr');
    const submitTelegramAuth = document.querySelector('#submitTelegramAuth');
    const telegramQrPanel = document.querySelector('#telegramQrPanel');
    const telegramQrImage = document.querySelector('#telegramQrImage');
    const telegramQrUrl = document.querySelector('#telegramQrUrl');
    const telegramCurrentAccount = document.querySelector('#telegramCurrentAccount');
    const telegramStatus = document.querySelector('#telegramStatus');
    const telegramStorage = document.querySelector('#telegramStorage');
    const homeClickru = document.querySelector('#homeClickru');
    const homeYandex = document.querySelector('#homeYandex');
    const homeMicrosoft = document.querySelector('#homeMicrosoft');
    const homeMastodon = document.querySelector('#homeMastodon');
    const homeProfiles = document.querySelector('#homeProfiles');
    const homeCampaigns = document.querySelector('#homeCampaigns');
    const profileSelect = document.querySelector('#profileSelect');
    const profileName = document.querySelector('#profileName');
    const profileType = document.querySelector('#profileType');
    const profileInn = document.querySelector('#profileInn');
    const lastName = document.querySelector('#lastName');
    const firstName = document.querySelector('#firstName');
    const middleName = document.querySelector('#middleName');
    const phone = document.querySelector('#phone');
    const saveProfile = document.querySelector('#saveProfile');
    const profileStatus = document.querySelector('#profileStatus');
    const draftSelect = document.querySelector('#draftSelect');
    const draftName = document.querySelector('#draftName');
    const draftStatus = document.querySelector('#draftStatus');
    const draftAccountId = document.querySelector('#draftAccountId');
    const draftWebsite = document.querySelector('#draftWebsite');
    const draftObjective = document.querySelector('#draftObjective');
    const draftRegions = document.querySelector('#draftRegions');
    const draftAudience = document.querySelector('#draftAudience');
    const draftBudget = document.querySelector('#draftBudget');
    const draftHeadline = document.querySelector('#draftHeadline');
    const draftAdText = document.querySelector('#draftAdText');
    const draftCta = document.querySelector('#draftCta');
    const saveDraft = document.querySelector('#saveDraft');
    const draftStatusMessage = document.querySelector('#draftStatusMessage');
    const homeModules = document.querySelector('#homeModules');
    const refreshModules = document.querySelector('#refreshModules');
    const moduleSecretsPath = document.querySelector('#moduleSecretsPath');
    const moduleRows = document.querySelector('#moduleRows');
    const moduleStatusMessage = document.querySelector('#moduleStatusMessage');
    const moduleSelect = document.querySelector('#moduleSelect');
    const moduleCredentialHelp = document.querySelector('#moduleCredentialHelp');
    const moduleCredentialsForm = document.querySelector('#moduleCredentialsForm');
    const saveModuleCredentials = document.querySelector('#saveModuleCredentials');
    const moduleCredentialStatus = document.querySelector('#moduleCredentialStatus');
    const mastodonInstance = document.querySelector('#mastodonInstance');
    const mastodonAccountId = document.querySelector('#mastodonAccountId');
    const connectMastodon = document.querySelector('#connectMastodon');
    const refreshMastodon = document.querySelector('#refreshMastodon');
    const mastodonBadge = document.querySelector('#mastodonBadge');
    const mastodonCurrentAccount = document.querySelector('#mastodonCurrentAccount');
    const mastodonStatus = document.querySelector('#mastodonStatus');
    const nonce = ${JSON.stringify(nonce)};
    let profiles = [];
    let microsoftProfiles = [];
    let drafts = [];
    let moduleStatuses = [];
    let telegramAccount = null;
    let mastodonAccounts = [];
    let requestedIntegrationGroup = null;

    // Keep the setup flow focused on the services most relevant to this dashboard.
    const integrationOrder = ['clickru', 'yandex', 'telegram', 'microsoft', 'mastodon'];
    const integrationsSection = document.querySelector('#integrations');
    const integrationGroups = [...document.querySelectorAll('.integration-group')];
    integrationGroups
      .sort((left, right) => integrationOrder.indexOf(left.dataset.integrationGroup) - integrationOrder.indexOf(right.dataset.integrationGroup))
      .forEach((group) => integrationsSection.appendChild(group));

    function setIntegrationGroup(group, expanded) {
      if (!group) return;
      const toggle = group.querySelector('.integration-toggle');
      const body = group.querySelector('.integration-body');
      if (!toggle || !body) return;
      toggle.setAttribute('aria-expanded', String(expanded));
      group.classList.toggle('expanded', expanded);
      body.hidden = !expanded;
    }

    function closeIntegrationGroups() {
      for (const group of document.querySelectorAll('.integration-group')) setIntegrationGroup(group, false);
    }

    function openIntegrationGroup(id, options = {}) {
      const group = document.querySelector('[data-integration-group="' + id + '"]');
      if (!group) return;
      setIntegrationGroup(group, true);
      if (options.scroll) requestAnimationFrame(() => group.scrollIntoView({ behavior: 'smooth', block: 'start' }));
    }

    for (const toggle of document.querySelectorAll('.integration-toggle')) {
      toggle.addEventListener('click', () => {
        const group = toggle.closest('.integration-group');
        setIntegrationGroup(group, toggle.getAttribute('aria-expanded') !== 'true');
      });
    }

    function navigate() {
      const page = ['home', 'integrations', 'modules', 'profiles', 'campaigns'].includes(location.hash.slice(1))
        ? location.hash.slice(1)
        : 'home';
      for (const section of document.querySelectorAll('.page-section')) {
        section.classList.toggle('active', section.id === page);
      }
      for (const link of document.querySelectorAll('[data-page]')) {
        link.classList.toggle('active', link.dataset.page === page);
      }
      closeIntegrationGroups();
      if (page === 'integrations' && requestedIntegrationGroup) {
        const groupId = requestedIntegrationGroup;
        requestedIntegrationGroup = null;
        openIntegrationGroup(groupId, { scroll: true });
      }
      if (location.hash.slice(1) !== page) history.replaceState(null, '', '#' + page);
    }

    document.querySelector('[data-home-settings]').addEventListener('click', (event) => {
      event.preventDefault();
      requestedIntegrationGroup = 'clickru';
      if (location.hash === '#integrations') navigate();
      else location.hash = '#integrations';
    });

    window.addEventListener('hashchange', () => { navigate(); window.scrollTo(0, 0); });
    // Reloading after a language change must keep the selector visible instead
    // of scrolling the page down to its section fragment.
    window.addEventListener('load', () => window.scrollTo(0, 0), { once: true });
    navigate();

    async function postJson(path, payload) {
      const response = await fetch(path, {
        method: 'POST',
        headers: { 'content-type': 'application/json', 'x-local-settings-token': nonce },
        body: JSON.stringify(payload),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(t(data.error || 'Could not save the data'));
      return data;
    }

    function moduleSecretKey(key) {
      return /(TOKEN|SECRET|PASSWORD|PRIVATE_KEY|REFRESH|API_KEY|API_HASH)/i.test(key);
    }

    function moduleSourceLabel(source) {
      if (source === 'module_file') return t("module secret file");
      if (source === 'environment') return t("environment (.env/process)");
      return t("missing");
    }

    function moduleCell(text, className) {
      const cell = document.createElement('td');
      if (className) cell.className = className;
      cell.textContent = text || '';
      return cell;
    }

    function renderModuleRows() {
      moduleRows.replaceChildren();
      for (const module of moduleStatuses) {
        const row = document.createElement('tr');
        const name = document.createElement('td');
        const title = document.createElement('strong');
        title.textContent = module.label || module.id;
        name.appendChild(title);
        const identity = document.createElement('span');
        identity.className = 'module-source';
        identity.textContent = module.id + ' · ' + module.provider;
        name.appendChild(identity);
        row.appendChild(name);

        const credentials = document.createElement('td');
        const summary = document.createElement('div');
        summary.textContent = module.requiredCount
          ? module.configuredRequired + '/' + module.requiredCount + ' ' + t("required")
          : t("no required credentials declared");
        credentials.appendChild(summary);
        for (const credential of module.credentials || []) {
          const item = document.createElement('span');
          item.className = 'module-credential ' + (credential.configured ? 'ok' : 'missing');
          item.textContent = credential.key + ': ' + (credential.configured
            ? moduleSourceLabel(credential.source) + (credential.maskedValue ? ' ' + credential.maskedValue : '')
            : t("missing"));
          credentials.appendChild(item);
        }
        row.appendChild(credentials);

        const runtime = document.createElement('td');
        const runtimeStatus = document.createElement('div');
        runtimeStatus.textContent = module.runtimeStatus === 'passed'
          ? t("handshake passed")
          : module.runtimeStatus === 'failed'
            ? t("handshake failed")
            : module.configured ? t("manifest ready; not checked") : t("not configured");
        runtime.appendChild(runtimeStatus);
        if (module.runtimeMessage) {
          const detail = document.createElement('span');
          detail.className = 'module-source';
          detail.textContent = module.runtimeMessage;
          runtime.appendChild(detail);
        }
        row.appendChild(runtime);

        const source = document.createElement('td');
        const command = document.createElement('code');
        command.className = 'module-command';
        command.textContent = module.commandLine || module.transport;
        source.appendChild(command);
        if (module.sourceUrl) {
          const link = document.createElement('a');
          link.className = 'module-source';
          link.href = module.sourceUrl;
          link.target = '_blank';
          link.rel = 'noreferrer';
          link.textContent = module.sourceRef || module.sourceUrl;
          source.appendChild(link);
        }
        row.appendChild(source);

        const action = document.createElement('td');
        const check = document.createElement('button');
        check.type = 'button';
        check.className = 'module-check button-link secondary';
        check.textContent = t("Check runtime");
        check.disabled = !module.configured;
        check.addEventListener('click', () => checkModuleRuntime(module.id, check));
        action.appendChild(check);
        row.appendChild(action);
        moduleRows.appendChild(row);
      }
      if (!moduleStatuses.length) {
        const row = document.createElement('tr');
        const cell = moduleCell(t("No configured MCP modules"));
        cell.colSpan = 5;
        row.appendChild(cell);
        moduleRows.appendChild(row);
      }
    }

    function renderModuleCredentialForm() {
      const module = moduleStatuses.find((candidate) => candidate.id === moduleSelect.value);
      moduleCredentialsForm.replaceChildren();
      if (!module) {
        moduleCredentialHelp.textContent = t("Configure modules/modules.json to edit module credentials.");
        saveModuleCredentials.disabled = true;
        return;
      }
      saveModuleCredentials.disabled = false;
      moduleCredentialHelp.textContent = (module.notes || '') + ' ' + t("Blank fields keep existing values.");
      for (const credential of module.credentials || []) {
        const label = document.createElement('label');
        label.className = 'wide';
        label.htmlFor = 'module-credential-' + credential.key;
        label.textContent = credential.key + (credential.required ? ' · ' + t("required") : ' · ' + t("optional"));
        const input = document.createElement('input');
        input.className = 'wide';
        input.id = label.htmlFor;
        input.dataset.moduleKey = credential.key;
        input.type = moduleSecretKey(credential.key) ? 'password' : 'text';
        input.autocomplete = 'off';
        input.placeholder = credential.configured
          ? t("Saved") + ' · ' + moduleSourceLabel(credential.source) + (credential.maskedValue ? ' ' + credential.maskedValue : '')
          : t("Enter value");
        moduleCredentialsForm.append(label, input);
      }
    }

    async function refreshModuleStatuses() {
      const response = await fetch('/api/modules/status');
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || t("Could not read module status"));
      moduleStatuses = data.modules || [];
      moduleSecretsPath.textContent = data.secretsPath || t("not configured");
      moduleSelect.replaceChildren(new Option(t('Select a module'), ''));
      for (const module of moduleStatuses) {
        const option = document.createElement('option');
        option.value = module.id;
        option.textContent = (module.label || module.id) + ' · ' + module.provider;
        moduleSelect.appendChild(option);
      }
      if (moduleStatuses.length) moduleSelect.value = moduleStatuses.some((module) => module.id === moduleSelect.value)
        ? moduleSelect.value
        : moduleStatuses[0].id;
      renderModuleCredentialForm();
      renderModuleRows();
      homeModules.textContent = countLabel(moduleStatuses.length, 'module', 'modules', ['модуль', 'модуля', 'модулей']);
      homeModules.className = 'card-value ' + (moduleStatuses.length ? 'ok' : 'warn');
      moduleStatusMessage.textContent = data.error || (moduleStatuses.length
        ? t("Configured modules: ") + moduleStatuses.length
        : t("No configured MCP modules"));
    }

    async function checkModuleRuntime(moduleId, button) {
      button.disabled = true;
      moduleStatusMessage.textContent = t("Checking module runtime…");
      try {
        const data = await postJson('/api/modules/check', { moduleId });
        const module = moduleStatuses.find((candidate) => candidate.id === moduleId);
        if (module) {
          module.runtimeStatus = data.ok ? 'passed' : 'failed';
          module.runtimeMessage = data.ok
            ? t("Tools found: ") + data.toolCount
            : (data.error || t("handshake failed"));
        }
        moduleStatusMessage.textContent = data.ok
          ? t("Runtime check passed for ") + moduleId + '. ' + t("Tools found: ") + data.toolCount
          : (data.error || t("Runtime check failed"));
        renderModuleRows();
      } catch (error) {
        moduleStatusMessage.textContent = error instanceof Error ? error.message : t("Runtime check failed");
      } finally {
        button.disabled = false;
      }
    }

    moduleSelect.addEventListener('change', renderModuleCredentialForm);
    refreshModules.addEventListener('click', async () => {
      refreshModules.disabled = true;
      try {
        await refreshModuleStatuses();
      } catch (error) {
        moduleStatusMessage.textContent = error instanceof Error ? error.message : t("Could not read module status");
      } finally {
        refreshModules.disabled = false;
      }
    });

    saveModuleCredentials.addEventListener('click', async () => {
      const moduleId = moduleSelect.value;
      const values = {};
      for (const input of moduleCredentialsForm.querySelectorAll('input[data-module-key]')) {
        if (input.value.trim()) values[input.dataset.moduleKey] = input.value;
      }
      if (!moduleId || !Object.keys(values).length) {
        moduleCredentialStatus.textContent = t("Enter at least one credential value.");
        return;
      }
      saveModuleCredentials.disabled = true;
      moduleCredentialStatus.textContent = t("Saving module credentials locally…");
      try {
        const data = await postJson('/api/modules/secrets', { moduleId, values });
        moduleCredentialStatus.textContent = t("Saved keys: ") + data.savedKeys.join(', ') + '. ' + t("Secrets are not displayed.");
        await refreshModuleStatuses();
      } catch (error) {
        moduleCredentialStatus.textContent = error instanceof Error ? error.message : t("Could not save module credentials");
      } finally {
        saveModuleCredentials.disabled = false;
      }
    });

    async function refreshTokenStatus() {
      const response = await fetch('/api/clickru/status');
      const data = await response.json();
      tokenStatus.textContent = data.configured
        ? t("Token saved: ") + data.maskedToken
        : t("No token saved yet");
      clickruBadge.textContent = data.configured ? t("connected") : t("not connected");
      clickruBadge.className = 'card-label ' + (data.configured ? 'ok' : 'warn');
      homeClickru.textContent = data.configured ? t("Connected") : t("Token required");
      homeClickru.className = 'card-value ' + (data.configured ? 'ok' : 'warn');
    }

    function yandexConfiguredMessage(data) {
      if (!data.configured) return t("No OAuth token saved yet");
      return data.clientLogin
        ? t("Token saved · Client-Login: ") + data.clientLogin
        : t("Token saved for the primary account");
    }

    async function refreshYandexStatus() {
      const response = await fetch('/api/yandex/status');
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || t("Could not read Yandex Direct settings"));
      if (data.clientId) yandexClientId.value = data.clientId;
      if (data.clientLogin) yandexClientLogin.value = data.clientLogin;
      const configured = Boolean(data.configured);
      yandexBadge.textContent = configured ? t("token saved") : t("OAuth token required");
      yandexBadge.className = 'card-label ' + (configured ? 'ok' : 'warn');
      homeYandex.textContent = configured ? t("Ready to check") : t("Token required");
      homeYandex.className = 'card-value ' + (configured ? 'ok' : 'warn');
      yandexStatus.textContent = yandexConfiguredMessage(data);
      yandexStorage.textContent = data.tokenPath ? t("Token stored locally: ") + data.tokenPath : '';
    }

    startYandexOAuth.addEventListener('click', async () => {
      const clientId = yandexClientId.value.trim();
      if (!clientId) {
        yandexStatus.textContent = t("Enter the Yandex app OAuth Client ID first.");
        return;
      }
      startYandexOAuth.disabled = true;
      yandexStatus.textContent = t("Preparing the local Yandex authorization link…");
      try {
        const data = await postJson('/api/yandex/oauth/start', {
          clientId,
          clientLogin: yandexClientLogin.value.trim(),
        });
        yandexOAuthLink.href = data.authorizationUrl;
        yandexOAuthLink.hidden = false;
        window.open(data.authorizationUrl, '_blank', 'noopener');
        yandexStatus.textContent = t("Authorization opened in a new tab. After granting access, copy access_token from the URL and paste it here.");
      } catch (error) {
        yandexStatus.textContent = error instanceof Error ? error.message : t("Could not prepare Yandex OAuth");
      } finally {
        startYandexOAuth.disabled = false;
      }
    });

    saveYandexToken.addEventListener('click', async () => {
      const token = yandexToken.value.trim();
      if (!token) {
        yandexStatus.textContent = t("Paste the OAuth token from the Yandex URL.");
        return;
      }
      saveYandexToken.disabled = true;
      yandexStatus.textContent = t("Saving the token locally…");
      try {
        await postJson('/api/yandex/token', {
          token,
          clientId: yandexClientId.value.trim(),
          clientLogin: yandexClientLogin.value.trim(),
        });
        yandexToken.value = '';
        await refreshYandexStatus();
        yandexStatus.textContent = t("Token saved locally. Click “Check access”.");
      } catch (error) {
        yandexStatus.textContent = error instanceof Error ? error.message : t("Could not save the Yandex token");
      } finally {
        saveYandexToken.disabled = false;
      }
    });

    checkYandex.addEventListener('click', async () => {
      checkYandex.disabled = true;
      yandexStatus.textContent = t("Checking Yandex Direct access…");
      try {
        const response = await fetch('/api/yandex/check', {
          method: 'POST',
          headers: { 'x-local-settings-token': nonce },
        });
        const data = await response.json();
        if (!response.ok) throw new Error(data.error || t("Could not check Yandex Direct"));
        if (data.connected) {
          const count = typeof data.campaigns === 'number' ? t(" Campaigns found: ") + data.campaigns + '.' : '';
          yandexBadge.textContent = t("connected");
          yandexBadge.className = 'card-label ok';
          homeYandex.textContent = t("Connected");
          homeYandex.className = 'card-value ok';
          const campaignList = Array.isArray(data.campaignList) ? data.campaignList : [];
          const details = campaignList.length
            ? ' ' + campaignList.map((campaign) => {
              const lifecycle = [campaign.state, campaign.status].filter(Boolean).join(' / ');
              return campaign.id + ' — ' + campaign.name + (lifecycle ? ' (' + lifecycle + ')' : '');
            }).join(' · ')
            : '';
          yandexStatus.textContent = t("API access confirmed.") + count + details;
        } else {
          yandexBadge.textContent = t("access error");
          yandexBadge.className = 'card-label warn';
          yandexStatus.textContent = data.error || t("Yandex did not confirm access.");
        }
      } catch (error) {
        yandexStatus.textContent = error instanceof Error ? error.message : t("Yandex Direct check failed");
      } finally {
        checkYandex.disabled = false;
      }
    });

    function telegramStepMessage(data) {
      const auth = data?.auth || {};
      if (auth.state === 'ready') return t("Telegram account connected. Read-only discovery is available.");
      if (auth.state === 'wait_qr') return t("Scan the QR code with Telegram on your phone.");
      if (auth.state === 'wait_password') return t("Enter your cloud 2FA password.");
      if (auth.backend === 'gramjs') return t(data?.next || 'TDLib is unavailable on this platform. Use local terminal sign-in for GramJS.');
      if (auth.state === 'wait_phone') return t("Enter your phone number and click “Continue sign-in”.");
      if (auth.state === 'wait_code') return t("Enter the code Telegram sent to the app or by SMS.");
      return t(auth.hint || data?.next || 'Check the local Telegram configuration.');
    }

    function telegramAccountMessage(data) {
      const account = data?.auth?.account;
      if (data?.auth?.state !== 'ready' || !account) return t("Connected account: no active session");
      const parts = [account.name, account.username ? '@' + account.username : '', account.id ? 'ID ' + account.id : '']
        .filter(Boolean);
      return t("Connected account: ") + (parts.join(' · ') || t("identified"));
    }

    function updateTelegramFields() {
      const state = telegramAccount?.auth?.state;
      const canUseDashboard = telegramAccount?.auth?.backend === 'tdlib';
      telegramPhone.disabled = !canUseDashboard || state !== 'wait_phone';
      telegramCode.disabled = !canUseDashboard || state !== 'wait_code';
      telegramPassword.disabled = !['tdlib', 'gramjs'].includes(telegramAccount?.auth?.backend) || state !== 'wait_password';
      submitTelegramAuth.disabled = !['tdlib', 'gramjs'].includes(telegramAccount?.auth?.backend) || state !== 'wait_password';
      startTelegramQr.disabled = telegramAccount?.auth?.backend !== 'gramjs' || ['wait_qr', 'wait_password'].includes(state);
    }

    function renderTelegramQr(data) {
      const qr = data?.auth?.qr || data?.qr;
      const hasQr = Boolean(qr?.dataUrl || qr?.url);
      telegramQrPanel.hidden = !hasQr;
      telegramQrImage.hidden = !qr?.dataUrl;
      if (qr?.dataUrl) telegramQrImage.src = qr.dataUrl;
      telegramQrUrl.textContent = qr?.url || '';
      telegramQrUrl.href = qr?.url || '#';
    }

    async function refreshTelegramStatus() {
      const response = await fetch('/api/telegram/account/status');
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || t("Could not check the Telegram account"));
      telegramAccount = data;
      const auth = data.auth || {};
      const ready = auth.state === 'ready';
      const stateLabels = { missing_deps: 'Dependencies required', missing_credentials: 'Credentials required',
        wait_phone: 'Phone required', wait_code: 'Code required', wait_password: '2FA password required',
        wait_qr: 'Scan the QR code', error: 'Connection error', closed: 'Disconnected', logging_out: 'Signing out…' };
      telegramBadge.textContent = ready ? t('connected') : t(stateLabels[auth.state] || 'not configured');
      telegramBadge.className = 'card-label ' + (ready ? 'ok' : 'warn');
      telegramCurrentAccount.textContent = telegramAccountMessage(data);
      telegramStatus.textContent = telegramStepMessage(data);
      telegramStorage.textContent = data.storage?.tdlib_database
        ? t("Local state: ") + data.storage.tdlib_database
        : '';
      renderTelegramQr(data);
      updateTelegramFields();
    }

    startTelegramQr.addEventListener('click', async () => {
      startTelegramQr.disabled = true;
      telegramStatus.textContent = t("Preparing the local Telegram QR code…");
      try {
        await postJson('/api/telegram/account/auth', { qr: true });
        await refreshTelegramStatus();
      } catch (error) {
        telegramStatus.textContent = error instanceof Error ? error.message : t("Could not start QR sign-in");
      } finally {
        updateTelegramFields();
      }
    });

    refreshTelegram.addEventListener('click', async () => {
      refreshTelegram.disabled = true;
      telegramStatus.textContent = t("Checking the Telegram account…");
      try {
        await refreshTelegramStatus();
      } catch (error) {
        telegramCurrentAccount.textContent = t("Connected account: status unavailable");
        telegramStatus.textContent = error instanceof Error ? error.message : t("Telegram account check failed");
      } finally {
        refreshTelegram.disabled = false;
      }
    });

    submitTelegramAuth.addEventListener('click', async () => {
      const state = telegramAccount?.auth?.state;
      const payload = state === 'wait_phone'
        ? { phone: telegramPhone.value.trim() }
        : state === 'wait_code'
          ? { code: telegramCode.value.trim() }
          : state === 'wait_password'
            ? { password: telegramPassword.value }
            : null;
      if (!payload || !Object.values(payload)[0]) {
        telegramStatus.textContent = telegramStepMessage(telegramAccount);
        return;
      }
      submitTelegramAuth.disabled = true;
      telegramStatus.textContent = t("Sending the value to the local Telegram client…");
      try {
        const data = await postJson('/api/telegram/account/auth', payload);
        telegramPhone.value = '';
        telegramCode.value = '';
        telegramPassword.value = '';
        await refreshTelegramStatus();
        if (data.error) telegramStatus.textContent = data.error;
      } catch (error) {
        telegramStatus.textContent = error instanceof Error ? error.message : t("Telegram authorization failed");
      } finally {
        updateTelegramFields();
      }
    });

    function mastodonAccountMessage(account) {
      const identity = account?.account || {};
      const handle = identity.acct || (identity.username ? '@' + identity.username : '') || account?.id || t("identified");
      return handle + ' · ' + (account?.instanceUrl || t("instance unknown"));
    }

    async function refreshMastodonAccounts() {
      const response = await fetch('/api/mastodon/accounts');
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || t("Could not read Mastodon accounts"));
      mastodonAccounts = data.accounts || [];
      const connected = mastodonAccounts.length > 0;
      const active = mastodonAccounts[0];
      mastodonBadge.textContent = connected ? t("connected") : t("not configured");
      mastodonBadge.className = 'card-label ' + (connected ? 'ok' : 'warn');
      homeMastodon.textContent = connected ? countLabel(mastodonAccounts.length, 'account', 'accounts', ['аккаунт', 'аккаунта', 'аккаунтов']) : t('Sign-in required');
      homeMastodon.className = 'card-value ' + (connected ? 'ok' : 'warn');
      mastodonCurrentAccount.textContent = connected
        ? t("Connected account: ") + mastodonAccountMessage(active)
        : t("Connected account: none");
      mastodonStatus.textContent = new URLSearchParams(location.search).get('mastodon') === 'connected'
        ? t("Mastodon connected through the local callback.")
        : (connected ? t("Authorization saved locally.") : t("Click “Sign in with Mastodon” to connect an account."));
    }

    connectMastodon.addEventListener('click', async () => {
      const instanceUrl = mastodonInstance.value.trim();
      const accountId = mastodonAccountId.value.trim();
      if (!instanceUrl || !accountId) {
        mastodonStatus.textContent = t("Enter an instance URL and a local connection name.");
        return;
      }
      connectMastodon.disabled = true;
      mastodonStatus.textContent = t("Opening local Mastodon OAuth sign-in…");
      try {
        const data = await postJson('/api/mastodon/oauth/start', { instanceUrl, accountId });
        window.location.href = data.authorizationUrl;
      } catch (error) {
        mastodonStatus.textContent = error instanceof Error ? error.message : t("Could not start Mastodon OAuth");
        connectMastodon.disabled = false;
      }
    });

    refreshMastodon.addEventListener('click', async () => {
      refreshMastodon.disabled = true;
      mastodonStatus.textContent = t("Checking the local Mastodon connection…");
      try {
        await refreshMastodonAccounts();
      } catch (error) {
        mastodonStatus.textContent = error instanceof Error ? error.message : t("Mastodon check failed");
      } finally {
        refreshMastodon.disabled = false;
      }
    });

    function fillMicrosoftProfile(profile) {
      microsoftProfileName.value = profile?.name || '';
      microsoftClientId.value = profile?.clientId || '';
    }

    async function refreshMicrosoftProfiles() {
      const response = await fetch('/api/microsoft/profiles');
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || t("Could not read Microsoft profiles"));
      microsoftProfiles = data.profiles || [];
      microsoftProfileSelect.replaceChildren(new Option(t('New Microsoft profile'), ''));
      for (const profile of microsoftProfiles) {
        const option = document.createElement('option');
        option.value = profile.id;
        option.textContent = profile.name + ' · ' + (profile.connected ? t("connected") : t("not connected"));
        microsoftProfileSelect.appendChild(option);
      }
      microsoftProfileSelect.value = data.activeProfileId || '';
      fillMicrosoftProfile(microsoftProfiles.find((profile) => profile.id === microsoftProfileSelect.value));
      const activeMicrosoftProfile = microsoftProfiles.find((profile) => profile.id === microsoftProfileSelect.value);
      microsoftStatus.textContent = data.redirectUri
        ? (activeMicrosoftProfile?.developerTokenConfigured ? t("Developer Token saved locally. ") : '') + 'Callback: ' + data.redirectUri
        : t("No Microsoft profile created yet");
      const connected = microsoftProfiles.some((profile) => profile.connected);
      microsoftBadge.textContent = connected ? t("connected") : microsoftProfiles.length ? t("OAuth sign-in required") : t("not configured");
      microsoftBadge.className = 'card-label ' + (connected ? 'ok' : 'warn');
      homeMicrosoft.textContent = connected ? t("Connected") : microsoftProfiles.length ? t("Sign-in required") : t("Not configured");
      homeMicrosoft.className = 'card-value ' + (connected ? 'ok' : 'warn');
    }

    microsoftProfileSelect.addEventListener('change', async () => {
      const profile = microsoftProfiles.find((candidate) => candidate.id === microsoftProfileSelect.value);
      fillMicrosoftProfile(profile);
      if (!profile) {
        microsoftStatus.textContent = t("New Microsoft profile");
        return;
      }
      try {
        await postJson('/api/microsoft/profiles/active', { profileId: profile.id });
        microsoftStatus.textContent = t("Active: ") + profile.name;
      } catch (error) {
        microsoftStatus.textContent = error instanceof Error ? error.message : t("Could not select the Microsoft profile");
      }
    });

    saveMicrosoftProfile.addEventListener('click', async () => {
      saveMicrosoftProfile.disabled = true;
      microsoftStatus.textContent = t("Saving the Microsoft profile…");
      try {
        const data = await postJson('/api/microsoft/profiles', {
          id: microsoftProfileSelect.value || undefined,
          name: microsoftProfileName.value,
          clientId: microsoftClientId.value,
          developerToken: microsoftDeveloperToken.value,
        });
        await refreshMicrosoftProfiles();
        microsoftProfileSelect.value = data.profile.id;
        fillMicrosoftProfile(data.profile);
        microsoftStatus.textContent = t("Microsoft profile saved. You can now connect OAuth.");
      } catch (error) {
        microsoftStatus.textContent = error instanceof Error ? error.message : t("Could not save the Microsoft profile");
      } finally {
        saveMicrosoftProfile.disabled = false;
      }
    });

    connectMicrosoft.addEventListener('click', () => {
      const profileId = microsoftProfileSelect.value;
      if (!profileId) {
        microsoftStatus.textContent = t("Save a Microsoft profile with a Client ID first.");
        return;
      }
      microsoftStatus.textContent = t("Opening secure Microsoft sign-in…");
      window.location.href = '/api/microsoft/oauth/start?profileId=' + encodeURIComponent(profileId);
    });

    function clearProfileForm() {
      profileName.value = '';
      profileType.value = 'PERSON';
      profileInn.value = '';
      lastName.value = '';
      firstName.value = '';
      middleName.value = '';
      phone.value = '';
    }

    function fillProfile(profile) {
      profileName.value = profile?.name || '';
      profileType.value = profile?.type || 'PERSON';
      profileInn.value = profile?.inn || '';
      lastName.value = profile?.lastName || '';
      firstName.value = profile?.firstName || '';
      middleName.value = profile?.middleName || '';
      phone.value = profile?.phone || '';
    }

    async function refreshProfiles() {
      const response = await fetch('/api/clickru/profiles');
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || t("Could not read profiles"));
      profiles = data.profiles || [];
      profileSelect.replaceChildren(new Option(t('New profile'), ''));
      for (const profile of profiles) {
        const option = document.createElement('option');
        option.value = profile.id;
        option.textContent = profile.name + ' · ' + profile.innMasked;
        profileSelect.appendChild(option);
      }
      profileSelect.value = data.activeProfileId || '';
      fillProfile(profiles.find((profile) => profile.id === profileSelect.value));
      homeProfiles.textContent = countLabel(profiles.length, 'profile', 'profiles', ['профиль', 'профиля', 'профилей']);
    }

    profileSelect.addEventListener('change', async () => {
      const profile = profiles.find((candidate) => candidate.id === profileSelect.value);
      fillProfile(profile);
      if (!profile) {
        profileStatus.textContent = t("New profile");
        return;
      }
      try {
        await postJson('/api/clickru/profiles/active', { profileId: profile.id });
        profileStatus.textContent = t("Active: ") + profile.name;
      } catch (error) {
        profileStatus.textContent = error instanceof Error ? error.message : t("Could not select the profile");
      }
    });

    saveToken.addEventListener('click', async () => {
      const value = tokenInput.value.trim();
      if (!value) {
        tokenStatus.textContent = t("Enter your API token.");
        return;
      }
      saveToken.disabled = true;
      tokenStatus.textContent = t("Saving…");
      try {
        const data = await postJson('/api/clickru/token', { token: value });
        tokenInput.value = '';
        tokenStatus.textContent = t("Token saved: ") + data.maskedToken;
      } catch (error) {
        tokenStatus.textContent = error instanceof Error ? error.message : t("Save failed");
      } finally {
        saveToken.disabled = false;
      }
    });

    saveProfile.addEventListener('click', async () => {
      saveProfile.disabled = true;
      profileStatus.textContent = t("Saving the profile…");
      try {
        const data = await postJson('/api/clickru/profiles', {
          id: profileSelect.value || undefined,
          name: profileName.value,
          type: profileType.value,
          inn: profileInn.value,
          lastName: lastName.value,
          firstName: firstName.value,
          middleName: middleName.value,
          phone: phone.value,
        });
        await refreshProfiles();
        profileSelect.value = data.profile.id;
        fillProfile(data.profile);
        profileStatus.textContent = t("Profile saved and set as active");
      } catch (error) {
        profileStatus.textContent = error instanceof Error ? error.message : t("Could not save the profile");
      } finally {
        saveProfile.disabled = false;
      }
    });

    function clearDraftForm() {
      draftName.value = '';
      draftStatus.value = 'DRAFT';
      draftAccountId.value = '';
      draftWebsite.value = '';
      draftObjective.value = 'TRAFFIC';
      draftRegions.value = '';
      draftAudience.value = '';
      draftBudget.value = '';
      draftHeadline.value = '';
      draftAdText.value = '';
      draftCta.value = '';
    }

    function fillDraft(draft) {
      draftName.value = draft?.name || '';
      draftStatus.value = draft?.status || 'DRAFT';
      draftAccountId.value = draft?.accountId || '';
      draftWebsite.value = draft?.website || '';
      draftObjective.value = draft?.objective || 'TRAFFIC';
      draftRegions.value = draft?.regions || '';
      draftAudience.value = draft?.audience || '';
      draftBudget.value = draft?.dailyBudget ?? '';
      draftHeadline.value = draft?.headline || '';
      draftAdText.value = draft?.adText || '';
      draftCta.value = draft?.callToAction || '';
    }

    async function refreshDrafts() {
      const response = await fetch('/api/clickru/campaign-drafts');
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || t("Could not read campaigns"));
      drafts = data.drafts || [];
      draftSelect.replaceChildren(new Option(t('New campaign'), ''));
      for (const draft of drafts) {
        const option = document.createElement('option');
        option.value = draft.id;
        option.textContent = draft.name + ' · ' + (draft.status === 'READY' ? t("ready to launch") : t("draft"));
        draftSelect.appendChild(option);
      }
      draftSelect.value = data.activeDraftId || '';
      fillDraft(drafts.find((draft) => draft.id === draftSelect.value));
      homeCampaigns.textContent = countLabel(drafts.length, 'campaign', 'campaigns', ['кампания', 'кампании', 'кампаний']);
    }

    draftSelect.addEventListener('change', async () => {
      const draft = drafts.find((candidate) => candidate.id === draftSelect.value);
      fillDraft(draft);
      if (!draft) {
        draftStatusMessage.textContent = t("New campaign");
        return;
      }
      try {
        await postJson('/api/clickru/campaign-drafts/active', { draftId: draft.id });
        draftStatusMessage.textContent = t("Selected: ") + draft.name;
      } catch (error) {
        draftStatusMessage.textContent = error instanceof Error ? error.message : t("Could not select the campaign");
      }
    });

    saveDraft.addEventListener('click', async () => {
      saveDraft.disabled = true;
      draftStatusMessage.textContent = t("Saving the campaign…");
      try {
        const data = await postJson('/api/clickru/campaign-drafts', {
          id: draftSelect.value || undefined,
          name: draftName.value,
          status: draftStatus.value,
          service: 'VK_ADS',
          accountId: draftAccountId.value ? Number(draftAccountId.value) : undefined,
          website: draftWebsite.value,
          objective: draftObjective.value,
          regions: draftRegions.value,
          audience: draftAudience.value,
          dailyBudget: Number(draftBudget.value),
          headline: draftHeadline.value,
          adText: draftAdText.value,
          callToAction: draftCta.value,
        });
        await refreshDrafts();
        draftSelect.value = data.draft.id;
        fillDraft(data.draft);
        draftStatusMessage.textContent = t("Campaign saved locally");
      } catch (error) {
        draftStatusMessage.textContent = error instanceof Error ? error.message : t("Could not save the campaign");
      } finally {
        saveDraft.disabled = false;
      }
    });

    Promise.all([refreshTokenStatus(), refreshYandexStatus(), refreshMicrosoftProfiles(), refreshTelegramStatus(), refreshMastodonAccounts(), refreshProfiles(), refreshDrafts(), refreshModuleStatuses()]).catch(() => {
      profileStatus.textContent = t("Could not read local settings");
      draftStatusMessage.textContent = t("Could not read local campaigns");
      yandexStatus.textContent = t("Could not read Yandex Direct settings");
      microsoftStatus.textContent = t("Could not read the Microsoft profile");
      telegramStatus.textContent = t("Could not read Telegram account status");
      mastodonStatus.textContent = t("Could not read Mastodon status");
      moduleStatusMessage.textContent = t("Could not read module status");
    });
  </script>
</body>
</html>`;
};

function sendJson(res: ServerResponse, status: number, payload: unknown): void {
  const t = settingsTranslator(res.getHeader("content-language") === "ru" ? "ru" : "en");
  const localized = payload && typeof payload === "object" && "error" in payload && typeof payload.error === "string"
    ? { ...payload, error: t(payload.error) }
    : payload;
  const body = JSON.stringify(localized);
  res.statusCode = status;
  res.setHeader("content-type", "application/json; charset=utf-8");
  res.setHeader("cache-control", "no-store");
  res.setHeader("x-content-type-options", "nosniff");
  res.end(body);
}

function sendHtml(res: ServerResponse, status: number, title: string, message: string): void {
  const language = res.getHeader("content-language") === "ru" ? "ru" : "en";
  const t = settingsTranslator(language);
  const escape = (value: string) => value.replace(/[&<>"']/g, (character) => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#39;",
  })[character] || character);
  res.statusCode = status;
  res.setHeader("content-type", "text/html; charset=utf-8");
  res.setHeader("cache-control", "no-store");
  res.setHeader("content-security-policy", "default-src 'none'; style-src 'unsafe-inline'; base-uri 'none'; form-action 'none'");
  res.setHeader("x-content-type-options", "nosniff");
  res.end(`<!doctype html><html lang="${language}"><meta charset="utf-8"><title>${escape(t(title))}</title><style>body{font-family:system-ui,sans-serif;background:#111827;color:#e5e7eb;max-width:680px;margin:60px auto;padding:24px}a{color:#93c5fd}</style><h1>${escape(t(title))}</h1><p>${escape(t(message))}</p><p><a href="/">${t("Back to AdsMCP")}</a></p></html>`);
}

function sendPage(res: ServerResponse, language: SettingsLanguage, selection: SettingsLanguage | "auto"): void {
  res.statusCode = 200;
  res.setHeader("content-type", "text/html; charset=utf-8");
  res.setHeader("cache-control", "no-store");
  res.setHeader("content-security-policy", "default-src 'none'; script-src 'nonce-local-settings'; style-src 'unsafe-inline'; img-src 'self' data:; connect-src 'self'; base-uri 'none'; form-action 'none'");
  res.setHeader("x-content-type-options", "nosniff");
  res.end(PAGE(csrfToken, language, selection));
}

function profilesPayload(): { activeProfileId?: string; profiles: ReturnType<typeof getClickruProfiles> } {
  return {
    activeProfileId: clickruProfilesStatus().activeProfileId,
    profiles: getClickruProfiles().map((profile) => ({ ...profile, innMasked: maskClickruInn(profile.inn) })),
  };
}

function campaignDraftsPayload(): {
  activeDraftId?: string;
  drafts: ReturnType<typeof getClickruCampaignDrafts>;
} {
  return {
    activeDraftId: clickruCampaignDraftsStatus().activeDraftId,
    drafts: getClickruCampaignDrafts(),
  };
}

function microsoftProfilesPayload() {
  const status = microsoftAdsProfilesStatus();
  const profiles = status.profiles.map((profile) => {
    const raw = getMicrosoftAdsProfile(profile.id);
    return { ...profile, clientId: raw?.clientId || "" };
  });
  return { ...status, profiles };
}

function mastodonAccountsPayload() {
  return {
    accounts: listMastodonAccounts(),
    callbackUri: mastodonLocalRedirectUri(runningUrl ? Number(new URL(runningUrl).port) : DEFAULT_PORT),
  };
}

function localMastodonCallbackUri(): string {
  const port = runningUrl ? Number(new URL(runningUrl).port) : DEFAULT_PORT;
  return mastodonLocalRedirectUri(port);
}

function isLoopbackRequest(req: IncomingMessage): boolean {
  const address = req.socket.remoteAddress;
  return address === "127.0.0.1" || address === "::1" || address === "::ffff:127.0.0.1";
}

async function readJson(req: IncomingMessage): Promise<Record<string, unknown>> {
  const chunks: Buffer[] = [];
  let size = 0;
  for await (const chunk of req) {
    const part = Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk);
    size += part.length;
    if (size > MAX_BODY) throw new Error("request body too large");
    chunks.push(part);
  }
  const parsed: unknown = JSON.parse(Buffer.concat(chunks).toString("utf8"));
  if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) throw new Error("JSON object required");
  return parsed as Record<string, unknown>;
}

async function route(req: IncomingMessage, res: ServerResponse): Promise<void> {
  res.setHeader("x-frame-options", "DENY");
  res.setHeader("referrer-policy", "no-referrer");
  // Binding to loopback alone does not prevent DNS rebinding: a remote site
  // can resolve its own hostname to 127.0.0.1 and read the page's CSRF token.
  const port = runningServer?.address();
  const localPort = typeof port === "object" && port ? port.port : DEFAULT_PORT;
  const allowedHosts = new Set([`${HOST}:${localPort}`, `localhost:${localPort}`]);
  if (!isLoopbackRequest(req) || !allowedHosts.has(req.headers.host || "")) {
    sendJson(res, 403, { error: "local settings host required" });
    return;
  }
  if (req.method !== "GET" && req.method !== "HEAD" && req.headers.origin) {
    const allowedOrigins = new Set([...allowedHosts].map((host) => `http://${host}`));
    if (!allowedOrigins.has(req.headers.origin)) {
      sendJson(res, 403, { error: "local settings origin required" });
      return;
    }
  }
  const url = new URL(req.url || "/", `http://${req.headers.host || HOST}`);
  const preference = resolveSettingsLanguage({
    query: url.searchParams.get("lang"),
    cookie: req.headers.cookie,
    acceptLanguage: req.headers["accept-language"],
  });
  res.setHeader("content-language", preference.language);
  res.setHeader("vary", "Accept-Language, Cookie");
  if (req.method === "GET" && (url.pathname === "/" || url.pathname === "/index.html")) {
    const choice = url.searchParams.get("lang");
    if (choice === "en" || choice === "ru" || choice === "auto") {
      res.setHeader("set-cookie", `${SETTINGS_LANGUAGE_COOKIE}=${choice === "auto" ? "" : choice}; Path=/; Max-Age=${choice === "auto" ? 0 : 31536000}; HttpOnly; SameSite=Lax`);
    }
    sendPage(res, preference.language, preference.selection);
    return;
  }
  if (req.method === "GET" && url.pathname === "/api/modules/status") {
    sendJson(res, 200, moduleDashboardStatus());
    return;
  }
  if (req.method === "POST" && url.pathname === "/api/modules/secrets") {
    if (req.headers["x-local-settings-token"] !== csrfToken) {
      sendJson(res, 403, { error: "local settings token required" });
      return;
    }
    const input = await readJson(req);
    if (typeof input.moduleId !== "string" || !input.moduleId.trim()) {
      sendJson(res, 400, { error: "moduleId is required" });
      return;
    }
    if (!input.values || typeof input.values !== "object" || Array.isArray(input.values)) {
      sendJson(res, 400, { error: "module credential values must be an object" });
      return;
    }
    const allowed = new Set([
      ...moduleDashboardCredentialKeys(input.moduleId).required,
      ...moduleDashboardCredentialKeys(input.moduleId).optional,
    ]);
    const values: Record<string, string> = {};
    for (const [key, value] of Object.entries(input.values as Record<string, unknown>)) {
      if (!allowed.has(key)) {
        sendJson(res, 400, { error: `credential key is not allowed for module ${input.moduleId}: ${key}` });
        return;
      }
      if (typeof value !== "string") {
        sendJson(res, 400, { error: `credential value must be a string: ${key}` });
        return;
      }
      values[key] = value;
    }
    sendJson(res, 200, saveModuleSecrets(input.moduleId, values));
    return;
  }
  if (req.method === "POST" && url.pathname === "/api/modules/check") {
    if (req.headers["x-local-settings-token"] !== csrfToken) {
      sendJson(res, 403, { error: "local settings token required" });
      return;
    }
    const input = await readJson(req);
    if (typeof input.moduleId !== "string" || !input.moduleId.trim()) {
      sendJson(res, 400, { error: "moduleId is required" });
      return;
    }
    try {
      const result = await Promise.race([
        listModuleTools(input.moduleId),
        new Promise<never>((_, reject) => setTimeout(() => reject(new Error("module runtime check timed out")), 30_000)),
      ]);
      sendJson(res, 200, {
        ok: true,
        moduleId: input.moduleId,
        toolCount: result.tools.length,
        checkedAt: new Date().toISOString(),
      });
    } catch (cause) {
      sendJson(res, 200, {
        ok: false,
        moduleId: input.moduleId,
        error: cause instanceof Error ? cause.message : "module runtime check failed",
        checkedAt: new Date().toISOString(),
      });
    }
    return;
  }
  if (req.method === "GET" && url.pathname === "/api/clickru/status") {
    sendJson(res, 200, clickruSettingsStatus());
    return;
  }
  if (req.method === "GET" && url.pathname === "/api/yandex/status") {
    sendJson(res, 200, yandexDirectSettingsStatus());
    return;
  }
  if (req.method === "POST" && url.pathname === "/api/yandex/oauth/start") {
    if (req.headers["x-local-settings-token"] !== csrfToken) {
      sendJson(res, 403, { error: "local settings token required" });
      return;
    }
    const input = await readJson(req);
    if (typeof input.clientId !== "string") {
      sendJson(res, 400, { error: "Yandex OAuth Client ID is required" });
      return;
    }
    const result = yandexDirectAuthorizationUrl({
      clientId: input.clientId,
      clientLogin: typeof input.clientLogin === "string" ? input.clientLogin : undefined,
    });
    sendJson(res, 200, result);
    return;
  }
  if (req.method === "POST" && url.pathname === "/api/yandex/token") {
    if (req.headers["x-local-settings-token"] !== csrfToken) {
      sendJson(res, 403, { error: "local settings token required" });
      return;
    }
    const input = await readJson(req);
    if (typeof input.token !== "string") {
      sendJson(res, 400, { error: "Yandex OAuth token is required" });
      return;
    }
    const status = saveYandexDirectToken({
      token: input.token,
      clientId: typeof input.clientId === "string" ? input.clientId : undefined,
      clientLogin: typeof input.clientLogin === "string" ? input.clientLogin : undefined,
    });
    sendJson(res, 200, status);
    return;
  }
  if (req.method === "POST" && url.pathname === "/api/yandex/check") {
    if (req.headers["x-local-settings-token"] !== csrfToken) {
      sendJson(res, 403, { error: "local settings token required" });
      return;
    }
    sendJson(res, 200, await checkYandexDirectConnection());
    return;
  }
  if (req.method === "GET" && url.pathname === "/api/telegram/account/status") {
    sendJson(res, 200, await runTelegramAccountStatus());
    return;
  }
  if (req.method === "POST" && url.pathname === "/api/telegram/account/auth") {
    if (req.headers["x-local-settings-token"] !== csrfToken) {
      sendJson(res, 403, { error: "local settings token required" });
      return;
    }
    const input = await readJson(req);
    const supplied = ["phone", "code", "password"].filter((key) => input[key] !== undefined);
    if (input.qr === true) {
      if (supplied.length > 0) {
        sendJson(res, 400, { error: "QR login cannot be combined with phone, code or password" });
        return;
      }
      sendJson(res, 200, await runTelegramAccountAuth({ qr: true }));
      return;
    }
    if (supplied.length !== 1 || !supplied.every((key) => typeof input[key] === "string")) {
      sendJson(res, 400, { error: "pass exactly one string: phone, code or password" });
      return;
    }
    const result = await runTelegramAccountAuth({
      phone: typeof input.phone === "string" ? input.phone.trim() : undefined,
      code: typeof input.code === "string" ? input.code.trim() : undefined,
      password: typeof input.password === "string" ? input.password : undefined,
    });
    sendJson(res, 200, result);
    return;
  }
  if (req.method === "GET" && url.pathname === "/api/mastodon/accounts") {
    sendJson(res, 200, mastodonAccountsPayload());
    return;
  }
  if (req.method === "POST" && url.pathname === "/api/mastodon/oauth/start") {
    if (req.headers["x-local-settings-token"] !== csrfToken) {
      sendJson(res, 403, { error: "local settings token required" });
      return;
    }
    const input = await readJson(req);
    if (typeof input.instanceUrl !== "string" || typeof input.accountId !== "string") {
      sendJson(res, 400, { error: "Mastodon instanceUrl and accountId are required" });
      return;
    }
    const result = await startMastodonAuthorization({
      instanceUrl: input.instanceUrl,
      accountId: input.accountId,
      redirectUri: localMastodonCallbackUri(),
    });
    sendJson(res, 200, result);
    return;
  }
  if (req.method === "GET" && url.pathname === "/api/mastodon/oauth/callback") {
    if (!isLoopbackRequest(req)) {
      sendHtml(res, 403, "Mastodon OAuth запрещён", "Callback доступен только локальному браузеру на 127.0.0.1.");
      return;
    }
    const error = url.searchParams.get("error");
    const errorDescription = url.searchParams.get("error_description");
    if (error) {
      sendHtml(res, 400, "Mastodon OAuth не завершён", errorDescription || error);
      return;
    }
    const state = url.searchParams.get("state") || "";
    const code = url.searchParams.get("code") || "";
    if (!state || !code) {
      sendHtml(res, 400, "Mastodon OAuth не завершён", "Mastodon не вернул state или authorization code.");
      return;
    }
    try {
      await completeMastodonAuthorization(state, code);
      res.statusCode = 302;
      res.setHeader("location", "/?mastodon=connected#integrations");
      res.end();
    } catch (cause) {
      const message = cause instanceof Error ? cause.message : "Mastodon OAuth failed";
      sendHtml(res, 400, "Не удалось подключить Mastodon", message);
    }
    return;
  }
  if (req.method === "GET" && url.pathname === "/api/microsoft/profiles") {
    sendJson(res, 200, microsoftProfilesPayload());
    return;
  }
  if (req.method === "GET" && url.pathname === "/api/microsoft/oauth/start") {
    const profileId = url.searchParams.get("profileId") || "";
    const profile = getMicrosoftAdsProfile(profileId);
    if (!profile) {
      sendHtml(res, 400, "Профиль Microsoft не найден", "Сначала сохрани профиль с OAuth Client ID.");
      return;
    }
    for (const [state, pending] of microsoftOAuthStates) {
      if (Date.now() - pending.createdAt > 10 * 60_000) microsoftOAuthStates.delete(state);
    }
    const oauth = createMicrosoftOAuthState();
    microsoftOAuthStates.set(oauth.state, {
      profileId: profile.id,
      clientId: profile.clientId,
      codeVerifier: oauth.codeVerifier,
      createdAt: Date.now(),
    });
    res.statusCode = 302;
    res.setHeader("location", microsoftAuthorizationUrl({
      clientId: profile.clientId,
      state: oauth.state,
      codeChallenge: oauth.codeChallenge,
    }));
    res.end();
    return;
  }
  if (req.method === "GET" && url.pathname === "/api/microsoft/oauth/callback") {
    const error = url.searchParams.get("error");
    const errorDescription = url.searchParams.get("error_description");
    if (error) {
      sendHtml(res, 400, "Microsoft OAuth не завершён", errorDescription || error);
      return;
    }
    const state = url.searchParams.get("state") || "";
    const code = url.searchParams.get("code") || "";
    const pending = microsoftOAuthStates.get(state);
    microsoftOAuthStates.delete(state);
    if (!pending || Date.now() - pending.createdAt > 10 * 60_000) {
      sendHtml(res, 400, "Microsoft OAuth истёк", "Запусти подключение ещё раз из локальной страницы AdsMCP.");
      return;
    }
    if (!code) {
      sendHtml(res, 400, "Microsoft OAuth не завершён", "Microsoft не вернул authorization code.");
      return;
    }
    try {
      await exchangeMicrosoftOAuthCode({
        profileId: pending.profileId,
        clientId: pending.clientId,
        code,
        codeVerifier: pending.codeVerifier,
      });
      res.statusCode = 302;
      res.setHeader("location", "/?microsoft=connected");
      res.end();
    } catch (cause) {
      const message = cause instanceof Error ? cause.message : "Microsoft OAuth failed";
      sendHtml(res, 400, "Не удалось подключить Microsoft Advertising", message);
    }
    return;
  }
  if (req.method === "POST" && url.pathname === "/api/microsoft/profiles") {
    if (req.headers["x-local-settings-token"] !== csrfToken) {
      sendJson(res, 403, { error: "local settings token required" });
      return;
    }
    const input = await readJson(req);
    if (typeof input.name !== "string" || typeof input.clientId !== "string") {
      sendJson(res, 400, { error: "Microsoft profile name and clientId are required" });
      return;
    }
    const profile = saveMicrosoftAdsProfile({
      id: typeof input.id === "string" ? input.id : undefined,
      name: input.name,
      clientId: input.clientId,
      developerToken: typeof input.developerToken === "string" ? input.developerToken : undefined,
    });
    sendJson(res, 200, { profile: { id: profile.id, name: profile.name, clientId: profile.clientId }, ...microsoftProfilesPayload() });
    return;
  }
  if (req.method === "POST" && url.pathname === "/api/microsoft/profiles/active") {
    if (req.headers["x-local-settings-token"] !== csrfToken) {
      sendJson(res, 403, { error: "local settings token required" });
      return;
    }
    const input = await readJson(req);
    if (typeof input.profileId !== "string") {
      sendJson(res, 400, { error: "profileId is required" });
      return;
    }
    const profile = setActiveMicrosoftAdsProfile(input.profileId);
    sendJson(res, 200, { profile: { id: profile.id, name: profile.name, clientId: profile.clientId }, ...microsoftProfilesPayload() });
    return;
  }
  if (req.method === "GET" && url.pathname === "/api/clickru/profiles") {
    sendJson(res, 200, profilesPayload());
    return;
  }
  if (req.method === "GET" && url.pathname === "/api/clickru/campaign-drafts") {
    sendJson(res, 200, campaignDraftsPayload());
    return;
  }
  if (req.method === "POST" && url.pathname === "/api/clickru/token") {
    if (req.headers["x-local-settings-token"] !== csrfToken) {
      sendJson(res, 403, { error: "local settings token required" });
      return;
    }
    const input = await readJson(req);
    if (typeof input.token !== "string") {
      sendJson(res, 400, { error: "token is required" });
      return;
    }
    sendJson(res, 200, saveClickruToken(input.token));
    return;
  }
  if (req.method === "POST" && url.pathname === "/api/clickru/profiles") {
    if (req.headers["x-local-settings-token"] !== csrfToken) {
      sendJson(res, 403, { error: "local settings token required" });
      return;
    }
    const input = await readJson(req);
    if (
      typeof input.name !== "string" ||
      typeof input.inn !== "string" ||
      typeof input.lastName !== "string" ||
      typeof input.firstName !== "string"
    ) {
      sendJson(res, 400, { error: "profile name, INN, last name and first name are required" });
      return;
    }
    const rawType = typeof input.type === "string" ? input.type : "PERSON";
    if (!["PERSON", "INDIVIDUAL", "BUSINESS"].includes(rawType)) {
      sendJson(res, 400, { error: "unsupported profile type" });
      return;
    }
    const profile = saveClickruProfile({
      id: typeof input.id === "string" ? input.id : undefined,
      name: input.name,
      type: rawType as ClickruProfileType,
      inn: input.inn,
      lastName: input.lastName,
      firstName: input.firstName,
      middleName: typeof input.middleName === "string" ? input.middleName : undefined,
      phone: typeof input.phone === "string" ? input.phone : undefined,
    });
    sendJson(res, 200, { profile, ...profilesPayload() });
    return;
  }
  if (req.method === "POST" && url.pathname === "/api/clickru/profiles/active") {
    if (req.headers["x-local-settings-token"] !== csrfToken) {
      sendJson(res, 403, { error: "local settings token required" });
      return;
    }
    const input = await readJson(req);
    if (typeof input.profileId !== "string") {
      sendJson(res, 400, { error: "profileId is required" });
      return;
    }
    const profile = setActiveClickruProfile(input.profileId);
    sendJson(res, 200, { profile, ...profilesPayload() });
    return;
  }
  if (req.method === "POST" && url.pathname === "/api/clickru/campaign-drafts") {
    if (req.headers["x-local-settings-token"] !== csrfToken) {
      sendJson(res, 403, { error: "local settings token required" });
      return;
    }
    const input = await readJson(req);
    if (
      typeof input.name !== "string" ||
      typeof input.website !== "string" ||
      typeof input.regions !== "string" ||
      typeof input.audience !== "string" ||
      typeof input.headline !== "string" ||
      typeof input.adText !== "string" ||
      typeof input.callToAction !== "string" ||
      typeof input.dailyBudget !== "number"
    ) {
      sendJson(res, 400, { error: "campaign name, website, audience, ad text and daily budget are required" });
      return;
    }
    const rawStatus = typeof input.status === "string" ? input.status : "DRAFT";
    if (rawStatus !== "DRAFT" && rawStatus !== "READY") {
      sendJson(res, 400, { error: "unsupported campaign status" });
      return;
    }
    const rawObjective = typeof input.objective === "string" ? input.objective : "TRAFFIC";
    if (rawObjective !== "TRAFFIC") {
      sendJson(res, 400, { error: "unsupported campaign objective" });
      return;
    }
    const draft = saveClickruCampaignDraft({
      id: typeof input.id === "string" ? input.id : undefined,
      name: input.name,
      status: rawStatus as ClickruCampaignStatus,
      service: input.service === "VK_ADS" ? "VK_ADS" : undefined,
      accountId: typeof input.accountId === "number" ? input.accountId : undefined,
      website: input.website,
      objective: rawObjective,
      regions: input.regions,
      audience: input.audience,
      dailyBudget: input.dailyBudget,
      headline: input.headline,
      adText: input.adText,
      callToAction: input.callToAction,
    });
    sendJson(res, 200, { draft, ...campaignDraftsPayload() });
    return;
  }
  if (req.method === "POST" && url.pathname === "/api/clickru/campaign-drafts/active") {
    if (req.headers["x-local-settings-token"] !== csrfToken) {
      sendJson(res, 403, { error: "local settings token required" });
      return;
    }
    const input = await readJson(req);
    if (typeof input.draftId !== "string") {
      sendJson(res, 400, { error: "draftId is required" });
      return;
    }
    const draft = setActiveClickruCampaignDraft(input.draftId);
    sendJson(res, 200, { draft, ...campaignDraftsPayload() });
    return;
  }
  if (req.method === "POST" && url.pathname === "/api/clickru/campaign-drafts/status") {
    if (req.headers["x-local-settings-token"] !== csrfToken) {
      sendJson(res, 403, { error: "local settings token required" });
      return;
    }
    const input = await readJson(req);
    if (typeof input.draftId !== "string" || typeof input.status !== "string") {
      sendJson(res, 400, { error: "draftId and status are required" });
      return;
    }
    if (input.status !== "DRAFT" && input.status !== "READY") {
      sendJson(res, 400, { error: "unsupported campaign status" });
      return;
    }
    const draft = setClickruCampaignDraftStatus(input.draftId, input.status as ClickruCampaignStatus);
    sendJson(res, 200, { draft, ...campaignDraftsPayload() });
    return;
  }
  sendJson(res, 404, { error: "route not found" });
}

export function startClickruSettingsServer(port = DEFAULT_PORT): Promise<{ url: string; alreadyRunning: boolean }> {
  if (runningServer && runningUrl) return Promise.resolve({ url: runningUrl, alreadyRunning: true });
  const server = createServer((req, res) => {
    route(req, res).catch((cause: unknown) => {
      const message = cause instanceof Error ? cause.message : "request failed";
      sendJson(res, message === "request body too large" ? 413 : 400, { error: message });
    });
  });
  return new Promise((resolve, reject) => {
    const onError = (error: Error) => {
      server.off("listening", onListening);
      reject(error);
    };
    const onListening = () => {
      server.off("error", onError);
      const address = server.address();
      const actualPort = typeof address === "object" && address ? address.port : port;
      runningServer = server;
      runningUrl = `http://${HOST}:${actualPort}/`;
      resolve({ url: runningUrl, alreadyRunning: false });
    };
    server.once("error", onError);
    server.once("listening", onListening);
    server.listen(port, HOST);
  });
}

export async function restartClickruSettingsServer(port = DEFAULT_PORT): Promise<{ url: string; alreadyRunning: boolean }> {
  await stopClickruSettingsServer();
  return startClickruSettingsServer(port);
}

export function stopClickruSettingsServer(): Promise<void> {
  if (!runningServer) return Promise.resolve();
  const server = runningServer;
  runningServer = undefined;
  runningUrl = undefined;
  server.closeAllConnections();
  return new Promise((resolve) => server.close(() => resolve()));
}
