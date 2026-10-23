import assert from "node:assert/strict";
import { mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { request } from "node:http";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { Script } from "node:vm";

const dataDir = mkdtempSync(join(tmpdir(), "adsmcp-settings-smoke-"));
process.env.ADS_MCP_DATA = dataDir;
process.env.ADS_MCP_MODULES_FILE = join(dataDir, "modules.json");
writeFileSync(process.env.ADS_MCP_MODULES_FILE, JSON.stringify({
  modules: [{
    id: "email",
    provider: "email",
    label: "Email MCP",
    transport: "stdio",
    command: "node",
    args: ["-e", ""],
    inherit_env: ["MCP_EMAIL_ADDRESS"],
    allow_tools: ["list_accounts"],
  }],
}, null, 2));
const { startClickruSettingsServer, stopClickruSettingsServer } = await import("../dist/clickru-settings-server.js");

function call(url, { method = "GET", headers = {}, path = "/", body } = {}) {
  return new Promise((resolve, reject) => {
    const req = request(new URL(path, url), { method, headers }, (res) => {
      let text = "";
      res.setEncoding("utf8");
      res.on("data", (chunk) => { text += chunk; });
      res.on("end", () => resolve({ status: res.statusCode, headers: res.headers, text }));
    });
    req.on("error", reject);
    req.end(body);
  });
}

try {
  const { url } = await startClickruSettingsServer(0);
  const page = await call(url);
  assert.equal(page.status, 200);
  assert.equal(page.headers['content-language'], 'en');
  assert.ok(page.text.includes('<html lang="en">'));
  assert.ok(page.text.includes('Local dashboard for advertising connections'));
  assert.match(page.text, /<img class="brand-mark" src="data:image\/png;base64,[A-Za-z0-9+/=]+" alt="AdsMCP logo"/, 'settings dashboard embeds the branding logo');
  assert.ok(page.text.includes('data-home-settings'), 'Home links to the settings flow');
  assert.ok(page.text.includes('data-page="modules"'), 'dashboard exposes the modules page');
  assert.ok(page.text.includes('id="moduleRows"'), 'dashboard exposes the module status table');
  assert.equal((page.text.match(/class="panel integration-group"/g) || []).length, 5, 'all integration groups are present');
  assert.equal((page.text.match(/aria-expanded="false"/g) || []).length, 5, 'integration groups start collapsed');
  assert.equal((page.text.match(/class="integration-body" hidden/g) || []).length, 5, 'integration bodies start hidden');
  assert.match(page.text, /const integrationOrder = \['clickru', 'yandex', 'telegram', 'microsoft', 'mastodon'\]/,
    'integration groups are ordered by the dashboard popularity ranking');
  assert.ok(page.text.includes('requestedIntegrationGroup = \'clickru\''), 'Home expands the first settings group');
  const pageScript = (html) => html.match(/<script[^>]*>([\s\S]*?)<\/script>/)?.[1];
  new Script(pageScript(page.text));
  assert.equal(page.headers["x-frame-options"], "DENY");
  const nonce = page.text.match(/const nonce = "([a-f0-9]+)"/)?.[1];
  assert.ok(nonce, "settings page exposes the local CSRF nonce");
  for (const [preferences, language] of [
    ['ru-RU,ru;q=0.9,en;q=0.8', 'ru'],
    ['en-US,en;q=0.9,ru;q=0.8', 'en'],
    ['de-DE,ru;q=0.8,en;q=0.5', 'ru'],
    ['ru;q=0,en;q=0.5', 'en'],
    ['ru;q=0.2,en;q=0.9', 'en'],
    ['fr-FR,zh-CN;q=0.9', 'en'],
    ['ru;q=invalid,en;q=0.5', 'en'],
    ['*', 'en'],
  ]) {
    const localized = await call(url, { headers: { 'Accept-Language': preferences } });
    assert.equal(localized.headers['content-language'], language, preferences);
    assert.ok(localized.text.includes(`<html lang="${language}">`));
    new Script(pageScript(localized.text));
    assert.ok(localized.headers.vary.includes('Accept-Language'));
  }
  const russian = await call(url, { path: '/?lang=ru', headers: { 'Accept-Language': 'en-US' } });
  assert.equal(russian.headers['content-language'], 'ru');
  assert.ok(russian.text.includes('Локальная панель рекламных подключений'));
  assert.ok(russian.text.includes('<option value="ru" selected>'));
  assert.ok(russian.headers['set-cookie'][0].includes('HttpOnly; SameSite=Lax'));
  const russianCookie = russian.headers['set-cookie'][0].split(';')[0];
  const persisted = await call(url, { headers: { Cookie: russianCookie, 'Accept-Language': 'en' } });
  assert.equal(persisted.headers['content-language'], 'ru', 'saved selection overrides the browser');
  const english = await call(url, { path: '/?lang=en', headers: { Cookie: russianCookie, 'Accept-Language': 'ru' } });
  assert.equal(english.headers['content-language'], 'en', 'explicit choice overrides the cookie');
  const automatic = await call(url, { path: '/?lang=auto', headers: { Cookie: russianCookie, 'Accept-Language': 'en' } });
  assert.equal(automatic.headers['content-language'], 'en');
  assert.ok(automatic.headers['set-cookie'][0].includes('Max-Age=0'));
  assert.ok(automatic.text.includes('<option value="auto" selected>'));
  const invalid = await call(url, { path: '/?lang=%3Cscript%3E', headers: { 'Accept-Language': 'xx' } });
  assert.equal(invalid.headers['content-language'], 'en', 'unsupported language falls back to English');
  const localHost = new URL(url).host;
  assert.equal((await call(url, { headers: { Host: localHost.replace("127.0.0.1", "localhost") } })).status, 200);
  for (const host of ["attacker.invalid", `attacker.invalid:${new URL(url).port}`, "127.0.0.1:1"]) {
    for (const path of ["/", "/api/clickru/status"]) {
      const denied = await call(url, { path, headers: { Host: host } });
      assert.equal(denied.status, 403);
      assert.ok(!denied.text.includes(nonce));
    }
  }
  const post = { method: "POST", path: "/api/clickru/token", body: "{}" };
  assert.equal((await call(url, post)).status, 403, "missing CSRF token is rejected");
  assert.equal((await call(url, {
    ...post, headers: { Origin: "https://attacker.invalid", "x-local-settings-token": nonce },
  })).status, 403, "foreign origins are rejected even with the nonce");
  assert.equal((await call(url, {
    ...post, headers: { Origin: new URL(url).origin, "x-local-settings-token": nonce },
  })).status, 400, "same-origin request reaches validation without saving a token");
  assert.equal((await call(url, { path: "/api/mastodon/oauth/callback" })).status, 400,
    "OAuth callbacks remain reachable without an Origin header");
  const callback = await call(url, { path: '/api/mastodon/oauth/callback', headers: { Cookie: russianCookie } });
  assert.ok(callback.text.includes('Mastodon OAuth не завершён'));
  assert.ok(callback.text.includes('Вернуться в AdsMCP'));
  const englishCallback = await call(url, { path: '/api/mastodon/oauth/callback' });
  assert.ok(englishCallback.text.includes('Mastodon OAuth incomplete'));
  const invalidToken = await call(url, {
    ...post, headers: { Cookie: russianCookie, 'x-local-settings-token': nonce },
  });
  assert.equal(JSON.parse(invalidToken.text).error, 'Нужен токен');
  const invalidYandex = await call(url, {
    ...post, path: '/api/yandex/oauth/start', body: JSON.stringify({ clientId: 'invalid' }),
    headers: { 'Accept-Language': 'en', 'x-local-settings-token': nonce },
  });
  assert.equal(JSON.parse(invalidYandex.text).error, 'Yandex OAuth Client ID must contain 32 hexadecimal characters');
  const moduleStatus = await call(url, { path: "/api/modules/status" });
  assert.equal(moduleStatus.status, 200);
  const modulePayload = JSON.parse(moduleStatus.text);
  assert.equal(modulePayload.modules.length, 1);
  assert.ok(modulePayload.secretsPath.endsWith("secrets\\module-secrets.json") || modulePayload.secretsPath.endsWith("secrets/module-secrets.json"));
  assert.equal(modulePayload.modules[0].credentials.find((item) => item.key === "MCP_EMAIL_ADDRESS").configured, false);
  assert.equal((await call(url, {
    method: "POST",
    path: "/api/modules/secrets",
    body: JSON.stringify({ moduleId: "email", values: { MCP_EMAIL_ADDRESS: "test@example.com" } }),
  })).status, 403, "module secrets require CSRF");
  const savedModuleSecret = await call(url, {
    method: "POST",
    path: "/api/modules/secrets",
    body: JSON.stringify({ moduleId: "email", values: { MCP_EMAIL_ADDRESS: "test@example.com" } }),
    headers: { Origin: new URL(url).origin, "x-local-settings-token": nonce },
  });
  assert.equal(savedModuleSecret.status, 200);
  assert.deepEqual(JSON.parse(savedModuleSecret.text).savedKeys, ["MCP_EMAIL_ADDRESS"]);
  assert.ok(!savedModuleSecret.text.includes("test@example.com"), "save response never returns the secret");
  const savedStatus = JSON.parse((await call(url, { path: "/api/modules/status" })).text);
  const savedCredential = savedStatus.modules[0].credentials.find((item) => item.key === "MCP_EMAIL_ADDRESS");
  assert.equal(savedCredential.source, "module_file");
  assert.equal(savedCredential.configured, true);
  assert.ok(!JSON.stringify(savedStatus).includes("test@example.com"), "status never returns the secret");
  console.log("AdsMCP settings security and language smoke tests passed");
} finally {
  await stopClickruSettingsServer();
  const { closeDb } = await import("../dist/db.js");
  closeDb();
  rmSync(dataDir, { recursive: true, force: true });
}
