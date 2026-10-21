# Hosted MCP Aggregators Catalog

> **Date:** October 2026  
> **Comparison criteria:** One URL → many platforms, OAuth, write safety, pricing  
> **Source:** [aggregators-catalog.md](../../../aggregators-catalog.md)

---

## Aggregator Comparison Table

| # | Service | A | B | C | D | **Σ** | Platforms | Write | OSS | GitHub |
|---|---------|---|---|---|---|-------|-----------|-------|-----|--------|
| 1 | **[Synter](https://syntermedia.ai)** | 0 | 32 | 5 | 18 | **60** | **27** | ✅ gated | Yes | [Synter-Media-AI/mcp-server](https://github.com/Synter-Media-AI/mcp-server) |
| 2 | **[getmcpads.com](https://getmcpads.com)** | 0 | 30 | 5 | 18 | **58** | **14** | ✅ preview | Partial | [getmcpads-com](https://github.com/getmcpads-com) |
| 3 | **[PaidSync](https://paidsync.ai)** | 0 | 32 | 5 | 20 | **57** | **14** | ✅ gated | Partial | [PaidSync/paidsync-mcp](https://github.com/PaidSync/paidsync-mcp) |
| 4 | **[Markifact](https://markifact.com)** | 0 | 29 | 5 | 18 | **57** | **20+** | ✅ HITL | Partial | [markifact/markifact-mcp](https://github.com/markifact/markifact-mcp) |
| 5 | **[Blend MCP](https://blend-ai.com/mcp)** | 0 | 30 | 5 | 17 | **57** | **8** | ✅ gated | No | — |
| 6 | **[AdManage.ai](https://admanage.ai/mcp)** | 0 | 32 | 5 | 15 | **57** | **9** | ✅ bulk | No | — |
| 7 | **[Adspirer](https://adspirer.com)** | 0 | 30 | 5 | 16 | **56** | 6+ | ✅ | Partial | [amekala/ads-mcp](https://github.com/amekala/ads-mcp) |
| 8 | **[InsightfulPipe](https://insightfulpipe.com)** | 0 | 27 | 5 | 18 | **55** | **46** | ✅ RO/RW | No | — |
| 9 | **[Pipeboard](https://pipeboard.co)** | 0 | 28 | 5 | 17 | **55** | 5 | ✅ | Partial | [pipeboard-co/meta-ads-mcp](https://github.com/pipeboard-co/meta-ads-mcp) |
| 10 | **[MCP Ads](https://mcp-ads.com)** | 0 | 31 | 5 | 18 | **54** | 10+ | ✅ paused | Yes | [RoyAzran/mcp-ads](https://github.com/RoyAzran/mcp-ads) |
| 11 | **[AdKit](https://adkit.so)** | 0 | 27 | 5 | 17 | **54** | 7+ | ✅ draft | Partial | [adkit/ads-mcp](https://github.com/adkit/ads-mcp) |
| 12 | **[Windsor.ai MCP](https://mcp.windsor.ai/)** | 0 | 26 | 5 | 17 | **53** | 350+† | ✅ select | No | — |
| 13 | **[Metadata.io](https://metadata.io/mcp-server)** | 0 | 28 | 5 | 14 | **52** | 8 B2B | ✅ 60s gate | No | — |
| 14 | **[AdLoop](https://getadloop.com)** | 0 | 28 | 5 | 14 | **52** | 3 | ✅ caps | Yes | [kLOsk/adloop](https://github.com/kLOsk/adloop) |
| 15 | **[Opus Growth](https://opus-growth.com)** | 0 | 27 | 5 | 14 | **51** | 4+ | ✅ preview | Yes | [opusgrowth](https://github.com/opusgrowth/Opus-Growth-The-MCP-Connector-for-Ad-Platforms) |
| 16 | **[cesteral/mcp-open-advertising](https://github.com/cesteral/mcp-open-advertising)** | 0 | 26 | 5 | 14 | **50** | 12 | ✅ | Yes | OSS monorepo |
| 17 | **[Catchr.io MCP](https://api.catchr.io/mcp)** | 0 | 22 | 5 | 18 | **50** | 100+† | ⚠️ mixed | No | — |
| 18 | **[TrueClicks](https://data.trueclicks.com/mcp)** | 0 | 18 | 5 | 18 | **46** | 3 | ❌ RO | Partial | [TrueClicks/google-ads-mcp-js](https://github.com/TrueClicks/google-ads-mcp-js) |
| 19 | **[Connector.wtf](https://connector.wtf)** | 0 | 8 | 5 | 16 | **34** | 5+ | ❌ RO | No | — |
| 20 | **[Smacient](https://smacient.com)** | 0 | 8 | 5 | 14 | **32** | 3 | ❌ RO | No | — |

† Many sources; ad write on subset only

---

## Top Aggregator Profiles

### getmcpads.com — reference benchmark

| | |
|---|---|
| **URL** | https://mcp.getmcpads.com/mcp |
| **Platforms** | Google, Meta, TikTok, Pinterest, Snap, Reddit, Bing, X, LinkedIn, Apple, Amazon, RTB House, GA4, GSC |
| **Features** | Ticked-account allowlist, preview+confirm writes, npm `@getmcpads/*`, alerts |
| **Pricing** | Free (1 account, RO) / Pro $29 / Team $99 |

### Synter — widest catalog (27 platforms)

| | |
|---|---|
| **URL** | https://mcp.syntermedia.ai |
| **Platforms** | Google, Meta, LinkedIn, TikTok, Amazon DSP+SP, **DV360**, **TTD**, **Taboola**, **Outbrain**, **StackAdapt**, Criteo, Walmart, Instacart, OpenAI Ads… |
| **Pricing** | Solo $20/mo (+$20 credits) / Scale $500/mo (+$500 credits) |
| **Unique** | Only aggregator with DV360, TTD, Taboola, Outbrain, StackAdapt |

### PaidSync — deepest tracking stack

| | |
|---|---|
| **URL** | https://paidsync.ai · `https://mcp.paidsync.ai/mcp?key=YOUR_API_KEY` |
| **Platforms** | Google, Meta, LinkedIn, TikTok, Snapchat, Reddit, Pinterest, Microsoft, **ChatGPT/OpenAI Ads**, GA4, GTM, GSC, Merchant Center |
| **Tools** | 460+ |
| **Partners** | Google Premier Partner, Meta Business Partner, LinkedIn Marketing Partner, TikTok Marketing Partner |
| **Pricing** | Free 15 tasks/mo; Pro from $99/mo |

### Adspirer — 400+ tools, OAuth 2.1

| | |
|---|---|
| **URL** | https://mcp.adspirer.com/mcp |
| **Registry** | `com.adspirer/ads` in MCP Server Registry |
| **GitHub** | [amekala/ads-mcp](https://github.com/amekala/ads-mcp) |
| **Setup** | `claude mcp add --transport http adspirer https://mcp.adspirer.com/mcp` |

### AdKit — draft-first + ad library

| | |
|---|---|
| **URL** | https://mcp.adkit.so |
| **Unique** | `adkit_library` — 500k+ ads spy; `adkit_studio` — AI creatives |
| **Workflow** | Draft → human approve → publish |

### Pipeboard — Meta Business Partner

| | |
|---|---|
| **URLs** | `meta-ads.mcp.pipeboard.co`, google, tiktok, snap, reddit |
| **Tools** | 230+ across 5 platforms |
| **Free tier** | ✅ |

---

## Use Case Guide

| Task | Best choice | Why |
|------|-------------|-----|
| Maximum platforms, one URL | **Synter** (27) or **InsightfulPipe** (46 incl. non-ads) | Breadth |
| Best free tier + write | **getmcpads** | Free RO, Pro $29 write |
| Programmatic (DV360, TTD, Taboola) | **Synter** or **cesteral OSS** | Only DSP options |
| Ad spy + creatives | **AdKit** | library + studio |
| B2B / LinkedIn-heavy | **Metadata** | 141 B2B tools |
| Meta-focused, trusted | **Pipeboard** | Meta Business Partner |
| OpenAI Ads write | **PaidSync** | Verified write |
| Self-host, full control | **cesteral/mcp-open-advertising** | 12 servers, OSS |
| Bulk launch 100+ ads | **AdManage.ai** | Unique bulk capability |
| ETL 350+ sources + MCP | **Windsor.ai** | Agency ETL |
| Ads + GSC + Trends | **Catchr.io** | Cross-data |
| OSS Google+Reddit+GA4 | **AdLoop** (276⭐) | Open source |

---

## Open-Source Multi-Platform (self-host)

| Repo | Platforms | Tools |
|------|-----------|-------|
| [cesteral/mcp-open-advertising](https://github.com/cesteral/mcp-open-advertising) | Google, Meta, DV360, TTD, LinkedIn, TikTok, CM360, SA360, Pinterest, Snap, Amazon DSP, MS Ads | ~250 |
| [amekala/ads-mcp](https://github.com/amekala/ads-mcp) | → hosted as Adspirer | 400+ |
| [byadsco/meta-ads-mcp](https://github.com/byadsco/meta-ads-mcp) | Meta only (124 tools) | agency multi-tenant |

---

## Decision Tree

```
Need free RO + cheap write        → getmcpads (still #1)
Need DV360/TTD/Taboola/StackAdapt → Synter ($20–500/mo)
Need ad spy + AI creatives          → AdKit ($29/mo)
Need GA4+Shopify+ads in one         → InsightfulPipe or Markifact
Need B2B LinkedIn automation        → Metadata.io
Need self-host programmatic         → cesteral/mcp-open-advertising
Need #1 on Reddit, official partner → Blend MCP ($23/mo)
Need bulk launch 100+ ads             → AdManage.ai
Need OpenAI Ads write                 → PaidSync
Need OSS Google+Reddit+GA4          → AdLoop (276⭐)
```

*Source: [adsMCP/aggregators-catalog.md](../../../aggregators-catalog.md)*
