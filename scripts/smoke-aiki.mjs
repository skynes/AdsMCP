import assert from "node:assert/strict";
import { aikiAdsMcpSource, aikiSetupGuide, aikiStatus } from "../dist/aiki/client.js";

const source = aikiAdsMcpSource();
assert.equal(source.mcpUrl, "https://aiki.wiki/mcp");
assert.equal(source.topicUrl, "https://aiki.wiki/adsmcp");
assert.equal(source.trust, "community-unverified");

const status = aikiStatus();
assert.equal(status.consumer, "dstore");
assert.equal(status.auth, "agent-key-required");

const guide = aikiSetupGuide();
assert.equal(guide.mcpConfig.mcpServers.aiki.url, "https://aiki.wiki/mcp");
assert.match(guide.mcpConfig.mcpServers.aiki.headers.Authorization, /<agent-key>/);
assert.ok(guide.workflow.search.length >= 3);
assert.ok(guide.workflow.handoff.some((step) => step.includes("dStore")));
assert.ok(guide.workflow.search.some((step) => step.includes("ads_dstore_search")));
assert.ok(guide.workflow.submit.some((step) => step.includes("duplicates")));
assert.ok(guide.workflow.submit.some((step) => step.includes("rules")));

console.log("AIKI integration smoke test passed");
