import assert from "node:assert/strict";

process.env.OPENAI_ADS_API_KEY = "test-openai-ads-key";
process.env.OPENAI_ADS_BASE_URL = "https://ads.example.test/v1";

const requests = [];
globalThis.fetch = async (input, init = {}) => {
  requests.push({
    url: String(input),
    method: init.method,
    headers: init.headers,
  });
  return new Response(JSON.stringify({ id: "adacct_test", status: "active" }), {
    status: 200,
    headers: { "content-type": "application/json" },
  });
};

const { openaiAdsGet } = await import("../dist/integrations/openai-ads.js");
const account = await openaiAdsGet({
  path: "/ad_account",
  query: { fields: ["id", "status"], limit: 1 },
});

assert.deepEqual(account, { id: "adacct_test", status: "active" });
assert.equal(requests.length, 1);
assert.equal(requests[0].url, "https://ads.example.test/v1/ad_account?fields=id&fields=status&limit=1");
assert.equal(requests[0].method, "GET");
assert.equal(requests[0].headers.Authorization, "Bearer test-openai-ads-key");
assert.equal(requests[0].headers.Accept, "application/json");

await assert.rejects(() => openaiAdsGet({ path: "/campaigns?write=true" }), /without a query string/);
delete process.env.OPENAI_ADS_API_KEY;
await assert.rejects(() => openaiAdsGet({ path: "/ad_account" }), /OPENAI_ADS_API_KEY is not configured/);

console.log("OpenAI Ads read-only client smoke test passed");
