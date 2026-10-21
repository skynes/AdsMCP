import assert from "node:assert/strict";

const sample = {
  id: 46125,
  title: "Котейная тележка",
  url: "https://t.me/catheyco",
  icon: "https://cdn.dstore.one/icons/46125.png",
  platform: "telegram",
  tags: ["gaming"],
  description: "A channel",
  useCase: "For gamers",
  lang: ["ru"],
  age_rating: "0+",
  developer: { name: "Катя" },
  IAP: false,
  advertising: {
    schemaVersion: "1.0",
    status: "available",
    source: {
      url: "https://telegra.ph/example-media-kit-10-22",
      authority: "official",
      foundAt: "2026-10-22T00:00:00Z",
      checkedAt: "2026-10-22T00:00:00Z",
    },
    placements: [{
      id: "post-24h",
      format: "post",
      pricingModel: "fixed",
      price: 15000,
      currency: "RUB",
      availability: "unknown",
      sourceUrl: "https://telegra.ph/example-media-kit-10-22",
    }],
  },
  communitySource: {
    provider: "aiki",
    topicUrl: "https://aiki.wiki/adsmcp",
    replyId: "reply-1",
    verification: "verified",
  },
};

const calls = [];
globalThis.fetch = async (url) => {
  calls.push(String(url));
  if (String(url).endsWith("/46125.json")) return new Response(JSON.stringify(sample), { status: 200 });
  if (String(url).includes("db.dstore.one/api/v1/catalog/placements")) {
    return new Response(JSON.stringify({
      schemaVersion: "1.0",
      revision: "test-revision",
      items: [{
        id: 46125,
        resourceUrl: sample.url,
        title: sample.title,
        icon: sample.icon,
        platform: sample.platform,
        categories: ["gaming"],
        languages: ["ru"],
        source: sample.advertising.source,
        placements: sample.advertising.placements,
        verification: { status: "official_public_source" },
        pageUrl: "https://dstore.one/46125",
      }],
      nextCursor: null,
    }), { status: 200 });
  }
  return new Response(JSON.stringify({ error: "missing" }), { status: 404 });
};

const client = await import("../dist/dstore/client.js");
assert.equal(client.parseDstoreCardId("46125"), 46125);
assert.equal(client.parseDstoreCardId("https://dstore.one/46125"), 46125);
const card = await client.dstoreCardGet("https://dstore.one/46125");
assert.equal(card.title, "Котейная тележка");
assert.equal(card.platform, "telegram");
assert.equal(card.sourceUrl, "https://dstore.one/46125");
assert.equal(card.advertising?.status, "available");
assert.equal(card.advertising?.placements[0]?.price, 15000);
assert.equal(card.advertising?.source.authority, "official");
assert.equal(card.communitySource?.provider, "aiki");
assert.equal(card.communitySource?.verification, "verified");
const batch = await client.dstoreCardsGet(["46125", "missing"]);
assert.equal(batch.cards.length, 1);
assert.equal(batch.errors.length, 1);
const placements = await client.dstorePlacementsSearch({ q: "котики", limit: 5 });
assert.equal(placements.items.length, 1);
assert.equal(placements.items[0].title, "Котейная тележка");
assert.equal(placements.items[0].source.authority, "official");
assert.equal(placements.items[0].placements[0].price, 15000);
assert.equal(calls.length, 3);
console.log("dStore adapter smoke test passed");
