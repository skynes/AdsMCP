# Publisher / Supply-Side MCP

> **Date:** October 2026  
> **Focus:** Services that **sell ad inventory** (publisher, SSP, ad server, ad network) — not media buying  
> **Source:** [publisher-supply-mcp.md](../../../publisher-supply-mcp.md)

Demand-side: [DISPLAY-BANNER.md](./DISPLAY-BANNER.md)

---

## TL;DR

Supply-side MCP **lags demand-side**, but by October 2026 three layers exist:

1. **Ad networks with official MCP** — Kadam (adv+pub), PropellerAds, HilltopAds
2. **Ad servers / retail media** — **Kevel MCP** (100+ tools, production), Prebid Sales Agent (AdCP alpha)
3. **Enterprise SSP / publisher ops** — **IAB Seller Agent** (46 tools), **PubMatic MCP**, GAM community MCP

| Role | Best MCP | Σ |
|------|----------|---|
| Ad network publisher (sites/blocks) | [Kadam pub.kadam.net/mcp](https://pub.kadam.net/mcp) | 45 |
| Ad server (retail media, sponsored listings) | [Kevel MCP](https://mcp.kevel.com/) | 52 |
| Google Ad Manager trafficking | [MatiousCorp/google-ad-manager-mcp](https://github.com/MatiousCorp/google-ad-manager-mcp) | 48 |
| Mobile app monetization | [admob-manager-mcp](https://github.com/ParkSangGwon/admob-mcp-server) | 49 |
| Programmatic deals (PMP/PG) | [IAB Seller Agent](https://iabtechlab.github.io/seller-agent/) | 51 |
| AI-app publisher (in-chat ads) | [Adgentek AdsMCP](https://adsmcp.ai/) | 57 |

---

## Supply-Side MCP Table

| # | Service | Type | MCP endpoint | Tools | Write | OSS | **Σ** |
|---|---------|------|-------------|-------|-------|-----|-------|
| 1 | [Kevel MCP](https://mcp.kevel.com/) | Ad server | `https://mcp.kevel.com/` | 100+ | ✅ | No | **52** |
| 2 | [IAB Seller Agent](https://iabtechlab.github.io/seller-agent/) | SSP/Publisher ops | `/mcp/` self-host | 46 | ✅ | Yes | **51** |
| 3 | [admob-manager-mcp](https://github.com/ParkSangGwon/admob-mcp-server) | Mobile pub | stdio / HTTP | 19 | ✅ | Yes | **49** |
| 4 | [GAM MCP (MatiousCorp)](https://github.com/MatiousCorp/google-ad-manager-mcp) | Ad server | stdio | 30+ | ✅ | Yes | **48** |
| 5 | [Prebid Sales Agent](https://github.com/prebid/salesagent) | AdCP sales | self-host HTTP/SSE | 16 AdCP | ✅ | Yes | **46** |
| 6 | [Kadam Publisher](https://pub.kadam.net/mcp) | Ad network | `pub.kadam.net/mcp` | 9 pub | ✅ | Yes | **45** |
| 7 | [PubMatic MCP](https://mcp.pubmatic.com/mcp) | SSP | hosted | 4 | ⚠️ deals | Spec OSS | **44** |
| 8 | [Affset MCP](https://github.com/affset/mcp) | White-label ad server | hosted | many | ✅ | Yes | **43** |
| 9 | [GAM Seller MCP Node](https://github.com/juan-sibbo/gam-seller-mcp-node) | GAM discovery | self-host | 5 | ⚠️ intent | Yes | **38** |
| 10 | [supply-ops-agent](https://github.com/mpessis/supply-ops-agent) | SSP diagnostics | stdio | 5 | ❌ RO | Yes | **23** |

### Ad networks: API exists, publisher MCP missing

| Platform | Publisher API | MCP | Wrapper priority |
|----------|--------------|-----|------------------|
| **Adsterra** | ✅ pub API | ❌ | ⭐⭐⭐ (~1 week) |
| **MGID** | ✅ publisher dashboard API | ❌ | ⭐⭐⭐ |
| **RichAds / ExoClick** | ✅ | ❌ via affset bid presets | ⭐⭐ |
| **Google AdSense** | ✅ limited | ❌ | ⭐ (RO stats possible) |

---

## Top 6 Deep Dives

### 1. Kevel MCP — best production ad server MCP

| Field | Value |
|-------|-------|
| URL | https://mcp.kevel.com/ |
| Tools | 100+ across 10 API surfaces |
| Capabilities | Advertisers, campaigns, flights, ads, creatives, inventory, targeting, reporting, forecasting, Decision API |
| Write | ✅ enabled by default; read-only on request |
| Use case | Retail media, sponsored listings, native ad server |
| Score | **52** |

### 2. IAB Tech Lab Seller Agent — programmatic selling standard

| Field | Value |
|-------|-------|
| GitHub | [IABTechLab/seller-agent](https://github.com/IABTechLab/seller-agent) |
| Tools | **46 MCP tools** + 87 REST endpoints |
| Standards | OpenDirect 2.1, Deals API v1.0, sellers.json |
| Ad servers | Google Ad Manager ✅, FreeWheel ✅, CSV, pluggable |
| SSP connectors | PubMatic (MCP) ✅, Index Exchange (REST), Magnite (REST) |
| Key tools | `create_deal_from_template`, `distribute_deal_via_ssp`, `push_deal_to_buyers`, `troubleshoot_deal` |
| Score | **51** |

### 3. Kadam — only ad network with separate publisher MCP

| Field | Value |
|-------|-------|
| Advertiser MCP | `https://partners.kadam.net/mcp` |
| **Publisher MCP** | `https://pub.kadam.net/mcp` |
| npm | `@kadam-net/mcp-server` v0.6.1 |
| Publisher tools (9) | `kadam_pub_list_sources`, `kadam_pub_create_source`, `kadam_pub_list_places`, `kadam_pub_create_place`, stats, balance |
| Flow | Create site (source) → create ad block (place) → embed code → stats/revenue |
| Score | **45** |

### 4. admob-manager-mcp — mobile publisher monetization

| Field | Value |
|-------|-------|
| GitHub | [ParkSangGwon/admob-mcp-server](https://github.com/ParkSangGwon/admob-mcp-server) |
| Tools | 19: apps, ad units, mediation groups, A/B experiments, bidding mappings (Meta AN, Unity, AppLovin, ironSource), reports |
| Score | **49** |

### 5. Google Ad Manager — community MCP (official ⏳ H2 2026)

| Variant | Status | Write |
|---------|--------|-------|
| **Official GAM MCP** | ⏳ Announced H2 2026 | TBD |
| **[MatiousCorp/google-ad-manager-mcp](https://github.com/MatiousCorp/google-ad-manager-mcp)** | ✅ Community | ✅ Orders, line items, creatives |
| **[Prebid Sales Agent](https://github.com/prebid/salesagent)** | Alpha | ✅ AdCP; GAM adapter |

### 6. PubMatic MCP — enterprise SSP agent-to-agent

| Field | Value |
|-------|-------|
| Endpoint | `https://mcp.pubmatic.com/mcp` |
| Tools (4) | `deal_management`, `deal_troubleshooting`, `inventory_discovery`, `submit_dsp_details` |
| Access | Account-gated (PubMatic rep grants access) |
| Score | **44** |

---

## AdCP Protocol — Emerging Supply Standard

[Ad Context Protocol (AdCP)](https://adcontextprotocol.org) — open standard for AI agents to buy/sell media.

| Surface | MCP tasks | Implementers |
|---------|-----------|--------------|
| **Media Buy (sales agent)** | `get_products`, `create_media_buy`, `get_media_buy_delivery` | Prebid Sales Agent, IAB Seller Agent |
| **Creative** | `build_creative`, `preview_creative` | AdCP test agent |
| **Signals** | `get_signals`, `activate_signal` | LiveRamp-style agents |

**Publisher integration checklist:**
1. Publish `adagents.json` on publisher domain (like ads.txt)
2. Publish `brand.json` at `/.well-known/brand.json`
3. Deploy sales agent with MCP transport
4. Implement `get_products` → inventory discovery for buyer agents

**Test agent:** `https://test-agent.adcontextprotocol.org/sales/mcp`

---

## AI-Native Publisher Monetization

| Platform | Model | MCP | Revenue |
|----------|-------|-----|---------|
| **[Adgentek AdsMCP](https://adsmcp.ai/)** | `ads.serve` in AI chats | ✅ | eCPM floor, programmatic+direct |
| **[Agentic Ads](https://github.com/nicofains1/agentic-ads)** | Ad network for AI agents | ✅ | CPC/CPM/CPA, USDC |
| **[Hive Ad-Bid](https://github.com/srotzin/hive-ad-bid)** | CPM auction in agents | ✅ | USDC on Base (x402) |
| **[Dappier](https://docs.dappier.com/)** | Content → RAG marketplace | ✅ | Pay-per-query + agentic ads |

---

## Demand vs Supply MCP Maturity

| Criterion | Demand-side (buy ads) | Supply-side (sell inventory) |
|----------|----------------------|------------------------------|
| Official MCP count | 15+ platforms | ~5 production |
| Open standard | MCP de facto | **AdCP** emerging |
| Self-serve signup | ✅ Most aggregators | ⚠️ PubMatic account-gated |
| Write campaigns/placements | ✅ 50+ services | ⚠️ Kevel, Kadam, GAM community best |
| CPM/pop networks MCP | PropellerAds, HilltopAds (buy-side) | ❌ Adsterra/MGID/RichAds — API only |
| Google official | Google Ads MCP (RO) | GAM MCP ⏳ H2 2026 |

---

## Scenario Recommendations

| Scenario | Recommendation |
|----------|----------------|
| Publisher on ad network (CPM/pop) | **Kadam** `pub.kadam.net/mcp` |
| Publisher with ad server (GAM, Kevel) | **Kevel** now; **GAM** official later 2026 |
| Mobile app developer (AdMob) | **admob-manager-mcp** |
| AI-app developer (monetize chat) | **Adgentek AdsMCP** |
| SSP / programmatic seller | **IAB Seller Agent** + **PubMatic MCP** |
| SSP diagnostics layer | **supply-ops-agent** |

*Source: [adsMCP/publisher-supply-mcp.md](../../../publisher-supply-mcp.md)*
