# Publisher / Supply-side MCP — рекламные площадки и SSP

> Дата: 3 октября 2026  
> Фокус: сервисы, которые **сдают рекламный инвентарь** (publisher, SSP, ad server, ad network), а не покупают медиа  
> Demand-side (покупка рекламы): [display-banner-platforms.md](./display-banner-platforms.md) · [master-scores.md](./master-scores.md)

---

## TL;DR

MCP на стороне **supply** (площадки) существенно отстаёт от demand-side, но к октябрю 2026 появились три слоя:

1. **Ad networks с official MCP** — Kadam (adv+pub), PropellerAds, HilltopAds (buy-side, но inventory их же)
2. **Ad servers / retail media** — **Kevel MCP** (100+ tools, production), Prebid Sales Agent (AdCP alpha)
3. **Enterprise SSP / publisher ops** — **IAB Seller Agent** (46 tools), **PubMatic MCP**, GAM community MCP

**Лучший выбор по роли:**

| Роль | Лучший MCP | Σ† |
|------|-----------|-----|
| Ad network publisher (сайты/блоки) | [Kadam pub.kadam.net/mcp](https://pub.kadam.net/mcp) | 45 |
| Ad server (retail media, sponsored listings) | [Kevel MCP](https://mcp.kevel.com/) | 52 |
| Google Ad Manager trafficking | [MatiousCorp/google-ad-manager-mcp](https://github.com/MatiousCorp/google-ad-manager-mcp) | 48 |
| Mobile app monetization | [admob-manager-mcp](https://github.com/ParkSangGwon/admob-mcp-server) | 49 |
| Programmatic deals (PMP/PG) | [IAB Seller Agent](https://iabtechlab.github.io/seller-agent/) | 51 |
| AI-app publisher (in-chat ads) | [Adgentek AdsMCP](https://adsmcp.ai/) | 57 |
| Affiliate + network bid control | [affset/mcp](https://github.com/affset/mcp) | 43 |

† Supply-side оценка A+B+C+D (publisher context): A=регистрация pub-аккаунта, B=создание сайта/placement/deal, C=вывод средств, D=pub-статистика

---

## Карта экосистемы

```
                    SUPPLY-SIDE MCP LANDSCAPE (Oct 2026)
    ┌─────────────────────────────────────────────────────────────────┐
    │  PROTOCOL LAYER                                                  │
    │  AdCP (adcontextprotocol.org) ──► MCP preferred transport        │
    │  Prebid Sales Agent (alpha) · IAB Seller Agent (46 tools)        │
    └───────────────────────────┬─────────────────────────────────────┘
                                │
    ┌───────────────────────────┼─────────────────────────────────────┐
    │  AD SERVERS               │  SSP / PROGRAMMATIC                  │
    │  Kevel MCP ✅             │  PubMatic MCP ✅ (account-gated)     │
    │  GAM community ✅         │  IAB Seller → Index/Magnite/PubMatic │
    │  GAM official ⏳ 2026     │  GAM Seller MCP (discovery only)     │
    │  Affset (white-label) ✅  │  supply-ops-agent (diagnostics)      │
    └───────────────────────────┼─────────────────────────────────────┘
                                │
    ┌───────────────────────────┼─────────────────────────────────────┐
    │  AD NETWORKS (CPM/pop)    │  MOBILE / APP MONETIZATION           │
    │  Kadam pub MCP ✅         │  admob-manager-mcp ✅ (19 tools)     │
    │  PropellerAds ✅ (buy)    │  IAB agentic-mobile (spec, alpha)    │
    │  Adsterra/MGID/RichAds ❌ │  Meta Audience Network (via Meta MCP)│
    └───────────────────────────┼─────────────────────────────────────┘
                                │
    ┌───────────────────────────┴─────────────────────────────────────┐
    │  AI-NATIVE PUBLISHER MONETIZATION                                │
    │  Adgentek AdsMCP · Agentic Ads · Hive Ad-Bid · Dappier (content) │
    └─────────────────────────────────────────────────────────────────┘
```

---

## Сводная таблица: supply-side MCP

| # | Сервис | Тип | MCP endpoint | Tools | Write | OSS | A | B | C | D | **Σ** |
|---|--------|-----|-------------|-------|-------|-----|---|---|---|---|-------|
| 1 | [Kevel MCP](https://mcp.kevel.com/) | Ad server | `https://mcp.kevel.com/` | 100+ | ✅ | Нет | 0 | 30 | 5 | 17 | **52** |
| 2 | [IAB Seller Agent](https://iabtechlab.github.io/seller-agent/) | SSP/Publisher ops | `/mcp/` self-host | 46 | ✅ | **Да** | 0 | 28 | 5 | 18 | **51** |
| 3 | [admob-manager-mcp](https://github.com/ParkSangGwon/admob-mcp-server) | Mobile pub | stdio / HTTP | 19 | ✅ | **Да** | 0 | 28 | 5 | 16 | **49** |
| 4 | [GAM MCP (MatiousCorp)](https://github.com/MatiousCorp/google-ad-manager-mcp) | Ad server | stdio | 30+ | ✅ | **Да** | 0 | 28 | 5 | 15 | **48** |
| 5 | [Kadam Publisher](https://pub.kadam.net/mcp) | Ad network | `pub.kadam.net/mcp` | 9 pub | ✅ | **Да** | 0 | 26 | 5 | 14 | **45** |
| 6 | [Prebid Sales Agent](https://github.com/prebid/salesagent) | AdCP sales | self-host HTTP/SSE | 16 AdCP | ✅ | **Да** | 0 | 26 | 5 | 15 | **46** |
| 7 | [PubMatic MCP](https://mcp.pubmatic.com/mcp) | SSP | hosted | 4 | ⚠️ deals | Spec OSS | 0 | 22 | 5 | 17 | **44** |
| 8 | [Affset MCP](https://github.com/affset/mcp) | White-label ad server | hosted | many | ✅ | **Да** | 0 | 24 | 5 | 14 | **43** |
| 9 | [GAM Seller MCP Node](https://github.com/juan-sibbo/gam-seller-mcp-node) | GAM discovery | self-host | 5 | ⚠️ intent | **Да** | 0 | 12 | 5 | 16 | **38** |
| 10 | [STEPhie / stepnetwork.dk](https://stepnetwork.dk) *(MCP endpoint 404 Oct 2026)* | Publisher CRM | hosted | 10+ | ❌ RO | Нет | 0 | 14 | 5 | 16 | **35** |
| 11 | [supply-ops-agent](https://github.com/mpessis/supply-ops-agent) | SSP diagnostics | stdio | 5 | ❌ RO | **Да** | 0 | 0 | 5 | 18 | **23** |
| 12 | [Dappier MCP](https://docs.dappier.com/) | Content monetization | marketplace | — | ⚠️ | Нет | 0 | 12 | 5 | 14 | **31** |

### Ad networks: API есть, publisher MCP нет

| Платформа | Publisher API | MCP | Потенциал wrapper |
|-----------|--------------|-----|-------------------|
| **Adsterra** | ✅ pub API | ❌ | ⭐⭐⭐ (~1 week) |
| **MGID** | ✅ publisher dashboard API | ❌ | ⭐⭐⭐ |
| **RichAds** | ✅ | ❌ via [affset/mcp](https://github.com/affset/mcp) bid presets | ⭐⭐ |
| **ExoClick** | ✅ | ❌ via affset presets | ⭐⭐ |
| **TrafficStars** | ✅ | ❌ via affset | ⭐⭐ |
| **Google AdSense** | ✅ | ❌ | ⭐ (read-only stats possible) |
| **Media.net** | ✅ | ❌ | ⭐⭐ |

---

## Детальный разбор TOP-6

### 1. Kevel MCP — лучший production ad server MCP

| Поле | Значение |
|------|----------|
| URL | https://mcp.kevel.com/ |
| Docs | https://dev.kevel.com/docs/mcp-server |
| Tools | 100+ across 10 API surfaces |
| Capabilities | Advertisers, campaigns, flights, ads, creatives, inventory, targeting, reporting, forecasting, Decision API |
| Write | ✅ enabled by default; read-only on request |
| Auth | Kevel API key |
| Use case | Retail media, sponsored listings, native ad server |

**Примеры tools:** `kevel_create_campaign`, `kevel_list_ad_types`, `kevel_create_creative`, `kevel_get_report`.

**Оценка:** A=0 · B=30 · C=5 · D=17 → **52**

---

### 2. IAB Tech Lab Seller Agent — стандарт для programmatic selling

| Поле | Значение |
|------|----------|
| URL | Self-host: [IABTechLab/seller-agent](https://github.com/IABTechLab/seller-agent) |
| MCP endpoint | `/mcp/` (Streamable HTTP) |
| Tools | **46 MCP tools** + 87 REST endpoints |
| Standards | OpenDirect 2.1, Deals API v1.0, sellers.json |
| Ad servers | Google Ad Manager ✅, FreeWheel ✅, CSV, pluggable |
| SSP connectors | PubMatic (MCP) ✅, Index Exchange (REST), Magnite (REST) |
| Use case | Publisher ops: inventory sync, deal creation, SSP distribution, buyer push |

**Key tools:** `create_deal_from_template`, `distribute_deal_via_ssp`, `push_deal_to_buyers`, `get_deal_performance`, `troubleshoot_deal`, `list_ssps`.

**Оценка:** A=0 · B=28 · C=5 · D=18 → **51**

---

### 3. Kadam — единственный ad network с **отдельным publisher MCP**

| Поле | Значение |
|------|----------|
| Advertiser MCP | `https://partners.kadam.net/mcp` |
| **Publisher MCP** | `https://pub.kadam.net/mcp` |
| npm | `@kadam-net/mcp-server` v0.6.1 |
| GitHub | [kadam-official/mcp-server](https://github.com/kadam-official/mcp-server) |
| Publisher tools (9) | `kadam_pub_list_sources`, `kadam_pub_create_source`, `kadam_pub_list_places`, `kadam_pub_create_place`, stats, balance |
| Auth | `KADAM_PUB_API_KEY` или OAuth в ChatGPT |

**Publisher flow:** создать site (source) → создать ad block (place) → получить embed code → смотреть stats/revenue.

**Оценка publisher side:** A=0 · B=26 · C=5 · D=14 → **45**

---

### 4. admob-manager-mcp — mobile publisher monetization

| Поле | Значение |
|------|----------|
| GitHub | [ParkSangGwon/admob-mcp-server](https://github.com/ParkSangGwon/admob-mcp-server) *(replaces w3wide/admob-manager-mcp)* |
| API | Google AdMob REST v1beta |
| Tools | 19: apps, ad units, mediation groups, A/B experiments, bidding mappings (Meta AN, Unity, AppLovin, ironSource), reports |
| Transport | stdio + Streamable HTTP with MCP v2 Native Auth |

**Use case:** App developer управляет AdMob inventory, mediation waterfall, ad unit creation через Claude/Cursor.

**Оценка:** A=0 · B=28 · C=5 · D=16 → **49**

---

### 5. Google Ad Manager — community MCP (official ⏳ later 2026)

| Вариант | Status | Write | Notes |
|---------|--------|-------|-------|
| **Official GAM MCP** | ⏳ Announced H2 2026 | TBD | Trafficking workflows; tool list unpublished |
| **[MatiousCorp/google-ad-manager-mcp](https://github.com/MatiousCorp/google-ad-manager-mcp)** | ✅ Community | ✅ | Orders, line items, creatives, advertisers; SOAP API v202502 |
| **[GAM Seller MCP Node](https://github.com/juan-sibbo/gam-seller-mcp-node)** | ✅ Community | ⚠️ intent only | `discover_products`, `get_forecast`, `check_availability`, `create_intent` — no GAM writes |
| **[Prebid Sales Agent](https://github.com/prebid/salesagent)** | Alpha | ✅ AdCP | GAM adapter, multi-tenant, 16 AdCP tools |

**Prebid Sales Agent adapters:** GAM (most developed), Kevel, Broadstreet, Triton Digital, Mock.

**MatiousCorp score:** A=0 · B=28 · C=5 · D=15 → **48**

---

### 6. PubMatic MCP — enterprise SSP agent-to-agent

| Поле | Значение |
|------|----------|
| Endpoint | `https://mcp.pubmatic.com/mcp` |
| Spec | [PubMatic/pubmatic-mcp-server](https://github.com/PubMatic/pubmatic-mcp-server) |
| Tools (4) | `deal_management`, `deal_troubleshooting`, `inventory_discovery`, `submit_dsp_details` |
| Access | Account-gated (PubMatic rep grants access) |
| Use case | PMP/PG deal creation, underdelivery diagnostics, NL → supply packages, DSP bid testing |

**Оценка:** A=0 · B=22 · C=5 · D=17 → **44**

---

## Протокол AdCP — будущий стандарт supply-side MCP

[Ad Context Protocol (AdCP)](https://adcontextprotocol.org) — open standard для AI agents покупать/продавать media.

| Surface | MCP tasks | Кто реализует |
|---------|-----------|---------------|
| **Media Buy (sales agent)** | `get_products`, `create_media_buy`, `get_media_buy_delivery` | Prebid Sales Agent, IAB Seller Agent |
| **Creative** | `build_creative`, `preview_creative` | AdCP test agent |
| **Signals** | `get_signals`, `activate_signal` | LiveRamp-style agents |
| **Trusted Match** | Serve-time package activation | HTTP (not MCP) |

**Publisher integration checklist (AdCP):**
1. Publish `adagents.json` on publisher domain (like ads.txt)
2. Publish `brand.json` at `/.well-known/brand.json`
3. Deploy sales agent with MCP transport
4. Implement `get_products` → inventory discovery for buyer agents

**Test agent:** `https://test-agent.adcontextprotocol.org/sales/mcp`

---

## Affiliate / white-label: Affset MCP

[affset/mcp](https://github.com/affset/mcp) — white-label ad server с ролями **publisher** и **advertiser**.

| Роль | MCP capabilities |
|------|-----------------|
| **Publisher** | Create zones, get embed codes, view stats (scoped to own zones) |
| **Publisher manager** | Manage assigned publishers' zones |
| **Advertiser** | Create campaigns, targeting, payouts |
| **Owner/Manager** | Traffic sources with presets: ExoClick, RichAds, PropellerAds, Adsterra, TrafficStars |

**Indirect network control:** `list_source_bids`, `set_source_bid` — управление ставками в ExoClick/RichAds/TrafficStars через API token traffic source.

**Не full publisher MCP** для Adsterra/MGID напрямую — это affiliate tracker + bid sync.

**Оценка:** A=0 · B=24 · C=5 · D=14 → **43**

---

## AI-native publisher monetization

| Platform | Model | MCP | Revenue |
|----------|-------|-----|---------|
| **[Adgentek AdsMCP](https://adsmcp.ai/)** | `ads.serve` in AI chats | ✅ `mcp.adgentek.ai` | eCPM floor, programmatic+direct |
| **[Agentic Ads](https://github.com/nicofains1/agentic-ads)** | Ad network for AI agents | ✅ | CPC/CPM/CPA, USDC |
| **[Hive Ad-Bid](https://github.com/srotzin/hive-ad-bid)** | CPM auction in agents | ✅ | USDC on Base (x402) |
| **[Dappier](https://docs.dappier.com/)** | Content → RAG marketplace | ✅ MCP | Pay-per-query + agentic ads in answers |

**Adgentek publisher setup:** Inventory → Surfaces → API key → `ads.serve(conversationId, userKey, surface)`.

---

## Supply-side diagnostics

| Tool | Focus | Tools |
|------|-------|-------|
| [supply-ops-agent](https://github.com/mpessis/supply-ops-agent) | SSP exchange ops | `diagnose_bid_rate`, `check_ads_txt`, `detect_ivt`, `analyze_demand`, `partner_health` |
| [STEPhie / stepnetwork.dk](https://stepnetwork.dk) *(MCP endpoint unavailable Oct 2026)* | Publisher CRM + GAM forecast | `getAllPublishers`, `availabilityForecast`, ad unit discovery |

---

## Сравнение: demand vs supply MCP maturity

| Критерий | Demand-side (buy ads) | Supply-side (sell inventory) |
|----------|----------------------|------------------------------|
| Official MCP count | 15+ platforms | ~5 production (Kevel, Kadam pub, IAB, PubMatic, AdMob community) |
| Open standard | MCP de facto | **AdCP** emerging (MCP preferred) |
| Self-serve signup | ✅ Most aggregators | ⚠️ PubMatic account-gated; IAB self-host |
| Write campaigns/placements | ✅ 50+ services | ⚠️ Kevel, Kadam, GAM community best |
| CPM/pop networks MCP | PropellerAds, HilltopAds (buy-side) | ❌ Adsterra/MGID/RichAds — API only |
| Google official | Google Ads MCP (RO) | GAM MCP ⏳ H2 2026 |

---

## Рекомендации по сценарию

### «Я publisher на ad network (CPM/pop/native)»
1. **Kadam** — если работаете в их сети: `pub.kadam.net/mcp` (official, OAuth)
2. **Affset** — если affiliate model + ExoClick/RichAds как traffic sources
3. **Adsterra/MGID** — API есть, MCP нет → wrapper ~1 week или ждать

### «Я publisher с ad server (GAM, Kevel, custom)»
1. **Kevel** — `mcp.kevel.com` (production, 100+ tools)
2. **GAM** — MatiousCorp community MCP сейчас; official позже 2026
3. **Prebid Sales Agent** — если нужен AdCP-compliant sales agent для buyer AI agents
4. **IAB Seller Agent** — если programmatic deals + multi-SSP distribution

### «Я mobile app developer (AdMob)»
1. **admob-manager-mcp** — 19 tools, mediation, ad units, reports
2. **IAB agentic-mobile** — spec для supply-side mobile (alpha)

### «Я AI-app developer (monetize chat)»
1. **Adgentek AdsMCP** — full ad server, `ads.serve`
2. **Agentic Ads / Hive Ad-Bid** — agent-native CPM/CPC

### «Я SSP / programmatic seller»
1. **IAB Seller Agent** — 46 tools, GAM sync, deal lifecycle
2. **PubMatic MCP** — если уже на PubMatic (deal troubleshooting killer feature)
3. **supply-ops-agent** — bid rate / IVT / ads.txt diagnostics layer

---

## Greenfield opportunities (API ✅, MCP ❌)

| Platform | Publisher API | Priority | Effort |
|----------|--------------|----------|--------|
| **Adsterra Publisher** | REST, sites+zones+stats | ⭐⭐⭐ | ~1 week |
| **MGID Publisher** | Full CRUD widgets | ⭐⭐⭐ | ~1 week |
| **Google AdSense** | Limited API (reports) | ⭐ | ~2 weeks RO |
| **Media.net** | Publisher API | ⭐⭐ | ~2 weeks |
| **MyTarget (VK) pub** | API exists | ⭐⭐ | ~2 weeks |
| **Yandex RTB pub** | Partner API | ⭐⭐ | ~2 weeks |

---

## Связанные документы

- [display-banner-platforms.md](./display-banner-platforms.md) — CPM/display **buy-side**
- [new-names-round2.md](./new-names-round2.md) — Kadam MCP (adv side)
- [master-scores.md](./master-scores.md) — общая scoring table
- [oss-github-catalog.md](./oss-github-catalog.md) — GitHub repos
