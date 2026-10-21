import assert from "node:assert/strict";
import { rmSync } from "node:fs";
import { spawn } from "node:child_process";
import { join } from "node:path";

const dataDir = join(process.cwd(), "data", "free-use-smoke");
rmSync(dataDir, { recursive: true, force: true });
const child = spawn(process.execPath, ["dist/index.js"], {
  cwd: process.cwd(),
  env: { ...process.env, ADS_MCP_DATA: dataDir, ADSMCP_UPDATE_ENABLED: "false" },
  stdio: ["pipe", "pipe", "pipe"],
});

let buffer = Buffer.alloc(0);
const pending = new Map();

function parseOutput() {
  while (true) {
    const newline = buffer.indexOf(0x0a);
    if (newline < 0) return;
    const body = JSON.parse(buffer.subarray(0, newline).toString("utf8"));
    buffer = buffer.subarray(newline + 1);
    if (body.id !== undefined && pending.has(body.id)) {
      const { resolve, reject, timer } = pending.get(body.id);
      clearTimeout(timer);
      pending.delete(body.id);
      if (body.error) reject(new Error(JSON.stringify(body.error)));
      else resolve(body);
    }
  }
}

child.stdout.on("data", (chunk) => {
  buffer = Buffer.concat([buffer, chunk]);
  parseOutput();
});
child.on("error", (error) => {
  for (const { reject, timer } of pending.values()) {
    clearTimeout(timer);
    reject(error);
  }
  pending.clear();
});

function send(message) {
  const json = JSON.stringify(message);
  child.stdin.write(`${json}\n`);
}

function request(id, method, params = {}) {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => {
      pending.delete(id);
      reject(new Error(`Timed out waiting for ${method}`));
    }, 10_000);
    pending.set(id, { resolve, reject, timer });
    send({ jsonrpc: "2.0", id, method, params });
  });
}

try {
  const initialized = await request(1, "initialize", {
    protocolVersion: "2025-03-26",
    capabilities: {},
    clientInfo: { name: "ads-mcp-free-use-smoke", version: "1.0.0" },
  });
  assert.equal(initialized.result.serverInfo.name, "ads-mcp");
  send({ jsonrpc: "2.0", method: "notifications/initialized" });

  const listed = await request(2, "tools/list");
  const toolNames = listed.result.tools.map((tool) => tool.name);
  assert.ok(toolNames.includes("ads_free_use_rules"));
  assert.ok(toolNames.includes("ads_free_use_accept"));

  const blocked = await request(3, "tools/call", { name: "ads_project_list", arguments: {} });
  assert.equal(JSON.parse(blocked.result.content[0].text).error, "FREE_USE_ACCEPTANCE_REQUIRED");

  const rules = await request(4, "tools/call", { name: "ads_free_use_rules", arguments: {} });
  const rulesPayload = JSON.parse(rules.result.content[0].text);
  assert.equal(rulesPayload.rules_version, "1.0");
  assert.equal(rulesPayload.accepted, false);
  assert.match(rulesPayload.document, /AdsMCP Free Use Rules/);

  const accepted = await request(5, "tools/call", {
    name: "ads_free_use_accept",
    arguments: { confirm: true, rules_version: "1.0" },
  });
  assert.equal(JSON.parse(accepted.result.content[0].text).accepted, true);

  const projects = await request(6, "tools/call", { name: "ads_project_list", arguments: {} });
  assert.ok(Array.isArray(JSON.parse(projects.result.content[0].text).projects));
  console.log("AdsMCP free-use acceptance smoke test passed");
} finally {
  child.kill();
  await new Promise((resolve) => {
    if (child.exitCode !== null) resolve();
    else child.once("exit", resolve);
  });
  rmSync(dataDir, { recursive: true, force: true });
}
