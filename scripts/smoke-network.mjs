import assert from "node:assert/strict";
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

const dataDir = mkdtempSync(join(tmpdir(), "ads-network-smoke-"));
const port = 18787;
process.env.ADS_MCP_DATA = dataDir;
process.env.ADS_NETWORK_HOST = "127.0.0.1";
process.env.ADS_NETWORK_PORT = String(port);
process.env.ADS_NETWORK_WRITE_TOKEN = "smoke-token";
process.env.ADS_NETWORK_URL = `http://127.0.0.1:${port}`;

const { createNetworkServer } = await import("../server/dist/http.js");
const { closeDb } = await import("../server/dist/db.js");
const networkClient = await import("../dist/network/client.js");
const server = createNetworkServer();

await new Promise((resolve) => server.listen(port, "127.0.0.1", resolve));

async function call(path, options = {}) {
  const response = await fetch(`http://127.0.0.1:${port}${path}`, {
    ...options,
    headers: {
      "content-type": "application/json",
      ...(options.headers || {}),
    },
  });
  const payload = await response.json();
  assert.equal(response.ok, true, JSON.stringify(payload));
  return payload;
}

function json(body) {
  return { body: JSON.stringify(body) };
}

try {
  assert.equal((await call("/health")).ok, true);
  assert.equal((await networkClient.networkStatus()).service, "ads-network-relay");

  const platform = await call("/v1/platforms/report", {
    method: "POST",
    ...json({
      provider: "smoke-provider",
      name: "Smoke Ads",
      region: "global",
      capabilities: ["metrics.read"],
    }),
  });
  assert.equal(platform.platform.status, "pending");

  const headers = { "x-ads-network-token": "smoke-token" };
  await call(`/v1/admin/platforms/${platform.platform.id}/status`, {
    method: "POST",
    headers,
    ...json({ status: "active" }),
  });
  assert.equal((await call("/v1/platforms")).platforms.length, 1);

  const placement = await call("/v1/inventory/placements", {
    method: "POST",
    headers,
    ...json({
      publisher_ref: "publisher-smoke",
      name: "Smoke newsletter",
      channel_type: "newsletter",
      regions: ["global"],
      formats: ["native"],
      pricing: { model: "cpm", amount: 5, currency: "USD" },
    }),
  });
  await call(`/v1/admin/inventory/${placement.placement.id}/status`, {
    method: "POST",
    headers,
    ...json({ status: "active" }),
  });
  assert.equal((await call("/v1/inventory")).inventory.length, 1);

  const conversionBody = {
    dedupe_key: "smoke-conversion-1",
    node_ref: "node-smoke",
    campaign_ref: "campaign-opaque",
    period: "2026-10-07",
    event_type: "purchase",
    count: 1,
    value: 100,
    currency: "USD",
  };
  assert.equal((await call("/v1/conversions/report", { method: "POST", ...json(conversionBody) })).duplicate, false);
  assert.equal((await call("/v1/conversions/report", { method: "POST", ...json(conversionBody) })).duplicate, true);

  await call("/v1/profiles", {
    method: "POST",
    headers,
    ...json({ display_name: "Smoke node", kind: "publisher", regions: ["global"] }),
  });
  const manifest = await call("/v1/sync/manifest", { headers });
  assert.equal(manifest.platforms.length, 1);
  assert.equal(manifest.inventory.length, 1);
  assert.equal(manifest.profiles.length, 1);
  console.log("Ads Network Relay smoke test passed");
} finally {
  await new Promise((resolve) => server.close(resolve));
  closeDb();
  rmSync(dataDir, { recursive: true, force: true });
}
