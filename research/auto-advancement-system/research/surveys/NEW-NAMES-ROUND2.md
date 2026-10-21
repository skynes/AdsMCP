# Round 2 — New Ads MCP Names

> **Date:** October 2026  
> **Method:** Web search + Glama/PulseMCP + GitHub + Reddit + competitor pages (PaidSync vs)  
> **Round 1:** [REDDIT-FORUM.md](./REDDIT-FORUM.md)  
> **Source:** [new-names-round2.md](../../../new-names-round2.md)

---

## TL;DR

Second pass found **~19 new names** not in the Round 1 matrix. Top findings:

1. **[PaidSync](https://paidsync.ai)** — 460+ tools, 14 platforms incl. **OpenAI/ChatGPT Ads**, Google Premier Partner → **Σ=57**
2. **[MCP Ads (RoyAzran)](https://mcp-ads.com)** — 3,363 actions, 21 tool families, Google+Meta+GA4+GTM write, MIT OSS → **Σ=54**
3. **[Hyper AI MCP](https://hyperfx.ai/mcp)** — 160+ integrations, marketing skills, deep ad CRUD → **Σ=52**
4. **[Ryze AI](https://get-ryze.ai)** — Google+Meta+GA4+Shopify, 150+ tools, hosted OAuth → **Σ=50**
5. **[ZuckerBot](https://zuckerbot.ai)** — Meta-only 65 tools, creative gen + CAPI, hosted+npx → **Σ=49**
6. **[HYPD openai-ads-mcp](https://github.com/HYPD-AI/openai-ads-mcp)** — **greenfield**: first OSS MCP for OpenAI Ads API (11 tools RO)

---

## Round 2 Summary Table

| # | Service | A | B | C | D | **Σ** | Write | OSS | Source |
|---|---------|---|---|---|---|-------|-------|-----|--------|
| 1 | **[PaidSync](https://paidsync.ai)** | 0 | 32 | 5 | 20 | **57** | ✅ gated | Partial | GitHub, Glama |
| 2 | **[MCP Ads](https://mcp-ads.com)** | 0 | 31 | 5 | 18 | **54** | ✅ paused | Yes | Glama, npm |
| 3 | **[Hyper AI MCP](https://hyperfx.ai/mcp)** | 0 | 29 | 5 | 18 | **52** | ✅ per-tool | No | hyperfx.ai/docs |
| 4 | **[Ryze AI](https://get-ryze.ai)** | 0 | 28 | 5 | 17 | **50** | ✅ gated | Partial | get-ryze.ai |
| 5 | **[ZuckerBot](https://zuckerbot.ai)** | 0 | 28 | 5 | 16 | **49** | ✅ Meta | Yes | r/mcp, GitHub |
| 6 | **[cedricarlos07/meta-ads-mcp](https://github.com/cedricarlos07/meta-ads-mcp)** | 0 | 28 | 5 | 16 | **49** | ✅ agency | Yes | Glama |
| 7 | **[Adrex AI](https://adrex.ai)** | 0 | 26 | 5 | 15 | **46** | ✅ paused | Yes | adrex.ai, npm |
| 8 | **[RoASr MCP](https://github.com/RoASr-com/roasr-mcp)** | 0 | 8 | 5 | 18 | **46** | ⚠️ Yandex | Yes | Glama |
| 9 | **[v-p3truk/mcp-google-ads](https://github.com/v-p3truk/mcp-google-ads)** | 0 | 26 | 5 | 15 | **46** | ✅ Google | Yes | GitHub |
| 10 | **[Marvento Ads MCP](https://glama.ai/mcp/servers/MarventoCapital/marvento-ads-mcp)** | 0 | 26 | 5 | 15 | **46** | ✅ Google | Yes | Glama |
| 11 | **[hashcott/meta-ads-mcp-server](https://github.com/hashcott/meta-ads-mcp-server)** | 0 | 26 | 5 | 14 | **45** | ✅ Meta | Yes | GitHub |
| 12 | **[Kadam MCP](https://github.com/kadam-official/mcp-server)** | 0 | 28 | 5 | 12 | **45** | ✅ network | Yes | npm |
| 13 | **[LeverHQ](https://leverhq.app)** | 0 | 24 | 5 | 14 | **43** | ✅ gated | No | leverhq.app |
| 14 | **julioccorderoc/ads-platforms** *(repo removed Oct 2026)* | 0 | 24 | 5 | 14 | **43** | ✅ multi | Yes | PulseMCP |
| 15 | **[AdCrunch](https://adcrunch.dev)** | 0 | 0 | 5 | 16 | **21** | ❌ RO | No | Glama |
| 16 | **[Flyweel MCP](https://flyweel.co/mcp)** | 0 | 0 | 5 | 17 | **22** | ❌ RO | No | flyweel.co/docs |
| 17 | **[HYPD openai-ads-mcp](https://github.com/HYPD-AI/openai-ads-mcp)** | 0 | 0 | 5 | 14 | **19** | ❌ RO | Yes | r/OpenAIAdvertising |
| 18 | **[kashiflashari/ads-mcp](https://github.com/kashiflashari/ads-mcp)** | 0 | 0 | 5 | 13 | **18** | ❌ RO | Yes | GitHub |

---

## Top 6 Deep Dives

### 1. PaidSync — potential depth leader

| Field | Value |
|-------|-------|
| URL | https://paidsync.ai |
| MCP endpoint | `https://mcp.paidsync.ai/mcp?key=YOUR_API_KEY` |
| GitHub | [PaidSync/paidsync-mcp](https://github.com/PaidSync/paidsync-mcp) (MIT) |
| Platforms | Google, Meta, LinkedIn, TikTok, Snapchat, Reddit, Pinterest, Microsoft, **ChatGPT/OpenAI Ads**, GA4, GTM, GSC, Merchant Center |
| Tools | 460+ |
| Write | Create on Google/Meta/LinkedIn/OpenAI; read+manage+optimize on others |
| Safety | Every change drafted → human approval |
| Partners | Google Premier Partner, Meta Business Partner, LinkedIn Marketing Partner, TikTok Marketing Partner |
| Pricing | Free 15 tasks/mo; Pro from $99/mo |

**Unique:** Only MCP with verified partner status on Meta+LinkedIn+TikTok simultaneously + OpenAI Ads write + GTM/GA4/Merchant Center in one endpoint.

**Vs Synter (60):** Fewer programmatic/DSP platforms (14 vs 27), but deeper tracking infra and OpenAI Ads. Score: **57**.

---

### 2. MCP Ads (RoyAzran) — hidden giant by tool count

| Field | Value |
|-------|-------|
| URL | https://mcp-ads.com |
| MCP endpoint | `https://mcp-ads.com/mcp-slim` |
| GitHub | [RoyAzran/mcp-ads](https://github.com/RoyAzran/mcp-ads) (MIT) |
| Actions | **3,363** registered actions, 21 tool families (dispatcher pattern) |
| Platforms | Google (755), Meta (234), GA4, GSC, GTM (64), TikTok, LinkedIn, Microsoft, Snapchat, WordPress, Sheets |
| Write | Full Google+Meta write; campaigns start **paused** |
| Pricing | $49/mo flat; self-host free |

**Vs getmcpads (58):** Comparable Google/Meta depth, fewer ad platforms (no Reddit/Pinterest native). Score: **54**.

---

### 3. Hyper AI MCP — marketing execution layer

| Field | Value |
|-------|-------|
| URL | https://hyperfx.ai/mcp |
| MCP endpoint | `https://backend.hyperfx.ai/mcp/` |
| Integrations | 160+ verified, 56+ app connections |
| Ad platforms | Meta, Google, Amazon, TikTok, LinkedIn, Pinterest — full CRUD |
| Extras | Scrapers (Meta Ad Library, Reddit, TikTok), image/video gen, SEO, skills |
| Safety | Per-action approval rules in dashboard |

**Positioning:** Not pure ads MCP, but marketing MCP with ad platform integrations. Score: **52**.

---

### 4. Ryze AI — Google+Meta+GA4 unified

| Field | Value |
|-------|-------|
| URL | https://get-ryze.ai |
| MCP endpoint | `https://connector.get-ryze.ai/mcp` |
| GitHub | [irinabuht12-oss/google-meta-ads-ga4-mcp](https://github.com/irinabuht12-oss/google-meta-ads-ga4-mcp) (250+ tools, ⚠️ suspicious stars) |
| Tools | 150+ (Google 150+, Meta 80+, GA4) |
| Write | Approval-gated mutate tools |
| Pricing | Ads Autopilot $89/mo, 7-day trial |

**Red flag:** GitHub fork with 3391⭐ at Oct 2026 — verify before production. Score: **50**.

---

### 5. ZuckerBot — Meta specialist with creative pipeline

| Field | Value |
|-------|-------|
| URL | https://zuckerbot.ai |
| MCP endpoint | `https://zuckerbot.ai/api/mcp` or `npx zuckerbot-mcp` |
| GitHub | [DatalisHQ/zuckerbot](https://github.com/DatalisHQ/zuckerbot) |
| Tools | 65 (audit, campaign mgmt, creative analysis, CAPI, competitor research) |
| Write | Full Meta read/write when upgraded |

**Reddit:** Mentioned in r/mcp (Mar 2026) as alternative when official Meta MCP has `is_ads_mcp_enabled: false`. Score: **49**.

---

### 6. HYPD openai-ads-mcp — greenfield OpenAI Ads

| Field | Value |
|-------|-------|
| GitHub | [HYPD-AI/openai-ads-mcp](https://github.com/HYPD-AI/openai-ads-mcp) |
| npm | `@hypd-ai/openai-ads-mcp` v0.1.1 |
| Tools | 11 read-only (account, campaigns, ad groups, ads, insights) |
| Platform | OpenAI Ads / ChatGPT Ads (US-only, ads.openai.com) |
| Write | ❌ None |

**Context:** OpenAI Ads — new 2026 platform; PaidSync has write, HYPD — first OSS RO. Score: **19**.

---

## Platform Announcements (Oct 2026)

| Platform | Status | MCP |
|----------|--------|-----|
| **OpenAI / ChatGPT Ads** | US-only beta | PaidSync write ✅ · HYPD RO OSS ✅ |
| **Pinterest Ads** | Alpha MCP (Markifact blog) | getmcpads, PaidSync |
| **Snapchat Ads** | Announced MCP (June 2026) | getmcpads, PaidSync, Markifact |
| **Meta Official** | Open beta Apr 2026 | `mcp.facebook.com/ads` — rollout `is_ads_mcp_enabled: false` ~90% |

---

## Key Conclusions

1. **PaidSync (57)** enters TOP-5 alongside Markifact/Blend/AdManage; unique for OpenAI Ads write + tracking stack.
2. **MCP Ads (54)** — underrated: 3,363 actions, but only 1⭐ on GitHub (possibly Aug 2026 launch).
3. **OpenAI Ads** — new competition axis: PaidSync write vs HYPD RO-only OSS.
4. **Meta MCP proliferation:** cedricarlos07 (135 tools), hashcott (54), ZuckerBot (65) — all vs official beta rollout pain.
5. **RO analytics tier** growing: AdCrunch, Flyweel, RoASr — alternatives to TrueClicks with deeper metrics.
6. **Ryze AI GitHub fork** — red flag on stars; use hosted endpoint, don't blindly trust fork.

*Source: [adsMCP/new-names-round2.md](../../../new-names-round2.md)*
