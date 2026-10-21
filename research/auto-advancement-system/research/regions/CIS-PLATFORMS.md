# CIS / Russia — Advertising Platforms × MCP

> **Date:** October 2026  
> **Markets:** Russia, Belarus, Kazakhstan, Uzbekistan (via Yandex/VK), Telegram  
> **Source:** [cis-platforms-mcp.md](../../../cis-platforms-mcp.md)

**Conclusion:** CIS is one of the world's most mature regions for Ads MCP. Google is far from the only option here.

---

## TL;DR

| Category | Best MCP | Tools | Σ |
|----------|----------|-------|---|
| **Hosted all-in-one RU** | [LidFly](https://lidfly.ru/mcp/v3) | 166 Direct + 76 VK + Avito | **53** |
| **Yandex Direct** | [SvechaPVL/yandex-mcp](https://github.com/SvechaPVL/yandex-mcp) | 132 | **57** |
| **Yandex Direct hosted RO** | [mcp.askads.ru](https://mcp.askads.ru/mcp) | 44 | **39** |
| **VK Ads / myTarget** | [lexamarketolog/vk-ads-mcp](https://github.com/lexamarketolog/vk-ads-mcp) | 55 | **49** |
| **Telegram Ads** | [Free-cat/telegram_ads_mcp](https://github.com/Free-cat/telegram_ads_mcp) | 10+ | **52** |
| **Agency proxy** | [Click.ru MCP](https://help.click.ru/7886) | VK+TG+Direct | **46** |
| **Ozon Performance** | [ozon-mcp-server](https://github.com/DeviceIngineering/ozon-mcp-server) | 22 ads | **43** |
| **Avito Ads** | [mcp-avito-ads](https://github.com/A1-x-Tech/mcp-avito-ads) | many | **41** |

**myTarget** merged into **VK Ads** (`ads.vk.com`, API v2). No separate myTarget MCP — all community servers use VK Ads API.

---

## Ecosystem Map

```
                    CIS / RU MCP LANDSCAPE (Oct 2026)
    ┌─────────────────────────────────────────────────────────────┐
    │  HOSTED AGGREGATORS (RU-native)                              │
    │  LidFly v3 ── Direct(166) + VK(76) + Avito Ads + Metrika    │
    │  Ask Ads ── mcp.askads.ru (Direct RO, OAuth)                │
    │  Click.ru ── agency proxy: VK + Telegram + Direct           │
    └───────────────────────────┬─────────────────────────────────┘
                                │
    ┌───────────────────────────┼─────────────────────────────────┐
    │  YANDEX STACK             │  VK / myTarget                    │
    │  SvechaPVL 132 tools      │  lexamarketolog 55 tools        │
    │  Yurich-ru 152 tools      │  askads 18 tools                  │
    │  LidFly 166 tools         │  Click.ru / ai-hub-open           │
    │  + Metrika + Wordstat     │                                   │
    └───────────────────────────┼─────────────────────────────────┘
                                │
    ┌───────────────────────────┼─────────────────────────────────┐
    │  TELEGRAM ADS             │  MARKETPLACES + CLASSIFIEDS       │
    │  Free-cat (Playwright+TON)│  Ozon Performance (22 ad tools)   │
    │  Click.ru proxy           │  WB ads stats (RO)                │
    │                           │  Avito Ads (LidFly + OSS)         │
    └───────────────────────────┴─────────────────────────────────┘
```

---

## Hosted Aggregators

| # | Service | Endpoint | Platforms | Tools | Write | OSS | Σ |
|---|---------|----------|-----------|-------|-------|-----|---|
| 1 | **[LidFly](https://lidfly.ru)** | `https://lidfly.ru/mcp/v3` | Direct, VK, Avito Ads, Metrika, Wordstat | 166+76+ | ✅ gated | No | **53** |
| 2 | **[Ask Ads](https://mcp.askads.ru/)** | `https://mcp.askads.ru/mcp` | Yandex Direct (+ Metrika) | 44 | ❌ RO | Partial | **39** |
| 3 | **[Click.ru MCP](https://help.click.ru/7886)** | `/c/<token>` or `/o/<id>/<secret>` | VK, Telegram, Direct | many | ✅ | No | **46** |

---

## Yandex Direct — Community MCPs

| Repo | Tools | Write | Σ |
|------|-------|-------|---|
| [SvechaPVL/yandex-mcp](https://github.com/SvechaPVL/yandex-mcp) | 132 | ✅ | **57** |
| [Yurich-ru/yandex-ads-mcp](https://github.com/Yurich-ru/yandex-ads-mcp) | 152 | ✅ | **57** |
| [gmen1057/yandex-direct-mcp](https://github.com/gmen1057/yandex-direct-mcp) | ~80 | ✅ | **55** |
| [askads/mcp-yandex-direct](https://github.com/askads/mcp-yandex-direct) | 44 | ✅ local / RO hosted | **50** |
| [LidFly Direct](https://lidfly.ru/docs/yandex-direct) | 166 | ✅ gated | **53** |
| [axisrow/yandex-direct-mcp-plugin](https://github.com/axisrow/yandex-direct-mcp-plugin) | 149 | ✅ | **55** |

---

## VK Ads / myTarget

| Repo | Tools | Write | Notes |
|------|-------|-------|-------|
| [lexamarketolog/vk-ads-mcp](https://github.com/lexamarketolog/vk-ads-mcp) | **55** | ✅ | Deepest OSS: remarketing, feeds, agency |
| [askads/mcp-vk-ads](https://github.com/askads/mcp-vk-ads) | 18 | ✅ | npm `mcp-vk-ads` |
| [LidFly VK](https://lidfly.ru/docs/vk-ads) | **76** | ✅ gated | Hosted |
| [Click.ru / ai-hub-open](https://www.npmjs.com/package/@ai-hub-open/vk-ads-mcp) | many | ✅ | Agency proxy, no VK API approval |

**VK Ads UI → API mapping:**

| UI (ads.vk.com) | API term | MCP tools |
|-----------------|----------|-----------|
| Campaign | `ad_plan` | `list_ad_plans`, `create_ad_plan` |
| Ad group | `ad_group` / `campaign` | `list_ad_groups`, `create_campaign` |
| Ad | `banner` | `list_banners`, `create_banner` |

---

## Telegram Ads

| Repo | Method | Auth | Σ |
|------|--------|------|---|
| [Free-cat/telegram_ads_mcp](https://github.com/Free-cat/telegram_ads_mcp) | Playwright | Session + TON | **52** |
| [sh0tn1k/telegram-ads](https://github.com/sh0tn1k/telegram-ads) | Playwright | Browser | **45** |
| [Click.ru Telegram](https://help.click.ru/7886) | Agency proxy | Click.ru token | **46** |

**Unique:** TON crypto payment (C=12) — best partial crypto in the matrix. No official Telegram Ads API; all solutions use browser automation.

**Tools (Free-cat):** list_accounts, list_ads, create_ad, update_ad_cpm, set_status, increase_budget — all writes require `confirm=True`.

---

## Marketplaces & Classifieds

| Platform | MCP | Ads tools | Write | Σ |
|----------|-----|-----------|-------|---|
| **Ozon Performance** | [ozon-mcp-server](https://github.com/DeviceIngineering/ozon-mcp-server) | 22 (CPC) | ✅ | **43** |
| **Wildberries** | [wildberries-api-mcp-server](https://github.com/dmitriipolushin/wildberries-api-mcp-server) | stats RO | ❌ | **28** |
| **Avito Ads** | [mcp-avito-ads](https://github.com/A1-x-Tech/mcp-avito-ads) | campaigns, stats | ⚠️ partial | **41** |
| **Avito Ads** | [LidFly avito_ads](https://lidfly.ru/docs/avito-ads) | via v3 | budget/bid write | **45** |

---

## Deep Dive: Top 5

### 1. LidFly — RU-native hosted champion

| Field | Value |
|-------|-------|
| URL | https://lidfly.ru |
| MCP v3 | `https://lidfly.ru/mcp/v3` — single unified endpoint |
| Auth | OAuth email + Yandex OAuth + VK OAuth |
| Platforms | Direct (166), VK (76), Avito Ads, Metrika, Wordstat, Sites |
| Safety | `call_write_tool` with MCP client confirmation; skills system |
| Score | A=0 · B=30 · C=5 · D=18 → **53** |

### 2. Ask Ads — zero-setup Direct RO + OSS stack

| Field | Value |
|-------|-------|
| Hosted RO | `https://mcp.askads.ru/mcp` — OAuth Yandex, free, read-only |
| Local write | `npx mcp-yandex-direct` — 44 tools, full CRUD |
| Also | VK, Metrika, Wordstat npm packages; Claude plugin marketplace |
| Score | Hosted **39** · Local Direct **50** |

### 3. lexamarketolog/vk-ads-mcp — deepest VK OSS

| Field | Value |
|-------|-------|
| Tools | **55** (v0.4-dev), 56 tests, verified live |
| Coverage | campaigns, banners, statistics, remarketing, lookalikes, product feeds, agency clients |
| Install | `uvx --from vk-ads-mcp vk-ads-mcp` |
| Score | A=0 · B=28 · C=5 · D=16 → **49** |

### 4. Click.ru MCP — agency gateway

| Field | Value |
|-------|-------|
| URL patterns | `/c/<click.ru_token>`, `/o/<client_id>/<secret>` |
| Platforms | VK Ads, Telegram Ads, Yandex Direct |
| Value | No VK API approval needed — Click.ru holds agency tokens |
| Score | **46** |

### 5. Telegram Ads — unique TON channel

| Field | Value |
|-------|-------|
| Method | Playwright → ads.telegram.org |
| Payment | TON wallet — **C=12** |
| Score | A=5 · B=22 · C=12 · D=13 → **52** |

---

## Kazakhstan / Belarus / Uzbekistan

CIS countries **have no separate ad MCPs** — same Yandex/VK APIs apply:

| Country | Ad platforms | MCP path |
|---------|-------------|----------|
| **KZ** | Yandex Direct, VK Ads, Google | Existing Yandex/VK MCP |
| **BY** | Yandex Direct, VK Ads, Telegram | Same stack |
| **UZ** | Yandex Direct, Meta | Yandex MCP; Meta official |
| **KZ local** | Kaspi.kz | ❌ No ads API/MCP |

---

## CIS vs Global vs Asia

| Metric | CIS/RU | Global (US/EU) | Asia |
|--------|--------|----------------|------|
| Official platform MCP | ❌ (no official Yandex/VK) | ✅ Google, Meta, TikTok, Amazon | ✅ Tencent official |
| Community MCP depth | ⭐⭐⭐⭐⭐ deepest | ⭐⭐⭐⭐ | ⭐⭐⭐ |
| Hosted RU-native aggregator | ✅ LidFly, Ask Ads, Click.ru | getmcpads, PaidSync | — |
| Unique channels | Telegram TON, Avito | — | Ocean Engine |
| Marketplace ads MCP | Ozon, WB, Avito | Amazon | Shopee, Flipkart |

**CIS is the only region with 3+ hosted native aggregators** besides global players.

---

## Scenario Recommendations

| Scenario | Recommendation |
|----------|----------------|
| Direct + VK, fast setup | **LidFly** `lidfly.ru/mcp/v3` |
| Free Direct audit in ChatGPT | **Ask Ads** `mcp.askads.ru/mcp` |
| Self-host, full Direct control | **SvechaPVL** (132) or **Yurich-ru** (152) |
| Maximum VK OSS tools | **lexamarketolog** (55) or **LidFly** (76 hosted) |
| Agency, many client cabinets | **Click.ru MCP** |
| Telegram Ads + TON | **Free-cat/telegram_ads_mcp** |
| Ozon/WB marketplace ads | **ozon-mcp-server** + **wildberries-api-mcp-server** |

---

## Greenfield (no MCP yet)

| Platform | Priority | Notes |
|----------|----------|-------|
| **eLama** | ⭐⭐⭐ | Multi-platform ad manager API |
| **Kaspi.kz Ads** | ⭐⭐ | KZ super-app |
| **VK Ads official MCP** | ⭐⭐⭐ | Only community today |
| **Yandex Business** | ⭐⭐ | Maps/local ads |

*Source: [adsMCP/cis-platforms-mcp.md](../../../cis-platforms-mcp.md)*
